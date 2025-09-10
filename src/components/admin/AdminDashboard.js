import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import { db } from "../../firebaseConfig";
import { ref, onValue } from "firebase/database";

export default function AdminDashboard() {
  const [movieCount, setMovieCount] = useState(0);
  const [theaterCount, setTheaterCount] = useState(0);
  const [bookingCount, setBookingCount] = useState(0);
  const [userCount, setUserCount] = useState(0);
  const [latestMovies, setLatestMovies] = useState([]);

  useEffect(() => {
    onValue(ref(db, "movies"), snapshot => {
      const data = snapshot.val();
      setMovieCount(data ? Object.keys(data).length : 0);
      setLatestMovies(
        data
          ? Object.values(data)
              .sort((a, b) => b.releaseDate - a.releaseDate)
              .slice(0, 4)
          : []
      );
    });
    onValue(ref(db, "theaters"), snapshot => {
      const data = snapshot.val();
      setTheaterCount(data ? Object.keys(data).length : 0);
    });
    onValue(ref(db, "bookings"), snapshot => {
      const data = snapshot.val();
      setBookingCount(data ? Object.keys(data).length : 0);
    });
    onValue(ref(db, "users"), snapshot => {
      const data = snapshot.val();
      setUserCount(data ? Object.keys(data).length : 0);
    });
  }, []);

  const stats = [
    { label: "Total Movies", value: movieCount },
    { label: "Total Theaters", value: theaterCount },
    { label: "Total Bookings", value: bookingCount },
    { label: "Total Users", value: userCount },
    { label: "Revenue This Month", value: "₹1,10,000" },
    { label: "Pending Approvals", value: 3 }
  ];

  return (
    <div style={outerStyle}>
      <Sidebar activePath="/admin/dashboard" />
      <div style={mainStyle}>
        <h1 style={headerStyle}>Welcome, Admin! 🎉</h1>

        {/* Top Stats */}
        <div style={statsContainerStyle}>
          {stats.map(s => (
            <div
              key={s.label}
              style={statCardStyle}
              onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.05)")}
              onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
            >
              <div style={statValueStyle}>{s.value}</div>
              <div style={statLabelStyle}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Latest Movies Table */}
        <div style={tableSectionStyle}>
          <h2 style={tableHeaderStyle}>Latest Movies Added</h2>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Movie Title</th>
                <th style={thStyle}>Genre</th>
                <th style={thStyle}>Release Date</th>
                <th style={thStyle}>Status</th>
              </tr>
            </thead>
            <tbody>
              {latestMovies.length === 0 ? (
                <tr>
                  <td style={tdEmptyStyle} colSpan={4}>No movies found</td>
                </tr>
              ) : (
                latestMovies.map((movie, i) => (
                  <tr key={movie.title + i} style={rowHoverStyle}>
                    <td style={tdStyle}>{movie.title}</td>
                    <td style={tdStyle}>{movie.genre}</td>
                    <td style={tdStyle}>{movie.releaseDate}</td>
                    <td style={{
                      ...tdStyle,
                      background: movie.status === "Active" ? "#e6ffed" : "#fff5e6"
                    }}>
                      <span style={{
                        color: movie.status === "Active" ? "#27ae60" : "#e67e22",
                        fontWeight: "bold"
                      }}>
                        {movie.status || "Upcoming"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Quick Action Button */}
        {/* <div style={{ marginTop: 34 }}>
          <a href="/admin/add-showtime" style={buttonStyle}>
            + Add Showtime
          </a>
        </div> */}
      </div>
    </div>
  );
}

// ====== CSS Styles ======
const outerStyle = { display: "flex", minHeight: "100vh", background: "#f4f6fa" };
const mainStyle = {
  flex: 1,
  padding: "50px 40px",
  background: "linear-gradient(120deg,#f8f9fd 70%,#eef2fb 100%)"
};
const headerStyle = {
  marginTop: 0, color: "#1e2a38", fontWeight: 700, fontSize: 34,
  textShadow: "0 2px 6px rgba(0,0,0,0.08)"
};
const statsContainerStyle = {
  display: "flex", gap: 30, marginBottom: 36, flexWrap: "wrap"
};
const statCardStyle = {
  background: "linear-gradient(135deg,#ffffff 70%,#e6ecff 100%)",
  padding: "26px 40px",
  borderRadius: 14,
  boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
  textAlign: "center",
  minWidth: "190px",
  border: "1px solid #eef2fb",
  transition: "transform 0.2s ease, box-shadow 0.2s ease",
  cursor: "pointer"
};
const statValueStyle = {
  fontSize: 32, fontWeight: "bold", color: "#3b82f6",
  textShadow: "0 2px 8px rgba(59,130,246,0.2)"
};
const statLabelStyle = {
  fontSize: 16, color: "#6a5af9", marginTop: 8, fontWeight: 600
};
const tableSectionStyle = {
  background: "#fff", borderRadius: 14,
  boxShadow: "0 6px 20px rgba(0,0,0,0.05)",
  padding: "32px", marginTop: "26px", maxWidth: 850
};
const tableHeaderStyle = {
  margin: "8px 0 20px 0", color: "#1e2a38", fontSize: 22, fontWeight: "bold"
};
const tableStyle = {
  width: "100%", borderCollapse: "collapse"
};
const thStyle = {
  background: "#f3f6fc", color: "#333", padding: "13px 10px",
  textAlign: "left", fontSize: 16, borderBottom: "2px solid #e0e6f5"
};
const tdStyle = {
  padding: "12px 9px", borderBottom: "1px solid #edf0f7",
  fontSize: 15, fontWeight: 500, color: "#444"
};
const tdEmptyStyle = {
  ...tdStyle, color: "#9c9caa", textAlign: "center"
};
const rowHoverStyle = { transition: "background 0.2s" };
const buttonStyle = {
  background: "linear-gradient(90deg,#6a5af9,#3b82f6)",
  color: "#fff", padding: "13px 34px",
  fontSize: "17px", fontWeight: 600, borderRadius: "8px",
  textDecoration: "none", boxShadow: "0 4px 18px rgba(59,130,246,0.3)",
  letterSpacing: ".7px", transition: "all 0.2s ease-in-out"
};
