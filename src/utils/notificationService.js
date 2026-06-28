// Notification Service for Real-time Admin-User Communication
import { ref, push, onValue, update, serverTimestamp } from 'firebase/database';
import { db } from '../firebaseConfig';

// Database structure:
// notifications/
//   ├── admin/
//   │   ├── {notificationId}: { type, message, userId, userName, timestamp, read }
//   └── users/
//       └── {userId}/
//           └── {notificationId}: { type, message, adminId, timestamp, read }

export class NotificationService {
  
  // Send notification when user sends message to admin
  static async notifyAdminNewMessage(messageData) {
    try {
      const adminNotificationRef = ref(db, 'notifications/admin');
      const notification = {
        type: 'NEW_USER_MESSAGE',
        title: 'New User Message',
        message: `New message from ${messageData.userName || 'User'}`,
        userId: messageData.userId,
        userName: messageData.userName || 'Anonymous User',
        userEmail: messageData.userEmail || '',
        messageId: messageData.messageId,
        messagePreview: messageData.message.substring(0, 100) + '...',
        timestamp: serverTimestamp(),
        read: false,
        priority: 'normal'
      };
      
      await push(adminNotificationRef, notification);
      console.log('Admin notification sent successfully');
    } catch (error) {
      console.error('Error sending admin notification:', error);
    }
  }

  // Send notification when admin replies to user
  static async notifyUserAdminReply(replyData) {
    try {
      const userNotificationRef = ref(db, `notifications/users/${replyData.userId}`);
      const notification = {
        type: 'ADMIN_REPLY',
        title: 'Admin Reply Received',
        message: 'Admin has replied to your message',
        adminId: 'admin',
        adminName: 'Support Team',
        messageId: replyData.messageId,
        replyPreview: replyData.reply.substring(0, 100) + '...',
        timestamp: serverTimestamp(),
        read: false,
        priority: 'high'
      };
      
      await push(userNotificationRef, notification);
      console.log('User notification sent successfully');
    } catch (error) {
      console.error('Error sending user notification:', error);
    }
  }

  // Listen to admin notifications
  static listenToAdminNotifications(callback) {
    const adminNotificationsRef = ref(db, 'notifications/admin');
    return onValue(adminNotificationsRef, (snapshot) => {
      const notifications = [];
      if (snapshot.exists()) {
        const data = snapshot.val();
        Object.keys(data).forEach(key => {
          notifications.push({
            id: key,
            ...data[key]
          });
        });
        // Sort by timestamp (newest first)
        notifications.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      }
      callback(notifications);
    });
  }

  // Listen to user notifications
  static listenToUserNotifications(userId, callback) {
    const userNotificationsRef = ref(db, `notifications/users/${userId}`);
    return onValue(userNotificationsRef, (snapshot) => {
      const notifications = [];
      if (snapshot.exists()) {
        const data = snapshot.val();
        Object.keys(data).forEach(key => {
          notifications.push({
            id: key,
            ...data[key]
          });
        });
        // Sort by timestamp (newest first)
        notifications.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      }
      callback(notifications);
    });
  }

  // Mark notification as read
  static async markAsRead(notificationId, isAdmin = false, userId = null) {
    try {
      const notificationPath = isAdmin 
        ? `notifications/admin/${notificationId}`
        : `notifications/users/${userId}/${notificationId}`;
      
      const notificationRef = ref(db, notificationPath);
      await update(notificationRef, { read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  // Get unread count
  static getUnreadCount(notifications) {
    return notifications.filter(notification => !notification.read).length;
  }

  // Clear all notifications
  static async clearAllNotifications(isAdmin = false, userId = null) {
    try {
      const notificationsPath = isAdmin 
        ? 'notifications/admin'
        : `notifications/users/${userId}`;
      
      const notificationsRef = ref(db, notificationsPath);
      await update(notificationsRef, {});
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }
}

export default NotificationService;
