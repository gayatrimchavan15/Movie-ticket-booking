// Enhanced User Navigation with Notification Bell
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import UserNotificationBell from './UserNotificationBell';

const UserNavigation = () => {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav style={styles.navbar}>
      <div style={styles.navContainer}>
        <Link to="/" style={styles.logo}>
          🎬 MovieBooking
        </Link>

        <div style={styles.navLinks}>
          <Link to="/movies" style={styles.navLink}>Movies</Link>
          <Link to="/theaters" style={styles.navLink}>Theaters</Link>
          
          {user ? (
            <div style={styles.userSection}>
              <Link to="/user-messages" style={styles.navLink}>
                💬 My Messages
              </Link>
              <Link to="/contact" style={styles.navLink}>
                📞 Contact
              </Link>
              <UserNotificationBell />
              <div style={styles.userInfo}>
                <span style={styles.userName}>
                  👋 {user.displayName || user.email}
                </span>
                <button onClick={handleLogout} style={styles.logoutBtn}>
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <div style={styles.authSection}>
              <Link to="/contact" style={styles.navLink}>
                📞 Contact
              </Link>
              <Link to="/login" style={styles.loginBtn}>Login</Link>
              <Link to="/register" style={styles.registerBtn}>Register</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

const styles = {
  navbar: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
  },
  navContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '70px'
  },
  logo: {
    fontSize: '1.5rem',
    fontWeight: '800',
    color: 'white',
    textDecoration: 'none',
    letterSpacing: '-0.5px'
  },
  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px'
  },
  navLink: {
    color: 'rgba(255, 255, 255, 0.9)',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500',
    padding: '8px 12px',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      color: 'white'
    }
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 16px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    backdropFilter: 'blur(10px)'
  },
  userName: {
    color: 'white',
    fontSize: '14px',
    fontWeight: '500'
  },
  logoutBtn: {
    background: 'rgba(255, 255, 255, 0.2)',
    color: 'white',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  authSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  loginBtn: {
    color: 'white',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500',
    padding: '8px 16px',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '8px',
    transition: 'all 0.2s ease'
  },
  registerBtn: {
    background: 'rgba(255, 255, 255, 0.2)',
    color: 'white',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '600',
    padding: '8px 16px',
    borderRadius: '8px',
    transition: 'all 0.2s ease'
  }
};

export default UserNavigation;
