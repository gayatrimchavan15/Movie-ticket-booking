// components/admin/AdminDashboard.jsx
import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import { db } from "../../firebaseConfig";
import { ref, onValue } from "firebase/database";
import { Outlet } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function AdminDashboard() {
  const [movieCount, setMovieCount] = useState(0);
  const [theaterCount, setTheaterCount] = useState(0);
  const [bookingCount, setBookingCount] = useState(0);
  const [userCount, setUserCount] = useState(0);
  const [latestMovies, setLatestMovies] = useState([]);

  // Fetch Realtime Database values
  useEffect(() => {
    onValue(ref(db, "movies"), snapshot => {
      const data = snapshot.val();
      setMovieCount(data ? Object.keys(data).length : 0);
      setLatestMovies(
        data
          ? Object.values(data)
              .sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate))
              .slice(0, 5)
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
    { label: "Movies", value: movieCount, color: "#4f46e5" },
    { label: "Theaters", value: theaterCount, color: "#10b981" },
    { label: "Bookings", value: bookingCount, color: "#f59e0b" },
    { label: "Users", value: userCount, color: "#ef4444" },
  ];

  return (
    <div style={outerStyle}>
      <Sidebar activePath="/admin/dashboard" />
      <div style={mainStyle}>
        <Outlet />
        <h1 style={headerStyle}>🎬 Admin Dashboard</h1>

        {/* Stats Cards */}
        <div style={statsContainerStyle}>
          {stats.map((s) => (
            <div
              key={s.label}
              style={statCardStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-5px)";
                e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)";
              }}
            >
              <div style={{
                width: "60px",
                height: "60px",
                borderRadius: "16px",
                background: `linear-gradient(135deg, ${s.color}20 0%, ${s.color}40 100%)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
                marginBottom: "16px",
                border: `2px solid ${s.color}30`
              }}>
                {s.label === "Movies" ? "🎬" : 
                 s.label === "Theaters" ? "🏢" : 
                 s.label === "Bookings" ? "🎟️" : "👥"}
              </div>
              <div style={{ ...statValueStyle, color: s.color }}>{s.value}</div>
              <div style={statLabelStyle}>{s.label}</div>
              <div style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: s.color,
                boxShadow: `0 0 10px ${s.color}50`
              }}></div>
            </div>
          ))}
        </div>

        {/* Realtime Bar Chart */}
        <div style={chartContainerStyle}>
          <h2 style={chartHeaderStyle}>📊 Realtime Statistics</h2>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={stats} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fill: "#555", fontWeight: 600 }} />
              <YAxis tick={{ fill: "#555", fontWeight: 600 }} />
              <Tooltip />
              <Bar
                dataKey="value"
                fill="#8884d8"
                radius={[8, 8, 0, 0]}
                isAnimationActive={true}
                label={{ position: "top", fill: "#111", fontWeight: 600 }}
              >
                {stats.map((entry, index) => (
                  <cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Latest Movies Table */}
        <div style={tableSectionStyle}>
          <h2 style={tableHeaderStyle}>🎬 Latest Movies Added</h2>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Title</th>
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
                  <tr key={i} style={rowHoverStyle}>
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
      </div>
    </div>
  );
}

// ================== Modern Professional Styles ==================
const outerStyle = { 
  display: "flex", 
  minHeight: "100vh", 
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
};

const mainStyle = { 
  flex: 1, 
  padding: "30px", 
  background: "rgba(255, 255, 255, 0.95)",
  backdropFilter: "blur(10px)",
  margin: "20px",
  marginLeft: "280px",
  borderRadius: "20px",
  boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
  overflowY: "auto"
};

const headerStyle = { 
  fontSize: "2.5rem", 
  fontWeight: "800", 
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  margin: "0 0 30px 0",
  letterSpacing: "-0.5px"
};

const statsContainerStyle = { 
  display: "grid", 
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", 
  gap: "20px", 
  marginBottom: "40px" 
};

const statCardStyle = { 
  background: "white", 
  padding: "24px", 
  borderRadius: "16px", 
  boxShadow: "0 4px 20px rgba(0,0,0,0.08)", 
  border: "1px solid rgba(255,255,255,0.2)",
  transition: "all 0.3s ease", 
  cursor: "pointer",
  position: "relative",
  overflow: "hidden"
};

const statValueStyle = { 
  fontSize: "2rem", 
  fontWeight: "800",
  marginBottom: "8px"
};

const statLabelStyle = { 
  fontSize: "0.9rem", 
  color: "#6B7280", 
  fontWeight: "600",
  textTransform: "uppercase",
  letterSpacing: "0.5px"
};

const chartContainerStyle = { 
  background: "white", 
  borderRadius: "16px", 
  boxShadow: "0 4px 20px rgba(0,0,0,0.08)", 
  padding: "30px", 
  marginBottom: "30px",
  border: "1px solid rgba(255,255,255,0.2)"
};

const chartHeaderStyle = { 
  marginBottom: "25px", 
  fontSize: "1.3rem", 
  fontWeight: "700", 
  color: "#1F2937",
  display: "flex",
  alignItems: "center",
  gap: "10px"
};

const tableSectionStyle = { 
  background: "white", 
  borderRadius: "16px", 
  boxShadow: "0 4px 20px rgba(0,0,0,0.08)", 
  padding: "30px",
  border: "1px solid rgba(255,255,255,0.2)"
};

const tableHeaderStyle = { 
  margin: "0 0 25px 0", 
  color: "#1F2937", 
  fontSize: "1.3rem", 
  fontWeight: "700",
  display: "flex",
  alignItems: "center",
  gap: "10px"
};

const tableStyle = { 
  width: "100%", 
  borderCollapse: "collapse",
  borderRadius: "12px",
  overflow: "hidden"
};

const thStyle = { 
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", 
  color: "white", 
  padding: "16px 12px", 
  textAlign: "left", 
  fontSize: "14px", 
  fontWeight: "700",
  textTransform: "uppercase",
  letterSpacing: "0.5px"
};

const tdStyle = { 
  padding: "16px 12px", 
  borderBottom: "1px solid #E5E7EB", 
  fontSize: "14px", 
  fontWeight: "500", 
  color: "#374151",
  transition: "background-color 0.2s ease"
};

const tdEmptyStyle = { 
  ...tdStyle, 
  color: "#9CA3AF", 
  textAlign: "center",
  fontStyle: "italic",
  padding: "40px"
};

const rowHoverStyle = { 
  transition: "all 0.2s ease", 
  cursor: "default" 
};
