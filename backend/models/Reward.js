import mongoose from 'mongoose';

const rewardSchema = new mongoose.Schema(
  {
    // Reward details
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    image: String,
    icon: String,

    // Points/Diamond requirement
    pointsRequired: {
      type: Number,
      required: true,
      default: 0,
    },
    diamondRequired: {
      type: Number,
      default: 0,
    },

    // Reward type
    type: {
      type: String,
      enum: ['badge', 'item', 'discount', 'feature', 'premium', 'exclusive'],
      default: 'item',
    },

    // Reward value
    value: {
      type: Number,
      default: 0,
    },
    unit: {
      type: String,
      enum: ['points', 'diamonds', 'percent', 'days', 'access'],
      default: 'points',
    },

    // Availability
    status: {
      type: String,
      enum: ['active', 'inactive', 'limited', 'coming_soon'],
      default: 'active',
    },
    quantity: {
      type: Number,
      default: null, // null = unlimited
    },
    quantityRemaining: {
      type: Number,
      default: null,
    },

    // Expiry
    expiresAt: Date,
    isExpired: {
      type: Boolean,
      default: false,
    },

    // Rarity
    rarity: {
      type: String,
      enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
      default: 'common',
    },

    // Category
    category: {
      type: String,
      enum: ['profile', 'feature', 'badge', 'exclusive', 'seasonal', 'achievement'],
      default: 'feature',
    },

    // Redemption tracking
    redeemedCount: {
      type: Number,
      default: 0,
    },
    maxRedemptionsPerUser: {
      type: Number,
      default: 1,
    },

    // Metadata
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
rewardSchema.index({ status: 1 });
rewardSchema.index({ pointsRequired: 1 });
rewardSchema.index({ category: 1 });
rewardSchema.index({ createdAt: -1 });

// Method to check if reward is available
rewardSchema.methods.isAvailable = function () {
  return (
    this.status === 'active' &&
    (!this.expiresAt || this.expiresAt > new Date()) &&
    (!this.quantity || this.quantityRemaining > 0)
  );
};

// Method to redeem reward
rewardSchema.methods.redeem = async function () {
  this.redeemedCount += 1;
  if (this.quantity) {
    this.quantityRemaining -= 1;
  }
  return this.save();
};

// Static method to get available rewards
rewardSchema.statics.getAvailable = async function (userPoints = 0) {
  return this.find({
    status: 'active',
    pointsRequired: { $lte: userPoints },
    $or: [{ expiresAt: { $gt: new Date() } }, { expiresAt: null }],
  }).sort({ rarity: -1, createdAt: -1 });
};

const Reward = mongoose.model('Reward', rewardSchema);
export default Reward;
