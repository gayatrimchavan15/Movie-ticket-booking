import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import { db } from "../../firebaseConfig";
import { ref, onValue, set as dbSet, remove } from "firebase/database";

export default function ShowtimesAdminPage() {
  // States for Add Showtimes
  const [theaters, setTheaters] = useState([]);
  const [movies, setMovies] = useState([]);
  const [selectedTheater, setSelectedTheater] = useState("");
  const [selectedMovie, setSelectedMovie] = useState("");
  const [showtimes, setShowtimes] = useState("");
  // States for Manage Showtimes
  const [showtimeData, setShowtimeData] = useState({});
  const [editData, setEditData] = useState({ movieId: "", showtimes: "" });
  // Message state
  const [message, setMessage] = useState("");

  // Load theaters and movies on mount
  useEffect(() => {
    const theatersRef = ref(db, "theaters");
    onValue(theatersRef, snapshot => {
      const data = snapshot.val();
      setTheaters(data ? Object.entries(data).map(([id, t]) => ({ id, ...t })) : []);
    });
    const moviesRef = ref(db, "movies");
    onValue(moviesRef, snapshot => {
      const data = snapshot.val();
      setMovies(data ? Object.entries(data).map(([id, m]) => ({ id, ...m })) : []);
    });
  }, []);

  // Load showtimes for selected theater
  useEffect(() => {
    if (!selectedTheater) {
      setShowtimeData({});
      return;
    }
    const showtimesRef = ref(db, `theaters/${selectedTheater}/showtimes`);
    onValue(showtimesRef, snapshot => {
      setShowtimeData(snapshot.val() || {});
    });
  }, [selectedTheater]);

  // Handler: Add showtimes
  function handleAddShowtime(e) {
    e.preventDefault();
    if (!selectedTheater || !selectedMovie || !showtimes.trim()) {
      setMessage("Select theater, movie, and enter show timings.");
      return;
    }
    const showtimeArr = showtimes.split(",").map(t => t.trim()).filter(Boolean);
    if (showtimeArr.length === 0) {
      setMessage("Enter at least one valid showtime.");
      return;
    }
    dbSet(ref(db, `theaters/${selectedTheater}/showtimes/${selectedMovie}`), showtimeArr)
      .then(() => {
        setMessage("Showtimes added successfully!");
        setShowtimes("");
        setSelectedMovie("");
        setTimeout(() => setMessage(""), 2000);
      })
      .catch(() => setMessage("Error adding showtimes."));
  }

  // Handler: Delete showtime
  function handleDeleteShowtime(movieId) {
    if (!selectedTheater) return;
    if (window.confirm("Delete showtimes for this movie?")) {
      remove(ref(db, `theaters/${selectedTheater}/showtimes/${movieId}`))
        .then(() => {
          setMessage("Showtimes deleted.");
          setTimeout(() => setMessage(""), 2000);
          if(editData.movieId === movieId) setEditData({ movieId: "", showtimes: "" });
        })
        .catch(() => setMessage("Error deleting showtimes."));
    }
  }

  // Handler: Open edit modal
  function handleEditBtn(movieId, timings) {
    setEditData({
      movieId,
      showtimes: Array.isArray(timings) ? timings.join(", ") : timings
    });
  }

  // Handler: Submit edit
  function handleEditSubmit(e) {
    e.preventDefault();
    const showtimeArr = editData.showtimes.split(",").map(t => t.trim()).filter(Boolean);
    if (!editData.movieId || showtimeArr.length === 0) return;
    dbSet(ref(db, `theaters/${selectedTheater}/showtimes/${editData.movieId}`), showtimeArr)
      .then(() => {
        setMessage("Showtimes updated successfully!");
        setEditData({ movieId: "", showtimes: "" });
        setTimeout(() => setMessage(""), 2000);
      })
      .catch(() => setMessage("Error updating showtimes."));
  }

  // Lookup movie title by id
  function getMovieTitle(id) {
    const movie = movies.find(m => m.id === id);
    return movie ? movie.title : id;
  }

  return (
    <div style={containerStyle}>
      <Sidebar activePath="/admin/showtimes" />
      <div style={mainContentStyle}>
        <h2 style={mainTitleStyle}>🎞️ Showtimes Management</h2>

        {/* Add Showtimes Section */}
        <div style={cardStyle}>
          <h3 style={sectionTitleStyle}>Add Showtimes</h3>
          <form onSubmit={handleAddShowtime} style={formStyle}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Select Theater:</label>
              <select
                value={selectedTheater}
                onChange={e => setSelectedTheater(e.target.value)}
                style={inputStyle}
                required
              >
                <option value="">Choose Theater</option>
                {theaters.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.city})</option>
                ))}
              </select>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Select Movie:</label>
              <select
                value={selectedMovie}
                onChange={e => setSelectedMovie(e.target.value)}
                style={inputStyle}
                required
                disabled={!selectedTheater}
              >
                <option value="">Choose Movie</option>
                {movies.map(m => (
                  <option key={m.id} value={m.id}>{m.title}</option>
                ))}
              </select>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Show Timings (comma separated):</label>
              <input
                type="text"
                value={showtimes}
                onChange={e => setShowtimes(e.target.value)}
                placeholder="e.g. 10:00, 13:30, 18:00"
                style={inputStyle}
                required
                disabled={!selectedMovie}
              />
            </div>
            <button type="submit" style={addButtonStyle}>
              Add Showtimes
            </button>
          </form>
        </div>

        {/* Message Display */}
        {message && (
          <div style={{ marginTop: 22, color: message.toLowerCase().includes("success") ? "#27ae60" : "#c0392b", fontWeight: "bold" }}>
            {message}
          </div>
        )}

        {/* Manage Showtimes Section */}
        <div style={cardStyle}>
          <h3 style={sectionTitleStyle}>Manage Showtimes</h3>
          <div style={filterRowStyle}>
            <label style={{ fontWeight: "600", fontSize: 16, marginRight: 12 }}>Select Theater:</label>
            <select
              value={selectedTheater}
              onChange={e => setSelectedTheater(e.target.value)}
              style={{ ...inputStyle, maxWidth: 300 }}
            >
              <option value="">Choose Theater</option>
              {theaters.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.city})</option>
              ))}
            </select>
          </div>

          {selectedTheater && (
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Movie</th>
                  <th style={thStyle}>Show Timings</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(showtimeData).length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ ...tdStyle, textAlign: "center", color: "#888" }}>
                      No showtimes found for this theater.
                    </td>
                  </tr>
                ) : (
                  Object.entries(showtimeData).map(([movieId, timings]) => (
                    <tr key={movieId} style={rowHoverStyle}>
                      <td style={{ ...tdStyle, fontWeight: "600", color: "#2c3e50" }}>{getMovieTitle(movieId)}</td>
                      <td style={tdStyle}>{Array.isArray(timings) ? timings.join(", ") : timings}</td>
                      <td style={tdStyle}>
                        <button
                          onClick={() => handleEditBtn(movieId, timings)}
                          style={editButtonStyle}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteShowtime(movieId)}
                          style={deleteButtonStyle}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* Edit Modal */}
          {editData.movieId && (
            <div style={modalStyle}>
              <div style={modalContentStyle}>
                <h3 style={{ marginBottom: 18 }}>Edit Showtimes for {getMovieTitle(editData.movieId)}</h3>
                <form onSubmit={handleEditSubmit}>
                  <label style={labelStyle}>Show Timings (comma separated)</label>
                  <input
                    type="text"
                    value={editData.showtimes}
                    onChange={e => setEditData({ ...editData, showtimes: e.target.value })}
                    style={inputStyle}
                    autoFocus
                  />
                  <div style={{ marginTop: 20 }}>
                    <button type="submit" style={saveButtonStyle}>Save Changes</button>
                    <button
                      type="button"
                      style={cancelButtonStyle}
                      onClick={() => setEditData({ movieId: "", showtimes: "" })}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Internal CSS ---

const containerStyle = {
  display: "flex",
  minHeight: "100vh",
  background: "#e8f0fd",
};

const mainContentStyle = {
  flex: 1,
  padding: "40px 36px",
  background: "linear-gradient(120deg, #f8fbff 75%, #def1ff 100%)"
};

const mainTitleStyle = {
  fontSize: 32,
  fontWeight: "700",
  marginBottom: 28,
  color: "#1c355e",
  letterSpacing: 1.1,
};

const cardStyle = {
  background: "#ffffff",
  borderRadius: 14,
  boxShadow: "0 5px 25px rgba(90, 123, 213, 0.12)",
  marginBottom: 36,
  padding: "28px 32px",
  maxWidth: 720,
  marginLeft: "auto",
  marginRight: "auto",
};

const sectionTitleStyle = {
  fontSize: 22,
  fontWeight: 600,
  marginBottom: 20,
  color: "#2a3a6f",
};

const formStyle = {
  maxWidth: 480,
  margin: "auto",
};

const fieldStyle = {
  marginBottom: 22,
};

const labelStyle = {
  fontWeight: "600",
  fontSize: 15.5,
  marginBottom: 8,
  display: "block",
  color: "#2a3a6f"
};

const inputStyle = {
  padding: "10px 14px",
  borderRadius: 7,
  border: "1.5px solid #aac7f8",
  width: "100%",
  fontSize: 16,
  outline: "none",
  color: "#2a3a6f",
  boxShadow: "0 2px 8px #c8d6f7"
};

const addButtonStyle = {
  background: "linear-gradient(90deg, #4a6ed1, #5e82f7)",
  color: "#fff",
  padding: "13px 32px",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 17,
  fontWeight: "700",
  boxShadow: "0 6px 18px rgba(90, 123, 213, 0.4)",
  marginTop: 6,
  transition: "background 0.3s ease",
};

const filterRowStyle = {
  display: "flex",
  alignItems: "center",
  marginBottom: 20,
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  borderRadius: 12,
  overflow: "hidden",
  boxShadow: "0 4px 14px rgba(74, 110, 209, 0.15)",
  background: "#fefeff",
};

const thStyle = {
  padding: 12,
  backgroundColor: "#5071e6",
  color: "#fff",
  fontWeight: "700",
  fontSize: 16,
  textAlign: "left",
  letterSpacing: 0.05,
};

const tdStyle = {
  padding: 12,
  borderBottom: "1px solid #d6defa",
  color: "#2a3a6f",
  fontSize: 15,
  verticalAlign: "middle",
};

const rowHoverStyle = {
  transition: "background-color 0.25s",
  cursor: "default",
};

const editButtonStyle = {
  backgroundColor: "#4a70e6",
  color: "#fff",
  border: "none",
  borderRadius: 5,
  padding: "7px 15px",
  marginRight: 10,
  cursor: "pointer",
  fontWeight: "600",
  fontSize: 14,
  transition: "background-color 0.2s",
};

const deleteButtonStyle = {
  backgroundColor: "#e75d5d",
  color: "#fff",
  border: "none",
  borderRadius: 5,
  padding: "7px 15px",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: 14,
  transition: "background-color 0.2s",
};

const modalStyle = {
  position: "fixed",
  left: 0,
  top: 0,
  width: "100vw",
  height: "100vh",
  background: "rgba(0,0,0,0.38)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 110,
};

const modalContentStyle = {
  background: "#fff",
  borderRadius: 14,
  maxWidth: 420,
  width: "90vw",
  padding: "32px 28px",
  boxShadow: "0 8px 30px rgba(0, 0, 0, 0.25)",
};

const saveButtonStyle = {
  backgroundColor: "#27ae60",
  color: "#fff",
  border: "none",
  borderRadius: 7,
  padding: "10px 24px",
  fontWeight: "700",
  fontSize: 16,
  cursor: "pointer",
};

const cancelButtonStyle = {
  backgroundColor: "#a7a7a7",
  color: "#222",
  border: "none",
  borderRadius: 7,
  padding: "10px 22px",
  fontSize: 16,
  cursor: "pointer",
  marginLeft: 14,
};
