import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { db } from "../firebaseConfig";
import { ref, onValue } from "firebase/database";
import { CityContext } from "../context/CityContext";


export default function HomePage() {
  const [search, setSearch] = useState("");
  const [latestMovies, setLatestMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Clean and professional styles
  const styles = {
    homepage: {
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)",
      color: "#ffffff",
      fontFamily: "'Inter', sans-serif",
    },

    // Header Section
    header: {
      background: "linear-gradient(rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.5))",
      padding: "2rem 1rem",
      textAlign: "center",
    },

    logo: {
      fontSize: "3.5rem",
      fontWeight: "bold",
      marginBottom: "1rem",
      background: "linear-gradient(45deg, #e50914, #ff6b35)",
      backgroundClip: "text",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
    },

    tagline: {
      fontSize: "1.3rem",
      color: "rgba(255, 255, 255, 0.8)",
      marginBottom: "2rem",
    },

    // Search Section
    searchSection: {
      maxWidth: "600px",
      margin: "0 auto 3rem",
      padding: "0 1rem",
    },

    searchForm: {
      display: "flex",
      gap: "1rem",
    },

    searchInput: {
      flex: "1",
      padding: "1rem 1.5rem",
      border: "none",
      borderRadius: "25px",
      background: "rgba(255, 255, 255, 0.1)",
      color: "#ffffff",
      fontSize: "1rem",
      outline: "none",
    },

    searchButton: {
      padding: "1rem 2rem",
      background: "#e50914",
      border: "none",
      borderRadius: "25px",
      color: "#ffffff",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.3s ease",
    },

    // Main Content
    mainContent: {
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "2rem 1rem",
    },

    // Section Styles
    section: {
      marginBottom: "4rem",
    },

    sectionTitle: {
      fontSize: "2.2rem",
      fontWeight: "700",
      marginBottom: "2rem",
      textAlign: "center",
      color: "#ffffff",
    },

    // Movies Grid
    moviesGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
      gap: "2rem",
      marginTop: "2rem",
    },

    // Movie Card (matching your movies.js style)
    movieCard: {
      background: "#1f1f2e",
      borderRadius: "15px",
      overflow: "hidden",
      textAlign: "center",
      boxShadow: "0 8px 20px rgba(0, 0, 0, 0.3)",
      transition: "transform 0.3s ease",
      cursor: "pointer",
    },

    posterContainer: {
      width: "100%",
      height: "320px",
      overflow: "hidden",
    },

    moviePoster: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      transition: "transform 0.3s ease",
    },

    movieDetails: {
      padding: "1.5rem",
      color: "#fff",
    },

    movieTitle: {
      fontSize: "1.2rem",
      fontWeight: "600",
      marginBottom: "0.5rem",
      color: "#ffffff",
    },

    movieGenre: {
      fontSize: "0.9rem",
      color: "#bbb",
      marginBottom: "0.5rem",
    },

    movieRating: {
      fontSize: "0.9rem",
      color: "#ffd700",
      marginBottom: "1rem",
    },

    bookButton: {
      background: "linear-gradient(45deg, #ff4b2b, #ff416c)",
      color: "white",
      border: "none",
      padding: "0.8rem 1.5rem",
      borderRadius: "25px",
      cursor: "pointer",
      fontSize: "0.9rem",
      fontWeight: "600",
      width: "100%",
      transition: "all 0.3s ease",
    },

    // CTA Section
    ctaSection: {
      background: "rgba(229, 9, 20, 0.1)",
      borderRadius: "15px",
      padding: "3rem 2rem",
      textAlign: "center",
      margin: "3rem 0",
    },

    ctaTitle: {
      fontSize: "2rem",
      fontWeight: "700",
      marginBottom: "1rem",
    },

    ctaText: {
      fontSize: "1.1rem",
      color: "rgba(255, 255, 255, 0.8)",
      marginBottom: "2rem",
      maxWidth: "600px",
      marginLeft: "auto",
      marginRight: "auto",
    },

    ctaButtons: {
      display: "flex",
      gap: "1rem",
      justifyContent: "center",
      flexWrap: "wrap",
    },

    primaryButton: {
      background: "#e50914",
      color: "white",
      padding: "1rem 2rem",
      borderRadius: "25px",
      textDecoration: "none",
      fontWeight: "600",
      transition: "all 0.3s ease",
    },

    secondaryButton: {
      background: "transparent",
      color: "#e50914",
      padding: "1rem 2rem",
      borderRadius: "25px",
      textDecoration: "none",
      fontWeight: "600",
      border: "2px solid #e50914",
      transition: "all 0.3s ease",
    },

    // Loading State
    loadingContainer: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "300px",
      fontSize: "1.2rem",
      color: "rgba(255, 255, 255, 0.7)",
    },
  };

  useEffect(() => {
    const moviesRef = ref(db, "movies");
    
    const unsubscribe = onValue(moviesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const movieArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        
        // Get latest 4 movies (sorted by createdAt or by key order)
        const latest = [...movieArray]
          .sort((a, b) => {
            // Sort by createdAt if available, otherwise by key
            if (a.createdAt && b.createdAt) {
              return b.createdAt - a.createdAt;
            }
            return 0;
          })
          .slice(0, 4);
        
        setLatestMovies(latest);
        setLoading(false);
      } else {
        setLoading(false);
      }
    }, (error) => {
      console.error("Error fetching movies:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/movies?search=${encodeURIComponent(search)}`);
    }
  };

  const handleBookNow = (movieId, e) => {
    e.stopPropagation();
    navigate(`/movie-details/${movieId}`);
  };

  const MovieCard = ({ movie }) => (
    <div 
      style={styles.movieCard}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "scale(1.05)";
        e.currentTarget.querySelector('img').style.transform = "scale(1.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.querySelector('img').style.transform = "scale(1)";
      }}
      onClick={() => navigate(`/movie-details/${movie.id}`)}
    >
      <div style={styles.posterContainer}>
        <img 
          src={movie.posterUrl || "https://via.placeholder.com/300x450/333/fff?text=No+Poster"} 
          alt={movie.title} 
          style={styles.moviePoster}
          onError={(e) => {
            e.target.src = "https://via.placeholder.com/300x450/333/fff?text=No+Poster";
          }}
        />
      </div>
      <div style={styles.movieDetails}>
        <h3 style={styles.movieTitle}>{movie.title}</h3>
        <p style={styles.movieGenre}>{movie.genre || "Action"}</p>
        <p style={styles.movieRating}>
          {movie.rating ? `⭐ ${movie.rating}/10` : "Rating: N/A"}
        </p>
        <button 
          style={styles.bookButton}
          onClick={(e) => handleBookNow(movie.id, e)}
          onMouseEnter={(e) => e.target.style.transform = "scale(1.05)"}
          onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
        >
          Book Now
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div style={styles.homepage}>
        <div style={styles.loadingContainer}>
          <div>Loading movies...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.homepage}>
      {/* Header Section */}
      <header style={styles.header}>
        <h1 style={styles.logo}>Movie Mart</h1>
        <p style={styles.tagline}>
          Your ultimate destination for movie tickets and entertainment
        </p>
        
        {/* Search Section */}
        <div style={styles.searchSection}>
          <form style={styles.searchForm} onSubmit={handleSearchSubmit}>
            <input
              type="text"
              placeholder="Search for movies, genres, or actors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={styles.searchInput}
            />
            <button type="submit" style={styles.searchButton}>
              Search
            </button>
          </form>
        </div>
      </header>

      {/* Main Content */}
      <main style={styles.mainContent}>
        {/* Latest Movies Section */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Latest Movies</h2>
          {latestMovies.length > 0 ? (
            <div style={styles.moviesGrid}>
              {latestMovies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", color: "#bbb", fontSize: "1.1rem" }}>
              No movies available at the moment.
            </div>
          )}
        </section>

        {/* Call to Action Section */}
        <section style={styles.ctaSection}>
          <h2 style={styles.ctaTitle}>Ready for Movie Night?</h2>
          <p style={styles.ctaText}>
            Discover amazing movies, book tickets effortlessly, and enjoy the best cinema experience 
            with Movie Mart. Join thousands of movie lovers who trust us for their entertainment needs.
          </p>
          <div style={styles.ctaButtons}>
            <Link to="/movies" style={styles.primaryButton}>
              Explore All Movies
            </Link>
            <Link to="/signup" style={styles.secondaryButton}>
              Create Account
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}