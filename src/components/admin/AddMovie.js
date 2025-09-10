import React, { useState } from "react";
import Sidebar from "./Sidebar";
import { db } from "../../firebaseConfig";
import { ref as dbRef, push, set } from "firebase/database";

export default function AddMovie() {
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const [status, setStatus] = useState("Upcoming");
  const [posterUrl, setPosterUrl] = useState("");
  const [message, setMessage] = useState("");

  function handleAddMovie(e) {
    e.preventDefault();
    if (!title || !genre || !releaseDate || !status || !posterUrl) {
      setMessage("Please fill all fields including poster URL.");
      return;
    }
    const moviesRef = dbRef(db, "movies");
    const newMovieRef = push(moviesRef);
    set(newMovieRef, {
      title,
      genre,
      releaseDate,
      status,
      posterUrl
    })
      .then(() => {
        setMessage("Movie added successfully!");
        setTitle("");
        setGenre("");
        setReleaseDate("");
        setStatus("Upcoming");
        setPosterUrl("");
      })
      .catch(() => setMessage("Error adding movie. Try again."));
  }

  return (
    <div style={containerStyle}>
      <Sidebar activePath="/admin/add-movie" />
      <div style={mainContentStyle}>
        <h2 style={headingStyle}>Add New Movie</h2>
        <form onSubmit={handleAddMovie} style={formStyle}>
          {/* Title */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Title:</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Movie Title"
              style={inputStyle}
            />
          </div>

          {/* Genre */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Genre:</label>
            <input
              type="text"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              placeholder="Genre (Action, Comedy, ...)"
              style={inputStyle}
            />
          </div>

          {/* Release Date */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Release Date:</label>
            <input
              type="date"
              value={releaseDate}
              onChange={(e) => setReleaseDate(e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Status */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Status:</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={inputStyle}
            >
              <option value="Active">Active</option>
              <option value="Upcoming">Upcoming</option>
            </select>
          </div>

          {/* Poster URL */}
          <div style={fieldStyle}>
            <label style={labelStyle}>Movie Poster URL:</label>
            <input
              type="text"
              value={posterUrl}
              onChange={(e) => setPosterUrl(e.target.value)}
              placeholder="Paste image URL here (e.g. https://...)"
              style={inputStyle}
            />
            {posterUrl && (
              <div style={previewContainerStyle}>
                <img
                  src={posterUrl}
                  alt="Preview Poster"
                  style={posterPreviewStyle}
                />
              </div>
            )}
          </div>

          {/* Button */}
          <button type="submit" style={buttonStyle}>
            Add Movie
          </button>

          {/* Message */}
          {message && (
            <div
              style={{
                marginTop: 18,
                color: message.includes("success")
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
    </div>
  );
}

// Internal CSS styles
const containerStyle = {
  display: "flex",
  minHeight: "100vh",
  background: "#f4f6f9",
};

const mainContentStyle = {
  flex: 1,
  padding: "40px 30px",
};

const headingStyle = {
  fontSize: "28px",
  marginBottom: "20px",
  color: "#2c3e50",
  fontWeight: "600",
};

const formStyle = {
  maxWidth: 460,
  background: "#fff",
  padding: "30px 25px",
  borderRadius: 12,
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
};

const fieldStyle = {
  marginBottom: 22,
};

const labelStyle = {
  fontWeight: "500",
  marginBottom: 8,
  display: "block",
  color: "#34495e",
  fontSize: 15,
};

const inputStyle = {
  padding: "10px 14px",
  borderRadius: 6,
  border: "1px solid #dce1e7",
  width: "100%",
  fontSize: 15,
  outline: "none",
  transition: "0.2s ease-in-out",
  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
};

const buttonStyle = {
  background: "#2c3e50",
  color: "#fff",
  padding: "12px 28px",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 16,
  fontWeight: "500",
  marginTop: 20,
  transition: "background 0.3s ease",
};

const previewContainerStyle = {
  marginTop: 12,
};

const posterPreviewStyle = {
  width: 140,
  borderRadius: 8,
  boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
};
