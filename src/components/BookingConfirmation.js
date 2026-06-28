import React, { useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function BookingConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { booking } = location.state || {};
  const ticketRef = useRef();

  if (!booking) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorContent}>
          <div style={styles.errorIcon}>❌</div>
          <h2 style={styles.errorTitle}>No Booking Details Found</h2>
          <p style={styles.errorText}>
            It seems there was an issue retrieving your booking information.
          </p>
          <button 
            style={styles.errorButton}
            onClick={() => navigate("/movies")}
          >
            Browse Movies
          </button>
        </div>
      </div>
    );
  }

  const downloadTicket = () => {
    const ticketElement = ticketRef.current;
    html2canvas(ticketElement, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#0f172a"
    }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png", 1.0);
      const pdf = new jsPDF("p", "mm", "a4");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`MovieTicket_${booking.movieTitle}_${booking.paymentId}.pdf`);
    });
  };

  const formatShowtime = (showtime) => {
    return showtime.replace(/(\d{1,2}):(\d{2})/, (match, hour, minute) => {
      const hours = parseInt(hour);
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHour = hours % 12 || 12;
      return `${displayHour}:${minute} ${ampm}`;
    });
  };

  return (
    <div style={styles.page}>
      {/* Animated Background */}
      <div style={styles.backgroundAnimation}></div>
      
      {/* Main Content */}
      <div style={styles.container}>
        {/* Success Header */}
        <div style={styles.successHeader}>
          <div style={styles.successIcon}>🎉</div>
          <h1 style={styles.successTitle}>Booking Confirmed!</h1>
          <p style={styles.successSubtitle}>
            Your movie experience is all set, <span style={styles.userName}>{booking.userName}</span>
          </p>
        </div>

        {/* Ticket Section */}
        <div style={styles.ticketSection}>
          <div ref={ticketRef} style={styles.ticketContainer}>
            {/* Ticket Header */}
            <div style={styles.ticketHeader}>
              <div style={styles.moviePoster}>
                <div style={styles.posterPlaceholder}>🎬</div>
              </div>
              <div style={styles.movieInfo}>
                <h2 style={styles.movieTitle}>{booking.movieTitle}</h2>
                <div style={styles.movieDetails}>
                  <span style={styles.theaterName}>{booking.theaterName}</span>
                  <span style={styles.showtime}>{formatShowtime(booking.showtime)}</span>
                </div>
                <div style={styles.statusBadge}>
                  <span style={styles.statusDot}>●</span>
                  Confirmed
                </div>
              </div>
            </div>

            {/* Ticket Body */}
            <div style={styles.ticketBody}>
              <div style={styles.detailsGrid}>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Booking ID</span>
                  <span style={styles.detailValue}>{booking.paymentId}</span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Date & Time</span>
                  <span style={styles.detailValue}>
                    {new Date(booking.timestamp || Date.now()).toLocaleString()}
                  </span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Seats</span>
                  <span style={styles.seatsValue}>
                    {booking.seats.join(", ")}
                  </span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Total Amount</span>
                  <span style={styles.priceValue}>₹{booking.totalPrice}</span>
                </div>
              </div>

              {/* Customer Info */}
              <div style={styles.customerSection}>
                <h4 style={styles.sectionTitle}>Customer Information</h4>
                <div style={styles.customerGrid}>
                  <div style={styles.customerItem}>
                    <span style={styles.customerLabel}>Name</span>
                    <span style={styles.customerValue}>{booking.userName}</span>
                  </div>
                  <div style={styles.customerItem}>
                    <span style={styles.customerLabel}>Email</span>
                    <span style={styles.customerValue}>{booking.userEmail || "N/A"}</span>
                  </div>
                  <div style={styles.customerItem}>
                    <span style={styles.customerLabel}>Mobile</span>
                    <span style={styles.customerValue}>{booking.userMobile || "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* Barcode Section */}
              <div style={styles.barcodeSection}>
                <div style={styles.barcode}>
                  <div style={styles.barcodeLines}>
                    {[...Array(20)].map((_, i) => (
                      <div 
                        key={i} 
                        style={{
                          ...styles.barcodeLine,
                          height: `${20 + Math.random() * 30}px`
                        }}
                      />
                    ))}
                  </div>
                </div>
                <p style={styles.barcodeText}>{booking.paymentId}</p>
              </div>
            </div>

            {/* Ticket Footer */}
            <div style={styles.ticketFooter}>
              <div style={styles.footerNote}>
                <span style={styles.footerIcon}>🎟️</span>
                Please arrive 30 minutes before showtime
              </div>
              <div style={styles.terms}>
                * Ticket is non-refundable and non-transferable
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={styles.actionSection}>
          <button 
            style={styles.primaryButton}
            onClick={downloadTicket}
          >
            <span style={styles.buttonIcon}>📥</span>
            Download Ticket PDF
          </button>
          <button 
            style={styles.secondaryButton}
            onClick={() => navigate("/movies")}
          >
            <span style={styles.buttonIcon}>🎬</span>
            Book More Movies
          </button>
          <button 
            style={styles.tertiaryButton}
            onClick={() => navigate("/dashboard")}
          >
            <span style={styles.buttonIcon}>📊</span>
            View Dashboard
          </button>
        </div>

        {/* Help Section */}
        <div style={styles.helpSection}>
          <h4 style={styles.helpTitle}>Need Help?</h4>
          <p style={styles.helpText}>
            Contact our support team at support@moviebook.com or call +91-9876543210
          </p>
        </div>
      </div>
    </div>
  );
}

// Enhanced Styles
const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)",
    fontFamily: "'Inter', 'Segoe UI', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
    position: "relative",
    overflow: "hidden",
  },
  
  backgroundAnimation: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `
      radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.05) 0%, transparent 50%)
    `,
  },
  
  container: {
    position: "relative",
    zIndex: 1,
    maxWidth: "800px",
    margin: "0 auto",
    padding: "40px 20px",
  },
  
  // Success Header
  successHeader: {
    textAlign: "center",
    marginBottom: "50px",
  },
  successIcon: {
    fontSize: "4rem",
    marginBottom: "20px",
  },
  successTitle: {
    fontSize: "3rem",
    fontWeight: "800",
    background: "linear-gradient(135deg, #10b981 0%, #3b82f6 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    margin: "0 0 15px 0",
  },
  successSubtitle: {
    fontSize: "1.2rem",
    color: "#cbd5e1",
    margin: 0,
  },
  userName: {
    color: "#fbbf24",
    fontWeight: "600",
  },
  
  // Ticket Section
  ticketSection: {
    marginBottom: "40px",
  },
  ticketContainer: {
    background: "linear-gradient(145deg, #1e293b 0%, #0f172a 100%)",
    borderRadius: "24px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    boxShadow: `
      0 25px 50px -12px rgba(0, 0, 0, 0.5),
      inset 0 1px 0 rgba(255, 255, 255, 0.1)
    `,
    overflow: "hidden",
    position: "relative",
  },
  
  // Ticket Header
  ticketHeader: {
    padding: "30px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
    display: "flex",
    alignItems: "center",
    gap: "20px",
    background: "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)",
  },
  moviePoster: {
    flexShrink: 0,
  },
  posterPlaceholder: {
    width: "80px",
    height: "100px",
    background: "linear-gradient(135deg, #3b82f6 0%, #10b981 100%)",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "2rem",
    color: "white",
  },
  movieInfo: {
    flex: 1,
  },
  movieTitle: {
    fontSize: "1.8rem",
    fontWeight: "700",
    color: "#f8fafc",
    margin: "0 0 10px 0",
  },
  movieDetails: {
    display: "flex",
    gap: "20px",
    marginBottom: "15px",
  },
  theaterName: {
    color: "#cbd5e1",
    fontSize: "1rem",
  },
  showtime: {
    color: "#fbbf24",
    fontSize: "1rem",
    fontWeight: "600",
  },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "rgba(16, 185, 129, 0.2)",
    color: "#10b981",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "0.85rem",
    fontWeight: "600",
  },
  statusDot: {
    fontSize: "0.6rem",
  },
  
  // Ticket Body
  ticketBody: {
    padding: "30px",
  },
  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
    marginBottom: "30px",
  },
  detailItem: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },
  detailLabel: {
    fontSize: "0.85rem",
    color: "#94a3b8",
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  detailValue: {
    fontSize: "1rem",
    color: "#e2e8f0",
    fontWeight: "600",
  },
  seatsValue: {
    fontSize: "1.1rem",
    color: "#3b82f6",
    fontWeight: "700",
  },
  priceValue: {
    fontSize: "1.3rem",
    color: "#10b981",
    fontWeight: "800",
  },
  
  // Customer Section
  customerSection: {
    marginBottom: "30px",
  },
  sectionTitle: {
    fontSize: "1.1rem",
    color: "#f8fafc",
    margin: "0 0 15px 0",
    fontWeight: "600",
  },
  customerGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "15px",
  },
  customerItem: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },
  customerLabel: {
    fontSize: "0.85rem",
    color: "#94a3b8",
    fontWeight: "500",
  },
  customerValue: {
    fontSize: "1rem",
    color: "#e2e8f0",
    fontWeight: "600",
  },
  
  // Barcode Section
  barcodeSection: {
    textAlign: "center",
    padding: "20px",
    background: "rgba(255, 255, 255, 0.05)",
    borderRadius: "12px",
  },
  barcode: {
    marginBottom: "10px",
  },
  barcodeLines: {
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-end",
    gap: "2px",
    height: "50px",
  },
  barcodeLine: {
    width: "3px",
    background: "#e2e8f0",
    borderRadius: "1px",
  },
  barcodeText: {
    color: "#94a3b8",
    fontSize: "0.8rem",
    letterSpacing: "2px",
    fontWeight: "600",
  },
  
  // Ticket Footer
  ticketFooter: {
    padding: "20px 30px",
    background: "rgba(0, 0, 0, 0.3)",
    borderTop: "1px solid rgba(255, 255, 255, 0.1)",
  },
  footerNote: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    color: "#fbbf24",
    fontSize: "0.9rem",
    fontWeight: "600",
    marginBottom: "8px",
  },
  footerIcon: {
    fontSize: "1.1rem",
  },
  terms: {
    textAlign: "center",
    color: "#64748b",
    fontSize: "0.75rem",
    fontStyle: "italic",
  },
  
  // Action Section
  actionSection: {
    display: "flex",
    gap: "15px",
    justifyContent: "center",
    marginBottom: "40px",
    flexWrap: "wrap",
  },
  primaryButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "15px 25px",
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: "600",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 15px rgba(16, 185, 129, 0.3)",
  },
  secondaryButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "15px 25px",
    background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: "600",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 15px rgba(59, 130, 246, 0.3)",
  },
  tertiaryButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "15px 25px",
    background: "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: "600",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 15px rgba(107, 114, 128, 0.3)",
  },
  buttonIcon: {
    fontSize: "1.1rem",
  },
  
  // Help Section
  helpSection: {
    textAlign: "center",
    padding: "20px",
    background: "rgba(255, 255, 255, 0.05)",
    borderRadius: "12px",
  },
  helpTitle: {
    color: "#f8fafc",
    fontSize: "1.1rem",
    margin: "0 0 10px 0",
    fontWeight: "600",
  },
  helpText: {
    color: "#94a3b8",
    fontSize: "0.9rem",
    margin: 0,
  },
  
  // Error State
  errorContainer: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Inter', sans-serif",
  },
  errorContent: {
    textAlign: "center",
    color: "white",
  },
  errorIcon: {
    fontSize: "4rem",
    marginBottom: "20px",
  },
  errorTitle: {
    fontSize: "2rem",
    margin: "0 0 15px 0",
    color: "#f8fafc",
  },
  errorText: {
    fontSize: "1.1rem",
    color: "#94a3b8",
    margin: "0 0 25px 0",
  },
  errorButton: {
    padding: "12px 24px",
    background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: "600",
  },
};