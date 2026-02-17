import express, { Response } from 'express';
import { Types } from 'mongoose';
import { Idea } from '../models/Idea';
import { IdeaAiBalance } from '../models/IdeaAiBalance';
import { AiCreditAllocation } from '../models/AiCreditAllocation';
import { authMiddleware, roleMiddleware, AuthRequest } from '../middleware/auth';

const router = express.Router();

/**
 * Batch enrich ideas with credit and equity information
 * Solves N+1 query problem by aggregating data in single database queries
 * 
 * POST /api/ideas/batch-enrich
 * Body: { ideaIds: string[] }
 * Returns: { ideas: EnrichedIdea[] }
 */
router.post(
  '/batch-enrich',
  authMiddleware,
  roleMiddleware(['INVESTOR']),
  async (req: AuthRequest, res: Response) => {
    try {
      const { ideaIds } = req.body;

      if (!ideaIds || !Array.isArray(ideaIds) || ideaIds.length === 0) {
        return res.status(400).json({ error: 'ideaIds array is required' });
      }

      // Validate all IDs
      const validIds = ideaIds.filter(id => Types.ObjectId.isValid(id));
      if (validIds.length === 0) {
        return res.status(400).json({ error: 'No valid idea IDs provided' });
      }

      // Fetch all ideas in one query
      const ideas = await Idea.find({
        _id: { $in: validIds }
      }).lean();

      if (ideas.length === 0) {
        return res.json({ ideas: [] });
      }

      const ideaIdObjects = ideas.map(idea => idea._id);

      // Fetch all credit balances in one query
      const creditBalances = await IdeaAiBalance.find({
        ideaId: { $in: ideaIdObjects }
      }).lean();

      // Fetch all allocations for these ideas in one query
      const allocations = await AiCreditAllocation.find({
        ideaId: { $in: ideaIdObjects }
      }).populate('investorId', 'name email').lean();

      // Fetch all allocations for current investor in one query
      const myAllocations = await AiCreditAllocation.find({
        ideaId: { $in: ideaIdObjects },
        investorId: req.userId
      }).lean();

      // Build lookup maps for efficient access
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
        const ideaIdStr = alloc.ideaId.toString();
        if (!allocationsByIdea.has(ideaIdStr)) {
          allocationsByIdea.set(ideaIdStr, []);
        }
        allocationsByIdea.get(ideaIdStr)!.push(alloc);
      });

      const myAllocationMap = new Map(
        myAllocations.map(alloc => [alloc.ideaId.toString(), alloc.amount])
      );

      // Calculate total credits consumed per idea
      const CREDITS_PER_EQUITY_PERCENT = parseFloat(process.env.CREDITS_PER_EQUITY_PERCENT || '10000');

      // Enrich ideas with credit and equity data
      const enrichedIdeas = ideas.map(idea => {
        const ideaIdStr = idea._id.toString();
        const balanceInfo = creditBalanceMap.get(ideaIdStr) || { total: 0, gemini: 0, anthropic: 0, perplexity: 0, chatgpt: 0 };
        const ideaAllocations = allocationsByIdea.get(ideaIdStr) || [];
        const myCredits = myAllocationMap.get(ideaIdStr) || 0;

        // Calculate total allocated credits
        const totalAllocated = ideaAllocations.reduce((sum, alloc) => sum + alloc.amount, 0);

        // Calculate equity percentage for this investor
        let myEquityPercent = 0;
        if (totalAllocated > 0 && myCredits > 0) {
          const totalEquityPool = totalAllocated / CREDITS_PER_EQUITY_PERCENT;
          myEquityPercent = (myCredits / totalAllocated) * totalEquityPool;
        }

        return {
          ...idea,
          myCredits,
          totalCredits: balanceInfo.total,
          tokenBalances: {
            gemini: balanceInfo.gemini,
            anthropic: balanceInfo.anthropic,
            perplexity: balanceInfo.perplexity,
            chatgpt: balanceInfo.chatgpt,
          },
          equityPercent: myEquityPercent,
          totalAllocated,
          allocations: ideaAllocations.map(alloc => ({
            investorId: alloc.investorId._id,
            investorName: alloc.investorId.name,
            tokenType: alloc.tokenType,
            amount: alloc.amount
          }))
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
