import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar"; // Adjust path if needed
import { db } from "../../firebaseConfig";
import { ref, onValue } from "firebase/database";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { useNavigate } from "react-router-dom";

export default function MoviesReportPage() {
  const [movies, setMovies] = useState([]);
  const navigate = useNavigate();

  // Fetch movies from Firebase
  useEffect(() => {
    const moviesRef = ref(db, "movies");
    onValue(moviesRef, (snapshot) => {
      const data = snapshot.val() || {};
      const arr = Object.keys(data).map((id) => ({ id, ...data[id] }));
      setMovies(arr);
    });
  }, []);

  // Get movie status based on release date and current date
  const getMovieStatus = (releaseDate) => {
    if (!releaseDate) return "Unknown";
    
    const today = new Date();
    const release = new Date(releaseDate);
    
    // Reset time part for accurate date comparison
    today.setHours(0, 0, 0, 0);
    release.setHours(0, 0, 0, 0);
    
    if (release > today) {
      return "Upcoming";
    } else {
      return "Active";
    }
  };

  // CSV download function
  const downloadCSV = () => {
    if (movies.length === 0) return;

    const header = ["Title", "Genre", "Language", "Duration", "Release Date", "Status"];
    const rows = movies.map((m) => [
      m.title,
      m.genre,
      m.language,
      m.duration,
      m.releaseDate,
      getMovieStatus(m.releaseDate)
    ]);

    let csvContent =
      "data:text/csv;charset=utf-8," +
      [header, ...rows].map((e) => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "movies_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PDF export function
  const exportPDF = () => {
    if (movies.length === 0) return;

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Movies Report", 14, 22);

    const tableColumn = ["Title", "Genre", "Language", "Duration", "Release Date", "Status"];
    const tableRows = movies.map((m) => [
      m.title,
      m.genre,
      m.language,
      m.duration,
      m.releaseDate,
      getMovieStatus(m.releaseDate)
    ]);

    doc.autoTable({
      startY: 30,
      head: [tableColumn],
      body: tableRows,
      theme: "grid",
      headStyles: { fillColor: [51, 168, 165] },
      styles: { fontSize: 10 },
      didDrawCell: (data) => {
        // Color status cells in PDF
        if (data.section === 'body' && data.column.index === 5) {
          const status = tableRows[data.row.index][5];
          if (status === 'Active') {
            doc.setFillColor(16, 185, 129); // Green
          } else if (status === 'Upcoming') {
            doc.setFillColor(245, 158, 11); // Orange
          } else {
            doc.setFillColor(107, 114, 128); // Gray
          }
          doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
          doc.setTextColor(255, 255, 255);
          doc.text(status, data.cell.x + 2, data.cell.y + 7);
          return false; // Prevent default text rendering
        }
      }
    });

    doc.save("movies_report.pdf");
  };

  const activePath = "/admin/moviesreport";

  return (
    <div style={containerStyle}>
      <Sidebar activePath={activePath} />
      <div style={mainContentStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <button 
            onClick={() => navigate("/admin/ReportsAnalytics")}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            ← Back to Reports
          </button>
          <h2 style={headingStyle}>📄 Movies Report</h2>
        </div>
        <div style={buttonsContainerStyle}>
          <button style={addButtonStyle} onClick={downloadCSV}>⬇️ Download CSV</button>
          <button style={pdfButtonStyle} onClick={exportPDF}>📄 Export PDF</button>
        </div>

        <div style={tableContainerStyle}>
          <table style={reportTableStyle}>
            <thead>
              <tr>
                <th style={reportThStyle}>Title</th>
                <th style={reportThStyle}>Genre</th>
                <th style={reportThStyle}>Language</th>
                <th style={reportThStyle}>Duration</th>
                <th style={reportThStyle}>Release Date</th>
                <th style={reportThStyle}>Status</th>
              </tr>
            </thead>
            <tbody>
              {movies.length === 0 ? (
                <tr>
                  <td colSpan={6} style={noMoviesStyle}>No movies available</td>
                </tr>
              ) : (
                movies.map((m) => (
                  <tr key={m.id} style={tableRowStyle}>
                    <td style={reportTdStyle}>{m.title}</td>
                    <td style={reportTdStyle}>{m.genre}</td>
                    <td style={reportTdStyle}>{m.language}</td>
                    <td style={reportTdStyle}>{m.duration}</td>
                    <td style={reportTdStyle}>{m.releaseDate}</td>
                    <td style={getStatusStyle(getMovieStatus(m.releaseDate))}>
                      <span style={statusTextStyle}>
                        {getMovieStatus(m.releaseDate)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Status Legend */}
        <div style={legendStyle}>
          <div style={legendTitleStyle}>Status Legend:</div>
          <div style={legendItemsStyle}>
            <div style={legendItemStyle}>
              <div style={{...statusIndicatorStyle, background: '#10B981'}}></div>
              <span>Active - Currently showing in theaters</span>
            </div>
            <div style={legendItemStyle}>
              <div style={{...statusIndicatorStyle, background: '#F59E0B'}}></div>
              <span>Upcoming - Future release date</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Status style function
const getStatusStyle = (status) => {
  const baseStyle = {
    ...reportTdStyle,
    fontWeight: "600",
    borderRadius: "20px",
    padding: "6px 12px",
    textAlign: "center",
    fontSize: "12px",
    border: "none"
  };

  switch (status) {
    case "Active":
      return {
        ...baseStyle,
        // background: "linear-gradient(135deg, #10B981 0%, #34D399 100%)",
        color: "black",
        boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)",
        padding: "5px"
      };
    case "Upcoming":
      return {
        ...baseStyle,
        background: "linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)",
        color: "white",
        boxShadow: "0 2px 8px rgba(245, 158, 11, 0.3)"
      };
    default:
      return {
        ...baseStyle,
        background: "linear-gradient(135deg, #6B7280 0%, #9CA3AF 100%)",
        color: "white",
        boxShadow: "0 2px 8px rgba(107, 114, 128, 0.3)"
      };
  }
};

// Styles
const containerStyle = {
  display: "flex",
  minHeight: "100vh",
  background: "#e7eaf6"
};

const mainContentStyle = {
  flex: 1,
  padding: "40px 36px",
  marginLeft: "280px",
  background: "linear-gradient(120deg, #f8fbff 75%, #def1ff 100%)"
};

const headingStyle = {
  fontSize: 32,
  fontWeight: "700",
  marginBottom: 28,
  color: "#551975",
  letterSpacing: 1.1
};

const buttonsContainerStyle = {
  display: "flex",
  gap: 16,
  marginBottom: 24
};

const addButtonStyle = {
  background: "linear-gradient(90deg, #33a8a5 0%, #9a60c4 100%)",
  color: "#fff",
  padding: "12px 26px",
  border: "none",
  borderRadius: 8,
  fontSize: 15,
  fontWeight: 600,
  cursor: "pointer",
  boxShadow: "0 2px 8px rgba(51,168,165,0.15)",
  transition: "all 0.2s ease"
};

const pdfButtonStyle = {
  background: "linear-gradient(90deg, #fd7e14 0%, #ee4266 100%)",
  color: "#fff",
  padding: "12px 26px",
  border: "none",
  borderRadius: 8,
  fontSize: 15,
  fontWeight: 600,
  cursor: "pointer",
  boxShadow: "0 2px 8px rgba(238,66,102,0.15)",
  transition: "all 0.2s ease"
};

const tableContainerStyle = {
  borderRadius: "12px",
  overflow: "hidden",
  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
  marginBottom: "24px"
};

const reportTableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  background: "#fff"
};

const reportThStyle = {
  border: "1px solid #e5e7eb",
  padding: "16px 12px",
  textAlign: "left",
  fontSize: "14px",
  fontWeight: "700",
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  color: "white",
  textTransform: "uppercase",
  letterSpacing: "0.5px"
};

const reportTdStyle = {
  border: "1px solid #e5e7eb",
  padding: "14px 12px",
  textAlign: "left",
  fontSize: "14px",
  background: "white"
};

const tableRowStyle = {
  transition: "background-color 0.2s ease"
};

const statusTextStyle = {
  display: "inline-block",
  padding: "2px 0"
};

const noMoviesStyle = {
  textAlign: "center",
  padding: "40px",
  color: "#868686",
  fontStyle: "italic",
  fontSize: "16px"
};

// Legend Styles
const legendStyle = {
  background: "white",
  padding: "16px 20px",
  borderRadius: "8px",
  boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
  border: "1px solid #e5e7eb"
};

const legendTitleStyle = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#374151",
  marginBottom: "12px"
};

const legendItemsStyle = {
  display: "flex",
  gap: "24px",
  flexWrap: "wrap"
};

const legendItemStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  fontSize: "13px",
  color: "#6B7280"
};

const statusIndicatorStyle = {
  width: "12px",
  height: "12px",
  borderRadius: "50%",
  flexShrink: 0
};

// Add hover effects
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    button:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    }
    tr:hover {
      background-color: #f9fafb;
    }
  `;
  document.head.appendChild(style);
}