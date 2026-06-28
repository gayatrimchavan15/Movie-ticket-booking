import React, { useState, useEffect } from "react";
import { Routes, Route, Link, useNavigate, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../firebaseConfig";

// Pages
import Dashboard from "./Dashboard";
import BookingHistory from "./BookingHistory";
import Movies from "../Movies"; // Movies.js page
import Profile from "./Profile";
import Feedback from "./Feedback";

function UserDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activePath, setActivePath] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    setActivePath(location.pathname);
  }, [location]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const navItems = [
    { path: "", icon: "🏠", text: "Dashboard" },
    { path: "booking-history", icon: "🎟️", text: "Booking History" },
    { path: "browse-movies", icon: "🎬", text: "Browse Movies" },
    { path: "profile", icon: "👤", text: "Profile" },
    { path: "feedback", icon: "💬", text: "Feedback" }
  ];

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={{
        ...styles.sidebar,
        transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)'
      }}>
        {/* Sidebar Header */}
        <div style={styles.sidebarHeader}>
          <div style={styles.logoSection}>
            <div style={styles.logoIcon}>🎬</div>
            <div style={styles.logoText}>
              <h2 style={styles.logoTitle}>MovieMart</h2>
              <p style={styles.logoSubtitle}>User Portal</p>
            </div>
          </div>
          <button 
            style={styles.sidebarToggle}
            onClick={toggleSidebar}
          >
            ✕
          </button>
        </div>

        {/* Navigation */}
        <nav style={styles.nav}>
          {navItems.map((item) => (
            <Link 
              key={item.path}
              to={item.path} 
              style={{
                ...styles.navLink,
                ...(activePath.includes(item.path) && item.path !== "" ? styles.navLinkActive : {}),
                ...(activePath === "/user" && item.path === "" ? styles.navLinkActive : {})
              }}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              <span style={styles.navText}>{item.text}</span>
              <div style={styles.navIndicator}></div>
            </Link>
          ))}
        </nav>

        {/* Logout Section */}
        <div style={styles.logoutSection}>
          <button 
            style={styles.logoutButton}
            onClick={handleLogout}
          >
            <span style={styles.logoutIcon}>🚪</span>
            <span style={styles.logoutText}>Logout</span>
          </button>
        </div>

        {/* Sidebar Footer */}
        <div style={styles.sidebarFooter}>
          <div style={styles.userStats}>
            <div style={styles.statItem}>
              <span style={styles.statNumber}>🎯</span>
              <span style={styles.statLabel}>Premium</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        {/* Top Bar */}
        <div style={styles.topBar}>
          <div style={styles.topBarLeft}>
            <button 
              style={styles.menuButton}
              onClick={toggleSidebar}
            >
              ☰
            </button>
            <div style={styles.breadcrumb}>
              {navItems.find(item => 
                activePath.includes(item.path) && item.path !== ""
              )?.text || "Dashboard"}
            </div>
          </div>
          <div style={styles.topBarRight}>
            <div style={styles.userWelcome}>
              Welcome back! 🎉
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div style={styles.contentArea}>
          <Routes>
            <Route path="" element={<Dashboard />} />
            <Route path="booking-history" element={<BookingHistory />} />
            <Route path="browse-movies" element={<Movies />} />
            <Route path="profile" element={<Profile />} />
            <Route path="feedback" element={<Feedback />} />
          </Routes>
        </div>
      </div>

      {/* Mobile Overlay */}
      {!isSidebarOpen && (
        <div 
          style={styles.mobileOverlay}
          onClick={toggleSidebar}
        />
      )}
    </div>
  );
}

// Enhanced Styles
const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    fontFamily: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
    backgroundColor: "#0f172a",
    position: "relative",
  },
  
  // Sidebar Styles
  sidebar: {
    width: "300px",
    background: "linear-gradient(180deg, #1e293b 0%, #0f172a 100%)",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    position: "fixed",
    top: 0,
    left: 0,
    height: "100vh",
    zIndex: 1000,
    transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    borderRight: "1px solid rgba(255, 255, 255, 0.1)",
    boxShadow: "4px 0 30px rgba(0, 0, 0, 0.3)",
  },
  
  sidebarHeader: {
    padding: "30px 25px 25px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "rgba(255, 255, 255, 0.02)",
  },
  
  logoSection: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  
  logoIcon: {
    fontSize: "2.5rem",
    background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
    borderRadius: "12px",
    width: "50px",
    height: "50px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 15px rgba(59, 130, 246, 0.3)",
  },
  
  logoText: {
    display: "flex",
    flexDirection: "column",
  },
  
  logoTitle: {
    margin: "0",
    fontSize: "1.5rem",
    fontWeight: "800",
    background: "linear-gradient(135deg, #f8fafc 0%, #cbd5e1 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    letterSpacing: "-0.5px",
  },
  
  logoSubtitle: {
    margin: "2px 0 0 0",
    fontSize: "0.75rem",
    color: "#94a3b8",
    fontWeight: "500",
    letterSpacing: "0.5px",
  },
  
  sidebarToggle: {
    background: "rgba(255, 255, 255, 0.1)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    color: "#fff",
    borderRadius: "8px",
    width: "32px",
    height: "32px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1rem",
    transition: "all 0.3s ease",
  },
  
  // Navigation Styles
  nav: {
    flex: 1,
    padding: "25px 20px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  
  navLink: {
    color: "#cbd5e1",
    padding: "16px 20px",
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    borderRadius: "12px",
    backgroundColor: "transparent",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    border: "1px solid transparent",
    fontWeight: "500",
    fontSize: "15px",
    position: "relative",
    overflow: "hidden",
  },
  
  navLinkActive: {
    backgroundColor: "rgba(59, 130, 246, 0.15)",
    color: "#3b82f6",
    borderColor: "rgba(59, 130, 246, 0.3)",
    transform: "translateX(5px)",
  },
  
  navIcon: {
    fontSize: "1.25rem",
    marginRight: "15px",
    width: "24px",
    textAlign: "center",
    transition: "all 0.3s ease",
  },
  
  navText: {
    flex: 1,
    fontWeight: "500",
  },
  
  navIndicator: {
    width: "4px",
    height: "20px",
    backgroundColor: "#3b82f6",
    borderRadius: "2px",
    opacity: 0,
    transition: "all 0.3s ease",
  },
  
  // Logout Section
  logoutSection: {
    padding: "20px",
    borderTop: "1px solid rgba(255, 255, 255, 0.1)",
  },
  
  logoutButton: {
    padding: "16px 20px",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    color: "#ef4444",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "600",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    display: "flex",
    alignItems: "center",
    width: "100%",
    fontSize: "15px",
    position: "relative",
    overflow: "hidden",
  },
  
  logoutIcon: {
    fontSize: "1.25rem",
    marginRight: "15px",
    width: "24px",
    textAlign: "center",
  },
  
  logoutText: {
    flex: 1,
    fontWeight: "500",
  },
  
  // Sidebar Footer
  sidebarFooter: {
    padding: "20px",
    borderTop: "1px solid rgba(255, 255, 255, 0.1)",
  },
  
  userStats: {
    display: "flex",
    justifyContent: "center",
  },
  
  statItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
  },
  
  statNumber: {
    fontSize: "1.5rem",
  },
  
  statLabel: {
    fontSize: "0.75rem",
    color: "#94a3b8",
    fontWeight: "500",
  },
  
  // Main Content Styles
  mainContent: {
    flex: 1,
    marginLeft: "300px",
    backgroundColor: "#0f172a",
    minHeight: "100vh",
    transition: "margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    position: "relative",
  },
  
  // Top Bar Styles
  topBar: {
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
    padding: "20px 30px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backdropFilter: "blur(10px)",
  },
  
  topBarLeft: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
  },
  
  menuButton: {
    background: "rgba(255, 255, 255, 0.1)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    color: "#fff",
    borderRadius: "8px",
    width: "40px",
    height: "40px",
    cursor: "pointer",
    display: "none",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.1rem",
    transition: "all 0.3s ease",
  },
  
  breadcrumb: {
    color: "#f8fafc",
    fontSize: "1.25rem",
    fontWeight: "600",
  },
  
  topBarRight: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
  },
  
  userWelcome: {
    color: "#cbd5e1",
    fontSize: "0.9rem",
    fontWeight: "500",
  },
  
  // Content Area
  contentArea: {
    padding: "30px",
    minHeight: "calc(100vh - 80px)",
  },
  
  // Mobile Overlay
  mobileOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 999,
    display: "none",
  },
  
  // Hover Effects (via inline styles)
  navLinkHover: {
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    color: "#3b82f6",
    borderColor: "rgba(59, 130, 246, 0.2)",
    transform: "translateX(5px)",
  },
  
  logoutButtonHover: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    transform: "translateY(-2px)",
    boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)",
  },
  
  menuButtonHover: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    transform: "scale(1.05)",
  },
};

// Add responsive styles
const responsiveStyles = `
  @media (max-width: 1024px) {
    .main-content {
      margin-left: 0 !important;
    }
    
    .sidebar {
      transform: translateX(-100%);
    }
    
    .sidebar.open {
      transform: translateX(0);
    }
    
    .menu-button {
      display: flex !important;
    }
    
    .mobile-overlay {
      display: block !important;
    }
  }
  
  @media (max-width: 768px) {
    .content-area {
      padding: 20px !important;
    }
    
    .top-bar {
      padding: 15px 20px !important;
    }
    
    .sidebar {
      width: 280px !important;
    }
  }
  
  @media (max-width: 480px) {
    .content-area {
      padding: 15px !important;
    }
    
    .sidebar {
      width: 100% !important;
    }
  }
`;

// Add CSS to document head
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = responsiveStyles;
  document.head.appendChild(styleElement);
}

export default UserDashboard;