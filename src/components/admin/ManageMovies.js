import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import { db } from "../../firebaseConfig";
import { ref, onValue, push, set as dbSet, remove } from "firebase/database";

export default function MovieAdminPage() {
  // Add Movie State
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const [status, setStatus] = useState("Upcoming");
  const [posterUrl, setPosterUrl] = useState("");
  // Manage Movie State
  const [movies, setMovies] = useState([]);
  const [message, setMessage] = useState("");
  const [editMovie, setEditMovie] = useState(null);
  const [editFields, setEditFields] = useState({ title: "", genre: "", releaseDate: "", status: "", posterUrl: "" });

  useEffect(() => {
    const moviesRef = ref(db, "movies");
    onValue(moviesRef, snapshot => {
      const data = snapshot.val();
      if (data) {
        setMovies(Object.entries(data).map(([key, value]) => ({ id: key, ...value })));
      } else {
        setMovies([]);
      }
    });
  }, []);

  function handleAddMovie(e) {
    e.preventDefault();
    if (!title || !genre || !releaseDate || !status || !posterUrl) {
      setMessage("Please fill all fields including poster URL.");
      return;
    }
    const moviesRef = ref(db, "movies");
    const newMovieRef = push(moviesRef);
    dbSet(newMovieRef, { title, genre, releaseDate, status, posterUrl })
      .then(() => {
        setMessage("Movie added successfully!");
        setTitle(""); setGenre(""); setReleaseDate(""); setStatus("Upcoming"); setPosterUrl("");
        setTimeout(() => setMessage(""), 1500);
      })
      .catch(() => setMessage("Error adding movie. Try again."));
  }

  function handleDelete(id) {
    if (window.confirm("Are you sure you want to delete this movie?")) {
      remove(ref(db, `movies/${id}`))
        .then(() => {
          setMessage("Movie deleted!");
          setTimeout(() => setMessage(""), 1500);
        })
        .catch(() => setMessage("Error deleting movie."));
    }
  }

  function handleEditSave(e) {
    e.preventDefault();
    const id = editMovie.id;
    if (!editFields.title || !editFields.genre || !editFields.releaseDate || !editFields.status) {
      setMessage("Please fill all fields.");
      return;
    }
    dbSet(ref(db, `movies/${id}`), { ...editFields })
      .then(() => {
        setMessage("Movie updated!");
        setEditMovie(null);
        setTimeout(() => setMessage(""), 1500);
      })
      .catch(() => setMessage("Error updating movie."));
  }

  return (
    <div style={containerStyle}>
      <Sidebar activePath="/admin/movies" />
      <div style={mainContentStyle}>
        <h2 style={mainTitleStyle}>🎬 Movie Management</h2>
        {/* Add Movie Form */}
        <div style={cardStyle}>
          <h3 style={sectionTitleStyle}>Add New Movie</h3>
          <form onSubmit={handleAddMovie} style={formStyle}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Title:</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Movie Title" style={inputStyle} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Genre:</label>
              <input type="text" value={genre} onChange={e => setGenre(e.target.value)} placeholder="Genre (Action, Comedy, ...)" style={inputStyle} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Release Date:</label>
              <input type="date" value={releaseDate} onChange={e => setReleaseDate(e.target.value)} style={inputStyle} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Status:</label>
              <select value={status} onChange={e => setStatus(e.target.value)} style={inputStyle}>
                <option value="Active">Active</option>
                <option value="Upcoming">Upcoming</option>
              </select>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Movie Poster URL:</label>
              <input type="text" value={posterUrl} onChange={e => setPosterUrl(e.target.value)} placeholder="Paste image URL here (e.g. https://...)" style={inputStyle} />
              {posterUrl && (
                <div style={previewContainerStyle}>
                  <img src={posterUrl} alt="Preview Poster" style={posterPreviewStyle} />
                </div>
              )}
            </div>
            <button type="submit" style={addButtonStyle}>Add Movie</button>
          </form>
        </div>
        {/* Message */}
        {message && (
          <div style={{
            margin: "22px 0 0 0",
            color: message.toLowerCase().includes("success") || message.toLowerCase().includes("updated") || message.toLowerCase().includes("deleted")
              ? "#16a085"
              : "#c0392b",
            fontWeight: "bold",
            letterSpacing: 0.2
          }}>
            {message}
          </div>
        )}

        {/* Movies Table */}
        <div style={cardStyle}>
          <h3 style={sectionTitleStyle}>Manage Movies</h3>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Poster</th>
                <th style={thStyle}>Title</th>
                <th style={thStyle}>Genre</th>
                <th style={thStyle}>Release Date</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {movies.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ ...tdStyle, textAlign: "center", color: "#888" }}>No movies found</td>
                </tr>
              ) : (
                movies.map(movie => (
                  <tr key={movie.id} style={rowHoverStyle}>
                    <td style={tdStyle}>
                      {movie.posterUrl
                        ? <img src={movie.posterUrl} alt={movie.title} style={{ width: 66, borderRadius: 5 }} />
                        : <span style={{ color: "#bbb" }}>No Image</span>
                      }
                    </td>
                    <td style={{ ...tdStyle, color: "#185adb", fontWeight: "bold" }}>{movie.title}</td>
                    <td style={{ ...tdStyle, color: "#b15eff", fontStyle: "italic" }}>{movie.genre}</td>
                    <td style={tdStyle}>{movie.releaseDate}</td>
                    <td style={tdStyle}>
                      <span style={{ color: movie.status === "Active" ? "#27ae60" : "#f39c12", fontWeight: "bold" }}>{movie.status}</span>
                    </td>
                    <td style={tdStyle}>
                      <button
                        onClick={() => {
                          setEditMovie(movie);
                          setEditFields({
                            title: movie.title || "",
                            genre: movie.genre || "",
                            releaseDate: movie.releaseDate || "",
                            status: movie.status || "Upcoming",
                            posterUrl: movie.posterUrl || ""
                          });
                        }}
                        style={editButtonStyle}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(movie.id)}
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
        </div>
        {/* Edit Movie Modal */}
        {editMovie && (
          <div style={modalStyle}>
            <div style={modalContentStyle}>
              <h3>Edit Movie</h3>
              <form onSubmit={handleEditSave} style={formStyle}>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Title:</label>
                  <input type="text" value={editFields.title} onChange={e => setEditFields({ ...editFields, title: e.target.value })} style={inputStyle} />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Genre:</label>
                  <input type="text" value={editFields.genre} onChange={e => setEditFields({ ...editFields, genre: e.target.value })} style={inputStyle} />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Release Date:</label>
                  <input type="date" value={editFields.releaseDate} onChange={e => setEditFields({ ...editFields, releaseDate: e.target.value })} style={inputStyle} />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Status:</label>
                  <select value={editFields.status} onChange={e => setEditFields({ ...editFields, status: e.target.value })} style={inputStyle}>
                    <option value="Active">Active</option>
                    <option value="Upcoming">Upcoming</option>
                  </select>
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Poster URL:</label>
                  <input type="text" value={editFields.posterUrl} onChange={e => setEditFields({ ...editFields, posterUrl: e.target.value })} style={inputStyle} />
                  {editFields.posterUrl && (
                    <img src={editFields.posterUrl} alt="" style={{ width: 120, marginTop: 10, borderRadius: 8 }} />
                  )}
                </div>
                <button type="submit" style={saveButtonStyle}>Save Changes</button>
                <button type="button" style={cancelButtonStyle} onClick={() => setEditMovie(null)}>Cancel</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Internal CSS ---

const containerStyle = {
  display: "flex",
  minHeight: "100vh",
  background: "#eaf0f6",
};

const mainContentStyle = {
  flex: 1,
  padding: "42px 36px 42px 32px",
  background: "linear-gradient(108deg,#f9fbff 70%,#f0f6fa 100%)",
};

const mainTitleStyle = {
  fontSize: 32,
  color: "#2d4065",
  fontWeight: 700,
  marginBottom: 18,
  letterSpacing: 1,
};

const cardStyle = {
  background: "#fff",
  borderRadius: 13,
  boxShadow: "0 3px 18px rgba(0,0,0,0.10)",
  marginBottom: 35,
  padding: "30px 28px 28px",
  maxWidth: 740,
};

const sectionTitleStyle = {
  fontSize: 21,
  color: "#2d4065",
  marginBottom: 16,
  fontWeight: 600,
};

const formStyle = {
  maxWidth: 500,
  margin: "auto",
};

const fieldStyle = {
  marginBottom: 19,
};

const labelStyle = {
  fontWeight: "500",
  color: "#34495e",
  fontSize: 15.2,
  display: "block",
  marginBottom: 7,
};

const inputStyle = {
  padding: "10px 13px",
  borderRadius: 7,
  border: "1px solid #dce1e7",
  width: "100%",
  fontSize: 15.6,
  outline: "none",
  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
};

const addButtonStyle = {
  background: "linear-gradient(90deg,#2d4065,#4667a7)",
  color: "#fff",
  padding: "12px 30px",
  border: "none",
  borderRadius: 7,
  cursor: "pointer",
  fontSize: 16,
  fontWeight: "600",
  boxShadow: "0 2px 7px #b3d3fa33",
  marginTop: 3,
  transition: "background 0.22s",
};

const previewContainerStyle = {
  marginTop: 11,
};

const posterPreviewStyle = {
  width: 126,
  borderRadius: 8,
  boxShadow: "0 4px 8px rgba(0,0,0,0.13)",
  display: "block",
  marginTop: 6,
};

// Table Styles
const tableStyle = {
  width: "100%",
  background: "#fafcff",
  borderCollapse: "collapse",
  borderRadius: 10,
  boxShadow: "0 1px 6px #d8e3ee11",
  overflow: "hidden",
  marginTop: 17,
};

const thStyle = {
  background: "#f5f7fb",
  color: "#2c3e50",
  padding: "10px 8.5px",
  textAlign: "left",
  borderBottom: "1px solid #eaeaea",
  fontSize: 15,
  fontWeight: 600,
  letterSpacing: 0.1,
};

const tdStyle = {
  padding: "8px 6.5px",
  borderBottom: "1px solid #ecf0f5",
  verticalAlign: "middle",
  fontSize: 15,
};

const rowHoverStyle = {
  transition: "background 0.2s",
};

const editButtonStyle = {
  background: "#378ce7",
  color: "#fff",
  border: "none",
  borderRadius: 4,
  padding: "4.5px 12.5px",
  cursor: "pointer",
  fontWeight: "500",
  fontSize: 14,
  marginRight: 7,
  transition: "background 0.2s",
};

const deleteButtonStyle = {
  background: "#ef4444",
  color: "#fff",
  border: "none",
  borderRadius: 4,
  padding: "4.5px 12px",
  cursor: "pointer",
  fontWeight: "500",
  fontSize: 14,
  transition: "background 0.2s",
};

// Modal
const modalStyle = {
  position: "fixed",
  left: 0,
  top: 0,
  width: "100vw",
  height: "100vh",
  background: "#141e2b99",
  zIndex: 100,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const modalContentStyle = {
  background: "#fff",
  borderRadius: 13,
  maxWidth: 500,              // Increased from 300 to 500 for a larger modal
  width: "96vw",
  maxHeight: "80vh",          // Limits modal height to 80% of viewport
  padding: "29px 32px 23px 32px",
  boxShadow: "0 6px 28px #0002",
  overflowY: "auto",          // Enables vertical scrolling if content exceeds maxHeight
};


const saveButtonStyle = {
  background: "#21b074",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  padding: "9px 23px",
  fontWeight: "bold",
  fontSize: 16,
  cursor: "pointer",
  marginRight: 11,
};

const cancelButtonStyle = {
  background: "#bbb",
  color: "#233",
  border: "none",
  borderRadius: 6,
  padding: "9px 22px",
  fontSize: 16,
  cursor: "pointer",
};
