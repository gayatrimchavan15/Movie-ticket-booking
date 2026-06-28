import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import { db } from "../../firebaseConfig";
import { ref, onValue } from "firebase/database";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { useNavigate } from "react-router-dom";

export default function TheaterReportPage() {
  const [theaters, setTheaters] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("all"); // all, week, month
  const [sortConfig, setSortConfig] = useState({ key: 'totalRevenue', direction: 'desc' });
  const navigate = useNavigate();

  // Fetch all data from Firebase
  useEffect(() => {
    setLoading(true);
    
    const theatersRef = ref(db, "theaters");
    const bookingsRef = ref(db, "bookings");
    const moviesRef = ref(db, "movies");

    const unsubTheaters = onValue(theatersRef, (snapshot) => {
      const data = snapshot.val() || {};
      const theaterArray = Object.keys(data).map((id) => { 
        const theaterData = data[id];
        
        // Calculate total capacity from screens data
        let totalCapacity = 0;
        let totalScreens = 0;
        
        if (theaterData.screens && typeof theaterData.screens === 'object') {
          // If screens is an object with screen details
          totalScreens = Object.keys(theaterData.screens).length;
          Object.values(theaterData.screens).forEach(screen => {
            if (screen.capacity) {
              totalCapacity += parseInt(screen.capacity) || 0;
            }
          });
        } else if (theaterData.screens && Array.isArray(theaterData.screens)) {
          // If screens is an array
          totalScreens = theaterData.screens.length;
          theaterData.screens.forEach(screen => {
            if (screen.capacity) {
              totalCapacity += parseInt(screen.capacity) || 0;
            }
          });
        } else {
          // Fallback: use direct capacity or default values
          totalScreens = parseInt(theaterData.totalScreens) || parseInt(theaterData.screens) || 1;
          totalCapacity = parseInt(theaterData.totalCapacity) || parseInt(theaterData.capacity) || 100;
        }

        return { 
          id, 
          ...theaterData,
          screens: totalScreens,
          capacity: totalCapacity,
          // Keep original data for reference
          originalScreens: theaterData.screens,
          originalCapacity: theaterData.capacity
        };
      });
      setTheaters(theaterArray);
    });

    const unsubBookings = onValue(bookingsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const bookingArray = Object.values(data);
      setBookings(bookingArray);
    });

    const unsubMovies = onValue(moviesRef, (snapshot) => {
      const data = snapshot.val() || {};
      const moviesArray = Object.keys(data).map((id) => ({ id, ...data[id] }));
      setMovies(moviesArray);
      setLoading(false);
    });

    return () => {
      unsubTheaters();
      unsubBookings();
      unsubMovies();
    };
  }, []);

  // Filter bookings by time range
  const getFilteredBookings = () => {
    const now = new Date();
    return bookings.filter(booking => {
      if (timeRange === "all") return true;
      
      const bookingDate = new Date(booking.date || booking.bookingDate);
      const diffTime = Math.abs(now - bookingDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (timeRange === "week") return diffDays <= 7;
      if (timeRange === "month") return diffDays <= 30;
      return true;
    });
  };

  // Calculate comprehensive theater statistics
  const getTheaterAnalytics = () => {
    const filteredBookings = getFilteredBookings();
    
    const theaterStats = theaters.map(theater => {
      // Find bookings for this theater
      const theaterBookings = filteredBookings.filter(booking => 
        booking.theaterId === theater.id || 
        booking.theater === theater.name ||
        booking.theaterName === theater.name
      );

      // Calculate revenue
      const totalRevenue = theaterBookings.reduce((sum, booking) => 
        sum + (parseFloat(booking.totalPrice) || 180), 0
      );

      // Calculate occupancy based on actual capacity
      const totalCapacity = theater.capacity || 100;
      const occupancyRate = totalCapacity > 0 ? 
        ((theaterBookings.length / totalCapacity) * 100).toFixed(1) : 0;

      // Find popular movies for this theater
      const movieCounts = {};
      theaterBookings.forEach(booking => {
        const movieName = booking.movieTitle || booking.movie || "Unknown";
        movieCounts[movieName] = (movieCounts[movieName] || 0) + 1;
      });
      const popularMovies = Object.entries(movieCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

      return {
        ...theater,
        totalBookings: theaterBookings.length,
        totalRevenue,
        occupancyRate: parseFloat(occupancyRate),
        revenuePerBooking: theaterBookings.length > 0 ? 
          (totalRevenue / theaterBookings.length).toFixed(2) : 0,
        popularMovies: popularMovies.map(([name, count]) => `${name} (${count})`).join(', '),
        screens: theater.screens || 1,
        capacity: theater.capacity || 100
      };
    });

    // Apply sorting
    const sortedTheaters = [...theaterStats].sort((a, b) => {
      if (sortConfig.direction === 'asc') {
        return a[sortConfig.key] > b[sortConfig.key] ? 1 : -1;
      }
      return a[sortConfig.key] < b[sortConfig.key] ? 1 : -1;
    });

    return sortedTheaters;
  };

  const theaterAnalytics = getTheaterAnalytics();
  const filteredBookings = getFilteredBookings();

  // Handle sorting
  const handleSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  // Overall statistics
  const overallStats = {
    totalTheaters: theaters.length,
    totalBookings: filteredBookings.length,
    totalRevenue: theaterAnalytics.reduce((sum, theater) => sum + theater.totalRevenue, 0),
    avgOccupancy: theaterAnalytics.length > 0 ? 
      (theaterAnalytics.reduce((sum, theater) => sum + theater.occupancyRate, 0) / theaterAnalytics.length).toFixed(1) : 0,
    totalScreens: theaterAnalytics.reduce((sum, theater) => sum + (theater.screens || 1), 0),
    totalCapacity: theaterAnalytics.reduce((sum, theater) => sum + (theater.capacity || 100), 0)
  };

  // Export functions
  const downloadCSV = () => {
    const header = ["Rank", "Theater Name", "City", "Screens", "Capacity", "Total Bookings", "Total Revenue", "Occupancy Rate", "Revenue/Booking", "Popular Movies"];
    const rows = theaterAnalytics.map((theater, index) => [
      index + 1,
      theater.name,
      theater.city,
      theater.screens,
      theater.capacity,
      theater.totalBookings,
      `₹${theater.totalRevenue.toLocaleString()}`,
      `${theater.occupancyRate}%`,
      `₹${theater.revenuePerBooking}`,
      theater.popularMovies
    ]);

    let csvContent = "data:text/csv;charset=utf-8," + [header, ...rows].map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `theater_analytics_${timeRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.setTextColor(85, 25, 117);
    doc.text("🏢 Theater Analytics Report", 14, 22);
    
    // Summary
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 35);
    doc.text(`Time Range: ${timeRange === "all" ? "All Time" : timeRange === "week" ? "Last 7 Days" : "Last 30 Days"}`, 14, 42);
    doc.text(`Total Theaters: ${overallStats.totalTheaters}`, 14, 49);
    doc.text(`Total Revenue: ₹${overallStats.totalRevenue.toLocaleString()}`, 14, 56);

    // Table
    const tableColumn = ["Rank", "Theater", "City", "Screens", "Capacity", "Bookings", "Revenue", "Occupancy", "Avg/Booking"];
    const tableRows = theaterAnalytics.map((theater, index) => [
      `#${index + 1}`,
      theater.name,
      theater.city,
      theater.screens.toString(),
      theater.capacity.toString(),
      theater.totalBookings.toString(),
      `₹${theater.totalRevenue.toLocaleString()}`,
      `${theater.occupancyRate}%`,
      `₹${theater.revenuePerBooking}`
    ]);

    doc.autoTable({
      startY: 65,
      head: [tableColumn],
      body: tableRows,
      theme: "grid",
      headStyles: { 
        fillColor: [102, 126, 234],
        textColor: 255,
        fontStyle: 'bold'
      },
      styles: { 
        fontSize: 9,
        cellPadding: 3
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      }
    });

    doc.save(`theater_analytics_${timeRange}.pdf`);
  };

  const goBack = () => {
    navigate("/admin/ReportsAnalytics");
  };

  // Sort indicator component
  const SortIndicator = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return null;
    return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <Sidebar activePath="/admin/theaterreport" />
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Loading Theater Analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Sidebar activePath="/admin/theaterreport" />

      <div style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <button style={styles.backButton} onClick={goBack}>
              ← Back to Reports
            </button>
            <h1 style={styles.title}>🏢 Theater Analytics</h1>
            <p style={styles.subtitle}>
              Comprehensive performance metrics and revenue analytics for all theaters
            </p>
          </div>
          
          <div style={styles.headerActions}>
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              style={styles.timeFilter}
            >
              <option value="all">All Time</option>
              <option value="month">Last 30 Days</option>
              <option value="week">Last 7 Days</option>
            </select>
            <button style={styles.csvButton} onClick={downloadCSV}>
              📊 Export CSV
            </button>
            <button style={styles.pdfButton} onClick={exportPDF}>
              📄 Export PDF
            </button>
          </div>
        </div>

        {/* Overall Stats */}
        <div style={styles.overallStats}>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>🏢</div>
            <div style={styles.statContent}>
              <div style={styles.statNumber}>{overallStats.totalTheaters}</div>
              <div style={styles.statLabel}>Total Theaters</div>
            </div>
          </div>
          
          <div style={styles.statCard}>
            <div style={styles.statIcon}>📅</div>
            <div style={styles.statContent}>
              <div style={styles.statNumber}>{overallStats.totalBookings}</div>
              <div style={styles.statLabel}>Total Bookings</div>
            </div>
          </div>
          
          <div style={styles.statCard}>
            <div style={styles.statIcon}>💰</div>
            <div style={styles.statContent}>
              <div style={styles.statNumber}>₹{overallStats.totalRevenue.toLocaleString()}</div>
              <div style={styles.statLabel}>Total Revenue</div>
            </div>
          </div>
          
          <div style={styles.statCard}>
            <div style={styles.statIcon}>📊</div>
            <div style={styles.statContent}>
              <div style={styles.statNumber}>{overallStats.avgOccupancy}%</div>
              <div style={styles.statLabel}>Avg Occupancy</div>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIcon}>🪑</div>
            <div style={styles.statContent}>
              <div style={styles.statNumber}>{overallStats.totalCapacity}</div>
              <div style={styles.statLabel}>Total Capacity</div>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIcon}>🎬</div>
            <div style={styles.statContent}>
              <div style={styles.statNumber}>{overallStats.totalScreens}</div>
              <div style={styles.statLabel}>Total Screens</div>
            </div>
          </div>
        </div>

        {/* Theater Analytics Table */}
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th} onClick={() => handleSort('name')}>
                  Theater Name <SortIndicator columnKey="name" />
                </th>
                <th style={styles.th} onClick={() => handleSort('city')}>
                  City <SortIndicator columnKey="city" />
                </th>
                <th style={styles.th} onClick={() => handleSort('screens')}>
                  Screens <SortIndicator columnKey="screens" />
                </th>
                <th style={styles.th} onClick={() => handleSort('capacity')}>
                  Capacity <SortIndicator columnKey="capacity" />
                </th>
                <th style={styles.th} onClick={() => handleSort('totalBookings')}>
                  Bookings <SortIndicator columnKey="totalBookings" />
                </th>
                <th style={styles.th} onClick={() => handleSort('totalRevenue')}>
                  Revenue <SortIndicator columnKey="totalRevenue" />
                </th>
                <th style={styles.th} onClick={() => handleSort('occupancyRate')}>
                  Occupancy <SortIndicator columnKey="occupancyRate" />
                </th>
                <th style={styles.th} onClick={() => handleSort('revenuePerBooking')}>
                  Avg/Booking <SortIndicator columnKey="revenuePerBooking" />
                </th>
                <th style={styles.th}>
                  Popular Movies
                </th>
              </tr>
            </thead>
            <tbody>
              {theaterAnalytics.map((theater, index) => (
                <tr key={theater.id} style={styles.tr}>
                  <td style={styles.td}>
                    <div style={styles.theaterNameCell}>
                      <span style={styles.rankBadge}>#{index + 1}</span>
                      {theater.name}
                    </div>
                  </td>
                  <td style={styles.td}>{theater.city}</td>
                  <td style={styles.td}>
                    <span style={styles.screenCount}>{theater.screens}</span>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.capacityText}>{theater.capacity} seats</span>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.bookingCount}>{theater.totalBookings}</span>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.revenueText}>₹{theater.totalRevenue.toLocaleString()}</span>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.occupancyCell}>
                      <span style={{
                        ...styles.occupancyText,
                        color: theater.occupancyRate > 70 ? "#10B981" : 
                               theater.occupancyRate > 40 ? "#F59E0B" : "#EF4444"
                      }}>
                        {theater.occupancyRate}%
                      </span>
                      <div style={styles.occupancyBar}>
                        <div 
                          style={{
                            ...styles.occupancyFill,
                            width: `${Math.min(theater.occupancyRate, 100)}%`,
                            background: theater.occupancyRate > 70 ? "#10B981" : 
                                       theater.occupancyRate > 40 ? "#F59E0B" : "#EF4444"
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.avgRevenueText}>₹{theater.revenuePerBooking}</span>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.popularMoviesCell}>
                      {theater.popularMovies || 'No data'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {theaterAnalytics.length === 0 && (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>🏢</div>
              <h3 style={styles.emptyTitle}>No Theater Data Available</h3>
              <p style={styles.emptyText}>
                There are no theaters or booking data to display analytics for.
              </p>
            </div>
          )}
        </div>

        {/* Summary Footer */}
        <div style={styles.summaryFooter}>
          <div style={styles.summaryItem}>
            <strong>Total Theaters:</strong> {overallStats.totalTheaters}
          </div>
          <div style={styles.summaryItem}>
            <strong>Total Screens:</strong> {overallStats.totalScreens}
          </div>
          <div style={styles.summaryItem}>
            <strong>Total Capacity:</strong> {overallStats.totalCapacity} seats
          </div>
          <div style={styles.summaryItem}>
            <strong>Total Bookings:</strong> {overallStats.totalBookings}
          </div>
          <div style={styles.summaryItem}>
            <strong>Total Revenue:</strong> ₹{overallStats.totalRevenue.toLocaleString()}
          </div>
          <div style={styles.summaryItem}>
            <strong>Average Occupancy:</strong> {overallStats.avgOccupancy}%
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== Table-focused Styles =====
const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
  },
  content: {
    flex: 1,
    padding: "30px",
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(10px)",
    margin: "20px",
    marginLeft: "280px",
    borderRadius: "20px",
    boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
    overflowY: "auto",
    width: "calc(100vw - 320px)"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "30px",
    flexWrap: "wrap",
    gap: "20px"
  },
  title: {
    fontSize: "2.2rem",
    fontWeight: "800",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    margin: "10px 0 5px 0"
  },
  subtitle: {
    fontSize: "1rem",
    color: "#6B7280",
    margin: "0",
    maxWidth: "500px"
  },
  backButton: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
    transition: "all 0.2s ease",
    boxShadow: "0 4px 15px rgba(102, 126, 234, 0.3)",
    marginBottom: "10px"
  },
  headerActions: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    flexWrap: "wrap"
  },
  timeFilter: {
    padding: "10px 15px",
    border: "1px solid #E5E7EB",
    borderRadius: "8px",
    background: "white",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer"
  },
  csvButton: {
    background: "linear-gradient(135deg, #10B981 0%, #34D399 100%)",
    color: "#fff",
    padding: "10px 20px",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 4px 15px rgba(16, 185, 129, 0.3)",
    transition: "all 0.2s ease"
  },
  pdfButton: {
    background: "linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)",
    color: "#fff",
    padding: "10px 20px",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 4px 15px rgba(245, 158, 11, 0.3)",
    transition: "all 0.2s ease"
  },
  overallStats: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "20px",
    marginBottom: "30px"
  },
  statCard: {
    background: "white",
    borderRadius: "16px",
    padding: "20px",
    display: "flex",
    alignItems: "center",
    gap: "15px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
    border: "1px solid rgba(255,255,255,0.2)",
    transition: "transform 0.2s ease"
  },
  statIcon: {
    width: "50px",
    height: "50px",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px"
  },
  statContent: {
    flex: 1
  },
  statNumber: {
    fontSize: "1.5rem",
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: "4px"
  },
  statLabel: {
    fontSize: "0.9rem",
    color: "#6B7280",
    fontWeight: "600"
  },
  tableContainer: {
    background: "white",
    borderRadius: "16px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
    overflow: "hidden",
    marginBottom: "20px"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    background: "#fff",
  },
  th: {
    padding: "16px 12px",
    textAlign: "left",
    fontSize: "14px",
    fontWeight: "700",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    cursor: "pointer",
    transition: "background 0.2s ease",
    borderBottom: "1px solid rgba(255,255,255,0.2)"
  },
  tr: {
    transition: "background-color 0.2s ease",
    borderBottom: "1px solid #E5E7EB"
  },
  td: {
    padding: "16px 12px",
    textAlign: "left",
    fontSize: "14px",
    background: "white",
    verticalAlign: "middle"
  },
  theaterNameCell: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontWeight: "600",
    color: "#1F2937"
  },
  rankBadge: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    width: "30px",
    height: "30px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: "700",
    flexShrink: 0
  },
  screenCount: {
    fontWeight: "600",
    color: "#1F2937",
    background: "#EFF6FF",
    padding: "4px 8px",
    borderRadius: "6px",
    fontSize: "13px"
  },
  capacityText: {
    fontWeight: "600",
    color: "#7C3AED",
    fontSize: "14px"
  },
  bookingCount: {
    fontWeight: "700",
    color: "#1F2937",
    background: "#F3F4F6",
    padding: "4px 8px",
    borderRadius: "6px",
    fontSize: "13px"
  },
  revenueText: {
    fontWeight: "700",
    color: "#10B981",
    fontSize: "14px"
  },
  avgRevenueText: {
    fontWeight: "600",
    color: "#8B5CF6",
    fontSize: "14px"
  },
  occupancyCell: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    minWidth: "80px"
  },
  occupancyText: {
    fontWeight: "700",
    fontSize: "13px"
  },
  occupancyBar: {
    width: "100%",
    height: "4px",
    background: "#E5E7EB",
    borderRadius: "2px",
    overflow: "hidden"
  },
  occupancyFill: {
    height: "100%",
    borderRadius: "2px",
    transition: "width 0.3s ease"
  },
  popularMoviesCell: {
    fontSize: "13px",
    color: "#6B7280",
    lineHeight: "1.4",
    maxWidth: "200px"
  },
  summaryFooter: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "15px",
    padding: "20px",
    background: "white",
    borderRadius: "12px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
  },
  summaryItem: {
    fontSize: "14px",
    color: "#374151",
    fontWeight: "500",
    textAlign: "center"
  },
  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
    color: "#6B7280"
  },
  emptyIcon: {
    fontSize: "4rem",
    marginBottom: "20px"
  },
  emptyTitle: {
    fontSize: "1.5rem",
    fontWeight: "600",
    marginBottom: "10px",
    color: "#374151"
  },
  emptyText: {
    fontSize: "1rem",
    lineHeight: "1.5"
  },
  loadingContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px"
  },
  spinner: {
    width: "50px",
    height: "50px",
    border: "4px solid rgba(255,255,255,0.3)",
    borderTop: "4px solid #667eea",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    marginBottom: "20px"
  },
  loadingText: {
    fontSize: "1.1rem",
    color: "#6B7280",
    fontWeight: "500"
  }
};

// Add CSS animations
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    button:hover, select:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0,0,0,0.15);
    }
    
    .th:hover {
      background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%) !important;
    }
    
    .tr:hover {
      background-color: #f9fafb !important;
    }
    
    .stat-card:hover {
      transform: translateY(-2px);
    }
  `;
  document.head.appendChild(style);
}