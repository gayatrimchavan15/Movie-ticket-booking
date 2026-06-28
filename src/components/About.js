import React from "react";

export default function About() {
  const styles = {
    aboutPage: {
      background: "rgba(15, 15, 15, 0.8)",
      borderRadius: "20px",
      padding: "3rem",
      margin: "2rem auto",
      maxWidth: "900px",
      border: "1px solid rgba(255, 107, 53, 0.2)",
      backdropFilter: "blur(10px)",
      fontFamily: "'Inter', sans-serif"
    },

    title: {
      fontSize: "2.5rem",
      fontWeight: "700",
      background: "linear-gradient(45deg, #ff6b35, #ff8e53)",
      backgroundClip: "text",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      marginBottom: "1.5rem",
      textAlign: "center"
    },

    subtitle: {
      fontSize: "1.3rem",
      color: "#ff8e53",
      margin: "2rem 0 1rem",
      fontWeight: "600"
    },

    text: {
      color: "rgba(255, 255, 255, 0.9)",
      lineHeight: "1.7",
      marginBottom: "1.5rem",
      fontSize: "1.1rem"
    },

    featureList: {
      listStyle: "none",
      padding: "0"
    },

    featureItem: {
      color: "rgba(255, 255, 255, 0.9)",
      padding: "0.8rem 0",
      borderBottom: "1px solid rgba(255, 107, 53, 0.1)",
      display: "flex",
      alignItems: "center",
      gap: "1rem",
      fontSize: "1.1rem"
    },

    icon: {
      color: "#ff6b35",
      fontSize: "1.2rem"
    }
  };

  return (
    <div style={styles.aboutPage}>
      <h1 style={styles.title}>About Movie Mart</h1>
      
      <p style={styles.text}>
        Welcome to <strong>Movie Mart</strong> – your ultimate destination for a seamless movie experience. 
        We combine cutting-edge technology with passionate cinema love to bring you the best ticket booking platform.
      </p>

      <h2 style={styles.subtitle}>🎯 Our Mission</h2>
      <p style={styles.text}>
        To revolutionize the way people experience cinema by providing an intuitive, secure, and feature-rich 
        platform that connects movie lovers with their favorite films effortlessly.
      </p>

      <h2 style={styles.subtitle}>🚀 What We Offer</h2>
      <ul style={styles.featureList}>
        <li style={styles.featureItem}>
          <span style={styles.icon}>🎬</span>
          <span>Comprehensive movie database with real-time updates</span>
        </li>
        <li style={styles.featureItem}>
          <span style={styles.icon}>⭐</span>
          <span>Detailed ratings, reviews, and genre filtering</span>
        </li>
        <li style={styles.featureItem}>
          <span style={styles.icon}>💻</span>
          <span>Seamless booking experience across all devices</span>
        </li>
        <li style={styles.featureItem}>
          <span style={styles.icon}>🔒</span>
          <span>Secure authentication and personalized user profiles</span>
        </li>
        <li style={styles.featureItem}>
          <span style={styles.icon}>🏙️</span>
          <span>City-based theater selection and showtime management</span>
        </li>
      </ul>

      <h2 style={styles.subtitle}>🌟 Why Choose Us?</h2>
      <p style={styles.text}>
        Movie Mart stands out with its user-centric design, robust features, and commitment to excellence. 
        We're not just a booking platform – we're your partner in creating unforgettable cinema memories.
      </p>

      <p style={{...styles.text, textAlign: "center", marginTop: "2rem", color: "#ff8e53"}}>
        Join thousands of satisfied movie enthusiasts who trust Movie Mart for their entertainment needs.
      </p>
    </div>
  );
}