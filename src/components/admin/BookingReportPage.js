import React, { useEffect, useState, useRef } from "react";
import Sidebar from "./Sidebar";
import { db } from "../../firebaseConfig";
import { ref, onValue } from "firebase/database";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { useNavigate } from "react-router-dom";

export default function BookingReport() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [theaters, setTheaters] = useState([]);
  const [users, setUsers] = useState([]);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    theater: "all",
    movie: "all",
    paymentStatus: "all"
  });
  const [reportData, setReportData] = useState([]);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    setLoading(true);
    
    const bookingsRef = ref(db, "bookings");
    const theatersRef = ref(db, "theaters");
    const usersRef = ref(db, "users");
    const moviesRef = ref(db, "movies");

    const unsubBookings = onValue(bookingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const bookingsArray = Object.entries(data).map(([id, booking]) => ({
          id,
          ...booking,
        }));
        setBookings(bookingsArray);
        setReportData(bookingsArray); // Initialize report data with all bookings
      } else {
        setBookings([]);
        setReportData([]);
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
      duration: movie?.duration || "N/A"
    };
  };

  // Get theater details
  const getTheaterDetails = (theaterName, theaterId) => {
    const theater = theaters.find(t => 
      t.id === theaterId || t.name === theaterName
    );
    return {
      name: theater?.name || theaterName || "Unknown Theater",
      city: theater?.city || "Unknown City"
    };
  };

  // Apply filters
  const applyFilters = () => {
    setGenerating(true);
    
    let filtered = [...bookings];

    // Date filter
    if (filters.startDate) {
      filtered = filtered.filter(booking => {
        const bookingDate = booking.date || booking.bookingDate;
        return bookingDate >= filters.startDate;
      });
    }

    if (filters.endDate) {
      filtered = filtered.filter(booking => {
        const bookingDate = booking.date || booking.bookingDate;
        return bookingDate <= filters.endDate;
      });
    }

    // Theater filter
    if (filters.theater !== "all") {
      filtered = filtered.filter(booking => 
        booking.theaterId === filters.theater || booking.theaterName === filters.theater
      );
    }

    // Movie filter
    if (filters.movie !== "all") {
      filtered = filtered.filter(booking => 
        booking.movieTitle === filters.movie
      );
    }

    // Payment status filter
    if (filters.paymentStatus !== "all") {
      filtered = filtered.filter(booking => 
        booking.paymentStatus === filters.paymentStatus
      );
    }

    setReportData(filtered);
    setGenerating(false);
  };

  // Calculate report statistics
  const getReportStats = () => {
    const totalBookings = reportData.length;
    const totalRevenue = reportData.reduce((sum, booking) => 
      sum + (parseFloat(booking.totalPrice) || 0), 0
    );
    const avgBookingValue = totalBookings > 0 ? (totalRevenue / totalBookings).toFixed(2) : 0;
    
    const paymentStats = reportData.reduce((stats, booking) => {
      const status = booking.paymentStatus || "unknown";
      stats[status] = (stats[status] || 0) + 1;
      return stats;
    }, {});

    return {
      totalBookings,
      totalRevenue,
      avgBookingValue,
      paymentStats
    };
  };

  // Export to Excel
  const exportToExcel = () => {
    setGenerating(true);
    
    const worksheetData = reportData.map(booking => {
      const userDetails = getUserDetails(booking.userId, booking.userName);
      const theaterDetails = getTheaterDetails(booking.theaterName, booking.theaterId);
      const movieDetails = getMovieDetails(booking.movieTitle);

      return {
        "Booking ID": booking.id,
        "User Name": userDetails.name,
        "User Email": userDetails.email,
        "Movie Title": booking.movieTitle || "-",
        "Genre": movieDetails.genre,
        "Theater": theaterDetails.name,
        "City": theaterDetails.city,
        "Show Date": booking.date || booking.bookingDate || "-",
        "Show Time": booking.showtime || booking.time || "-",
        "Seats": Array.isArray(booking.seats) ? booking.seats.join(", ") : booking.seats || "-",
        "Total Price": `₹${booking.totalPrice || "0"}`,
        "Payment Status": booking.paymentStatus || "Unknown",
        "Payment ID": booking.paymentId || "-"
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Booking Report");
    
    // Auto-size columns
    const maxWidth = worksheetData.reduce((w, r) => Math.max(w, r["User Name"].length), 10);
    worksheet['!cols'] = [{ wch: maxWidth + 2 }];
    
    XLSX.writeFile(workbook, `Booking_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    setGenerating(false);
  };

  // Export to PDF
  const exportToPDF = () => {
    setGenerating(true);
    
    const doc = new jsPDF();
    const stats = getReportStats();
    
    // Title
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text("Booking Report", 105, 20, { align: "center" });
    
    // Report Date
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 30, { align: "center" });
    
    // Statistics
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text(`Total Bookings: ${stats.totalBookings}`, 20, 45);
    doc.text(`Total Revenue: ₹${stats.totalRevenue.toLocaleString()}`, 20, 55);
    doc.text(`Average Booking Value: ₹${stats.avgBookingValue}`, 20, 65);
    
    let yPosition = 80;
    
    // Table headers
    const headers = [
      ["Booking ID", "User", "Movie", "Theater", "Date", "Time", "Seats", "Amount", "Status"]
    ];
    
    const tableData = reportData.map(booking => {
      const userDetails = getUserDetails(booking.userId, booking.userName);
      const theaterDetails = getTheaterDetails(booking.theaterName, booking.theaterId);
      
      return [
        booking.id.substring(0, 8) + "...",
        userDetails.name,
        booking.movieTitle?.substring(0, 15) + (booking.movieTitle?.length > 15 ? "..." : "") || "-",
        theaterDetails.name.substring(0, 12) + (theaterDetails.name.length > 12 ? "..." : ""),
        booking.date || booking.bookingDate || "-",
        booking.showtime || booking.time || "-",
        Array.isArray(booking.seats) ? 
          booking.seats.slice(0, 2).join(", ") + (booking.seats.length > 2 ? "..." : "") : 
          (booking.seats || "-"),
        `₹${booking.totalPrice || "0"}`,
        booking.paymentStatus || "Unknown"
      ];
    });
    
    doc.autoTable({
      head: headers,
      body: tableData,
      startY: yPosition,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [102, 126, 234] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { top: 20 }
    });
    
    doc.save(`Booking_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    setGenerating(false);
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      startDate: "",
      endDate: "",
      theater: "all",
      movie: "all",
      paymentStatus: "all"
    });
    setReportData(bookings);
  };

  const stats = getReportStats();

  if (loading) {
    return (
      <div style={containerStyle}>
        <Sidebar activePath="/admin/booking-report" />
        <div style={loadingContainerStyle}>
          <div style={spinnerStyle}></div>
          <p style={loadingTextStyle}>Loading Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <Sidebar activePath="/admin/booking-report" />
      <div style={mainContentStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
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
              transition: 'all 0.2s ease'
            }}
          >
            ← Back to Reports
          </button>
          <h2 style={headingStyle}>📊 Booking Reports</h2>
        </div>

        {/* Filters Section */}
        <div style={filtersCardStyle}>
          <h3 style={filtersTitleStyle}>Report Filters</h3>
          <div style={filtersGridStyle}>
            {/* Date Range */}
            <div style={filterGroupStyle}>
              <label style={filterLabelStyle}>Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                style={filterInputStyle}
              />
            </div>
            <div style={filterGroupStyle}>
              <label style={filterLabelStyle}>End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                style={filterInputStyle}
              />
            </div>

            {/* Theater Filter */}
            <div style={filterGroupStyle}>
              <label style={filterLabelStyle}>Theater</label>
              <select
                value={filters.theater}
                onChange={(e) => setFilters({...filters, theater: e.target.value})}
                style={filterSelectStyle}
              >
                <option value="all">All Theaters</option>
                {theaters.map(theater => (
                  <option key={theater.id} value={theater.id}>
                    {theater.name} - {theater.city}
                  </option>
                ))}
              </select>
            </div>

            {/* Movie Filter */}
            <div style={filterGroupStyle}>
              <label style={filterLabelStyle}>Movie</label>
              <select
                value={filters.movie}
                onChange={(e) => setFilters({...filters, movie: e.target.value})}
                style={filterSelectStyle}
              >
                <option value="all">All Movies</option>
                {movies.map(movie => (
                  <option key={movie.id} value={movie.title}>
                    {movie.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Status Filter */}
            <div style={filterGroupStyle}>
              <label style={filterLabelStyle}>Payment Status</label>
              <select
                value={filters.paymentStatus}
                onChange={(e) => setFilters({...filters, paymentStatus: e.target.value})}
                style={filterSelectStyle}
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          {/* Filter Actions */}
          <div style={filterActionsStyle}>
            <button 
              onClick={applyFilters}
              style={applyBtnStyle}
              disabled={generating}
            >
              {generating ? "⏳ Applying..." : "🔍 Apply Filters"}
            </button>
            <button 
              onClick={resetFilters}
              style={resetBtnStyle}
              disabled={generating}
            >
              🔄 Reset
            </button>
          </div>
        </div>

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
          <div style={statCardStyle}>
            <div style={statIconStyle}>✅</div>
            <div style={statContentStyle}>
              <div style={statNumberStyle}>{stats.paymentStats.completed || 0}</div>
              <div style={statLabelStyle}>Completed Payments</div>
            </div>
          </div>
        </div>

        {/* Export Actions */}
        <div style={exportCardStyle}>
          <h3 style={exportTitleStyle}>Export Report</h3>
          <p style={exportDescriptionStyle}>
            Export the filtered booking data in your preferred format. 
            {reportData.length > 0 ? ` Currently showing ${reportData.length} bookings.` : " No data to export."}
          </p>
          <div style={exportActionsStyle}>
            <button 
              onClick={exportToExcel}
              style={excelBtnStyle}
              disabled={generating || reportData.length === 0}
            >
              {generating ? "⏳ Generating..." : "📊 Export to Excel"}
            </button>
            <button 
              onClick={exportToPDF}
              style={pdfBtnStyle}
              disabled={generating || reportData.length === 0}
            >
              {generating ? "⏳ Generating..." : "📄 Export to PDF"}
            </button>
          </div>
        </div>

        {/* Report Preview */}
        <div style={previewCardStyle}>
          <div style={previewHeaderStyle}>
            <h3 style={previewTitleStyle}>Report Preview</h3>
            <div style={previewCountStyle}>
              Showing {reportData.length} of {bookings.length} total bookings
            </div>
          </div>
          
          {reportData.length === 0 ? (
            <div style={emptyStateStyle}>
              <div style={emptyIconStyle}>📋</div>
              <h3 style={emptyTitleStyle}>No Bookings Match Your Filters</h3>
              <p style={emptyTextStyle}>
                Try adjusting your filters or date range to see booking data.
              </p>
            </div>
          ) : (
            <div style={tableContainerStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Booking ID</th>
                    <th style={thStyle}>User</th>
                    <th style={thStyle}>Movie</th>
                    <th style={thStyle}>Theater</th>
                    <th style={thStyle}>Date & Time</th>
                    <th style={thStyle}>Seats</th>
                    <th style={thStyle}>Amount</th>
                    {/* <th style={thStyle}>Status</th> */}
                  </tr>
                </thead>
                <tbody>
                  {reportData.slice(0, 10).map((booking, index) => {
                    const userDetails = getUserDetails(booking.userId, booking.userName);
                    const theaterDetails = getTheaterDetails(booking.theaterName, booking.theaterId);
                    
                    return (
                      <tr key={booking.id} style={tableRowStyle(index)}>
                        <td style={tdStyle}>
                          <div style={bookingIdStyle}>{booking.id.substring(0, 12)}...</div>
                        </td>
                        <td style={tdStyle}>
                          <div style={userInfoStyle}>
                            <div style={userNameStyle}>{userDetails.name}</div>
                            <div style={userEmailStyle}>{userDetails.email}</div>
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <div style={movieInfoStyle}>
                            <div style={movieTitleStyle}>{booking.movieTitle}</div>
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <div style={theaterInfoStyle}>
                            <div style={theaterNameStyle}>{theaterDetails.name}</div>
                            <div style={theaterCityStyle}>{theaterDetails.city}</div>
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <div style={datetimeStyle}>
                            <div style={dateStyle}>{booking.date || booking.bookingDate}</div>
                            <div style={timeStyle}>{booking.showtime || booking.time}</div>
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <div style={seatsStyle}>
                            {Array.isArray(booking.seats) ? 
                              booking.seats.slice(0, 3).join(", ") + (booking.seats.length > 3 ? "..." : "") : 
                              booking.seats}
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <div style={amountStyle}>₹{booking.totalPrice || "0"}</div>
                        </td>
                        {/* <td style={tdStyle}>
                          <span style={statusStyle(booking.paymentStatus)}>
                            {booking.paymentStatus || "Unknown"}
                          </span>
                        </td> */}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {reportData.length > 10 && (
                <div style={previewNoteStyle}>
                  ⓘ Showing first 10 of {reportData.length} bookings. Export to see full data.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ===== Styles =====
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
  overflowY: "auto",
  width: "calc(100vw - 320px)"
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

// Filter Styles
const filtersCardStyle = {
  background: "white",
  borderRadius: "16px",
  padding: "24px",
  marginBottom: "24px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
  border: "1px solid rgba(255,255,255,0.2)"
};

const filtersTitleStyle = {
  fontSize: "1.3rem",
  fontWeight: "700",
  color: "#1F2937",
  marginBottom: "20px"
};

const filtersGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: "20px",
  marginBottom: "20px"
};

const filterGroupStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "8px"
};

const filterLabelStyle = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#374151"
};

const filterInputStyle = {
  padding: "10px 12px",
  border: "1px solid #D1D5DB",
  borderRadius: "8px",
  background: "white",
  fontSize: "14px",
  fontWeight: "500"
};

const filterSelectStyle = {
  padding: "10px 12px",
  border: "1px solid #D1D5DB",
  borderRadius: "8px",
  background: "white",
  fontSize: "14px",
  fontWeight: "500",
  cursor: "pointer"
};

const filterActionsStyle = {
  display: "flex",
  gap: "12px",
  alignItems: "center"
};

const applyBtnStyle = {
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  color: "white",
  border: "none",
  borderRadius: "8px",
  padding: "10px 20px",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "600",
  transition: "all 0.2s ease"
};

const resetBtnStyle = {
  background: "#6B7280",
  color: "white",
  border: "none",
  borderRadius: "8px",
  padding: "10px 20px",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "600",
  transition: "all 0.2s ease"
};

// Statistics Styles
const statsContainerStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: "20px",
  marginBottom: "24px"
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

// Export Styles
const exportCardStyle = {
  background: "white",
  borderRadius: "16px",
  padding: "24px",
  marginBottom: "24px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
  border: "1px solid rgba(255,255,255,0.2)"
};

const exportTitleStyle = {
  fontSize: "1.3rem",
  fontWeight: "700",
  color: "#1F2937",
  marginBottom: "8px"
};

const exportDescriptionStyle = {
  fontSize: "14px",
  color: "#6B7280",
  marginBottom: "20px",
  lineHeight: "1.5"
};

const exportActionsStyle = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap"
};

const excelBtnStyle = {
  background: "#10B981",
  color: "white",
  border: "none",
  borderRadius: "8px",
  padding: "12px 24px",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "600",
  transition: "all 0.2s ease"
};

const pdfBtnStyle = {
  background: "#EF4444",
  color: "white",
  border: "none",
  borderRadius: "8px",
  padding: "12px 24px",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "600",
  transition: "all 0.2s ease"
};

// Preview Styles
const previewCardStyle = {
  background: "white",
  borderRadius: "16px",
  padding: "24px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
  border: "1px solid rgba(255,255,255,0.2)"
};

const previewHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "20px"
};

const previewTitleStyle = {
  fontSize: "1.3rem",
  fontWeight: "700",
  color: "#1F2937"
};

const previewCountStyle = {
  fontSize: "14px",
  color: "#6B7280",
  fontWeight: "500"
};

const previewNoteStyle = {
  fontSize: "12px",
  color: "#6B7280",
  textAlign: "center",
  padding: "12px",
  background: "#F9FAFB",
  borderRadius: "8px",
  marginTop: "12px"
};

// Table Styles
const tableContainerStyle = {
  overflowX: "auto"
};

const tableStyle = { 
  width: "100%", 
  borderCollapse: "collapse",
  background: "#fff",
};

const thStyle = { 
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  color: "#fff", 
  padding: "12px 8px", 
  textAlign: "left", 
  fontSize: "12px", 
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  borderBottom: "1px solid rgba(255,255,255,0.2)"
};

const tdStyle = { 
  padding: "12px 8px", 
  fontSize: "12px", 
  borderBottom: "1px solid #E5E7EB",
  verticalAlign: "top"
};

const tableRowStyle = (index) => ({
  backgroundColor: index % 2 === 0 ? "#ffffff" : "#f9fbfd",
  transition: "all 0.2s ease"
});

// Cell Content Styles
const bookingIdStyle = {
  fontFamily: "monospace",
  fontSize: "11px",
  color: "#6B7280",
  fontWeight: "500"
};

const userInfoStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "2px"
};

const userNameStyle = {
  fontWeight: "600",
  color: "#1F2937",
  fontSize: "12px"
};

const userEmailStyle = {
  color: "#6B7280",
  fontSize: "11px"
};

const movieInfoStyle = {
  display: "flex",
  flexDirection: "column"
};

const movieTitleStyle = {
  fontWeight: "500",
  color: "#1F2937",
  fontSize: "12px"
};

const theaterInfoStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "2px"
};

const theaterNameStyle = {
  fontWeight: "500",
  color: "#1F2937",
  fontSize: "12px"
};

const theaterCityStyle = {
  color: "#6B7280",
  fontSize: "11px"
};

const datetimeStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "2px"
};

const dateStyle = {
  fontWeight: "500",
  color: "#1F2937",
  fontSize: "12px"
};

const timeStyle = {
  color: "#6B7280",
  fontSize: "11px"
};

const seatsStyle = {
  fontSize: "11px",
  fontWeight: "500",
  color: "#1F2937"
};

const amountStyle = {
  fontWeight: "700",
  color: "#10B981",
  fontSize: "12px"
};

const statusStyle = (status) => ({
  fontSize: "11px",
  fontWeight: "600",
  padding: "4px 8px",
  borderRadius: "12px",
  background: status === "completed" ? "#D1FAE5" : 
              status === "pending" ? "#FEF3C7" : 
              status === "failed" ? "#FEE2E2" : "#F3F4F6",
  color: status === "completed" ? "#065F46" : 
         status === "pending" ? "#92400E" : 
         status === "failed" ? "#991B1B" : "#374151",
  display: "inline-block"
});

// Empty State Styles
const emptyStateStyle = {
  textAlign: "center",
  padding: "60px 20px"
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
    
    button:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    
    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none !important;
    }
    
    .stat-card:hover {
      transform: translateY(-2px);
    }
  `;
  document.head.appendChild(style);
}