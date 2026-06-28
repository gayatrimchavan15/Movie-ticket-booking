import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import { db } from "../../firebaseConfig";
import { ref, onValue } from "firebase/database";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { useNavigate } from "react-router-dom";

export default function CityReport() {
  const [theaters, setTheaters] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("all");
  const [generating, setGenerating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    
    const theatersRef = ref(db, "theaters");
    const bookingsRef = ref(db, "bookings");
    const usersRef = ref(db, "users");

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
    });

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
      setLoading(false);
    });

    return () => {
      unsubTheaters();
      unsubBookings();
      unsubUsers();
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

  // Generate city analytics
  const getCityAnalytics = () => {
    const filteredBookings = getFilteredBookings();
    
    // Group theaters by city
    const citiesData = {};
    
    theaters.forEach(theater => {
      const city = theater.city || "Unknown City";
      if (!citiesData[city]) {
        citiesData[city] = {
          theaters: [],
          totalTheaters: 0,
          totalCapacity: 0,
          totalScreens: 0,
          bookings: [],
          revenue: 0,
          users: []
        };
      }
      
      citiesData[city].theaters.push(theater);
      citiesData[city].totalTheaters += 1;
      citiesData[city].totalCapacity += parseInt(theater.capacity) || 100;
      citiesData[city].totalScreens += parseInt(theater.screens) || 1;
    });

    // Add booking data to cities
    filteredBookings.forEach(booking => {
      const theater = theaters.find(t => t.id === booking.theaterId || t.name === booking.theaterName);
      const city = theater?.city || booking.userCity || "Unknown City";
      
      if (citiesData[city]) {
        citiesData[city].bookings.push(booking);
        citiesData[city].revenue += parseFloat(booking.totalPrice) || 0;
      }
    });

    // Add user data to cities
    users.forEach(user => {
      const city = user.city || "Unknown City";
      if (citiesData[city]) {
        citiesData[city].users.push(user);
      }
    });

    // Calculate additional metrics for each city
    Object.keys(citiesData).forEach(city => {
      const cityData = citiesData[city];
      cityData.totalUsers = cityData.users.length;
      cityData.totalBookings = cityData.bookings.length;
      cityData.avgBookingValue = cityData.totalBookings > 0 ? 
        (cityData.revenue / cityData.totalBookings).toFixed(2) : 0;
      cityData.occupancyRate = cityData.totalCapacity > 0 ? 
        ((cityData.totalBookings / cityData.totalCapacity) * 100).toFixed(1) : 0;
      cityData.revenuePerTheater = cityData.totalTheaters > 0 ? 
        (cityData.revenue / cityData.totalTheaters).toFixed(2) : 0;
      cityData.usersPerTheater = cityData.totalTheaters > 0 ? 
        (cityData.totalUsers / cityData.totalTheaters).toFixed(1) : 0;
    });

    // Convert to array and sort by revenue
    return Object.entries(citiesData)
      .map(([cityName, data]) => ({ cityName, ...data }))
      .sort((a, b) => b.revenue - a.revenue);
  };

  const cityAnalytics = getCityAnalytics();
  const filteredBookings = getFilteredBookings();

  // Calculate overall statistics
  const overallStats = {
    totalCities: cityAnalytics.length,
    totalRevenue: cityAnalytics.reduce((sum, city) => sum + city.revenue, 0),
    totalBookings: filteredBookings.length,
    totalTheaters: theaters.length,
    totalUsers: users.length,
    avgRevenuePerCity: cityAnalytics.length > 0 ? 
      (cityAnalytics.reduce((sum, city) => sum + city.revenue, 0) / cityAnalytics.length).toFixed(2) : 0
  };

  // Export functions
  const exportToExcel = () => {
    setGenerating(true);
    
    const worksheetData = cityAnalytics.map((city, index) => ({
      "Rank": index + 1,
      "City": city.cityName,
      "Theaters": city.totalTheaters,
      "Screens": city.totalScreens,
      "Capacity": city.totalCapacity,
      "Users": city.totalUsers,
      "Bookings": city.totalBookings,
      "Revenue": `₹${city.revenue.toLocaleString()}`,
      "Avg Booking Value": `₹${city.avgBookingValue}`,
      "Occupancy Rate": `${city.occupancyRate}%`,
      "Revenue per Theater": `₹${city.revenuePerTheater}`,
      "Users per Theater": city.usersPerTheater
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "City Performance Report");
    
    worksheet['!cols'] = [
      { wch: 8 }, { wch: 20 }, { wch: 10 }, { wch: 10 }, { wch: 12 },
      { wch: 10 }, { wch: 12 }, { wch: 15 }, { wch: 18 }, { wch: 15 },
      { wch: 18 }, { wch: 15 }
    ];
    
    XLSX.writeFile(workbook, `City_Performance_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    setGenerating(false);
  };

  const exportToPDF = () => {
    setGenerating(true);
    
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.setTextColor(6, 182, 212);
    doc.text("🌍 City Performance Report", 14, 22);
    
    // Summary
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 35);
    doc.text(`Time Range: ${timeRange === "all" ? "All Time" : timeRange === "week" ? "Last 7 Days" : timeRange === "month" ? "Last 30 Days" : "Last 90 Days"}`, 14, 42);
    doc.text(`Total Cities: ${overallStats.totalCities}`, 14, 49);
    doc.text(`Total Revenue: ₹${overallStats.totalRevenue.toLocaleString()}`, 14, 56);

    // Table
    const tableColumn = ["Rank", "City", "Theaters", "Users", "Bookings", "Revenue", "Occupancy"];
    const tableRows = cityAnalytics.slice(0, 15).map((city, index) => [
      `#${index + 1}`,
      city.cityName,
      city.totalTheaters.toString(),
      city.totalUsers.toString(),
      city.totalBookings.toString(),
      `₹${city.revenue.toLocaleString()}`,
      `${city.occupancyRate}%`
    ]);

    doc.autoTable({
      startY: 65,
      head: [tableColumn],
      body: tableRows,
      theme: "grid",
      headStyles: { 
        fillColor: [6, 182, 212],
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

    doc.save(`City_Performance_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    setGenerating(false);
  };

  const goBack = () => {
    navigate("/admin/ReportsAnalytics");
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <Sidebar activePath="/admin/cityreport" />
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Loading City Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Sidebar activePath="/admin/cityreport" />

      <div style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <button style={styles.backButton} onClick={goBack}>
              ← Back to Reports
            </button>
            <h1 style={styles.title}>🌍 City Performance Analytics</h1>
            <p style={styles.subtitle}>
              Geographic performance analysis and market penetration insights
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
            <div style={styles.statIcon}>🌍</div>
            <div style={styles.statContent}>
              <div style={styles.statNumber}>{overallStats.totalCities}</div>
              <div style={styles.statLabel}>Total Cities</div>
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
            <div style={styles.statIcon}>🏢</div>
            <div style={styles.statContent}>
              <div style={styles.statNumber}>{overallStats.totalTheaters}</div>
              <div style={styles.statLabel}>Total Theaters</div>
            </div>
          </div>
          
          <div style={styles.statCard}>
            <div style={styles.statIcon}>📊</div>
            <div style={styles.statContent}>
              <div style={styles.statNumber}>₹{overallStats.avgRevenuePerCity}</div>
              <div style={styles.statLabel}>Avg Revenue/City</div>
            </div>
          </div>
        </div>

        {/* City Performance Table */}
        <div style={styles.tableContainer}>
          <div style={styles.tableHeader}>
            <h3 style={styles.tableTitle}>📋 City Performance Ranking</h3>
            <div style={styles.tableCount}>
              Showing {cityAnalytics.length} cities
            </div>
          </div>
          
          {cityAnalytics.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>🌍</div>
              <h3 style={styles.emptyTitle}>No City Data Available</h3>
              <p style={styles.emptyText}>
                No city performance data to display.
              </p>
            </div>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Rank</th>
                    <th style={styles.th}>City</th>
                    <th style={styles.th}>Theaters</th>
                    <th style={styles.th}>Capacity</th>
                    <th style={styles.th}>Users</th>
                    <th style={styles.th}>Bookings</th>
                    <th style={styles.th}>Revenue</th>
                    <th style={styles.th}>Occupancy</th>
                    <th style={styles.th}>Avg Booking</th>
                  </tr>
                </thead>
                <tbody>
                  {cityAnalytics.map((city, index) => (
                    <tr key={city.cityName} style={styles.tr}>
                      <td style={styles.td}>
                        <div style={styles.rankBadge}>#{index + 1}</div>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.cityNameCell}>
                          <span style={styles.cityName}>{city.cityName}</span>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.theaterCount}>{city.totalTheaters}</span>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.capacityText}>{city.totalCapacity} seats</span>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.userCount}>{city.totalUsers}</span>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.bookingCount}>{city.totalBookings}</span>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.revenueText}>₹{city.revenue.toLocaleString()}</span>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.occupancyCell}>
                          <span style={{
                            ...styles.occupancyText,
                            color: city.occupancyRate > 70 ? "#10B981" : 
                                   city.occupancyRate > 40 ? "#F59E0B" : "#EF4444"
                          }}>
                            {city.occupancyRate}%
                          </span>
                          <div style={styles.occupancyBar}>
                            <div 
                              style={{
                                ...styles.occupancyFill,
                                width: `${Math.min(city.occupancyRate, 100)}%`,
                                background: city.occupancyRate > 70 ? "#10B981" : 
                                           city.occupancyRate > 40 ? "#F59E0B" : "#EF4444"
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.avgBookingText}>₹{city.avgBookingValue}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary Footer */}
        <div style={styles.summaryFooter}>
          <div style={styles.summaryItem}>
            <strong>Total Cities:</strong> {overallStats.totalCities}
          </div>
          <div style={styles.summaryItem}>
            <strong>Total Theaters:</strong> {overallStats.totalTheaters}
          </div>
          <div style={styles.summaryItem}>
            <strong>Total Users:</strong> {overallStats.totalUsers}
          </div>
          <div style={styles.summaryItem}>
            <strong>Total Revenue:</strong> ₹{overallStats.totalRevenue.toLocaleString()}
          </div>
          <div style={styles.summaryItem}>
            <strong>Avg Revenue/City:</strong> ₹{overallStats.avgRevenuePerCity}
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
    background: "linear-gradient(135deg, #06B6D4 0%, #67E8F9 100%)",
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
    background: "linear-gradient(135deg, #06B6D4 0%, #67E8F9 100%)",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
    transition: "all 0.2s ease",
    boxShadow: "0 4px 15px rgba(6, 182, 212, 0.3)",
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
    background: "linear-gradient(135deg, #06B6D4 0%, #67E8F9 100%)",
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
  tableHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "24px",
    borderBottom: "1px solid #E5E7EB"
  },
  tableTitle: {
    fontSize: "1.3rem",
    fontWeight: "700",
    color: "#1F2937",
    margin: 0
  },
  tableCount: {
    fontSize: "14px",
    color: "#6B7280",
    fontWeight: "500"
  },
  tableWrapper: {
    overflowX: "auto"
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
    background: "linear-gradient(135deg, #06B6D4 0%, #67E8F9 100%)",
    color: "white",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
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
  rankBadge: {
    background: "linear-gradient(135deg, #06B6D4 0%, #67E8F9 100%)",
    color: "white",
    width: "30px",
    height: "30px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: "700"
  },
  cityNameCell: {
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  cityName: {
    fontWeight: "600",
    color: "#1F2937",
    fontSize: "14px"
  },
  theaterCount: {
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
  userCount: {
    fontWeight: "600",
    color: "#059669",
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
  avgBookingText: {
    fontWeight: "600",
    color: "#8B5CF6",
    fontSize: "14px"
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
    borderTop: "4px solid #06B6D4",
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
    
    .tr:hover {
      background-color: #f9fafb !important;
    }
    
    .stat-card:hover {
      transform: translateY(-2px);
    }
  `;
  document.head.appendChild(style);
}
