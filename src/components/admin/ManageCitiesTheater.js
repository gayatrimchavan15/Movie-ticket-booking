import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import { db } from "../../firebaseConfig";
import { ref, onValue, push, set as dbSet, remove, update } from "firebase/database";

function CityTheaterAdminPage() {
  // Add city/theater states
  const [city, setCity] = useState("");
  const [theaterName, setTheaterName] = useState("");
  const [message, setMessage] = useState("");

  // Manage theaters state
  const [theaters, setTheaters] = useState([]);

  // For editing
  const [editId, setEditId] = useState(null);
  const [editCity, setEditCity] = useState("");
  const [editTheaterName, setEditTheaterName] = useState("");

  useEffect(() => {
    const theatersRef = ref(db, "theaters");
    onValue(theatersRef, snapshot => {
      const data = snapshot.val();
      if (data) {
        setTheaters(
          Object.entries(data).map(([key, value]) => ({
            id: key,
            ...value
          }))
        );
      } else {
        setTheaters([]);
      }
    });
  }, []);

  function handleAdd(e) {
    e.preventDefault();
    if (!city || !theaterName) {
      setMessage("⚠️ Please enter both city and theater name.");
      return;
    }
    const theatersRef = ref(db, "theaters");
    const newTheaterRef = push(theatersRef);
    dbSet(newTheaterRef, { city, name: theaterName })
      .then(() => {
        setMessage("✅ Theater added successfully!");
        setCity("");
        setTheaterName("");
        setTimeout(() => setMessage(""), 3000);
      })
      .catch(() => setMessage("❌ Error adding theater. Try again."));
  }

  function handleDelete(id) {
    if (window.confirm("Are you sure you want to delete this theater?")) {
      remove(ref(db, `theaters/${id}`))
        .then(() => {
          setMessage("✅ Theater deleted successfully!");
          setTimeout(() => setMessage(""), 3000);
        })
        .catch(() => setMessage("❌ Error deleting theater."));
    }
  }

  function handleEdit(theater) {
    setEditId(theater.id);
    setEditCity(theater.city);
    setEditTheaterName(theater.name);
  }

  function handleUpdate(e) {
    e.preventDefault();
    if (!editCity || !editTheaterName) {
      setMessage("⚠️ Please enter both city and theater name.");
      return;
    }
    update(ref(db, `theaters/${editId}`), {
      city: editCity,
      name: editTheaterName,
    })
      .then(() => {
        setMessage("✅ Theater updated successfully!");
        setEditId(null);
        setTimeout(() => setMessage(""), 3000);
      })
      .catch(() => setMessage("❌ Error updating theater."));
  }

  // Sidebar active path
  const activePath = "/admin/city-theater";

  return (
    <div style={styles.page}>
      <Sidebar activePath={activePath} />
      <div style={styles.container}>
        
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.mainTitle}>📍 Cities & Theaters Management</h1>
          <p style={styles.subtitle}>Manage theater locations and cities</p>
        </div>

        {/* Add City & Theater Form */}
        <div style={styles.section}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>➕ Add New Theater</h2>
            
            <form onSubmit={handleAdd} style={styles.form}>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>City Name *</label>
                  <input
                    style={styles.input}
                    type="text"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    placeholder="Enter city name e.g. Sangli"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Theater Name *</label>
                  <input
                    style={styles.input}
                    type="text"
                    value={theaterName}
                    onChange={e => setTheaterName(e.target.value)}
                    placeholder="Enter theater name e.g. SFC Mega Mall"
                  />
                </div>
              </div>

              <div style={styles.buttonGroup}>
                <button type="submit" style={styles.primaryButton}>
                  ➕ Add Theater
                </button>
              </div>

              {message && (
                <div style={{
                  ...styles.message,
                  ...(message.includes("✅") ? styles.successMessage : styles.errorMessage)
                }}>
                  {message}
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Manage Cities & Theaters Table */}
        <div style={styles.section}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>🏢 Manage Theaters</h2>
            
            {theaters.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>🎭</div>
                <h3 style={styles.emptyTitle}>No Theaters Found</h3>
                <p style={styles.emptyText}>
                  Get started by adding your first theater!
                </p>
              </div>
            ) : (
              <div style={styles.tableContainer}>
                <div style={styles.tableWrapper}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>City</th>
                        <th style={styles.th}>Theater Name</th>
                        <th style={styles.th}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {theaters.map((theater, index) => (
                        <tr key={theater.id} style={index % 2 === 0 ? styles.evenRow : styles.oddRow}>
                          <td style={styles.td}>
                            {editId === theater.id ? (
                              <input 
                                style={styles.editInput} 
                                value={editCity} 
                                onChange={e => setEditCity(e.target.value)} 
                              />
                            ) : (
                              <span style={styles.cityText}>{theater.city}</span>
                            )}
                          </td>
                          <td style={styles.td}>
                            {editId === theater.id ? (
                              <input 
                                style={styles.editInput} 
                                value={editTheaterName} 
                                onChange={e => setEditTheaterName(e.target.value)} 
                              />
                            ) : (
                              <span style={styles.theaterText}>{theater.name}</span>
                            )}
                          </td>
                          <td style={styles.td}>
                            <div style={styles.actionButtons}>
                              {editId === theater.id ? (
                                <>
                                  <button onClick={handleUpdate} style={styles.saveButton}>
                                    💾 Save
                                  </button>
                                  <button onClick={() => setEditId(null)} style={styles.cancelButton}>
                                    ❌ Cancel
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button onClick={() => handleEdit(theater)} style={styles.editButton}>
                                    ✏️ Edit
                                  </button>
                                  <button onClick={() => handleDelete(theater.id)} style={styles.deleteButton}>
                                    🗑️ Delete
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Styles
const styles = {
  page: { 
    display: "flex", 
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", 
    minHeight: "100vh",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
  },
  container: { 
    flex: 1, 
    padding: "30px",
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(10px)",
    margin: "20px",
    marginLeft: "280px",
    borderRadius: "20px",
    boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
    overflowY: "auto"
  },
  header: {
    marginBottom: "30px",
    textAlign: "center"
  },
  mainTitle: {
    fontSize: "2.5rem",
    fontWeight: "800",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    margin: "0 0 8px 0",
    letterSpacing: "-0.5px"
  },
  subtitle: {
    fontSize: "1.1rem",
    color: "#64748b",
    margin: 0,
    fontWeight: "500"
  },
  section: {
    marginBottom: "40px"
  },
  card: {
    background: "white",
    borderRadius: "16px",
    padding: "32px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
    border: "1px solid #f1f5f9"
  },
  cardTitle: {
    fontSize: "1.5rem",
    fontWeight: "700",
    color: "#1e293b",
    margin: "0 0 25px 0",
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  form: {
    width: "100%"
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "20px",
    marginBottom: "25px"
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },
  label: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#374151",
    marginBottom: "4px"
  },
  input: {
    padding: "12px 16px",
    borderRadius: "10px",
    border: "2px solid #e2e8f0",
    fontSize: "14px",
    outline: "none",
    transition: "all 0.3s ease",
    backgroundColor: "#f8fafc"
  },
  editInput: {
    padding: "8px 12px",
    borderRadius: "6px",
    border: "2px solid #e2e8f0",
    fontSize: "14px",
    outline: "none",
    width: "100%",
    backgroundColor: "#f8fafc"
  },
  buttonGroup: {
    display: "flex",
    gap: "12px",
    alignItems: "center"
  },
  primaryButton: {
    backgroundColor: "#6366f1",
    color: "white",
    border: "none",
    padding: "14px 24px",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: "600",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  message: {
    marginTop: "16px",
    padding: "12px 16px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    textAlign: "center"
  },
  successMessage: {
    backgroundColor: "#f0fdf4",
    color: "#166534",
    border: "1px solid #dcfce7"
  },
  errorMessage: {
    backgroundColor: "#fef2f2",
    color: "#dc2626",
    border: "1px solid #fecaca"
  },
  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
    color: "#64748b"
  },
  emptyIcon: {
    fontSize: "4rem",
    marginBottom: "16px",
    opacity: 0.7
  },
  emptyTitle: {
    fontSize: "1.5rem",
    fontWeight: "600",
    color: "#374151",
    margin: "0 0 8px 0"
  },
  emptyText: {
    fontSize: "1rem",
    color: "#64748b",
    margin: 0
  },
  tableContainer: {
    overflow: "hidden"
  },
  tableWrapper: {
    overflow: "hidden",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    backgroundColor: "white"
  },
  th: {
    padding: "16px 20px",
    backgroundColor: "#f8fafc",
    color: "#374151",
    textAlign: "left",
    fontWeight: "600",
    fontSize: "14px",
    borderBottom: "2px solid #e2e8f0"
  },
  td: {
    padding: "16px 20px",
    borderBottom: "1px solid #f1f5f9",
    fontSize: "14px"
  },
  evenRow: {
    backgroundColor: "#fafafa"
  },
  oddRow: {
    backgroundColor: "white"
  },
  cityText: {
    fontWeight: "600",
    color: "#1e40af"
  },
  theaterText: {
    fontWeight: "500",
    color: "#1e293b",
    fontStyle: "italic"
  },
  actionButtons: {
    display: "flex",
    gap: "8px"
  },
  editButton: {
    backgroundColor: "#f59e0b",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "500",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    gap: "4px"
  },
  saveButton: {
    backgroundColor: "#10b981",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "500",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    gap: "4px"
  },
  cancelButton: {
    backgroundColor: "#6b7280",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "500",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    gap: "4px"
  },
  deleteButton: {
    backgroundColor: "#dc2626",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "500",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    gap: "4px"
  }
};

// Add hover effects
styles.primaryButton.onHover = {
  transform: "translateY(-2px)",
  boxShadow: "0 6px 20px rgba(99, 102, 241, 0.4)"
};

styles.editButton.onHover = {
  backgroundColor: "#d97706",
  transform: "translateY(-1px)"
};

styles.saveButton.onHover = {
  backgroundColor: "#059669",
  transform: "translateY(-1px)"
};

styles.cancelButton.onHover = {
  backgroundColor: "#4b5563",
  transform: "translateY(-1px)"
};

styles.deleteButton.onHover = {
  backgroundColor: "#b91c1c",
  transform: "translateY(-1px)"
};

styles.input.onFocus = {
  borderColor: "#6366f1",
  backgroundColor: "white",
  boxShadow: "0 0 0 3px rgba(99, 102, 241, 0.1)"
};

export default CityTheaterAdminPage;
