import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import compression from 'compression';
import helmet from 'helmet';

// Performance optimization middleware
import {
  performanceMiddleware,
  responseOptimization,
  requestTimeout,
  rateLimiter,
  queryOptimization,
  mongooseOptimization,
  cacheMiddleware,
} from './middleware/performanceOptimization.js';

// Routes
import authRoutes from './routes/authRoutes.js';
import diamondRoutes from './routes/diamondRoutes.js';
import rewardShopRoutes from './routes/rewardShopRoutes.js';
import profileEvolutionRoutes from './routes/profileEvolutionRoutes.js';
import firebaseRoutes from './routes/firebaseRoutes.js';
import mediaRoutes from './routes/mediaRoutes.js';
import passwordResetRoutes from './routes/passwordResetRoutes.js';
import notificationAdvancedRoutes from './routes/notificationAdvancedRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// PERFORMANCE OPTIMIZATIONS
// ============================================

// 1. Enable compression for all responses
app.use(compression({ level: 6 }));

// 2. Security headers
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// 3. CORS with optimizations
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  maxAge: 86400, // 24 hours
}));

// 4. Body parser with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// 5. Request timeout
app.use(requestTimeout(30000));

// 6. Rate limiting
app.use(rateLimiter(100, 60000)); // 100 requests per minute

// 7. Query optimization logging
app.use(queryOptimization);

// 8. Response optimization
app.use(responseOptimization);

// 9. Cache middleware for GET requests
app.use(cacheMiddleware(300)); // 5 minutes cache

// ============================================
// DATABASE CONNECTION
// ============================================

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/novaplus', {
  ...mongooseOptimization,
})
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ============================================
// ROUTES
// ============================================

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date(),
  });
});

// Auth routes
app.use('/api/auth', authRoutes);

// Diamond routes
app.use('/api/diamond', diamondRoutes);

// Reward shop routes
app.use('/api/reward-shop', rewardShopRoutes);

// Profile evolution routes
app.use('/api/profile-evolution', profileEvolutionRoutes);

// Firebase routes
app.use('/api/firebase', firebaseRoutes);

// Media routes
app.use('/api/media', mediaRoutes);

// Password reset routes
app.use('/api/password-reset', passwordResetRoutes);

// Notification routes
app.use('/api/notifications', notificationAdvancedRoutes);

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ============================================
// SERVER STARTUP
// ============================================

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   🚀 NovaPlus Server Started           ║
║   Port: ${PORT}                         ║
║   Environment: ${process.env.NODE_ENV || 'development'}          ║
║   Performance: OPTIMIZED ⚡            ║
╚════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  mongoose.connection.close();
  process.exit(0);
});

export default app;
