import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import { db } from "../../firebaseConfig";
import { ref, onValue } from "firebase/database";
import { useNavigate } from "react-router-dom";

export default function ReportsAnalytics() {
  const [stats, setStats] = useState({
    totalMovies: 0,
    totalBookings: 0,
    totalUsers: 0,
    totalRevenue: 0
  });
  const [topMovies, setTopMovies] = useState([]);
  const [bookingsPerDay, setBookingsPerDay] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState("");
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();

  // Report cards with icons and colors
  const reportCards = [
    { 
      id: "userReports", 
      title: "User Analytics", 
      description: "User growth & engagement metrics",
      icon: "👥",
      color: "#6366F1",
      gradient: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
      action: "openUserReports"  // CHANGED: from 'link' to 'action'
    },
    { 
      id: "movieReports", 
      title: "Movie Performance", 
      description: "Movie ratings & popularity analysis",
      icon: "🎬",
      color: "#10B981",
      gradient: "linear-gradient(135deg, #10B981 0%, #34D399 100%)",
      action: "openMovieReports"
    },
    { 
      id: "theaterReports", 
      title: "Theater Analytics", 
      description: "Theater occupancy & revenue reports",
      icon: "🏢",
      color: "#F59E0B",
      gradient: "linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)",
      action: "openTheaterReports"
    },
    { 
      id: "bookingReports", 
      title: "Booking Trends", 
      description: "Booking patterns & peak hours",
      icon: "📊",
      color: "#EF4444",
      gradient: "linear-gradient(135deg, #EF4444 0%, #F87171 100%)",
      action: "openBookingReport"
    },
    { 
      id: "revenueReports", 
      title: "Revenue Reports", 
      description: "Payment success rates & revenue streams",
      icon: "💰",
      color: "#8B5CF6",
      gradient: "linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)",
      action: "openRevenueReports"
    },
    { 
      id: "messageReports", 
      title: "Customer Messages", 
      description: "Reviews & customer satisfaction",
      icon: "💬",
      color: "#06B6D4",
      gradient: "linear-gradient(135deg, #06B6D4 0%, #67E8F9 100%)",
      action: "openMessageReports"
    },
    { 
      id: "cityReports", 
      title: "City Performance", 
      description: "Geographic performance & market analysis",
      icon: "🌍",
      color: "#10B981",
      gradient: "linear-gradient(135deg, #10B981 0%, #34D399 100%)",
      action: "openCityReports"
    },
    { 
      id: "seatReports", 
      title: "Seat Utilization", 
      description: "Seat booking patterns & utilization",
      icon: "🪑",
      color: "#F59E0B",
      gradient: "linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)",
      action: "openSeatReports"
    },
    { 
      id: "loyaltyReports", 
      title: "Customer Loyalty", 
      description: "Customer retention & loyalty analysis",
      icon: "🏆",
      color: "#FFD700",
      gradient: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
      action: "openLoyaltyReports"
    },
    { 
      id: "reviewReports", 
      title: "Review & Rating Analytics", 
      description: "Customer reviews & movie ratings analysis",
      icon: "⭐",
      color: "#EF4444",
      gradient: "linear-gradient(135deg, #EF4444 0%, #F87171 100%)",
      action: "openReviewReports"
    },
    { 
      id: "showtimeReports", 
      title: "Showtime Reports", 
      description: "Movie scheduling & showtime patterns",
      icon: "🕐",
      color: "#8B5CF6",
      gradient: "linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)",
      action: "openShowtimeReports"
    }
  ];

  useEffect(() => {
    setLoading(true);
    
    // Movies count
    const unsubMovies = onValue(ref(db, "movies"), snapshot => {
      const data = snapshot.val();
      setStats(s => ({ ...s, totalMovies: data ? Object.keys(data).length : 0 }));
    });

    // Users count
    const unsubUsers = onValue(ref(db, "users"), snapshot => {
      const data = snapshot.val();
      setStats(s => ({ ...s, totalUsers: data ? Object.keys(data).length : 0 }));
    });

    // Bookings: for stats
    const unsubBookings = onValue(ref(db, "bookings"), snapshot => {
      const data = snapshot.val();
      const bookings = data ? Object.values(data) : [];
      setStats(s => ({ ...s, totalBookings: bookings.length }));
      setStats(s => ({ ...s, totalRevenue: bookings.reduce((sum, booking) => sum + (booking.totalPrice || 180), 0) }));

      // Top Movies
      const movieCounts = {};
      bookings.forEach(b => {
        const movie = b.movieTitle || b.movie || "Unknown";
        movieCounts[movie] = (movieCounts[movie] || 0) + 1;
      });
      const sortedMovies = Object.entries(movieCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
      setTopMovies(sortedMovies);

      // Bookings per day
      const perDay = {};
      bookings.forEach(b => {
        const day = b.date || "Unknown";
        perDay[day] = (perDay[day] || 0) + 1;
      });
      setBookingsPerDay(perDay);
      
      setLoading(false);
    });

    return () => {
      unsubMovies();
      unsubUsers();
      unsubBookings();
    };
  }, []);

  const openModal = (card) => {
    try {
      console.log("Navigating to report:", card.action, card.title);
      
      if (card.action === "openMovieReports") {
        // Navigate to Movies Report page
        navigate("/admin/moviesreport");
      } else if (card.action === "openTheaterReports") {
        // Navigate to Theater Report page
        navigate("/admin/theaterreport");
      } else if (card.action === "openUserReports") {
        // Navigate to User Report page
        navigate("/admin/userreport");
      } else if (card.action === "openBookingReport") {
        // Navigate to Booking Report page
        navigate("/admin/bookingreportpage");
      } else if (card.action === "openRevenueReports") {
        // Navigate to Revenue Report page
        navigate("/admin/revenuereport");
      } else if (card.action === "openMessageReports") {
        // Navigate to Messages Report page
        navigate("/admin/messagesreport");
      } else if (card.action === "openCityReports") {
        // Navigate to City Report page
        navigate("/admin/cityreport");
      } else if (card.action === "openSeatReports") {
        // Navigate to Seat Utilization Report page
        navigate("/admin/seatreport");
      } else if (card.action === "openLoyaltyReports") {
        // Navigate to Customer Loyalty Report page
        navigate("/admin/loyaltyreport");
      } else if (card.action === "openReviewReports") {
        // Navigate to Review & Rating Report page
        navigate("/admin/reviewratingreport");
      } else if (card.action === "openShowtimeReports") {
        // Navigate to Showtime Report page
        navigate("/admin/showtimereport");
      } else if (card.link) {
        setModalContent(card.link);
        setModalOpen(true);
      } else {
        console.warn("Unknown action:", card.action);
        alert("Report not available yet!");
      }
    } catch (error) {
      console.error("Navigation error:", error);
      alert("Error navigating to report. Please try again.");
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalContent("");
  };

  if (loading) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", background: styles.container.background }}>
        <Sidebar activePath="/admin/ReportsAnalytics" />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", marginLeft: "260px" }}>
          <div style={styles.loadingContainer}>
            <div style={styles.spinner}></div>
            <p style={styles.loadingText}>Loading Analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Sidebar activePath="/admin/ReportsAnalytics" />
      <div style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Reports & Analytics</h1>
            <p style={styles.subtitle}>Comprehensive insights and performance metrics</p>
          </div>
          <div style={styles.headerActions}>
            <button style={styles.exportButton}>
              📊 Export Reports
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statIcon} className="stat-movies">🎬</div>
            <div style={styles.statContent}>
              <div style={styles.statNumber}>{stats.totalMovies}</div>
              <div style={styles.statLabel}>Total Movies</div>
            </div>
            <div style={styles.statTrend}>+12% this month</div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIcon} className="stat-users">👥</div>
            <div style={styles.statContent}>
              <div style={styles.statNumber}>{stats.totalUsers}</div>
              <div style={styles.statLabel}>Total Users</div>
            </div>
            <div style={styles.statTrend}>+8% this month</div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIcon} className="stat-bookings">📅</div>
            <div style={styles.statContent}>
              <div style={styles.statNumber}>{stats.totalBookings}</div>
              <div style={styles.statLabel}>Total Bookings</div>
            </div>
            <div style={styles.statTrend}>+15% this month</div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIcon} className="stat-revenue">💰</div>
            <div style={styles.statContent}>
              <div style={styles.statNumber}>₹{stats.totalRevenue.toLocaleString()}</div>
              <div style={styles.statLabel}>Total Revenue</div>
            </div>
            <div style={styles.statTrend}>+18% this month</div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div style={styles.mainGrid}>
          {/* Report Cards */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Analytics Reports</h3>
            <p style={styles.sectionSubtitle}>Detailed insights across all platform metrics</p>
            <div style={styles.reportsGrid}>
              {reportCards.map(card => (
                <div 
                  key={card.id} 
                  style={{...styles.reportCard, background: card.gradient}}
                  onClick={() => openModal(card)}
                  className="report-card"
                >
                  <div style={styles.reportIcon}>{card.icon}</div>
                  <div style={styles.reportContent}>
                    <h4 style={styles.reportTitle}>{card.title}</h4>
                    <p style={styles.reportDescription}>{card.description}</p>
                  </div>
                  <div style={styles.reportArrow} className="report-arrow">→</div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Movies & Quick Stats */}
          <div style={styles.sidebar}>
            {/* Top Movies */}
            <div style={styles.widget}>
              <h4 style={styles.widgetTitle}>🎯 Top Performing Movies</h4>
              <div style={styles.moviesList}>
                {topMovies.length === 0 ? (
                  <div style={styles.emptyState}>No booking data available</div>
                ) : (
                  topMovies.map(([title, count], index) => (
                    <div key={title + index} style={styles.movieItem}>
                      <div style={styles.movieRank}>{index + 1}</div>
                      <div style={styles.movieInfo}>
                        <div style={styles.movieName}>{title}</div>
                        <div style={styles.movieBookings}>{count} bookings</div>
                      </div>
                      <div style={styles.movieBar}>
                        <div 
                          style={{
                            ...styles.movieBarFill,
                            width: `${(count / Math.max(...topMovies.map(m => m[1]))) * 100}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div style={styles.widget}>
              <h4 style={styles.widgetTitle}>📈 Quick Stats</h4>
              <div style={styles.quickStats}>
                <div style={styles.quickStat}>
                  <div style={styles.quickStatLabel}>Avg. Booking Value</div>
                  <div style={styles.quickStatValue}>₹180</div>
                </div>
                <div style={styles.quickStat}>
                  <div style={styles.quickStatLabel}>Peak Booking Day</div>
                  <div style={styles.quickStatValue}>Saturday</div>
                </div>
                <div style={styles.quickStat}>
                  <div style={styles.quickStatLabel}>Customer Rating</div>
                  <div style={styles.quickStatValue}>4.5/5</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Report Preview</h3>
              <button style={styles.modalClose} onClick={closeModal}>✕</button>
            </div>
            <iframe
              src={modalContent}
              style={styles.modalIframe}
              title="Report Preview"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ===== Enhanced Styles =====
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
    boxShadow: "0 20px 40px rgba(0,0,0,0.1)"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "40px"
  },
  title: {
    fontSize: "2.5rem",
    fontWeight: "800",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    margin: "0 0 8px 0"
  },
  subtitle: {
    fontSize: "1.1rem",
    color: "#6B7280",
    margin: "0",
    fontWeight: "500"
  },
  headerActions: {
    display: "flex",
    gap: "15px"
  },
  exportButton: {
    background: "linear-gradient(135deg, #10B981 0%, #34D399 100%)",
    border: "none",
    borderRadius: "12px",
    padding: "12px 24px",
    color: "white",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 4px 15px rgba(16, 185, 129, 0.3)",
    transition: "all 0.2s ease"
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "24px",
    marginBottom: "40px"
  },
  statCard: {
    background: "white",
    borderRadius: "16px",
    padding: "24px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
    border: "1px solid rgba(255,255,255,0.2)",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    cursor: "pointer"
  },
  statIcon: {
    width: "60px",
    height: "60px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
  },
  statContent: {
    flex: 1
  },
  statNumber: {
    fontSize: "2rem",
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: "4px"
  },
  statLabel: {
    fontSize: "0.9rem",
    color: "#6B7280",
    fontWeight: "600"
  },
  statTrend: {
    fontSize: "0.8rem",
    color: "#10B981",
    fontWeight: "600",
    background: "rgba(16, 185, 129, 0.1)",
    padding: "4px 8px",
    borderRadius: "20px"
  },
  mainGrid: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: "32px",
    alignItems: "start"
  },
  section: {
    marginBottom: "32px"
  },
  sectionTitle: {
    fontSize: "1.5rem",
    fontWeight: "700",
    color: "#1F2937",
    margin: "0 0 8px 0"
  },
  sectionSubtitle: {
    fontSize: "1rem",
    color: "#6B7280",
    margin: "0 0 24px 0"
  },
  reportsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "20px"
  },
  reportCard: {
    borderRadius: "16px",
    padding: "24px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
    border: "1px solid rgba(255,255,255,0.2)"
  },
  reportIcon: {
    width: "50px",
    height: "50px",
    borderRadius: "12px",
    background: "rgba(255,255,255,0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    backdropFilter: "blur(10px)"
  },
  reportContent: {
    flex: 1
  },
  reportTitle: {
    fontSize: "1.1rem",
    fontWeight: "700",
    color: "white",
    margin: "0 0 4px 0"
  },
  reportDescription: {
    fontSize: "0.9rem",
    color: "rgba(255,255,255,0.8)",
    margin: "0"
  },
  reportArrow: {
    fontSize: "1.2rem",
    color: "white",
    fontWeight: "700",
    transition: "transform 0.2s ease"
  },
  sidebar: {
    display: "flex",
    flexDirection: "column",
    gap: "24px"
  },
  widget: {
    background: "white",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
    border: "1px solid rgba(255,255,255,0.2)"
  },
  widgetTitle: {
    fontSize: "1.1rem",
    fontWeight: "700",
    color: "#1F2937",
    margin: "0 0 20px 0"
  },
  moviesList: {
    display: "flex",
    flexDirection: "column",
    gap: "16px"
  },
  movieItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 0"
  },
  movieRank: {
    width: "28px",
    height: "28px",
    borderRadius: "8px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.8rem",
    fontWeight: "700",
    color: "white"
  },
  movieInfo: {
    flex: 1
  },
  movieName: {
    fontSize: "0.9rem",
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: "2px"
  },
  movieBookings: {
    fontSize: "0.8rem",
    color: "#6B7280"
  },
  movieBar: {
    width: "80px",
    height: "6px",
    background: "#E5E7EB",
    borderRadius: "3px",
    overflow: "hidden"
  },
  movieBarFill: {
    height: "100%",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    borderRadius: "3px",
    transition: "width 0.3s ease"
  },
  quickStats: {
    display: "flex",
    flexDirection: "column",
    gap: "16px"
  },
  quickStat: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 0",
    borderBottom: "1px solid #F3F4F6"
  },
  quickStatLabel: {
    fontSize: "0.9rem",
    color: "#6B7280",
    fontWeight: "500"
  },
  quickStatValue: {
    fontSize: "1rem",
    fontWeight: "700",
    color: "#1F2937"
  },
  emptyState: {
    textAlign: "center",
    color: "#9CA3AF",
    fontStyle: "italic",
    padding: "20px 0"
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "20px"
  },
  modalContent: {
    background: "white",
    borderRadius: "20px",
    width: "90%",
    maxWidth: "1200px",
    height: "90vh",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 25px 50px rgba(0,0,0,0.3)"
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "24px",
    borderBottom: "1px solid #E5E7EB"
  },
  modalTitle: {
    fontSize: "1.5rem",
    fontWeight: "700",
    color: "#1F2937",
    margin: 0
  },
  modalClose: {
    background: "none",
    border: "none",
    fontSize: "1.5rem",
    color: "#6B7280",
    cursor: "pointer",
    padding: "4px",
    borderRadius: "4px",
    transition: "all 0.2s ease"
  },
  modalIframe: {
    flex: 1,
    border: "none",
    borderRadius: "0 0 20px 20px"
  },
  loadingContainer: {
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

// Add CSS styles for hover effects
const styleSheet = document.styleSheets[0];
const hoverStyles = `
  .stat-movies { background: linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 100%) !important; }
  .stat-users { background: linear-gradient(135deg, #4ECDC4 0%, #67E6DC 100%) !important; }
  .stat-bookings { background: linear-gradient(135deg, #FFD93D 0%, #FFC107 100%) !important; }
  .stat-revenue { background: linear-gradient(135deg, #45B7D1 0%, #67C7E6 100%) !important; }
  
  .report-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 35px rgba(0,0,0,0.2);
  }
  
  .report-card:hover .report-arrow {
    transform: translateX(5px);
  }
  
  .stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.12);
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// Inject styles
if (styleSheet) {
  try {
    styleSheet.insertRule(hoverStyles, styleSheet.cssRules.length);
  } catch (e) {
    // Fallback: create a style element
    const styleElement = document.createElement('style');
    styleElement.textContent = hoverStyles;
    document.head.appendChild(styleElement);
  }
}