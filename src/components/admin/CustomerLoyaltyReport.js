import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import { db } from "../../firebaseConfig";
import { ref, onValue } from "firebase/database";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { useNavigate } from "react-router-dom";

export default function CustomerLoyaltyReport() {
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("all");
  const [generating, setGenerating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    
    const usersRef = ref(db, "users");
    const bookingsRef = ref(db, "bookings");

    const unsubUsers = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const usersArray = Object.entries(data).map(([id, user]) => ({
          id,
          ...user,
        }));
        setUsers(usersArray);
      } else {
        setUsers([]);
      }
    });

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
      setLoading(false);
    });

    return () => {
      unsubUsers();
      unsubBookings();
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

  // Generate customer loyalty analytics
  const getLoyaltyAnalytics = () => {
    const filteredBookings = getFilteredBookings();
    
    // Customer segmentation
    const customerData = {};
    
    users.forEach(user => {
      customerData[user.id] = {
        id: user.id,
        name: user.name || user.fullName || "Unknown User",
        email: user.email || "No email",
        registrationDate: user.registeredAt || user.date || "Unknown",
        bookings: [],
        totalSpent: 0,
        totalBookings: 0,
        avgBookingValue: 0,
        daysSinceLastBooking: null,
        favoriteTheater: null,
        favoriteMovie: null,
        loyaltyTier: "New Customer"
      };
    });

    // Add booking data to customers
    filteredBookings.forEach(booking => {
      const userId = booking.userId;
      if (customerData[userId]) {
        customerData[userId].bookings.push(booking);
        customerData[userId].totalSpent += parseFloat(booking.totalPrice) || 0;
        customerData[userId].totalBookings += 1;
      }
    });

    // Calculate additional metrics for each customer
    Object.keys(customerData).forEach(userId => {
      const customer = customerData[userId];
      
      if (customer.totalBookings > 0) {
        customer.avgBookingValue = (customer.totalSpent / customer.totalBookings).toFixed(2);
        
        // Find last booking date
        const lastBooking = customer.bookings.sort((a, b) => 
          new Date(b.date || b.bookingDate) - new Date(a.date || a.bookingDate)
        )[0];
        
        if (lastBooking) {
          const lastBookingDate = new Date(lastBooking.date || lastBooking.bookingDate);
          const now = new Date();
          customer.daysSinceLastBooking = Math.ceil((now - lastBookingDate) / (1000 * 60 * 60 * 24));
        }
        
        // Find favorite theater
        const theaterCounts = {};
        customer.bookings.forEach(booking => {
          const theater = booking.theaterName || "Unknown";
          theaterCounts[theater] = (theaterCounts[theater] || 0) + 1;
        });
        customer.favoriteTheater = Object.entries(theaterCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "None";
        
        // Find favorite movie
        const movieCounts = {};
        customer.bookings.forEach(booking => {
          const movie = booking.movieTitle || "Unknown";
          movieCounts[movie] = (movieCounts[movie] || 0) + 1;
        });
        customer.favoriteMovie = Object.entries(movieCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "None";
        
        // Determine loyalty tier
        if (customer.totalBookings >= 10 && customer.totalSpent >= 2000) {
          customer.loyaltyTier = "VIP Customer";
        } else if (customer.totalBookings >= 5 && customer.totalSpent >= 1000) {
          customer.loyaltyTier = "Loyal Customer";
        } else if (customer.totalBookings >= 2) {
          customer.loyaltyTier = "Regular Customer";
        } else if (customer.totalBookings === 1) {
          customer.loyaltyTier = "First-time Customer";
        }
      }
    });

    // Convert to array and sort by total spent
    const customerArray = Object.values(customerData)
      .filter(customer => customer.totalBookings > 0)
      .sort((a, b) => b.totalSpent - a.totalSpent);

    // Calculate loyalty segments
    const loyaltySegments = {
      "VIP Customer": customerArray.filter(c => c.loyaltyTier === "VIP Customer").length,
      "Loyal Customer": customerArray.filter(c => c.loyaltyTier === "Loyal Customer").length,
      "Regular Customer": customerArray.filter(c => c.loyaltyTier === "Regular Customer").length,
      "First-time Customer": customerArray.filter(c => c.loyaltyTier === "First-time Customer").length,
      "New Customer": customerArray.filter(c => c.loyaltyTier === "New Customer").length
    };

    // Calculate retention metrics
    const activeCustomers = customerArray.filter(c => c.daysSinceLastBooking <= 30).length;
    const atRiskCustomers = customerArray.filter(c => c.daysSinceLastBooking > 30 && c.daysSinceLastBooking <= 90).length;
    const churnedCustomers = customerArray.filter(c => c.daysSinceLastBooking > 90).length;

    return {
      customers: customerArray,
      loyaltySegments,
      retentionMetrics: {
        active: activeCustomers,
        atRisk: atRiskCustomers,
        churned: churnedCustomers
      }
    };
  };

  const analytics = getLoyaltyAnalytics();
  const filteredBookings = getFilteredBookings();

  // Calculate overall statistics
  const overallStats = {
    totalCustomers: analytics.customers.length,
    totalRevenue: analytics.customers.reduce((sum, customer) => sum + customer.totalSpent, 0),
    avgCustomerValue: analytics.customers.length > 0 ? 
      (analytics.customers.reduce((sum, customer) => sum + customer.totalSpent, 0) / analytics.customers.length).toFixed(2) : 0,
    repeatCustomers: analytics.customers.filter(c => c.totalBookings > 1).length,
    retentionRate: analytics.customers.length > 0 ? 
      ((analytics.retentionMetrics.active / analytics.customers.length) * 100).toFixed(1) : 0
  };

  const goBack = () => {
    navigate("/admin/ReportsAnalytics");
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <Sidebar activePath="/admin/loyaltyreport" />
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Loading Customer Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Sidebar activePath="/admin/loyaltyreport" />

      <div style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <button style={styles.backButton} onClick={goBack}>
              ← Back to Reports
            </button>
            <h1 style={styles.title}>🏆 Customer Loyalty Analytics</h1>
            <p style={styles.subtitle}>
              Customer retention, lifetime value, and loyalty insights
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
            <div style={styles.statIcon}>👥</div>
            <div style={styles.statContent}>
              <div style={styles.statNumber}>{overallStats.totalCustomers}</div>
              <div style={styles.statLabel}>Active Customers</div>
            </div>
          </div>
          
          <div style={styles.statCard}>
            <div style={styles.statIcon}>💰</div>
            <div style={styles.statContent}>
              <div style={styles.statNumber}>₹{overallStats.avgCustomerValue}</div>
              <div style={styles.statLabel}>Avg Customer Value</div>
            </div>
          </div>
          
          <div style={styles.statCard}>
            <div style={styles.statIcon}>🔄</div>
            <div style={styles.statContent}>
              <div style={styles.statNumber}>{overallStats.repeatCustomers}</div>
              <div style={styles.statLabel}>Repeat Customers</div>
            </div>
          </div>
          
          <div style={styles.statCard}>
            <div style={styles.statIcon}>📊</div>
            <div style={styles.statContent}>
              <div style={styles.statNumber}>{overallStats.retentionRate}%</div>
              <div style={styles.statLabel}>Retention Rate</div>
            </div>
          </div>
        </div>

        {/* Analytics Grid */}
        <div style={styles.analyticsGrid}>
          {/* Loyalty Segments */}
          <div style={styles.widget}>
            <h4 style={styles.widgetTitle}>🏆 Customer Loyalty Segments</h4>
            <div style={styles.segmentsList}>
              {Object.entries(analytics.loyaltySegments).map(([tier, count]) => (
                <div key={tier} style={styles.segmentItem}>
                  <div style={styles.segmentInfo}>
                    <span style={styles.segmentName}>{tier}</span>
                    <span style={styles.segmentCount}>{count} customers</span>
                  </div>
                  <div style={styles.segmentPercentage}>
                    {analytics.customers.length > 0 ? 
                      ((count / analytics.customers.length) * 100).toFixed(1) : 0}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Retention Status */}
          <div style={styles.widget}>
            <h4 style={styles.widgetTitle}>📈 Customer Retention Status</h4>
            <div style={styles.retentionList}>
              <div style={styles.retentionItem}>
                <div style={{...styles.retentionBadge, background: "#10B981"}}>Active</div>
                <div style={styles.retentionInfo}>
                  <span style={styles.retentionCount}>{analytics.retentionMetrics.active}</span>
                  <span style={styles.retentionLabel}>Last 30 days</span>
                </div>
              </div>
              <div style={styles.retentionItem}>
                <div style={{...styles.retentionBadge, background: "#F59E0B"}}>At Risk</div>
                <div style={styles.retentionInfo}>
                  <span style={styles.retentionCount}>{analytics.retentionMetrics.atRisk}</span>
                  <span style={styles.retentionLabel}>30-90 days</span>
                </div>
              </div>
              <div style={styles.retentionItem}>
                <div style={{...styles.retentionBadge, background: "#EF4444"}}>Churned</div>
                <div style={styles.retentionInfo}>
                  <span style={styles.retentionCount}>{analytics.retentionMetrics.churned}</span>
                  <span style={styles.retentionLabel}>90+ days</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Customers Table */}
        <div style={styles.tableContainer}>
          <div style={styles.tableHeader}>
            <h3 style={styles.tableTitle}>🌟 Top Customers by Value</h3>
          </div>
          
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Rank</th>
                  <th style={styles.th}>Customer</th>
                  <th style={styles.th}>Tier</th>
                  <th style={styles.th}>Bookings</th>
                  <th style={styles.th}>Total Spent</th>
                  <th style={styles.th}>Avg Booking</th>
                  <th style={styles.th}>Last Activity</th>
                  <th style={styles.th}>Favorite Theater</th>
                </tr>
              </thead>
              <tbody>
                {analytics.customers.slice(0, 20).map((customer, index) => (
                  <tr key={customer.id} style={styles.tr}>
                    <td style={styles.td}>
                      <div style={styles.rankBadge}>#{index + 1}</div>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.customerInfo}>
                        <span style={styles.customerName}>{customer.name}</span>
                        <span style={styles.customerEmail}>{customer.email}</span>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.tierBadge,
                        background: customer.loyaltyTier === "VIP Customer" ? "#FFD700" :
                                   customer.loyaltyTier === "Loyal Customer" ? "#10B981" :
                                   customer.loyaltyTier === "Regular Customer" ? "#3B82F6" : "#6B7280",
                        color: customer.loyaltyTier === "VIP Customer" ? "#000" : "#FFF"
                      }}>
                        {customer.loyaltyTier}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.bookingCount}>{customer.totalBookings}</span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.totalSpent}>₹{customer.totalSpent.toLocaleString()}</span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.avgBooking}>₹{customer.avgBookingValue}</span>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.lastActivity,
                        color: customer.daysSinceLastBooking <= 30 ? "#10B981" :
                               customer.daysSinceLastBooking <= 90 ? "#F59E0B" : "#EF4444"
                      }}>
                        {customer.daysSinceLastBooking ? `${customer.daysSinceLastBooking} days ago` : "Never"}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.favoriteTheater}>{customer.favoriteTheater}</span>
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

// Styles (condensed)
const styles = {
  container: { display: "flex", minHeight: "100vh", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", fontFamily: "'Inter', sans-serif" },
  content: { flex: 1, padding: "30px", background: "rgba(255, 255, 255, 0.95)", backdropFilter: "blur(10px)", margin: "20px", marginLeft: "280px", borderRadius: "20px", boxShadow: "0 20px 40px rgba(0,0,0,0.1)", overflowY: "auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "30px", flexWrap: "wrap", gap: "20px" },
  title: { fontSize: "2.2rem", fontWeight: "800", background: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: "10px 0 5px 0" },
  subtitle: { fontSize: "1rem", color: "#6B7280", margin: "0", maxWidth: "500px" },
  backButton: { background: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)", color: "white", border: "none", padding: "10px 20px", borderRadius: "10px", cursor: "pointer", fontWeight: "600", fontSize: "14px", transition: "all 0.2s ease", boxShadow: "0 4px 15px rgba(255, 215, 0, 0.3)", marginBottom: "10px" },
  headerActions: { display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" },
  timeFilter: { padding: "10px 15px", border: "1px solid #E5E7EB", borderRadius: "8px", background: "white", fontSize: "14px", fontWeight: "500", cursor: "pointer" },
  overallStats: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "30px" },
  statCard: { background: "white", borderRadius: "16px", padding: "20px", display: "flex", alignItems: "center", gap: "15px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", border: "1px solid rgba(255,255,255,0.2)", transition: "transform 0.2s ease" },
  statIcon: { width: "50px", height: "50px", borderRadius: "12px", background: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" },
  statContent: { flex: 1 },
  statNumber: { fontSize: "1.5rem", fontWeight: "800", color: "#1F2937", marginBottom: "4px" },
  statLabel: { fontSize: "0.9rem", color: "#6B7280", fontWeight: "600" },
  analyticsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "30px" },
  widget: { background: "white", borderRadius: "16px", padding: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", border: "1px solid rgba(255,255,255,0.2)" },
  widgetTitle: { fontSize: "1.1rem", fontWeight: "700", color: "#1F2937", margin: "0 0 20px 0" },
  segmentsList: { display: "flex", flexDirection: "column", gap: "12px" },
  segmentItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "#F9FAFB", borderRadius: "8px" },
  segmentInfo: { display: "flex", flexDirection: "column", gap: "4px" },
  segmentName: { fontSize: "0.9rem", fontWeight: "600", color: "#1F2937" },
  segmentCount: { fontSize: "0.8rem", color: "#6B7280" },
  segmentPercentage: { fontSize: "0.9rem", fontWeight: "600", color: "#FFD700", background: "#FFF7ED", padding: "4px 8px", borderRadius: "6px" },
  retentionList: { display: "flex", flexDirection: "column", gap: "16px" },
  retentionItem: { display: "flex", alignItems: "center", gap: "12px", padding: "12px", background: "#F9FAFB", borderRadius: "8px" },
  retentionBadge: { padding: "6px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", color: "white", minWidth: "70px", textAlign: "center" },
  retentionInfo: { display: "flex", flexDirection: "column", gap: "2px" },
  retentionCount: { fontSize: "1.2rem", fontWeight: "700", color: "#1F2937" },
  retentionLabel: { fontSize: "0.8rem", color: "#6B7280" },
  tableContainer: { background: "white", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", overflow: "hidden", marginBottom: "20px" },
  tableHeader: { padding: "24px", borderBottom: "1px solid #E5E7EB" },
  tableTitle: { fontSize: "1.3rem", fontWeight: "700", color: "#1F2937", margin: 0 },
  tableWrapper: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", background: "#fff" },
  th: { padding: "16px 12px", textAlign: "left", fontSize: "14px", fontWeight: "700", background: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)", color: "white", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid rgba(255,255,255,0.2)" },
  tr: { transition: "background-color 0.2s ease", borderBottom: "1px solid #E5E7EB" },
  td: { padding: "16px 12px", textAlign: "left", fontSize: "14px", background: "white", verticalAlign: "middle" },
  rankBadge: { background: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)", color: "white", width: "30px", height: "30px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "700" },
  customerInfo: { display: "flex", flexDirection: "column", gap: "2px" },
  customerName: { fontWeight: "600", color: "#1F2937", fontSize: "14px" },
  customerEmail: { fontSize: "12px", color: "#6B7280" },
  tierBadge: { padding: "6px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", textAlign: "center", display: "inline-block", minWidth: "100px" },
  bookingCount: { fontWeight: "700", color: "#1F2937", background: "#F3F4F6", padding: "4px 8px", borderRadius: "6px", fontSize: "13px" },
  totalSpent: { fontWeight: "700", color: "#10B981", fontSize: "14px" },
  avgBooking: { fontWeight: "600", color: "#8B5CF6", fontSize: "14px" },
  lastActivity: { fontSize: "13px", fontWeight: "500" },
  favoriteTheater: { fontSize: "13px", color: "#6B7280", fontStyle: "italic" },
  loadingContainer: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px" },
  spinner: { width: "50px", height: "50px", border: "4px solid rgba(255,255,255,0.3)", borderTop: "4px solid #FFD700", borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: "20px" },
  loadingText: { fontSize: "1.1rem", color: "#6B7280", fontWeight: "500" }
};

// Add CSS animations
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
  document.head.appendChild(style);
}
