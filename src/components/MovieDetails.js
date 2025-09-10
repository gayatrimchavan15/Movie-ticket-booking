import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { db } from "../firebaseConfig";
import { ref, onValue } from "firebase/database";

export default function MovieDetails() {
  const { title } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(location.state?.movie || null);
  const [loadingMovie, setLoadingMovie] = useState(!movie);
  const [theaters, setTheaters] = useState([]);
  const [loadingTheaters, setLoadingTheaters] = useState(true);

  useEffect(() => {
    if (!movie) {
      const moviesRef = ref(db, "movies");
      onValue(moviesRef, (snapshot) => {
        const moviesData = snapshot.val() ? Object.values(snapshot.val()) : [];
        const foundMovie = moviesData.find(
          (m) => m.title === decodeURIComponent(title)
        );
        setMovie(foundMovie || null);
        setLoadingMovie(false);
      });
    }
  }, [movie, title]);

  useEffect(() => {
    const theatersRef = ref(db, "theaters");
    onValue(theatersRef, (snapshot) => {
      const theatersData = snapshot.val() ? Object.values(snapshot.val()) : [];
      setTheaters(theatersData);
      setLoadingTheaters(false);
    });
  }, []);

  if (loadingMovie || loadingTheaters) {
    return <p style={{ padding: 20 }}>Loading...</p>;
  }

  if (!movie) {
    return (
      <div style={{ padding: 20 }}>
        ❌ Movie not found for: {decodeURIComponent(title)} <br />
        <button
          onClick={() => navigate("/movies")}
          style={{
            marginTop: 10,
            padding: "10px 20px",
            backgroundColor: "#2c3e50",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          Go back to Movies
        </button>
      </div>
    );
  }

  function handleTheaterSelect(theater) {
    navigate("/showtime-selection", {
      state: {
        movieTitle: movie.title,
        theaterName: theater.name,
        userName: "John Doe",
      },
    });
  }

  return (
    <div
      style={{
        padding: 20,
        maxWidth: 900,
        margin: "auto",
        fontFamily: "Segoe UI, Arial, sans-serif",
      }}
    >
      <h1 style={{ color: "#2c3e50", marginBottom: 15 }}>{movie.title}</h1>
      <img
        src={movie.posterUrl || "/default-movie.jpg"}
        alt={movie.title}
        style={{
          width: 300,
          borderRadius: 10,
          marginBottom: 15,
          boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
        }}
      />
      <p>
        <b>Genre:</b> {movie.genre}
      </p>
      <p>
        <b>Rating:</b> {movie.rating || "N/A"}
      </p>
      <p>
        <b>Release Date:</b> {movie.releaseDate || "N/A"}
      </p>

      <h2 style={{ marginTop: 30, color: "#34495e" }}>Select Theater</h2>
      {theaters.length === 0 ? (
        <p>No theaters available.</p>
      ) : (
        <div>
          {theaters.map((theater) => (
            <div
              key={theater.id || theater.name}
              style={{
                padding: 15,
                marginBottom: 15,
                border: "1px solid #ddd",
                borderRadius: 8,
                cursor: "pointer",
                backgroundColor: "#ffffff",
                boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                transition: "transform 0.2s, background-color 0.2s",
              }}
              onClick={() => handleTheaterSelect(theater)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f0f9ff";
                e.currentTarget.style.transform = "scale(1.02)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#ffffff";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <b style={{ fontSize: "18px", color: "#2c3e50" }}>
                {theater.name}
              </b>
              <br />
              <small style={{ color: "#7f8c8d" }}>{theater.address}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
