import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import http from 'http';
import dotenv from 'dotenv';
import { connectDB } from './config/database.js';
import initializeFirebaseAdmin from './config/firebaseSimple.js';
import { initializeSocket } from './config/socket.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { rateLimit } from './middleware/auth.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Port configuration
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ==================== MIDDLEWARE ====================

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parser middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Logging middleware
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
app.use(
  '/api/',
  rateLimit(
    parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000
  )
);

// ==================== ROUTES ====================

// Root route - API info
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'NovaPlus Social API Server',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      version: '/api/version',
      auth: '/api/auth',
      users: '/api/users',
      posts: '/api/posts',
      messages: '/api/messages',
      notifications: '/api/notifications',
    },
    documentation: 'https://github.com/bbostami385-svg/NovaPlus-Social',
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date(),
    environment: NODE_ENV,
  });
});

// API version
app.get('/api/version', (req, res) => {
  res.json({
    success: true,
    version: '1.0.0',
    name: 'NovaPlus Social API',
    description: 'Production-ready social media platform backend',
  });
});

// Import routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import postRoutes from './routes/postRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import musicRoutes from './routes/musicRoutes.js';
import creatorToolsRoutes from './routes/creatorToolsRoutes.js';
import achievementRoutes from './routes/achievementRoutes.js';
import giftRoutes from './routes/giftRoutes.js';
import sponsorshipRoutes from './routes/sponsorshipRoutes.js';
import communityRoutes from './routes/communityRoutes.js';
import marketplaceRoutes from './routes/marketplaceRoutes.js';
import creatorFundRoutes from './routes/creatorFundRoutes.js';
import privacyRoutes from './routes/privacyRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import storiesRoutes from './routes/storiesRoutes.js';
import reelsRoutes from './routes/reelsRoutes.js';
import liveStreamRoutes from './routes/liveStreamRoutes.js';
import monetizationRoutes from './routes/monetizationRoutes.js';
import creatorAnalyticsRoutes from './routes/creatorAnalyticsRoutes.js';
import productsRoutes from './routes/productsRoutes.js';
import ordersRoutes from './routes/ordersRoutes.js';
import aiRecommendationsRoutes from './routes/aiRecommendationsRoutes.js';
import aiSearchRoutes from './routes/aiSearchRoutes.js';
import achievementsRoutes from './routes/achievementsRoutes.js';
import challengesRoutes from './routes/challengesRoutes.js';
import rewardsRoutes from './routes/rewardsRoutes.js';
import diamondRoutes from './routes/diamondRoutes.js';
import rewardShopRoutes from './routes/rewardShopRoutes.js';
import profileEvolutionRoutes from './routes/profileEvolutionRoutes.js';
import firebaseRoutes from './routes/firebaseRoutes.js';

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/music', musicRoutes);
app.use('/api/creator-tools', creatorToolsRoutes);
app.use('/api/gamification', achievementRoutes);
app.use('/api/gifts', giftRoutes);
app.use('/api/sponsorships', sponsorshipRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/creator-fund', creatorFundRoutes);
app.use('/api/privacy', privacyRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/stories', storiesRoutes);
app.use('/api/reels', reelsRoutes);
app.use('/api/live', liveStreamRoutes);
app.use('/api/monetization', monetizationRoutes);
app.use('/api/analytics', creatorAnalyticsRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/ai', aiRecommendationsRoutes);
app.use('/api/ai', aiSearchRoutes);
app.use('/api/achievements', achievementsRoutes);
app.use('/api/challenges', challengesRoutes);
app.use('/api/rewards', rewardsRoutes);
app.use('/api/diamond', diamondRoutes);
app.use('/api/reward-shop', rewardShopRoutes);
app.use('/api/profile-evolution', profileEvolutionRoutes);
app.use('/api/firebase', firebaseRoutes);
// app.use('/api/videos', videoRoutes);
// app.use('/api/reels', reelRoutes);
// app.use('/api/stories', storyRoutes);
// app.use('/api/groups', groupRoutes);
// app.use('/api/search', searchRoutes);

// ==================== ERROR HANDLING ====================

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// ==================== SERVER INITIALIZATION ====================

const startServer = async () => {
  try {
    // Connect to MongoDB
    console.log('🔄 Connecting to MongoDB...');
    await connectDB();

    // Initialize Firebase
    console.log('🔄 Initializing Firebase...');
    initializeFirebaseAdmin();

    // Initialize Socket.io
    console.log('🔄 Initializing Socket.io...');
    const io = initializeSocket(server);

    // Start server
    server.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   🚀 NovaPlus Social API Server Started Successfully!         ║
║                                                                ║
║   📍 Server URL: http://localhost:${PORT}                      ║
║   🌍 Environment: ${NODE_ENV}                                 ║
║   🔗 CORS Origins: ${process.env.CORS_ORIGIN || 'All'}        ║
║                                                                ║
║   📦 Database: MongoDB                                         ║
║   🔐 Authentication: Firebase + JWT                           ║
║   💾 Storage: ${process.env.STORAGE_PROVIDER || 'R2'}         ║
║   ⚡ Real-time: Socket.io                                     ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
      `);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully...');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('SIGINT received, shutting down gracefully...');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default server;
