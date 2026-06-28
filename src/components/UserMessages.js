// User Messages Page - View conversations with admin
import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebaseConfig';
import { ref, onValue, query, orderByChild, equalTo } from 'firebase/database';
import ContactForm from './ContactForm';
import UserNotificationBell from './UserNotificationBell';

const UserMessages = () => {
  const [user] = useAuthState(auth);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showContactForm, setShowContactForm] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Fetch user's messages
    const messagesRef = ref(db, 'messages');
    const userMessagesQuery = query(messagesRef, orderByChild('userId'), equalTo(user.uid));
    
    const unsubscribe = onValue(userMessagesQuery, (snapshot) => {
      const messagesData = [];
      if (snapshot.exists()) {
        const data = snapshot.val();
        Object.keys(data).forEach(key => {
          messagesData.push({
            id: key,
            ...data[key]
          });
        });
        // Sort by timestamp (newest first)
        messagesData.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      }
      setMessages(messagesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Just now';
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getStatusColor = (message) => {
    if (message.adminReply) return '#10B981'; // Green - replied
    return '#F59E0B'; // Orange - pending
  };

  const getStatusText = (message) => {
    if (message.adminReply) return 'Replied';
    return 'Pending';
  };

  if (!user) {
    return (
      <div style={styles.container}>
        <div style={styles.loginPrompt}>
          <h2 style={styles.loginTitle}>Please Login</h2>
          <p style={styles.loginText}>You need to be logged in to view your messages.</p>
          <button 
            style={styles.loginButton}
            onClick={() => window.location.href = '/login'}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.title}>💬 My Messages</h1>
          <p style={styles.subtitle}>View your conversations with support team</p>
        </div>
        <div style={styles.headerRight}>
          <UserNotificationBell />
          <button 
            style={styles.newMessageButton}
            onClick={() => setShowContactForm(true)}
          >
            ✉️ New Message
          </button>
        </div>
      </div>

      {loading ? (
        <div style={styles.loading}>
          <div style={styles.spinner}>⏳</div>
          <p>Loading your messages...</p>
        </div>
      ) : (
        <div style={styles.content}>
          {messages.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>📭</div>
              <h3 style={styles.emptyTitle}>No Messages Yet</h3>
              <p style={styles.emptyText}>
                You haven't sent any messages to support yet. 
                Click "New Message" to get started!
              </p>
              <button 
                style={styles.emptyButton}
                onClick={() => setShowContactForm(true)}
              >
                Send Your First Message
              </button>
            </div>
          ) : (
            <div style={styles.messagesList}>
              {messages.map((message) => (
                <div 
                  key={message.id} 
                  style={styles.messageCard}
                  onClick={() => setSelectedMessage(selectedMessage === message.id ? null : message.id)}
                >
                  <div style={styles.messageHeader}>
                    <div style={styles.messageInfo}>
                      <div style={styles.messageSubject}>
                        {message.subject || 'General Inquiry'}
                      </div>
                      <div style={styles.messageDate}>
                        {formatTimestamp(message.timestamp)}
                      </div>
                    </div>
                    <div style={styles.messageStatus}>
                      <span 
                        style={{
                          ...styles.statusBadge,
                          backgroundColor: getStatusColor(message) + '20',
                          color: getStatusColor(message)
                        }}
                      >
                        {getStatusText(message)}
                      </span>
                    </div>
                  </div>

                  <div style={styles.messagePreview}>
                    {message.message.length > 100 
                      ? message.message.substring(0, 100) + '...'
                      : message.message
                    }
                  </div>

                  {selectedMessage === message.id && (
                    <div style={styles.messageDetails}>
                      <div style={styles.fullMessage}>
                        <h4 style={styles.sectionTitle}>Your Message:</h4>
                        <p style={styles.messageText}>{message.message}</p>
                      </div>

                      {message.adminReply ? (
                        <div style={styles.adminReply}>
                          <h4 style={styles.sectionTitle}>Support Reply:</h4>
                          <div style={styles.replyContent}>
                            <div style={styles.replyIcon}>👨‍💼</div>
                            <div style={styles.replyText}>
                              {message.adminReply}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div style={styles.pendingReply}>
                          <div style={styles.pendingIcon}>⏰</div>
                          <div style={styles.pendingText}>
                            Waiting for support team response...
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showContactForm && (
        <ContactForm 
          isModal={true}
          onClose={() => setShowContactForm(false)}
        />
      )}
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '30px',
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
  },
  headerLeft: {
    flex: 1
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  title: {
    fontSize: '2rem',
    fontWeight: '800',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    margin: '0 0 8px 0'
  },
  subtitle: {
    fontSize: '1rem',
    color: '#6b7280',
    margin: 0
  },
  newMessageButton: {
    padding: '12px 20px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
  },
  content: {
    maxWidth: '800px',
    margin: '0 auto'
  },
  loading: {
    textAlign: 'center',
    padding: '60px 20px',
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '16px',
    color: '#6b7280'
  },
  spinner: {
    fontSize: '48px',
    marginBottom: '16px',
    display: 'block'
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '20px',
    display: 'block'
  },
  emptyTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#374151',
    margin: '0 0 12px 0'
  },
  emptyText: {
    fontSize: '1rem',
    color: '#6b7280',
    margin: '0 0 24px 0',
    lineHeight: '1.5'
  },
  emptyButton: {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  messagesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  messageCard: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: '1px solid rgba(255,255,255,0.2)'
  },
  messageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px'
  },
  messageInfo: {
    flex: 1
  },
  messageSubject: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '4px'
  },
  messageDate: {
    fontSize: '12px',
    color: '#9ca3af'
  },
  messageStatus: {
    marginLeft: '16px'
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  messagePreview: {
    fontSize: '14px',
    color: '#6b7280',
    lineHeight: '1.5'
  },
  messageDetails: {
    marginTop: '20px',
    paddingTop: '20px',
    borderTop: '1px solid #e5e7eb'
  },
  fullMessage: {
    marginBottom: '20px'
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    margin: '0 0 8px 0',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  messageText: {
    fontSize: '14px',
    color: '#4b5563',
    lineHeight: '1.6',
    margin: 0,
    padding: '12px',
    background: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb'
  },
  adminReply: {
    background: '#f0f9ff',
    padding: '16px',
    borderRadius: '12px',
    border: '1px solid #e0f2fe'
  },
  replyContent: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start'
  },
  replyIcon: {
    fontSize: '20px',
    marginTop: '2px'
  },
  replyText: {
    fontSize: '14px',
    color: '#0369a1',
    lineHeight: '1.6',
    flex: 1
  },
  pendingReply: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    background: '#fef3c7',
    borderRadius: '12px',
    border: '1px solid #fde68a'
  },
  pendingIcon: {
    fontSize: '20px'
  },
  pendingText: {
    fontSize: '14px',
    color: '#92400e',
    fontStyle: 'italic'
  },
  loginPrompt: {
    textAlign: 'center',
    padding: '60px 20px',
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    maxWidth: '400px',
    margin: '100px auto'
  },
  loginTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#374151',
    margin: '0 0 12px 0'
  },
  loginText: {
    fontSize: '1rem',
    color: '#6b7280',
    margin: '0 0 24px 0'
  },
  loginButton: {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  }
};

export default UserMessages;
