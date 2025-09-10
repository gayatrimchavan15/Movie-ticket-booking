import React, { useState } from "react";
import Sidebar from "./Sidebar";
import { db } from "../../firebaseConfig";
import { ref as dbRef, push, set } from "firebase/database";

export default function AddCityTheater() {
  const [city, setCity] = useState("");
  const [theaterName, setTheaterName] = useState("");
  const [message, setMessage] = useState("");

  function handleAdd(e) {
    e.preventDefault();
    if (!city || !theaterName) {
      setMessage("Please enter both city and theater name.");
      return;
    }
    const theatersRef = dbRef(db, "theaters");
    const newTheaterRef = push(theatersRef);
    set(newTheaterRef, {
      city,
      name: theaterName
      // Optionally add more fields like address, capacity, screens
    })
      .then(() => {
        setMessage("Theater added successfully!");
        setCity("");
        setTheaterName("");
      })
      .catch(() => setMessage("Error adding theater. Try again."));
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f6f9fc" }}>
      <Sidebar activePath="/admin/addcitytheater" />
      <div style={{ flex: 1, padding: "40px 30px" }}>
        <h2>Add City & Theater</h2>
        <form onSubmit={handleAdd} style={formStyle}>
          <div style={fieldStyle}>
            <label style={labelStyle}>City Name:</label>
            <input
              type="text"
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="e.g. Sangli"
              style={inputStyle}
            />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Theater Name:</label>
            <input
              type="text"
              value={theaterName}
              onChange={e => setTheaterName(e.target.value)}
              placeholder="e.g. SFC Mega Mall"
              style={inputStyle}
            />
          </div>
          <button
            type="submit"
            style={{
              background: "#2c3e50", color: "#fff", padding: "10px 24px",
              border: "none", borderRadius: 5, cursor: "pointer", fontSize: 16, marginTop: 18
            }}
          >
            Add Theater
          </button>
          {message && (
            <div style={{ marginTop: 18, color: message.includes("success") ? "#27ae60" : "#c0392b" }}>
              {message}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

// Internal CSS styles
const formStyle = { maxWidth: 420, marginTop: 28 };
const fieldStyle = { marginBottom: 22 };
const labelStyle = { fontWeight: "bold", marginBottom: 8, display: "block" };
const inputStyle = {
  padding: "8px 12px",
  borderRadius: 4,
  border: "1px solid #d5dae2",
  width: "100%",
  fontSize: 15
};