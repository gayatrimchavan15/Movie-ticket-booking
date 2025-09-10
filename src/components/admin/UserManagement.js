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
      if (data) {
        setUsers(
          Object.entries(data).map(([id, user]) => ({
            id,
            ...user
          }))
        );
      } else {
        setUsers([]);
      }
    });
  }, []);

  function handleDelete(id) {
    if (window.confirm("Delete this user?")) {
      remove(ref(db, `users/${id}`))
        .then(() => setMessage("User deleted!"))
        .catch(() => setMessage("Error deleting user."));
    }
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f3f7fc" }}>
      <Sidebar activePath="/admin/user-management" />
      <div style={{ flex: 1, padding: "40px 30px" }}>
        <h2 style={{ color: "#5145cd", fontWeight: "bold", fontSize: 30, marginBottom: 28 }}>
          User Management
        </h2>
        {message && (
          <div style={{
            marginBottom: 18,
            color: message.includes("deleted") ? "#27ae60" : "#c0392b",
            fontSize: 16
          }}>{message}</div>
        )}
        <div style={tableSectionStyle}>
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
                  <td style={tdEmptyStyle} colSpan={5}>No users found</td>
                </tr>
              ) : (
                users.map(user => (
                  <tr key={user.id}>
                    <td style={tdNameStyle}>{user.name || user.fullName || "-"}</td>
                    <td style={tdEmailStyle}>{user.email || "-"}</td>
                    <td style={tdPhoneStyle}>{user.phone || user.mobile || "-"}</td>
                    <td style={tdRegStyle}>{user.registeredAt || user.date || "-"}</td>
                    <td style={tdActionStyle}>
                      <button
                        onClick={() => handleDelete(user.id)}
                        style={{
                          background: "#e74c3c", color: "#fff",
                          border: "none", borderRadius: 4, padding: "6px 14px",
                          cursor: "pointer", fontSize: 14
                        }}
                      >
                        Delete
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

const tableSectionStyle = {
  background: "#fff", borderRadius: "13px", boxShadow: "0 4px 18px #c6cbd233",
  padding: "32px", marginTop: "10px", maxWidth: 850, minWidth: 320
};
const tableStyle = {
  width: "100%",
  background: "none",
  borderCollapse: "collapse",
};
const thStyle = {
  background: "#5145cd",
  color: "#fff",
  padding: "13px 10px",
  textAlign: "left",
  fontSize: 17,
  borderBottom: "2px solid #eaeaea",
  fontWeight: "bold"
};
const tdStyle = {
  padding: "13px 9px",
  borderBottom: "1px solid #edf0f7",
  fontSize: 16,
  fontWeight: 550,
  background: "#fcfcff"
};
const tdNameStyle = {
  ...tdStyle,
  color: "#232946",
  fontWeight: 700
};
const tdEmailStyle = {
  ...tdStyle,
  color: "#3777ee",
  fontWeight: 600
};
const tdPhoneStyle = {
  ...tdStyle,
  color: "#14bb7a"
};
const tdRegStyle = {
  ...tdStyle,
  color: "#b59400"
};
const tdActionStyle = {
  ...tdStyle,
  color: "#ff6078",
  fontWeight: 600
};
const tdEmptyStyle = {
  ...tdStyle,
  color: "#9c98aa",
  fontWeight: "normal",
  fontSize: "16px",
  textAlign: "center"
};