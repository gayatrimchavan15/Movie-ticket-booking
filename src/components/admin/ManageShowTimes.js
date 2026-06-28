import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import { db } from "../../firebaseConfig";
import { ref, onValue, set, update, remove } from "firebase/database";

function ShowtimesAdminPage() {
  const [theaters, setTheaters] = useState([]);
  const [movies, setMovies] = useState([]);
  const [selectedTheater, setSelectedTheater] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedMovie, setSelectedMovie] = useState("");
  const [timings, setTimings] = useState("");
  const [editMode, setEditMode] = useState(null);
  const [searchTheater, setSearchTheater] = useState("");
  const [searchMovie, setSearchMovie] = useState("");
  const [activeTab, setActiveTab] = useState("add");

  // ==================== FETCH THEATERS ====================
  useEffect(() => {
    onValue(ref(db, "theaters"), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const allTheaters = Object.entries(data).map(([id, obj]) => ({
          id,
          name: obj.name || obj.theaterName || "",
          city: obj.city || "",
          showtimes: obj.showtimes || {},
        }));
        setTheaters(allTheaters);
      }
    });
  }, []);

  // ==================== FETCH MOVIES ====================
  useEffect(() => {
    onValue(ref(db, "movies"), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const allMovies = Object.values(data).map((m) => ({ id: m.id, title: m.title }));
        setMovies(allMovies);
      }
    });
  }, []);

  // ==================== FLATTEN SHOWTIME LIST ====================
  const theaterShowtimes = theaters.map((theater) => {
    const moviesList = [];
    const showtimes = theater.showtimes || {};
    Object.entries(showtimes).forEach(([date, moviesObj]) => {
      Object.entries(moviesObj).forEach(([movieId, data]) => {
        moviesList.push({
          movieId,
          movieTitle: data.title,
          date,
          timings: data.timings || [],
        });
      });
    });
    return {
      id: theater.id,
      name: theater.name,
      city: theater.city,
      movies: moviesList,
    };
  });

  // ==================== SAVE / UPDATE SHOWTIME ====================
  const handleSaveShowtime = () => {
    if (!selectedTheater || !selectedDate || !selectedMovie || !timings) {
      alert("⚠️ Please fill all required fields!");
      return;
    }

    const timingArray = timings.split(",").map((t) => t.trim());
    const showtimePath = `theaters/${selectedTheater}/showtimes/${selectedDate}/${selectedMovie}`;
    const showtimeRef = ref(db, showtimePath);
    const movieTitle = movies.find((m) => m.id === selectedMovie)?.title || "Untitled Movie";

    const showtimeData = {
      title: movieTitle,
      timings: timingArray,
    };

    if (editMode) {
      update(showtimeRef, showtimeData);
      setEditMode(null);
    } else {
      set(showtimeRef, showtimeData);
    }

    resetForm();
  };

  const handleDeleteShowtime = (theaterId, date, movieId) => {
    if (window.confirm("Are you sure you want to delete this showtime?")) {
      const showtimeRef = ref(db, `theaters/${theaterId}/showtimes/${date}/${movieId}`);
      remove(showtimeRef);
    }
  };

  const handleEditShowtime = (st) => {
    setSelectedTheater(st.theaterId || st.id);
    setSelectedDate(st.date);
    setSelectedMovie(st.movieId);
    setTimings(st.timings.join(", "));
    setEditMode({ theaterId: st.theaterId || st.id, date: st.date, movieId: st.movieId });
    setActiveTab("add");
  };

  const resetForm = () => {
    setSelectedTheater("");
    setSelectedDate("");
    setSelectedMovie("");
    setTimings("");
    setEditMode(null);
  };

  // ==================== FILTER THEATERS + MOVIES ====================
  const filteredTheaters = theaterShowtimes
    .filter(theater => !searchTheater || theater.id === searchTheater)
    .map(theater => ({
      ...theater,
      movies: theater.movies.filter(movie => !searchMovie || movie.movieId === searchMovie)
    }))
    .filter(theater => theater.movies.length > 0);

  return (
    <div style={styles.page}>
      <Sidebar />
      <div style={styles.container}>
        
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.mainTitle}>🎬 Showtimes Management</h1>
          <p style={styles.subtitle}>Manage movie showtimes across all theaters</p>
        </div>

        {/* Tab Navigation */}
        <div style={styles.tabContainer}>
          <button 
            style={{
              ...styles.tab,
              ...(activeTab === "add" ? styles.tabActive : {})
            }}
            onClick={() => setActiveTab("add")}
          >
            ➕ Add Showtime
          </button>
          <button 
            style={{
              ...styles.tab,
              ...(activeTab === "manage" ? styles.tabActive : {})
            }}
            onClick={() => setActiveTab("manage")}
          >
            📋 Manage Showtimes
          </button>
        </div>

        {/* ===== ADD SHOWTIME SECTION ===== */}
        {activeTab === "add" && (
          <div style={styles.section}>
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>
                {editMode ? "✏️ Edit Showtime" : "➕ Add New Showtime"}
              </h2>
              
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Theater *</label>
                  <select
                    value={selectedTheater}
                    onChange={(e) => setSelectedTheater(e.target.value)}
                    style={styles.input}
                  >
                    <option value="">Select Theater</option>
                    {theaters.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} {t.city && `(${t.city})`}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Date *</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Movie *</label>
                  <select
                    value={selectedMovie}
                    onChange={(e) => setSelectedMovie(e.target.value)}
                    style={styles.input}
                  >
                    <option value="">Select Movie</option>
                    {movies.map((m) => (
                      <option key={m.id} value={m.id}>{m.title}</option>
                    ))}
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Show Times *</label>
                  <input
                    type="text"
                    placeholder="10:00 AM, 01:00 PM, 06:00 PM"
                    value={timings}
                    onChange={(e) => setTimings(e.target.value)}
                    style={styles.input}
                  />
                  <small style={styles.helperText}>Separate multiple times with commas</small>
                </div>
              </div>

              <div style={styles.buttonGroup}>
                <button onClick={handleSaveShowtime} style={styles.primaryButton}>
                  {editMode ? "🔄 Update Showtime" : "💾 Save Showtime"}
                </button>
                {editMode && (
                  <button onClick={resetForm} style={styles.secondaryButton}>
                    ❌ Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===== MANAGE SHOWTIME SECTION ===== */}
        {activeTab === "manage" && (
          <div style={styles.section}>
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>📋 All Showtimes</h2>
              
              {/* Search Filters */}
              <div style={styles.filterSection}>
                <div style={styles.filterGrid}>
                  <div style={styles.filterGroup}>
                    <label style={styles.filterLabel}>Filter by Theater</label>
                    <select
                      value={searchTheater}
                      onChange={e => setSearchTheater(e.target.value)}
                      style={styles.filterInput}
                    >
                      <option value="">All Theaters</option>
                      {theaters.map(t => (
                        <option key={t.id} value={t.id}>{t.name} {t.city && `(${t.city})`}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div style={styles.filterGroup}>
                    <label style={styles.filterLabel}>Filter by Movie</label>
                    <select
                      value={searchMovie}
                      onChange={e => setSearchMovie(e.target.value)}
                      style={styles.filterInput}
                    >
                      <option value="">All Movies</option>
                      {movies.map(m => (
                        <option key={m.id} value={m.id}>{m.title}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Showtimes Table */}
              {filteredTheaters.length === 0 ? (
                <div style={styles.emptyState}>
                  <div style={styles.emptyIcon}>🎭</div>
                  <h3 style={styles.emptyTitle}>No Showtimes Found</h3>
                  <p style={styles.emptyText}>
                    {searchTheater || searchMovie 
                      ? "Try adjusting your filters to see more results." 
                      : "Get started by adding your first showtime!"}
                  </p>
                </div>
              ) : (
                <div style={styles.tableContainer}>
                  {filteredTheaters.map((theater, idx) => (
                    <div key={idx} style={styles.theaterSection}>
                      <div style={styles.theaterHeader}>
                        <h3 style={styles.theaterName}>
                          🎪 {theater.name} 
                          {theater.city && <span style={styles.theaterCity}> • {theater.city}</span>}
                        </h3>
                        <span style={styles.showtimeCount}>
                          {theater.movies.length} showtime{theater.movies.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      
                      <div style={styles.tableWrapper}>
                        <table style={styles.table}>
                          <thead>
                            <tr>
                              <th style={styles.th}>Movie</th>
                              <th style={styles.th}>Date</th>
                              <th style={styles.th}>Show Times</th>
                              <th style={styles.th}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {theater.movies.map((m, i) => (
                              <tr key={i} style={i % 2 === 0 ? styles.evenRow : styles.oddRow}>
                                <td style={styles.td}>
                                  <div style={styles.movieCell}>
                                    <span style={styles.movieTitle}>{m.movieTitle}</span>
                                  </div>
                                </td>
                                <td style={styles.td}>
                                  <span style={styles.dateBadge}>{m.date}</span>
                                </td>
                                <td style={styles.td}>
                                  <div style={styles.timings}>
                                    {m.timings.map((time, index) => (
                                      <span key={index} style={styles.timeBadge}>
                                        {time}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                                <td style={styles.td}>
                                  <div style={styles.actionButtons}>
                                    <button 
                                      onClick={() => handleEditShowtime({ ...m, theaterId: theater.id })} 
                                      style={styles.editButton}
                                      title="Edit Showtime"
                                    >
                                      ✏️ Edit
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteShowtime(theater.id, m.date, m.movieId)} 
                                      style={styles.deleteButton}
                                      title="Delete Showtime"
                                    >
                                      🗑️ Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
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
  tabContainer: {
    display: "flex",
    gap: "10px",
    marginBottom: "30px",
    background: "white",
    padding: "8px",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
    border: "1px solid #e2e8f0"
  },
  tab: {
    flex: 1,
    padding: "12px 20px",
    border: "none",
    borderRadius: "8px",
    backgroundColor: "transparent",
    color: "#64748b",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
  tabActive: {
    backgroundColor: "#6366f1",
    color: "white",
    boxShadow: "0 2px 8px rgba(99, 102, 241, 0.3)",
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
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "20px",
    marginBottom: "30px"
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
  helperText: {
    fontSize: "12px",
    color: "#6b7280",
    fontStyle: "italic"
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
  secondaryButton: {
    backgroundColor: "#6b7280",
    color: "white",
    border: "none",
    padding: "14px 24px",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: "600",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  filterSection: {
    marginBottom: "25px"
  },
  filterGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "15px"
  },
  filterGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },
  filterLabel: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#374151"
  },
  filterInput: {
    padding: "10px 12px",
    borderRadius: "8px",
    border: "2px solid #e2e8f0",
    fontSize: "14px",
    outline: "none",
    backgroundColor: "#f8fafc"
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
  theaterSection: {
    marginBottom: "32px"
  },
  theaterHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
    padding: "16px 20px",
    backgroundColor: "#f1f5f9",
    borderRadius: "12px",
    border: "1px solid #e2e8f0"
  },
  theaterName: {
    fontSize: "1.2rem",
    fontWeight: "600",
    color: "#1e293b",
    margin: 0
  },
  theaterCity: {
    color: "#6366f1",
    fontWeight: "500"
  },
  showtimeCount: {
    backgroundColor: "#6366f1",
    color: "white",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600"
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
  movieCell: {
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  movieTitle: {
    fontWeight: "500",
    color: "#1e293b"
  },
  dateBadge: {
    backgroundColor: "#e0f2fe",
    color: "#0369a1",
    padding: "6px 12px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "600"
  },
  timings: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px"
  },
  timeBadge: {
    backgroundColor: "#f0fdf4",
    color: "#166534",
    padding: "4px 8px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "500",
    border: "1px solid #dcfce7"
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

styles.secondaryButton.onHover = {
  transform: "translateY(-2px)",
  boxShadow: "0 4px 12px rgba(107, 114, 128, 0.3)"
};

styles.editButton.onHover = {
  backgroundColor: "#d97706",
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

export default ShowtimesAdminPage;