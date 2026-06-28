import React, { useEffect, useState } from "react";
import { auth, db } from "../../firebaseConfig";
import { ref, onValue, update } from "firebase/database";

export default function Profile() {
  const [userData, setUserData] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    address: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "success" or "error"
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;

    if (user) {
      const userRef = ref(db, "users/" + user.uid);
      onValue(userRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          setUserData(data);
          setFormData({
            name: data.name || "",
            email: data.email || "",
            mobile: data.mobile || "",
            address: data.address || "",
          });
        }
      });
    }
  }, []);

  const showMessage = (text, type) => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 4000);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const saveProfile = () => {
    const user = auth.currentUser;
    if (user) {
      setLoading(true);
      update(ref(db, "users/" + user.uid), formData)
        .then(() => {
          showMessage("Profile updated successfully!", "success");
          setEditing(false);
        })
        .catch((err) => showMessage(err.message, "error"))
        .finally(() => setLoading(false));
    }
  };

  const changePassword = () => {
    if (password !== confirmPassword) {
      showMessage("Passwords do not match!", "error");
      return;
    }

    if (password.length < 6) {
      showMessage("Password must be at least 6 characters!", "error");
      return;
    }

    const user = auth.currentUser;
    if (user) {
      setLoading(true);
      user.updatePassword(password)
        .then(() => {
          showMessage("Password changed successfully!", "success");
          setPassword("");
          setConfirmPassword("");
          setShowPassword(false);
        })
        .catch((err) => showMessage(err.message, "error"))
        .finally(() => setLoading(false));
    }
  };

  if (!userData) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p style={styles.loadingText}>Loading your profile...</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Animated Background */}
      <div style={styles.backgroundAnimation}></div>
      
      {/* Main Container */}
      <div style={styles.container}>
        {/* Profile Header */}
        <div style={styles.header}>
          <div style={styles.avatarSection}>
            <div style={styles.avatar}>
              {userData.name?.charAt(0).toUpperCase()}
            </div>
            <div style={styles.avatarInfo}>
              <h1 style={styles.greeting}>Hello, {userData.name}!</h1>
              <p style={styles.welcomeText}>Manage your account settings and preferences</p>
            </div>
          </div>
          <div style={styles.statsCard}>
            <div style={styles.statItem}>
              <div style={styles.statIcon}>👤</div>
              <div style={styles.statContent}>
                <span style={styles.statLabel}>Member Since</span>
                <span style={styles.statValue}>
                  {new Date(userData.createdAt || Date.now()).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div style={styles.content}>
          {/* Profile Information Card */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>📋 Personal Information</h3>
              {!editing && (
                <button 
                  style={styles.editButton}
                  onClick={() => setEditing(true)}
                >
                  ✏️ Edit Profile
                </button>
              )}
            </div>

            <div style={styles.cardBody}>
              {editing ? (
                <div style={styles.editForm}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      style={styles.input}
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Email Address</label>
                    <input
                      type="email"
                      value={formData.email}
                      style={{...styles.input, backgroundColor: '#f8fafc'}}
                      disabled
                      placeholder="Email cannot be changed"
                    />
                    <small style={styles.helperText}>
                      Email address cannot be modified
                    </small>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Mobile Number</label>
                    <input
                      type="tel"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleChange}
                      style={styles.input}
                      placeholder="Enter your mobile number"
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Address</label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      style={styles.textarea}
                      placeholder="Enter your complete address"
                      rows="3"
                    />
                  </div>

                  <div style={styles.formActions}>
                    <button 
                      style={styles.saveButton}
                      onClick={saveProfile}
                      disabled={loading}
                    >
                      {loading ? "🔄 Saving..." : "💾 Save Changes"}
                    </button>
                    <button 
                      style={styles.cancelButton}
                      onClick={() => setEditing(false)}
                      disabled={loading}
                    >
                      ❌ Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div style={styles.profileInfo}>
                  <div style={styles.infoGrid}>
                    <div style={styles.infoItem}>
                      <span style={styles.infoLabel}>Full Name</span>
                      <span style={styles.infoValue}>{userData.name}</span>
                    </div>
                    <div style={styles.infoItem}>
                      <span style={styles.infoLabel}>Email Address</span>
                      <span style={styles.infoValue}>{userData.email}</span>
                    </div>
                    <div style={styles.infoItem}>
                      <span style={styles.infoLabel}>Mobile Number</span>
                      <span style={styles.infoValue}>
                        {userData.mobile || "Not provided"}
                      </span>
                    </div>
                    <div style={styles.infoItem}>
                      <span style={styles.infoLabel}>Address</span>
                      <span style={styles.infoValue}>
                        {userData.address || "Not provided"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Security Card */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>🔒 Security Settings</h3>
            </div>
            <div style={styles.cardBody}>
              {!showPassword ? (
                <div style={styles.securitySection}>
                  <p style={styles.securityText}>
                    Secure your account by updating your password regularly
                  </p>
                  <button 
                    style={styles.securityButton}
                    onClick={() => setShowPassword(true)}
                  >
                    🔑 Change Password
                  </button>
                </div>
              ) : (
                <div style={styles.passwordForm}>
                  <h4 style={styles.passwordTitle}>Update Your Password</h4>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>New Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={styles.input}
                      placeholder="Enter new password"
                    />
                    <small style={styles.helperText}>
                      Password must be at least 6 characters long
                    </small>
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Confirm Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      style={styles.input}
                      placeholder="Confirm new password"
                    />
                  </div>
                  <div style={styles.formActions}>
                    <button 
                      style={styles.saveButton}
                      onClick={changePassword}
                      disabled={loading}
                    >
                      {loading ? "🔄 Updating..." : "🔒 Update Password"}
                    </button>
                    <button 
                      style={styles.cancelButton}
                      onClick={() => {
                        setShowPassword(false);
                        setPassword("");
                        setConfirmPassword("");
                      }}
                      disabled={loading}
                    >
                      ❌ Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Message Alert */}
        {message && (
          <div style={{
            ...styles.message,
            ...(messageType === "success" ? styles.messageSuccess : styles.messageError)
          }}>
            <span style={styles.messageIcon}>
              {messageType === "success" ? "✅" : "❌"}
            </span>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

// Enhanced Styles
const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)",
    fontFamily: "'Inter', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
    position: "relative",
    overflow: "hidden",
  },
  
  backgroundAnimation: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `
      radial-gradient(circle at 10% 20%, rgba(120, 119, 198, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 90% 80%, rgba(255, 119, 198, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 50% 50%, rgba(120, 219, 255, 0.05) 0%, transparent 50%)
    `,
  },
  
  container: {
    position: "relative",
    zIndex: 1,
    maxWidth: "1000px",
    margin: "0 auto",
    padding: "40px 20px",
  },
  
  loadingContainer: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
  },
  
  loadingSpinner: {
    width: "50px",
    height: "50px",
    border: "4px solid rgba(255, 255, 255, 0.3)",
    borderTop: "4px solid #3b82f6",
    borderRadius: "50%",
    marginBottom: "20px",
  },
  
  loadingText: {
    fontSize: "1.1rem",
    color: "#cbd5e1",
  },
  
  // Header Section
  header: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: "30px",
    alignItems: "center",
    marginBottom: "40px",
  },
  
  avatarSection: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
  },
  
  avatar: {
    width: "100px",
    height: "100px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "2.5rem",
    fontWeight: "bold",
    color: "white",
    boxShadow: "0 8px 25px rgba(59, 130, 246, 0.3)",
  },
  
  avatarInfo: {
    flex: 1,
  },
  
  greeting: {
    fontSize: "2.2rem",
    fontWeight: "800",
    background: "linear-gradient(135deg, #f8fafc 0%, #cbd5e1 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    margin: "0 0 8px 0",
  },
  
  welcomeText: {
    fontSize: "1.1rem",
    color: "#94a3b8",
    margin: 0,
  },
  
  statsCard: {
    background: "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)",
    padding: "20px",
    borderRadius: "16px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
  },
  
  statItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  
  statIcon: {
    fontSize: "1.5rem",
  },
  
  statContent: {
    display: "flex",
    flexDirection: "column",
  },
  
  statLabel: {
    fontSize: "0.85rem",
    color: "#94a3b8",
    fontWeight: "500",
  },
  
  statValue: {
    fontSize: "1rem",
    color: "#f8fafc",
    fontWeight: "600",
  },
  
  // Content Section
  content: {
    display: "grid",
    gap: "30px",
  },
  
  card: {
    background: "linear-gradient(145deg, #1e293b 0%, #0f172a 100%)",
    borderRadius: "20px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)",
    overflow: "hidden",
  },
  
  cardHeader: {
    padding: "25px 30px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "rgba(255, 255, 255, 0.02)",
  },
  
  cardTitle: {
    fontSize: "1.4rem",
    fontWeight: "600",
    color: "#f8fafc",
    margin: 0,
  },
  
  editButton: {
    padding: "10px 20px",
    background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
    color: "white",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "0.9rem",
    transition: "all 0.3s ease",
  },
  
  cardBody: {
    padding: "30px",
  },
  
  // Profile Info Styles
  profileInfo: {
    width: "100%",
  },
  
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "25px",
  },
  
  infoItem: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  
  infoLabel: {
    fontSize: "0.9rem",
    color: "#94a3b8",
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  
  infoValue: {
    fontSize: "1.1rem",
    color: "#f8fafc",
    fontWeight: "600",
  },
  
  // Form Styles
  editForm: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  
  label: {
    fontSize: "0.9rem",
    color: "#e2e8f0",
    fontWeight: "600",
  },
  
  input: {
    padding: "12px 16px",
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "10px",
    color: "#f8fafc",
    fontSize: "1rem",
    transition: "all 0.3s ease",
  },
  
  textarea: {
    padding: "12px 16px",
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "10px",
    color: "#f8fafc",
    fontSize: "1rem",
    fontFamily: "inherit",
    resize: "vertical",
    minHeight: "80px",
    transition: "all 0.3s ease",
  },
  
  helperText: {
    fontSize: "0.8rem",
    color: "#64748b",
    fontStyle: "italic",
  },
  
  formActions: {
    display: "flex",
    gap: "12px",
    marginTop: "10px",
  },
  
  saveButton: {
    padding: "12px 24px",
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    color: "white",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "0.9rem",
    transition: "all 0.3s ease",
    minWidth: "140px",
  },
  
  cancelButton: {
    padding: "12px 24px",
    background: "rgba(255, 255, 255, 0.1)",
    color: "#e2e8f0",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "0.9rem",
    transition: "all 0.3s ease",
    minWidth: "120px",
  },
  
  // Security Section
  securitySection: {
    textAlign: "center",
    padding: "20px",
  },
  
  securityText: {
    color: "#94a3b8",
    fontSize: "1rem",
    marginBottom: "20px",
  },
  
  securityButton: {
    padding: "12px 24px",
    background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    color: "white",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "0.9rem",
    transition: "all 0.3s ease",
  },
  
  passwordForm: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  
  passwordTitle: {
    fontSize: "1.2rem",
    color: "#f8fafc",
    margin: "0 0 10px 0",
    fontWeight: "600",
  },
  
  // Message Styles
  message: {
    position: "fixed",
    top: "20px",
    right: "20px",
    padding: "15px 20px",
    borderRadius: "12px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    boxShadow: "0 8px 25px rgba(0, 0, 0, 0.3)",
    zIndex: 1000,
  },
  
  messageSuccess: {
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    color: "white",
  },
  
  messageError: {
    background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
    color: "white",
  },
  
  messageIcon: {
    fontSize: "1.1rem",
  },
};