import express, { Response } from 'express';
import { Types } from 'mongoose';
import { AiCreditAllocation } from '../models/AiCreditAllocation';
import { AiCreditTransaction } from '../models/AiCreditTransaction';
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

    // Get total credits invested in this idea
    const totalInvested = allocations.reduce((sum, alloc) => sum + alloc.amount, 0);

    // Get total credits spent on this idea
    const spentTransactions = await AiCreditTransaction.find({
      ideaId,
      type: 'SPEND_ON_AI_SERVICE',
    });

    const totalSpent = spentTransactions.reduce((sum, tx) => sum + tx.amount, 0);

    // Calculate equity percentages
    // Configuration: 10,000 credits consumed = 1% equity
    const creditsPerEquityPercent = parseInt(
      process.env.CREDITS_PER_EQUITY_PERCENT || '10000'
    );

      const equityMappings = allocations.map((alloc) => {
      const investorShare = totalInvested > 0 ? alloc.amount / totalInvested : 0;
      const totalEquityPercent = (totalSpent / creditsPerEquityPercent) * 1.0;
      const investorEquityPercent = investorShare * totalEquityPercent;
      const investorDoc = alloc.investorId as any;

      return {
        investorId: investorDoc._id,
        investorName: investorDoc.name,
        creditsAllocated: alloc.amount,
        estimatedEquityPercent: investorEquityPercent,
      };
    });

    res.json({
      ideaId,
      totalCreditsInvested: totalInvested,
      totalCreditsSpent: totalSpent,
      totalEquityPercent: (totalSpent / creditsPerEquityPercent) * 1.0,
      investorEquity: equityMappings,
    });
  } catch (error) {
    console.error('Get equity error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
