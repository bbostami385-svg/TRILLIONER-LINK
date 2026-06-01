import express from 'express';
import {
  verifyFirebaseToken,
  getFirebaseUser,
  createFirebaseUser,
  deleteFirebaseUser,
  createCustomToken,
  getFirebaseConfig,
} from '../config/firebaseConfig.js';
import { verifyFirebaseAuth } from '../middleware/firebaseMiddleware.js';
import User from '../models/User.js';

const router = express.Router();

/**
 * @route   GET /api/firebase/config
 * @desc    Get Firebase client configuration
 * @access  Public
 */
router.get('/config', (req, res) => {
  try {
    const config = getFirebaseConfig();
    if (!config) {
      return res.status(500).json({
        success: false,
        message: 'Firebase configuration not available',
      });
    }

    res.json({
      success: true,
      config,
    });
  } catch (error) {
    console.error('Error getting Firebase config:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting Firebase configuration',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/firebase/verify-token
 * @desc    Verify Firebase token
 * @access  Public
 */
router.post('/verify-token', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required',
      });
    }

    const decodedToken = await verifyFirebaseToken(token);

    res.json({
      success: true,
      message: 'Token verified successfully',
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        displayName: decodedToken.name,
        photoURL: decodedToken.picture,
      },
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/firebase/user/:uid
 * @desc    Get Firebase user by UID
 * @access  Private
 */
router.get('/user/:uid', verifyFirebaseAuth, async (req, res) => {
  try {
    const { uid } = req.params;

    const firebaseUser = await getFirebaseUser(uid);

    res.json({
      success: true,
      user: {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        emailVerified: firebaseUser.emailVerified,
        disabled: firebaseUser.disabled,
        createdAt: firebaseUser.metadata?.creationTime,
        lastSignInTime: firebaseUser.metadata?.lastSignInTime,
      },
    });
  } catch (error) {
    console.error('Error getting Firebase user:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting user',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/firebase/create-user
 * @desc    Create Firebase user
 * @access  Private (Admin)
 */
router.post('/create-user', verifyFirebaseAuth, async (req, res) => {
  try {
    const { email, password, displayName } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const firebaseUser = await createFirebaseUser(email, password, displayName);

    res.status(201).json({
      success: true,
      message: 'Firebase user created successfully',
      user: {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
      },
    });
  } catch (error) {
    console.error('Error creating Firebase user:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: error.message,
    });
  }
});

/**
 * @route   DELETE /api/firebase/user/:uid
 * @desc    Delete Firebase user
 * @access  Private (Admin)
 */
router.delete('/user/:uid', verifyFirebaseAuth, async (req, res) => {
  try {
    const { uid } = req.params;

    await deleteFirebaseUser(uid);

    res.json({
      success: true,
      message: 'Firebase user deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting Firebase user:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/firebase/custom-token
 * @desc    Create custom Firebase token
 * @access  Private
 */
router.post('/custom-token', verifyFirebaseAuth, async (req, res) => {
  try {
    const { uid, claims } = req.body;

    if (!uid) {
      return res.status(400).json({
        success: false,
        message: 'UID is required',
      });
    }

    const token = await createCustomToken(uid, claims || {});

    res.json({
      success: true,
      message: 'Custom token created successfully',
      token,
    });
  } catch (error) {
    console.error('Error creating custom token:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating custom token',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/firebase/sync-user
 * @desc    Sync Firebase user with MongoDB user
 * @access  Private
 */
router.post('/sync-user', verifyFirebaseAuth, async (req, res) => {
  try {
    const { email, displayName, photoURL } = req.body;
    const firebaseUid = req.firebaseUser.uid;

    // Find or create user in MongoDB
    let user = await User.findOne({ firebaseUid });

    if (!user) {
      user = new User({
        firebaseUid,
        email: email || req.firebaseUser.email,
        firstName: displayName?.split(' ')[0] || 'User',
        lastName: displayName?.split(' ')[1] || '',
        profilePicture: photoURL || `https://ui-avatars.com/api/?name=${displayName || 'User'}`,
        username: email?.split('@')[0] + Math.random().toString(36).substr(2, 5),
      });

      await user.save();
    } else {
      // Update existing user
      user.email = email || user.email;
      user.profilePicture = photoURL || user.profilePicture;
      await user.save();
    }

    res.json({
      success: true,
      message: 'User synced successfully',
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    console.error('Error syncing user:', error);
    res.status(500).json({
      success: false,
      message: 'Error syncing user',
      error: error.message,
    });
  }
});

export default router;
