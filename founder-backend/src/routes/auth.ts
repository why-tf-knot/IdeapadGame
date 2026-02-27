import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { FounderPranaWallet, FOUNDER_INITIAL_PRANA, PRANA_MARKET_RATES } from '../models/FounderPranaWallet';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Register (Founders only on this service)
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
      role: 'FOUNDER', // Always FOUNDER on this service
    });
    await user.save();

    // Create Prana wallet for the new founder
    await FounderPranaWallet.create({
      userId: user._id,
      pranaBalance: FOUNDER_INITIAL_PRANA,
    });

    const token = jwt.sign(
      { userId: user._id, role: 'FOUNDER' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: 'FOUNDER',
        pranaBalance: FOUNDER_INITIAL_PRANA,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login (Founders only)
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email, role: 'FOUNDER' });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, role: 'FOUNDER' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: 'FOUNDER',
      },
    });
  } catch (error) {
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

    // Load or lazily create Prana wallet
    let pranaWallet = await FounderPranaWallet.findOne({ userId: user._id });
    if (!pranaWallet) {
      pranaWallet = await FounderPranaWallet.create({
        userId: user._id,
        pranaBalance: FOUNDER_INITIAL_PRANA,
      });
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        pranaBalance: pranaWallet.pranaBalance,
        totalExchanged: pranaWallet.totalExchanged,
        pranaRates: PRANA_MARKET_RATES,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
