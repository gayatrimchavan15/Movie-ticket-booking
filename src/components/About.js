// src/components/About.js
import React from "react";

export default function About() {
  return (
    <div className="about-page glass">
      <style>{`
        .about-page {
          padding: 30px;
          max-width: 800px;
          margin: 20px auto;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
          color: #fff;
          line-height: 1.6;
          font-family: "Poppins", sans-serif;
        }
        .about-page h2 {
          color: #ff9800;
          margin-bottom: 15px;
        }
        .about-page h3 {
          margin-top: 20px;
          color: #ffd54f;
        }
        .about-page ul {
          margin: 10px 0 0 20px;
        }
        .about-page li {
          margin: 5px 0;
        }
      `}</style>

      <h2>ℹ️ About Movie Mart</h2>
      <p>
        Welcome to <strong>Movie Mart</strong> – your one-stop destination for booking
        movie tickets online. We aim to make your movie experience smoother,
        faster, and more enjoyable. 
      </p>

      <h3>🎯 Our Mission</h3>
      <p>
        To provide a seamless, secure, and user-friendly movie ticket booking
        platform where users can explore trending movies, check ratings, and
        book tickets in just a few clicks.
      </p>

      <h3>🚀 Features</h3>
      <ul>
        <li>Browse the latest movies with ratings & genres.</li>
        <li>Search and filter movies easily.</li>
        <li>Book tickets instantly with real-time availability.</li>
        <li>Secure login & signup for personalized experience.</li>
        <li>Admin panel to manage movies and bookings.</li>
      </ul>

      <h3>🌟 Why Choose Us?</h3>
      <p>
        Movie Mart is not just a ticket booking system – it’s an entire movie
        experience. With our simple interface, we bring movies closer to you.
      </p>
    </div>
  );
}
