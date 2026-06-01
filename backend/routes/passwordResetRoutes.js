import express from 'express';
import PasswordResetService from '../services/PasswordResetService.js';
import { verifyFirebaseAuth } from '../middleware/firebaseMiddleware.js';

const router = express.Router();

/**
 * @route   POST /api/password-reset/request
 * @desc    Request password reset
 * @access  Public
 */
router.post('/request', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    const result = await PasswordResetService.requestPasswordReset(email, ipAddress, userAgent);

    res.json(result);
  } catch (error) {
    console.error('Error requesting password reset:', error);
    res.status(500).json({
      success: false,
      message: 'Error requesting password reset',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/password-reset/verify-token
 * @desc    Verify reset token
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

    const result = await PasswordResetService.verifyResetToken(token);

    res.json(result);
  } catch (error) {
    console.error('Error verifying reset token:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying reset token',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/password-reset/reset
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset', async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token, new password, and confirm password are required',
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    const result = await PasswordResetService.resetPasswordWithToken(token, newPassword);

    res.json(result);
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/password-reset/change-password
 * @desc    Change password for logged-in user
 * @access  Private
 */
router.post('/change-password', verifyFirebaseAuth, async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;
    const userId = req.userId;

    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Old password, new password, and confirm password are required',
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New passwords do not match',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long',
      });
    }

    const result = await PasswordResetService.resetPasswordWithOldPassword(
      userId,
      oldPassword,
      newPassword
    );

    res.json(result);
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing password',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/password-reset/status/:token
 * @desc    Get reset request status
 * @access  Public
 */
router.get('/status/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const result = await PasswordResetService.getResetRequestStatus(token);

    res.json(result);
  } catch (error) {
    console.error('Error getting reset request status:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting reset request status',
      error: error.message,
    });
  }
});

export default router;
