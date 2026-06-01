import PasswordReset from '../models/PasswordReset.js';
import User from '../models/User.js';
import NotificationService from './NotificationService.js';
import bcrypt from 'bcryptjs';

/**
 * Password Reset Service
 * Handles forgot password and password reset functionality
 */
class PasswordResetService {
  /**
   * Request password reset
   */
  static async requestPasswordReset(email, ipAddress, userAgent) {
    try {
      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        // Don't reveal if email exists or not (security best practice)
        return {
          success: true,
          message: 'If email exists, reset link will be sent',
        };
      }

      // Create reset request
      const resetRequest = await PasswordReset.createResetRequest(user._id, email);

      // Add metadata
      resetRequest.ipAddress = ipAddress;
      resetRequest.userAgent = userAgent;
      await resetRequest.save();

      // Send email with reset link
      await this.sendPasswordResetEmail(email, resetRequest.resetToken);

      return {
        success: true,
        message: 'Password reset link sent to email',
      };
    } catch (error) {
      console.error('Error requesting password reset:', error);
      throw error;
    }
  }

  /**
   * Verify reset token
   */
  static async verifyResetToken(token) {
    try {
      const resetRequest = await PasswordReset.verifyResetRequest(token);

      if (!resetRequest) {
        return {
          success: false,
          message: 'Invalid or expired reset token',
        };
      }

      return {
        success: true,
        email: resetRequest.email,
        userId: resetRequest.userId,
      };
    } catch (error) {
      console.error('Error verifying reset token:', error);
      throw error;
    }
  }

  /**
   * Reset password with token
   */
  static async resetPasswordWithToken(token, newPassword) {
    try {
      // Verify token
      const resetRequest = await PasswordReset.verifyResetRequest(token);

      if (!resetRequest) {
        return {
          success: false,
          message: 'Invalid or expired reset token',
        };
      }

      // Check if blocked
      if (resetRequest.isAttemptBlocked()) {
        return {
          success: false,
          message: 'Too many failed attempts. Please request a new reset link.',
        };
      }

      // Find user
      const user = await User.findById(resetRequest.userId);
      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      // Validate password
      if (!newPassword || newPassword.length < 6) {
        return {
          success: false,
          message: 'Password must be at least 6 characters long',
        };
      }

      // Update password
      user.password = newPassword;
      await user.save();

      // Mark reset request as used
      await resetRequest.markAsUsed();

      // Send confirmation email
      await this.sendPasswordResetConfirmationEmail(user.email, user.firstName);

      return {
        success: true,
        message: 'Password reset successfully',
      };
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  }

  /**
   * Reset password with old password (for logged-in users)
   */
  static async resetPasswordWithOldPassword(userId, oldPassword, newPassword) {
    try {
      // Find user
      const user = await User.findById(userId).select('+password');
      if (!user) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      // Verify old password
      const isPasswordValid = await user.comparePassword(oldPassword);
      if (!isPasswordValid) {
        return {
          success: false,
          message: 'Current password is incorrect',
        };
      }

      // Validate new password
      if (!newPassword || newPassword.length < 6) {
        return {
          success: false,
          message: 'New password must be at least 6 characters long',
        };
      }

      // Check if new password is same as old password
      const isSamePassword = await bcrypt.compare(newPassword, user.password);
      if (isSamePassword) {
        return {
          success: false,
          message: 'New password cannot be same as current password',
        };
      }

      // Update password
      user.password = newPassword;
      await user.save();

      // Send confirmation email
      await this.sendPasswordResetConfirmationEmail(user.email, user.firstName);

      return {
        success: true,
        message: 'Password changed successfully',
      };
    } catch (error) {
      console.error('Error resetting password with old password:', error);
      throw error;
    }
  }

  /**
   * Send password reset email
   */
  static async sendPasswordResetEmail(email, resetToken) {
    try {
      const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

      const htmlContent = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">Password Reset Request</h1>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
            <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
              We received a request to reset your password. Click the button below to set a new password.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="background-color: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold; font-size: 16px;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-bottom: 10px;">
              Or copy and paste this link in your browser:
            </p>
            <p style="color: #667eea; font-size: 12px; word-break: break-all; background-color: #e8eaf6; padding: 10px; border-radius: 4px;">
              ${resetLink}
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
              <p style="color: #999; font-size: 12px; margin: 10px 0;">
                This link will expire in 24 hours.
              </p>
              <p style="color: #999; font-size: 12px; margin: 10px 0;">
                If you didn't request a password reset, please ignore this email or contact support if you have concerns.
              </p>
            </div>
            
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                © 2026 NovaPlus Social. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      `;

      await NotificationService.sendEmailNotification(
        email,
        'Password Reset Request - NovaPlus Social',
        htmlContent
      );

      return { success: true };
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  }

  /**
   * Send password reset confirmation email
   */
  static async sendPasswordResetConfirmationEmail(email, firstName) {
    try {
      const htmlContent = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">Password Changed Successfully</h1>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
            <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
              Hi ${firstName},
            </p>
            
            <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
              Your password has been successfully changed. You can now log in with your new password.
            </p>
            
            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="color: #856404; margin: 0; font-size: 14px;">
                <strong>Security Tip:</strong> Never share your password with anyone. NovaPlus staff will never ask for your password.
              </p>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-bottom: 10px;">
              If you didn't make this change or believe your account has been compromised, please contact our support team immediately.
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                © 2026 NovaPlus Social. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      `;

      await NotificationService.sendEmailNotification(
        email,
        'Password Changed Successfully - NovaPlus Social',
        htmlContent
      );

      return { success: true };
    } catch (error) {
      console.error('Error sending password reset confirmation email:', error);
      throw error;
    }
  }

  /**
   * Clean up expired reset requests
   */
  static async cleanupExpiredRequests() {
    try {
      const result = await PasswordReset.cleanupExpired();
      console.log(`✅ Cleaned up ${result.deletedCount} expired password reset requests`);
      return result;
    } catch (error) {
      console.error('Error cleaning up expired requests:', error);
      throw error;
    }
  }

  /**
   * Get reset request status
   */
  static async getResetRequestStatus(token) {
    try {
      const resetRequest = await PasswordReset.verifyResetRequest(token);

      if (!resetRequest) {
        return {
          valid: false,
          message: 'Invalid or expired reset token',
        };
      }

      const expiresIn = Math.floor((resetRequest.expiresAt - new Date()) / 1000 / 60); // minutes

      return {
        valid: true,
        email: resetRequest.email,
        expiresIn,
        attempts: resetRequest.attempts,
        maxAttempts: resetRequest.maxAttempts,
        isBlocked: resetRequest.isAttemptBlocked(),
      };
    } catch (error) {
      console.error('Error getting reset request status:', error);
      throw error;
    }
  }
}

export default PasswordResetService;
