import React, { useState } from 'react';
import { Heart, MessageCircle, UserPlus, Share2, AtSign, Trash2 } from 'lucide-react';
import './Notifications.css';

interface Notification {
  id: number;
  type: 'like' | 'comment' | 'follow' | 'share' | 'mention';
  fromUser: {
    id: number;
    name: string;
    avatar: string;
  };
  message: string;
  timestamp: Date;
  isRead: boolean;
  relatedItem?: {
    type: 'post' | 'video' | 'comment';
    id: number;
    preview: string;
  };
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      type: 'like',
      fromUser: { id: 1, name: 'Sarah Ahmed', avatar: '👩' },
      message: 'liked your post',
      timestamp: new Date(Date.now() - 300000),
      isRead: false,
      relatedItem: { type: 'post', id: 1, preview: '🏖️' },
    },
    {
      id: 2,
      type: 'comment',
      fromUser: { id: 2, name: 'Alex Khan', avatar: '👨' },
      message: 'commented on your video: "Amazing content!"',
      timestamp: new Date(Date.now() - 900000),
      isRead: false,
      relatedItem: { type: 'video', id: 1, preview: '🎬' },
    },
    {
      id: 3,
      type: 'follow',
      fromUser: { id: 3, name: 'Priya Singh', avatar: '👩‍🦰' },
      message: 'started following you',
      timestamp: new Date(Date.now() - 3600000),
      isRead: false,
    },
    {
      id: 4,
      type: 'mention',
      fromUser: { id: 4, name: 'Ravi Patel', avatar: '👨‍💼' },
      message: 'mentioned you in a comment',
      timestamp: new Date(Date.now() - 7200000),
      isRead: true,
      relatedItem: { type: 'post', id: 2, preview: '🏔️' },
    },
    {
      id: 5,
      type: 'share',
      fromUser: { id: 5, name: 'Emma Wilson', avatar: '👩‍🦱' },
      message: 'shared your post',
      timestamp: new Date(Date.now() - 86400000),
      isRead: true,
      relatedItem: { type: 'post', id: 3, preview: '🌅' },
    },
  ]);

  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'like':
        return <Heart size={20} className="notification-icon like" />;
      case 'comment':
        return <MessageCircle size={20} className="notification-icon comment" />;
      case 'follow':
        return <UserPlus size={20} className="notification-icon follow" />;
      case 'share':
        return <Share2 size={20} className="notification-icon share" />;
      case 'mention':
        return <AtSign size={20} className="notification-icon mention" />;
      default:
        return null;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.isRead)
    : notifications;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, isRead: true } : n
    ));
  };

  const deleteNotification = (id: number) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  return (
    <div className="notifications-container">
      <div className="notifications-header">
        <h1>Notifications</h1>
        {unreadCount > 0 && (
          <button className="mark-all-read-btn" onClick={markAllAsRead}>
            Mark all as read
          </button>
        )}
      </div>

      <div className="notifications-filters">
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button 
          className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
          onClick={() => setFilter('unread')}
        >
          Unread {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
        </button>
      </div>

      <div className="notifications-list">
        {filteredNotifications.length === 0 ? (
          <div className="empty-state">
            <p>🔔 No notifications</p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div 
              key={notification.id}
              className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
              onClick={() => markAsRead(notification.id)}
            >
              <div className="notification-avatar">
                {notification.fromUser.avatar}
              </div>

              <div className="notification-content">
                <div className="notification-main">
                  <span className="notification-icon-wrapper">
                    {getNotificationIcon(notification.type)}
                  </span>
                  <div className="notification-text">
                    <strong>{notification.fromUser.name}</strong>
                    {' '}{notification.message}
                  </div>
                </div>
                <span className="notification-time">
                  {formatTime(notification.timestamp)}
                </span>
              </div>

              {notification.relatedItem && (
                <div className="notification-preview">
                  {notification.relatedItem.preview}
                </div>
              )}

              <button 
                className="notification-delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNotification(notification.id);
                }}
              >
                <Trash2 size={16} />
              </button>

              {!notification.isRead && (
                <div className="notification-unread-indicator" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
