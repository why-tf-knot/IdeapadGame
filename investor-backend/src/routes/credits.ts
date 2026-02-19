/**
 * Investor Credits Routes
 *
 * Wallet management, investing tokens into ideas, monthly grant.
 * Investment transactions are recorded in the shared credit-transfer service.
 */

import express, { Response } from 'express';
import { Types } from 'mongoose';
import axios from 'axios';
import { AiCreditWallet, TOKEN_TYPES, TokenType, tokenBalanceField } from '../models/AiCreditWallet';
import { IdeaAiBalance } from '../models/IdeaAiBalance';
import { AiCreditAllocation } from '../models/AiCreditAllocation';
import { AiCreditTransaction } from '../models/AiCreditTransaction';
import { Idea } from '../models/Idea';
import { authMiddleware, investorOnly, AuthRequest } from '../middleware/auth';

const SHARED_URL = process.env.SHARED_SERVICES_URL || 'http://localhost:3000';
const SERVICE_SECRET = process.env.SERVICE_SECRET || 'inter-service-shared-secret-key';

function ideaTokenField(tokenType: TokenType): string {
  const map: Record<TokenType, string> = {
    GEMINI: 'geminiBalance',
    ANTHROPIC: 'anthropicBalance',
    PERPLEXITY: 'perplexityBalance',
    CHATGPT: 'chatgptBalance',
  };
  return map[tokenType];
}

const router = express.Router();

// ─── Get wallet ──────────────────────────────────────────
router.get(
  '/wallet/me',
  authMiddleware,
  investorOnly,
  async (req: AuthRequest, res: Response) => {
    try {
      const wallet = await AiCreditWallet.findOne({ userId: req.userId });
      if (!wallet) return res.status(404).json({ error: 'Wallet not found' });

      const transactions = await AiCreditTransaction.find({
        $or: [{ fromUserId: req.userId }, { toUserId: req.userId }],
      })
        .sort({ createdAt: -1 })
        .limit(20);

      res.json({
        wallet: {
          balances: {
            gemini: wallet.geminiBalance,
            anthropic: wallet.anthropicBalance,
            perplexity: wallet.perplexityBalance,
            chatgpt: wallet.chatgptBalance,
          },
          balance: wallet.geminiBalance + wallet.anthropicBalance +
                   wallet.perplexityBalance + wallet.chatgptBalance,
        },
        transactions,
      });
    } catch (error) {
      console.error('Get wallet error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// ─── Invest tokens in an idea ────────────────────────────
router.post(
  '/invest',
  authMiddleware,
  investorOnly,
  async (req: AuthRequest, res: Response) => {
    try {
      const { ideaId, amount, tokenType } = req.body;

      if (!ideaId || !amount || amount <= 0) {
        return res.status(400).json({ error: 'Valid ideaId and amount are required' });
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

      const idea = await Idea.findById(ideaId);
      if (!idea) return res.status(404).json({ error: 'Idea not found' });

      const wallet = await AiCreditWallet.findOne({ userId: req.userId });
      if (!wallet) return res.status(404).json({ error: 'Wallet not found' });

      const balField = tokenBalanceField(tokenType as TokenType);
      const currentBalance = wallet[balField] as number;
      if (currentBalance < amount) {
        return res.status(400).json({ error: `Insufficient ${tokenType} tokens` });
      }

      // Deduct from investor wallet
      (wallet as any)[balField] = currentBalance - amount;
      await wallet.save();

      // Add to idea balance
      const incField = ideaTokenField(tokenType as TokenType);
      const ideaBalance = await IdeaAiBalance.findOneAndUpdate(
        { ideaId },
        { $inc: { [incField]: amount, balance: amount } },
        { upsert: true, new: true }
      );

      // Update allocation record
      await AiCreditAllocation.findOneAndUpdate(
        { investorId: req.userId, ideaId, tokenType },
        { $inc: { amount } },
        { upsert: true, new: true }
      );

      // Local transaction record
      const tx = new AiCreditTransaction({
        fromUserId: req.userId,
        toUserId: idea.founderId,
        ideaId,
        type: 'INVEST_IN_IDEA',
        tokenType,
        amount,
        memo: `${tokenType} tokens invested in ${idea.title}`,
      });
      await tx.save();

      // Record in shared ledger (non-blocking)
      try {
        await axios.post(`${SHARED_URL}/api/transfers/initiate`, {
          type: 'INVESTOR_TO_IDEA',
          tokenType,
          amount,
          fromUserId: req.userId?.toString(),
          toUserId: idea.founderId.toString(),
          ideaId,
          initiatedBy: 'investor-backend',
          memo: `${tokenType} tokens invested in "${idea.title}"`,
        }, {
          headers: { 'X-Service-Secret': SERVICE_SECRET },
        });
      } catch (err) {
        console.warn('[investor-backend] Shared service transfer record failed (non-blocking):', (err as any).message);
      }

      res.json({
        message: `${tokenType} tokens invested successfully`,
        newBalances: {
          gemini: wallet.geminiBalance,
          anthropic: wallet.anthropicBalance,
          perplexity: wallet.perplexityBalance,
          chatgpt: wallet.chatgptBalance,
        },
        ideaBalances: {
          gemini: ideaBalance.geminiBalance,
          anthropic: ideaBalance.anthropicBalance,
          perplexity: ideaBalance.perplexityBalance,
          chatgpt: ideaBalance.chatgptBalance,
        },
        newBalance: (wallet as any)[balField],
        ideaBalance: (ideaBalance as any)[incField],
      });
    } catch (error) {
      console.error('Invest credits error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// ─── Get idea credit info ────────────────────────────────
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
      const allocations = await AiCreditAllocation.find({ ideaId }).populate('investorId', 'name email');

      res.json({
        balances: {
          gemini: ideaBalance?.geminiBalance || 0,
          anthropic: ideaBalance?.anthropicBalance || 0,
          perplexity: ideaBalance?.perplexityBalance || 0,
          chatgpt: ideaBalance?.chatgptBalance || 0,
        },
        balance: ideaBalance?.balance || 0,
        allocations: allocations.map((a) => ({
          investor: a.investorId,
          tokenType: a.tokenType,
          amount: a.amount,
        })),
      });
    } catch (error) {
      console.error('Get idea credits error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// ─── Monthly grant ───────────────────────────────────────
const MONTHLY_GRANT: Record<TokenType, number> = {
  GEMINI: parseInt(process.env.MONTHLY_GRANT_GEMINI || '250'),
  ANTHROPIC: parseInt(process.env.MONTHLY_GRANT_ANTHROPIC || '250'),
  PERPLEXITY: parseInt(process.env.MONTHLY_GRANT_PERPLEXITY || '250'),
  CHATGPT: parseInt(process.env.MONTHLY_GRANT_CHATGPT || '250'),
};

router.post(
  '/grant',
  authMiddleware,
  investorOnly,
  async (req: AuthRequest, res: Response) => {
    try {
      const wallet = await AiCreditWallet.findOne({ userId: req.userId });
      if (!wallet) return res.status(404).json({ error: 'Wallet not found' });

      // Enforce 30-day cooldown
      if (wallet.lastGrantAt) {
        const daysSinceGrant = (Date.now() - new Date(wallet.lastGrantAt).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceGrant < 30) {
          const nextGrantDate = new Date(new Date(wallet.lastGrantAt).getTime() + 30 * 24 * 60 * 60 * 1000);
          return res.status(429).json({
            error: `Monthly grant already claimed. Next grant available on ${nextGrantDate.toLocaleDateString()}.`,
            nextGrantAt: nextGrantDate.toISOString(),
          });
        }
      }

      for (const tt of TOKEN_TYPES) {
        const field = tokenBalanceField(tt);
        (wallet as any)[field] = ((wallet as any)[field] || 0) + MONTHLY_GRANT[tt];
      }
      const totalGranted = Object.values(MONTHLY_GRANT).reduce((a, b) => a + b, 0);
      wallet.totalBalance += totalGranted;
      wallet.lastGrantAt = new Date();
      await wallet.save();

      for (const tt of TOKEN_TYPES) {
        await new AiCreditTransaction({
          fromUserId: null,
          toUserId: req.userId,
          type: 'GRANT_TO_INVESTOR',
          tokenType: tt,
          amount: MONTHLY_GRANT[tt],
          memo: `Monthly ${tt} token grant`,
        }).save();
      }

      // Record in shared ledger
      try {
        for (const tt of TOKEN_TYPES) {
          await axios.post(`${SHARED_URL}/api/transfers/initiate`, {
            type: 'MONTHLY_GRANT',
            tokenType: tt,
            amount: MONTHLY_GRANT[tt],
            toUserId: req.userId?.toString(),
            initiatedBy: 'investor-backend',
            memo: `Monthly ${tt} token grant`,
          }, {
            headers: { 'X-Service-Secret': SERVICE_SECRET },
          });
        }
      } catch (err) {
        console.warn('[investor-backend] Shared service grant record failed:', (err as any).message);
      }

      res.json({
        message: 'Monthly token grant applied',
        granted: MONTHLY_GRANT,
        newBalances: {
          gemini: wallet.geminiBalance,
          anthropic: wallet.anthropicBalance,
          perplexity: wallet.perplexityBalance,
          chatgpt: wallet.chatgptBalance,
        },
      });
    } catch (error) {
      console.error('Grant tokens error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
