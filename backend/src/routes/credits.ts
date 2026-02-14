import express, { Response } from 'express';
import { AiCreditWallet } from '../models/AiCreditWallet';
import { IdeaAiBalance } from '../models/IdeaAiBalance';
import { AiCreditAllocation } from '../models/AiCreditAllocation';
import { AiCreditTransaction } from '../models/AiCreditTransaction';
import { Idea } from '../models/Idea';
import { authMiddleware, roleMiddleware, AuthRequest } from '../middleware/auth';

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

      // Call AI service (placeholder - would call actual AI API)
      const aiResult = await callAiService(service, idea);

      res.json({
        message: 'Credits spent successfully',
        newBalance: ideaBalance.balance,
        result: aiResult,
      });
    } catch (error) {
      console.error('Spend credits error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Placeholder AI service function
async function callAiService(service: string, idea: any): Promise<string> {
  // This would call actual AI APIs (OpenAI, etc.)
  // For now, return a mock response
  const responses: Record<string, string> = {
    LLM_PITCH_DRAFT: `Enhanced pitch for "${idea.title}":\n\nSlide 1: The Problem\n${idea.problem}\n\nSlide 2: Our Solution\n${idea.solution}\n\nSlide 3: Target Market\n${idea.targetUser}\n\nSlide 4: Business Model\n${idea.monetization}\n\nSlide 5: Competitive Advantage\n${idea.differentiation}\n\nSlide 6: Roadmap\n${idea.roadmap}`,
    LLM_SUMMARY_IMPROVE: `Improved summary: ${idea.title} - ${idea.solution} for ${idea.targetUser}, solving ${idea.problem}`,
    LLM_ROADMAP_GENERATE: `3-Month Roadmap:\n- Month 1: ${idea.stage} validation and user feedback\n- Month 2: Core feature development\n- Month 3: Beta launch and iteration`,
  };

  return responses[service] || 'AI service result placeholder';
}

export default router;
