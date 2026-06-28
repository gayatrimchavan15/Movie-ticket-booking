import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import { db } from "../../firebaseConfig";
import { ref, onValue } from "firebase/database";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { useNavigate } from "react-router-dom";

export default function RevenueReport() {
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("all");
  const [revenueData, setRevenueData] = useState([]);
  const [generating, setGenerating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    
    const bookingsRef = ref(db, "bookings");
    const paymentsRef = ref(db, "payment");

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

    const unsubPayments = onValue(paymentsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const paymentsArray = Object.entries(data).map(([id, payment]) => ({
          id,
          ...payment,
        }));
        setPayments(paymentsArray);
      } else {
        setPayments([]);
      }
      setLoading(false);
    });

    return () => {
      unsubBookings();
      unsubPayments();
    };
  }, []);

  // Filter data by time range
  const getFilteredData = () => {
    const now = new Date();
    return bookings.filter(booking => {
      if (timeRange === "all") return true;
      
      const bookingDate = new Date(booking.bookingDate || booking.date);
      const diffTime = Math.abs(now - bookingDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (timeRange === "week") return diffDays <= 7;
      if (timeRange === "month") return diffDays <= 30;
      if (timeRange === "quarter") return diffDays <= 90;
      return true;
    });
  };

  // Generate revenue analytics
  const getRevenueAnalytics = () => {
    const filteredBookings = getFilteredData();
    
    // Daily revenue breakdown
    const dailyRevenue = {};
    const monthlyRevenue = {};
    const paymentMethods = {};
    
    filteredBookings.forEach(booking => {
      const date = booking.date || booking.bookingDate || "Unknown";
      const month = date.substring(0, 7); // YYYY-MM format
      const amount = parseFloat(booking.totalPrice) || 0;
      
      // Daily revenue
      dailyRevenue[date] = (dailyRevenue[date] || 0) + amount;
      
      // Monthly revenue
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + amount;
      
      // Payment methods (from payment data)
      const payment = payments.find(p => p.bookingId === booking.id);
      const method = payment?.mode || "Online";
      paymentMethods[method] = (paymentMethods[method] || 0) + amount;
    });

    // Theater-wise revenue
    const theaterRevenue = {};
    filteredBookings.forEach(booking => {
      const theater = booking.theaterName || "Unknown";
      const amount = parseFloat(booking.totalPrice) || 0;
      theaterRevenue[theater] = (theaterRevenue[theater] || 0) + amount;
    });

    // Movie-wise revenue
    const movieRevenue = {};
    filteredBookings.forEach(booking => {
      const movie = booking.movieTitle || "Unknown";
      const amount = parseFloat(booking.totalPrice) || 0;
      movieRevenue[movie] = (movieRevenue[movie] || 0) + amount;
    });

    return {
      dailyRevenue: Object.entries(dailyRevenue).sort((a, b) => a[0].localeCompare(b[0])),
      monthlyRevenue: Object.entries(monthlyRevenue).sort((a, b) => a[0].localeCompare(b[0])),
      paymentMethods: Object.entries(paymentMethods).sort((a, b) => b[1] - a[1]),
      theaterRevenue: Object.entries(theaterRevenue).sort((a, b) => b[1] - a[1]),
      movieRevenue: Object.entries(movieRevenue).sort((a, b) => b[1] - a[1])
    };
  };

  const analytics = getRevenueAnalytics();
  const filteredBookings = getFilteredData();

  // Calculate overall statistics
  const overallStats = {
    totalRevenue: filteredBookings.reduce((sum, booking) => sum + (parseFloat(booking.totalPrice) || 0), 0),
    totalBookings: filteredBookings.length,
    avgBookingValue: filteredBookings.length > 0 ? 
      (filteredBookings.reduce((sum, booking) => sum + (parseFloat(booking.totalPrice) || 0), 0) / filteredBookings.length).toFixed(2) : 0,
    successfulPayments: payments.filter(p => p.status === "completed").length,
    paymentSuccessRate: payments.length > 0 ? 
      ((payments.filter(p => p.status === "completed").length / payments.length) * 100).toFixed(1) : 0
  };

  // Export functions
  const exportToExcel = () => {
    setGenerating(true);
    
    const worksheetData = [
      // Summary
      { Type: "Summary", Description: "Total Revenue", Value: `₹${overallStats.totalRevenue.toLocaleString()}` },
      { Type: "Summary", Description: "Total Bookings", Value: overallStats.totalBookings },
      { Type: "Summary", Description: "Average Booking Value", Value: `₹${overallStats.avgBookingValue}` },
      { Type: "Summary", Description: "Payment Success Rate", Value: `${overallStats.paymentSuccessRate}%` },
      {},
      // Daily Revenue
      { Type: "Daily Revenue", Description: "Date", Value: "Amount" },
      ...analytics.dailyRevenue.map(([date, amount]) => ({
        Type: "Daily Revenue", Description: date, Value: `₹${amount.toLocaleString()}`
      })),
      {},
      // Theater Revenue
      { Type: "Theater Revenue", Description: "Theater", Value: "Amount" },
      ...analytics.theaterRevenue.slice(0, 10).map(([theater, amount]) => ({
        Type: "Theater Revenue", Description: theater, Value: `₹${amount.toLocaleString()}`
      }))
    ];

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Revenue Report");
    
    worksheet['!cols'] = [{ wch: 20 }, { wch: 30 }, { wch: 20 }];
    
    XLSX.writeFile(workbook, `Revenue_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    setGenerating(false);
  };

  const exportToPDF = () => {
    setGenerating(true);
    
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.setTextColor(139, 92, 246);
    doc.text("💰 Revenue Report", 14, 22);
    
    // Summary
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 35);
    doc.text(`Time Range: ${timeRange === "all" ? "All Time" : timeRange === "week" ? "Last 7 Days" : timeRange === "month" ? "Last 30 Days" : "Last 90 Days"}`, 14, 42);
    doc.text(`Total Revenue: ₹${overallStats.totalRevenue.toLocaleString()}`, 14, 49);
    doc.text(`Total Bookings: ${overallStats.totalBookings}`, 14, 56);

    // Top theaters table
    const tableColumn = ["Theater", "Revenue", "% of Total"];
    const totalRevenue = overallStats.totalRevenue;
    const tableRows = analytics.theaterRevenue.slice(0, 10).map(([theater, amount]) => [
      theater,
      `₹${amount.toLocaleString()}`,
      `${((amount / totalRevenue) * 100).toFixed(1)}%`
    ]);

    doc.autoTable({
      startY: 65,
      head: [tableColumn],
      body: tableRows,
      theme: "grid",
      headStyles: { 
        fillColor: [139, 92, 246],
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

    doc.save(`Revenue_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    setGenerating(false);
  };

  const goBack = () => {
    navigate("/admin/ReportsAnalytics");
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <Sidebar activePath="/admin/revenuereport" />
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Loading Revenue Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Sidebar activePath="/admin/revenuereport" />

      <div style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <button style={styles.backButton} onClick={goBack}>
              ← Back to Reports
            </button>
            <h1 style={styles.title}>💰 Revenue Analytics</h1>
            <p style={styles.subtitle}>
              Comprehensive financial performance and revenue analysis
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
            <button style={styles.excelButton} onClick={exportToExcel} disabled={generating}>
              {generating ? "⏳ Generating..." : "📊 Export Excel"}
            </button>
            <button style={styles.pdfButton} onClick={exportToPDF} disabled={generating}>
              {generating ? "⏳ Generating..." : "📄 Export PDF"}
            </button>
          </div>
        </div>

        {/* Overall Stats */}
        <div style={styles.overallStats}>
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
              <div style={styles.statNumber}>₹{overallStats.avgBookingValue}</div>
              <div style={styles.statLabel}>Avg Booking Value</div>
            </div>
          </div>
          
          <div style={styles.statCard}>
            <div style={styles.statIcon}>✅</div>
            <div style={styles.statContent}>
              <div style={styles.statNumber}>{overallStats.paymentSuccessRate}%</div>
              <div style={styles.statLabel}>Payment Success</div>
            </div>
          </div>
          
          <div style={styles.statCard}>
            <div style={styles.statIcon}>📅</div>
            <div style={styles.statContent}>
              <div style={styles.statNumber}>{overallStats.totalBookings}</div>
              <div style={styles.statLabel}>Total Bookings</div>
            </div>
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div style={styles.mainGrid}>
          {/* Theater Revenue */}
          <div style={styles.section}>
            <div style={styles.widget}>
              <h4 style={styles.widgetTitle}>🏢 Top Revenue Theaters</h4>
              <div style={styles.revenueList}>
                {analytics.theaterRevenue.slice(0, 8).map(([theater, amount], index) => (
                  <div key={theater} style={styles.revenueItem}>
                    <div style={styles.revenueRank}>{index + 1}</div>
                    <div style={styles.revenueInfo}>
                      <div style={styles.revenueName}>{theater}</div>
                      <div style={styles.revenueAmount}>₹{amount.toLocaleString()}</div>
                    </div>
                    <div style={styles.revenueBar}>
                      <div 
                        style={{
                          ...styles.revenueBarFill,
                          width: `${(amount / Math.max(...analytics.theaterRevenue.map(r => r[1]))) * 100}%`
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Movie Revenue */}
          <div style={styles.section}>
            <div style={styles.widget}>
              <h4 style={styles.widgetTitle}>🎬 Top Revenue Movies</h4>
              <div style={styles.revenueList}>
                {analytics.movieRevenue.slice(0, 8).map(([movie, amount], index) => (
                  <div key={movie} style={styles.revenueItem}>
                    <div style={styles.revenueRank}>{index + 1}</div>
                    <div style={styles.revenueInfo}>
                      <div style={styles.revenueName}>{movie}</div>
                      <div style={styles.revenueAmount}>₹{amount.toLocaleString()}</div>
                    </div>
                    <div style={styles.revenueBar}>
                      <div 
                        style={{
                          ...styles.revenueBarFill,
                          width: `${(amount / Math.max(...analytics.movieRevenue.map(r => r[1]))) * 100}%`
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div style={styles.section}>
          <div style={styles.widget}>
            <h4 style={styles.widgetTitle}>💳 Revenue by Payment Method</h4>
            <div style={styles.paymentMethods}>
              {analytics.paymentMethods.map(([method, amount]) => (
                <div key={method} style={styles.paymentMethodItem}>
                  <div style={styles.paymentMethodInfo}>
                    <span style={styles.paymentMethodName}>{method}</span>
                    <span style={styles.paymentMethodAmount}>₹{amount.toLocaleString()}</span>
                  </div>
                  <div style={styles.paymentMethodPercentage}>
                    {((amount / overallStats.totalRevenue) * 100).toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Styles
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
    overflowY: "auto"
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
    background: "linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)",
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
    background: "linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
    transition: "all 0.2s ease",
    boxShadow: "0 4px 15px rgba(139, 92, 246, 0.3)",
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
  excelButton: {
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
    background: "linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)",
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
  mainGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "24px",
    marginBottom: "30px"
  },
  section: {
    marginBottom: "20px"
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
  revenueList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },
  revenueItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "8px 0"
  },
  revenueRank: {
    width: "28px",
    height: "28px",
    borderRadius: "8px",
    background: "linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.8rem",
    fontWeight: "700",
    color: "white"
  },
  revenueInfo: {
    flex: 1,
    minWidth: 0
  },
  revenueName: {
    fontSize: "0.9rem",
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: "2px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  },
  revenueAmount: {
    fontSize: "0.8rem",
    color: "#10B981",
    fontWeight: "700"
  },
  revenueBar: {
    width: "60px",
    height: "6px",
    background: "#E5E7EB",
    borderRadius: "3px",
    overflow: "hidden"
  },
  revenueBarFill: {
    height: "100%",
    background: "linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)",
    borderRadius: "3px",
    transition: "width 0.3s ease"
  },
  paymentMethods: {
    display: "flex",
    flexDirection: "column",
    gap: "16px"
  },
  paymentMethodItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px",
    background: "#F9FAFB",
    borderRadius: "12px",
    border: "1px solid #E5E7EB"
  },
  paymentMethodInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "4px"
  },
  paymentMethodName: {
    fontSize: "0.9rem",
    fontWeight: "600",
    color: "#1F2937"
  },
  paymentMethodAmount: {
    fontSize: "1rem",
    fontWeight: "700",
    color: "#10B981"
  },
  paymentMethodPercentage: {
    fontSize: "0.9rem",
    fontWeight: "600",
    color: "#6B7280",
    background: "#E5E7EB",
    padding: "4px 8px",
    borderRadius: "6px"
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
    borderTop: "4px solid #8B5CF6",
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
    
    button:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0,0,0,0.15);
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
