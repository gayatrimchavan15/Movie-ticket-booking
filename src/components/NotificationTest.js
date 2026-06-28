import React, { useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebaseConfig';
import NotificationService from '../utils/notificationService';

const NotificationTest = () => {
  const [user] = useAuthState(auth);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');

  const testAdminNotification = async () => {
    try {
      setStatus('Sending admin notification...');
      await NotificationService.notifyAdminNewMessage({
        messageId: 'test-' + Date.now(),
        userId: user?.uid || 'test-user',
        userName: user?.displayName || 'Test User',
        userEmail: user?.email || 'test@example.com',
        message: message || 'This is a test message',
        subject: 'Test Notification'
      });
      setStatus('✅ Admin notification sent successfully!');
    } catch (error) {
      setStatus('❌ Error: ' + error.message);
      console.error('Test error:', error);
    }
  };

  const testUserNotification = async () => {
    try {
      setStatus('Sending user notification...');
      await NotificationService.notifyUserAdminReply({
        userId: user?.uid || 'test-user',
        messageId: 'test-' + Date.now(),
        reply: 'This is a test admin reply',
        originalMessage: message || 'Original test message'
      });
      setStatus('✅ User notification sent successfully!');
    } catch (error) {
      setStatus('❌ Error: ' + error.message);
      console.error('Test error:', error);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>🔔 Notification System Test</h2>
      
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

      <div style={styles.section}>
        <label style={styles.label}>Test Message:</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter a test message..."
          style={styles.textarea}
        />
      </div>

      <div style={styles.buttonGroup}>
        <button onClick={testAdminNotification} style={styles.button}>
          🔔 Test Admin Notification
        </button>
        <button onClick={testUserNotification} style={styles.button}>
          🔔 Test User Notification
        </button>
      </div>

      {status && (
        <div style={styles.status}>
          {status}
        </div>
      )}

      <div style={styles.instructions}>
        <h4>Instructions:</h4>
        <ol>
          <li>Make sure you're logged in</li>
          <li>Enter a test message above</li>
          <li>Click "Test Admin Notification" to send notification to admin</li>
          <li>Click "Test User Notification" to send notification to user</li>
          <li>Check the notification bells in admin sidebar and user navigation</li>
        </ol>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '600px',
    margin: '50px auto',
    padding: '30px',
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
    marginBottom: '20px',
    padding: '15px',
    background: '#f8f9fa',
    borderRadius: '8px'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '600',
    color: '#333'
  },
  textarea: {
    width: '100%',
    height: '80px',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    fontFamily: 'inherit',
    resize: 'vertical'
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px'
  },
  button: {
    flex: 1,
    padding: '12px 20px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'transform 0.2s ease'
  },
  status: {
    padding: '12px',
    background: '#e8f5e8',
    border: '1px solid #4caf50',
    borderRadius: '6px',
    marginBottom: '20px',
    fontSize: '14px'
  },
  instructions: {
    background: '#fff3cd',
    padding: '15px',
    borderRadius: '6px',
    border: '1px solid #ffeaa7'
  }
};

export default NotificationTest;
