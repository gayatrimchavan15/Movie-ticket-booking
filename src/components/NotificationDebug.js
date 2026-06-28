import React, { useState, useEffect } from 'react';
import { ref, onValue, push, set } from 'firebase/database';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebaseConfig';

const NotificationDebug = () => {
  const [user] = useAuthState(auth);
  const [adminNotifications, setAdminNotifications] = useState([]);
  const [userNotifications, setUserNotifications] = useState([]);
  const [messages, setMessages] = useState([]);
  const [dbStatus, setDbStatus] = useState('Checking...');

  useEffect(() => {
    // Test database connection
    const testRef = ref(db, '.info/connected');
    onValue(testRef, (snapshot) => {
      if (snapshot.val() === true) {
        setDbStatus('✅ Connected to Firebase');
      } else {
        setDbStatus('❌ Not connected to Firebase');
      }
    });

    // Listen to admin notifications
    const adminRef = ref(db, 'notifications/admin');
    const adminUnsubscribe = onValue(adminRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const notificationsList = Object.entries(data).map(([id, notification]) => ({
          id,
          ...notification
        }));
        setAdminNotifications(notificationsList);
      } else {
        setAdminNotifications([]);
      }
    });

    // Listen to user notifications (if logged in)
    let userUnsubscribe = null;
    if (user?.uid) {
      const userRef = ref(db, `notifications/users/${user.uid}`);
      userUnsubscribe = onValue(userRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const notificationsList = Object.entries(data).map(([id, notification]) => ({
            id,
            ...notification
          }));
          setUserNotifications(notificationsList);
        } else {
          setUserNotifications([]);
        }
      });
    }

    // Listen to messages
    const messagesRef = ref(db, 'messages');
    const messagesUnsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const messagesList = Object.entries(data).map(([id, message]) => ({
          id,
          ...message
        }));
        setMessages(messagesList);
      } else {
        setMessages([]);
      }
    });

    return () => {
      adminUnsubscribe();
      userUnsubscribe && userUnsubscribe();
      messagesUnsubscribe();
    };
  }, [user]);

  const createTestMessage = async () => {
    try {
      const messageData = {
        userId: user?.uid || 'test-user',
        userName: user?.displayName || 'Test User',
        email: user?.email || 'test@example.com',
        subject: 'Test Message',
        message: 'This is a test message from debug component',
        timestamp: Date.now(),
        status: 'pending'
      };

      // Save message
      const messageRef = await push(ref(db, 'messages'), messageData);
      
      // Create admin notification
      const adminNotification = {
        type: 'NEW_USER_MESSAGE',
        userId: messageData.userId,
        userName: messageData.userName,
        userEmail: messageData.email,
        messageId: messageRef.key,
        messagePreview: messageData.message.substring(0, 50) + '...',
        subject: messageData.subject,
        timestamp: Date.now(),
        read: false
      };

      await push(ref(db, 'notifications/admin'), adminNotification);
      alert('✅ Test message and notification created!');
    } catch (error) {
      alert('❌ Error: ' + error.message);
      console.error('Error:', error);
    }
  };

  const createTestReply = async () => {
    if (messages.length === 0) {
      alert('No messages found. Create a test message first.');
      return;
    }

    try {
      const lastMessage = messages[messages.length - 1];
      
      // Create user notification
      const userNotification = {
        type: 'ADMIN_REPLY',
        messageId: lastMessage.id,
        replyPreview: 'This is a test admin reply...',
        originalMessage: lastMessage.message,
        timestamp: Date.now(),
        read: false
      };

      if (lastMessage.userId) {
        await push(ref(db, `notifications/users/${lastMessage.userId}`), userNotification);
        alert('✅ Test reply notification created!');
      } else {
        alert('❌ No userId found in message');
      }
    } catch (error) {
      alert('❌ Error: ' + error.message);
      console.error('Error:', error);
    }
  };

  const clearAllData = async () => {
    try {
      await set(ref(db, 'notifications'), null);
      await set(ref(db, 'messages'), null);
      alert('✅ All test data cleared!');
    } catch (error) {
      alert('❌ Error: ' + error.message);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>🔧 Notification System Debug</h2>

      <div style={styles.section}>
        <h3>Database Status:</h3>
        <p>{dbStatus}</p>
      </div>

      <div style={styles.section}>
        <h3>User Info:</h3>
        <p>Logged in: {user ? '✅ Yes' : '❌ No'}</p>
        {user && (
          <div>
            <p>Email: {user.email}</p>
            <p>UID: {user.uid}</p>
          </div>
        )}
      </div>

      <div style={styles.buttonGroup}>
        <button onClick={createTestMessage} style={styles.button}>
          📝 Create Test Message
        </button>
        <button onClick={createTestReply} style={styles.button}>
          💬 Create Test Reply
        </button>
        <button onClick={clearAllData} style={styles.dangerButton}>
          🗑️ Clear All Data
        </button>
      </div>

      <div style={styles.section}>
        <h3>Admin Notifications ({adminNotifications.length}):</h3>
        {adminNotifications.length > 0 ? (
          <div style={styles.list}>
            {adminNotifications.map((notif) => (
              <div key={notif.id} style={styles.item}>
                <strong>{notif.type}</strong> - {notif.userName} - {notif.messagePreview}
                <br />
                <small>Read: {notif.read ? '✅' : '❌'} | Time: {new Date(notif.timestamp).toLocaleString()}</small>
              </div>
            ))}
          </div>
        ) : (
          <p>No admin notifications found</p>
        )}
      </div>

      <div style={styles.section}>
        <h3>User Notifications ({userNotifications.length}):</h3>
        {userNotifications.length > 0 ? (
          <div style={styles.list}>
            {userNotifications.map((notif) => (
              <div key={notif.id} style={styles.item}>
                <strong>{notif.type}</strong> - {notif.replyPreview}
                <br />
                <small>Read: {notif.read ? '✅' : '❌'} | Time: {new Date(notif.timestamp).toLocaleString()}</small>
              </div>
            ))}
          </div>
        ) : (
          <p>No user notifications found</p>
        )}
      </div>

      <div style={styles.section}>
        <h3>Messages ({messages.length}):</h3>
        {messages.length > 0 ? (
          <div style={styles.list}>
            {messages.map((msg) => (
              <div key={msg.id} style={styles.item}>
                <strong>{msg.subject}</strong> - {msg.userName}
                <br />
                <small>{msg.message}</small>
                <br />
                <small>Status: {msg.status} | Time: {new Date(msg.timestamp).toLocaleString()}</small>
              </div>
            ))}
          </div>
        ) : (
          <p>No messages found</p>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '800px',
    margin: '20px auto',
    padding: '20px',
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    fontFamily: "'Inter', sans-serif"
  },
  title: {
    textAlign: 'center',
    color: '#333',
    marginBottom: '30px'
  },
  section: {
    marginBottom: '25px',
    padding: '15px',
    background: '#f8f9fa',
    borderRadius: '8px'
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px',
    flexWrap: 'wrap'
  },
  button: {
    padding: '10px 16px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
    fontWeight: '500'
  },
  dangerButton: {
    padding: '10px 16px',
    background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
    fontWeight: '500'
  },
  list: {
    maxHeight: '200px',
    overflowY: 'auto'
  },
  item: {
    padding: '10px',
    background: 'white',
    marginBottom: '8px',
    borderRadius: '6px',
    border: '1px solid #e0e0e0',
    fontSize: '14px'
  }
};

export default NotificationDebug;
