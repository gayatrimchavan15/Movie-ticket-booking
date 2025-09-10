import React, { useContext } from "react";
import { Link, Outlet } from "react-router-dom";
import { CityContext } from "../context/CityContext";
import "./Layout.css";

export default function Layout() {
  const { selectedCity, setSelectedCity } = useContext(CityContext);

  return (
    <div className="layout">
      <nav className="navbar glass">
        <div className="logo">
          🎬 Movie<span className="highlight">Mart</span>
        </div>

        <ul className="nav-links">
          <li><Link to="/homepage">Home</Link></li>
          <li><Link to="/movies">Movies</Link></li>
          <li><Link to="/about">About</Link></li>
          <li><Link to="/contact">Contact</Link></li>
        </ul>

        <select
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          className="city-selector"
        >
          <option value="Select City" disabled>Select City</option>
          <option value="Sangli">Sangli</option>
          <option value="Kolhapur">Kolhapur</option>
          <option value="Satara">Satara</option>
          <option value="Pune">Pune</option>
          <option value="Solhapur">Solhapur</option>
        </select>

        <div className="nav-buttons">
          <Link to="/login" className="btn login-btn">Login</Link>
          <Link to="/signup" className="btn signup-btn">Sign Up</Link>
        </div>
      </nav>

      <main className="content">
        <Outlet />
      </main>

      <footer className="footer">© 2025 Movie Mart. All rights reserved.</footer>
    </div>
  );
}
