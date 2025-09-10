// Movies.js
import React, { useEffect, useState, useContext } from "react";
import { db } from "../firebaseConfig";
import { ref, onValue } from "firebase/database";
import { CityContext } from "../context/CityContext";
import { useNavigate } from "react-router-dom";

export default function Movies() {
  const { selectedCity } = useContext(CityContext);
  const [movies, setMovies] = useState([]);
  const [filteredMovies, setFilteredMovies] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const moviesRef = ref(db, "movies");
    onValue(moviesRef, (snapshot) => {
      const data = snapshot.val();
      setMovies(data ? Object.values(data) : []);
    });
  }, []);

  useEffect(() => {
    if (!selectedCity || selectedCity === "Select City") {
      setFilteredMovies(movies);
      return;
    }

    const theatersRef = ref(db, "theaters");
    onValue(theatersRef, (snapshot) => {
      const theatersData = snapshot.val() ? Object.values(snapshot.val()) : [];
      const cityTheaters = theatersData.filter((t) => t.city === selectedCity);

      const movieTitlesSet = new Set();
      cityTheaters.forEach((theater) => {
        if (theater.showtimes)
          Object.keys(theater.showtimes).forEach((title) =>
            movieTitlesSet.add(title)
          );
      });

      const available = movies.filter((m) => movieTitlesSet.has(m.title));
      setFilteredMovies(available);
    });
  }, [selectedCity, movies]);

  return (
    <>
      <style>{`
        .movies-title { font-size:28px; font-weight:bold; color:#1a1a1a; text-align:center; margin-bottom:25px; }
        .movies-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:25px; padding:0 20px 40px; }
        .movie-card { background:#fff; border-radius:14px; box-shadow:0 4px 10px rgba(0,0,0,0.12); overflow:hidden; transition:transform 0.25s ease, box-shadow 0.25s ease; margin:auto; max-width:260px; display:flex; flex-direction:column; cursor:pointer; }
        .movie-card:hover { transform:translateY(-5px); box-shadow:0 8px 18px rgba(0,0,0,0.18); }
        .movie-poster-wrapper { width:100%; aspect-ratio:2/3; overflow:hidden; background:#f1f1f1; }
        .movie-poster { width:100%; height:100%; object-fit:cover; transition:transform 0.35s ease; }
        .movie-card:hover .movie-poster { transform:scale(1.05); }
        .movie-content { padding:14px; text-align:center; }
        .movie-title { font-size:18px; font-weight:700; margin:8px 0 6px; color:#222; }
        .movie-genre { font-size:14px; color:#555; margin-bottom:12px; }
        .book-button { background:linear-gradient(135deg,#ff4b2b,#ff784e); border:none; padding:10px 20px; border-radius:20px; color:white; font-weight:600; font-size:14px; cursor:pointer; transition:transform 0.2s ease, background 0.3s ease; }
        .book-button:hover { transform:scale(1.05); background:linear-gradient(135deg,#ff3a1b,#ff6a40); }
        .no-movies-text { grid-column:1/-1; text-align:center; color:#888; font-size:18px; margin-top:50px; }
      `}</style>

      <h1 className="movies-title">
        {selectedCity && selectedCity !== "Select City"
          ? `🎥 Movies in ${selectedCity}`
          : "🎥 All Movies"}
      </h1>
      <div className="movies-grid">
        {filteredMovies.length === 0 ? (
          <p className="no-movies-text">
            No movies available
            {selectedCity && selectedCity !== "Select City"
              ? ` in ${selectedCity}`
              : ""}
            .
          </p>
        ) : (
          filteredMovies.map((movie, i) => (
            <div
              key={i}
              className="movie-card"
              onClick={() => navigate(`/movie/${encodeURIComponent(movie.title)}`, { state: { movie } })}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  navigate(`/movie/${encodeURIComponent(movie.title)}`, { state: { movie } });
                }
              }}
              role="button"
              aria-pressed="false"
            >
              <div className="movie-poster-wrapper">
                <img
                  src={movie.posterUrl || "/default-movie.jpg"}
                  alt={movie.title}
                  className="movie-poster"
                />
              </div>
              <div className="movie-content">
                <h3 className="movie-title">{movie.title}</h3>
                <p className="movie-genre">{movie.genre}</p>
                <button
                  className="book-button"
                  onClick={(e) => {
                    e.stopPropagation(); // prevent card click
                    navigate(`/movie/${encodeURIComponent(movie.title)}`, { state: { movie } });
                  }}
                >
                  Book Now
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
