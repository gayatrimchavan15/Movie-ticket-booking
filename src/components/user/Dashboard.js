import React, { useEffect, useState } from "react";
import { db, auth } from "../../firebaseConfig";
import { ref, onValue } from "firebase/database";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function Dashboard() {
  const [userData, setUserData] = useState({});
  const [bookings, setBookings] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // Fetch user info
    const userRef = ref(db, `users/${user.uid}`);
    onValue(userRef, (snapshot) => {
      if (snapshot.exists()) setUserData(snapshot.val());
    });

    // Fetch user bookings
    const bookingsRef = ref(db, "bookings");
    onValue(bookingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const allBookings = Object.values(data).filter(b => b.userId === user.uid);
        setBookings(allBookings);

        // Prepare chart data
        const movieCount = {};
        allBookings.forEach(b => {
          movieCount[b.movieTitle] = (movieCount[b.movieTitle] || 0) + 1;
        });
        const chartArr = Object.keys(movieCount).map(title => ({
          movie: title,
          bookings: movieCount[title],
        }));
        setChartData(chartArr);
      } else {
        setBookings([]);
        setChartData([]);
      }
    });
  }, []);

  const totalSeats = bookings.reduce((acc, b) => acc + (b.seats?.length || 0), 0);
  const totalSpent = bookings.reduce((acc, b) => acc + (b.totalPrice || 0), 0);

  // Function to view ticket details
  const viewTicketDetails = (booking) => {
    setSelectedBooking(booking);
    setShowTicketModal(true);
  };

  // Function to download ticket
  const downloadTicket = (booking) => {
    const ticketContent = `
      <div style="font-family: Arial; padding: 20px;">
        <h2 style="color: #2a3d66;">🎬 Movie Ticket</h2>
        <p><b>Name:</b> ${booking.userName}</p>
        <p><b>Email:</b> ${booking.userEmail || "N/A"}</p>
        <p><b>Mobile:</b> ${booking.userMobile || "N/A"}</p>
        <p><b>Movie:</b> ${booking.movieTitle}</p>
        <p><b>Theater:</b> ${booking.theaterName}</p>
        <p><b>Showtime:</b> ${booking.showtime}</p>
        <p><b>Seats:</b> ${booking.seats?.join(", ")}</p>
        <p><b>Total Paid:</b> ₹${booking.totalPrice}</p>
        <p><b>Payment ID:</b> ${booking.paymentId}</p>
      </div>
    `;

    // Create a hidden div
    const div = document.createElement("div");
    div.innerHTML = ticketContent;
    div.style.position = "absolute";
    div.style.left = "-9999px";
    document.body.appendChild(div);

    html2canvas(div).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF();
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Ticket_${booking.movieTitle}_${booking.paymentId}.pdf`);
      document.body.removeChild(div);
    });
  };

  // Ticket Modal Component
  const TicketModal = ({ booking, onClose, onDownload }) => {
    if (!booking) return null;

    return (
      <div style={styles.modalOverlay}>
        <div style={styles.modalContent}>
          <div style={styles.modalHeader}>
            <h2 style={styles.modalTitle}>🎬 Booking Receipt</h2>
            <button style={styles.closeButton} onClick={onClose}>×</button>
          </div>
          
          <div style={styles.ticketContainer}>
            <div style={styles.ticketHeader}>
              <h3 style={styles.movieTitle}>{booking.movieTitle}</h3>
              <div style={styles.statusBadge}>Confirmed</div>
            </div>
            
            <div style={styles.ticketDetails}>
              <div style={styles.detailRow}>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Name</span>
                  <span style={styles.detailValue}>{booking.userName}</span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Email</span>
                  <span style={styles.detailValue}>{booking.userEmail || "N/A"}</span>
                </div>
              </div>
              
              <div style={styles.detailRow}>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Mobile</span>
                  <span style={styles.detailValue}>{booking.userMobile || "N/A"}</span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Theater</span>
                  <span style={styles.detailValue}>{booking.theaterName}</span>
                </div>
              </div>
              
              <div style={styles.detailRow}>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Showtime</span>
                  <span style={styles.detailValue}>{booking.showtime}</span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Seats</span>
                  <span style={styles.seatsValue}>{booking.seats?.join(", ")}</span>
                </div>
              </div>
              
              <div style={styles.detailRow}>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Total Price</span>
                  <span style={styles.priceValue}>₹{booking.totalPrice}</span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Payment ID</span>
                  <span style={styles.detailValue}>{booking.paymentId}</span>
                </div>
              </div>
            </div>
            
            <div style={styles.ticketFooter}>
              <div style={styles.barcodePlaceholder}>
                <span style={styles.barcodeText}>🎟️ TICKET 🎟️</span>
              </div>
              <p style={styles.footerNote}>Please arrive at least 30 minutes before the show</p>
            </div>
          </div>
          
          <div style={styles.modalActions}>
            <button 
              style={styles.secondaryButton}
              onClick={onClose}
            >
              Close
            </button>
            <button 
              style={styles.primaryButton}
              onClick={() => onDownload(booking)}
            >
              Download Ticket PDF
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      {/* Welcome Card */}
      <div style={styles.welcomeCard}>
        <div style={styles.welcomeContent}>
          <div style={styles.welcomeText}>
            <h2 style={styles.welcomeTitle}>Welcome back, {userData.name || "User"}! 🎉</h2>
            <p style={styles.welcomeSubtitle}>Here's your booking summary</p>
          </div>
          <div style={styles.avatar}>
            {userData.name ? userData.name.charAt(0).toUpperCase() : "U"}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={styles.statsContainer}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>🎫</div>
          <div style={styles.statContent}>
            <h3 style={styles.statNumber}>{bookings.length}</h3>
            <p style={styles.statLabel}>Total Bookings</p>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>💺</div>
          <div style={styles.statContent}>
            <h3 style={styles.statNumber}>{totalSeats}</h3>
            <p style={styles.statLabel}>Seats Booked</p>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>💰</div>
          <div style={styles.statContent}>
            <h3 style={styles.statNumber}>₹{totalSpent}</h3>
            <p style={styles.statLabel}>Total Spent</p>
          </div>
        </div>
      </div>

      {/* Bookings Bar Chart */}
      <div style={styles.chartContainer}>
        <h3 style={styles.sectionTitle}>Your Movie Preferences</h3>
        <p style={styles.sectionSubtitle}>Bookings distribution across movies</p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="movie" tick={{ fill: '#666' }} />
            <YAxis tick={{ fill: '#666' }} />
            <Tooltip 
              cursor={{ fill: 'rgba(76, 175, 80, 0.1)' }}
              contentStyle={styles.tooltip}
            />
            <Bar 
              dataKey="bookings" 
              fill="#4CAF50" 
              radius={[4, 4, 0, 0]}
              name="Number of Bookings"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Booking Details Table */}
      <div style={styles.tableContainer}>
        <h3 style={styles.sectionTitle}>Booking History</h3>
        <p style={styles.sectionSubtitle}>Your recent movie bookings</p>
        
        {bookings.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>🎬</div>
            <h4 style={styles.emptyTitle}>No bookings yet</h4>
            <p style={styles.emptyText}>Your booking history will appear here once you book your first movie.</p>
          </div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Movie</th>
                  <th style={styles.th}>Theater</th>
                  <th style={styles.th}>Showtime</th>
                  <th style={styles.th}>Seats</th>
                  <th style={styles.th}>Price</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking, index) => (
                  <tr key={index} style={styles.tr}>
                    <td style={styles.td}>
                      <div style={styles.movieCell}>
                        <span style={styles.movieName}>{booking.movieTitle}</span>
                      </div>
                    </td>
                    <td style={styles.td}>{booking.theaterName}</td>
                    <td style={styles.td}>{booking.showtime}</td>
                    <td style={styles.td}>
                      <span style={styles.seatsBadge}>
                        {booking.seats?.join(", ") || ""}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.priceTag}>₹{booking.totalPrice}</span>
                    </td>
                    <td style={styles.td}>
                      <button
                        onClick={() => viewTicketDetails(booking)}
                        style={styles.viewButton}
                      >
                        View Ticket
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ticket Modal */}
      {showTicketModal && (
        <TicketModal
          booking={selectedBooking}
          onClose={() => setShowTicketModal(false)}
          onDownload={(booking) => {
            downloadTicket(booking);
            setShowTicketModal(false);
          }}
        />
      )}
    </div>
  );
}

// Enhanced Inline styles
const styles = {
  container: { 
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", 
    padding: "30px", 
    maxWidth: "1200px", 
    margin: "0 auto",
    backgroundColor: "#f8fafc",
    minHeight: "100vh"
  },
  
  // Welcome Card
  welcomeCard: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#fff", 
    padding: "30px", 
    borderRadius: "20px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.15)", 
    marginBottom: "30px",
    position: "relative",
    overflow: "hidden"
  },
  welcomeContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  welcomeText: {
    flex: 1
  },
  welcomeTitle: {
    fontSize: "2rem",
    margin: "0 0 8px 0",
    fontWeight: "700"
  },
  welcomeSubtitle: {
    fontSize: "1.1rem",
    margin: "0",
    opacity: "0.9"
  },
  avatar: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    backgroundColor: "rgba(255,255,255,0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "2rem",
    fontWeight: "bold",
    backdropFilter: "blur(10px)"
  },
  
  // Stats Cards
  statsContainer: { 
    display: "flex", 
    gap: "20px", 
    justifyContent: "center", 
    marginBottom: "30px",
    flexWrap: "wrap"
  },
  statCard: {
    backgroundColor: "#fff", 
    flex: "1", 
    minWidth: "200px",
    padding: "25px", 
    borderRadius: "16px",
    boxShadow: "0 6px 20px rgba(0,0,0,0.08)", 
    display: "flex",
    alignItems: "center",
    gap: "15px",
    transition: "transform 0.3s ease, box-shadow 0.3s ease"
  },
  statCardHover: {
    transform: "translateY(-5px)",
    boxShadow: "0 12px 25px rgba(0,0,0,0.15)"
  },
  statIcon: {
    fontSize: "2.5rem",
    width: "60px",
    height: "60px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0f7ff"
  },
  statContent: {
    flex: 1
  },
  statNumber: {
    fontSize: "2rem",
    margin: "0",
    color: "#2a3d66",
    fontWeight: "700"
  },
  statLabel: {
    margin: "5px 0 0 0",
    color: "#666",
    fontSize: "0.9rem",
    fontWeight: "500"
  },
  
  // Chart Container
  chartContainer: {
    backgroundColor: "#fff", 
    padding: "30px", 
    borderRadius: "16px",
    boxShadow: "0 6px 20px rgba(0,0,0,0.08)", 
    marginBottom: "30px"
  },
  sectionTitle: {
    fontSize: "1.5rem",
    fontWeight: "600",
    color: "#2a3d66",
    margin: "0 0 8px 0"
  },
  sectionSubtitle: {
    color: "#666",
    margin: "0 0 20px 0",
    fontSize: "0.95rem"
  },
  tooltip: {
    backgroundColor: "#fff",
    border: "none",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    padding: "12px"
  },
  
  // Table Container
  tableContainer: {
    backgroundColor: "#fff", 
    padding: "30px", 
    borderRadius: "16px",
    boxShadow: "0 6px 20px rgba(0,0,0,0.08)"
  },
  tableWrapper: {
    overflowX: "auto",
    borderRadius: "12px",
    border: "1px solid #f0f0f0"
  },
  table: { 
    width: "100%", 
    borderCollapse: "collapse",
    minWidth: "800px"
  },
  th: { 
    padding: "16px 12px", 
    backgroundColor: "#f8fafc", 
    color: "#2a3d66", 
    textAlign: "left",
    fontWeight: "600",
    fontSize: "0.9rem",
    borderBottom: "2px solid #e2e8f0"
  },
  tr: {
    transition: "background-color 0.2s ease"
  },
  td: { 
    padding: "16px 12px", 
    borderBottom: "1px solid #f1f5f9", 
    color: "#475569",
    fontSize: "0.9rem"
  },
  
  // Table Cell Styles
  movieCell: {
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  movieName: {
    fontWeight: "500",
    color: "#2a3d66"
  },
  seatsBadge: {
    backgroundColor: "#f0f7ff",
    color: "#1e40af",
    padding: "4px 8px",
    borderRadius: "6px",
    fontSize: "0.8rem",
    fontWeight: "500"
  },
  priceTag: {
    fontWeight: "600",
    color: "#059669"
  },
  
  // Buttons
  viewButton: {
    padding: "8px 16px",
    backgroundColor: "#3b82f6",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: "500",
    transition: "all 0.2s ease"
  },
  
  // Empty State
  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
    color: "#64748b"
  },
  emptyIcon: {
    fontSize: "4rem",
    marginBottom: "20px"
  },
  emptyTitle: {
    fontSize: "1.5rem",
    margin: "0 0 10px 0",
    color: "#475569"
  },
  emptyText: {
    fontSize: "1rem",
    margin: "0",
    maxWidth: "400px",
    margin: "0 auto"
  },
  
  // Modal Styles
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "20px"
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: "20px",
    width: "100%",
    maxWidth: "500px",
    maxHeight: "90vh",
    overflow: "auto",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)"
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "25px 30px 0 30px",
    borderBottom: "1px solid #f1f5f9"
  },
  modalTitle: {
    margin: "0",
    color: "#2a3d66",
    fontSize: "1.5rem"
  },
  closeButton: {
    background: "none",
    border: "none",
    fontSize: "2rem",
    cursor: "pointer",
    color: "#64748b",
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background-color 0.2s ease"
  },
  
  // Ticket Styles
  ticketContainer: {
    padding: "30px"
  },
  ticketHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "25px"
  },
  movieTitle: {
    margin: "0",
    fontSize: "1.4rem",
    color: "#2a3d66",
    fontWeight: "600"
  },
  statusBadge: {
    backgroundColor: "#10b981",
    color: "white",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "0.8rem",
    fontWeight: "600"
  },
  ticketDetails: {
    marginBottom: "25px"
  },
  detailRow: {
    display: "flex",
    gap: "20px",
    marginBottom: "20px"
  },
  detailItem: {
    flex: 1
  },
  detailLabel: {
    display: "block",
    fontSize: "0.8rem",
    color: "#64748b",
    marginBottom: "4px",
    fontWeight: "500"
  },
  detailValue: {
    display: "block",
    fontSize: "1rem",
    color: "#2a3d66",
    fontWeight: "500"
  },
  seatsValue: {
    display: "block",
    fontSize: "1rem",
    color: "#3b82f6",
    fontWeight: "600"
  },
  priceValue: {
    display: "block",
    fontSize: "1.2rem",
    color: "#059669",
    fontWeight: "700"
  },
  ticketFooter: {
    borderTop: "2px dashed #e2e8f0",
    paddingTop: "20px",
    textAlign: "center"
  },
  barcodePlaceholder: {
    backgroundColor: "#f8fafc",
    padding: "15px",
    borderRadius: "8px",
    marginBottom: "15px"
  },
  barcodeText: {
    color: "#64748b",
    fontWeight: "600",
    letterSpacing: "2px"
  },
  footerNote: {
    fontSize: "0.8rem",
    color: "#64748b",
    margin: "0",
    fontStyle: "italic"
  },
  
  // Modal Actions
  modalActions: {
    display: "flex",
    gap: "12px",
    padding: "0 30px 30px 30px",
    justifyContent: "flex-end"
  },
  primaryButton: {
    padding: "12px 24px",
    backgroundColor: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "0.9rem",
    transition: "all 0.2s ease"
  },
  secondaryButton: {
    padding: "12px 24px",
    backgroundColor: "#f1f5f9",
    color: "#475569",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "0.9rem",
    transition: "all 0.2s ease"
  }
};