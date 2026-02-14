import express, { Response } from 'express';
import { AiCreditWallet } from '../models/AiCreditWallet';
import { IdeaAiBalance } from '../models/IdeaAiBalance';
import { AiCreditAllocation } from '../models/AiCreditAllocation';
import { AiCreditTransaction } from '../models/AiCreditTransaction';
import { Idea } from '../models/Idea';
import { authMiddleware, roleMiddleware, AuthRequest } from '../middleware/auth';
import { runAiTool } from '../services/aiService';
import aiCacheService from '../services/cacheService';

const router = express.Router();

// Get wallet info for current user
router.get(
  '/wallet/me',
  authMiddleware,
  roleMiddleware(['INVESTOR']),
  async (req: AuthRequest, res: Response) => {
    try {
      const wallet = await AiCreditWallet.findOne({ userId: req.userId });
      
      if (!wallet) {
        return res.status(404).json({ error: 'Wallet not found' });
      }

      // Get recent transactions
      const transactions = await AiCreditTransaction.find({
        $or: [{ fromUserId: req.userId }, { toUserId: req.userId }],
      })
        .sort({ createdAt: -1 })
        .limit(10);

      res.json({
        wallet: {
          balance: wallet.totalBalance,
        },
        transactions,
      });
    } catch (error) {
      console.error('Get wallet error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Invest credits in an idea (Investors only)
router.post(
  '/invest',
  authMiddleware,
  roleMiddleware(['INVESTOR']),
  async (req: AuthRequest, res: Response) => {
    try {
      const { ideaId, amount } = req.body;

      if (!ideaId || !amount || amount <= 0) {
        return res.status(400).json({ error: 'Valid ideaId and amount are required' });
      }

      // Check idea exists
      const idea = await Idea.findById(ideaId);
      if (!idea) {
        return res.status(404).json({ error: 'Idea not found' });
      }

      // Get investor wallet
      const wallet = await AiCreditWallet.findOne({ userId: req.userId });
      if (!wallet) {
        return res.status(404).json({ error: 'Wallet not found' });
      }

      // Check sufficient balance
      if (wallet.totalBalance < amount) {
        return res.status(400).json({ error: 'Insufficient credits' });
      }

      // Decrease wallet balance
      wallet.totalBalance -= amount;
      await wallet.save();

      // Increase idea balance
      const ideaBalance = await IdeaAiBalance.findOneAndUpdate(
        { ideaId },
        { $inc: { balance: amount } },
        { upsert: true, new: true }
      );

      // Update or create allocation
      await AiCreditAllocation.findOneAndUpdate(
        { investorId: req.userId, ideaId },
        { $inc: { amount: amount } },
        { upsert: true, new: true }
      );

      // Create transaction record
      const transaction = new AiCreditTransaction({
        fromUserId: req.userId,
        toUserId: idea.founderId,
        ideaId,
        type: 'INVEST_IN_IDEA',
        amount,
        memo: `Investment in ${idea.title}`,
      });
      await transaction.save();

      res.json({
        message: 'Credits invested successfully',
        newBalance: wallet.totalBalance,
        ideaBalance: ideaBalance.balance,
      });
    } catch (error) {
      console.error('Invest credits error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Get AI credits balance for an idea
router.get(
  '/idea/:ideaId',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const { ideaId } = req.params;

      const ideaBalance = await IdeaAiBalance.findOne({ ideaId });
      const allocations = await AiCreditAllocation.find({ ideaId }).populate(
        'investorId',
        'name email'
      );

      res.json({
        balance: ideaBalance?.balance || 0,
        allocations: allocations.map((alloc) => ({
          investor: alloc.investorId,
          amount: alloc.amount,
        })),
      });
    } catch (error) {
      console.error('Get idea credits error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Spend credits on AI service (Founders only)
router.post(
  '/spend',
  authMiddleware,
  roleMiddleware(['FOUNDER']),
  async (req: AuthRequest, res: Response) => {
    try {
      const { ideaId, amount, service } = req.body;

      if (!ideaId || !amount || !service || amount <= 0) {
        return res.status(400).json({ error: 'Valid ideaId, amount, and service are required' });
      }

      // Check idea exists and user owns it
      const idea = await Idea.findById(ideaId);
      if (!idea) {
        return res.status(404).json({ error: 'Idea not found' });
      }

      if (idea.founderId.toString() !== req.userId?.toString()) {
        return res.status(403).json({ error: 'You can only spend credits on your own ideas' });
      }

      // Get idea balance
      const ideaBalance = await IdeaAiBalance.findOne({ ideaId });
      if (!ideaBalance || ideaBalance.balance < amount) {
        return res.status(400).json({ error: 'Insufficient AI credits for this idea' });
      }

      // Check cache first
      const cachedResult = aiCacheService.get(ideaId, service);
      if (cachedResult) {
        console.log(`[AI Cache] Returning cached result for ${service} on idea ${ideaId}`);
        return res.json({
          message: 'Credits spent successfully',
          newBalance: ideaBalance.balance,
          result: cachedResult.text,
          tokensUsed: cachedResult.tokensUsed,
          cached: true,
        });
      }

      // Decrease idea balance
      ideaBalance.balance -= amount;
      await ideaBalance.save();

      // Create transaction record
      const transaction = new AiCreditTransaction({
        fromUserId: req.userId,
        ideaId,
        type: 'SPEND_ON_AI_SERVICE',
        amount,
        memo: `AI service: ${service}`,
      });
      await transaction.save();

      // Call AI service
      const aiServiceResult = await runAiTool(service, idea);

      // Cache the result for 1 hour
      aiCacheService.set(ideaId, service, aiServiceResult);

      res.json({
        message: 'Credits spent successfully',
        newBalance: ideaBalance.balance,
        result: aiServiceResult.text,
        tokensUsed: aiServiceResult.tokensUsed,
        cached: false,
      });
    } catch (error) {
      console.error('Spend credits error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
