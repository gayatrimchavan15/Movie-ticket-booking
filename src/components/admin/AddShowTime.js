import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import { db } from "../../firebaseConfig";
import { ref, onValue, set } from "firebase/database";

export default function AddShowtime() {
  const [theaters, setTheaters] = useState([]);
  const [movies, setMovies] = useState([]);
  const [selectedTheater, setSelectedTheater] = useState("");
  const [selectedMovie, setSelectedMovie] = useState("");
  const [showtimes, setShowtimes] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const theatersRef = ref(db, "theaters");
    onValue(theatersRef, snapshot => {
      const data = snapshot.val();
      if (data) {
        setTheaters(Object.entries(data).map(([id, t]) => ({ id, ...t })));
      }
    });
    const moviesRef = ref(db, "movies");
    onValue(moviesRef, snapshot => {
      const data = snapshot.val();
      if (data) {
        setMovies(Object.entries(data).map(([id, m]) => ({ id, ...m })));
      }
    });
  }, []);

  function handleAddShowtime(e) {
    e.preventDefault();
    if (!selectedTheater || !selectedMovie || !showtimes) {
      setMessage("Select theater, movie, and enter show timings.");
      return;
    }
    const showtimeArr = showtimes.split(",").map(t => t.trim()).filter(Boolean);
    if (showtimeArr.length === 0) {
      setMessage("Enter at least one valid showtime.");
      return;
    }
    set(ref(db, `theaters/${selectedTheater}/showtimes/${selectedMovie}`), showtimeArr)
      .then(() => {
        setMessage("Showtimes added!");
        setShowtimes("");
      })
      .catch(() => setMessage("Error adding showtimes."));
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f6f9fc" }}>
      <Sidebar activePath="/admin/add-showtime" />
      <div style={{ flex: 1, padding: "40px 30px" }}>
        <h2>Add Show Timing</h2>
        <form onSubmit={handleAddShowtime} style={formStyle}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Select Theater:</label>
            <select
              value={selectedTheater}
              onChange={e => setSelectedTheater(e.target.value)}
              style={inputStyle}
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
            />
          </div>
          <button
            type="submit"
            style={{
              background: "#2c3e50", color: "#fff", padding: "10px 24px",
              border: "none", borderRadius: 5, cursor: "pointer", fontSize: 16, marginTop: 15
            }}
          >
            Add Show Timings
          </button>
          {message && (
            <div style={{ marginTop: 18, color: message.includes("added") ? "#27ae60" : "#c0392b" }}>
              {message}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

// Internal CSS
const formStyle = { maxWidth: 420, marginTop: 28 };
const fieldStyle = { marginBottom: 22 };
const labelStyle = { fontWeight: "bold", marginBottom: 8, display: "block" };
const inputStyle = {
  padding: "8px 12px",
  borderRadius: 4,
  border: "1px solid #d5dae2",
  width: "100%",
  fontSize: 15
};