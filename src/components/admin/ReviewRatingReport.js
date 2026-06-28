import React, { useState, useEffect } from "react";
import { db } from "../../firebaseConfig";
import { ref, onValue } from "firebase/database";
import Sidebar from "./Sidebar";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

export default function ReviewRatingReport() {
  const [reviews, setReviews] = useState([]);
  const [reportData, setReportData] = useState({
    totalReviews: 0,
    averageRating: 0,
    ratingDistribution: {},
    topMovies: [],
    recentReviews: []
  });
  const [timeRange, setTimeRange] = useState("all");
  const [exportLoading, setExportLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // ✅ Fetch reviews from Firebase
  useEffect(() => {
    const moviesRef = ref(db, "movies");
    const unsubscribe = onValue(moviesRef, (snapshot) => {
      const data = snapshot.val() || {};
      const allReviews = [];

      Object.entries(data).forEach(([movieId, movie]) => {
        const title = movie.title || "Untitled Movie";
        if (movie.reviews) {
          Object.entries(movie.reviews).forEach(([reviewId, rev]) => {
            allReviews.push({
              id: reviewId,
              movieId,
              movieTitle: title,
              email: rev.email || "Unknown",
              rating: parseInt(rev.rating) || 0,
              review: rev.review || "",
              timestamp: rev.timestamp || Date.now()
            });
          });
        }
      });

      allReviews.sort((a, b) => b.timestamp - a.timestamp);
      setReviews(allReviews);
      generateReport(allReviews, timeRange);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [timeRange]);

  // ✅ Generate report
  const generateReport = (reviewsData, range) => {
    let filtered = reviewsData;
    if (range !== "all") {
      const now = Date.now();
      const limit =
        range === "week" ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
      filtered = reviewsData.filter((r) => r.timestamp > now - limit);
    }

    const totalReviews = filtered.length;
    const averageRating =
      totalReviews > 0
        ? (filtered.reduce((s, r) => s + r.rating, 0) / totalReviews).toFixed(1)
        : 0;

    const ratingDistribution = {};
    filtered.forEach((r) => {
      ratingDistribution[r.rating] = (ratingDistribution[r.rating] || 0) + 1;
    });

    const movieStats = {};
    filtered.forEach((r) => {
      if (!movieStats[r.movieTitle]) {
        movieStats[r.movieTitle] = { ratings: [], count: 0 };
      }
      movieStats[r.movieTitle].ratings.push(r.rating);
      movieStats[r.movieTitle].count++;
    });

    const topMovies = Object.entries(movieStats)
      .map(([title, stats]) => ({
        title,
        avg: (
          stats.ratings.reduce((a, b) => a + b, 0) / stats.ratings.length
        ).toFixed(1),
        count: stats.count
      }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 10);

    setReportData({
      totalReviews,
      averageRating,
      ratingDistribution,
      topMovies,
      recentReviews: filtered.slice(0, 10)
    });
  };

  // Export functions
  const exportToExcel = () => {
    setExportLoading(true);
    
    const worksheetData = reviews.map((review, index) => ({
      "S.No": index + 1,
      "Movie Title": review.movieTitle,
      "Rating": review.rating,
      "Review": review.review,
      "User Email": review.email,
      "Date": new Date(review.timestamp).toLocaleDateString(),
      "Time": new Date(review.timestamp).toLocaleTimeString()
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reviews Report");
    
    worksheet['!cols'] = [
      { wch: 8 }, { wch: 25 }, { wch: 10 }, { wch: 40 }, 
      { wch: 25 }, { wch: 12 }, { wch: 12 }
    ];
    
    XLSX.writeFile(workbook, `Reviews_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    setExportLoading(false);
  };

  const exportToCSV = () => {
    setExportLoading(true);
    const headers = ["Movie Title", "Rating", "Review", "User Email", "Date"];
    const csvContent = [
      headers.join(","),
      ...reviews.map((r) =>
        [
          `"${r.movieTitle}"`,
          r.rating,
          `"${r.review}"`,
          `"${r.email}"`,
          new Date(r.timestamp).toLocaleDateString()
        ].join(",")
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Reviews_Report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    setExportLoading(false);
  };

  const exportToPDF = () => {
    setExportLoading(true);
    
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.setTextColor(239, 68, 68);
    doc.text("⭐ Review & Rating Analytics Report", 14, 22);
    
    // Summary
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 35);
    doc.text(`Time Range: ${timeRange === "all" ? "All Time" : timeRange === "week" ? "Last 7 Days" : "Last 30 Days"}`, 14, 42);
    doc.text(`Total Reviews: ${reportData.totalReviews}`, 14, 49);
    doc.text(`Average Rating: ${reportData.averageRating}/5`, 14, 56);

    // Top Movies Table
    const tableColumn = ["Rank", "Movie Title", "Avg Rating", "Total Reviews"];
    const tableRows = reportData.topMovies.slice(0, 10).map((movie, index) => [
      `#${index + 1}`,
      movie.title,
      `${movie.avg}/5`,
      movie.count.toString()
    ]);

    doc.autoTable({
      startY: 65,
      head: [tableColumn],
      body: tableRows,
      theme: "grid",
      headStyles: { 
        fillColor: [239, 68, 68],
        textColor: 255,
        fontStyle: 'bold'
      },
      styles: { 
        fontSize: 9,
        cellPadding: 3
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      }
    });

    doc.save(`Reviews_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    setExportLoading(false);
  };

  const goBack = () => {
    navigate("/admin/ReportsAnalytics");
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <Sidebar activePath="/admin/reviewratingreport" />
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Loading Review Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Sidebar activePath="/admin/reviewratingreport" />

      <div style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <button style={styles.backButton} onClick={goBack}>
              ← Back to Reports
            </button>
            <h1 style={styles.title}>⭐ Review & Rating Analytics</h1>
            <p style={styles.subtitle}>
              Comprehensive customer feedback and movie rating insights
            </p>
          </div>
          
          <div style={styles.headerActions}>
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              style={styles.timeFilter}
            >
              <option value="all">All Time</option>
              <option value="month">Last 30 Days</option>
              <option value="week">Last 7 Days</option>
            </select>
            <button style={styles.excelButton} onClick={exportToExcel} disabled={exportLoading}>
              {exportLoading ? "⏳ Generating..." : "📊 Export Excel"}
            </button>
            <button style={styles.csvButton} onClick={exportToCSV} disabled={exportLoading}>
              {exportLoading ? "⏳ Generating..." : "📄 Export CSV"}
            </button>
            <button style={styles.pdfButton} onClick={exportToPDF} disabled={exportLoading}>
              {exportLoading ? "⏳ Generating..." : "🖨️ Export PDF"}
            </button>
          </div>
        </div>

        {/* Overall Stats */}
        <div style={styles.overallStats}>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>⭐</div>
            <div style={styles.statContent}>
              <div style={styles.statNumber}>{reportData.totalReviews}</div>
              <div style={styles.statLabel}>Total Reviews</div>
            </div>
          </div>
          
          <div style={styles.statCard}>
            <div style={styles.statIcon}>📊</div>
            <div style={styles.statContent}>
              <div style={styles.statNumber}>{reportData.averageRating}/5</div>
              <div style={styles.statLabel}>Average Rating</div>
            </div>
          </div>
          
          <div style={styles.statCard}>
            <div style={styles.statIcon}>🎬</div>
            <div style={styles.statContent}>
              <div style={styles.statNumber}>{reportData.topMovies.length}</div>
              <div style={styles.statLabel}>Rated Movies</div>
            </div>
          </div>
          
          <div style={styles.statCard}>
            <div style={styles.statIcon}>🌟</div>
            <div style={styles.statContent}>
              <div style={styles.statNumber}>
                {Object.values(reportData.ratingDistribution).reduce((a, b) => Math.max(a, b), 0)}
              </div>
              <div style={styles.statLabel}>Most Common Rating</div>
            </div>
          </div>
        </div>

        {/* Rating Distribution */}
        <div style={styles.section}>
          <div style={styles.widget}>
            <h4 style={styles.widgetTitle}>📈 Rating Distribution</h4>
            <div style={styles.ratingDistribution}>
              {[5, 4, 3, 2, 1].map(rating => {
                const count = reportData.ratingDistribution[rating] || 0;
                const percentage = reportData.totalReviews > 0 ? 
                  ((count / reportData.totalReviews) * 100).toFixed(1) : 0;
                
                return (
                  <div key={rating} style={styles.ratingItem}>
                    <div style={styles.ratingStars}>
                      {"⭐".repeat(rating)} ({rating})
                    </div>
                    <div style={styles.ratingBar}>
                      <div 
                        style={{
                          ...styles.ratingBarFill,
                          width: `${percentage}%`,
                          background: rating >= 4 ? "#10B981" : 
                                     rating >= 3 ? "#F59E0B" : "#EF4444"
                        }}
                      />
                    </div>
                    <div style={styles.ratingCount}>
                      {count} ({percentage}%)
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Top Rated Movies */}
        <div style={styles.section}>
          <div style={styles.widget}>
            <h4 style={styles.widgetTitle}>🏆 Top Rated Movies</h4>
            {reportData.topMovies.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>⭐</div>
                <h3 style={styles.emptyTitle}>No Movie Ratings Available</h3>
                <p style={styles.emptyText}>No movie ratings to display for the selected time range.</p>
              </div>
            ) : (
              <div style={styles.moviesList}>
                {reportData.topMovies.slice(0, 10).map((movie, index) => (
                  <div key={index} style={styles.movieItem}>
                    <div style={styles.movieRank}>#{index + 1}</div>
                    <div style={styles.movieInfo}>
                      <div style={styles.movieTitle}>{movie.title}</div>
                      <div style={styles.movieStats}>
                        <span style={styles.movieRating}>⭐ {movie.avg}/5</span>
                        <span style={styles.movieReviews}>{movie.count} reviews</span>
                      </div>
                    </div>
                    <div style={styles.ratingBadge}>
                      <span style={{
                        ...styles.ratingScore,
                        color: movie.avg >= 4 ? "#10B981" : 
                               movie.avg >= 3 ? "#F59E0B" : "#EF4444"
                      }}>
                        {movie.avg}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Reviews */}
        <div style={styles.section}>
          <div style={styles.widget}>
            <h4 style={styles.widgetTitle}>💬 Recent Reviews</h4>
            {reportData.recentReviews.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>💬</div>
                <h3 style={styles.emptyTitle}>No Recent Reviews</h3>
                <p style={styles.emptyText}>No recent reviews to display.</p>
              </div>
            ) : (
              <div style={styles.reviewsList}>
                {reportData.recentReviews.map((review, index) => (
                  <div key={index} style={styles.reviewItem}>
                    <div style={styles.reviewHeader}>
                      <div style={styles.reviewMovie}>{review.movieTitle}</div>
                      <div style={styles.reviewRating}>
                        {"⭐".repeat(review.rating)} ({review.rating}/5)
                      </div>
                    </div>
                    <div style={styles.reviewText}>
                      "{review.review}"
                    </div>
                    <div style={styles.reviewFooter}>
                      <span style={styles.reviewUser}>{review.email}</span>
                      <span style={styles.reviewDate}>
                        {new Date(review.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Modern Professional Styles
const styles = {
  container: {
    display: "flex",
    minHeight: "100vh",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
  },
  content: {
    flex: 1,
    padding: "30px",
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(10px)",
    margin: "20px",
    marginLeft: "280px",
    borderRadius: "20px",
    boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
    overflowY: "auto"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "30px",
    flexWrap: "wrap",
    gap: "20px"
  },
  title: {
    fontSize: "2.2rem",
    fontWeight: "800",
    background: "linear-gradient(135deg, #EF4444 0%, #F87171 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    margin: "10px 0 5px 0"
  },
  subtitle: {
    fontSize: "1rem",
    color: "#6B7280",
    margin: "0",
    maxWidth: "500px"
  },
  backButton: {
    background: "linear-gradient(135deg, #EF4444 0%, #F87171 100%)",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
    transition: "all 0.2s ease",
    boxShadow: "0 4px 15px rgba(239, 68, 68, 0.3)",
    marginBottom: "10px"
  },
  headerActions: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    flexWrap: "wrap"
  },
  timeFilter: {
    padding: "10px 15px",
    border: "1px solid #E5E7EB",
    borderRadius: "8px",
    background: "white",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer"
  },
  excelButton: {
    background: "linear-gradient(135deg, #10B981 0%, #34D399 100%)",
    color: "#fff",
    padding: "10px 20px",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 4px 15px rgba(16, 185, 129, 0.3)",
    transition: "all 0.2s ease"
  },
  csvButton: {
    background: "linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)",
    color: "#fff",
    padding: "10px 20px",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 4px 15px rgba(59, 130, 246, 0.3)",
    transition: "all 0.2s ease"
  },
  pdfButton: {
    background: "linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)",
    color: "#fff",
    padding: "10px 20px",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 4px 15px rgba(245, 158, 11, 0.3)",
    transition: "all 0.2s ease"
  },
  overallStats: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "20px",
    marginBottom: "30px"
  },
  statCard: {
    background: "white",
    borderRadius: "16px",
    padding: "20px",
    display: "flex",
    alignItems: "center",
    gap: "15px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
    border: "1px solid rgba(255,255,255,0.2)",
    transition: "transform 0.2s ease"
  },
  statIcon: {
    width: "50px",
    height: "50px",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #EF4444 0%, #F87171 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px"
  },
  statContent: {
    flex: 1
  },
  statNumber: {
    fontSize: "1.5rem",
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: "4px"
  },
  statLabel: {
    fontSize: "0.9rem",
    color: "#6B7280",
    fontWeight: "600"
  },
  section: {
    marginBottom: "30px"
  },
  widget: {
    background: "white",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
    border: "1px solid rgba(255,255,255,0.2)"
  },
  widgetTitle: {
    fontSize: "1.1rem",
    fontWeight: "700",
    color: "#1F2937",
    margin: "0 0 20px 0"
  },
  ratingDistribution: {
    display: "flex",
    flexDirection: "column",
    gap: "16px"
  },
  ratingItem: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "12px 0"
  },
  ratingStars: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#1F2937",
    minWidth: "120px"
  },
  ratingBar: {
    flex: 1,
    height: "8px",
    background: "#E5E7EB",
    borderRadius: "4px",
    overflow: "hidden"
  },
  ratingBarFill: {
    height: "100%",
    borderRadius: "4px",
    transition: "width 0.3s ease"
  },
  ratingCount: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#6B7280",
    minWidth: "80px",
    textAlign: "right"
  },
  moviesList: {
    display: "flex",
    flexDirection: "column",
    gap: "16px"
  },
  movieItem: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "16px",
    background: "#F9FAFB",
    borderRadius: "12px",
    border: "1px solid #E5E7EB",
    transition: "all 0.2s ease"
  },
  movieRank: {
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    background: "linear-gradient(135deg, #EF4444 0%, #F87171 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: "700",
    color: "white"
  },
  movieInfo: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "4px"
  },
  movieTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1F2937"
  },
  movieStats: {
    display: "flex",
    gap: "16px"
  },
  movieRating: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#F59E0B"
  },
  movieReviews: {
    fontSize: "14px",
    color: "#6B7280"
  },
  ratingBadge: {
    background: "white",
    padding: "8px 12px",
    borderRadius: "8px",
    border: "2px solid #E5E7EB"
  },
  ratingScore: {
    fontSize: "18px",
    fontWeight: "700"
  },
  reviewsList: {
    display: "flex",
    flexDirection: "column",
    gap: "16px"
  },
  reviewItem: {
    background: "#F9FAFB",
    borderRadius: "12px",
    padding: "20px",
    border: "1px solid #E5E7EB"
  },
  reviewHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px"
  },
  reviewMovie: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1F2937"
  },
  reviewRating: {
    fontSize: "14px",
    color: "#F59E0B"
  },
  reviewText: {
    fontSize: "14px",
    color: "#4B5563",
    lineHeight: "1.5",
    marginBottom: "12px",
    fontStyle: "italic"
  },
  reviewFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  reviewUser: {
    fontSize: "13px",
    color: "#6B7280",
    fontWeight: "500"
  },
  reviewDate: {
    fontSize: "13px",
    color: "#9CA3AF"
  },
  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
    color: "#6B7280"
  },
  emptyIcon: {
    fontSize: "4rem",
    marginBottom: "20px"
  },
  emptyTitle: {
    fontSize: "1.5rem",
    fontWeight: "600",
    marginBottom: "10px",
    color: "#374151"
  },
  emptyText: {
    fontSize: "1rem",
    lineHeight: "1.5"
  },
  loadingContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px"
  },
  spinner: {
    width: "50px",
    height: "50px",
    border: "4px solid rgba(255,255,255,0.3)",
    borderTop: "4px solid #EF4444",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    marginBottom: "20px"
  },
  loadingText: {
    fontSize: "1.1rem",
    color: "#6B7280",
    fontWeight: "500"
  }
};

// Add CSS animations
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    button:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0,0,0,0.15);
    }
    
    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none !important;
    }
    
    .movie-item:hover {
      background: #F3F4F6 !important;
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }
    
    .stat-card:hover {
      transform: translateY(-2px);
    }
  `;
  document.head.appendChild(style);
}
