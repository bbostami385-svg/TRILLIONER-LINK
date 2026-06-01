import mongoose from 'mongoose';
import crypto from 'crypto';

const passwordResetSchema = new mongoose.Schema(
  {
    // User reference
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },

    // Reset token
    resetToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    resetTokenHash: {
      type: String,
      required: true,
    },

    // Token expiry
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },

    // Status
    isUsed: {
      type: Boolean,
      default: false,
    },
    usedAt: Date,

    // Security
    ipAddress: String,
    userAgent: String,
    attempts: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 5,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },

    // Verification
    isVerified: {
      type: Boolean,
      default: false,
    },
    verifiedAt: Date,

    // Notification tracking
    emailSent: {
      type: Boolean,
      default: false,
    },
    emailSentAt: Date,
    smsSent: {
      type: Boolean,
      default: false,
    },
    smsSentAt: Date,

    // Metadata
    requestReason: {
      type: String,
      enum: ['user_request', 'admin_request', 'security_alert'],
      default: 'user_request',
    },
    metadata: {
      type: Map,
      of: String,
    },

    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
passwordResetSchema.index({ userId: 1, createdAt: -1 });
passwordResetSchema.index({ email: 1 });
passwordResetSchema.index({ expiresAt: 1 });
passwordResetSchema.index({ isUsed: 1 });

// Generate reset token
passwordResetSchema.statics.generateResetToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  return { token, hash };
};

// Method to verify token
passwordResetSchema.methods.verifyToken = function (token) {
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  return hash === this.resetTokenHash && this.expiresAt > new Date() && !this.isUsed;
};

// Method to mark as used
passwordResetSchema.methods.markAsUsed = async function () {
  this.isUsed = true;
  this.usedAt = new Date();
  return this.save();
};

// Method to increment attempts
passwordResetSchema.methods.incrementAttempts = async function () {
  this.attempts += 1;
  if (this.attempts >= this.maxAttempts) {
    this.isBlocked = true;
  }
  return this.save();
};

// Method to check if blocked
passwordResetSchema.methods.isAttemptBlocked = function () {
  return this.isBlocked || this.attempts >= this.maxAttempts;
};

// Static method to create reset request
passwordResetSchema.statics.createResetRequest = async function (userId, email) {
  // Check for existing active reset requests
  const existingRequest = await this.findOne({
    userId,
    isUsed: false,
    expiresAt: { $gt: new Date() },
  });

  if (existingRequest) {
    return existingRequest;
  }

  // Generate new token
  const { token, hash } = this.generateResetToken();

  // Create reset request (expires in 24 hours)
  const resetRequest = new this({
    userId,
    email,
    resetToken: token,
    resetTokenHash: hash,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  await resetRequest.save();
  return resetRequest;
};

// Static method to verify and get reset request
passwordResetSchema.statics.verifyResetRequest = async function (token) {
  const hash = crypto.createHash('sha256').update(token).digest('hex');

  const resetRequest = await this.findOne({
    resetTokenHash: hash,
    isUsed: false,
    isBlocked: false,
    expiresAt: { $gt: new Date() },
  });

  if (!resetRequest) {
    return null;
  }

  return resetRequest;
};

// Clean up expired tokens (run periodically)
passwordResetSchema.statics.cleanupExpired = async function () {
  return this.deleteMany({
    expiresAt: { $lt: new Date() },
    isUsed: false,
  });
};

const PasswordReset = mongoose.model('PasswordReset', passwordResetSchema);
export default PasswordReset;
