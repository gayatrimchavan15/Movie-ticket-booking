// src/components/AdminDashboard.js
import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import { db } from "../../firebaseConfig";
import { ref, onValue, update } from "firebase/database";
import NotificationService from "../../utils/notificationService";

export default function AdminDashboard() {
  const [tab, setTab] = useState("messages"); // messages | reviews
  const [messages, setMessages] = useState({});
  const [replies, setReplies] = useState({});
  const [hoverCard, setHoverCard] = useState(null);
  const [isBtnHover, setIsBtnHover] = useState(null);
  const [reviews, setReviews] = useState([]);

  // Fetch Messages
  useEffect(() => {
    const messagesRef = ref(db, "messages");
    onValue(messagesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setMessages(data);
        const initialReplies = {};
        Object.entries(data).forEach(([id, msg]) => {
          initialReplies[id] = msg.adminReply || "";
        });
        setReplies(initialReplies);
      } else setMessages({});
    });
  }, []);

  // Fetch Reviews
  useEffect(() => {
    const moviesRef = ref(db, "movies");
    onValue(moviesRef, (snapshot) => {
      const data = snapshot.val() || {};
      const allReviews = [];
      Object.entries(data).forEach(([movieId, movie]) => {
        if (movie.reviews) {
          Object.values(movie.reviews).forEach((rev) => {
            allReviews.push({
              email: rev.email,
              rating: rev.rating,
              review: rev.review,
              movieTitle: movie.title,
              userId: rev.userId,
            });
          });
        }
      });
      allReviews.sort((a, b) => b.timestamp - a.timestamp);
      setReviews(allReviews);
    });
  }, []);

  // Save admin reply and send notification to user
  const handleReply = async (id) => {
    const reply = replies[id] || "";
    if (!reply.trim()) return;

    try {
      // Update the message with admin reply
      await update(ref(db, `messages/${id}`), { adminReply: reply });
      
      // Get message details for notification
      const message = messages[id];
      if (message && message.userId) {
        // Send notification to user
        await NotificationService.notifyUserAdminReply({
          userId: message.userId,
          messageId: id,
          reply: reply,
          originalMessage: message.message
        });
      }
      
      // Clear the reply input
      setReplies(prev => ({ ...prev, [id]: "" }));
      
      // Show success message (optional)
      console.log("Reply sent and user notified successfully");
    } catch (error) {
      console.error("Error sending reply:", error);
    }
  };

  const styles = {
    layout: { 
      display: "flex", 
      minHeight: "100vh", 
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", 
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" 
    },
    sidebarContainer: { width: 260 },
    contentContainer: { 
      flexGrow: 1, 
      padding: "30px", 
      background: "rgba(255, 255, 255, 0.95)",
      backdropFilter: "blur(10px)",
      margin: "20px",
      marginLeft: "280px",
      borderRadius: "20px",
      boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
      overflowY: "auto"
    },
    title: { 
      fontSize: "2.5rem", 
      fontWeight: "800", 
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      margin: "0 0 30px 0",
      letterSpacing: "-0.5px"
    },
    tabButtons: { display: "flex", gap: 16, marginBottom: 20 },
    tabButton: (active) => ({
      padding: "12px 24px",
      borderRadius: "12px",
      border: active ? "none" : "2px solid rgba(102, 126, 234, 0.3)",
      cursor: "pointer",
      fontWeight: "600",
      color: active ? "#fff" : "#667eea",
      background: active ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" : "rgba(255, 255, 255, 0.8)",
      transition: "all 0.3s ease",
      boxShadow: active ? "0 4px 15px rgba(102, 126, 234, 0.4)" : "0 2px 8px rgba(0,0,0,0.1)",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
      fontSize: "12px"
    }),
    card: {
      background: "white",
      color: "#374151",
      borderRadius: "16px",
      padding: "24px",
      marginBottom: "20px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
      transition: "all 0.3s ease",
      position: "relative",
      border: "1px solid rgba(255,255,255,0.2)"
    },
    cardHover: { 
      boxShadow: "0 8px 30px rgba(0,0,0,0.15)", 
      transform: "translateY(-2px)" 
    },
    label: { 
      fontWeight: "700", 
      color: "#667eea", 
      fontSize: "12px", 
      display: "inline-block", 
      marginRight: "8px",
      textTransform: "uppercase",
      letterSpacing: "0.5px"
    },
    infoText: { color: "#333", fontWeight: 500 },
    messageText: { fontSize: 15, color: "#444", marginTop: 8, lineHeight: 1.5 },
    adminReply: { fontSize: 14, color: "#5fd78f", fontStyle: "italic", marginTop: 6 },
    textarea: {
      width: "100%",
      minHeight: 70,
      marginTop: 12,
      padding: 12,
      borderRadius: 10,
      border: "1px solid #ddd",
      background: "#f9f9f9",
      color: "#333",
      fontSize: 15,
      fontFamily: "'Segoe UI',Tahoma,Geneva,Verdana,sans-serif",
      outline: "none",
      transition: "border-color 0.3s",
    },
    button: {
      marginTop: 12,
      padding: "10px 32px",
      background: "#e94b67",
      color: "#fff",
      border: "none",
      borderRadius: 10,
      fontSize: 16,
      fontWeight: 600,
      letterSpacing: 0.5,
      cursor: "pointer",
      boxShadow: isBtnHover ? "0 6px 20px rgba(233,75,103,0.5)" : "0 3px 12px rgba(233,75,103,0.3)",
      transition: "all 0.25s",
    },
  };

  return (
    <div style={styles.layout}>
      <div style={styles.sidebarContainer}>
        <Sidebar />
      </div>
      <div style={styles.contentContainer}>
        <div style={styles.title}>💬 Feedback Management</div>

        <div style={styles.tabButtons}>
          <button style={styles.tabButton(tab === "messages")} onClick={() => setTab("messages")}>Messages / Inquiries</button>
          <button style={styles.tabButton(tab === "reviews")} onClick={() => setTab("reviews")}>Reviews & Ratings</button>
        </div>

        {tab === "messages" && (
          <>
            {Object.keys(messages).length === 0 ? (
              <p style={{ textAlign: "center", color: "#888", fontSize: 16, fontStyle: "italic" }}>No messages yet.</p>
            ) : (
              Object.entries(messages)
                .sort((a, b) => b[1].timestamp - a[1].timestamp)
                .map(([id, msg]) => (
                  <div
                    key={id}
                    style={{ ...styles.card, ...(hoverCard === id ? styles.cardHover : {}) }}
                    onMouseEnter={() => setHoverCard(id)}
                    onMouseLeave={() => setHoverCard(null)}
                  >
                    <div>
                      <span style={styles.label}>Email:</span>
                      <span style={styles.infoText}>{msg.email}</span>
                    </div>
                    <div>
                      <span style={styles.label}>Mobile:</span>
                      <span style={styles.infoText}>{msg.mobile || "N/A"}</span>
                    </div>
                    <div style={styles.messageText}>
                      <strong>Message:</strong> {msg.message}
                    </div>
                    <div style={styles.adminReply}>
                      <strong>Admin Reply:</strong> {msg.adminReply || "No reply yet"}
                    </div>
                    <textarea
                      style={styles.textarea}
                      placeholder="Write a reply..."
                      value={replies[id] || ""}
                      onChange={(e) => setReplies(prev => ({ ...prev, [id]: e.target.value }))}
                    />
                    <button
                      style={styles.button}
                      onMouseEnter={() => setIsBtnHover(id)}
                      onMouseLeave={() => setIsBtnHover(null)}
                      onClick={() => handleReply(id)}
                    >
                      Save Reply
                    </button>
                  </div>
                ))
            )}
          </>
        )}

        {tab === "reviews" && (
          <>
            {reviews.length === 0 ? (
              <p style={{ textAlign: "center", color: "#888", fontSize: 16, fontStyle: "italic" }}>No reviews yet.</p>
            ) : (
              reviews.map((rev, idx) => (
                <div
                  key={rev.userId + "-" + idx}
                  style={{ ...styles.card, ...(hoverCard === idx ? styles.cardHover : {}) }}
                  onMouseEnter={() => setHoverCard(idx)}
                  onMouseLeave={() => setHoverCard(null)}
                >
                  <div>
                    <span style={styles.label}>Email:</span>
                    <span style={styles.infoText}>{rev.email}</span>
                  </div>
                  <div>
                    <span style={styles.label}>Movie:</span>
                    <span style={styles.infoText}>{rev.movieTitle}</span>
                  </div>
                  <div style={styles.messageText}>
                    <strong>Rating:</strong> {rev.rating}/10
                  </div>
                  {rev.review && (
                    <div style={styles.messageText}>
                      <strong>Review:</strong> {rev.review}
                    </div>
                  )}
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}
