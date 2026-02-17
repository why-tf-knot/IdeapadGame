import express, { Response } from 'express';
import { Types } from 'mongoose';
import { AiCreditAllocation } from '../models/AiCreditAllocation';
import { AiCreditTransaction } from '../models/AiCreditTransaction';
import { TOKEN_TYPES, TokenType } from '../models/AiCreditWallet';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get equity mapping for an idea
router.get('/idea/:ideaId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const ideaId = req.params.ideaId as string;

    // Validate ObjectId
    if (!Types.ObjectId.isValid(ideaId)) {
      return res.status(400).json({ error: 'Invalid idea ID format' });
    }

    // Get all allocations for this idea
    const allocations = await AiCreditAllocation.find({ ideaId }).populate(
      'investorId',
      'name email'
    );

    // Get total tokens invested in this idea (across all token types)
    const totalInvested = allocations.reduce((sum, alloc) => sum + alloc.amount, 0);

    // Get total tokens spent on this idea
    const spentTransactions = await AiCreditTransaction.find({
      ideaId,
      type: 'SPEND_ON_AI_SERVICE',
    });

    const totalSpent = spentTransactions.reduce((sum, tx) => sum + tx.amount, 0);

    // Build per-token-type breakdown
    const tokenBreakdown: Record<string, { invested: number; spent: number }> = {};
    for (const tt of TOKEN_TYPES) {
      const invested = allocations
        .filter(a => a.tokenType === tt)
        .reduce((s, a) => s + a.amount, 0);
      const spent = spentTransactions
        .filter(tx => tx.tokenType === tt)
        .reduce((s, tx) => s + tx.amount, 0);
      tokenBreakdown[tt] = { invested, spent };
    }

    // Calculate equity percentages
    // Configuration: 10,000 tokens consumed = 1% equity
    const creditsPerEquityPercent = parseInt(
      process.env.CREDITS_PER_EQUITY_PERCENT || '10000'
    );

    // Group allocations by investor
    const investorMap = new Map<string, { name: string; allocations: { tokenType: string; amount: number }[]; total: number }>();
    for (const alloc of allocations) {
      const investorDoc = alloc.investorId as any;
      const key = investorDoc._id.toString();
      if (!investorMap.has(key)) {
        investorMap.set(key, { name: investorDoc.name, allocations: [], total: 0 });
      }
      const entry = investorMap.get(key)!;
      entry.allocations.push({ tokenType: alloc.tokenType, amount: alloc.amount });
      entry.total += alloc.amount;
    }

    const equityMappings = Array.from(investorMap.entries()).map(([investorId, data]) => {
      const investorShare = totalInvested > 0 ? data.total / totalInvested : 0;
      const totalEquityPercent = (totalSpent / creditsPerEquityPercent) * 1.0;
      const investorEquityPercent = investorShare * totalEquityPercent;

      return {
        investorId,
        investorName: data.name,
        creditsAllocated: data.total,
        tokenAllocations: data.allocations,
        estimatedEquityPercent: investorEquityPercent,
      };
    });

    res.json({
      ideaId,
      totalCreditsInvested: totalInvested,
      totalCreditsSpent: totalSpent,
      totalEquityPercent: (totalSpent / creditsPerEquityPercent) * 1.0,
      tokenBreakdown,
      investorEquity: equityMappings,
    });
  } catch (error) {
    console.error('Get equity error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
