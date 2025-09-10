// src/components/Signup.js
import React, { useState } from "react";
import { auth, db } from "../firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { ref, set } from "firebase/database";
import { useNavigate } from "react-router-dom";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await set(ref(db, "users/" + user.uid), {
        email: email,
        role: role,
      });

      setSuccess("Signup successful! Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 1500);

      setEmail("");
      setPassword("");
      setRole("user");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-container">
        <h2 className="signup-heading">✨ Create Account</h2>
        <p className="signup-subtitle">Join us and book your favorite movies</p>

        {error && <p className="signup-error">{error}</p>}
        {success && <p className="signup-success">{success}</p>}

        <form onSubmit={handleSignup} className="signup-form">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <select value={role} onChange={(e) => setRole(e.target.value)} required>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>

          <button type="submit">Sign Up</button>
        </form>

        <p className="login-link">
          Already have an account?{" "}
          <span onClick={() => navigate("/login")}>Login</span>
        </p>
      </div>

      {/* Embedded CSS (same as login) */}
      <style>{`
        .signup-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .signup-container {
          width: 100%;
          max-width: 380px;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(12px);
          padding: 35px 30px;
          border-radius: 20px;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
          text-align: center;
          color: #fff;
        }

        .signup-heading {
          font-size: 26px;
          margin-bottom: 8px;
          font-weight: bold;
        }

        .signup-subtitle {
          font-size: 14px;
          margin-bottom: 25px;
          opacity: 0.9;
        }

        .signup-form {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .signup-form input,
        .signup-form select {
          padding: 12px 15px;
          font-size: 15px;
          border-radius: 10px;
          border: none;
          outline: none;
          background: rgba(255, 255, 255, 0.2);
          color: #fff;
          transition: all 0.2s ease-in-out;
        }

        .signup-form input::placeholder {
          color: rgba(255, 255, 255, 0.7);
        }

        .signup-form select option {
          color: #000;
        }

        .signup-form input:focus,
        .signup-form select:focus {
          background: rgba(255, 255, 255, 0.3);
          box-shadow: 0 0 0 2px rgba(255,255,255,0.3);
        }

        .signup-form button {
          padding: 12px;
          font-size: 16px;
          background: linear-gradient(135deg, #ff512f, #dd2476);
          color: #fff;
          border: none;
          border-radius: 30px;
          font-weight: bold;
          cursor: pointer;
          transition: transform 0.2s ease, background 0.3s ease;
        }

        .signup-form button:hover {
          transform: translateY(-2px);
          background: linear-gradient(135deg, #dd2476, #ff512f);
        }

        .signup-error {
          color: #ffcccc;
          font-size: 14px;
          margin-bottom: 10px;
        }

        .signup-success {
          color: #c3f9c3;
          font-size: 14px;
          margin-bottom: 10px;
        }

        .login-link {
          margin-top: 18px;
          font-size: 14px;
          color: #eee;
        }

        .login-link span {
          color: #ffd369;
          font-weight: bold;
          cursor: pointer;
        }

        .login-link span:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
