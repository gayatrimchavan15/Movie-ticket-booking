import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { db, auth } from "../firebaseConfig";
import { ref, push, set, get, remove, update } from "firebase/database";
import { useRazorpay } from "react-razorpay";

export default function PaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { booking, tempSeats } = location.state || {};
  const [userData, setUserData] = useState(null);
  const { Razorpay, isLoading, error } = useRazorpay();

  const showtime = booking?.showtime || booking?.time;

  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser) {
        const userRef = ref(db, "users/" + auth.currentUser.uid);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          setUserData(snapshot.val());
        }
      }
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  if (!booking) {
    return <h2 style={{ textAlign: "center", marginTop: "40px" }}>No booking found. Please go back.</h2>;
  }

  async function cancelTransaction() {
    if (!tempSeats || !showtime) return;
    for (const seatKey of tempSeats) {
      await remove(
        ref(
          db,
          `tempBookedSeats/${booking.movieTitle}/${booking.theaterName}/${booking.date}/${showtime}/${seatKey}`
        )
      );
    }
    navigate(-1);
  }

  async function handlePayment() {
    if (!Razorpay) {
      alert("Payment gateway is still loading. Please wait.");
      return;
    }

    const amount = booking.totalPrice * 100;

    const options = {
      key: "rzp_test_RO6JJ2D83eibRo",
      amount: amount,
      currency: "INR",
      name: "Movie Ticket Booking",
      description: `${booking.movieTitle} at ${booking.theaterName}`,
      handler: async (response) => {
        try {
          // 1. First, create the booking record
          const bookingsRef = ref(db, "bookings");
          const newBookingRef = push(bookingsRef);

          const savedBooking = {
            ...booking,
            showtime,
            id: newBookingRef.key,
            paymentId: response.razorpay_payment_id,
            paymentStatus: "completed",
            userName: userData?.name || booking.userName,
            userCity: userData?.city || "N/A",
            userEmail: userData?.email || "N/A",
            userMobile: userData?.mobile || "N/A",
            userId: auth.currentUser?.uid,
            bookingDate: new Date().toISOString(),
            status: "confirmed"
          };

          await set(newBookingRef, savedBooking);

          // 2. Store payment information
          const paymentRef = ref(db, "payment/" + newBookingRef.key);
          await set(paymentRef, {
            paymentId: response.razorpay_payment_id,
            orderId: response.razorpay_order_id || null,
            amount: booking.totalPrice,
            mode: "Online",
            status: "completed",
            userName: savedBooking.userName,
            userEmail: savedBooking.userEmail,
            userId: auth.currentUser?.uid,
            bookingId: newBookingRef.key,
            timestamp: Date.now(),
          });

          // 3. Store booked seats in the same path that seat selection checks
          const bookedSeatsRef = ref(db, `bookings/${booking.movieTitle}/${booking.theaterName}/${booking.date}/${showtime}`);
          
          // Get existing bookings for this show
          const existingBookingsSnapshot = await get(bookedSeatsRef);
          const existingBookings = existingBookingsSnapshot.val() || {};
          
          // Add our booked seats
          const updatedBookings = {
            ...existingBookings,
            [newBookingRef.key]: {
              seats: booking.seats,
              bookedAt: Date.now(),
              userId: auth.currentUser?.uid,
              userName: savedBooking.userName
            }
          };

          await set(bookedSeatsRef, updatedBookings);

          // 4. Clean up temporary seat reservations
          for (const seatKey of tempSeats) {
            await remove(
              ref(
                db,
                `tempBookedSeats/${booking.movieTitle}/${booking.theaterName}/${booking.date}/${showtime}/${seatKey}`
              )
            );
          }

          navigate("/booking-confirmation", { 
            state: { 
              booking: savedBooking,
              paymentId: response.razorpay_payment_id
            } 
          });

        } catch (error) {
          console.error("Booking failed after payment:", error);
          alert("Booking failed. Please contact support with payment ID: " + response.razorpay_payment_id);
        }
      },
      prefill: {
        name: userData?.name || booking.userName,
        email: userData?.email || "N/A",
        contact: userData?.mobile || "N/A",
      },
      theme: {
        color: "#43cea2",
      },
    };

    const rzp = new Razorpay(options);
    rzp.open();
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>💳 Review & Payment</h2>

      <div style={styles.detailsBox}>
        <p><b>🎬 Movie:</b> {booking.movieTitle}</p>
        <p><b>🏢 Theater:</b> {booking.theaterName}</p>
        <p><b>📅 Date:</b> {booking.date}</p>
        <p><b>🕒 Showtime:</b> {showtime || "N/A"}</p>
        <p><b>👤 Name:</b> {userData?.name || booking.userName}</p>
        <p><b>📧 Email:</b> {userData?.email || "N/A"}</p>
        <p><b>📱 Mobile:</b> {userData?.mobile || "N/A"}</p>
        <p><b>💺 Seats:</b> {booking.seats?.join(", ")}</p>
        <p><b>💰 Total Price:</b> ₹{booking.totalPrice}</p>
      </div>

      {isLoading && <p style={{ textAlign: "center", color: "#43cea2" }}>Loading payment gateway...</p>}
      {error && <p style={{ textAlign: "center", color: "red" }}>Failed to load payment gateway: {error}</p>}

      <div style={styles.btnRow}>
        <button onClick={handlePayment} style={styles.payBtn} disabled={isLoading}>
          {isLoading ? "Processing..." : "✅ Pay Now"}
        </button>
        <button
          onClick={() => {
            if (window.confirm("Are you sure you want to cancel this transaction?")) {
              cancelTransaction();
            }
          }}
          style={styles.cancelBtn}
        >
          ❌ Cancel
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "40px 20px",
    fontFamily: "'Segoe UI', sans-serif",
    background: "linear-gradient(135deg, #0f0f0f, #1c1c1c)",
    minHeight: "100vh",
    color: "#fff",
  },
  heading: {
    textAlign: "center",
    fontSize: "28px",
    fontWeight: "700",
    color: "#43cea2",
    marginBottom: "30px",
  },
  detailsBox: {
    background: "#2d2d2d",
    padding: "25px",
    borderRadius: "16px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
    maxWidth: "550px",
    margin: "0 auto 25px",
    lineHeight: "1.8",
    fontSize: "16px",
  },
  btnRow: {
    display: "flex",
    justifyContent: "center",
    gap: "15px",
  },
  payBtn: {
    padding: "12px 25px",
    background: "linear-gradient(135deg, #43cea2, #185a9d)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "600",
  },
  cancelBtn: {
    padding: "12px 25px",
    background: "linear-gradient(135deg, #ff5858, #f09819)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "600",
  },
};