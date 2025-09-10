import React from "react";

function UserDashboard() {
  const styles = {
    container: { padding: "20px", backgroundColor: "#f8f9fa", borderRadius: "10px", fontFamily: "Arial, sans-serif" },
    heading: { color: "#333", marginBottom: "10px" },
    paragraph: { color: "#555" },
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Welcome to User Dashboard</h1>
      <p style={styles.paragraph}>This is where user details and bookings will be shown.</p>
    </div>
  );
}

export default UserDashboard;
