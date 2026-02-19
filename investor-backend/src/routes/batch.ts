import express, { Response } from 'express';
import { Types } from 'mongoose';
import { Idea } from '../models/Idea';
import { IdeaAiBalance } from '../models/IdeaAiBalance';
import { AiCreditAllocation } from '../models/AiCreditAllocation';
import { authMiddleware, investorOnly, AuthRequest } from '../middleware/auth';

const router = express.Router();

router.post(
  '/batch-enrich',
  authMiddleware,
  investorOnly,
  async (req: AuthRequest, res: Response) => {
    try {
      const { ideaIds } = req.body;

      if (!ideaIds || !Array.isArray(ideaIds) || ideaIds.length === 0) {
        return res.status(400).json({ error: 'ideaIds array is required' });
      }

      const validIds = ideaIds.filter(id => Types.ObjectId.isValid(id));
      if (validIds.length === 0) {
        return res.status(400).json({ error: 'No valid idea IDs provided' });
      }

      const ideas = await Idea.find({ _id: { $in: validIds } }).lean();
      if (ideas.length === 0) return res.json({ ideas: [] });

      const ideaIdObjects = ideas.map(i => i._id);

      const creditBalances = await IdeaAiBalance.find({ ideaId: { $in: ideaIdObjects } }).lean();
      const allocations = await AiCreditAllocation.find({ ideaId: { $in: ideaIdObjects } }).populate('investorId', 'name email').lean();
      const myAllocations = await AiCreditAllocation.find({ ideaId: { $in: ideaIdObjects }, investorId: req.userId }).lean();

      const creditBalanceMap = new Map(
        creditBalances.map(cb => [cb.ideaId.toString(), {
          total: cb.balance,
          gemini: cb.geminiBalance || 0,
          anthropic: cb.anthropicBalance || 0,
          perplexity: cb.perplexityBalance || 0,
          chatgpt: cb.chatgptBalance || 0,
        }])
      );

      const allocationsByIdea = new Map<string, any[]>();
      allocations.forEach(alloc => {
        const key = alloc.ideaId.toString();
        if (!allocationsByIdea.has(key)) allocationsByIdea.set(key, []);
        allocationsByIdea.get(key)!.push(alloc);
      });

      const myAllocMap = new Map(myAllocations.map(a => [a.ideaId.toString(), a.amount]));
      const CREDITS_PER_EQUITY = parseFloat(process.env.CREDITS_PER_EQUITY_PERCENT || '10000');

      const enrichedIdeas = ideas.map(idea => {
        const idStr = idea._id.toString();
        const bal = creditBalanceMap.get(idStr) || { total: 0, gemini: 0, anthropic: 0, perplexity: 0, chatgpt: 0 };
        const ideaAllocs = allocationsByIdea.get(idStr) || [];
        const myCredits = myAllocMap.get(idStr) || 0;
        const totalAllocated = ideaAllocs.reduce((s: number, a: any) => s + a.amount, 0);

        let myEquityPercent = 0;
        if (totalAllocated > 0 && myCredits > 0) {
          const totalEquityPool = totalAllocated / CREDITS_PER_EQUITY;
          myEquityPercent = (myCredits / totalAllocated) * totalEquityPool;
        }

        return {
          ...idea,
          myCredits,
          totalCredits: bal.total,
          tokenBalances: { gemini: bal.gemini, anthropic: bal.anthropic, perplexity: bal.perplexity, chatgpt: bal.chatgpt },
          equityPercent: myEquityPercent,
          totalAllocated,
        };
      });

      res.json({ ideas: enrichedIdeas });
    } catch (error) {
      console.error('Batch enrich error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
