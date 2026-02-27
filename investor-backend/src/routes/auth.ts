import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { AiCreditWallet, TOKEN_TYPES, tokenBalanceField } from '../models/AiCreditWallet';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Register (Investors only on this service)
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      passwordHash,
      role: 'INVESTOR',
    });
    await user.save();

    // Create wallet with zero balances
    const wallet = new AiCreditWallet({
      userId: user._id,
      pranaBalance: 0,
      totalBalance: 0,
      geminiBalance: 0,
      anthropicBalance: 0,
      perplexityBalance: 0,
      chatgptBalance: 0,
      mistralBalance: 0,
      deepseekBalance: 0,
      grokBalance: 0,
      llamaBalance: 0,
    });
    await wallet.save();

    const token = jwt.sign(
      { userId: user._id, role: 'INVESTOR' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: 'INVESTOR',
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login (Investors only)
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email, role: 'INVESTOR' });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, role: 'INVESTOR' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: 'INVESTOR',
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user + wallet
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId).select('-passwordHash');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const wallet = await AiCreditWallet.findOne({ userId: user._id });
    const walletBalance = wallet
      ? TOKEN_TYPES.reduce((s, tt) => s + ((wallet as any)[`${tt.toLowerCase()}Balance`] || 0), 0)
      : 0;

    const walletBalances: Record<string, number> | null = wallet
      ? TOKEN_TYPES.reduce((acc, tt) => {
          acc[tt.toLowerCase()] = (wallet as any)[`${tt.toLowerCase()}Balance`] || 0;
          return acc;
        }, {} as Record<string, number>)
      : null;

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      walletBalance,
      walletBalances,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
