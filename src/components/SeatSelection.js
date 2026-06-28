import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { db, auth } from "../firebaseConfig";
import { ref, onValue, set, remove } from "firebase/database";

export default function SeatSelection() {
  const location = useLocation();
  const navigate = useNavigate();
  const { movieTitle, theaterName, time, date, theaterId } = location.state || {};
  const userId = auth.currentUser?.uid;

  const [bookedSeats, setBookedSeats] = useState({});
  const [tempSeats, setTempSeats] = useState({});
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [seatPrices, setSeatPrices] = useState({ premium: 0, gold: 0, silver: 0 });
  const [loading, setLoading] = useState(true);
  const [theaterData, setTheaterData] = useState(null);

  // Fetch seat prices and theater data from Firebase
  useEffect(() => {
    if (!movieTitle || !theaterName || !time || !date) {
      navigate("/");
      return;
    }

    setLoading(true);

    const theaterRef = ref(db, `theaters/${theaterId}`);
    const bookedRef = ref(db, `bookings/${movieTitle}/${theaterName}/${date}/${time}`);
    const tempRef = ref(db, `tempBookedSeats/${movieTitle}/${theaterName}/${date}/${time}`);

    const unsubTheater = onValue(theaterRef, snapshot => {
      if (snapshot.exists()) {
        const theater = snapshot.val();
        setTheaterData(theater);
        
        if (theater.showtimes && theater.showtimes[date]) {
          const moviesOnDate = theater.showtimes[date];
          Object.keys(moviesOnDate).forEach(movieKey => {
            const movieData = moviesOnDate[movieKey];
            if (movieData && movieData.title === movieTitle && movieData.seatPrices) {
              setSeatPrices(movieData.seatPrices);
            }
          });
        }
      }
    });

    const unsubBooked = onValue(bookedRef, snapshot => {
      const data = snapshot.val() || {};
      
      // Extract all booked seats from all bookings for this show
      const allBookedSeats = {};
      Object.values(data).forEach(booking => {
        if (booking.seats && Array.isArray(booking.seats)) {
          booking.seats.forEach(seat => {
            allBookedSeats[seat] = true;
          });
        }
      });
      
      setBookedSeats(allBookedSeats);
      setLoading(false);
    });

    const unsubTemp = onValue(tempRef, snapshot => {
      setTempSeats(snapshot.val() || {});
    });

    const handleCleanup = async () => {
      if (selectedSeats.length > 0 && userId) {
        for (const seatKey of selectedSeats) {
          try {
            await remove(ref(db, `tempBookedSeats/${movieTitle}/${theaterName}/${date}/${time}/${seatKey}`));
          } catch (error) {
            console.log("Error cleaning up seat:", error);
          }
        }
      }
    };

    const handleUnload = () => {
      handleCleanup();
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      unsubTheater();
      unsubBooked();
      unsubTemp();
      handleCleanup();
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [movieTitle, theaterName, time, date, navigate, selectedSeats, theaterId, userId]);

  // Updated seat layout with Silver section first
  const zones = [
    {
      name: "Silver",
      price: seatPrices.silver || 150,
      color: "#45B7D1",
      gradient: "linear-gradient(135deg, #45B7D1 0%, #67C7E6 100%)",
      rows: [
        { label: "A", seats: 12 },
        { label: "B", seats: 12 },
        { label: "C", seats: 12 }
      ]
    },
    {
      name: "Gold",
      price: seatPrices.gold || 250,
      color: "#4ECDC4",
      gradient: "linear-gradient(135deg, #4ECDC4 0%, #67E6DC 100%)",
      rows: [
        { label: "D", seats: 10 },
        { label: "E", seats: 10 },
        { label: "F", seats: 10 },
        { label: "G", seats: 10 }
      ]
    },
    {
      name: "Premium",
      price: seatPrices.premium || 350,
      color: "#FF6B6B",
      gradient: "linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 100%)",
      rows: [
        { label: "H", seats: 8 },
        { label: "I", seats: 8 }
      ]
    }
  ];

  const toggleSeat = async (row, seatNo) => {
    const seatKey = `${row}${seatNo}`;
    const isBooked = bookedSeats[seatKey];
    const isTemp = tempSeats[seatKey] && tempSeats[seatKey].userId !== userId;
    
    if ((isBooked || isTemp) && !selectedSeats.includes(seatKey)) return;

    if (selectedSeats.includes(seatKey)) {
      await remove(ref(db, `tempBookedSeats/${movieTitle}/${theaterName}/${date}/${time}/${seatKey}`));
      setSelectedSeats(prev => prev.filter(s => s !== seatKey));
    } else {
      if (selectedSeats.length >= 6) { 
        alert("Maximum 6 seats allowed per booking."); 
        return; 
      }
      
      if (!userId) {
        alert("Please login to select seats.");
        navigate("/login");
        return;
      }
      
      const tempSeatData = {
        userId: userId,
        timestamp: Date.now(),
        seatKey: seatKey,
        userName: auth.currentUser?.displayName || "User"
      };
      
      await set(ref(db, `tempBookedSeats/${movieTitle}/${theaterName}/${date}/${time}/${seatKey}`), tempSeatData);
      setSelectedSeats(prev => [...prev, seatKey]);
    }
  };

  const getSeatPrice = seatKey => zones.find(zone => zone.rows.some(r => seatKey.startsWith(r.label)))?.price || 0;
  const totalPrice = selectedSeats.reduce((acc, seat) => acc + getSeatPrice(seat), 0);

  const proceedToPayment = () => {
    if (!selectedSeats.length) { 
      alert("Please select at least one seat."); 
      return; 
    }
    if (!auth.currentUser) { 
      alert("Please login to continue."); 
      navigate("/login"); 
      return; 
    }

    navigate("/payment", {
      state: {
        booking: {
          movieTitle,
          theaterName,
          date,
          time,
          seats: selectedSeats,
          totalPrice,
          userName: auth.currentUser?.displayName,
          userId
        },
        tempSeats: selectedSeats
      }
    });
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Loading Cinema Hall...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Navigation Bar */}
      <div style={styles.navbar}>
        <div style={styles.navContent}>
          <button 
            style={styles.backButton}
            onClick={() => navigate(-1)}
          >
            ‹ Back to Shows
          </button>
          <div style={styles.movieDetails}>
            <h1 style={styles.movieTitle}>{movieTitle}</h1>
            <div style={styles.showInfo}>
              <span style={styles.theater}>{theaterName}</span>
              <span style={styles.dot}>•</span>
              <span style={styles.date}>{date}</span>
              <span style={styles.dot}>•</span>
              <span style={styles.time}>{time}</span>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.mainContent}>
        {/* Cinema Hall View */}
        <div style={styles.cinemaHall}>
          {/* Screen with Silver Section Emphasis */}
          <div style={styles.screenArea}>
            <div style={styles.screen}>
              <div style={styles.screenGlow}></div>
              <span style={styles.screenText}>🎬 SCREEN THIS WAY 🎬</span>
              <div style={styles.screenNote}>Silver Section - Best View</div>
            </div>
          </div>

          {/* Seat Layout - Silver First */}
          <div style={styles.hallLayout}>
            {zones.map((zone, index) => (
              <div key={zone.name} style={{
                ...styles.section,
                ...(index === 0 ? styles.silverSection : {}),
                ...(index === 1 ? styles.goldSection : {}),
                ...(index === 2 ? styles.premiumSection : {})
              }}>
                <div style={styles.sectionHeader}>
                  <div style={styles.sectionInfo}>
                    <div style={{...styles.sectionColor, background: zone.gradient}}></div>
                    <div>
                      <h3 style={styles.sectionName}>{zone.name} Section</h3>
                      <p style={styles.sectionPrice}>₹{zone.price} per seat</p>
                    </div>
                  </div>
                  <div style={styles.sectionBadge}>
                    {zone.rows.length} rows
                  </div>
                </div>

                <div style={styles.rowsContainer}>
                  {zone.rows.map(row => (
                    <div key={row.label} style={styles.seatRow}>
                      <div style={styles.rowLabel}>{row.label}</div>
                      <div style={styles.seatsGroup}>
                        {Array.from({ length: row.seats }, (_, i) => {
                          const seatKey = `${row.label}${i + 1}`;
                          const isBooked = bookedSeats[seatKey];
                          const isTemp = tempSeats[seatKey] && tempSeats[seatKey].userId !== userId;
                          const isSelected = selectedSeats.includes(seatKey);
                          
                          return (
                            <div key={seatKey} style={styles.seatWrapper}>
                              <button
                                disabled={isBooked || isTemp}
                                onClick={() => toggleSeat(row.label, i + 1)}
                                style={{
                                  ...styles.seat,
                                  ...(isSelected ? styles.seatSelected : {}),
                                  ...(isBooked ? styles.seatBooked : {}),
                                  ...(isTemp ? styles.seatTemp : {}),
                                  background: (!isBooked && !isTemp && !isSelected) ? zone.gradient : undefined,
                                }}
                                title={`${seatKey} - ${zone.name} Section - ₹${zone.price}`}
                              >
                                {isSelected && <div style={styles.checkmark}>✓</div>}
                                <span style={styles.seatNumber}>{i + 1}</span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Interactive Legend */}
          <div style={styles.legendSection}>
            <h4 style={styles.legendTitle}>Seat Status Guide</h4>
            <div style={styles.legendGrid}>
              <div style={styles.legendItem}>
                <div style={{...styles.legendIcon, background: 'linear-gradient(135deg, #45B7D1 0%, #67C7E6 100%)'}}>
                  <span>1</span>
                </div>
                <span style={styles.legendText}>Available</span>
              </div>
              <div style={styles.legendItem}>
                <div style={{...styles.legendIcon, background: 'linear-gradient(135deg, #FFD93D 0%, #FFC107 100%)'}}>
                  <span>✓</span>
                </div>
                <span style={styles.legendText}>Selected</span>
              </div>
              <div style={styles.legendItem}>
                <div style={{...styles.legendIcon, background: 'linear-gradient(135deg, #6C757D 0%, #5A6268 100%)'}}>
                  <span>✗</span>
                </div>
                <span style={styles.legendText}>Sold</span>
              </div>
              <div style={styles.legendItem}>
                <div style={{...styles.legendIcon, background: 'linear-gradient(135deg, #FFA726 0%, #FF9800 100%)'}}>
                  <span>!</span>
                </div>
                <span style={styles.legendText}>Reserved</span>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Booking Panel */}
        <div style={styles.bookingPanel}>
          <div style={styles.panelHeader}>
            <h2 style={styles.panelTitle}>Your Booking</h2>
            <div style={styles.seatCounter}>
              <span style={styles.counterNumber}>{selectedSeats.length}</span>
              <span style={styles.counterText}>seats</span>
            </div>
          </div>

          <div style={styles.bookingInfo}>
            <div style={styles.infoCard}>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Movie</span>
                <span style={styles.infoValue}>{movieTitle}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Theater</span>
                <span style={styles.infoValue}>{theaterName}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Show Time</span>
                <span style={styles.infoValue}>{date} | {time}</span>
              </div>
            </div>
          </div>

          <div style={styles.selectionArea}>
            <div style={styles.selectionHeader}>
              <h4 style={styles.selectionTitle}>Selected Seats</h4>
              {selectedSeats.length > 0 && (
                <span style={styles.selectionHint}>Tap to remove</span>
              )}
            </div>
            <div style={styles.selectedSeats}>
              {selectedSeats.length > 0 ? (
                <div style={styles.seatsContainer}>
                  {selectedSeats.map(seat => {
                    const zone = zones.find(z => z.rows.some(r => seat.startsWith(r.label)));
                    return (
                      <div 
                        key={seat} 
                        style={styles.selectedSeatItem}
                        onClick={() => toggleSeat(seat[0], parseInt(seat.slice(1)))}
                      >
                        <div style={{...styles.seatTypeDot, background: zone?.color}}></div>
                        <span style={styles.selectedSeatNumber}>{seat}</span>
                        <span style={styles.selectedSeatPrice}>₹{getSeatPrice(seat)}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={styles.emptySelection}>
                  <div style={styles.emptyIcon}>💺</div>
                  <p style={styles.emptyText}>Select your seats to continue</p>
                </div>
              )}
            </div>
          </div>

          <div style={styles.totalArea}>
            <div style={styles.totalLine}>
              <span style={styles.totalLabel}>Total Amount</span>
              <div style={styles.totalAmountContainer}>
                <span style={styles.totalAmount}>₹{totalPrice}</span>
                {selectedSeats.length > 0 && (
                  <span style={styles.totalNote}>Incl. all taxes</span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={proceedToPayment}
            disabled={!selectedSeats.length}
            style={{
              ...styles.paymentButton,
              ...(selectedSeats.length === 0 ? styles.paymentButtonDisabled : {})
            }}
          >
            <span style={styles.paymentText}>
              {selectedSeats.length > 0 ? 'Proceed to Payment' : 'Select Seats First'}
            </span>
            {selectedSeats.length > 0 && (
              <span style={styles.paymentAmount}>₹{totalPrice}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
    color: "#ffffff",
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    background: "#1a1a2e",
  },
  spinner: {
    width: "48px",
    height: "48px",
    border: "4px solid rgba(255,255,255,0.3)",
    borderTop: "4px solid #45B7D1",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    marginBottom: "20px",
  },
  loadingText: {
    fontSize: "18px",
    color: "#a0a0c0",
    fontWeight: "500",
  },
  navbar: {
    background: "rgba(26, 26, 46, 0.95)",
    backdropFilter: "blur(10px)",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
    padding: "16px 0",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  navContent: {
    display: "flex",
    alignItems: "center",
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "0 24px",
  },
  backButton: {
    background: "rgba(255,255,255,0.1)",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: "8px",
    padding: "10px 16px",
    color: "#ffffff",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    marginRight: "32px",
    transition: "all 0.2s ease",
  },
  movieDetails: {
    flex: 1,
  },
  movieTitle: {
    fontSize: "24px",
    fontWeight: "700",
    margin: "0 0 8px 0",
    background: "linear-gradient(135deg, #45B7D1 0%, #4ECDC4 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  showInfo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    fontSize: "14px",
    color: "#a0a0c0",
  },
  dot: {
    color: "#45B7D1",
    fontWeight: "bold",
  },
  mainContent: {
    display: "grid",
    gridTemplateColumns: "1fr 400px",
    gap: "32px",
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "32px 24px",
  },
  cinemaHall: {
    background: "rgba(255,255,255,0.05)",
    borderRadius: "20px",
    padding: "32px",
    border: "1px solid rgba(255,255,255,0.1)",
  },
  screenArea: {
    textAlign: "center",
    marginBottom: "48px",
  },
  screen: {
    position: "relative",
    background: "linear-gradient(135deg, #45B7D1 0%, #4ECDC4 100%)",
    padding: "20px 40px",
    borderRadius: "12px",
    margin: "0 auto",
    maxWidth: "500px",
    boxShadow: "0 10px 30px rgba(69, 183, 209, 0.3)",
  },
  screenGlow: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "80%",
    height: "8px",
    background: "rgba(255,255,255,0.3)",
    borderRadius: "50%",
    filter: "blur(8px)",
  },
  screenText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: "16px",
    letterSpacing: "2px",
    marginBottom: "8px",
  },
  screenNote: {
    fontSize: "12px",
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
  },
  hallLayout: {
    display: "flex",
    flexDirection: "column",
    gap: "32px",
  },
  section: {
    background: "rgba(255,255,255,0.03)",
    borderRadius: "16px",
    padding: "24px",
    border: "1px solid rgba(255,255,255,0.1)",
  },
  silverSection: {
    borderLeft: "4px solid #45B7D1",
    background: "rgba(69, 183, 209, 0.05)",
  },
  goldSection: {
    borderLeft: "4px solid #4ECDC4",
  },
  premiumSection: {
    borderLeft: "4px solid #FF6B6B",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  sectionInfo: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  sectionColor: {
    width: "24px",
    height: "24px",
    borderRadius: "6px",
  },
  sectionName: {
    fontSize: "18px",
    fontWeight: "700",
    margin: "0 0 4px 0",
    color: "#ffffff",
  },
  sectionPrice: {
    fontSize: "14px",
    color: "#a0a0c0",
    margin: 0,
  },
  sectionBadge: {
    background: "rgba(255,255,255,0.1)",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    color: "#a0a0c0",
  },
  rowsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  seatRow: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  rowLabel: {
    width: "32px",
    textAlign: "center",
    fontSize: "14px",
    fontWeight: "700",
    color: "#a0a0c0",
  },
  seatsGroup: {
    display: "flex",
    gap: "6px",
    flex: 1,
    flexWrap: "wrap",
  },
  seatWrapper: {
    position: "relative",
  },
  seat: {
    width: "36px",
    height: "36px",
    borderRadius: "8px",
    border: "none",
    fontWeight: "600",
    fontSize: "11px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#1a1a2e",
    position: "relative",
    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
  },
  seatSelected: {
    background: "linear-gradient(135deg, #FFD93D 0%, #FFC107 100%) !important",
    transform: "scale(1.1)",
    boxShadow: "0 4px 15px rgba(255, 217, 61, 0.4)",
  },
  seatBooked: {
    background: "linear-gradient(135deg, #6C757D 0%, #5A6268 100%) !important",
    cursor: "not-allowed",
    color: "#a0a0c0",
  },
  seatTemp: {
    background: "linear-gradient(135deg, #FFA726 0%, #FF9800 100%) !important",
    cursor: "not-allowed",
    color: "#1a1a2e",
  },
  checkmark: {
    position: "absolute",
    top: "2px",
    right: "2px",
    fontSize: "8px",
    fontWeight: "bold",
  },
  seatNumber: {
    fontSize: "10px",
    fontWeight: "700",
  },
  legendSection: {
    marginTop: "40px",
    padding: "24px",
    background: "rgba(255,255,255,0.05)",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.1)",
  },
  legendTitle: {
    fontSize: "16px",
    fontWeight: "700",
    margin: "0 0 20px 0",
    color: "#ffffff",
    textAlign: "center",
  },
  legendGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "16px",
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  legendIcon: {
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: "bold",
    color: "#1a1a2e",
  },
  legendText: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#a0a0c0",
  },
  bookingPanel: {
    background: "rgba(255,255,255,0.05)",
    borderRadius: "20px",
    padding: "32px",
    border: "1px solid rgba(255,255,255,0.1)",
    height: "fit-content",
    position: "sticky",
    top: "100px",
  },
  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
    paddingBottom: "20px",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
  },
  panelTitle: {
    fontSize: "20px",
    fontWeight: "700",
    margin: 0,
    color: "#ffffff",
  },
  seatCounter: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  counterNumber: {
    fontSize: "24px",
    fontWeight: "800",
    color: "#45B7D1",
  },
  counterText: {
    fontSize: "12px",
    color: "#a0a0c0",
  },
  bookingInfo: {
    marginBottom: "24px",
  },
  infoCard: {
    background: "rgba(255,255,255,0.03)",
    borderRadius: "12px",
    padding: "20px",
    border: "1px solid rgba(255,255,255,0.1)",
  },
  infoItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
    fontSize: "14px",
  },
  infoLabel: {
    color: "#a0a0c0",
    fontWeight: "500",
  },
  infoValue: {
    color: "#ffffff",
    fontWeight: "600",
    textAlign: "right",
  },
  selectionArea: {
    marginBottom: "24px",
  },
  selectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  selectionTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#ffffff",
    margin: 0,
  },
  selectionHint: {
    fontSize: "12px",
    color: "#45B7D1",
  },
  selectedSeats: {
    minHeight: "80px",
  },
  seatsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  selectedSeatItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    background: "rgba(255,255,255,0.05)",
    padding: "12px 16px",
    borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.1)",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  seatTypeDot: {
    width: "12px",
    height: "12px",
    borderRadius: "50%",
  },
  selectedSeatNumber: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#ffffff",
    flex: 1,
  },
  selectedSeatPrice: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#45B7D1",
  },
  emptySelection: {
    textAlign: "center",
    padding: "20px 0",
  },
  emptyIcon: {
    fontSize: "32px",
    marginBottom: "12px",
  },
  emptyText: {
    fontSize: "14px",
    color: "#a0a0c0",
    margin: 0,
  },
  totalArea: {
    padding: "20px 0",
    borderTop: "1px solid rgba(255,255,255,0.1)",
    marginBottom: "24px",
  },
  totalLine: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#ffffff",
  },
  totalAmountContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
  },
  totalAmount: {
    fontSize: "28px",
    fontWeight: "800",
    color: "#45B7D1",
  },
  totalNote: {
    fontSize: "12px",
    color: "#a0a0c0",
  },
  paymentButton: {
    background: "linear-gradient(135deg, #45B7D1 0%, #4ECDC4 100%)",
    border: "none",
    borderRadius: "12px",
    padding: "18px 24px",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "16px",
    width: "100%",
    transition: "all 0.2s ease",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 4px 15px rgba(69, 183, 209, 0.3)",
  },
  paymentButtonDisabled: {
    background: "linear-gradient(135deg, #6C757D 0%, #5A6268 100%)",
    cursor: "not-allowed",
    boxShadow: "none",
  },
  paymentText: {
    fontSize: "16px",
    fontWeight: "700",
  },
  paymentAmount: {
    fontSize: "18px",
    fontWeight: "800",
  },
};