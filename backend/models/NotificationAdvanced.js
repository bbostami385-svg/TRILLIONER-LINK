import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    // Recipient
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Sender (who triggered the notification)
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    // Notification Type
    type: {
      type: String,
      enum: [
        'follow',
        'like',
        'comment',
        'share',
        'message',
        'achievement',
        'level_up',
        'diamond_earned',
        'subscription_expiry',
        'friend_request',
        'mention',
        'repost',
        'reply',
        'system',
        'promotion',
        'security_alert',
      ],
      required: true,
      index: true,
    },

    // Notification Title & Message
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    description: String,

    // Related Entity
    relatedEntity: {
      type: String,
      enum: ['post', 'comment', 'user', 'message', 'achievement', 'diamond', 'subscription', 'product'],
    },
    relatedEntityId: mongoose.Schema.Types.ObjectId,

    // Action URL
    actionUrl: String,
    actionText: String,

    // Image/Icon
    image: String,
    icon: String,

    // Notification Channels
    channels: {
      inApp: {
        type: Boolean,
        default: true,
      },
      email: {
        type: Boolean,
        default: true,
      },
      push: {
        type: Boolean,
        default: true,
      },
      sms: {
        type: Boolean,
        default: false,
      },
    },

    // Delivery Status
    deliveryStatus: {
      inApp: {
        sent: {
          type: Boolean,
          default: false,
        },
        sentAt: Date,
      },
      email: {
        sent: {
          type: Boolean,
          default: false,
        },
        sentAt: Date,
        error: String,
      },
      push: {
        sent: {
          type: Boolean,
          default: false,
        },
        sentAt: Date,
        deviceTokens: [String],
        error: String,
      },
      sms: {
        sent: {
          type: Boolean,
          default: false,
        },
        sentAt: Date,
        error: String,
      },
    },

    // User Interaction
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
    isArchived: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },

    // Priority & Urgency
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'critical'],
      default: 'normal',
    },
    urgency: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },

    // Scheduling
    scheduledFor: Date,
    expiresAt: Date,

    // Metadata
    metadata: {
      type: Map,
      of: String,
    },

    // Tags for filtering
    tags: [String],

    // Notification Group (for grouping similar notifications)
    groupId: String,
    groupCount: {
      type: Number,
      default: 1,
    },

    // Analytics
    clicks: {
      type: Number,
      default: 0,
    },
    impressions: {
      type: Number,
      default: 0,
    },

    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
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
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ priority: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ sender: 1 });

// Method to mark as read
notificationSchema.methods.markAsRead = async function () {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Method to mark as unread
notificationSchema.methods.markAsUnread = async function () {
  this.isRead = false;
  this.readAt = null;
  return this.save();
};

// Method to archive
notificationSchema.methods.archive = async function () {
  this.isArchived = true;
  return this.save();
};

// Method to unarchive
notificationSchema.methods.unarchive = async function () {
  this.isArchived = false;
  return this.save();
};

// Method to delete
notificationSchema.methods.softDelete = async function () {
  this.isDeleted = true;
  return this.save();
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function (userId) {
  return this.countDocuments({
    recipient: userId,
    isRead: false,
    isDeleted: false,
  });
};

// Static method to get recent notifications
notificationSchema.statics.getRecent = async function (userId, limit = 20) {
  return this.find({
    recipient: userId,
    isDeleted: false,
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('sender', 'username profilePicture')
    .populate('relatedEntityId');
};

// Static method to get unread notifications
notificationSchema.statics.getUnread = async function (userId, limit = 20) {
  return this.find({
    recipient: userId,
    isRead: false,
    isDeleted: false,
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('sender', 'username profilePicture');
};

const NotificationAdvanced = mongoose.model('NotificationAdvanced', notificationSchema);
export default NotificationAdvanced;
