import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import { db } from "../../firebaseConfig";
import { ref, onValue, remove } from "firebase/database";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const usersRef = ref(db, "users");
    onValue(usersRef, snapshot => {
      const data = snapshot.val();
      setUsers(
        data
          ? Object.entries(data).map(([id, user]) => ({ id, ...user }))
          : []
      );
    });
  }, []);

  function handleDelete(id) {
    if (window.confirm("Delete this user?")) {
      remove(ref(db, `users/${id}`))
        .then(() => setMessage("✅ User deleted!"))
        .catch(() => setMessage("❌ Error deleting user."));
    }
  }

  return (
    <div style={containerStyle}>
      <Sidebar activePath="/admin/user-management" />
      <div style={mainContentStyle}>
        <h2 style={headingStyle}>👤 User Management</h2>

        {/* Message */}
        {message && (
          <div
            style={{
              marginBottom: 20,
              padding: "12px 16px",
              borderRadius: 8,
              background: message.includes("deleted") ? "#d4edda" : "#f8d7da",
              color: message.includes("deleted") ? "#155724" : "#721c24",
              fontSize: 15,
              fontWeight: 600,
            }}
          >
            {message}
          </div>
        )}

        {/* Table */}
        <div style={tableContainerStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Phone</th>
                <th style={thStyle}>Registered On</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td style={tdEmptyStyle} colSpan={5}>
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user, index) => (
                  <tr
                    key={user.id}
                    style={{
                      backgroundColor: index % 2 === 0 ? "#ffffff" : "#f9fbfd",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "#eef6ff")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        index % 2 === 0 ? "#ffffff" : "#f9fbfd")
                    }
                  >
                    <td style={tdNameStyle}>{user.name || user.fullName || "-"}</td>
                    <td style={tdEmailStyle}>{user.email || "-"}</td>
                    <td style={tdPhoneStyle}>{user.phone || user.mobile || "-"}</td>
                    <td style={tdRegStyle}>{user.registeredAt || user.date || "-"}</td>
                    <td style={tdActionStyle}>
                      <button style={deleteBtnStyle} onClick={() => handleDelete(user.id)}>
                        🗑 Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// --- Modern Professional Styles ---
const containerStyle = { 
  display: "flex", 
  minHeight: "100vh", 
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
};

const mainContentStyle = { 
  flex: 1, 
  padding: "30px", 
  background: "rgba(255, 255, 255, 0.95)",
  backdropFilter: "blur(10px)",
  margin: "20px",
  marginLeft: "280px",
  borderRadius: "20px",
  boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
  overflowY: "auto"
};

const headingStyle = { 
  fontSize: "2.5rem", 
  fontWeight: "800", 
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  margin: "0 0 30px 0",
  letterSpacing: "-0.5px"
};

const tableContainerStyle = {
  background: "white",
  borderRadius: "16px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
  padding: "30px",
  border: "1px solid rgba(255,255,255,0.2)",
  marginBottom: "30px"
};

const tableStyle = { 
  width: "100%", 
  borderCollapse: "collapse",
  borderRadius: "12px",
  overflow: "hidden"
};

const thStyle = { 
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", 
  color: "white", 
  padding: "16px 12px", 
  textAlign: "left", 
  fontSize: "14px", 
  fontWeight: "700",
  textTransform: "uppercase",
  letterSpacing: "0.5px"
};

const tdStyle = { 
  padding: "16px 12px", 
  borderBottom: "1px solid #E5E7EB", 
  fontSize: "14px", 
  fontWeight: "500", 
  color: "#374151",
  transition: "background-color 0.2s ease"
};

const tdNameStyle = { ...tdStyle, fontWeight: "700", color: "#1F2937" };
const tdEmailStyle = { ...tdStyle, fontWeight: "600", color: "#3B82F6" };
const tdPhoneStyle = { ...tdStyle, color: "#10B981" };
const tdRegStyle = { ...tdStyle, color: "#F59E0B" };
const tdActionStyle = { ...tdStyle, color: "#EF4444", fontWeight: "600" };
const tdEmptyStyle = { 
  ...tdStyle, 
  textAlign: "center", 
  fontSize: "16px", 
  color: "#9CA3AF", 
  fontWeight: "500",
  fontStyle: "italic",
  padding: "40px"
};

const deleteBtnStyle = {
  background: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
  color: "white",
  border: "none",
  borderRadius: "8px",
  padding: "8px 16px",
  cursor: "pointer",
  fontSize: "12px",
  fontWeight: "600",
  transition: "all 0.2s ease",
  boxShadow: "0 2px 8px rgba(239, 68, 68, 0.3)",
  textTransform: "uppercase",
  letterSpacing: "0.5px"
};
