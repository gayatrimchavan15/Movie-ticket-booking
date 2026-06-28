import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { db } from "../firebaseConfig";
import { ref, onValue, set, get, update } from "firebase/database";
import { getAuth } from "firebase/auth";

export default function MovieDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTrailer, setShowTrailer] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);

  const [userRating, setUserRating] = useState(0);
  const [userReview, setUserReview] = useState("");
  const [ratingLoading, setRatingLoading] = useState(false);
  const [movieReviews, setMovieReviews] = useState([]);

  useEffect(() => {
    const movieRef = ref(db, `movies/${id}`);
    onValue(movieRef, (snapshot) => {
      const data = snapshot.val();
      setMovie(data ? { id, ...data } : null);
      setLoading(false);
    });
    // Fetch reviews for this movie
    const reviewsRef = ref(db, `movies/${id}/reviews`);
    onValue(reviewsRef, (snap) => {
      const all = snap.val() || {};
      const reviewsList = Object.values(all);
      setMovieReviews(reviewsList.reverse());
    });
  }, [id]);

  async function submitRating() {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) {
      alert("Please login to rate this movie.");
      navigate("/login");
      return;
    }
    if (userRating <= 0 || userRating > 10 || ratingLoading) return;
    setRatingLoading(true);

    const userId = currentUser.uid;
    const username = currentUser.displayName || "Anonymous";
    const email = currentUser.email || "";
    await set(ref(db, `movies/${id}/reviews/${userId}`), {
      userId,
      username,
      email,
      rating: userRating,
      review: userReview,
      timestamp: Date.now()
    });
    await set(ref(db, `movies/${id}/ratings/${userId}`), userRating);
    // Recalc avg
    const ratingsSnap = await get(ref(db, `movies/${id}/ratings`));
    const ratings = ratingsSnap.val();
    const values = ratings ? Object.values(ratings) : [];
    const sum = values.reduce((acc, r) => acc + Number(r), 0);
    const count = values.length;
    const avg = count ? (sum / count).toFixed(1) : 0;
    await update(ref(db, `movies/${id}`), {
      rating: avg,
      votes: count
    });
    setMovie(prev => ({ ...prev, rating: avg, votes: count }));
    setShowRatingModal(false);
    setUserRating(0);
    setUserReview("");
    setRatingLoading(false);
  }

  function renderStars(r) {
    return <span style={{ color: "#FF4664", fontWeight: "bold" }}>★{"★".repeat(Math.max(0, Math.round(r)-1))} <span style={{ color: "#252", fontWeight: 600 }}>{r}/10</span></span>;
  }

  function shortVotes(votes) {
    if (!votes) return "0";
    if (votes >= 1000) return (votes / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    return votes;
  }

  // Always return proper YouTube embed URL:
  function getYouTubeEmbedUrl(url) {
    if (!url) return "";
    let videoId = "";
    if (url.includes("watch?v=")) {
      videoId = url.split("watch?v=")[1].split("&")[0];
    } else if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1].split(/[?&]/)[0];
    } else if (url.includes("embed/")) {
      videoId = url.split("embed/")[1].split(/[?&]/)[0];
    }
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }
    return url;
  }

  if (loading) return <div style={styles.loading}>Loading...</div>;
  if (!movie)
    return (
      <div style={styles.notFound}>
        Movie not found.<br />
        <button style={styles.goBackBtn} onClick={() => navigate("/movies")}>Go Back</button>
      </div>
    );

  return (
    <div style={styles.wrapper}>
      <div style={styles.heroSection}>
        <div style={styles.mediaContainer}>
          <img
            src={movie.posterUrl || "/default-movie.jpg"}
            alt={movie.title}
            style={styles.poster}
          />
          {movie.trailerUrl && (
            <button
              style={styles.trailerBtn}
              onClick={() => setShowTrailer(true)}
            >
              ▶ Watch Trailer
            </button>
          )}
        </div>
        <div style={styles.detailsBlock}>
          <h1 style={styles.title}>{movie.title}</h1>
          <div style={styles.ratingCardOuter}>
            <div style={styles.ratingCard}>
              <span style={{ color: "#FF4664", fontSize: 25, marginRight: 9 }}>★</span>
              <span style={{ fontWeight: 700, fontSize: 22 }}>{movie.rating || "N/A"}</span>
              <span style={{ fontWeight: 500, color: "#fff", marginLeft: 4 }}>/10</span>
              <span
                style={{
                  marginLeft: 14,
                  color: "#9df3ed",
                  fontWeight: 600,
                  fontSize: 15,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center"
                }}
                onClick={() => setShowAllReviews(true)}
                title="Show all reviews"
              >
                ({shortVotes(movie.votes)} Votes)
                <span style={{ fontSize: 20, marginLeft: 6, color: "#fff" }}>&#8250;</span>
              </span>
            </div>
            <button style={styles.rateBtnMain} onClick={() => {
              const auth = getAuth();
              if (!auth.currentUser) {
                alert("Please login to rate this movie.");
                navigate("/login");
              } else {
                setShowRatingModal(true);
              }
            }}>Rate now</button>
          </div>
          <div style={styles.metadata}>
            {movie.language && <span style={styles.languageBadge}>{movie.language}</span>}
            {movie.genre && <span style={styles.genreBadge}>{movie.genre}</span>}
            {movie.duration && <span style={styles.duration}>{movie.duration}</span>}
          </div>
          <div style={styles.releaseRow}>
            <span style={styles.releaseDate}>{movie.releaseDate ? `Release: ${movie.releaseDate}` : ""}</span>
            <span style={styles.status}>{movie.status ? `Status: ${movie.status}` : ""}</span>
          </div>
          <button onClick={() =>
            navigate("/showtime-selection", { state: { movieId: movie.id, movieTitle: movie.title, userName: "Guest" }})
          } style={styles.bookButton}>
            🎟 Book Tickets
          </button>
        </div>
      </div>

      <div style={styles.aboutSection}>
        <h2 style={styles.aboutTitle}>About the movie</h2>
        <p style={styles.aboutText}>{movie.about || "No description available."}</p>
        <button style={styles.goBackBtn} onClick={() => navigate("/movies")}>⬅ Back to Movies</button>
      </div>

      {showTrailer && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <span style={styles.closeModal} onClick={() => setShowTrailer(false)}>×</span>
            <iframe width="700" height="394"
              src={getYouTubeEmbedUrl(movie.trailerUrl)}
              title="Movie Trailer" frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen style={styles.trailerIframe}
            />
          </div>
        </div>
      )}

      {/* Rating & Review Modal */}
      {showRatingModal && (
        <div style={styles.rateModalOverlay}>
          <div style={styles.rateModalBox}>
            <div style={styles.rateModalHeader}>
              <span>How would you rate this movie?</span>
              <span style={styles.rateModalClose} onClick={() => setShowRatingModal(false)}>&times;</span>
            </div>
            <div style={styles.rateModalBody}>
              <div style={styles.starSliderRow}>
                <span style={styles.star}>★</span>
                <input
                  type="range"
                  min={0}
                  max={10}
                  step={0.1}
                  value={userRating}
                  onChange={e => setUserRating(Number(e.target.value))}
                  style={styles.sliderMain}
                />
                <span style={{ minWidth: 42, marginLeft: 7, fontWeight: "bold" }}>{userRating.toFixed(1)}/10</span>
              </div>
              <div style={{ margin: "18px 0 4px 0", fontSize: 15, color: "#555", fontWeight: 600 }}>
                Write a review <span style={{ color: "#aaa", fontWeight: 400 }}>(optional)</span>
              </div>
              <textarea
                style={styles.textAreaMain}
                placeholder="Your opinion matters"
                value={userReview}
                onChange={e => setUserReview(e.target.value)}
                maxLength={400}
              />
              <button
                style={{
                  ...styles.rateSubmitBtn,
                  background: userRating >= 1
                    ? "linear-gradient(135deg,#ff4664,#8882ea)"
                    : "#c0c0c0",
                  cursor: userRating >= 1 ? "pointer" : "not-allowed",
                }}
                disabled={userRating < 1 || ratingLoading}
                onClick={submitRating}
              >
                {ratingLoading ? "Saving..." : "Submit Rating"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ALL REVIEWS MODAL */}
      {showAllReviews && (
        <div style={styles.allReviewsOverlay}>
          <div style={styles.allReviewsBox}>
            <div style={styles.allReviewsHeader}>
              <span>User Reviews & Ratings</span>
              <span style={styles.rateModalClose} onClick={() => setShowAllReviews(false)}>&times;</span>
            </div>
            <div style={{ maxHeight: "70vh", overflowY: "auto" }}>
              {movieReviews.length === 0 && (
                <div style={{ textAlign: "center", color: "#888", margin: "36px 0" }}>
                  No reviews or ratings yet.
                </div>
              )}
              {movieReviews.map((rev, idx) => (
                <div key={rev.userId + "-" + idx} style={styles.reviewCard}>
                  <div style={styles.reviewTopRow}>
                    <span style={{ fontWeight: 700, color: "#FF4664", fontSize: 15 }}>{rev.username || "Anonymous"}</span>
                    <span style={{ color: "#888", fontSize: 13, marginLeft: 7 }}>{rev.email || ""}</span>
                    <span style={{ marginLeft: "auto", fontWeight: 700 }}>{renderStars(rev.rating)}</span>
                  </div>
                  {rev.review && (
                    <div style={{ marginTop: 8, fontSize: 15 }}>
                      <span style={{ color: "#888", fontWeight: 600, fontSize: 14 }}>Review: </span>
                      {rev.review}
                    </div>
                  )}
                  <div style={{ textAlign: "right", fontSize: "12px", color: "#bbb", marginTop: "2px" }}>
                    {rev.timestamp ? new Date(rev.timestamp).toLocaleString("en-IN") : ""}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  wrapper: { fontFamily: "Arial, sans-serif", background: "#f7f7fb", color: "#2e2e38", padding: "20px" },
  heroSection: { display: "flex", gap: "26px", background: "linear-gradient(135deg, #191d2b 70%, #32385b)", borderRadius: "16px", padding: "28px 36px", color: "#fff", boxShadow: "0 5px 22px #191d2b40" },
  mediaContainer: { flex: "0 0 260px", display: "flex", flexDirection: "column", alignItems: "center", position: "relative" },
  poster: { width: "260px", borderRadius: "12px", boxShadow: "0 0 12px #191d2b9c", objectFit: "cover" },
  trailerBtn: { position: "absolute", bottom: "23px", left: "50%", transform: "translateX(-50%)", background: "linear-gradient(90deg,#ff4664,#fc6d8c)", color: "#fff", padding: "11px 28px", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "bold", fontSize: "16px", boxShadow: "0 2px 10px #ff466479"},
  detailsBlock: { flex: 1, minWidth: "240px", paddingTop: "4px" },
  title: { fontSize: "2.5rem", marginBottom: "8px", fontWeight: "900", letterSpacing: "1.5px" },
  ratingCardOuter: { display: "flex", alignItems: "center", gap: "14px", marginBottom: 18 },
  ratingCard: { background: "#222", color: "#fff", borderRadius: "14px", display: "flex", alignItems: "center", fontSize: "18px", fontWeight: "600", boxShadow: "0 3px 10px #1214154d", padding: "8px 18px", marginRight: "15px" },
  rateBtnMain: { marginLeft: 10, background: "#fff", color: "#232232", fontWeight: "bold", borderRadius: "8px", border: "none", padding: "10px 22px", fontSize: "17px", cursor: "pointer", boxShadow: "0 2px 10px #12141524" },
  metadata: { marginTop: "4px", display: "flex", gap: "9px" },
  languageBadge: { background: "#29326a", color: "#fff", padding: "4px 14px", borderRadius: "14px", fontSize: "0.94rem", fontWeight: "700" },
  genreBadge: { background: "#50429e", color: "#fff", padding: "4px 14px", borderRadius: "14px", fontSize: "0.94rem", fontWeight: "700" },
  duration: { fontSize: "1.09rem", color: "#ffd494", background: "#262e51", borderRadius: "14px", padding: "3px 10px", fontWeight: "700" },
  releaseRow: { marginTop: "10px", fontSize: "1.02rem", color: "#ffd494" },
  releaseDate: { marginRight: "22px" },
  status: { color: "#42df67", fontWeight: "bold" },
  bookButton: { marginTop: "16px", background: "linear-gradient(90deg,#42df67 50%,#00bcd4 100%)", color: "#222", border: "none", padding: "12px 26px", borderRadius: "10px", cursor: "pointer", fontWeight: "900", fontSize: "17px", boxShadow: "0 2px 10px #42df6722" },
  aboutSection: { marginTop: "36px", background: "#fff", padding: "24px 32px", borderRadius: "14px", boxShadow: "0 3px 17px #32385b1c", maxWidth: "900px", margin: "36px auto 0 auto" },
  aboutTitle: { fontSize: "1.5rem", marginBottom: "10px", color: "#191d2b", fontWeight: "700" },
  aboutText: { lineHeight: 1.65, color: "#222", fontSize: "16.7px" },
  goBackBtn: { marginTop: "10px", background: "linear-gradient(90deg,#8882ea,#ff4664)", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "9px", cursor: "pointer", fontWeight: "bold", fontSize: "17px", marginBottom: "2px" },
  modalOverlay: { position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(25,29,43,0.92)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99999 },
  modalContent: { position: "relative", background: "#191d2b", padding: "18px", borderRadius: "16px", boxShadow: "0 0 22px #191d2b90" },
  closeModal: { position: "absolute", top: "7px", right: "14px", fontSize: "2.2rem", color: "#fff", cursor: "pointer" },
  trailerIframe: { borderRadius: "10px", width: "700px", height: "394px", border: "none" },
  rateModalOverlay: { position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(25,29,43,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999999 },
  rateModalBox: { background: "#fff", borderRadius: "18px", width: "430px", maxWidth: "95vw", padding: "20px 32px 24px 32px", boxShadow: "0 8px 28px #ff46644a", fontFamily: "Arial,sans-serif" },
  rateModalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: "bold", fontSize: "1.3rem", marginBottom: "8px", color: "#FF4664" },
  rateModalClose: { cursor: "pointer", fontSize: "2rem", color: "#888", fontWeight: "700" },
  rateModalBody: {},
  starSliderRow: { display: "flex", alignItems: "center", gap: "11px", marginBottom: "12px", marginTop: "12px" },
  star: { color: "#FF4664", fontSize: "2.1rem" },
  sliderMain: { flex: 1, accentColor: "#FF4664" },
  textAreaMain: { width: "100%", borderRadius: "13px", border: "2.5px solid #eeeeee", padding: "12px", fontSize: "15px", minHeight: "68px", background: "#fdfdfd", color: "#323232", resize: "vertical", marginBottom: "13px", marginTop: "9px" },
  rateSubmitBtn: { marginTop: "14px", width: "100%", padding: "13px", fontSize: "18px", border: "none", borderRadius: "10px", color: "#fff", fontWeight: "bold", boxShadow: "0 2px 8px #ff466479" },
  allReviewsOverlay: { position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(25,29,43,0.89)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999999 },
  allReviewsBox: { background: "#fff", borderRadius: "18px", width: "660px", maxWidth: "99vw", padding: "24px 16px 24px 25px", boxShadow: "0 8px 28px #23223222" },
  allReviewsHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", fontWeight: "bold", fontSize: "1.3rem", marginBottom: "12px", color: "#ff4664" },
  reviewCard: { background: "#fff", padding: "17px 13px", borderRadius: "10px", boxShadow: "0 2px 9px #e4e4e7", margin: "0 0 17px 0" },
  reviewTopRow: { display: "flex", alignItems: "center", gap: "11px", fontSize: "15px" },
  loading: { padding: "28px", textAlign: "center", fontSize: "19px", fontWeight: "700" },
  notFound: { padding: "28px", textAlign: "center", fontSize: "19px" }
};
