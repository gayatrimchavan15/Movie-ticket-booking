import React, { useState } from "react";
import { Link } from "react-router-dom";
import oppenheimerPoster from "../image/oppenheimer.jpg";
import avengersPoster from "../image/avengers.jpg";
import lionKingPoster from "../image/lionkingg.jpg";
import InceptionPoster from "../image/inceptionM.jpg";
import MovieCard from "./MovieCard";
import "./HomePage.css";

const movies = [
  { title: "Oppenheimer", poster: oppenheimerPoster, genre: "Thriller", rating: "4.8" },
  { title: "Avengers: Endgame", poster: avengersPoster, genre: "Action", rating: "4.7" },
  { title: "Lion King", poster: lionKingPoster, genre: "Animation", rating: "4.9" },
  { title: "Inception", poster: InceptionPoster, genre: "Science Fiction", rating: "4.2" },
];

export default function HomePage() {
  const [search, setSearch] = useState("");

  // Show only first 3 movies as preview
  const previewMovies = movies.slice(0, 3);

  const filteredMovies = previewMovies.filter((movie) =>
    movie.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="homepage">
      {/* Hero Section */}
      <header className="hero" id="home">
        <h1 className="hero-title">Welcome to Movie Mart</h1>
        <p className="hero-subtitle">Find & book your favorite movies instantly 🎟️</p>
        <form className="search-form" onSubmit={(e) => e.preventDefault()}>
          <input
            type="text"
            placeholder="🔍 Search for movies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>
      </header>

      {/* Recommended Movies Preview - MOVED HERE */}
      <section className="movies" id="movies" style={{ marginTop: "2rem" }}>
        <h2>🎥 Recommended Movies</h2>
        <div className="movie-grid">
          {filteredMovies.length > 0 ? (
            filteredMovies.map((movie, i) => <MovieCard key={i} movie={movie} />)
          ) : (
            <p className="no-movies">No movies found.</p>
          )}
        </div>
        <div className="see-more">
          <Link to="/movies" className="see-more-btn">
            See All Movies
          </Link>
        </div>
      </section>

      {/* About Preview */}
      <section className="about glass" id="about" style={{ marginTop: "2rem" }}>
        <h2>ℹ️ About Us</h2>
        <p>
          Movie Mart is your go-to platform for booking movie tickets quickly and easily.
          Enjoy a seamless experience with lots of movie choices!
        </p>
        <Link to="/about" className="btn see-more-btn">
          Learn More
        </Link>
      </section>

      {/* Contact Preview */}
      <section className="contact glass" id="contact" style={{ marginTop: "2rem" }}>
        <h2>📩 Contact</h2>
        <p>Email: support@moviemart.com | Phone: +1 234 567 890</p>
        <Link to="/contact" className="btn see-more-btn">
          Get in Touch
        </Link>
      </section>
    </div>
  );
}
