/**
 * Founder Credits Routes
 *
 * Founders spend AI tokens that investors have allocated to their ideas.
 * Spending goes through the shared credit-transfer service for auditability.
 */

import express, { Response } from 'express';
import { Types } from 'mongoose';
import axios from 'axios';
import { Idea } from '../models/Idea';
import { IdeaAiBalance, TOKEN_TYPES, TokenType, ideaTokenField } from '../models/IdeaAiBalance';
import { authMiddleware, founderOnly, AuthRequest } from '../middleware/auth';
import { runAiTool } from '../services/aiService';
import aiCacheService from '../services/cacheService';

const SHARED_URL = process.env.SHARED_SERVICES_URL || 'http://localhost:3000';
const SERVICE_SECRET = process.env.SERVICE_SECRET || 'inter-service-shared-secret-key';

const router = express.Router();

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
        balances: {
          gemini: ideaBalance?.geminiBalance || 0,
          anthropic: ideaBalance?.anthropicBalance || 0,
          perplexity: ideaBalance?.perplexityBalance || 0,
          chatgpt: ideaBalance?.chatgptBalance || 0,
        },
        balance: ideaBalance?.balance || 0,
      });
    } catch (error) {
      console.error('Get idea credits error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

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
          newBalances: {
            gemini: ideaBalance.geminiBalance,
            anthropic: ideaBalance.anthropicBalance,
            perplexity: ideaBalance.perplexityBalance,
            chatgpt: ideaBalance.chatgptBalance,
          },
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
        newBalances: {
          gemini: ideaBalance.geminiBalance,
          anthropic: ideaBalance.anthropicBalance,
          perplexity: ideaBalance.perplexityBalance,
          chatgpt: ideaBalance.chatgptBalance,
        },
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
