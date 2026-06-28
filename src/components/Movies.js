// src/components/Movies.js
import React, { useEffect, useState, useContext } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../firebaseConfig";
import { CityContext } from "../context/CityContext";
import { useNavigate } from "react-router-dom";

export default function Movies() {
  const { selectedCity } = useContext(CityContext);
  const [movies, setMovies] = useState([]);
  const [allMovies, setAllMovies] = useState([]);

  // Fetch all movies
  useEffect(() => {
    const moviesRef = ref(db, "movies");
    onValue(moviesRef, (snap) => {
      const all = snap.val();
      const moviesList = [];
      if (all) {
        for (const id in all) {
          moviesList.push({ id, ...all[id] });
        }
      }
      setAllMovies(moviesList);
    });
  }, []);

  // Filter movies by city
  useEffect(() => {
    if (!selectedCity || selectedCity === "Select City") {
      setMovies(allMovies);
      return;
    }

    const theatersRef = ref(db, "theaters");
    onValue(theatersRef, (snapshot) => {
      const theaters = snapshot.val();
      const movieIdsSet = new Set();

      for (const theaterId in theaters) {
        const theater = theaters[theaterId];
        if (!theater.city) continue;

        // Normalize city names
        if (theater.city.trim().toLowerCase() !== selectedCity.trim().toLowerCase()) continue;

        const showtimes = theater.showtimes;
        if (!showtimes) continue;

        // Loop through all dates and collect movieIds
        Object.values(showtimes).forEach((moviesOnDate) => {
          if (!moviesOnDate) return;
          Object.keys(moviesOnDate).forEach((movieId) => {
            movieIdsSet.add(movieId);
          });
        });
      }

      const filtered = allMovies.filter((m) => movieIdsSet.has(m.id));
      setMovies(filtered);
    });
  }, [selectedCity, allMovies]);

  const styles = {
    container: { 
      padding: "40px 20px", 
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)",
    },
    header: {
      textAlign: "center",
      marginBottom: "50px",
    },
    title: { 
      fontSize: "2.5rem", 
      fontWeight: "700",
      color: "#ffffff",
      marginBottom: "15px",
      textShadow: "0 4px 8px rgba(0,0,0,0.5)",
    },
    subtitle: {
      fontSize: "1.1rem",
      color: "#cccccc",
      marginBottom: "10px",
    },
    noMovies: { 
      fontSize: "1.2rem", 
      color: "#888888",
      textAlign: "center",
      padding: "60px 20px",
      background: "rgba(255, 255, 255, 0.05)",
      borderRadius: "15px",
      margin: "20px auto",
      maxWidth: "500px",
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
      gap: "35px",
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "0 20px",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>
          🎬 Movies {selectedCity && selectedCity !== "Select City" ? `in ${selectedCity}` : " (All Cities)"}
        </h1>
        {movies.length > 0 && (
          <p style={styles.subtitle}>
            {movies.length} movie{movies.length !== 1 ? 's' : ''} available
          </p>
        )}
      </div>

      {movies.length === 0 ? (
        <p style={styles.noMovies}>
          No movies found {selectedCity && selectedCity !== "Select City" && `in ${selectedCity}`}.
        </p>
      ) : (
        <div style={styles.grid}>
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      )}
    </div>
  );
}

// Movie Card Component
function MovieCard({ movie }) {
  const navigate = useNavigate();

  const handleBookNow = (e) => {
    e.stopPropagation();
    navigate(`/movie-details/${movie.id}`, { state: { movie } });
  };

  const cardStyle = {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#2a2a3a",
    borderRadius: "20px",
    width: "100%",
    maxWidth: "320px",
    height: "480px",
    overflow: "hidden",
    textAlign: "center",
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.4)",
    transition: "all 0.3s ease",
    cursor: "pointer",
    margin: "0 auto",
    border: "1px solid rgba(255, 255, 255, 0.1)",
  };

  const posterStyle = {
    width: "100%",
    height: "300px",
    objectFit: "cover",
    borderBottom: "3px solid #ff416c",
  };

  const detailsContainer = {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px",
    color: "#fff",
    flexGrow: 1,
    width: "100%",
    boxSizing: "border-box",
  };

  const titleStyle = { 
    fontSize: "18px", 
    fontWeight: "600",
    margin: "0 0 8px 0",
    color: "#ffffff",
    lineHeight: "1.3",
    minHeight: "46px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const genreStyle = { 
    fontSize: "14px", 
    margin: "0 0 8px 0", 
    color: "#ff8ba0",
    fontWeight: "500",
  };

  const dateStyle = { 
    fontSize: "13px", 
    margin: "0 0 15px 0", 
    color: "#aaaaaa",
  };

  const btnStyle = {
    background: "linear-gradient(45deg, #ff4b2b, #ff416c)",
    color: "white",
    border: "none",
    padding: "12px 30px",
    borderRadius: "25px",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: "600",
    transition: "all 0.3s ease",
    width: "100%",
    maxWidth: "200px",
    boxShadow: "0 4px 15px rgba(255, 65, 108, 0.3)",
  };

  return (
    <div
      style={cardStyle}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-8px)";
        e.currentTarget.style.boxShadow = "0 15px 35px rgba(0,0,0,0.6)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.4)";
      }}
    >
      <img src={movie.posterUrl} alt={movie.title} style={posterStyle} />
      <div style={detailsContainer}>
        <div style={{width: "100%"}}>
          <h3 style={titleStyle}>{movie.title}</h3>
          <p style={genreStyle}>{movie.genre}</p>
          <p style={dateStyle}>Release: {movie.releaseDate}</p>
        </div>
        <button
          style={btnStyle}
          onMouseEnter={(e) => {
            e.target.style.transform = "scale(1.05)";
            e.target.style.boxShadow = "0 6px 20px rgba(255, 65, 108, 0.4)";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "scale(1)";
            e.target.style.boxShadow = "0 4px 15px rgba(255, 65, 108, 0.3)";
          }}
          onClick={handleBookNow}
        >
          Book Now
        </button>
      </div>
    </div>
  );
}