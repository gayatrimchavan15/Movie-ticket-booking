import React from "react";
import { useNavigate } from "react-router-dom";
import { signOut, getAuth } from "firebase/auth";
import { auth } from "../../firebaseConfig";
import NotificationBell from "./NotificationBell";

const menuItems = [
  { label: "Dashboard", path: "/admin/AdminDashboard" },
  { label: "Manage Movies", path: "/admin/managemovies" },
  { label: "Manage Cities & Theaters", path: "/admin/managecitiestheaters" },
  { label: "Manage Showtimes", path: "/admin/manageshowtimes" },
  { label: "Booking Management", path: "/admin/bookingmanagement" },
  { label: "User Management", path: "/admin/usermanagement" },
  { label: "Reports & Analytics", path: "/admin/ReportsAnalytics" },
  { label: "Settings", path: "/admin/settings" },
  { label: "Feedback", path: "/admin/feedbackmanagement" },
  { label: "Logout", path: "/admin/logout" }
];

export default function Sidebar({ activePath }) {
  const navigate = useNavigate();

  // 🔹 Handle navigation or logout with confirmation
  const handleNavigation = (item) => {
    if (item.label === "Logout") {
      const confirmLogout = window.confirm("Are you sure you want to logout?");
      if (confirmLogout) {
        // ✅ Firebase sign out
        signOut(auth)
          .then(() => {
            // Clear any localStorage session
            localStorage.removeItem("adminLoggedIn");
            localStorage.removeItem("adminEmail");

            // Redirect to homepage
            navigate("/");

            // Optional success alert
            alert("You have been logged out successfully!");
          })
          .catch((error) => {
            console.error("Logout error:", error);
            alert("Error logging out. Please try again.");
          });
      }
    } else {
      navigate(item.path);
    }
  };

  const getMenuIcon = (label) => {
    const icons = {
      "Dashboard": "🏠",
      "Manage Movies": "🎬",
      "Manage Cities & Theaters": "🏢",
      "Manage Showtimes": "🕐",
      "Booking Management": "📋",
      "User Management": "👥",
      "Reports & Analytics": "📊",
      "Settings": "⚙️",
      "Feedback": "💬",
      "Logout": "🚪"
    };
    return icons[label] || "📄";
  };

  return (
    <div style={sidebarStyle}>
      <div style={logoStyle}>
        <div style={logoIconStyle}>🎬</div>
        <div style={logoTextStyle}>Admin Panel</div>
        <div style={notificationContainer}>
          <NotificationBell />
        </div>
      </div>

      {menuItems.map((item) => (
        <div
          key={item.path}
          onClick={() => handleNavigation(item)}
          style={{
            ...menuItemStyle,
            background:
              activePath === item.path
                ? "rgba(102, 126, 234, 0.15)"
                : "transparent",
            color: item.label === "Logout" ? "#ef4444" : 
                   activePath === item.path ? "#667eea" : "#cbd5e1",
            fontWeight: activePath === item.path ? "600" : "500",
            borderLeft: activePath === item.path ? "3px solid #667eea" : "3px solid transparent",
            transform: activePath === item.path ? "translateX(5px)" : "translateX(0)",
            boxShadow: activePath === item.path ? "0 4px 15px rgba(102, 126, 234, 0.2)" : "none"
          }}
          onMouseEnter={(e) => {
            if (activePath !== item.path) {
              e.currentTarget.style.background = "rgba(255,255,255,0.08)";
              e.currentTarget.style.transform = "translateX(3px)";
            }
          }}
          onMouseLeave={(e) => {
            if (activePath !== item.path) {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.transform = "translateX(0)";
            }
          }}
        >
          <span style={{ fontSize: "18px", width: "20px", textAlign: "center" }}>
            {getMenuIcon(item.label)}
          </span>
          <span>{item.label}</span>
          {activePath === item.path && (
            <div style={{
              position: "absolute",
              right: "16px",
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "#667eea",
              boxShadow: "0 0 8px rgba(102, 126, 234, 0.6)"
            }}></div>
          )}
        </div>
      ))}
    </div>
  );
}

// ===== 🎨 Modern Professional Styles =====
const sidebarStyle = {
  width: 260,
  background: "linear-gradient(180deg, #1e293b 0%, #0f172a 100%)",
  padding: "30px 20px",
  minHeight: "100vh",
  height: "100vh",
  boxSizing: "border-box",
  boxShadow: "4px 0 30px rgba(0, 0, 0, 0.3)",
  position: "fixed",
  top: 0,
  left: 0,
  zIndex: 1000,
  overflowY: "auto",
  overflowX: "hidden",
  borderRight: "1px solid rgba(255, 255, 255, 0.1)",
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
};

const logoStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  marginBottom: "40px",
  padding: "20px 0",
  borderBottom: "1px solid rgba(255, 255, 255, 0.1)"
};

const notificationContainer = {
  display: "flex",
  alignItems: "center"
};

const logoIconStyle = {
  fontSize: "2rem",
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  borderRadius: "12px",
  width: "45px",
  height: "45px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 4px 15px rgba(102, 126, 234, 0.3)"
};

const logoTextStyle = {
  fontSize: "1.4rem",
  fontWeight: "800",
  background: "linear-gradient(135deg, #f8fafc 0%, #cbd5e1 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  letterSpacing: "-0.5px"
};

const menuItemStyle = {
  padding: "16px 20px",
  borderRadius: "12px",
  fontSize: "15px",
  cursor: "pointer",
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  marginBottom: "8px",
  display: "flex",
  alignItems: "center",
  gap: "12px",
  fontWeight: "500",
  position: "relative",
  overflow: "hidden"
};
