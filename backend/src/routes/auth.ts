import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { AiCreditWallet } from '../models/AiCreditWallet';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import analyticsService from '../services/analyticsService';

const router = express.Router();

// Register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate input
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (!['FOUNDER', 'INVESTOR'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      name,
      email,
      passwordHash,
      role,
    });

    await user.save();

    // Create wallet for investor with all token balances
    if (role === 'INVESTOR') {
      const wallet = new AiCreditWallet({
        userId: user._id,
        totalBalance: 0,
        geminiBalance: 0,
        anthropicBalance: 0,
        perplexityBalance: 0,
        chatgptBalance: 0,
      });
      await wallet.save();
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );

    // Track registration event
    analyticsService.trackUserRegistered(user._id.toString(), user.role as 'FOUNDER' | 'INVESTOR');

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    analyticsService.trackError(error as Error, { route: '/auth/register' });
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );

    // Track login event
    analyticsService.trackUserLogin(user._id.toString(), user.role as 'FOUNDER' | 'INVESTOR');

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    analyticsService.trackError(error as Error, { route: '/auth/login' });
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get wallet balances if investor
    let walletBalance = null;
    let walletBalances = null;
    if (user.role === 'INVESTOR') {
      const wallet = await AiCreditWallet.findOne({ userId: user._id });
      walletBalance = wallet
        ? (wallet.geminiBalance + wallet.anthropicBalance + wallet.perplexityBalance + wallet.chatgptBalance)
        : 0;
      walletBalances = wallet
        ? {
            gemini: wallet.geminiBalance,
            anthropic: wallet.anthropicBalance,
            perplexity: wallet.perplexityBalance,
            chatgpt: wallet.chatgptBalance,
          }
        : null;
    }

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
