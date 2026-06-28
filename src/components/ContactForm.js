// User Contact Form Component
import React, { useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebaseConfig';
import { ref, push, serverTimestamp } from 'firebase/database';
import NotificationService from '../utils/notificationService';

const ContactForm = ({ isModal = false, onClose = null }) => {
  const [user] = useAuthState(auth);
  const [formData, setFormData] = useState({
    name: user?.displayName || '',
    email: user?.email || '',
    mobile: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.message.trim() || !formData.email.trim()) {
      setSubmitStatus({ type: 'error', message: 'Please fill in required fields' });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // Save message to database
      const messagesRef = ref(db, 'messages');
      const messageData = {
        ...formData,
        userId: user?.uid || null,
        userName: formData.name || 'Anonymous',
        userEmail: formData.email,
        timestamp: serverTimestamp(),
        status: 'unread',
        adminReply: null
      };

      const newMessageRef = await push(messagesRef, messageData);
      
      // Send notification to admin
      await NotificationService.notifyAdminNewMessage({
        messageId: newMessageRef.key,
        userId: user?.uid || 'anonymous',
        userName: formData.name || 'Anonymous User',
        userEmail: formData.email,
        message: formData.message,
        subject: formData.subject
      });

      setSubmitStatus({ 
        type: 'success', 
        message: 'Message sent successfully! We will get back to you soon.' 
      });

      // Reset form
      setFormData({
        name: user?.displayName || '',
        email: user?.email || '',
        mobile: '',
        subject: '',
        message: ''
      });

      // Close modal after success if it's a modal
      if (isModal && onClose) {
        setTimeout(() => {
          onClose();
        }, 2000);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      setSubmitStatus({ 
        type: 'error', 
        message: 'Failed to send message. Please try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const containerStyle = isModal ? styles.modalContainer : styles.pageContainer;

  return (
    <div style={containerStyle}>
      {isModal && (
        <div style={styles.modalOverlay} onClick={onClose}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Contact Support</h2>
              <button style={styles.closeButton} onClick={onClose}>×</button>
            </div>
            <ContactFormContent 
              formData={formData}
              handleInputChange={handleInputChange}
              handleSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              submitStatus={submitStatus}
              isModal={isModal}
            />
          </div>
        </div>
      )}
      
      {!isModal && (
        <div style={styles.pageContent}>
          <div style={styles.header}>
            <h1 style={styles.title}>📞 Contact Us</h1>
            <p style={styles.subtitle}>We'd love to hear from you. Send us a message!</p>
          </div>
          <ContactFormContent 
            formData={formData}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            submitStatus={submitStatus}
            isModal={isModal}
          />
        </div>
      )}
    </div>
  );
};

const ContactFormContent = ({ formData, handleInputChange, handleSubmit, isSubmitting, submitStatus, isModal }) => (
  <form onSubmit={handleSubmit} style={{...styles.form, padding: isModal ? '0 30px 30px' : '0'}}>
    <div style={styles.formGrid}>
      <div style={styles.formGroup}>
        <label style={styles.label}>Name *</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          style={styles.input}
          placeholder="Your full name"
          required
        />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Email *</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          style={styles.input}
          placeholder="your.email@example.com"
          required
        />
      </div>
    </div>

    <div style={styles.formGrid}>
      <div style={styles.formGroup}>
        <label style={styles.label}>Mobile</label>
        <input
          type="tel"
          name="mobile"
          value={formData.mobile}
          onChange={handleInputChange}
          style={styles.input}
          placeholder="+1 (555) 123-4567"
        />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Subject</label>
        <select
          name="subject"
          value={formData.subject}
          onChange={handleInputChange}
          style={styles.select}
        >
          <option value="">Select a subject</option>
          <option value="booking-issue">Booking Issue</option>
          <option value="payment-problem">Payment Problem</option>
          <option value="technical-support">Technical Support</option>
          <option value="refund-request">Refund Request</option>
          <option value="general-inquiry">General Inquiry</option>
          <option value="feedback">Feedback</option>
          <option value="other">Other</option>
        </select>
      </div>
    </div>

    <div style={styles.formGroup}>
      <label style={styles.label}>Message *</label>
      <textarea
        name="message"
        value={formData.message}
        onChange={handleInputChange}
        style={styles.textarea}
        placeholder="Please describe your issue or inquiry in detail..."
        rows="6"
        required
      />
    </div>

    {submitStatus && (
      <div style={{
        ...styles.statusMessage,
        ...(submitStatus.type === 'success' ? styles.successMessage : styles.errorMessage)
      }}>
        {submitStatus.type === 'success' ? '✅' : '❌'} {submitStatus.message}
      </div>
    )}

    <button
      type="submit"
      disabled={isSubmitting}
      style={{
        ...styles.submitButton,
        ...(isSubmitting ? styles.submitButtonDisabled : {})
      }}
    >
      {isSubmitting ? (
        <>
          <span style={styles.spinner}>⏳</span>
          Sending...
        </>
      ) : (
        <>
          📤 Send Message
        </>
      )}
    </button>
  </form>
);

const styles = {
  pageContainer: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '40px 20px',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
  },
  pageContent: {
    maxWidth: '800px',
    margin: '0 auto',
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderRadius: '20px',
    padding: '40px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
  },
  modalContainer: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10000
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px'
  },
  modalContent: {
    background: 'white',
    borderRadius: '16px',
    maxWidth: '600px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 30px',
    borderBottom: '1px solid #e5e7eb'
  },
  modalTitle: {
    margin: 0,
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#374151'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#6b7280',
    padding: '5px',
    borderRadius: '50%',
    width: '35px',
    height: '35px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  header: {
    textAlign: 'center',
    marginBottom: '40px'
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: '800',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    margin: '0 0 10px 0',
    letterSpacing: '-0.5px'
  },
  subtitle: {
    fontSize: '1.1rem',
    color: '#6b7280',
    margin: 0
  },
  form: {
    padding: '0'
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '20px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151'
  },
  input: {
    padding: '12px 16px',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    background: 'white',
    transition: 'all 0.2s ease',
    outline: 'none'
  },
  select: {
    padding: '12px 16px',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    background: 'white',
    transition: 'all 0.2s ease',
    outline: 'none',
    cursor: 'pointer'
  },
  textarea: {
    padding: '12px 16px',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    background: 'white',
    transition: 'all 0.2s ease',
    outline: 'none',
    resize: 'vertical',
    minHeight: '120px'
  },
  submitButton: {
    width: '100%',
    padding: '16px 24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  },
  submitButtonDisabled: {
    opacity: 0.7,
    cursor: 'not-allowed'
  },
  statusMessage: {
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '20px',
    textAlign: 'center'
  },
  successMessage: {
    background: '#f0fdf4',
    color: '#166534',
    border: '1px solid #dcfce7'
  },
  errorMessage: {
    background: '#fef2f2',
    color: '#dc2626',
    border: '1px solid #fecaca'
  },
  spinner: {
    animation: 'spin 1s linear infinite'
  }
};

export default ContactForm;
