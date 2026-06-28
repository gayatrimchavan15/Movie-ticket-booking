import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import { db } from "../../firebaseConfig";
import { ref, onValue } from "firebase/database";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { useNavigate } from "react-router-dom";

export default function UserReportPage() {
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("all"); // all, week, month
  const [sortConfig, setSortConfig] = useState({ key: 'registrationDate', direction: 'desc' });
  const navigate = useNavigate();

  // Fetch all data from Firebase
  useEffect(() => {
    setLoading(true);
    
    const usersRef = ref(db, "users");
    const bookingsRef = ref(db, "bookings");

    const unsubUsers = onValue(usersRef, (snapshot) => {
      const data = snapshot.val() || {};
      const usersArray = Object.keys(data).map((id) => ({ 
        id, 
        ...data[id],
        registrationDate: data[id].registeredAt || data[id].date || "Unknown",
        lastLogin: data[id].lastLogin || "Never"
      }));
      setUsers(usersArray);
    });

    const unsubBookings = onValue(bookingsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const bookingArray = Object.values(data);
      setBookings(bookingArray);
      setLoading(false);
    });

    return () => {
      unsubUsers();
      unsubBookings();
    };
  }, []);

  // Filter users by time range
  const getFilteredUsers = () => {
    const now = new Date();
    return users.filter(user => {
      if (timeRange === "all") return true;
      
      if (!user.registrationDate || user.registrationDate === "Unknown") return false;
      
      const regDate = new Date(user.registrationDate);
      const diffTime = Math.abs(now - regDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (timeRange === "week") return diffDays <= 7;
      if (timeRange === "month") return diffDays <= 30;
      return true;
    });
  };

  // Calculate user statistics
  const getUserAnalytics = () => {
    const filteredUsers = getFilteredUsers();
    
    const userStats = filteredUsers.map(user => {
      // Find bookings for this user
      const userBookings = bookings.filter(booking => 
        booking.userId === user.id || booking.userEmail === user.email
      );

      // Calculate user activity
      const totalSpent = userBookings.reduce((sum, booking) => 
        sum + (parseFloat(booking.totalPrice) || 0), 0
      );

      const avgBookingValue = userBookings.length > 0 ? 
        (totalSpent / userBookings.length).toFixed(2) : 0;

      // User status based on activity
      let status = "New";
      if (userBookings.length > 5) status = "VIP";
      else if (userBookings.length > 0) status = "Active";
      
      if (userBookings.length === 0) status = "Inactive";

      return {
        ...user,
        totalBookings: userBookings.length,
        totalSpent,
        avgBookingValue: parseFloat(avgBookingValue),
        status,
        lastActivity: userBookings.length > 0 ? 
          userBookings[userBookings.length - 1].bookingDate || "Never" : "Never"
      };
    });

    // Apply sorting
    const sortedUsers = [...userStats].sort((a, b) => {
      if (sortConfig.direction === 'asc') {
        return a[sortConfig.key] > b[sortConfig.key] ? 1 : -1;
      }
      return a[sortConfig.key] < b[sortConfig.key] ? 1 : -1;
    });

    return sortedUsers;
  };

  const userAnalytics = getUserAnalytics();
  const filteredUsers = getFilteredUsers();

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
    totalUsers: users.length,
    activeUsers: userAnalytics.filter(user => user.status === "Active" || user.status === "VIP").length,
    totalBookings: userAnalytics.reduce((sum, user) => sum + user.totalBookings, 0),
    totalRevenue: userAnalytics.reduce((sum, user) => sum + user.totalSpent, 0),
    avgRevenuePerUser: userAnalytics.length > 0 ? 
      (userAnalytics.reduce((sum, user) => sum + user.totalSpent, 0) / userAnalytics.length).toFixed(2) : 0
  };

  // Export functions
  const downloadCSV = () => {
    const header = ["Rank", "User Name", "Email", "Phone", "Status", "Total Bookings", "Total Spent", "Avg Booking Value", "Registration Date", "Last Activity"];
    const rows = userAnalytics.map((user, index) => [
      index + 1,
      user.name || user.fullName || "Unknown",
      user.email || "N/A",
      user.phone || user.mobile || "N/A",
      user.status,
      user.totalBookings,
      `₹${user.totalSpent.toLocaleString()}`,
      `₹${user.avgBookingValue}`,
      user.registrationDate,
      user.lastActivity
    ]);

    let csvContent = "data:text/csv;charset=utf-8," + [header, ...rows].map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `user_analytics_${timeRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.setTextColor(85, 25, 117);
    doc.text("👤 User Analytics Report", 14, 22);
    
    // Summary
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 35);
    doc.text(`Time Range: ${timeRange === "all" ? "All Time" : timeRange === "week" ? "Last 7 Days" : "Last 30 Days"}`, 14, 42);
    doc.text(`Total Users: ${overallStats.totalUsers}`, 14, 49);
    doc.text(`Total Revenue: ₹${overallStats.totalRevenue.toLocaleString()}`, 14, 56);

    // Table
    const tableColumn = ["Rank", "User", "Email", "Status", "Bookings", "Revenue", "Avg/Booking"];
    const tableRows = userAnalytics.map((user, index) => [
      `#${index + 1}`,
      user.name || user.fullName || "Unknown",
      user.email || "N/A",
      user.status,
      user.totalBookings.toString(),
      `₹${user.totalSpent.toLocaleString()}`,
      `₹${user.avgBookingValue}`
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

    doc.save(`user_analytics_${timeRange}.pdf`);
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
        <Sidebar activePath="/admin/userreport" />
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Loading User Analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Sidebar activePath="/admin/userreport" />

      <div style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <button style={styles.backButton} onClick={goBack}>
              ← Back to Reports
            </button>
            <h1 style={styles.title}>👤 User Analytics Report</h1>
            <p style={styles.subtitle}>
              Comprehensive user metrics, engagement, and revenue analytics
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
            <div style={styles.statIcon}>👥</div>
            <div style={styles.statContent}>
              <div style={styles.statNumber}>{overallStats.totalUsers}</div>
              <div style={styles.statLabel}>Total Users</div>
            </div>
          </div>
          
          <div style={styles.statCard}>
            <div style={styles.statIcon}>✅</div>
            <div style={styles.statContent}>
              <div style={styles.statNumber}>{overallStats.activeUsers}</div>
              <div style={styles.statLabel}>Active Users</div>
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
              <div style={styles.statNumber}>{overallStats.avgRevenuePerUser}</div>
              <div style={styles.statLabel}>Avg/User</div>
            </div>
          </div>

        </div>

        {/* User Analytics Table */}
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th} onClick={() => handleSort('name')}>
                  User Name <SortIndicator columnKey="name" />
                </th>
                <th style={styles.th} onClick={() => handleSort('email')}>
                  Email <SortIndicator columnKey="email" />
                </th>
                <th style={styles.th} onClick={() => handleSort('phone')}>
                  Phone <SortIndicator columnKey="phone" />
                </th>
                <th style={styles.th} onClick={() => handleSort('status')}>
                  Status <SortIndicator columnKey="status" />
                </th>
                <th style={styles.th} onClick={() => handleSort('totalBookings')}>
                  Bookings <SortIndicator columnKey="totalBookings" />
                </th>
                <th style={styles.th} onClick={() => handleSort('totalSpent')}>
                  Revenue <SortIndicator columnKey="totalSpent" />
                </th>
                <th style={styles.th} onClick={() => handleSort('avgBookingValue')}>
                  Avg/Booking <SortIndicator columnKey="avgBookingValue" />
                </th>
                <th style={styles.th} onClick={() => handleSort('registrationDate')}>
                  Registered <SortIndicator columnKey="registrationDate" />
                </th>
                <th style={styles.th} onClick={() => handleSort('lastActivity')}>
                  Last Activity <SortIndicator columnKey="lastActivity" />
                </th>
              </tr>
            </thead>
            <tbody>
              {userAnalytics.map((user, index) => (
                <tr key={user.id} style={styles.tr}>
                  <td style={styles.td}>
                    <div style={styles.userNameCell}>
                      <span style={styles.rankBadge}>#{index + 1}</span>
                      {user.name || user.fullName || "Unknown"}
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.emailText}>{user.email || "N/A"}</span>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.phoneText}>{user.phone || user.mobile || "N/A"}</span>
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.statusBadge,
                      background: user.status === "VIP" ? "#FFD700" : 
                                 user.status === "Active" ? "#10B981" :
                                 user.status === "New" ? "#3B82F6" : "#6B7280",
                      color: user.status === "VIP" ? "#000000" : "#FFFFFF"
                    }}>
                      {user.status}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.bookingCount}>{user.totalBookings}</span>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.revenueText}>₹{user.totalSpent.toLocaleString()}</span>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.avgRevenueText}>₹{user.avgBookingValue}</span>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.dateText}>{user.registrationDate}</span>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.activityText}>{user.lastActivity}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {userAnalytics.length === 0 && (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>👥</div>
              <h3 style={styles.emptyTitle}>No User Data Available</h3>
              <p style={styles.emptyText}>
                There are no users or booking data to display analytics for.
              </p>
            </div>
          )}
        </div>

        {/* Summary Footer */}
        <div style={styles.summaryFooter}>
          <div style={styles.summaryItem}>
            <strong>Total Users:</strong> {overallStats.totalUsers}
          </div>
          <div style={styles.summaryItem}>
            <strong>Active Users:</strong> {overallStats.activeUsers}
          </div>
          <div style={styles.summaryItem}>
            <strong>Total Bookings:</strong> {overallStats.totalBookings}
          </div>
          <div style={styles.summaryItem}>
            <strong>Total Revenue:</strong> ₹{overallStats.totalRevenue.toLocaleString()}
          </div>
          <div style={styles.summaryItem}>
            <strong>Avg Revenue/User:</strong> ₹{overallStats.avgRevenuePerUser}
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
    maxWidth: "calc(100vw - 320px)"
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
    overflow: "auto",
    marginBottom: "20px",
    maxWidth: "100%"
  },
  table: {
    width: "100%",
    minWidth: "1200px",
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
  userNameCell: {
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
  emailText: {
    fontWeight: "500",
    color: "#3B82F6",
    fontSize: "14px"
  },
  phoneText: {
    fontWeight: "500",
    color: "#8B5CF6",
    fontSize: "14px"
  },
  statusBadge: {
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "700",
    textAlign: "center",
    display: "inline-block",
    minWidth: "70px"
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
  dateText: {
    fontSize: "13px",
    color: "#6B7280",
    fontWeight: "500"
  },
  activityText: {
    fontSize: "13px",
    color: "#6B7280",
    fontStyle: "italic"
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