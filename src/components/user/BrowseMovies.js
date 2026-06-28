import React, { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../../firebaseConfig";

function BrowseMovies() {
  const [movies, setMovies] = useState([]);

  useEffect(() => {
    const movieRef = ref(db, "movies");
    onValue(movieRef, (snap) =>
      snap.exists() ? setMovies(Object.values(snap.val())) : setMovies([])
    );
  }, []);

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>🎬 Browse Movies</h2>
      <div style={styles.grid}>
        {movies.map((m, i) => (
          <div style={styles.movieCard} key={i}>
            <div style={styles.poster}>{/* Poster placeholder or image */}</div>
            <h3 style={styles.movieTitle}>{m.title}</h3>
            <p style={styles.genre}>{m.genre}</p>
            <p style={styles.showTime}>Show: {m.showTime}</p>
            <button style={styles.bookBtn}>Book Now</button>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "30px",
    background: "linear-gradient(135deg, #0f0f1f, #1c1c2e)",
    minHeight: "100vh",
    color: "#fff",
  },
  title: {
    fontSize: "28px",
    marginBottom: "25px",
    color: "#ff9800",
    textAlign: "center",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "25px",
  },
  movieCard: {
    background: "#1f1f2e",
    borderRadius: "15px",
    padding: "15px",
    textAlign: "center",
    boxShadow: "0 8px 20px rgba(0, 0, 0, 0.4)",
    transition: "transform 0.3s ease, box-shadow 0.3s ease",
    cursor: "pointer",
  },
  movieCardHover: {
    transform: "scale(1.05)",
    boxShadow: "0 12px 25px rgba(0, 0, 0, 0.6)",
  },
  poster: {
    width: "100%",
    height: "280px",
    backgroundColor: "#333",
    borderRadius: "12px",
    marginBottom: "15px",
  },
  movieTitle: {
    fontSize: "20px",
    margin: "10px 0 5px 0",
    fontWeight: "600",
  },
  genre: {
    fontSize: "14px",
    color: "#bbb",
    margin: "5px 0",
  },
  showTime: {
    fontSize: "14px",
    color: "#bbb",
    margin: "5px 0 15px 0",
  },
  bookBtn: {
    background: "linear-gradient(45deg, #ff4b2b, #ff416c)",
    color: "#fff",
    border: "none",
    padding: "10px 20px",
    borderRadius: "25px",
    cursor: "pointer",
    fontSize: "16px",
    transition: "transform 0.2s ease",
  },
};

// Add hover effect programmatically
if (typeof window !== "undefined") {
  setTimeout(() => {
    const cards = document.querySelectorAll("div[style*='movieCard']");
    cards.forEach((card) => {
      card.addEventListener("mouseenter", () => {
        card.style.transform = "scale(1.05)";
        card.style.boxShadow = "0 12px 25px rgba(0, 0, 0, 0.6)";
      });
      card.addEventListener("mouseleave", () => {
        card.style.transform = "scale(1)";
        card.style.boxShadow = "0 8px 20px rgba(0, 0, 0, 0.4)";
      });
    });
  }, 0);
}

export default BrowseMovies;
