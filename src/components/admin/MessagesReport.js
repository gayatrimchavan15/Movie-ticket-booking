// src/components/admin/MessagesReport.js
import React, { useState, useEffect } from "react";
import { db } from "../../firebaseConfig";
import { ref, onValue } from "firebase/database";
import Sidebar from "./Sidebar";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";

export default function MessagesReport() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [filters, setFilters] = useState({
    hasReply: "",
    search: ""
  });
  const [stats, setStats] = useState({
    totalMessages: 0,
    withReplies: 0,
    withoutReplies: 0,
    todayMessages: 0
  });
  const [loading, setLoading] = useState(true);

  // Fetch Messages
  useEffect(() => {
    const messagesRef = ref(db, "messages");
    onValue(messagesRef, (snapshot) => {
      setLoading(true);
      if (snapshot.exists()) {
        const data = snapshot.val();
        const messagesArray = Object.entries(data).map(([id, msg]) => ({
          id,
          email: msg.email || "N/A",
          mobile: msg.mobile || "N/A",
          message: msg.message || "",
          adminReply: msg.adminReply || "",
          timestamp: msg.timestamp || Date.now(),
          date: new Date(msg.timestamp || Date.now()).toLocaleDateString(),
          time: new Date(msg.timestamp || Date.now()).toLocaleTimeString(),
          hasReply: !!msg.adminReply
        }));
        
        // Sort by timestamp (newest first)
        messagesArray.sort((a, b) => b.timestamp - a.timestamp);
        setMessages(messagesArray);
        setFilteredMessages(messagesArray);
      } else {
        setMessages([]);
        setFilteredMessages([]);
      }
      setLoading(false);
    });
  }, []);

  // Update Statistics
  useEffect(() => {
    if (messages.length > 0) {
      const withReplies = messages.filter(msg => msg.hasReply).length;
      const withoutReplies = messages.filter(msg => !msg.hasReply).length;
      const today = new Date().toDateString();
      const todayMessages = messages.filter(msg => 
        new Date(msg.timestamp).toDateString() === today
      ).length;

      setStats({
        totalMessages: messages.length,
        withReplies,
        withoutReplies,
        todayMessages
      });
    }
  }, [messages]);

  // Filter Messages
  useEffect(() => {
    let filtered = [...messages];

    if (filters.hasReply !== "") {
      filtered = filtered.filter(msg => 
        filters.hasReply === "yes" ? msg.hasReply : !msg.hasReply
      );
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(msg =>
        msg.email.toLowerCase().includes(searchLower) ||
        msg.message.toLowerCase().includes(searchLower) ||
        (msg.adminReply && msg.adminReply.toLowerCase().includes(searchLower)) ||
        (msg.mobile && msg.mobile.includes(searchLower))
      );
    }

    setFilteredMessages(filtered);
  }, [filters, messages]);

  // Handlers
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      hasReply: "",
      search: ""
    });
  };

  // Export Functions
  const exportToExcel = () => {
    const worksheetData = filteredMessages.map(msg => ({
      "Email": msg.email,
      "Mobile": msg.mobile,
      "Message": msg.message,
      "Admin Reply": msg.adminReply || "No Reply",
      "Date": msg.date,
      "Time": msg.time,
      "Status": msg.hasReply ? "Replied" : "Pending"
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Messages Report");
    
    const colWidths = [
      { wch: 25 }, { wch: 15 }, { wch: 50 }, 
      { wch: 50 }, { wch: 12 }, { wch: 10 }, { wch: 10 }
    ];
    worksheet['!cols'] = colWidths;

    XLSX.writeFile(workbook, `messages-report-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToCSV = () => {
    const headers = ["Email", "Mobile", "Message", "Admin Reply", "Date", "Time", "Status"];
    const csvData = filteredMessages.map(msg => [
      msg.email,
      msg.mobile,
      `"${msg.message.replace(/"/g, '""')}"`,
      `"${(msg.adminReply || "No Reply").replace(/"/g, '""')}"`,
      msg.date,
      msg.time,
      msg.hasReply ? "Replied" : "Pending"
    ]);

    const csvContent = [headers, ...csvData].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `messages-report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={styles.page}>
      <div style={styles.sidebarContainer}>
        <Sidebar />
      </div>
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
          <h1 style={styles.mainTitle}>📩 Messages Report</h1>
          <p style={styles.subtitle}>Manage and analyze customer inquiries and messages</p>
        </div>

        {/* Statistics Cards */}
        {!loading && (
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={{...styles.statIcon, backgroundColor: "#dbeafe"}}>📨</div>
              <div style={styles.statInfo}>
                <div style={styles.statNumber}>{stats.totalMessages}</div>
                <div style={styles.statLabel}>Total Messages</div>
              </div>
            </div>
            
            <div style={styles.statCard}>
              <div style={{...styles.statIcon, backgroundColor: "#dcfce7"}}>✅</div>
              <div style={styles.statInfo}>
                <div style={styles.statNumber}>{stats.withReplies}</div>
                <div style={styles.statLabel}>Replied</div>
              </div>
            </div>
            
            <div style={styles.statCard}>
              <div style={{...styles.statIcon, backgroundColor: "#fef3c7"}}>⏳</div>
              <div style={styles.statInfo}>
                <div style={styles.statNumber}>{stats.withoutReplies}</div>
                <div style={styles.statLabel}>Pending Reply</div>
              </div>
            </div>
            
            <div style={styles.statCard}>
              <div style={{...styles.statIcon, backgroundColor: "#f3e8ff"}}>📅</div>
              <div style={styles.statInfo}>
                <div style={styles.statNumber}>{stats.todayMessages}</div>
                <div style={styles.statLabel}>Today</div>
              </div>
            </div>
          </div>
        )}

        {/* Filters Section */}
        <div style={styles.section}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>🔍 Filter Messages</h2>
            
            <div style={styles.filterGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Reply Status</label>
                <select
                  value={filters.hasReply}
                  onChange={(e) => handleFilterChange("hasReply", e.target.value)}
                  style={styles.input}
                >
                  <option value="">All Messages</option>
                  <option value="yes">With Reply</option>
                  <option value="no">Without Reply</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Search</label>
                <input
                  type="text"
                  placeholder="Search by email, message, or reply..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
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

        {/* Messages Table */}
        <div style={styles.section}>
          <div style={styles.card}>
            <div style={styles.reportHeader}>
              <h2 style={styles.cardTitle}>📋 Messages Report</h2>
              <div style={styles.resultsInfo}>
                Showing {filteredMessages.length} message{filteredMessages.length !== 1 ? 's' : ''}
              </div>
            </div>

            {loading ? (
              <div style={styles.loadingState}>
                <div style={styles.loadingSpinner}></div>
                <p>Loading messages data...</p>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>📭</div>
                <h3 style={styles.emptyTitle}>No Messages Found</h3>
                <p style={styles.emptyText}>
                  {filters.hasReply || filters.search 
                    ? "Try adjusting your filters to see more results." 
                    : "No messages data available."}
                </p>
              </div>
            ) : (
              <div style={styles.tableContainer}>
                <div style={styles.tableWrapper}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Email</th>
                        <th style={styles.th}>Mobile</th>
                        <th style={styles.th}>Message</th>
                        <th style={styles.th}>Admin Reply</th>
                        <th style={styles.th}>Date</th>
                        <th style={styles.th}>Time</th>
                        <th style={styles.th}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMessages.map((msg, index) => (
                        <tr key={msg.id} style={index % 2 === 0 ? styles.evenRow : styles.oddRow}>
                          <td style={styles.td}>
                            <span style={styles.emailText}>{msg.email}</span>
                          </td>
                          <td style={styles.td}>
                            <span style={styles.mobileBadge}>{msg.mobile}</span>
                          </td>
                          <td style={styles.td}>
                            <div style={styles.messageCell}>
                              {msg.message}
                            </div>
                          </td>
                          <td style={styles.td}>
                            <div style={styles.replyCell}>
                              {msg.adminReply || (
                                <span style={styles.noReplyText}>No reply yet</span>
                              )}
                            </div>
                          </td>
                          <td style={styles.td}>
                            <span style={styles.dateBadge}>{msg.date}</span>
                          </td>
                          <td style={styles.td}>
                            <span style={styles.timeBadge}>{msg.time}</span>
                          </td>
                          <td style={styles.td}>
                            <span style={{
                              ...styles.statusBadge,
                              ...(msg.hasReply ? styles.statusReplied : styles.statusPending)
                            }}>
                              {msg.hasReply ? "✅ Replied" : "⏳ Pending"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div style={styles.tableFooter}>
                  <div style={styles.tableSummary}>
                    Displaying {filteredMessages.length} message{filteredMessages.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Styles
const styles = {
  page: { 
    display: "flex", 
    backgroundColor: "#f8fafc", 
    minHeight: "100vh",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
  },
  sidebarContainer: {
    width: "260px",
    flexShrink: 0
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
  mainTitle: {
    fontSize: "2.5rem",
    fontWeight: "800",
    color: "#1e293b",
    margin: "0 0 8px 0",
    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
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
    borderRadius: "12px"
  },
  statInfo: {
    flex: 1
  },
  statNumber: {
    fontSize: "2rem",
    fontWeight: "700",
    color: "#6366f1",
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
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
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
    backgroundColor: "#6366f1",
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
  emailText: {
    fontWeight: "500",
    color: "#1e293b"
  },
  mobileBadge: {
    backgroundColor: "#f3e8ff",
    color: "#7c3aed",
    padding: "6px 12px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "500",
    whiteSpace: "nowrap"
  },
  messageCell: {
    maxWidth: "300px",
    lineHeight: "1.4",
    color: "#374151"
  },
  replyCell: {
    maxWidth: "300px",
    lineHeight: "1.4",
    color: "#059669",
    fontStyle: "italic"
  },
  noReplyText: {
    color: "#ef4444",
    fontStyle: "italic"
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
  timeBadge: {
    backgroundColor: "#e0f2fe",
    color: "#0369a1",
    padding: "6px 12px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "500",
    whiteSpace: "nowrap"
  },
  statusBadge: {
    padding: "6px 12px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "600",
    whiteSpace: "nowrap"
  },
  statusReplied: {
    backgroundColor: "#dcfce7",
    color: "#166534"
  },
  statusPending: {
    backgroundColor: "#fef3c7",
    color: "#92400e"
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