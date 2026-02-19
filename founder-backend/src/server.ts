import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth';
import ideaRoutes from './routes/ideas';
import creditsRoutes from './routes/credits';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:8081', // Founder mobile app (Metro)
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
app.use('/api/ideas', ideaRoutes);
app.use('/api/credits', creditsRoutes);

// Health
app.get('/health', (_req, res) => {
  res.json({
    service: 'buildpaper-founder-backend',
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
    console.log('[founder-backend] Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`[founder-backend] Running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('[founder-backend] MongoDB connection error:', error);
    process.exit(1);
  });

export default app;
