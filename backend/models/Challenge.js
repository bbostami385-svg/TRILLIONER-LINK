import mongoose from 'mongoose';

const challengeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    category: {
      type: String,
      enum: ['fitness', 'skill', 'creativity', 'social', 'learning', 'other'],
      default: 'other',
    },
    reward: {
      type: Number,
      required: true,
      min: 0,
    },
    rewardType: {
      type: String,
      enum: ['diamonds', 'coins', 'badge', 'xp'],
      default: 'diamonds',
    },
    duration: {
      type: Number,
      required: true,
      description: 'Duration in days',
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
    rules: [
      {
        type: String,
      },
    ],
    participants: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ['active', 'completed', 'failed', 'abandoned'],
          default: 'active',
        },
        progress: {
          type: Number,
          default: 0,
          min: 0,
          max: 100,
        },
        completedAt: Date,
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    image: String,
    tags: [String],
    participantCount: {
      type: Number,
      default: 0,
    },
    completionCount: {
      type: Number,
      default: 0,
    },
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
challengeSchema.index({ category: 1 });
challengeSchema.index({ createdBy: 1 });
challengeSchema.index({ isActive: 1 });
challengeSchema.index({ endDate: 1 });
challengeSchema.index({ 'participants.userId': 1 });

const Challenge = mongoose.model('Challenge', challengeSchema);
export default Challenge;
