import React from "react";
import { useNavigate } from "react-router-dom";
// import "./MovieCard.css";

export default function MovieCard({ movie }) {
  const navigate = useNavigate();

  function handleBookNow() {
    // Navigate to movie details page, passing movie title as param
    navigate(`/movies/${encodeURIComponent(movie.title)}`, { state: { movie } });
  }

  return (
    <div className="movie-card glass">
      <div className="poster-wrapper">
        <img src={movie.poster} alt={movie.title} />
        <span className="rating">⭐ {movie.rating}</span>
      </div>
      <h3>{movie.title}</h3>
      <p>{movie.genre}</p>
      <button className="btn book-btn" onClick={handleBookNow}>
        Book Now
      </button>
    </div>
  );
}
