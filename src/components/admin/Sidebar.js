import React from "react";
import { PrefetchPageLinks, useNavigate } from "react-router-dom";

const menuItems = [
  { label: "Dashboard", path: "/admin/AdminDashboard" },
  // { label: "Add Movie", path: "/admin/addmovie" },
  { label: "Manage Movies", path: "/admin/managemovies" },
  // { label: "Add City & Theaters", path: "/admin/addcitytheaters" },
  { label: "Manage Cities & Theaters", path: "/admin/managecitiestheaters" },
  // { label: "Add Showtime", path: "/admin/addshowtime" },
  { label: "Manage Showtimes", path: "/admin/manageshowtimes" },
  { label: "Booking Management", path: "/admin/bookingmanagement" },
  { label: "User Management", path: "/admin/usermanagement" },
  { label: "Reports & Analytics", path: "/admin/reportsanalytics" },
  { label: "Settings", path: "/admin/settings" },
  { label: "Logout", path: "/admin/logout" }
];

export default function Sidebar({ activePath }) {
  const navigate = useNavigate();

  return (
    <div style={sidebarStyle}>
      <div style={logoStyle}>🎬 Admin Panel</div>
      {menuItems.map(item => (
        <div
          key={item.path}
          onClick={() => navigate(item.path)}
          style={{
            ...menuItemStyle,
            background: activePath === item.path
              ? "linear-gradient(90deg,#3b82f6,#6a5af9)"
              : "transparent",
            color: item.label === "Logout" ? "#ff6b6b" : "#e5e7eb",
            fontWeight: activePath === item.path ? "bold" : "500",
            boxShadow: activePath === item.path
              ? "0 4px 12px rgba(0,0,0,0.2)"
              : "none"
          }}
          onMouseEnter={e => {
            if (activePath !== item.path)
              e.currentTarget.style.background = "rgba(255,255,255,0.08)";
          }}
          onMouseLeave={e => {
            if (activePath !== item.path)
              e.currentTarget.style.background = "transparent";
          }}
        >
          {item.label}
        </div>
      ))}
    </div>
  );
}

// ===== Styles =====
const sidebarStyle = {
  width: 260,
  background: "linear-gradient(180deg,#1e1f36,#27294f)",
  padding: "40px 18px 0 24px",
  minHeight: "100vh",
  boxSizing: "border-box",
  boxShadow: "2px 0 15px rgba(0,0,0,0.15)"
};

const logoStyle = {
  fontWeight: "bold",
  fontSize: 24,
  color: "#ffffff",
  marginBottom: 36,
  padding: "12px 0",
  letterSpacing: "1px",
  textShadow: "0 2px 8px rgba(0,0,0,0.4)"
};

const menuItemStyle = {
  padding: "14px 18px",
  borderRadius: 8,
  fontSize: 15,
  cursor: "pointer",
  transition: "all 0.2s ease",
  marginBottom: 8
};
