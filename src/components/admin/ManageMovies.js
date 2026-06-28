import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar"; // Adjust the path if needed
import { db } from "../../firebaseConfig";
import { ref, onValue, push, set as dbSet, remove } from "firebase/database";

export default function AdminMoviesPage() {
  const [movies, setMovies] = useState([]);
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [language, setLanguage] = useState("");
  const [duration, setDuration] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const [posterUrl, setPosterUrl] = useState("");
  const [trailerUrl, setTrailerUrl] = useState("");
  const [about, setAbout] = useState("");
  const [editMovie, setEditMovie] = useState(null);
  const [editFields, setEditFields] = useState({});
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const moviesRef = ref(db, "movies");
    onValue(moviesRef, (snapshot) => {
      const data = snapshot.val() || {};
      const arr = Object.keys(data).map((id) => ({ id, ...data[id] }));
      setMovies(arr);
    });
  }, []);

  const handleAddMovie = (e) => {
    e.preventDefault();
    const moviesRef = ref(db, "movies");
    const newMovieRef = push(moviesRef);
    dbSet(newMovieRef, {
      title,
      genre,
      language,
      duration,
      releaseDate,
      posterUrl,
      trailerUrl,
      about
    }).then(() => {
      setTitle("");
      setGenre("");
      setLanguage("");
      setDuration("");
      setReleaseDate("");
      setPosterUrl("");
      setTrailerUrl("");
      setAbout("");
    });
  };

  const handleEditSave = (e) => {
    e.preventDefault();
    dbSet(ref(db, `movies/${editMovie.id}`), editFields).then(() => {
      setEditMovie(null);
      setShowModal(false);
    });
  };

  const handleDelete = (id) => {
    remove(ref(db, `movies/${id}`));
  };

  const openEditModal = (movie) => {
    setEditMovie(movie);
    setEditFields(movie);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditMovie(null);
  };

  // Sidebar active path for highlight
  const activePath = "/admin/managemovies";

  return (
    <div style={containerStyle}>
      <Sidebar activePath={activePath} />
      <div style={mainContentStyle}>
        <h2 style={headingStyle}>🎬 Admin – Manage Movies</h2>
        <form onSubmit={handleAddMovie} style={formStyle}>
          <div style={rowStyle}>
            <input style={inputStyle} placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
            <input style={inputStyle} placeholder="Genre" value={genre} onChange={e => setGenre(e.target.value)} />
          </div>
          <div style={rowStyle}>
            <input style={inputStyle} placeholder="Language" value={language} onChange={e => setLanguage(e.target.value)} />
            <input style={inputStyle} placeholder="Duration" value={duration} onChange={e => setDuration(e.target.value)} />
          </div>
          <div style={rowStyle}>
            <input style={inputStyle} placeholder="Release Date" value={releaseDate} onChange={e => setReleaseDate(e.target.value)} />
            <input style={inputStyle} placeholder="Poster URL" value={posterUrl} onChange={e => setPosterUrl(e.target.value)} />
          </div>
          <div style={rowStyle}>
            <input style={inputStyle} placeholder="Trailer URL" value={trailerUrl} onChange={e => setTrailerUrl(e.target.value)} />
          </div>
          <textarea style={textareaStyle} placeholder="About the movie" value={about} onChange={e => setAbout(e.target.value)} />
          <button type="submit" style={addButtonStyle}>➕ Add Movie</button>
        </form>
        <h3 style={subHeadingStyle}>Current Movies</h3>
        {movies.length === 0 && <p style={noMoviesStyle}>No movies added yet</p>}
        {movies.map((m) => (
          <div key={m.id} style={movieCardStyle}>
            <div>
              <strong style={movieTitleStyle}>{m.title}</strong>
              {" "}
              <span style={movieLanguageStyle}>({m.language})</span>
              {" "}
              {m.genre && <span style={movieGenreStyle}>| {m.genre}</span>}
              {m.duration && <span style={movieDurationStyle}> | {m.duration}</span>}
              {m.releaseDate && <span style={movieReleaseDateStyle}> | {m.releaseDate}</span>}
            </div>
            <div>
              <button style={editButtonStyle} onClick={() => openEditModal(m)}>Edit</button>
              <button style={deleteButtonStyle} onClick={() => handleDelete(m.id)}>Delete</button>
            </div>
          </div>
        ))}
        {showModal && (
          <div style={modalOverlayStyle}>
            <div style={modalContentStyle}>
              <h3 style={subHeadingStyle}>✏️ Edit Movie</h3>
              <form onSubmit={handleEditSave}>
                <div style={rowStyle}>
                  <input style={inputStyle} placeholder="Title" value={editFields.title || ""} onChange={e => setEditFields({ ...editFields, title: e.target.value })} />
                  <input style={inputStyle} placeholder="Genre" value={editFields.genre || ""} onChange={e => setEditFields({ ...editFields, genre: e.target.value })} />
                </div>
                <div style={rowStyle}>
                  <input style={inputStyle} placeholder="Language" value={editFields.language || ""} onChange={e => setEditFields({ ...editFields, language: e.target.value })} />
                  <input style={inputStyle} placeholder="Duration" value={editFields.duration || ""} onChange={e => setEditFields({ ...editFields, duration: e.target.value })} />
                </div>
                <div style={rowStyle}>
                  <input style={inputStyle} placeholder="Release Date" value={editFields.releaseDate || ""} onChange={e => setEditFields({ ...editFields, releaseDate: e.target.value })} />
                  <input style={inputStyle} placeholder="Poster URL" value={editFields.posterUrl || ""} onChange={e => setEditFields({ ...editFields, posterUrl: e.target.value })} />
                </div>
                <div style={rowStyle}>
                  <input style={inputStyle} placeholder="Trailer URL" value={editFields.trailerUrl || ""} onChange={e => setEditFields({ ...editFields, trailerUrl: e.target.value })} />
                </div>
                <textarea style={textareaStyle} placeholder="About the movie" value={editFields.about || ""} onChange={e => setEditFields({ ...editFields, about: e.target.value })} />
                <div style={modalActionsStyle}>
                  <button type="submit" style={saveButtonStyle}>💾 Save Changes</button>
                  <button type="button" style={cancelButtonStyle} onClick={closeModal}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

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

const subHeadingStyle = {
  fontSize: 22,
  marginTop: 34,
  color: "#19647e",
  fontWeight: 600
};

const formStyle = {
  background: "white",
  border: "1px solid rgba(255,255,255,0.2)",
  borderRadius: "16px",
  padding: "30px",
  marginBottom: "30px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.08)"
};

const rowStyle = {
  display: "flex",
  gap: 18,
  marginBottom: 18,
  flexWrap: "wrap"
};

const inputStyle = {
  flex: 1,
  padding: "12px 16px",
  border: "2px solid #E5E7EB",
  borderRadius: "12px",
  fontSize: "14px",
  fontWeight: "500",
  color: "#374151",
  background: "white",
  transition: "all 0.2s ease",
  outline: "none"
};

const textareaStyle = {
  width: "100%",
  minHeight: "80px",
  padding: "12px 16px",
  border: "2px solid #E5E7EB",
  borderRadius: "12px",
  fontSize: "14px",
  fontWeight: "500",
  color: "#374151",
  background: "white",
  transition: "all 0.2s ease",
  outline: "none",
  resize: "vertical",
  marginBottom: "18px"
};

const addButtonStyle = {
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  color: "white",
  border: "none",
  borderRadius: "12px",
  padding: "12px 24px",
  fontSize: "14px",
  fontWeight: "600",
  cursor: "pointer",
  transition: "all 0.2s ease",
  boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
  textTransform: "uppercase",
  letterSpacing: "0.5px"
};

const movieCardStyle = {
  background: "white",
  border: "1px solid rgba(255,255,255,0.2)",
  borderRadius: "16px",
  padding: "24px",
  marginBottom: "20px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
  transition: "all 0.3s ease"
};

const movieTitleStyle = {
  color: "#1a191bff",
  fontWeight: 700,
  fontSize: 19
};

const movieLanguageStyle = {
  color: "#19647e",
  fontWeight: 600,
  fontSize: 16
};

const movieGenreStyle = {
  color: "#33a8a5",
  fontWeight: 500,
  fontSize: 15
};

const movieDurationStyle = {
  color: "#fd7473",
  fontWeight: 500,
  fontSize: 15
};

const movieReleaseDateStyle = {
  color: "#551975",
  fontWeight: 500,
  fontSize: 15
};

const editButtonStyle = {
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  color: "white",
  border: "none",
  padding: "8px 16px",
  marginRight: "8px",
  borderRadius: "8px",
  fontSize: "12px",
  fontWeight: "600",
  cursor: "pointer",
  transition: "all 0.2s ease",
  boxShadow: "0 2px 8px rgba(102, 126, 234, 0.3)",
  textTransform: "uppercase",
  letterSpacing: "0.5px"
};

const deleteButtonStyle = {
  background: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
  color: "white",
  border: "none",
  padding: "8px 16px",
  borderRadius: "8px",
  fontSize: "12px",
  fontWeight: "600",
  cursor: "pointer",
  transition: "all 0.2s ease",
  boxShadow: "0 2px 8px rgba(239, 68, 68, 0.3)",
  textTransform: "uppercase",
  letterSpacing: "0.5px"
};

const noMoviesStyle = {
  color: "#868686",
  fontStyle: "italic",
  paddingLeft: 10,
  fontSize: 15
};

const modalOverlayStyle = {
  position: "fixed",
  top: 0, left: 0, right: 0, bottom: 0,
  background: "rgba(51, 168, 165, 0.058)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 99
};

const modalContentStyle = {
  background: "#f7f4fb",
  padding: 35,
  borderRadius: 16,
  boxShadow: "0 8px 30px rgba(85,25,117,0.17)",
  minWidth: 380,
  maxWidth: 480
};

const modalActionsStyle = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 16,
  marginTop: 14
};

const saveButtonStyle = {
  background: "linear-gradient(90deg, #33a8a5 0%, #8e32e9 100%)",
  color: "#fff",
  border: "none",
  padding: "12px 25px",
  borderRadius: 6,
  fontSize: 16,
  fontWeight: 500,
  cursor: "pointer",
  boxShadow: "0 2px 8px rgba(51,168,165,0.07)",
  marginRight: 12,
  transition: "background 0.2s"
};

const cancelButtonStyle = {
  background: "#f7f4fb",
  color: "#551975",
  border: "1px solid #d9deea",
  padding: "12px 25px",
  borderRadius: 6,
  fontSize: 16,
  fontWeight: 500,
  cursor: "pointer",
  transition: "background 0.18s"
};
