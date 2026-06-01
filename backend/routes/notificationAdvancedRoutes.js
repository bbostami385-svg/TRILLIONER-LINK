import express from 'express';
import NotificationAdvanced from '../models/NotificationAdvanced.js';
import NotificationService from '../services/NotificationService.js';
import { verifyFirebaseAuth } from '../middleware/firebaseMiddleware.js';

const router = express.Router();

/**
 * @route   POST /api/notifications/send
 * @desc    Send notification (admin/system only)
 * @access  Private
 */
router.post('/send', verifyFirebaseAuth, async (req, res) => {
  try {
    const {
      recipientId,
      type,
      title,
      message,
      description,
      relatedEntity,
      relatedEntityId,
      actionUrl,
      actionText,
      channels = { inApp: true, email: true, push: false, sms: false },
      priority = 'normal',
    } = req.body;

    if (!recipientId || !type || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'recipientId, type, title, and message are required',
      });
    }

    const notification = await NotificationService.createNotification({
      recipientId,
      senderId: req.userId,
      type,
      title,
      message,
      description,
      relatedEntity,
      relatedEntityId,
      actionUrl,
      actionText,
      channels,
      priority,
    });

    res.status(201).json({
      success: true,
      message: 'Notification sent successfully',
      notification,
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending notification',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/notifications
 * @desc    Get user notifications
 * @access  Private
 */
router.get('/', verifyFirebaseAuth, async (req, res) => {
  try {
    const { limit = 20, skip = 0, isRead, type } = req.query;
    const userId = req.userId;

    const result = await NotificationService.getUserNotifications(userId, {
      limit: parseInt(limit),
      skip: parseInt(skip),
      isRead: isRead !== undefined ? isRead === 'true' : null,
      type,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting notifications',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/notifications/unread/count
 * @desc    Get unread notification count
 * @access  Private
 */
router.get('/unread/count', verifyFirebaseAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const count = await NotificationService.getUnreadCount(userId);

    res.json({
      success: true,
      unreadCount: count,
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting unread count',
      error: error.message,
    });
  }
});

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.put('/:id/read', verifyFirebaseAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const notification = await NotificationAdvanced.findById(id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    if (notification.recipient.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    await NotificationService.markAsRead(id);

    res.json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking notification as read',
      error: error.message,
    });
  }
});

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.put('/read-all', verifyFirebaseAuth, async (req, res) => {
  try {
    const userId = req.userId;

    await NotificationService.markAllAsRead(userId);

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking all notifications as read',
      error: error.message,
    });
  }
});

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete notification
 * @access  Private
 */
router.delete('/:id', verifyFirebaseAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const notification = await NotificationAdvanced.findById(id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    if (notification.recipient.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    await NotificationService.deleteNotification(id);

    res.json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting notification',
      error: error.message,
    });
  }
});

/**
 * @route   PUT /api/notifications/:id/archive
 * @desc    Archive notification
 * @access  Private
 */
router.put('/:id/archive', verifyFirebaseAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const notification = await NotificationAdvanced.findById(id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    if (notification.recipient.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    await NotificationService.archiveNotification(id);

    res.json({
      success: true,
      message: 'Notification archived',
    });
  } catch (error) {
    console.error('Error archiving notification:', error);
    res.status(500).json({
      success: false,
      message: 'Error archiving notification',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/notifications/bulk-send
 * @desc    Send bulk notifications (admin only)
 * @access  Private
 */
router.post('/bulk-send', verifyFirebaseAuth, async (req, res) => {
  try {
    const { userIds, type, title, message, description, channels = { inApp: true, email: true } } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'userIds array is required',
      });
    }

    if (!type || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'type, title, and message are required',
      });
    }

    const notifications = await NotificationService.sendBulkNotifications(userIds, {
      type,
      title,
      message,
      description,
      channels,
    });

    res.status(201).json({
      success: true,
      message: `${notifications.length} notifications sent successfully`,
      count: notifications.length,
    });
  } catch (error) {
    console.error('Error sending bulk notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending bulk notifications',
      error: error.message,
    });
  }
});

export default router;
