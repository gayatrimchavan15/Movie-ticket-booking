import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import { db } from "../../firebaseConfig";
import { ref, onValue, push, set as dbSet, remove, update } from "firebase/database";

export default function CityTheaterAdminPage() {
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
      setMessage("Please enter both city and theater name.");
      return;
    }
    const theatersRef = ref(db, "theaters");
    const newTheaterRef = push(theatersRef);
    dbSet(newTheaterRef, { city, name: theaterName })
      .then(() => {
        setMessage("Theater added successfully!");
        setCity("");
        setTheaterName("");
        setTimeout(() => setMessage(""), 1500);
      })
      .catch(() => setMessage("Error adding theater. Try again."));
  }

  function handleDelete(id) {
    if (window.confirm("Delete this theater?")) {
      remove(ref(db, `theaters/${id}`))
        .then(() => {
          setMessage("Theater deleted!");
          setTimeout(() => setMessage(""), 1500);
        })
        .catch(() => setMessage("Error deleting theater."));
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
      setMessage("Please enter both city and theater name.");
      return;
    }
    update(ref(db, `theaters/${editId}`), {
      city: editCity,
      name: editTheaterName,
    })
      .then(() => {
        setMessage("Theater updated successfully!");
        setEditId(null);
        setTimeout(() => setMessage(""), 1500);
      })
      .catch(() => setMessage("Error updating theater."));
  }

  return (
    <div style={containerStyle}>
      <Sidebar activePath="/admin/city-theater" />
      <div style={mainContentStyle}>
        <h2 style={mainTitleStyle}>📍 Manage Cities & Theaters</h2>

        {/* Add City & Theater Form */}
        <div style={cardStyle}>
          <h3 style={sectionTitleStyle}>Add City & Theater</h3>
          <form onSubmit={handleAdd} style={formStyle}>
            <div style={fieldStyle}>
              <label style={labelStyle}>City Name:</label>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="e.g. Sangli"
                style={inputStyle}
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Theater Name:</label>
              <input
                type="text"
                value={theaterName}
                onChange={e => setTheaterName(e.target.value)}
                placeholder="e.g. SFC Mega Mall"
                style={inputStyle}
              />
            </div>
            <button type="submit" style={addButtonStyle}>
              Add Theater
            </button>
            {message && (
              <div
                style={{
                  marginTop: 18,
                  color:
                    message.includes("success") || message.includes("deleted")
                      ? "#27ae60"
                      : "#c0392b",
                  fontWeight: "bold",
                }}
              >
                {message}
              </div>
            )}
          </form>
        </div>

        {/* Manage Cities & Theaters */}
        <div style={cardStyle}>
          <h3 style={sectionTitleStyle}>Manage Cities & Theaters</h3>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>City</th>
                <th style={thStyle}>Theater Name</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {theaters.length === 0 ? (
                <tr>
                  <td
                    style={{
                      ...tdStyle,
                      textAlign: "center",
                      color: "#888",
                    }}
                    colSpan={3}
                  >
                    No theaters found
                  </td>
                </tr>
              ) : (
                theaters.map(t => (
                  <tr key={t.id} style={rowHoverStyle}>
                    <td style={tdStyle}>
                      {editId === t.id ? (
                        <input
                          type="text"
                          value={editCity}
                          onChange={e => setEditCity(e.target.value)}
                          style={inputStyle}
                        />
                      ) : (
                        <span style={{ color: "#2196f3", fontWeight: "bold" }}>
                          {t.city}
                        </span>
                      )}
                    </td>
                    <td style={tdStyle}>
                      {editId === t.id ? (
                        <input
                          type="text"
                          value={editTheaterName}
                          onChange={e => setEditTheaterName(e.target.value)}
                          style={inputStyle}
                        />
                      ) : (
                        <span
                          style={{ color: "#9c27b0", fontStyle: "italic" }}
                        >
                          {t.name}
                        </span>
                      )}
                    </td>
                    <td style={tdStyle}>
                      {editId === t.id ? (
                        <>
                          <button
                            onClick={handleUpdate}
                            style={updateButtonStyle}
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditId(null)}
                            style={cancelButtonStyle}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEdit(t)}
                            style={editButtonStyle}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(t.id)}
                            style={deleteButtonStyle}
                          >
                            Delete
                          </button>
                        </>
                      )}
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

// --- Internal CSS ---
const containerStyle = {
  display: "flex",
  minHeight: "100vh",
  background: "#ecf5fe",
};

const mainContentStyle = {
  flex: 1,
  padding: "42px 40px 42px 32px",
  background: "linear-gradient(99deg,#f8fbff 65%,#e7f1fb 100%)",
};

const mainTitleStyle = {
  fontSize: 30,
  color: "#29496e",
  fontWeight: 700,
  marginBottom: 23,
  letterSpacing: 0.5,
};

const cardStyle = {
  background: "#fff",
  borderRadius: 13,
  boxShadow: "0 3px 18px rgba(0,0,0,0.07)",
  marginBottom: 35,
  padding: "30px 28px 28px",
  maxWidth: 620,
};

const sectionTitleStyle = {
  fontSize: 19,
  color: "#29496e",
  marginBottom: 14,
  fontWeight: 600,
};

const formStyle = {
  maxWidth: 420,
  margin: "auto",
};

const fieldStyle = {
  marginBottom: 19,
};

const labelStyle = {
  fontWeight: "500",
  color: "#35547D",
  fontSize: 15.2,
  display: "block",
  marginBottom: 7,
};

const inputStyle = {
  padding: "8px 10px",
  borderRadius: 6,
  border: "1px solid #bdd3ec",
  width: "100%",
  fontSize: 14.5,
  outline: "none",
};

const addButtonStyle = {
  background: "linear-gradient(90deg, #001f3f, #003366)",
  color: "#fff",
  padding: "10px 24px",
  border: "none",
  borderRadius: 7,
  cursor: "pointer",
  fontSize: 15,
  fontWeight: "600",
  marginTop: 3,
};

// Table styles
const tableStyle = {
  width: "100%",
  background: "#fbfcff",
  borderCollapse: "collapse",
  borderRadius: 10,
  overflow: "hidden",
  marginTop: 17,
};

const thStyle = {
  background: "#f5f7fc",
  color: "#29496e",
  padding: "10px 11px",
  textAlign: "left",
  borderBottom: "1px solid #eaeaea",
  fontSize: 15,
  fontWeight: 600,
};

const tdStyle = {
  padding: "8px 8px",
  borderBottom: "1px solid #ebf0fa",
  verticalAlign: "middle",
  fontSize: 14,
};

const rowHoverStyle = {
  transition: "background 0.2s",
};

const editButtonStyle = {
  background: "#0288d1",
  color: "#fff",
  border: "none",
  borderRadius: 4,
  padding: "5px 12px",
  cursor: "pointer",
  fontSize: 13,
  marginRight: 8,
};

const updateButtonStyle = {
  background: "#43a047",
  color: "#fff",
  border: "none",
  borderRadius: 4,
  padding: "5px 12px",
  cursor: "pointer",
  fontSize: 13,
  marginRight: 6,
};

const cancelButtonStyle = {
  background: "#757575",
  color: "#fff",
  border: "none",
  borderRadius: 4,
  padding: "5px 12px",
  cursor: "pointer",
  fontSize: 13,
  marginRight: 6,
};

const deleteButtonStyle = {
  background: "#e53935",
  color: "#fff",
  border: "none",
  borderRadius: 4,
  padding: "5px 12px",
  cursor: "pointer",
  fontSize: 13,
};

