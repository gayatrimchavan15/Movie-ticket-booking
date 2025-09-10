import React, { useState } from "react";
import Sidebar from "./Sidebar";

export default function Settings() {
  const [theme, setTheme] = useState("light");
  const [message, setMessage] = useState("");

  function handleChangeTheme(newTheme) {
    setTheme(newTheme);
    setMessage(`Theme switched to ${newTheme}!`);
    // In a full app: you'd store this in context or localStorage for global effect
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f3f7fa" }}>
      <Sidebar activePath="/admin/settings" />
      <div style={{ flex: 1, padding: "40px 30px" }}>
        <h2 style={{ color: "#232946", fontWeight: "bold", fontSize: 30, marginBottom: 34 }}>
          Settings
        </h2>
        {/* Profile Section */}
        <div style={cardStyle}>
          <h3 style={sectionHeaderStyle}>Profile Details</h3>
          <p style={{ color: "#6246ea", fontWeight: 500 }}>
            Admin Name: <span style={{ color: "#232946", fontWeight: "bold" }}>Admin</span>
          </p>
          <p style={{ color: "#3777ee", fontWeight: 500 }}>
            Email: <span style={{ color: "#232946", fontWeight: "bold" }}>admin@movieticket.com</span>
          </p>
        </div>
        {/* Theme Switch Section */}
        <div style={cardStyle}>
          <h3 style={sectionHeaderStyle}>Theme</h3>
          <div style={{ display: 'flex', gap: 16 }}>
            <button
              style={themeBtnStyle(theme === "light")}
              onClick={() => handleChangeTheme("light")}
            >
              Light Mode
            </button>
            <button
              style={themeBtnStyle(theme === "dark")}
              onClick={() => handleChangeTheme("dark")}
            >
              Dark Mode
            </button>
          </div>
          {message && <div style={{
            color: "#27ae60", marginTop: 14, fontWeight: 600
          }}>{message}</div>}
        </div>
        {/* More settings could be added here */}
        <div style={cardStyle}>
          <h3 style={{ ...sectionHeaderStyle, color: "#b59400" }}>Change Password</h3>
          <p style={{ color: "#9c98aa" }}>
            (Feature Coming Soon)
          </p>
        </div>
      </div>
    </div>
  );
}

// Internal CSS styles
const cardStyle = {
  background: "#fff",
  borderRadius: 13,
  boxShadow: "0 2px 10px #6246ea11",
  padding: "24px 26px",
  marginBottom: 28,
  maxWidth: 520
};
const sectionHeaderStyle = {
  color: "#5145cd",
  fontWeight: 700,
  fontSize: 22,
  marginBottom: 20
};
const themeBtnStyle = (active) => ({
  background: active ? "linear-gradient(90deg,#6246ea,#3777ee)" : "#eaeafe",
  color: active ? "#fff" : "#232946",
  border: "none",
  borderRadius: 6,
  padding: "12px 26px",
  fontWeight: 600,
  fontSize: "16px",
  boxShadow: active ? "0 2px 10px #3777ee33" : "none",
  cursor: "pointer",
  transition: "background .14s"
});