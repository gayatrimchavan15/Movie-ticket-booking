// src/components/UserMessages.js
import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebaseConfig";
import { ref, push, set, onValue } from "firebase/database";

export default function UserMessages() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const messagesRef = ref(db, "messages"); // single node for all messages
    onValue(messagesRef, snapshot => {
      if (snapshot.exists()) {
        const all = Object.entries(snapshot.val()).map(([id, msg]) => ({ id, ...msg }));
        // Filter only messages by this user
        setMessages(all.filter(msg => msg.userId === user.uid));
      } else {
        setMessages([]);
      }
    });
  }, []);

  const handleSend = () => {
    const user = auth.currentUser;
    if (!message.trim() || !user) return;

    const newRef = push(ref(db, "messages")); // save in single node
    set(newRef, {
      userId: user.uid,
      email: user.email,
      message,
      timestamp: Date.now(),
      adminReply: ""
    });
    setMessage("");
  };

  const styles = {
    container: { maxWidth: 700, margin: "40px auto", padding: 24, backgroundColor: "#fefefe", borderRadius: 12, boxShadow: "0 8px 18px rgba(0,0,0,0.1)", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", color: "#333" },
    header: { fontSize: 28, marginBottom: 24, color: "#4a4a8c", fontWeight: "700", textAlign: "center", letterSpacing: "1.2px", textShadow: "0 2px 6px rgba(74,74,140,0.2)" },
    textarea: { width: "100%", height: 110, padding: 14, borderRadius: 10, border: "2px solid #b6b8f2", fontSize: 16, fontFamily: "inherit", boxShadow: "inset 0 2px 5px rgba(182,184,242,0.15)", resize: "vertical", transition: "border-color 0.3s ease" },
    button: { marginTop: 16, backgroundColor: "#5a5dc8", color: "white", border: "none", padding: "12px 28px", borderRadius: 10, fontSize: 16, fontWeight: "600", cursor: "pointer", boxShadow: "0 4px 12px rgba(90,93,200,0.4)", transition: "background-color 0.3s ease" },
    buttonHover: { backgroundColor: "#474cb0" },
    messagesListTitle: { marginTop: 40, fontSize: 22, fontWeight: "600", color: "#555689", borderBottom: "2px solid #b6b8f2", paddingBottom: 6, marginBottom: 18 },
    messageItem: { backgroundColor: "#f7f8ff", borderRadius: 10, padding: 18, marginBottom: 14, boxShadow: "0 3px 8px rgba(74,74,140,0.1)", borderLeft: "6px solid #5a5dc8" },
    messageText: { fontSize: 16, color: "#2e2e4f", marginBottom: 12 },
    adminReply: { fontSize: 14, color: "#6667aa", fontStyle: "italic" }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Messages / Inquiries</h2>

      <textarea
        style={{ ...styles.textarea }}
        placeholder="Write your message..."
        value={message}
        onChange={e => setMessage(e.target.value)}
        onFocus={() => setHover(true)}
        onBlur={() => setHover(false)}
      />
      <br />
      <button
        style={{ ...styles.button, ...(hover ? styles.buttonHover : {}) }}
        onClick={handleSend}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        Send Message
      </button>

      <h3 style={styles.messagesListTitle}>Your Messages</h3>
      {messages.length === 0 && <p>No messages submitted yet.</p>}
      {messages.map(msg => (
        <div key={msg.id} style={styles.messageItem}>
          <p style={styles.messageText}><strong>Message:</strong> {msg.message}</p>
          <p style={styles.adminReply}><strong>Admin Reply:</strong> {msg.adminReply || "No reply yet"}</p>
        </div>
      ))}
    </div>
  );
}
