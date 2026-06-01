import { verifyFirebaseToken } from '../config/firebaseConfig.js';

/**
 * Middleware to verify Firebase token
 */
export const verifyFirebaseAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No Firebase token provided',
      });
    }

    const decodedToken = await verifyFirebaseToken(token);
    req.firebaseUser = decodedToken;
    req.userId = decodedToken.uid;

    next();
  } catch (error) {
    console.error('Firebase auth error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid Firebase token',
      error: error.message,
    });
  }
};

/**
 * Middleware to optionally verify Firebase token
 */
export const optionalFirebaseAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];

    if (token) {
      const decodedToken = await verifyFirebaseToken(token);
      req.firebaseUser = decodedToken;
      req.userId = decodedToken.uid;
    }

    next();
  } catch (error) {
    console.warn('Optional Firebase auth failed:', error.message);
    // Continue without authentication
    next();
  }
};

/**
 * Middleware to check if user is authenticated
 */
export const isAuthenticated = (req, res, next) => {
  if (!req.firebaseUser && !req.userId) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated',
    });
  }
  next();
};

/**
 * Middleware to check if user is admin
 */
export const isAdmin = async (req, res, next) => {
  try {
    if (!req.firebaseUser) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    // Check if user has admin claim
    if (!req.firebaseUser.admin) {
      return res.status(403).json({
        success: false,
        message: 'User is not an admin',
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error checking admin status',
      error: error.message,
    });
  }
};

export default {
  verifyFirebaseAuth,
  optionalFirebaseAuth,
  isAuthenticated,
  isAdmin,
};
