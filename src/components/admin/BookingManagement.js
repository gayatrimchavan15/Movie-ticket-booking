import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import { db } from "../../firebaseConfig";
import { ref, onValue, remove } from "firebase/database";

export default function BookingManagement() {
  const [bookings, setBookings] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const bookingsRef = ref(db, "bookings");
    onValue(bookingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setBookings(
          Object.entries(data).map(([id, booking]) => ({
            id,
            ...booking,
          }))
        );
      } else {
        setBookings([]);
      }
    });
  }, []);

  function handleDelete(id) {
    if (window.confirm("Delete this booking?")) {
      remove(ref(db, `bookings/${id}`))
        .then(() => setMessage("✅ Booking deleted!"))
        .catch(() => setMessage("❌ Error deleting booking."));
    }
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#eef2f7" }}>
      <Sidebar activePath="/admin/booking-management" />
      <div style={{ flex: 1, padding: "40px 30px" }}>
        <h2
          style={{
            color: "#1e293b",
            fontWeight: "bold",
            fontSize: 30,
            marginBottom: 30,
          }}
        >
          📋 Booking Management
        </h2>
        {message && (
          <div
            style={{
              marginBottom: 18,
              padding: "12px 16px",
              borderRadius: "8px",
              background: message.includes("deleted") ? "#d4edda" : "#f8d7da",
              color: message.includes("deleted") ? "#155724" : "#721c24",
              fontSize: 15,
            }}
          >
            {message}
          </div>
        )}
        <div style={tableSectionStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>User</th>
                <th style={thStyle}>Movie</th>
                <th style={thStyle}>Theater</th>
                <th style={thStyle}>City</th>
                <th style={thStyle}>Showtime</th>
                <th style={thStyle}>Seats</th>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.length === 0 ? (
                <tr>
                  <td style={tdEmptyStyle} colSpan={8}>
                    No bookings found
                  </td>
                </tr>
              ) : (
                bookings.map((booking, index) => (
                  <tr
                    key={booking.id}
                    style={{
                      backgroundColor: index % 2 === 0 ? "#ffffff" : "#f9fbfd",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "#eef6ff")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        index % 2 === 0 ? "#ffffff" : "#f9fbfd")
                    }
                  >
                    <td style={tdStyle}>
                      {booking.userName || booking.user || "-"}
                    </td>
                    <td style={tdStyle}>{booking.movieTitle || "-"}</td>
                    <td style={tdStyle}>{booking.theaterName || "-"}</td>
                    <td style={tdStyle}>{booking.city || "-"}</td>
                    <td style={tdStyle}>{booking.showtime || "-"}</td>
                    <td style={tdStyle}>
                      {Array.isArray(booking.seats)
                        ? booking.seats.join(", ")
                        : booking.seats || "-"}
                    </td>
                    <td style={tdStyle}>{booking.date || "-"}</td>
                    <td style={tdStyle}>
                      <button
                        onClick={() => handleDelete(booking.id)}
                        style={deleteBtnStyle}
                      >
                        🗑 Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// CSS-in-JS styles
const tableSectionStyle = {
  background: "#fff",
  borderRadius: "12px",
  boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
  padding: "20px",
  marginTop: "12px",
  maxWidth: 1100,
  minWidth: 320,
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
};

const thStyle = {
  background: "#f1f5f9",
  color: "#334155",
  padding: "14px 12px",
  textAlign: "left",
  fontSize: 15,
  fontWeight: "600",
  borderBottom: "2px solid #e2e8f0",
};

const tdStyle = {
  padding: "12px 10px",
  fontSize: 14,
  fontWeight: 500,
  color: "#475569",
  borderBottom: "1px solid #e2e8f0",
};

const tdEmptyStyle = {
  ...tdStyle,
  color: "#9ca3af",
  fontWeight: "normal",
  fontSize: "16px",
  textAlign: "center",
};

const deleteBtnStyle = {
  background: "#ef4444",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  padding: "6px 14px",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "600",
  transition: "background 0.3s",
};
