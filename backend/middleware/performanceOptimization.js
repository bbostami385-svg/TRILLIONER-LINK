import compression from 'compression';
import helmet from 'helmet';

/**
 * Performance Optimization Middleware
 * Reduces response size and improves security
 */

export const performanceMiddleware = [
  // Enable gzip compression for all responses
  compression({
    level: 6, // Balance between compression ratio and speed
    threshold: 1024, // Only compress responses larger than 1KB
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
  }),

  // Security headers
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }),

  // Cache control headers
  (req, res, next) => {
    // Cache static assets for 1 year
    if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
      res.set('Cache-Control', 'public, max-age=31536000, immutable');
    }
    // Cache API responses for 5 minutes
    else if (req.path.startsWith('/api/')) {
      res.set('Cache-Control', 'public, max-age=300');
    }
    // Don't cache HTML
    else {
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
    next();
  },
];

/**
 * Response optimization middleware
 * Strips unnecessary fields from responses
 */
export const responseOptimization = (req, res, next) => {
  const originalJson = res.json;

  res.json = function (data) {
    // Remove sensitive fields from user objects
    if (data.user) {
      const user = data.user;
      delete user.__v;
      delete user.password;
      delete user.refreshToken;
    }

    // Remove unnecessary fields from arrays
    if (Array.isArray(data.data)) {
      data.data = data.data.map((item) => {
        if (item.__v) delete item.__v;
        if (item.password) delete item.password;
        if (item.refreshToken) delete item.refreshToken;
        return item;
      });
    }

    return originalJson.call(this, data);
  };

  next();
};

/**
 * Request timeout middleware
 * Prevents slow requests from hanging
 */
export const requestTimeout = (timeout = 30000) => {
  return (req, res, next) => {
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          message: 'Request timeout',
        });
      }
    }, timeout);

    res.on('finish', () => clearTimeout(timer));
    res.on('close', () => clearTimeout(timer));

    next();
  };
};

/**
 * Rate limiting middleware
 * Prevents abuse and improves performance
 */
export const rateLimiter = (maxRequests = 100, windowMs = 60000) => {
  const requests = new Map();

  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    if (!requests.has(key)) {
      requests.set(key, []);
    }

    const userRequests = requests.get(key);
    const recentRequests = userRequests.filter((time) => now - time < windowMs);

    if (recentRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
      });
    }

    recentRequests.push(now);
    requests.set(key, recentRequests);

    // Cleanup old entries
    if (requests.size > 10000) {
      const oldestKey = requests.keys().next().value;
      requests.delete(oldestKey);
    }

    next();
  };
};

/**
 * Database query optimization middleware
 * Logs slow queries for monitoring
 */
export const queryOptimization = (req, res, next) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;

    // Log queries taking more than 1 second
    if (duration > 1000) {
      console.warn(`Slow request: ${req.method} ${req.path} - ${duration}ms`);
    }
  });

  next();
};

/**
 * Connection pooling configuration
 * For MongoDB
 */
export const mongooseOptimization = {
  maxPoolSize: 10,
  minPoolSize: 5,
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 5000,
  retryWrites: true,
  w: 'majority',
};

/**
 * Redis caching configuration
 * For session and data caching
 */
export const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  db: 0,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  enableReadyCheck: false,
  enableOfflineQueue: false,
};

/**
 * Cache middleware
 * Caches frequently accessed data
 */
export const cacheMiddleware = (duration = 300) => {
  const cache = new Map();

  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = req.originalUrl || req.url;
    const cachedData = cache.get(key);

    if (cachedData && Date.now() - cachedData.timestamp < duration * 1000) {
      res.set('X-Cache', 'HIT');
      return res.json(cachedData.data);
    }

    const originalJson = res.json;

    res.json = function (data) {
      cache.set(key, {
        data,
        timestamp: Date.now(),
      });

      res.set('X-Cache', 'MISS');
      return originalJson.call(this, data);
    };

    next();
  };
};

export default {
  performanceMiddleware,
  responseOptimization,
  requestTimeout,
  rateLimiter,
  queryOptimization,
  mongooseOptimization,
  redisConfig,
  cacheMiddleware,
};
