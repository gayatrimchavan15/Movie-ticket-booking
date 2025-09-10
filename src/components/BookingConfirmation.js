import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function BookingConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { booking } = location.state || {};

  if (!booking) {
    return <h2 style={{ padding: 20 }}>No booking details found.</h2>;
  }

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: "0 auto", fontFamily: "Arial, sans-serif", textAlign: "center" }}>
      <h2 style={{ color: "#27ae60" }}>✅ Booking Confirmed!</h2>
      <p>Thank you, <b>{booking.userName}</b>. Your booking was successful.</p>

      <div
        style={{
          marginTop: 20,
          padding: 20,
          border: "1px solid #ddd",
          borderRadius: 8,
          textAlign: "left",
          background: "#302e2eff",
        }}
      >
        <p><b>🎬 Movie:</b> {booking.movieTitle}</p>
        <p><b>🏢 Theater:</b> {booking.theaterName}</p>
        <p><b>⏰ Showtime:</b> {booking.showtime}</p>
        <p><b>💺 Seats:</b> {booking.seats.map(seat => `${seat.row}${seat.number}`).join(", ")}</p>
        <p><b>💰 Total Paid:</b> ₹{booking.totalPrice}</p>
        <p><b>🆔 Payment ID:</b> {booking.paymentId}</p>
        <p><b>📅 Booking Time:</b> {new Date(booking.timestamp).toLocaleString()}</p>
      </div>

      <button
        style={{
          marginTop: 20,
          padding: "10px 20px",
          backgroundColor: "#2c3e50",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
        }}
        onClick={() => navigate("/movies")}
      >
        Back to Movies
      </button>
    </div>
  );
}
