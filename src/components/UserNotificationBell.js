// User Notification Bell Component
import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebaseConfig';
import NotificationService from '../utils/notificationService';

const UserNotificationBell = () => {
  const [user] = useAuthState(auth);
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Listen to user notifications
    const unsubscribe = NotificationService.listenToUserNotifications(user.uid, (newNotifications) => {
      setNotifications(newNotifications);
      setUnreadCount(NotificationService.getUnreadCount(newNotifications));
    });

    return () => unsubscribe && unsubscribe();
  }, [user]);

  const handleNotificationClick = async (notification) => {
    // Mark as read
    await NotificationService.markAsRead(notification.id, false, user.uid);
    
    // Navigate to user messages or feedback page
    window.location.href = '/user-messages';
    setShowDropdown(false);
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Just now';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (!user) return null;

  return (
    <div style={styles.container}>
      <div 
        style={styles.bellIcon} 
        onClick={() => setShowDropdown(!showDropdown)}
      >
        🔔
        {unreadCount > 0 && (
          <span style={styles.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </div>

      {showDropdown && (
        <div style={styles.dropdown}>
          <div style={styles.header}>
            <h3 style={styles.title}>Notifications</h3>
            {notifications.length > 0 && (
              <button 
                style={styles.clearBtn}
                onClick={() => NotificationService.clearAllNotifications(false, user.uid)}
              >
                Clear All
              </button>
            )}
          </div>

          <div style={styles.notificationList}>
            {notifications.length === 0 ? (
              <div style={styles.emptyState}>
                <span style={styles.emptyIcon}>📭</span>
                <p style={styles.emptyText}>No notifications yet</p>
              </div>
            ) : (
              notifications.slice(0, 10).map((notification) => (
                <div
                  key={notification.id}
                  style={{
                    ...styles.notificationItem,
                    ...(notification.read ? {} : styles.unreadItem)
                  }}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div style={styles.notificationIcon}>
                    {notification.type === 'ADMIN_REPLY' ? '💬' : '📧'}
                  </div>
                  <div style={styles.notificationContent}>
                    <div style={styles.notificationTitle}>
                      {notification.title}
                    </div>
                    <div style={styles.notificationMessage}>
                      From: {notification.adminName || 'Support Team'}
                    </div>
                    <div style={styles.notificationPreview}>
                      {notification.replyPreview || notification.message}
                    </div>
                    <div style={styles.notificationTime}>
                      {formatTimestamp(notification.timestamp)}
                    </div>
                  </div>
                  {!notification.read && <div style={styles.unreadDot}></div>}
                </div>
              ))
            )}
          </div>

          {notifications.length > 10 && (
            <div style={styles.footer}>
              <button style={styles.viewAllBtn}>
                View All Notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    position: 'relative',
    display: 'inline-block'
  },
  bellIcon: {
    fontSize: '20px',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '50%',
    transition: 'all 0.2s ease',
    position: 'relative',
    color: '#374151',
    ':hover': {
      backgroundColor: 'rgba(0, 0, 0, 0.05)'
    }
  },
  badge: {
    position: 'absolute',
    top: '2px',
    right: '2px',
    backgroundColor: '#ef4444',
    color: 'white',
    borderRadius: '50%',
    fontSize: '10px',
    fontWeight: 'bold',
    minWidth: '18px',
    height: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid white'
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    right: '0',
    width: '380px',
    maxHeight: '500px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
    border: '1px solid #e5e7eb',
    zIndex: 1000,
    overflow: 'hidden'
  },
  header: {
    padding: '16px 20px',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc'
  },
  title: {
    margin: 0,
    fontSize: '16px',
    fontWeight: '600',
    color: '#374151'
  },
  clearBtn: {
    background: 'none',
    border: 'none',
    color: '#6366f1',
    fontSize: '12px',
    cursor: 'pointer',
    fontWeight: '500'
  },
  notificationList: {
    maxHeight: '400px',
    overflowY: 'auto'
  },
  emptyState: {
    padding: '40px 20px',
    textAlign: 'center',
    color: '#9ca3af'
  },
  emptyIcon: {
    fontSize: '48px',
    display: 'block',
    marginBottom: '12px'
  },
  emptyText: {
    margin: 0,
    fontSize: '14px'
  },
  notificationItem: {
    padding: '16px 20px',
    borderBottom: '1px solid #f3f4f6',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    transition: 'background-color 0.2s ease',
    position: 'relative',
    ':hover': {
      backgroundColor: '#f9fafb'
    }
  },
  unreadItem: {
    backgroundColor: '#f0f9ff',
    borderLeft: '3px solid #3b82f6'
  },
  notificationIcon: {
    fontSize: '20px',
    marginTop: '2px'
  },
  notificationContent: {
    flex: 1,
    minWidth: 0
  },
  notificationTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '4px'
  },
  notificationMessage: {
    fontSize: '12px',
    color: '#6b7280',
    marginBottom: '4px'
  },
  notificationPreview: {
    fontSize: '12px',
    color: '#4b5563',
    lineHeight: '1.4',
    marginBottom: '6px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  notificationTime: {
    fontSize: '11px',
    color: '#9ca3af'
  },
  unreadDot: {
    width: '8px',
    height: '8px',
    backgroundColor: '#3b82f6',
    borderRadius: '50%',
    marginTop: '6px'
  },
  footer: {
    padding: '12px 20px',
    borderTop: '1px solid #e5e7eb',
    backgroundColor: '#f8fafc'
  },
  viewAllBtn: {
    width: '100%',
    padding: '8px',
    background: 'none',
    border: 'none',
    color: '#6366f1',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    borderRadius: '6px',
    transition: 'background-color 0.2s ease'
  }
};

export default UserNotificationBell;
