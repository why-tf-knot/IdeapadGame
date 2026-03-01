import express, { Response } from 'express';
import { User } from '../models/User';
import { UserAIAccount } from '../models/UserAIAccount';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Transfer tokens to user's linked AI account (simulate or log for now)
router.post('/transfer', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { provider, amount } = req.body;
    if (!provider || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Provider and positive amount required' });
    }
    const user = await User.findById(req.userId).populate('aiAccounts');
    // @ts-ignore
    const aiAccount = user?.aiAccounts?.find((acc) => acc.provider === provider);
    if (!aiAccount) {
      return res.status(404).json({ error: 'No linked AI account for this provider' });
    }
    // Here you would call the provider's API to transfer tokens if supported
    // For now, just log/simulate
    // e.g., await transferTokensToProvider(aiAccount, amount)
    res.json({ message: `Transferred ${amount} tokens to your ${provider} account (simulated)` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to transfer tokens' });
  }
});

export default router;
