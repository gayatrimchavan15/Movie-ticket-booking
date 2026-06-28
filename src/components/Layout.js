import React, { useContext, useEffect, useState, useRef } from "react";
import { Link, Outlet } from "react-router-dom";
import { CityContext } from "../context/CityContext";
import { db, auth } from "../firebaseConfig";
import { ref, onValue } from "firebase/database";

export default function Layout() {
  const { selectedCity, setSelectedCity } = useContext(CityContext);
  const [cities, setCities] = useState([]);
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef();

  const styles = {
    layout: {
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 50%, #2d1b00 100%)",
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      color: "#ffffff"
    },
    
    navbar: {
      background: "rgba(15, 15, 15, 0.95)",
      backdropFilter: "blur(20px)",
      borderBottom: "1px solid rgba(255, 107, 53, 0.3)",
      padding: "1rem 2rem",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      position: "sticky",
      top: 0,
      zIndex: 1000
    },
    
    logo: {
      fontSize: "1.8rem",
      fontWeight: "700",
      background: "linear-gradient(45deg, #ff6b35, #ff8e53)",
      backgroundClip: "text",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      textDecoration: "none"
    },
    
    navLinks: {
      display: "flex",
      listStyle: "none",
      gap: "2rem",
      alignItems: "center"
    },
    
    navLink: {
      color: "#ffffff",
      textDecoration: "none",
      fontWeight: "500",
      padding: "0.5rem 1rem",
      borderRadius: "8px",
      transition: "all 0.3s ease",
      ":hover": {
        background: "rgba(255, 107, 53, 0.1)",
        color: "#ff6b35"
      }
    },
    
    citySelector: {
      background: "rgba(255, 255, 255, 0.1)",
      border: "1px solid rgba(255, 107, 53, 0.3)",
      color: "#ffffff",
      padding: "0.5rem 1rem",
      borderRadius: "8px",
      fontSize: "0.9rem",
      outline: "none",
      option: {
        background: "#1a1a1a",
        color: "#ffffff"
      }
    },
    
    navButtons: {
      display: "flex",
      gap: "1rem",
      alignItems: "center"
    },
    
    authButton: {
      padding: "0.6rem 1.5rem",
      borderRadius: "8px",
      textDecoration: "none",
      fontWeight: "600",
      fontSize: "0.9rem",
      transition: "all 0.3s ease",
      border: "none",
      cursor: "pointer"
    },
    
    loginBtn: {
      background: "transparent",
      border: "2px solid #ff6b35",
      color: "#ff6b35",
      ":hover": {
        background: "#ff6b35",
        color: "#0f0f0f"
      }
    },
    
    signupBtn: {
      background: "linear-gradient(45deg, #ff6b35, #ff8e53)",
      color: "#0f0f0f",
      border: "none",
      ":hover": {
        transform: "translateY(-2px)",
        boxShadow: "0 5px 15px rgba(255, 107, 53, 0.4)"
      }
    },
    
    profileContainer: {
      position: "relative",
      display: "inline-block"
    },
    
    profileIcon: {
      background: "linear-gradient(45deg, #ff6b35, #ff8e53)",
      width: "40px",
      height: "40px",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      fontSize: "1.2rem",
      transition: "all 0.3s ease",
      ":hover": {
        transform: "scale(1.1)"
      }
    },
    
    profileDropdown: {
      position: "absolute",
      top: "50px",
      right: "0",
      background: "rgba(26, 26, 26, 0.95)",
      backdropFilter: "blur(20px)",
      border: "1px solid rgba(255, 107, 53, 0.3)",
      borderRadius: "8px",
      overflow: "hidden",
      minWidth: "160px",
      zIndex: 1000
    },
    
    dropdownItem: {
      display: "block",
      padding: "0.8rem 1rem",
      color: "#ffffff",
      textDecoration: "none",
      background: "transparent",
      border: "none",
      width: "100%",
      textAlign: "left",
      cursor: "pointer",
      transition: "all 0.3s ease",
      fontSize: "0.9rem",
      ":hover": {
        background: "rgba(255, 107, 53, 0.1)",
        color: "#ff6b35"
      }
    },
    
    content: {
      flex: "1",
      minHeight: "calc(100vh - 140px)"
    },
    
    footer: {
      background: "rgba(15, 15, 15, 0.95)",
      borderTop: "1px solid rgba(255, 107, 53, 0.3)",
      color: "#ffffff",
      textAlign: "center",
      padding: "1.5rem",
      fontSize: "0.9rem"
    }
  };

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });

    const theatersRef = ref(db, "theaters");
    const unsubscribeDB = onValue(theatersRef, (snapshot) => {
      if (snapshot.exists()) {
        const citySet = new Set();
        Object.values(snapshot.val()).forEach((theater) => {
          if (theater.city) citySet.add(theater.city);
        });
        setCities(Array.from(citySet));
      } else setCities([]);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeDB();
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await auth.signOut();
    setShowDropdown(false);
    window.location.reload();
  };

  return (
    <div style={styles.layout}>
      <nav style={styles.navbar}>
        <Link to="/homepage" style={styles.logo}>🎬 MovieMart</Link>

        <ul style={styles.navLinks}>
          <li><Link to="/homepage" style={styles.navLink}>Home</Link></li>
          <li><Link to="/movies" style={styles.navLink}>Movies</Link></li>
          <li><Link to="/about" style={styles.navLink}>About</Link></li>
          <li><Link to="/contact" style={styles.navLink}>Contact</Link></li>
        </ul>

        <select
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          style={styles.citySelector}
        >
          <option value="Select City" disabled>Select City</option>
          {cities.map((city) => (
            <option key={city} value={city} style={styles.citySelector.option}>
              {city}
            </option>
          ))}
        </select>

        <div style={styles.navButtons}>
          {user ? (
            <div style={styles.profileContainer} ref={dropdownRef}>
              <div
                style={styles.profileIcon}
                onClick={() => setShowDropdown(!showDropdown)}
              >
                👤
              </div>

              {showDropdown && (
                <div style={styles.profileDropdown}>
                  <Link 
                    to="/user" 
                    style={styles.dropdownItem}
                    onClick={() => setShowDropdown(false)}
                  >
                    Dashboard
                  </Link>
                  <button 
                    onClick={handleLogout}
                    style={styles.dropdownItem}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" style={{...styles.authButton, ...styles.loginBtn}}>
                Login
              </Link>
              <Link to="/signup" style={{...styles.authButton, ...styles.signupBtn}}>
                Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>

      <main style={styles.content}><Outlet /></main>
      
      <footer style={styles.footer}>
        © 2025 Movie Mart. All rights reserved. | Cinema experiences reimagined
      </footer>
    </div>
  );
}