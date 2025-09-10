import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import { db } from "../../firebaseConfig";
import { ref, onValue } from "firebase/database";

// If you want advanced charts, install react-chartjs-2 and chart.js
// import { Bar } from 'react-chartjs-2';

export default function ReportsAnalytics() {
  const [stats, setStats] = useState({
    totalMovies: 0,
    totalBookings: 0,
    totalUsers: 0,
    totalRevenue: 0
  });
  const [topMovies, setTopMovies] = useState([]);
  const [bookingsPerDay, setBookingsPerDay] = useState({});

  useEffect(() => {
    // Movies count
    onValue(ref(db, "movies"), snapshot => {
      const data = snapshot.val();
      setStats(s => ({ ...s, totalMovies: data ? Object.keys(data).length : 0 }));
    });
    // Users count
    onValue(ref(db, "users"), snapshot => {
      const data = snapshot.val();
      setStats(s => ({ ...s, totalUsers: data ? Object.keys(data).length : 0 }));
    });
    // Bookings: for stats
    onValue(ref(db, "bookings"), snapshot => {
      const data = snapshot.val();
      const bookings = data ? Object.values(data) : [];
      setStats(s => ({ ...s, totalBookings: bookings.length }));

      // Sample revenue calculation
      setStats(s => ({ ...s, totalRevenue: bookings.length * 180 })); // Rs 180 per ticket

      // Top Movies by booking count
      const movieCounts = {};
      bookings.forEach(b => {
        const movie = b.movieTitle || b.movie || "Unknown";
        movieCounts[movie] = (movieCounts[movie] || 0) + 1;
      });
      const sortedMovies = Object.entries(movieCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
      setTopMovies(sortedMovies);

      // Bookings per day stat
      const perDay = {};
      bookings.forEach(b => {
        const day = b.date || "Unknown";
        perDay[day] = (perDay[day] || 0) + 1;
      });
      setBookingsPerDay(perDay);
    });
  }, []);

  // Prepare chart data
  const chartLabels = Object.keys(bookingsPerDay);
  const chartData = Object.values(bookingsPerDay);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f3f7fa" }}>
      <Sidebar activePath="/admin/reports-analytics" />
      <div style={{ flex: 1, padding: "40px 30px" }}>
        <h2 style={{ color: "#232946", fontWeight: "bold", fontSize: 30, marginBottom: 34 }}>
          Reports & Analytics
        </h2>
        {/* Stat cards */}
        <div style={{ display: "flex", gap: 38, flexWrap: "wrap", marginBottom: 34 }}>
          <div style={statCardStyle}>
            <div style={{ fontSize: 28, color: "#6246ea", fontWeight: "bold" }}>
              {stats.totalMovies}
            </div>
            <div style={statLabelStyle}>Total Movies</div>
          </div>
          <div style={statCardStyle}>
            <div style={{ fontSize: 28, color: "#3777ee", fontWeight: "bold" }}>
              {stats.totalUsers}
            </div>
            <div style={statLabelStyle}>Total Users</div>
          </div>
          <div style={statCardStyle}>
            <div style={{ fontSize: 28, color: "#27ae60", fontWeight: "bold" }}>
              {stats.totalBookings}
            </div>
            <div style={statLabelStyle}>Total Bookings</div>
          </div>
          <div style={statCardStyle}>
            <div style={{ fontSize: 28, color: "#b59400", fontWeight: "bold" }}>
              ₹{stats.totalRevenue}
            </div>
            <div style={statLabelStyle}>Estimated Revenue</div>
          </div>
        </div>
        {/* Top movies */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ color: "#5145cd", marginBottom: 14, fontWeight: 600, fontSize: 21 }}>
            Top Booked Movies
          </h3>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Movie</th>
                <th style={thStyle}>Bookings</th>
              </tr>
            </thead>
            <tbody>
              {topMovies.length === 0 ? (
                <tr>
                  <td style={tdEmptyStyle} colSpan={2}>No data available</td>
                </tr>
              ) : (
                topMovies.map(([title, count], i) => (
                  <tr key={title + i}>
                    <td style={tdStyle}>{title}</td>
                    <td style={tdStyle}>{count}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Bookings per day chart -- basic div chart */}
        <div>
          <h3 style={{ color: "#5145cd", marginBottom: 14, fontWeight: 600, fontSize: 21 }}>
            Bookings Per Day
          </h3>
          <div style={{
            background: "#fff", borderRadius: 13, boxShadow: "0 2px 10px #6246ea11",
            padding: "24px 26px", maxWidth: 560
          }}>
            {chartLabels.length === 0 ? (
              <div style={tdEmptyStyle}>No data available</div>
            ) : (
              chartLabels.map((day, i) => (
                <div key={day} style={{
                  display: "flex", alignItems: "center", marginBottom: 12
                }}>
                  <div style={{ fontWeight: 600, width: 120, color: "#232946" }}>{day}</div>
                  <div style={{
                    background: "#3777ee", height: 22, width: chartData[i] * 34,
                    borderRadius: 7, marginLeft: 18, color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 600
                  }}>{chartData[i]}</div>
                </div>
              ))
            )}
          </div>
        </div>
        {/* For better visual charts, use react-chartjs-2 Bar/Line chart */}
      </div>
    </div>
  );
}

// Internal CSS styles
const statCardStyle = {
  background: "linear-gradient(95deg,#fff 85%,#d6e6fd 100%)",
  padding: "20px 34px",
  borderRadius: 12,
  boxShadow: "0 4px 16px #d6e6fd33",
  textAlign: "center",
  minWidth: "160px",
  border: "2px solid #e9e7fd"
};
const statLabelStyle = {
  fontSize: 15, color: "#6246ea", marginTop: 7, letterSpacing: ".3px", fontWeight: 500
};
const tableStyle = {
  width: "100%",
  background: "none",
  borderCollapse: "collapse",
  marginTop: 8,
  marginBottom: 6
};
const thStyle = {
  background: "#5145cd",
  color: "#fff",
  padding: "11px 10px",
  textAlign: "left",
  fontSize: 15,
  borderBottom: "2px solid #eaeaea",
  fontWeight: "bold"
};
const tdStyle = {
  padding: "12px 9px",
  borderBottom: "1px solid #edf0f7",
  fontSize: 15,
  fontWeight: 540,
  background: "#fcfcff"
};
const tdEmptyStyle = {
  ...tdStyle,
  color: "#9c98aa",
  fontWeight: "normal",
  fontSize: "16px",
  textAlign: "center"
};