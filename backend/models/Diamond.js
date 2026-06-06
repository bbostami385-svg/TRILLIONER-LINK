import mongoose from 'mongoose';

const diamondSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },

    // Diamond Balance
    totalDiamonds: {
      type: Number,
      default: 0,
      min: 0,
    },
    diamondsEarned: {
      type: Number,
      default: 0,
      min: 0,
    },
    diamondsSpent: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Level & Experience System
    level: {
      type: Number,
      default: 1,
      min: 1,
      max: 50,
    },
    experience: {
      type: Number,
      default: 0,
      min: 0,
    },
    experienceToNextLevel: {
      type: Number,
      default: 100,
    },

    // Progression Tracking
    totalExperienceEarned: {
      type: Number,
      default: 0,
    },
    levelUpHistory: [
      {
        level: Number,
        achievedAt: Date,
        diamondsAwarded: Number,
      },
    ],

    // Earning Statistics
    earningStats: {
      fromPosts: {
        type: Number,
        default: 0,
      },
      fromLikes: {
        type: Number,
        default: 0,
      },
      fromShares: {
        type: Number,
        default: 0,
      },
      fromDailyLogin: {
        type: Number,
        default: 0,
      },
      fromInvites: {
        type: Number,
        default: 0,
      },
      fromBonuses: {
        type: Number,
        default: 0,
      },
    },

    // Daily Streak & Bonuses
    dailyLoginStreak: {
      type: Number,
      default: 0,
    },
    lastLoginDate: Date,
    lastDiamondEarnedDate: Date,
    consecutiveDaysActive: {
      type: Number,
      default: 0,
    },

    // Multipliers & Boosts
    diamondMultiplier: {
      type: Number,
      default: 1,
      min: 1,
      max: 5,
    },
    multiplierExpires: Date,
    activeBoosts: [
      {
        boostType: {
          type: String,
          enum: ['double_diamonds', 'triple_diamonds', 'weekend_bonus', 'event_bonus'],
        },
        multiplier: Number,
        expiresAt: Date,
      },
    ],

    // Achievements & Milestones
    milestonesReached: [
      {
        milestone: String,
        diamondsAwarded: Number,
        reachedAt: Date,
      },
    ],

    // Freemium Tier System
    tier: {
      type: String,
      enum: ['free', 'premium', 'elite', 'vip'],
      default: 'free',
    },
    premiumExpires: Date,
    premiumFeatures: {
      customProfileTheme: {
        type: Boolean,
        default: false,
      },
      animatedBorder: {
        type: Boolean,
        default: false,
      },
      profileEffects: {
        type: Boolean,
        default: false,
      },
      prioritySupport: {
        type: Boolean,
        default: false,
      },
      adFree: {
        type: Boolean,
        default: false,
      },
      unlimitedProfileCustomization: {
        type: Boolean,
        default: false,
      },
      exclusiveContent: {
        type: Boolean,
        default: false,
      },
      diamondBoost: {
        type: Number,
        default: 1,
      },
    },

    // Free Tier Limits
    freeFeatures: {
      basicProfileTheme: {
        type: Boolean,
        default: true,
      },
      basicBorder: {
        type: Boolean,
        default: true,
      },
      basicBadges: {
        type: Boolean,
        default: true,
      },
      limitedProfileCustomization: {
        type: Boolean,
        default: true,
      },
      basicAnalytics: {
        type: Boolean,
        default: true,
      },
      monthlyDiamondLimit: {
        type: Number,
        default: 500,
      },
      currentMonthDiamonds: {
        type: Number,
        default: 0,
      },
    },

    // Referral System
    referralCount: {
      type: Number,
      default: 0,
    },
    referralBonus: {
      type: Number,
      default: 0,
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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
  { timestamps: true }
);

// Indexes
diamondSchema.index({ userId: 1 });
diamondSchema.index({ level: -1 });
diamondSchema.index({ totalDiamonds: -1 });
diamondSchema.index({ createdAt: -1 });

// Method to add diamonds
diamondSchema.methods.addDiamonds = async function (amount, source = 'bonus') {
  if (amount <= 0) {
    throw new Error('Amount must be greater than 0');
  }

  const multipliedAmount = Math.floor(amount * this.diamondMultiplier);
  this.totalDiamonds += multipliedAmount;
  this.diamondsEarned += multipliedAmount;

  // Track source
  if (this.earningStats[source] !== undefined) {
    this.earningStats[source] += multipliedAmount;
  }

  this.lastDiamondEarnedDate = new Date();
  return this.save();
};

// Method to spend diamonds
diamondSchema.methods.spendDiamonds = async function (amount, reason = 'purchase') {
  if (amount <= 0) {
    throw new Error('Amount must be greater than 0');
  }

  if (this.totalDiamonds < amount) {
    throw new Error('Insufficient diamonds');
  }

  this.totalDiamonds -= amount;
  this.diamondsSpent += amount;
  return this.save();
};

// Method to add experience
diamondSchema.methods.addExperience = async function (amount) {
  if (amount <= 0) {
    throw new Error('Amount must be greater than 0');
  }

  this.experience += amount;
  this.totalExperienceEarned += amount;

  // Check for level up
  while (this.experience >= this.experienceToNextLevel && this.level < 50) {
    this.experience -= this.experienceToNextLevel;
    this.level += 1;

    // Award diamonds on level up
    const diamondReward = 10 * this.level;
    this.totalDiamonds += diamondReward;
    this.diamondsEarned += diamondReward;

    // Record level up
    this.levelUpHistory.push({
      level: this.level,
      achievedAt: new Date(),
      diamondsAwarded: diamondReward,
    });

    // Calculate next level requirement (exponential growth)
    this.experienceToNextLevel = Math.floor(100 * Math.pow(1.1, this.level));
  }

  return this.save();
};

// Method to check if premium tier is active
diamondSchema.methods.isPremiumActive = function () {
  if (this.tier === 'free') return false;
  if (!this.premiumExpires) return false;
  return this.premiumExpires > new Date();
};

// Method to upgrade to premium
diamondSchema.methods.upgradeToPremium = async function (tier = 'premium', durationDays = 30) {
  this.tier = tier;
  this.premiumExpires = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

  // Enable premium features based on tier
  if (tier === 'premium') {
    this.premiumFeatures.customProfileTheme = true;
    this.premiumFeatures.animatedBorder = true;
    this.premiumFeatures.diamondBoost = 1.5;
  } else if (tier === 'elite') {
    this.premiumFeatures.customProfileTheme = true;
    this.premiumFeatures.animatedBorder = true;
    this.premiumFeatures.profileEffects = true;
    this.premiumFeatures.prioritySupport = true;
    this.premiumFeatures.adFree = true;
    this.premiumFeatures.diamondBoost = 2;
  } else if (tier === 'vip') {
    this.premiumFeatures.customProfileTheme = true;
    this.premiumFeatures.animatedBorder = true;
    this.premiumFeatures.profileEffects = true;
    this.premiumFeatures.prioritySupport = true;
    this.premiumFeatures.adFree = true;
    this.premiumFeatures.unlimitedProfileCustomization = true;
    this.premiumFeatures.exclusiveContent = true;
    this.premiumFeatures.diamondBoost = 3;
  }

  return this.save();
};

// Method to downgrade to free tier
diamondSchema.methods.downgradeToFree = async function () {
  this.tier = 'free';
  this.premiumExpires = null;
  this.premiumFeatures = {
    customProfileTheme: false,
    animatedBorder: false,
    profileEffects: false,
    prioritySupport: false,
    adFree: false,
    unlimitedProfileCustomization: false,
    exclusiveContent: false,
    diamondBoost: 1,
  };
  return this.save();
};

// Method to check if user can claim daily bonus
diamondSchema.methods.canClaimDailyBonus = function () {
  if (!this.lastLoginDate) return true;

  const today = new Date();
  const lastLogin = new Date(this.lastLoginDate);

  return today.toDateString() !== lastLogin.toDateString();
};

// Method to claim daily bonus
diamondSchema.methods.claimDailyBonus = async function () {
  if (!this.canClaimDailyBonus()) {
    throw new Error('Daily bonus already claimed');
  }

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Check if this is a consecutive day
  const lastLogin = this.lastLoginDate ? new Date(this.lastLoginDate) : null;
  const isConsecutive = lastLogin && lastLogin.toDateString() === yesterday.toDateString();

  if (isConsecutive) {
    this.dailyLoginStreak += 1;
    this.consecutiveDaysActive += 1;
  } else {
    this.dailyLoginStreak = 1;
    this.consecutiveDaysActive = 1;
  }

  // Base bonus + streak bonus
  const baseBonus = 5;
  const streakBonus = Math.min(this.dailyLoginStreak - 1, 10); // Max 10 streak bonus
  const totalBonus = baseBonus + streakBonus;

  await this.addDiamonds(totalBonus, 'fromDailyLogin');

  this.lastLoginDate = today;
  return this.save();
};

// Method to apply multiplier boost
diamondSchema.methods.applyMultiplier = async function (multiplier, durationHours = 24) {
  this.diamondMultiplier = multiplier;
  this.multiplierExpires = new Date(Date.now() + durationHours * 60 * 60 * 1000);
  return this.save();
};

// Method to check and remove expired boosts
diamondSchema.methods.checkExpiredBoosts = async function () {
  const now = new Date();

  // Check multiplier expiry
  if (this.multiplierExpires && this.multiplierExpires < now) {
    this.diamondMultiplier = 1;
    this.multiplierExpires = null;
  }

  // Remove expired active boosts
  this.activeBoosts = this.activeBoosts.filter((boost) => boost.expiresAt > now);

  // Check premium expiry
  if (this.premiumExpires && this.premiumExpires < now) {
    await this.downgradeToFree();
  }

  return this.save();
};

// Method to check free tier monthly limit
diamondSchema.methods.canEarnDiamonds = function (amount) {
  if (this.tier !== 'free') return true; // Premium users have no limit

  // Check if monthly limit reached
  const monthlyLimit = this.freeFeatures.monthlyDiamondLimit;
  return this.freeFeatures.currentMonthDiamonds + amount <= monthlyLimit;
};

// Method to reset monthly diamond counter
diamondSchema.methods.resetMonthlyCounter = async function () {
  const now = new Date();
  const lastReset = this.updatedAt;

  // Reset if it's a new month
  if (lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear()) {
    this.freeFeatures.currentMonthDiamonds = 0;
    return this.save();
  }

  return this;
};

export default mongoose.model('Diamond', diamondSchema);
