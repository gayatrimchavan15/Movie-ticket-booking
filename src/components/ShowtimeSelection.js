import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const showtimes = ["10:00 AM", "1:00 PM", "4:00 PM", "7:00 PM", "10:00 PM"];

export default function ShowtimeSelection() {
  const navigate = useNavigate();
  const location = useLocation();

  const { movieTitle, theaterName, userName } = location.state || {};
  const [selectedShowtime, setSelectedShowtime] = useState("");

  if (!movieTitle || !theaterName || !userName) {
    return (
      <p style={{ padding: 20 }}>
        Booking info missing. Please go back and select a theater and movie.
      </p>
    );
  }

  function handleNext() {
    if (!selectedShowtime) {
      alert("Please select a showtime.");
      return;
    }

    // ✅ Navigate to seat-selection page with state
    navigate("/seat-selection", {
      state: {
        movieTitle,
        theaterName,
        userName,
        showtime: selectedShowtime,
      },
    });
  }

  return (
    <div
      style={{
        padding: 20,
        fontFamily: "Segoe UI, Arial, sans-serif",
        maxWidth: 600,
        margin: "auto",
      }}
    >
      <h2 style={{ marginBottom: 20, color: "#2c3e50" }}>
        Select Showtime for "{movieTitle}" at {theaterName}
      </h2>
      <div>
        {showtimes.map((time) => (
          <label
            key={time}
            style={{
              display: "block",
              marginBottom: 12,
              padding: 12,
              border: "1px solid #ddd",
              borderRadius: 8,
              cursor: "pointer",
              backgroundColor:
                selectedShowtime === time ? "#2c3e50" : "#ffffff",
              color: selectedShowtime === time ? "#ffffff" : "#2c3e50",
              fontWeight: selectedShowtime === time ? "bold" : "normal",
              transition: "all 0.2s",
            }}
            onClick={() => setSelectedShowtime(time)}
          >
            <input
              type="radio"
              name="showtime"
              value={time}
              checked={selectedShowtime === time}
              onChange={() => setSelectedShowtime(time)}
              style={{ display: "none" }}
            />
            {time}
          </label>
        ))}
      </div>

      <button
        onClick={handleNext}
        style={{
          marginTop: 20,
          padding: "12px 24px",
          fontSize: "16px",
          cursor: "pointer",
          backgroundColor: "#27ae60",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          transition: "background-color 0.3s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#219150")}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#27ae60")}
      >
        Choose Seats →
      </button>
    </div>
  );
}
