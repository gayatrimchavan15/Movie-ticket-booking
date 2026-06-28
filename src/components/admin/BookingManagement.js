import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import { db } from "../../firebaseConfig";
import { ref, onValue, remove } from "firebase/database";

export default function BookingManagement() {
  const [bookings, setBookings] = useState([]);
  const [theaters, setTheaters] = useState([]);
  const [users, setUsers] = useState([]);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("all"); // all, today, upcoming, past

  useEffect(() => {
    setLoading(true);
    
    const bookingsRef = ref(db, "bookings");
    const theatersRef = ref(db, "theaters");
    const usersRef = ref(db, "users");
    const moviesRef = ref(db, "movies");

    const unsubBookings = onValue(bookingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setBookings(
          Object.entries(data).map(([id, booking]) => ({
            id,
            ...booking,
          }))
        );
      } else {
        setBookings([]);
      }
    });

    const unsubTheaters = onValue(theatersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setTheaters(
          Object.entries(data).map(([id, theater]) => ({
            id,
            ...theater,
          }))
        );
      } else {
        setTheaters([]);
      }
    });

    const unsubUsers = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setUsers(
          Object.entries(data).map(([id, user]) => ({
            id,
            ...user,
          }))
        );
      } else {
        setUsers([]);
      }
    });

    const unsubMovies = onValue(moviesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setMovies(
          Object.entries(data).map(([id, movie]) => ({
            id,
            ...movie,
          }))
        );
        setLoading(false);
      } else {
        setMovies([]);
        setLoading(false);
      }
    });

    return () => {
      unsubBookings();
      unsubTheaters();
      unsubUsers();
      unsubMovies();
    };
  }, []);

  // Get theater city by theater name or ID
  const getTheaterCity = (theaterName, theaterId) => {
    const theater = theaters.find(t => 
      t.id === theaterId || t.name === theaterName
    );
    return theater?.city || "Unknown";
  };

  // Get user details
  const getUserDetails = (userId, userName) => {
    const user = users.find(u => u.id === userId);
    return {
      name: user?.name || user?.fullName || userName || "Unknown User",
      email: user?.email || "No email",
      phone: user?.phone || user?.mobile || "No phone"
    };
  };

  // Get movie details
  const getMovieDetails = (movieTitle) => {
    const movie = movies.find(m => m.title === movieTitle);
    return {
      genre: movie?.genre || "Unknown",
      duration: movie?.duration || "N/A",
      rating: movie?.rating || "N/A"
    };
  };

  // Filter bookings based on date
  const getFilteredBookings = () => {
    const now = new Date();
    const today = new Date().toISOString().split('T')[0];

    return bookings.filter(booking => {
      const bookingDate = booking.date || booking.bookingDate;
      
      if (!bookingDate) return true;
      
      switch (filter) {
        case "today":
          return bookingDate === today;
        case "upcoming":
          return new Date(bookingDate) > now;
        case "past":
          return new Date(bookingDate) < now;
        default:
          return true;
      }
    });
  };

  // Calculate booking statistics
  const getBookingStats = () => {
    const filteredBookings = getFilteredBookings();
    const today = new Date().toISOString().split('T')[0];
    
    const todayBookings = bookings.filter(b => (b.date || b.bookingDate) === today).length;
    const totalRevenue = bookings.reduce((sum, booking) => sum + (parseFloat(booking.totalPrice) || 0), 0);
    const avgBookingValue = bookings.length > 0 ? (totalRevenue / bookings.length).toFixed(2) : 0;

    return {
      totalBookings: bookings.length,
      todayBookings,
      totalRevenue,
      avgBookingValue,
      filteredCount: filteredBookings.length
    };
  };

  const filteredBookings = getFilteredBookings();
  const stats = getBookingStats();

  function handleDelete(id) {
    if (window.confirm("Are you sure you want to delete this booking?")) {
      remove(ref(db, `bookings/${id}`))
        .then(() => setMessage("✅ Booking deleted successfully!"))
        .catch(() => setMessage("❌ Error deleting booking."));
      
      setTimeout(() => setMessage(""), 3000);
    }
  }

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format time for display
  const formatTime = (timeString) => {
    if (!timeString) return "N/A";
    return timeString;
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <Sidebar activePath="/admin/booking-management" />
        <div style={loadingContainerStyle}>
          <div style={spinnerStyle}></div>
          <p style={loadingTextStyle}>Loading Bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <Sidebar activePath="/admin/booking-management" />
      <div style={mainContentStyle}>
        <h2 style={headingStyle}>📋 Booking Management</h2>

        {/* Statistics Cards */}
        <div style={statsContainerStyle}>
          <div style={statCardStyle}>
            <div style={statIconStyle}>📊</div>
            <div style={statContentStyle}>
              <div style={statNumberStyle}>{stats.totalBookings}</div>
              <div style={statLabelStyle}>Total Bookings</div>
            </div>
          </div>
          <div style={statCardStyle}>
            <div style={statIconStyle}>📅</div>
            <div style={statContentStyle}>
              <div style={statNumberStyle}>{stats.todayBookings}</div>
              <div style={statLabelStyle}>Today's Bookings</div>
            </div>
          </div>
          <div style={statCardStyle}>
            <div style={statIconStyle}>💰</div>
            <div style={statContentStyle}>
              <div style={statNumberStyle}>₹{stats.totalRevenue.toLocaleString()}</div>
              <div style={statLabelStyle}>Total Revenue</div>
            </div>
          </div>
          <div style={statCardStyle}>
            <div style={statIconStyle}>📈</div>
            <div style={statContentStyle}>
              <div style={statNumberStyle}>₹{stats.avgBookingValue}</div>
              <div style={statLabelStyle}>Avg. Booking Value</div>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            style={{
              marginBottom: 20,
              padding: "12px 16px",
              borderRadius: "8px",
              background: message.includes("deleted") ? "#d4edda" : "#f8d7da",
              color: message.includes("deleted") ? "#155724" : "#721c24",
              fontSize: 15,
              fontWeight: 600,
              border: `1px solid ${message.includes("deleted") ? "#c3e6cb" : "#f5c6cb"}`,
            }}
          >
            {message}
          </div>
        )}

        {/* Filters */}
        <div style={filtersContainerStyle}>
          <div style={filterGroupStyle}>
            <label style={filterLabelStyle}>Filter by Date:</label>
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              style={filterSelectStyle}
            >
              <option value="all">All Bookings</option>
              <option value="today">Today</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
            </select>
          </div>
          <div style={resultsCountStyle}>
            Showing {stats.filteredCount} of {stats.totalBookings} bookings
          </div>
        </div>

        {/* Table */}
        <div style={tableContainerStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>User Details</th>
                <th style={thStyle}>Movie & Show</th>
                <th style={thStyle}>Theater & Location</th>
                <th style={thStyle}>Booking Details</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length === 0 ? (
                <tr>
                  <td style={tdEmptyStyle} colSpan={5}>
                    <div style={emptyStateStyle}>
                      <div style={emptyIconStyle}>📋</div>
                      <h3 style={emptyTitleStyle}>No Bookings Found</h3>
                      <p style={emptyTextStyle}>
                        {filter === "today" ? "No bookings for today" :
                         filter === "upcoming" ? "No upcoming bookings" :
                         filter === "past" ? "No past bookings" :
                         "No bookings in the system"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking, index) => {
                  const userDetails = getUserDetails(booking.userId, booking.userName);
                  const theaterCity = getTheaterCity(booking.theaterName, booking.theaterId);
                  const movieDetails = getMovieDetails(booking.movieTitle);
                  
                  return (
                    <tr
                      key={booking.id}
                      style={{
                        backgroundColor: index % 2 === 0 ? "#ffffff" : "#f9fbfd",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "#eef6ff")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor =
                          index % 2 === 0 ? "#ffffff" : "#f9fbfd")
                      }
                    >
                      {/* User Details Column */}
                      <td style={tdStyle}>
                        <div style={userCellStyle}>
                          <div style={userNameStyle}>{userDetails.name}</div>
                          <div style={userEmailStyle}>{userDetails.email}</div>
                          <div style={userPhoneStyle}>{userDetails.phone}</div>
                        </div>
                      </td>

                      {/* Movie & Show Column */}
                      <td style={tdStyle}>
                        <div style={movieCellStyle}>
                          <div style={movieTitleStyle}>{booking.movieTitle || "-"}</div>
                          <div style={movieMetaStyle}>
                            <span style={genreStyle}>{movieDetails.genre}</span>
                            <span style={dotStyle}>•</span>
                            <span style={durationStyle}>{movieDetails.duration}</span>
                            <span style={dotStyle}>•</span>
                            <span style={ratingStyle}>⭐ {movieDetails.rating}</span>
                          </div>
                          <div style={showtimeStyle}>
                            <span style={timeLabelStyle}>Show:</span>
                            <span style={timeValueStyle}>{formatTime(booking.showtime || booking.time)}</span>
                          </div>
                        </div>
                      </td>

                      {/* Theater & Location Column */}
                      <td style={tdStyle}>
                        <div style={theaterCellStyle}>
                          <div style={theaterNameStyle}>{booking.theaterName || "-"}</div>
                          <div style={locationStyle}>
                            <span style={cityIconStyle}>🏙️</span>
                            <span style={cityTextStyle}>{theaterCity}</span>
                          </div>
                          {booking.theaterId && (
                            <div style={theaterIdStyle}>ID: {booking.theaterId}</div>
                          )}
                        </div>
                      </td>

                      {/* Booking Details Column */}
                      <td style={tdStyle}>
                        <div style={bookingCellStyle}>
                          <div style={seatsStyle}>
                            <span style={seatsLabelStyle}>Seats:</span>
                            <span style={seatsValueStyle}>
                              {Array.isArray(booking.seats) ? 
                                booking.seats.join(", ") : 
                                booking.seats || "-"}
                            </span>
                          </div>
                          <div style={dateStyle}>
                            <span style={dateLabelStyle}>Date:</span>
                            <span style={dateValueStyle}>
                              {formatDate(booking.date || booking.bookingDate)}
                            </span>
                          </div>
                          <div style={priceStyle}>
                            <span style={priceLabelStyle}>Amount:</span>
                            <span style={priceValueStyle}>₹{booking.totalPrice || "0"}</span>
                          </div>
                          <div style={paymentStyle}>
                            <span style={paymentLabelStyle}>Payment:</span>
                            <span style={paymentStatusStyle(booking.paymentStatus)}>
                              {booking.paymentStatus || "Unknown"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Actions Column */}
                      <td style={tdStyle}>
                        <div style={actionsCellStyle}>
                          <button 
                            style={deleteBtnStyle} 
                            onClick={() => handleDelete(booking.id)}
                            title="Delete Booking"
                          >
                            🗑 Delete
                          </button>
                          {booking.paymentId && (
                            <div style={paymentIdStyle}>
                              PID: {booking.paymentId}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ===== Enhanced Styles =====
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
  fontSize: "2.2rem", 
  fontWeight: 800, 
  marginBottom: "30px", 
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  letterSpacing: "0.5px"
};

// Statistics Styles
const statsContainerStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: "20px",
  marginBottom: "30px"
};

const statCardStyle = {
  background: "white",
  borderRadius: "16px",
  padding: "20px",
  display: "flex",
  alignItems: "center",
  gap: "15px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
  border: "1px solid rgba(255,255,255,0.2)",
  transition: "transform 0.2s ease"
};

const statIconStyle = {
  width: "50px",
  height: "50px",
  borderRadius: "12px",
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "20px"
};

const statContentStyle = {
  flex: 1
};

const statNumberStyle = {
  fontSize: "1.5rem",
  fontWeight: "800",
  color: "#1F2937",
  marginBottom: "4px"
};

const statLabelStyle = {
  fontSize: "0.9rem",
  color: "#6B7280",
  fontWeight: "600"
};

// Filter Styles
const filtersContainerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "20px",
  flexWrap: "wrap",
  gap: "15px"
};

const filterGroupStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px"
};

const filterLabelStyle = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#374151"
};

const filterSelectStyle = {
  padding: "8px 12px",
  border: "1px solid #D1D5DB",
  borderRadius: "8px",
  background: "white",
  fontSize: "14px",
  fontWeight: "500",
  cursor: "pointer"
};

const resultsCountStyle = {
  fontSize: "14px",
  color: "#6B7280",
  fontWeight: "500"
};

// Table Styles
const tableContainerStyle = {
  background: "#ffffff",
  borderRadius: "16px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
  padding: "20px",
  marginBottom: "36px",
  overflow: "hidden"
};

const tableStyle = { 
  width: "100%", 
  borderCollapse: "collapse",
  background: "#fff",
};

const thStyle = { 
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  color: "#fff", 
  padding: "16px 12px", 
  textAlign: "left", 
  fontSize: "14px", 
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  borderBottom: "1px solid rgba(255,255,255,0.2)"
};

const tdStyle = { 
  padding: "16px 12px", 
  fontSize: "14px", 
  borderBottom: "1px solid #E5E7EB",
  verticalAlign: "top"
};

const tdEmptyStyle = { 
  ...tdStyle, 
  color: "#9ca3af", 
  fontWeight: 500, 
  fontSize: 16, 
  textAlign: "center",
  padding: "40px"
};

// Cell Content Styles
const userCellStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "4px"
};

const userNameStyle = {
  fontWeight: "600",
  color: "#1F2937",
  fontSize: "14px"
};

const userEmailStyle = {
  color: "#3B82F6",
  fontSize: "12px",
  fontWeight: "500"
};

const userPhoneStyle = {
  color: "#6B7280",
  fontSize: "12px"
};

const movieCellStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "6px"
};

const movieTitleStyle = {
  fontWeight: "600",
  color: "#1F2937",
  fontSize: "14px"
};

const movieMetaStyle = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  fontSize: "12px"
};

const genreStyle = {
  color: "#8B5CF6",
  fontWeight: "500"
};

const durationStyle = {
  color: "#6B7280"
};

const ratingStyle = {
  color: "#F59E0B",
  fontWeight: "500"
};

const dotStyle = {
  color: "#9CA3AF"
};

const showtimeStyle = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  fontSize: "12px"
};

const timeLabelStyle = {
  color: "#6B7280",
  fontWeight: "500"
};

const timeValueStyle = {
  color: "#10B981",
  fontWeight: "600"
};

const theaterCellStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "6px"
};

const theaterNameStyle = {
  fontWeight: "600",
  color: "#1F2937",
  fontSize: "14px"
};

const locationStyle = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  fontSize: "12px"
};

const cityIconStyle = {
  fontSize: "12px"
};

const cityTextStyle = {
  color: "#EF4444",
  fontWeight: "500"
};

const theaterIdStyle = {
  fontSize: "11px",
  color: "#9CA3AF",
  fontFamily: "monospace"
};

const bookingCellStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "4px"
};

const seatsStyle = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  fontSize: "12px"
};

const seatsLabelStyle = {
  color: "#6B7280",
  fontWeight: "500"
};

const seatsValueStyle = {
  color: "#1F2937",
  fontWeight: "600",
  background: "#F3F4F6",
  padding: "2px 6px",
  borderRadius: "4px",
  fontSize: "11px"
};

const dateStyle = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  fontSize: "12px"
};

const dateLabelStyle = {
  color: "#6B7280",
  fontWeight: "500"
};

const dateValueStyle = {
  color: "#1F2937",
  fontWeight: "500"
};

const priceStyle = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  fontSize: "12px"
};

const priceLabelStyle = {
  color: "#6B7280",
  fontWeight: "500"
};

const priceValueStyle = {
  color: "#10B981",
  fontWeight: "700"
};

const paymentStyle = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  fontSize: "12px"
};

const paymentLabelStyle = {
  color: "#6B7280",
  fontWeight: "500"
};

const paymentStatusStyle = (status) => ({
  color: status === "completed" ? "#10B981" : status === "pending" ? "#F59E0B" : "#EF4444",
  fontWeight: "600",
  fontSize: "11px",
  background: status === "completed" ? "#D1FAE5" : status === "pending" ? "#FEF3C7" : "#FEE2E2",
  padding: "2px 6px",
  borderRadius: "4px"
});

const actionsCellStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  alignItems: "flex-start"
};

const deleteBtnStyle = {
  background: "#EF4444",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  padding: "6px 12px",
  cursor: "pointer",
  fontSize: "12px",
  fontWeight: "600",
  transition: "all 0.2s ease",
  minWidth: "80px"
};

const paymentIdStyle = {
  fontSize: "10px",
  color: "#9CA3AF",
  fontFamily: "monospace",
  background: "#F3F4F6",
  padding: "2px 4px",
  borderRadius: "3px"
};

// Empty State Styles
const emptyStateStyle = {
  textAlign: "center",
  padding: "40px 20px"
};

const emptyIconStyle = {
  fontSize: "3rem",
  marginBottom: "16px",
  opacity: "0.5"
};

const emptyTitleStyle = {
  fontSize: "1.2rem",
  fontWeight: "600",
  color: "#6B7280",
  marginBottom: "8px"
};

const emptyTextStyle = {
  fontSize: "0.9rem",
  color: "#9CA3AF",
  lineHeight: "1.5"
};

// Loading Styles
const loadingContainerStyle = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "60px"
};

const spinnerStyle = {
  width: "50px",
  height: "50px",
  border: "4px solid rgba(255,255,255,0.3)",
  borderTop: "4px solid #667eea",
  borderRadius: "50%",
  animation: "spin 1s linear infinite",
  marginBottom: "20px"
};

const loadingTextStyle = {
  fontSize: "1.1rem",
  color: "#6B7280",
  fontWeight: "500"
};

// Add CSS animations
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    button:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    
    .stat-card:hover {
      transform: translateY(-2px);
    }
  `;
  document.head.appendChild(style);
}