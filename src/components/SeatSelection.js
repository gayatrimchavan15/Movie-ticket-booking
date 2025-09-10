import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const SEAT_STATUS = {
  AVAILABLE: "available",
  SELECTED: "selected",
  SOLD: "sold",
};

const seatRowsInitial = [
  {
    label: "A",
    price: 270,
    seats: [
      { number: 1, status: SEAT_STATUS.SOLD },
      { number: 2, status: SEAT_STATUS.AVAILABLE },
      { number: 3, status: SEAT_STATUS.AVAILABLE },
      { number: 4, status: SEAT_STATUS.SOLD },
      { number: 5, status: SEAT_STATUS.AVAILABLE },
    ],
  },
  {
    label: "B",
    price: 220,
    seats: Array(15)
      .fill(0)
      .map((_, i) => ({
        number: i + 1,
        status: SEAT_STATUS.AVAILABLE,
      })),
  },
  // Add more rows as needed
];

export default function SeatSelection() {
  const location = useLocation();
  const navigate = useNavigate();
  const { movieTitle, theaterName, userName, showtime } = location.state || {};

  const [rows, setRows] = useState(seatRowsInitial);

  // Toggle seat selection
  function toggleSeat(rowLabel, seatNumber) {
    setRows((prevRows) =>
      prevRows.map((row) => {
        if (row.label !== rowLabel) return row;
        const updatedSeats = row.seats.map((seat) => {
          if (seat.number !== seatNumber || seat.status === SEAT_STATUS.SOLD) return seat;
          return {
            ...seat,
            status:
              seat.status === SEAT_STATUS.SELECTED
                ? SEAT_STATUS.AVAILABLE
                : SEAT_STATUS.SELECTED,
          };
        });
        return { ...row, seats: updatedSeats };
      })
    );
  }

  // Get selected seats
  function getSelectedSeats() {
    const selected = [];
    rows.forEach((row) => {
      row.seats.forEach((seat) => {
        if (seat.status === SEAT_STATUS.SELECTED) {
          selected.push({ row: row.label, number: seat.number, price: row.price });
        }
      });
    });
    return selected;
  }

  // Confirm booking and go to Payment page
  function confirmBooking() {
    const selectedSeats = getSelectedSeats();
    if (selectedSeats.length === 0) {
      alert("Please select at least one seat.");
      return;
    }

    const bookingData = {
      movieTitle,
      theaterName,
      userName,
      showtime,
      seats: selectedSeats,
      totalPrice: selectedSeats.reduce((acc, seat) => acc + seat.price, 0),
      timestamp: Date.now(),
    };

    navigate("/payment", { state: { booking: bookingData } });
  }

  // If state is missing (user opened page directly)
  if (!movieTitle || !theaterName || !userName || !showtime) {
    return <h2 style={{ padding: 20 }}>Booking info missing. Please go back and try again.</h2>;
  }

  return (
    <div style={{ padding: 20, fontFamily: "Arial, sans-serif", maxWidth: 700, margin: "0 auto" }}>
      <h2>
        Book seats for "{movieTitle}" at {theaterName} - {showtime}
      </h2>

      {/* Legend */}
      <div style={{ marginBottom: 14 }}>
        <b>Legend:</b>
        <div style={{ display: "flex", gap: 15, alignItems: "center", marginTop: 6 }}>
          <LegendBox color="#fff" border="#777" label="Available" />
          <LegendBox color="#4caf50" border="#4caf50" label="Selected" />
          <LegendBox color="#ccc" border="#999" label="Sold" />
        </div>
      </div>

      {/* Seat Rows */}
      {rows.map((row) => (
        <div key={row.label} style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
          <div style={{ width: 20, marginRight: 10, fontWeight: "bold", color: "#2c3e50" }}>
            {row.label}
          </div>
          {row.seats.map((seat) => (
            <button
              key={seat.number}
              onClick={() => toggleSeat(row.label, seat.number)}
              disabled={seat.status === SEAT_STATUS.SOLD}
              style={{
                width: 30,
                height: 30,
                marginRight: 5,
                backgroundColor:
                  seat.status === SEAT_STATUS.AVAILABLE
                    ? "#fff"
                    : seat.status === SEAT_STATUS.SELECTED
                    ? "#4caf50"
                    : "#ccc",
                border:
                  seat.status === SEAT_STATUS.AVAILABLE
                    ? "1px solid #777"
                    : `1px solid ${
                        seat.status === SEAT_STATUS.SELECTED ? "#4caf50" : "#999"
                      }`,
                borderRadius: 4,
                cursor: seat.status === SEAT_STATUS.SOLD ? "not-allowed" : "pointer",
              }}
            >
              {seat.number}
            </button>
          ))}
          <div style={{ marginLeft: 10, minWidth: 50, color: "#888" }}>₹{row.price}</div>
        </div>
      ))}

      {/* Confirm Booking */}
      <button
        onClick={confirmBooking}
        style={{
          marginTop: 20,
          padding: "12px 24px",
          fontSize: "16px",
          cursor: "pointer",
          backgroundColor: "#2c3e50",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
        }}
      >
        Confirm Booking
      </button>
    </div>
  );
}

// Small legend box component
function LegendBox({ color, border, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div
        style={{
          width: 18,
          height: 18,
          backgroundColor: color,
          border: `2px solid ${border}`,
          borderRadius: 4,
        }}
      />
      <span>{label}</span>
    </div>
  );
}
