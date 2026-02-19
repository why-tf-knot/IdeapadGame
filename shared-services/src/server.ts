import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import jwt from 'jsonwebtoken';

import messagingRoutes from './routes/messaging';
import transferRoutes from './routes/transfers';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

const ALLOWED_ORIGINS = [
  process.env.FOUNDER_SERVICE_URL || 'http://localhost:3001',
  process.env.INVESTOR_SERVICE_URL || 'http://localhost:3002',
  'http://localhost:8081',
  'http://localhost:8082',
];

// ─── Socket.IO ───────────────────────────────────────────
const io = new SocketServer(server, {
  cors: { origin: ALLOWED_ORIGINS, credentials: true },
});

// Auth middleware for sockets
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Authentication required'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: string; role: string };
    (socket as any).userId = decoded.userId;
    (socket as any).userRole = decoded.role;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  const userId = (socket as any).userId;
  // Join a personal room so we can push messages to specific users
  socket.join(`user:${userId}`);
  console.log(`[ws] User ${userId} connected`);

  // Join a thread room for real-time messages
  socket.on('join_thread', (threadId: string) => {
    socket.join(`thread:${threadId}`);
  });

  socket.on('leave_thread', (threadId: string) => {
    socket.leave(`thread:${threadId}`);
  });

  socket.on('disconnect', () => {
    console.log(`[ws] User ${userId} disconnected`);
  });
});

// Export io so routes can emit events
export { io };

// ─── Security ────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));
app.use(express.json({ limit: '1mb' }));

// Rate limiting
const generalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false });
app.use('/api', generalLimiter);

// ─── Routes ──────────────────────────────────────────────
app.use('/api/messages', messagingRoutes);
app.use('/api/transfers', transferRoutes);

// ─── Health ──────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    service: 'buildpaper-shared-services',
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ─── Connect & Start ─────────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/buildpaper';

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('[shared-services] Connected to MongoDB');
    server.listen(PORT, () => {
      console.log(`[shared-services] Running on port ${PORT}`);
      console.log(`  Messaging API:  http://localhost:${PORT}/api/messages`);
      console.log(`  Transfers API:  http://localhost:${PORT}/api/transfers`);
      console.log(`  WebSocket:      ws://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('[shared-services] MongoDB connection error:', error);
    process.exit(1);
  });

export default app;
