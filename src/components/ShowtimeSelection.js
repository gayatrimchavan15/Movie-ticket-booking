// src/components/TheaterShowtimeSelection.js
import React, { useState, useEffect, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { db } from "../firebaseConfig";
import { ref, onValue } from "firebase/database";
import { CityContext } from "../context/CityContext";

export default function TheaterShowtimeSelection() {
  const navigate = useNavigate();
  const location = useLocation();
  const { movieTitle, userName } = location.state || {};
  const { selectedCity } = useContext(CityContext);

  const [theaters, setTheaters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const theaterRef = ref(db, "theaters");
    onValue(theaterRef, (snapshot) => {
      const data = snapshot.val();
      let allTheaters = [];

      if (data) {
        allTheaters = Object.entries(data).map(([id, obj]) => ({
          id,
          name: obj.name || obj.theaterName || "Unnamed Theater",
          city: obj.city || "Unknown City",
          showtimes: obj.showtimes || {},
        }));

        // Filter by selected city
        if (selectedCity && selectedCity.trim() !== "" && selectedCity !== "Select City") {
          allTheaters = allTheaters.filter(
            (t) => t.city.trim().toLowerCase() === selectedCity.trim().toLowerCase()
          );
        }
      }

      setTheaters(allTheaters);
      setLoading(false);
    });
  }, [selectedCity]);

  const handleShowtimeClick = (theater, date, time, title) => {
    navigate("/seat-selection", {
      state: {
        movieTitle: title || movieTitle,
        theaterName: theater.name,
        city: theater.city,
        date,
        time,
        userName: userName || "Guest", // Pass userName to seat selection
      },
    });
  };

  if (loading) {
    return <p style={styles.loading}>Loading theaters and showtimes...</p>;
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h2 style={styles.heading}>🎟️ Select Showtime</h2>
        <p style={styles.subHeading}>
          {movieTitle ? `Movie: ${movieTitle}` : "All Movies"}
          {selectedCity && selectedCity !== "Select City" ? ` | City: ${selectedCity}` : " | All Cities"}
        </p>

        {theaters.length === 0 ? (
          <p style={styles.noData}>❌ No theaters available.</p>
        ) : (
          theaters.map((theater) => {
            const showtimeDates = Object.keys(theater.showtimes || {});
            const movieShows = [];

            showtimeDates.forEach((date) => {
              const movies = theater.showtimes[date];
              Object.entries(movies).forEach(([movieId, movieData]) => {
                if (!movieTitle || movieData.title === movieTitle) {
                  movieShows.push({
                    date,
                    timings: movieData.timings || [],
                    title: movieData.title,
                  });
                }
              });
            });

            if (movieShows.length === 0) return null;

            return (
              <div key={theater.id} style={styles.theaterCard}>
                <div style={styles.theaterHeader}>
                  <h3 style={styles.theaterName}>{theater.name}</h3>
                  <p style={styles.theaterCity}>{theater.city}</p>
                </div>

                {movieShows.map((show, idx) => (
                  <div key={show.date + idx} style={styles.showtimeBlock}>
                    <p style={styles.dateText}>📅 {show.date}</p>
                    <div style={styles.showtimeRow}>
                      {show.timings.map((time, tIdx) => (
                        <button
                          key={tIdx}
                          style={styles.showtimeButton}
                          onClick={() => handleShowtimeClick(theater, show.date, time, show.title)}
                        >
                          {movieTitle ? time : `${show.title} - ${time}`}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    backgroundColor: "#f9fafb",
    minHeight: "100vh",
    padding: "30px",
    display: "flex",
    justifyContent: "center",
  },
  container: {
    width: "100%",
    maxWidth: "800px",
    backgroundColor: "white",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    padding: "25px",
  },
  heading: { fontSize: "24px", fontWeight: "bold", color: "#111827", marginBottom: "10px" },
  subHeading: { color: "#374151", marginBottom: "25px" },
  loading: { textAlign: "center", padding: "40px", color: "#6b7280" },
  noData: { textAlign: "center", color: "#6b7280", marginTop: "20px" },
  theaterCard: { borderBottom: "1px solid #e5e7eb", paddingBottom: "20px", marginBottom: "20px" },
  theaterHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  theaterName: { fontSize: "18px", fontWeight: "600", color: "#1f2937" },
  theaterCity: { color: "#6b7280" },
  showtimeBlock: { marginTop: "10px" },
  dateText: { fontWeight: "600", marginBottom: "8px", color: "#2563eb" },
  showtimeRow: { display: "flex", flexWrap: "wrap", gap: "10px" },
  showtimeButton: {
    border: "1px solid #2563eb",
    backgroundColor: "white",
    color: "#2563eb",
    padding: "8px 14px",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.3s",
  },
};
