import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth';
import reviewRoutes from './routes/review';
import creditsRoutes from './routes/credits';
import equityRoutes from './routes/equity';
import batchRoutes from './routes/batch';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Security
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:8082', // Investor mobile app (Metro)
    'http://localhost:3000', // Shared services
  ],
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

// Rate limiting
const generalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many auth attempts, please try again later' } });
app.use('/api', generalLimiter);

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/review', reviewRoutes);
app.use('/api/credits', creditsRoutes);
app.use('/api/equity', equityRoutes);
app.use('/api/batch', batchRoutes);

// Health
app.get('/health', (_req, res) => {
  res.json({
    service: 'buildpaper-investor-backend',
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Connect & Start
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/buildpaper';

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('[investor-backend] Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`[investor-backend] Running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('[investor-backend] MongoDB connection error:', error);
    process.exit(1);
  });

export default app;
