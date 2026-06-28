// src/components/Contact.js
import React, { useState, useEffect } from "react";
import { db, auth } from "../firebaseConfig";
import { ref, push } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";

export default function Contact() {
  const [user, setUser] = useState(null); // logged-in user
  const [message, setMessage] = useState("");

  // Fetch logged-in user info
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!user) {
      alert("You must be logged in to send a message.");
      return;
    }
    if (!message) {
      alert("Please enter a message!");
      return;
    }

    const messageRef = ref(db, "contactMessages");
    push(messageRef, {
      email: user.email,
      message,
      userId: user.uid,
      timestamp: new Date().toISOString(),
      status: "pending",
    });

    alert("Your message has been sent!");
    setMessage("");
  };

  const styles = {
    contactPage: {
      background: "rgba(15, 15, 15, 0.8)",
      borderRadius: "20px",
      padding: "3rem",
      margin: "2rem auto",
      maxWidth: "900px",
      border: "1px solid rgba(255, 107, 53, 0.2)",
      backdropFilter: "blur(10px)",
      fontFamily: "'Inter', sans-serif",
    },
    title: {
      fontSize: "2.5rem",
      fontWeight: "700",
      background: "linear-gradient(45deg, #ff6b35, #ff8e53)",
      backgroundClip: "text",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      marginBottom: "2rem",
      textAlign: "center",
    },
    sectionTitle: {
      fontSize: "1.4rem",
      color: "#ff8e53",
      margin: "2rem 0 1rem",
      fontWeight: "600",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
    },
    text: {
      color: "rgba(255, 255, 255, 0.9)",
      lineHeight: "1.7",
      marginBottom: "1rem",
      fontSize: "1.1rem",
    },
    contactInfo: {
      background: "rgba(255, 107, 53, 0.1)",
      padding: "1.5rem",
      borderRadius: "10px",
      margin: "1.5rem 0",
      borderLeft: "4px solid #ff6b35",
    },
    link: { color: "#ff8e53", textDecoration: "none", fontWeight: "500" },
    input: {
      padding: "0.7rem",
      width: "100%",
      marginBottom: "1rem",
      borderRadius: "8px",
      border: "1px solid #ff8e53",
      outline: "none",
      backgroundColor: "#333",
      color: "#fff",
    },
    textarea: {
      padding: "0.7rem",
      width: "100%",
      marginBottom: "1rem",
      borderRadius: "8px",
      border: "1px solid #ff8e53",
      outline: "none",
      minHeight: "120px",
      backgroundColor: "#333",
      color: "#fff",
    },
    button: {
      padding: "0.7rem 1.5rem",
      backgroundColor: "#ff6b35",
      color: "#fff",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
    },
  };

  return (
    <div style={styles.contactPage}>
      <h1 style={styles.title}>Get In Touch</h1>

      <p style={styles.text}>
        We're here to help you have the best movie experience possible. Please log in to send us a message.
      </p>

      <div style={styles.contactInfo}>
        <h2 style={styles.sectionTitle}>📞 Contact Information</h2>
        <p style={styles.text}>
          <strong>Email:</strong>{" "}
          <a href="mailto:support@moviemart.com" style={styles.link}>
            support@moviemart.com
          </a>
        </p>
        <p style={styles.text}>
          <strong>Phone:</strong>{" "}
          <a href="tel:+919876543210" style={styles.link}>
            +91 98765 43210
          </a>
        </p>
        <p style={styles.text}>
          <strong>Business Hours:</strong> Monday - Sunday, 9:00 AM - 11:00 PM
        </p>
      </div>

      <h2 style={styles.sectionTitle}>💬 Send Us a Message</h2>
      {user ? (
        <form onSubmit={handleSubmit}>
          <input type="email" value={user.email} disabled style={styles.input} />
          <textarea
            placeholder="Your Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            style={styles.textarea}
            required
          />
          <button type="submit" style={styles.button}>
            Send Message
          </button>
        </form>
      ) : (
        <p style={styles.text}>You must be logged in to send a message.</p>
      )}
    </div>
  );
}
