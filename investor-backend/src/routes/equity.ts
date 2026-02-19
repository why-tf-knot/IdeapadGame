import express, { Response } from 'express';
import { Types } from 'mongoose';
import { AiCreditAllocation } from '../models/AiCreditAllocation';
import { AiCreditTransaction } from '../models/AiCreditTransaction';
import { TOKEN_TYPES } from '../models/AiCreditWallet';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = express.Router();

router.get('/idea/:ideaId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const ideaId = req.params.ideaId as string;
    if (!Types.ObjectId.isValid(ideaId)) {
      return res.status(400).json({ error: 'Invalid idea ID format' });
    }

    const allocations = await AiCreditAllocation.find({ ideaId }).populate('investorId', 'name email');

    const totalInvested = allocations.reduce((sum, a) => sum + a.amount, 0);

    const spentTx = await AiCreditTransaction.find({ ideaId, type: 'SPEND_ON_AI_SERVICE' });
    const totalSpent = spentTx.reduce((sum, tx) => sum + tx.amount, 0);

    const tokenBreakdown: Record<string, { invested: number; spent: number }> = {};
    for (const tt of TOKEN_TYPES) {
      const invested = allocations.filter(a => a.tokenType === tt).reduce((s, a) => s + a.amount, 0);
      const spent = spentTx.filter(tx => tx.tokenType === tt).reduce((s, tx) => s + tx.amount, 0);
      tokenBreakdown[tt] = { invested, spent };
    }

    const creditsPerEquity = parseInt(process.env.CREDITS_PER_EQUITY_PERCENT || '10000');

    const investorMap = new Map<string, { name: string; allocations: { tokenType: string; amount: number }[]; total: number }>();
    for (const alloc of allocations) {
      const doc = alloc.investorId as any;
      const key = doc._id.toString();
      if (!investorMap.has(key)) {
        investorMap.set(key, { name: doc.name, allocations: [], total: 0 });
      }
      const entry = investorMap.get(key)!;
      entry.allocations.push({ tokenType: alloc.tokenType, amount: alloc.amount });
      entry.total += alloc.amount;
    }

    const equityMappings = Array.from(investorMap.entries()).map(([investorId, data]) => {
      const share = totalInvested > 0 ? data.total / totalInvested : 0;
      const totalEquity = (totalSpent / creditsPerEquity) * 1.0;
      return {
        investorId,
        investorName: data.name,
        creditsAllocated: data.total,
        tokenAllocations: data.allocations,
        estimatedEquityPercent: share * totalEquity,
      };
    });

    res.json({
      ideaId,
      totalCreditsInvested: totalInvested,
      totalCreditsSpent: totalSpent,
      totalEquityPercent: (totalSpent / creditsPerEquity) * 1.0,
      tokenBreakdown,
      investorEquity: equityMappings,
    });
  } catch (error) {
    console.error('Get equity error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
