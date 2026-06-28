import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import { db } from "../../firebaseConfig";
import { ref, onValue } from "firebase/database";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { useNavigate } from "react-router-dom";

export default function SeatUtilizationReport() {
  const [bookings, setBookings] = useState([]);
  const [theaters, setTheaters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("all");
  const [generating, setGenerating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    
    const bookingsRef = ref(db, "bookings");
    const theatersRef = ref(db, "theaters");

    const unsubBookings = onValue(bookingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const bookingsArray = Object.entries(data).map(([id, booking]) => ({
          id,
          ...booking,
        }));
        setBookings(bookingsArray);
      } else {
        setBookings([]);
      }
    });

    const unsubTheaters = onValue(theatersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const theatersArray = Object.entries(data).map(([id, theater]) => ({
          id,
          ...theater,
        }));
        setTheaters(theatersArray);
      } else {
        setTheaters([]);
      }
      setLoading(false);
    });

    return () => {
      unsubBookings();
      unsubTheaters();
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
      if (timeRange === "quarter") return diffDays <= 90;
      return true;
    });
  };

  // Generate seat utilization analytics
  const getSeatAnalytics = () => {
    const filteredBookings = getFilteredBookings();
    
    // Seat position analysis
    const seatPositions = {};
    const seatRows = {};
    const seatNumbers = {};
    const theaterSeatData = {};
    
    filteredBookings.forEach(booking => {
      const seats = booking.seats || [];
      const theaterName = booking.theaterName || "Unknown Theater";
      
      if (!theaterSeatData[theaterName]) {
        theaterSeatData[theaterName] = {
          totalBookedSeats: 0,
          seatPositions: {},
          seatRows: {},
          revenue: 0,
          bookings: 0
        };
      }
      
      theaterSeatData[theaterName].bookings += 1;
      theaterSeatData[theaterName].revenue += parseFloat(booking.totalPrice) || 0;
      
      seats.forEach(seat => {
        if (typeof seat === 'string') {
          theaterSeatData[theaterName].totalBookedSeats += 1;
          
          // Extract row (letter) and number from seat (e.g., "A1", "B5")
          const match = seat.match(/^([A-Z]+)(\d+)$/);
          if (match) {
            const row = match[1];
            const number = parseInt(match[2]);
            
            // Row analysis
            seatRows[row] = (seatRows[row] || 0) + 1;
            theaterSeatData[theaterName].seatRows[row] = (theaterSeatData[theaterName].seatRows[row] || 0) + 1;
            
            // Seat number analysis
            seatNumbers[number] = (seatNumbers[number] || 0) + 1;
            
            // Position analysis (front, middle, back)
            let position = "middle";
            if (["A", "B", "C"].includes(row)) position = "front";
            else if (["H", "I", "J", "K", "L"].includes(row)) position = "back";
            
            seatPositions[position] = (seatPositions[position] || 0) + 1;
            theaterSeatData[theaterName].seatPositions[position] = (theaterSeatData[theaterName].seatPositions[position] || 0) + 1;
          }
        }
      });
    });

    // Calculate theater capacities and utilization
    Object.keys(theaterSeatData).forEach(theaterName => {
      const theater = theaters.find(t => t.name === theaterName);
      const capacity = parseInt(theater?.capacity) || 100;
      const data = theaterSeatData[theaterName];
      
      data.capacity = capacity;
      data.utilizationRate = ((data.totalBookedSeats / capacity) * 100).toFixed(1);
      data.avgSeatsPerBooking = data.bookings > 0 ? (data.totalBookedSeats / data.bookings).toFixed(1) : 0;
    });

    return {
      seatPositions: Object.entries(seatPositions).sort((a, b) => b[1] - a[1]),
      seatRows: Object.entries(seatRows).sort((a, b) => b[1] - a[1]),
      seatNumbers: Object.entries(seatNumbers).sort((a, b) => b[1] - a[1]),
      theaterData: Object.entries(theaterSeatData)
        .map(([name, data]) => ({ theaterName: name, ...data }))
        .sort((a, b) => b.utilizationRate - a.utilizationRate)
    };
  };

  const analytics = getSeatAnalytics();
  const filteredBookings = getFilteredBookings();

  // Calculate overall statistics
  const totalSeatsBooked = filteredBookings.reduce((sum, booking) => 
    sum + (booking.seats ? booking.seats.length : 0), 0);
  const totalCapacity = theaters.reduce((sum, theater) => 
    sum + (parseInt(theater.capacity) || 100), 0);
  
  const overallStats = {
    totalSeatsBooked,
    totalCapacity,
    overallUtilization: totalCapacity > 0 ? ((totalSeatsBooked / totalCapacity) * 100).toFixed(1) : 0,
    avgSeatsPerBooking: filteredBookings.length > 0 ? (totalSeatsBooked / filteredBookings.length).toFixed(1) : 0,
    totalTheaters: analytics.theaterData.length
  };

  const goBack = () => {
    navigate("/admin/ReportsAnalytics");
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <Sidebar activePath="/admin/seatreport" />
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Loading Seat Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Sidebar activePath="/admin/seatreport" />

      <div style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <button style={styles.backButton} onClick={goBack}>
              ← Back to Reports
            </button>
            <h1 style={styles.title}>🪑 Seat Utilization Analytics</h1>
            <p style={styles.subtitle}>
              Comprehensive seat booking patterns and utilization insights
            </p>
          </div>
          
          <div style={styles.headerActions}>
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              style={styles.timeFilter}
            >
              <option value="all">All Time</option>
              <option value="quarter">Last 90 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="week">Last 7 Days</option>
            </select>
          </div>
        </div>

        {/* Overall Stats */}
        <div style={styles.overallStats}>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>🪑</div>
            <div style={styles.statContent}>
              <div style={styles.statNumber}>{overallStats.totalSeatsBooked}</div>
              <div style={styles.statLabel}>Seats Booked</div>
            </div>
          </div>
          
          <div style={styles.statCard}>
            <div style={styles.statIcon}>📊</div>
            <div style={styles.statContent}>
              <div style={styles.statNumber}>{overallStats.overallUtilization}%</div>
              <div style={styles.statLabel}>Overall Utilization</div>
            </div>
          </div>
          
          <div style={styles.statCard}>
            <div style={styles.statIcon}>🎯</div>
            <div style={styles.statContent}>
              <div style={styles.statNumber}>{overallStats.avgSeatsPerBooking}</div>
              <div style={styles.statLabel}>Avg Seats/Booking</div>
            </div>
          </div>
          
          <div style={styles.statCard}>
            <div style={styles.statIcon}>🏢</div>
            <div style={styles.statContent}>
              <div style={styles.statNumber}>{overallStats.totalTheaters}</div>
              <div style={styles.statLabel}>Active Theaters</div>
            </div>
          </div>
        </div>

        {/* Analytics Grid */}
        <div style={styles.analyticsGrid}>
          {/* Seat Position Preferences */}
          <div style={styles.widget}>
            <h4 style={styles.widgetTitle}>📍 Seat Position Preferences</h4>
            <div style={styles.preferenceList}>
              {analytics.seatPositions.map(([position, count]) => (
                <div key={position} style={styles.preferenceItem}>
                  <div style={styles.preferenceInfo}>
                    <span style={styles.preferenceName}>
                      {position.charAt(0).toUpperCase() + position.slice(1)} Seats
                    </span>
                    <span style={styles.preferenceCount}>{count} bookings</span>
                  </div>
                  <div style={styles.preferenceBar}>
                    <div 
                      style={{
                        ...styles.preferenceBarFill,
                        width: `${(count / Math.max(...analytics.seatPositions.map(p => p[1]))) * 100}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Popular Rows */}
          <div style={styles.widget}>
            <h4 style={styles.widgetTitle}>🔤 Most Popular Rows</h4>
            <div style={styles.rowsList}>
              {analytics.seatRows.slice(0, 8).map(([row, count]) => (
                <div key={row} style={styles.rowItem}>
                  <div style={styles.rowBadge}>Row {row}</div>
                  <div style={styles.rowCount}>{count} seats</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Theater Utilization Table */}
        <div style={styles.tableContainer}>
          <div style={styles.tableHeader}>
            <h3 style={styles.tableTitle}>🏢 Theater Seat Utilization</h3>
          </div>
          
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Theater</th>
                  <th style={styles.th}>Capacity</th>
                  <th style={styles.th}>Seats Booked</th>
                  <th style={styles.th}>Utilization</th>
                  <th style={styles.th}>Bookings</th>
                  <th style={styles.th}>Avg Seats/Booking</th>
                  <th style={styles.th}>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {analytics.theaterData.map((theater, index) => (
                  <tr key={theater.theaterName} style={styles.tr}>
                    <td style={styles.td}>
                      <span style={styles.theaterName}>{theater.theaterName}</span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.capacityText}>{theater.capacity} seats</span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.bookedSeats}>{theater.totalBookedSeats}</span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.utilizationCell}>
                        <span style={{
                          ...styles.utilizationText,
                          color: theater.utilizationRate > 70 ? "#10B981" : 
                                 theater.utilizationRate > 40 ? "#F59E0B" : "#EF4444"
                        }}>
                          {theater.utilizationRate}%
                        </span>
                        <div style={styles.utilizationBar}>
                          <div 
                            style={{
                              ...styles.utilizationFill,
                              width: `${Math.min(theater.utilizationRate, 100)}%`,
                              background: theater.utilizationRate > 70 ? "#10B981" : 
                                         theater.utilizationRate > 40 ? "#F59E0B" : "#EF4444"
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.bookingCount}>{theater.bookings}</span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.avgSeats}>{theater.avgSeatsPerBooking}</span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.revenueText}>₹{theater.revenue.toLocaleString()}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// Styles (condensed for token limit)
const styles = {
  container: { display: "flex", minHeight: "100vh", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", fontFamily: "'Inter', sans-serif" },
  content: { flex: 1, padding: "30px", background: "rgba(255, 255, 255, 0.95)", backdropFilter: "blur(10px)", margin: "20px", marginLeft: "280px", borderRadius: "20px", boxShadow: "0 20px 40px rgba(0,0,0,0.1)", overflowY: "auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "30px", flexWrap: "wrap", gap: "20px" },
  title: { fontSize: "2.2rem", fontWeight: "800", background: "linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: "10px 0 5px 0" },
  subtitle: { fontSize: "1rem", color: "#6B7280", margin: "0", maxWidth: "500px" },
  backButton: { background: "linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)", color: "white", border: "none", padding: "10px 20px", borderRadius: "10px", cursor: "pointer", fontWeight: "600", fontSize: "14px", transition: "all 0.2s ease", boxShadow: "0 4px 15px rgba(245, 158, 11, 0.3)", marginBottom: "10px" },
  headerActions: { display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" },
  timeFilter: { padding: "10px 15px", border: "1px solid #E5E7EB", borderRadius: "8px", background: "white", fontSize: "14px", fontWeight: "500", cursor: "pointer" },
  overallStats: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "30px" },
  statCard: { background: "white", borderRadius: "16px", padding: "20px", display: "flex", alignItems: "center", gap: "15px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", border: "1px solid rgba(255,255,255,0.2)", transition: "transform 0.2s ease" },
  statIcon: { width: "50px", height: "50px", borderRadius: "12px", background: "linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" },
  statContent: { flex: 1 },
  statNumber: { fontSize: "1.5rem", fontWeight: "800", color: "#1F2937", marginBottom: "4px" },
  statLabel: { fontSize: "0.9rem", color: "#6B7280", fontWeight: "600" },
  analyticsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "30px" },
  widget: { background: "white", borderRadius: "16px", padding: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", border: "1px solid rgba(255,255,255,0.2)" },
  widgetTitle: { fontSize: "1.1rem", fontWeight: "700", color: "#1F2937", margin: "0 0 20px 0" },
  preferenceList: { display: "flex", flexDirection: "column", gap: "12px" },
  preferenceItem: { display: "flex", alignItems: "center", gap: "12px", padding: "8px 0" },
  preferenceInfo: { flex: 1, display: "flex", justifyContent: "space-between" },
  preferenceName: { fontSize: "0.9rem", fontWeight: "600", color: "#1F2937" },
  preferenceCount: { fontSize: "0.8rem", color: "#6B7280" },
  preferenceBar: { width: "80px", height: "6px", background: "#E5E7EB", borderRadius: "3px", overflow: "hidden" },
  preferenceBarFill: { height: "100%", background: "linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)", borderRadius: "3px", transition: "width 0.3s ease" },
  rowsList: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "12px" },
  rowItem: { display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", padding: "12px", background: "#F9FAFB", borderRadius: "8px" },
  rowBadge: { fontSize: "0.9rem", fontWeight: "600", color: "#1F2937" },
  rowCount: { fontSize: "0.8rem", color: "#6B7280" },
  tableContainer: { background: "white", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", overflow: "hidden", marginBottom: "20px" },
  tableHeader: { padding: "24px", borderBottom: "1px solid #E5E7EB" },
  tableTitle: { fontSize: "1.3rem", fontWeight: "700", color: "#1F2937", margin: 0 },
  tableWrapper: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", background: "#fff" },
  th: { padding: "16px 12px", textAlign: "left", fontSize: "14px", fontWeight: "700", background: "linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)", color: "white", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid rgba(255,255,255,0.2)" },
  tr: { transition: "background-color 0.2s ease", borderBottom: "1px solid #E5E7EB" },
  td: { padding: "16px 12px", textAlign: "left", fontSize: "14px", background: "white", verticalAlign: "middle" },
  theaterName: { fontWeight: "600", color: "#1F2937", fontSize: "14px" },
  capacityText: { fontWeight: "600", color: "#7C3AED", fontSize: "14px" },
  bookedSeats: { fontWeight: "700", color: "#10B981", fontSize: "14px" },
  utilizationCell: { display: "flex", flexDirection: "column", gap: "6px", minWidth: "80px" },
  utilizationText: { fontWeight: "700", fontSize: "13px" },
  utilizationBar: { width: "100%", height: "4px", background: "#E5E7EB", borderRadius: "2px", overflow: "hidden" },
  utilizationFill: { height: "100%", borderRadius: "2px", transition: "width 0.3s ease" },
  bookingCount: { fontWeight: "600", color: "#1F2937", fontSize: "14px" },
  avgSeats: { fontWeight: "600", color: "#8B5CF6", fontSize: "14px" },
  revenueText: { fontWeight: "700", color: "#10B981", fontSize: "14px" },
  loadingContainer: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px" },
  spinner: { width: "50px", height: "50px", border: "4px solid rgba(255,255,255,0.3)", borderTop: "4px solid #F59E0B", borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: "20px" },
  loadingText: { fontSize: "1.1rem", color: "#6B7280", fontWeight: "500" }
};

// Add CSS animations
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
  document.head.appendChild(style);
}
