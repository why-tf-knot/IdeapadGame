/**
 * Founder Credits Routes
 *
 * Founders spend AI tokens that investors have allocated to their ideas.
 * Founders can also exchange Prana (₽) for AI credits on any idea.
 * Spending goes through the shared credit-transfer service for auditability.
 */

import express, { Response } from 'express';
import { Types } from 'mongoose';
import axios from 'axios';
import { Idea } from '../models/Idea';
import { IdeaAiBalance, TOKEN_TYPES, TokenType, ideaTokenField, buildIdeaBalances } from '../models/IdeaAiBalance';
import {
  FounderPranaWallet,
  PRANA_MARKET_RATES,
  FOUNDER_INITIAL_PRANA,
  pranaCostForCredits,
  maxCreditsForPrana,
} from '../models/FounderPranaWallet';
import { authMiddleware, founderOnly, AuthRequest } from '../middleware/auth';
import { runAiTool } from '../services/aiService';
import aiCacheService from '../services/cacheService';

const SHARED_URL = process.env.SHARED_SERVICES_URL || 'http://localhost:3000';
const SERVICE_SECRET = process.env.SERVICE_SECRET || 'inter-service-shared-secret-key';

const router = express.Router();

// ─── Prana Wallet ──────────────────────────────────────

/** Get or lazily create the founder's Prana wallet */
async function getOrCreatePranaWallet(userId: string) {
  let wallet = await FounderPranaWallet.findOne({ userId });
  if (!wallet) {
    wallet = await FounderPranaWallet.create({
      userId,
      pranaBalance: FOUNDER_INITIAL_PRANA,
    });
  }
  return wallet;
}

/** GET /credits/prana/balance — current Prana balance + exchange rates */
router.get(
  '/prana/balance',
  authMiddleware,
  founderOnly,
  async (req: AuthRequest, res: Response) => {
    try {
      const wallet = await getOrCreatePranaWallet(req.userId!.toString());
      res.json({
        pranaBalance: wallet.pranaBalance,
        totalExchanged: wallet.totalExchanged,
        rates: PRANA_MARKET_RATES,
        affordability: Object.fromEntries(
          TOKEN_TYPES.map(tt => [tt, maxCreditsForPrana(wallet.pranaBalance, tt)])
        ),
      });
    } catch (error) {
      console.error('Get Prana balance error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/** GET /credits/prana/rates — live Prana ↔ AI credit exchange rates */
router.get('/prana/rates', (_req, res: Response) => {
  res.json({ rates: PRANA_MARKET_RATES });
});

/**
 * POST /credits/prana/exchange
 * Convert Prana → AI credits and deposit into an idea's balance.
 * Body: { ideaId, tokenType, credits }
 */
router.post(
  '/prana/exchange',
  authMiddleware,
  founderOnly,
  async (req: AuthRequest, res: Response) => {
    try {
      const { ideaId, tokenType, credits } = req.body;

      // Validation
      if (!ideaId || !tokenType || !credits || credits <= 0) {
        return res.status(400).json({ error: 'ideaId, tokenType, and positive credits are required' });
      }
      if (!Types.ObjectId.isValid(ideaId)) {
        return res.status(400).json({ error: 'Invalid idea ID format' });
      }
      if (!TOKEN_TYPES.includes(tokenType)) {
        return res.status(400).json({ error: `Invalid tokenType. Must be one of: ${TOKEN_TYPES.join(', ')}` });
      }
      if (!Number.isInteger(credits) || credits > 50000) {
        return res.status(400).json({ error: 'Credits must be an integer ≤ 50,000' });
      }

      // Verify ownership
      const idea = await Idea.findById(ideaId);
      if (!idea) return res.status(404).json({ error: 'Idea not found' });
      if (idea.founderId.toString() !== req.userId?.toString()) {
        return res.status(403).json({ error: 'You can only exchange tokens for your own ideas' });
      }

      // Calculate Prana cost
      const pranaCost = pranaCostForCredits(credits, tokenType as TokenType);

      // Check Prana balance
      const wallet = await getOrCreatePranaWallet(req.userId!.toString());
      if (wallet.pranaBalance < pranaCost) {
        return res.status(400).json({
          error: 'Insufficient Prana balance',
          required: pranaCost,
          available: wallet.pranaBalance,
          rate: PRANA_MARKET_RATES[tokenType as TokenType],
        });
      }

      // Deduct Prana
      wallet.pranaBalance = Math.round((wallet.pranaBalance - pranaCost) * 100) / 100;
      wallet.totalExchanged = Math.round((wallet.totalExchanged + pranaCost) * 100) / 100;
      await wallet.save();

      // Add credits to idea balance
      const balField = ideaTokenField(tokenType as TokenType);
      let ideaBalance = await IdeaAiBalance.findOne({ ideaId });
      if (!ideaBalance) {
        ideaBalance = await IdeaAiBalance.create({ ideaId });
      }
      (ideaBalance as any)[balField] = ((ideaBalance as any)[balField] || 0) + credits;
      ideaBalance.balance = (ideaBalance.balance || 0) + credits;
      await ideaBalance.save();

      // Record in shared transfer ledger (non-blocking)
      try {
        await axios.post(`${SHARED_URL}/api/transfers/initiate`, {
          type: 'PRANA_TO_AI_CREDIT',
          tokenType,
          amount: credits,
          pranaCost,
          fromUserId: req.userId?.toString(),
          ideaId,
          initiatedBy: 'founder-backend',
          memo: `Exchanged ${pranaCost}₽ → ${credits} ${tokenType} credits for "${idea.title}"`,
        }, {
          headers: { 'X-Service-Secret': SERVICE_SECRET },
        });
      } catch (err) {
        console.warn('[founder-backend] Failed to record Prana exchange in shared service:', (err as any).message);
      }

      res.json({
        message: `Exchanged ${pranaCost}₽ for ${credits} ${tokenType} credits`,
        pranaSpent: pranaCost,
        pranaRemaining: wallet.pranaBalance,
        creditsAdded: credits,
        tokenType,
        ideaBalances: buildIdeaBalances(ideaBalance),
      });
    } catch (error) {
      console.error('Prana exchange error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// ─── Idea Token Balances ───────────────────────────────

// Get idea token balances
router.get(
  '/idea/:ideaId',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const { ideaId } = req.params;
      if (!Types.ObjectId.isValid(ideaId as string)) {
        return res.status(400).json({ error: 'Invalid idea ID format' });
      }

      const ideaBalance = await IdeaAiBalance.findOne({ ideaId });

      res.json({
        balances: buildIdeaBalances(ideaBalance),
        balance: ideaBalance?.balance || 0,
      });
    } catch (error) {
      console.error('Get idea credits error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// ─── Spend Tokens on AI Service ────────────────────────

// Spend tokens on AI service
router.post(
  '/spend',
  authMiddleware,
  founderOnly,
  async (req: AuthRequest, res: Response) => {
    try {
      const { ideaId, amount, service, tokenType } = req.body;

      if (!ideaId || !amount || !service || amount <= 0) {
        return res.status(400).json({ error: 'Valid ideaId, amount, and service are required' });
      }
      if (!Types.ObjectId.isValid(ideaId)) {
        return res.status(400).json({ error: 'Invalid idea ID format' });
      }
      if (!Number.isInteger(amount) || amount > 10000) {
        return res.status(400).json({ error: 'Amount must be an integer ≤ 10,000' });
      }
      if (!tokenType || !TOKEN_TYPES.includes(tokenType)) {
        return res.status(400).json({ error: `Invalid tokenType. Must be one of: ${TOKEN_TYPES.join(', ')}` });
      }

      // Verify ownership
      const idea = await Idea.findById(ideaId);
      if (!idea) return res.status(404).json({ error: 'Idea not found' });
      if (idea.founderId.toString() !== req.userId?.toString()) {
        return res.status(403).json({ error: 'You can only spend tokens on your own ideas' });
      }

      // Check balance
      const ideaBalance = await IdeaAiBalance.findOne({ ideaId });
      const balField = ideaTokenField(tokenType as TokenType);
      const currentBalance = ideaBalance ? (ideaBalance as any)[balField] || 0 : 0;

      if (!ideaBalance || currentBalance < amount) {
        return res.status(400).json({ error: `Insufficient ${tokenType} tokens for this idea` });
      }

      // Check cache
      const cached = aiCacheService.get(ideaId, service);
      if (cached) {
        return res.json({
          message: 'Tokens spent successfully (cached)',
          newBalances: buildIdeaBalances(ideaBalance),
          newBalance: currentBalance,
          result: cached.text,
          tokensUsed: cached.tokensUsed,
          tokenType,
          cached: true,
        });
      }

      // Deduct balance locally
      (ideaBalance as any)[balField] = currentBalance - amount;
      ideaBalance.balance = Math.max(0, ideaBalance.balance - amount);
      await ideaBalance.save();

      // Record in shared transfer ledger
      try {
        await axios.post(`${SHARED_URL}/api/transfers/initiate`, {
          type: 'IDEA_TO_AI_SERVICE',
          tokenType,
          amount,
          fromUserId: req.userId?.toString(),
          ideaId,
          initiatedBy: 'founder-backend',
          memo: `${tokenType} tokens: ${service} for "${idea.title}"`,
        }, {
          headers: { 'X-Service-Secret': SERVICE_SECRET },
        });
      } catch (err) {
        console.warn('[founder-backend] Failed to record transfer in shared service (non-blocking):', (err as any).message);
      }

      // Run AI tool
      const aiResult = await runAiTool(service, idea, tokenType as TokenType);
      aiCacheService.set(ideaId, service, aiResult);

      res.json({
        message: `${tokenType} tokens spent successfully`,
        newBalances: buildIdeaBalances(ideaBalance),
        newBalance: (ideaBalance as any)[balField],
        result: aiResult.text,
        tokensUsed: aiResult.tokensUsed,
        tokenType,
        cached: false,
      });
    } catch (error) {
      console.error('Spend credits error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
