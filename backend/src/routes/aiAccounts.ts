import express, { Request, Response } from 'express';
import { User } from '../models/User';
import { UserAIAccount, IUserAIAccount } from '../models/UserAIAccount';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Link a new AI provider account (store API key securely)
router.post('/link', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { provider, apiKey, accountEmail } = req.body;
    if (!provider || !apiKey) {
      return res.status(400).json({ error: 'Provider and apiKey are required' });
    }
    // Create and save the AI account
    const aiAccount = new UserAIAccount({ provider, apiKey, accountEmail });
    await aiAccount.save();
    // Add to user's aiAccounts
    await User.findByIdAndUpdate(req.userId, { $push: { aiAccounts: aiAccount._id } });
    res.json({ message: 'AI account linked', aiAccountId: aiAccount._id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to link AI account' });
  }
});

// List all linked AI accounts for the user
router.get('/accounts', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId).populate('aiAccounts');
    res.json({ aiAccounts: user?.aiAccounts || [] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch AI accounts' });
  }
});

// Remove a linked AI account
router.delete('/account/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await User.findByIdAndUpdate(req.userId, { $pull: { aiAccounts: id } });
    await UserAIAccount.findByIdAndDelete(id);
    res.json({ message: 'AI account unlinked' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to unlink AI account' });
  }
});

export default router;
