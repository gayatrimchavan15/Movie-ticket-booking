import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { db } from "../firebaseConfig";
import { ref, push, set } from "firebase/database";

export default function PaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { booking } = location.state || {};

  if (!booking) {
    return <h2 style={{ padding: 20, textAlign: "center", color: "#e74c3c" }}>
      ❌ No booking found. Please go back and select seats.
    </h2>;
  }

  async function handlePayment() {
    try {
      const bookingsRef = ref(db, "bookings");
      const newBookingRef = push(bookingsRef);

      const savedBooking = {
        ...booking,
        id: newBookingRef.key,
        paymentId: "demo-payment-" + Date.now(),
      };

      await set(newBookingRef, savedBooking);

      navigate("/booking-confirmation", { state: { booking: savedBooking } });
    } catch (error) {
      alert("Booking failed. Please try again.");
      console.error(error);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #74ebd5, #ACB6E5)",
        fontFamily: "Segoe UI, sans-serif",
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "30px",
          width: "100%",
          maxWidth: "500px",
          boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
          animation: "fadeIn 0.6s ease-in-out",
        }}
      >
        <h2 style={{ marginBottom: 20, color: "#2c3e50", textAlign: "center" }}>
          💳 Review & Payment
        </h2>

        {/* Booking Summary */}
        <div
          style={{
            background: "#262627ff",
            borderRadius: "10px",
            padding: "20px",
            marginBottom: "25px",
            border: "1px solid #e0e6f1",
          }}
        >
          <p><b>🎬 Movie:</b> {booking.movieTitle}</p>
          <p><b>🏢 Theater:</b> {booking.theaterName}</p>
          <p><b>⏰ Showtime:</b> {booking.showtime}</p>
          <p><b>👤 Name:</b> {booking.userName}</p>
          <p><b>💺 Seats:</b> {booking.seats.map(seat => `${seat.row}${seat.number}`).join(", ")}</p>
          <p style={{ fontSize: "18px", fontWeight: "bold", color: "#27ae60" }}>
            💰 Total Price: ₹{booking.totalPrice}
          </p>
        </div>

        {/* Payment Button */}
        <button
          onClick={handlePayment}
          style={{
            width: "100%",
            padding: "14px",
            backgroundColor: "#27ae60",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "pointer",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#219150")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#27ae60")}
        >
          ✅ Pay Now (Simulated)
        </button>
      </div>
    </div>
  );
}
