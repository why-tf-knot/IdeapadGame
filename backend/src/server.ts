import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import ideaRoutes from './routes/ideas';
import reviewRoutes from './routes/review';
import creditsRoutes from './routes/credits';
import chatRoutes from './routes/chat';
import equityRoutes from './routes/equity';
import batchRoutes from './routes/batch';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/ideas', ideaRoutes);
app.use('/api/review', reviewRoutes);
app.use('/api/credits', creditsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/equity', equityRoutes);
app.use('/api/batch', batchRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'BuildPaper API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      ideas: '/api/ideas',
      review: '/api/review',
      credits: '/api/credits',
      chat: '/api/chat',
      equity: '/api/equity',
      batch: '/api/batch'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Connect to MongoDB and start server
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/buildpaper';

console.log('🚀 Starting BuildPaper server...');
console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔌 MongoDB URI: ${MONGODB_URI.replace(/\/\/.*@/, '//***@')}`); // Hide credentials
console.log(`🌐 Port: ${PORT}`);

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    const server = app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
      console.log('📡 Ready to accept requests!');
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('⚠️  SIGTERM received, shutting down gracefully...');
      server.close(() => {
        console.log('👋 Server closed');
        mongoose.connection.close(false).then(() => {
          console.log('👋 MongoDB connection closed');
          process.exit(0);
        });
      });
    });

    process.on('SIGINT', () => {
      console.log('\n⚠️  SIGINT received, shutting down gracefully...');
      server.close(() => {
        console.log('👋 Server closed');
        mongoose.connection.close(false).then(() => {
          console.log('👋 MongoDB connection closed');
          process.exit(0);
        });
      });
    });
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('💡 Troubleshooting:');
    console.error('   - Is MongoDB running? Try: mongod');
    console.error('   - Check your MONGODB_URI in .env');
    console.error('   - For MongoDB Atlas, verify your connection string and IP whitelist');
    process.exit(1);
  });

export default app;
