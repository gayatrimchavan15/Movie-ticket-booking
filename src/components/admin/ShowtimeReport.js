import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import { db } from "../../firebaseConfig";
import { ref, onValue } from "firebase/database";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";

export default function ShowtimesReportPage() {
  const navigate = useNavigate();
  const [theaters, setTheaters] = useState([]);
  const [movies, setMovies] = useState([]);
  const [showtimes, setShowtimes] = useState([]);
  const [filteredShowtimes, setFilteredShowtimes] = useState([]);
  const [filters, setFilters] = useState({
    theater: "",
    movie: "",
    dateFrom: "",
    dateTo: "",
    city: ""
  });
  const [stats, setStats] = useState({
    totalShowtimes: 0,
    totalTheaters: 0,
    totalMovies: 0,
    totalDates: 0
  });
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: 'datetime', direction: 'asc' });

  // ==================== FETCH DATA ====================
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Fetch theaters
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

      // Fetch movies
      onValue(ref(db, "movies"), (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const allMovies = Object.values(data).map((m) => ({ 
            id: m.id, 
            title: m.title,
            genre: m.genre || "N/A",
            duration: m.duration || "N/A"
          }));
          setMovies(allMovies);
        }
      });
    };

    fetchData();
  }, []);

  // ==================== PROCESS SHOWTIMES ====================
  useEffect(() => {
    if (theaters.length > 0) {
      const allShowtimes = [];
      
      theaters.forEach((theater) => {
        const showtimesData = theater.showtimes || {};
        
        Object.entries(showtimesData).forEach(([date, moviesObj]) => {
          Object.entries(moviesObj).forEach(([movieId, data]) => {
            const movie = movies.find(m => m.id === movieId) || {};
            (data.timings || []).forEach((time) => {
              allShowtimes.push({
                id: `${theater.id}_${date}_${movieId}_${time}`,
                theaterId: theater.id,
                theaterName: theater.name,
                theaterCity: theater.city,
                movieId: movieId,
                movieTitle: data.title || movie.title || "Unknown Movie",
                movieGenre: movie.genre || "N/A",
                movieDuration: movie.duration || "N/A",
                date: date,
                time: time,
                datetime: new Date(`${date} ${time}`),
                dayOfWeek: new Date(date).toLocaleDateString('en-US', { weekday: 'long' })
              });
            });
          });
        });
      });

      // Sort by date and time
      allShowtimes.sort((a, b) => a.datetime - b.datetime);
      
      setShowtimes(allShowtimes);
      setFilteredShowtimes(allShowtimes);
      setLoading(false);
    }
  }, [theaters, movies]);

  // ==================== UPDATE STATISTICS ====================
  useEffect(() => {
    if (filteredShowtimes.length > 0) {
      const uniqueTheaters = new Set(filteredShowtimes.map(st => st.theaterId));
      const uniqueMovies = new Set(filteredShowtimes.map(st => st.movieId));
      const uniqueDates = new Set(filteredShowtimes.map(st => st.date));

      setStats({
        totalShowtimes: filteredShowtimes.length,
        totalTheaters: uniqueTheaters.size,
        totalMovies: uniqueMovies.size,
        totalDates: uniqueDates.size
      });
    } else {
      setStats({
        totalShowtimes: 0,
        totalTheaters: 0,
        totalMovies: 0,
        totalDates: 0
      });
    }
  }, [filteredShowtimes]);

  // ==================== FILTER SHOWTIMES ====================
  useEffect(() => {
    let filtered = [...showtimes];

    if (filters.theater) {
      filtered = filtered.filter(st => st.theaterId === filters.theater);
    }

    if (filters.movie) {
      filtered = filtered.filter(st => st.movieId === filters.movie);
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(st => st.date >= filters.dateFrom);
    }

    if (filters.dateTo) {
      filtered = filtered.filter(st => st.date <= filters.dateTo);
    }

    if (filters.city) {
      filtered = filtered.filter(st => 
        st.theaterCity.toLowerCase().includes(filters.city.toLowerCase())
      );
    }

    setFilteredShowtimes(filtered);
  }, [filters, showtimes]);

  // ==================== SORTING ====================
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedShowtimes = React.useMemo(() => {
    let sortableItems = [...filteredShowtimes];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredShowtimes, sortConfig]);

  // ==================== HANDLERS ====================
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      theater: "",
      movie: "",
      dateFrom: "",
      dateTo: "",
      city: ""
    });
  };

  // ==================== EXPORT FUNCTIONS ====================
  const exportToExcel = () => {
    const worksheetData = sortedShowtimes.map(st => ({
      "Theater": st.theaterName,
      "City": st.theaterCity,
      "Movie": st.movieTitle,
      "Genre": st.movieGenre,
      "Duration": st.movieDuration,
      "Date": st.date,
      "Day": st.dayOfWeek,
      "Time": st.time,
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Showtimes Report");
    
    // Auto-size columns
    const colWidths = [
      { wch: 20 }, // Theater
      { wch: 15 }, // City
      { wch: 30 }, // Movie
      { wch: 15 }, // Genre
      { wch: 10 }, // Duration
      { wch: 12 }, // Date
      { wch: 10 }, // Day
      { wch: 10 }  // Time
    ];
    worksheet['!cols'] = colWidths;

    XLSX.writeFile(workbook, `showtimes-report-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToCSV = () => {
    const headers = ["Theater", "City", "Movie", "Genre", "Duration", "Date", "Day", "Time"];
    const csvData = sortedShowtimes.map(st => [
      st.theaterName,
      st.theaterCity,
      `"${st.movieTitle}"`,
      st.movieGenre,
      st.movieDuration,
      st.date,
      st.dayOfWeek,
      st.time
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `showtimes-report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ==================== RENDER ====================
  const getSortIndicator = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
    }
    return '';
  };

  return (
    <div style={styles.page}>
      <Sidebar />
      <div style={styles.container}>
        
        {/* Header */}
        <div style={styles.header}>
          <button 
            onClick={() => navigate("/admin/ReportsAnalytics")}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px',
              transition: 'all 0.2s ease'
            }}
          >
            ← Back to Reports
          </button>
          <h1 style={styles.mainTitle}>📊 Showtimes Report</h1>
          <p style={styles.subtitle}>Comprehensive overview of all movie showtimes</p>
        </div>

        {/* Statistics Cards */}
        {!loading && (
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>🎬</div>
              <div style={styles.statInfo}>
                <div style={styles.statNumber}>{stats.totalShowtimes}</div>
                <div style={styles.statLabel}>Total Showtimes</div>
              </div>
            </div>
            
            <div style={styles.statCard}>
              <div style={styles.statIcon}>🎪</div>
              <div style={styles.statInfo}>
                <div style={styles.statNumber}>{stats.totalTheaters}</div>
                <div style={styles.statLabel}>Theaters</div>
              </div>
            </div>
            
            <div style={styles.statCard}>
              <div style={styles.statIcon}>🎭</div>
              <div style={styles.statInfo}>
                <div style={styles.statNumber}>{stats.totalMovies}</div>
                <div style={styles.statLabel}>Movies</div>
              </div>
            </div>
            
            <div style={styles.statCard}>
              <div style={styles.statIcon}>📅</div>
              <div style={styles.statInfo}>
                <div style={styles.statNumber}>{stats.totalDates}</div>
                <div style={styles.statLabel}>Dates</div>
              </div>
            </div>
          </div>
        )}

        {/* Filters Section */}
        <div style={styles.section}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>🔍 Filter Report</h2>
            
            <div style={styles.filterGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Theater</label>
                <select
                  value={filters.theater}
                  onChange={(e) => handleFilterChange("theater", e.target.value)}
                  style={styles.input}
                >
                  <option value="">All Theaters</option>
                  {theaters.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} {t.city && `(${t.city})`}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Movie</label>
                <select
                  value={filters.movie}
                  onChange={(e) => handleFilterChange("movie", e.target.value)}
                  style={styles.input}
                >
                  <option value="">All Movies</option>
                  {movies.map((m) => (
                    <option key={m.id} value={m.id}>{m.title}</option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>City</label>
                <input
                  type="text"
                  placeholder="Filter by city..."
                  value={filters.city}
                  onChange={(e) => handleFilterChange("city", e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Date From</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Date To</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.filterActions}>
              <button onClick={clearFilters} style={styles.secondaryButton}>
                🗑️ Clear Filters
              </button>
              <div style={styles.exportButtons}>
                <button onClick={exportToCSV} style={styles.exportButton}>
                  📄 Export CSV
                </button>
                <button onClick={exportToExcel} style={styles.exportButton}>
                  📊 Export Excel
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Report Table */}
        <div style={styles.section}>
          <div style={styles.card}>
            <div style={styles.reportHeader}>
              <h2 style={styles.cardTitle}>📋 Showtimes Report</h2>
              <div style={styles.resultsInfo}>
                Showing {sortedShowtimes.length} showtime{sortedShowtimes.length !== 1 ? 's' : ''}
              </div>
            </div>

            {loading ? (
              <div style={styles.loadingState}>
                <div style={styles.loadingSpinner}></div>
                <p>Loading showtimes data...</p>
              </div>
            ) : sortedShowtimes.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>🔍</div>
                <h3 style={styles.emptyTitle}>No Showtimes Found</h3>
                <p style={styles.emptyText}>
                  {Object.values(filters).some(f => f) 
                    ? "Try adjusting your filters to see more results." 
                    : "No showtimes data available."}
                </p>
              </div>
            ) : (
              <div style={styles.tableContainer}>
                <div style={styles.tableWrapper}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th 
                          style={styles.th} 
                          onClick={() => handleSort('theaterName')}
                        >
                          Theater{getSortIndicator('theaterName')}
                        </th>
                        <th 
                          style={styles.th}
                          onClick={() => handleSort('theaterCity')}
                        >
                          City{getSortIndicator('theaterCity')}
                        </th>
                        <th 
                          style={styles.th}
                          onClick={() => handleSort('movieTitle')}
                        >
                          Movie{getSortIndicator('movieTitle')}
                        </th>
                        <th style={styles.th}>Genre</th>
                        <th style={styles.th}>Duration</th>
                        <th 
                          style={styles.th}
                          onClick={() => handleSort('date')}
                        >
                          Date{getSortIndicator('date')}
                        </th>
                        <th 
                          style={styles.th}
                          onClick={() => handleSort('dayOfWeek')}
                        >
                          Day{getSortIndicator('dayOfWeek')}
                        </th>
                        <th 
                          style={styles.th}
                          onClick={() => handleSort('time')}
                        >
                          Time{getSortIndicator('time')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedShowtimes.map((st, index) => (
                        <tr key={st.id} style={index % 2 === 0 ? styles.evenRow : styles.oddRow}>
                          <td style={styles.td}>
                            <div style={styles.theaterCell}>
                              <span style={styles.theaterName}>{st.theaterName}</span>
                            </div>
                          </td>
                          <td style={styles.td}>
                            <span style={styles.cityBadge}>{st.theaterCity}</span>
                          </td>
                          <td style={styles.td}>
                            <div style={styles.movieCell}>
                              <span style={styles.movieTitle}>{st.movieTitle}</span>
                            </div>
                          </td>
                          <td style={styles.td}>
                            <span style={styles.genreBadge}>{st.movieGenre}</span>
                          </td>
                          <td style={styles.td}>
                            <span style={styles.durationText}>{st.movieDuration}</span>
                          </td>
                          <td style={styles.td}>
                            <span style={styles.dateBadge}>{st.date}</span>
                          </td>
                          <td style={styles.td}>
                            <span style={styles.dayBadge}>{st.dayOfWeek}</span>
                          </td>
                          <td style={styles.td}>
                            <span style={styles.timeBadge}>{st.time}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div style={styles.tableFooter}>
                  <div style={styles.tableSummary}>
                    Displaying {sortedShowtimes.length} showtime{sortedShowtimes.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add CSS as style tag instead of injecting */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          .sortable-header:hover {
            background-color: #f1f5f9 !important;
          }
        `}
      </style>
    </div>
  );
}

// ==================== STYLES ====================
const styles = {
  page: { 
    display: "flex", 
    backgroundColor: "#f8fafc", 
    minHeight: "100vh",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
  },
  container: { 
    flex: 1, 
    padding: "30px",
    marginLeft: "280px",
    width: "calc(100vw - 280px)",
    minHeight: "100vh"
  },
  header: {
    marginBottom: "30px",
    textAlign: "center"
  },
  // ... (rest of the code remains the same)
  mainTitle: {
    fontSize: "2.5rem",
    fontWeight: "800",
    color: "#1e293b",
    margin: "0 0 8px 0",
    background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  subtitle: {
    fontSize: "1.1rem",
    color: "#64748b",
    margin: 0,
    fontWeight: "500"
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "20px",
    marginBottom: "30px",
    width: "100%"
  },
  statCard: {
    background: "white",
    padding: "24px",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
    border: "1px solid #e2e8f0",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    transition: "all 0.2s ease",
    cursor: "pointer"
  },
  statIcon: {
    fontSize: "2rem",
    width: "60px",
    height: "60px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0fdf4",
    borderRadius: "12px"
  },
  statInfo: {
    flex: 1
  },
  statNumber: {
    fontSize: "2rem",
    fontWeight: "700",
    color: "#059669",
    lineHeight: 1
  },
  statLabel: {
    fontSize: "0.9rem",
    color: "#64748b",
    fontWeight: "500",
    marginTop: "4px"
  },
  section: {
    marginBottom: "30px"
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
  filterGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
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
  filterActions: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "15px"
  },
  secondaryButton: {
    backgroundColor: "#6b7280",
    color: "white",
    border: "none",
    padding: "12px 20px",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  exportButtons: {
    display: "flex",
    gap: "12px"
  },
  exportButton: {
    backgroundColor: "#059669",
    color: "white",
    border: "none",
    padding: "12px 20px",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  reportHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "25px",
    flexWrap: "wrap",
    gap: "15px"
  },
  resultsInfo: {
    backgroundColor: "#e0f2fe",
    color: "#0369a1",
    padding: "8px 16px",
    borderRadius: "20px",
    fontSize: "14px",
    fontWeight: "600"
  },
  loadingState: {
    textAlign: "center",
    padding: "60px 20px",
    color: "#64748b"
  },
  loadingSpinner: {
    width: "40px",
    height: "40px",
    border: "4px solid #e2e8f0",
    borderTop: "4px solid #6366f1",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "0 auto 16px auto"
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
    overflow: "auto",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
    maxHeight: "600px"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    backgroundColor: "white",
    minWidth: "1000px"
  },
  th: {
    padding: "16px 20px",
    backgroundColor: "#f8fafc",
    color: "#374151",
    textAlign: "left",
    fontWeight: "600",
    fontSize: "14px",
    borderBottom: "2px solid #e2e8f0",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
    position: "sticky",
    top: 0,
    zIndex: 10
  },
  td: {
    padding: "16px 20px",
    borderBottom: "1px solid #f1f5f9",
    fontSize: "14px",
    verticalAlign: "top"
  },
  evenRow: {
    backgroundColor: "#fafafa"
  },
  oddRow: {
    backgroundColor: "white"
  },
  theaterCell: {
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  theaterName: {
    fontWeight: "500",
    color: "#1e293b"
  },
  cityBadge: {
    backgroundColor: "#e0f2fe",
    color: "#0369a1",
    padding: "6px 12px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "600",
    whiteSpace: "nowrap"
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
  genreBadge: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
    padding: "6px 12px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "500",
    whiteSpace: "nowrap"
  },
  durationText: {
    color: "#64748b",
    fontWeight: "500"
  },
  dateBadge: {
    backgroundColor: "#f0fdf4",
    color: "#065f46",
    padding: "6px 12px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "600",
    whiteSpace: "nowrap"
  },
  dayBadge: {
    backgroundColor: "#f3e8ff",
    color: "#7c3aed",
    padding: "6px 12px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "500",
    whiteSpace: "nowrap"
  },
  timeBadge: {
    backgroundColor: "#6366f1",
    color: "white",
    padding: "6px 12px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "600",
    whiteSpace: "nowrap"
  },
  tableFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "20px",
    padding: "0 10px"
  },
  tableSummary: {
    fontSize: "14px",
    color: "#64748b",
    fontWeight: "500"
  }
};

// Add hover effects using inline styles or CSS classes
styles.statCard.onHover = {
  transform: "translateY(-2px)",
  boxShadow: "0 8px 25px rgba(0,0,0,0.1)"
};
styles.secondaryButton.onHover = {
  transform: "translateY(-2px)",
  boxShadow: "0 4px 12px rgba(107, 114, 128, 0.3)"
};
styles.exportButton.onHover = {
  transform: "translateY(-2px)",
  boxShadow: "0 4px 12px rgba(5, 150, 105, 0.3)"
};
styles.input.onFocus = {
  borderColor: "#6366f1",
  backgroundColor: "white",
  boxShadow: "0 0 0 3px rgba(99, 102, 241, 0.1)"
};
styles.th.onHover = {
  backgroundColor: "#f1f5f9"
};