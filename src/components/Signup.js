// src/components/Signup.js
import React, { useState } from "react";
import { auth, db } from "../firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { ref, set } from "firebase/database";
import { useNavigate } from "react-router-dom";
import { FaUser, FaEnvelope, FaLock, FaMobileAlt, FaHome } from "react-icons/fa";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");
  const [role, setRole] = useState("user");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [emailValid, setEmailValid] = useState(true);
  const [passwordValid, setPasswordValid] = useState(true);
  const [mobileValid, setMobileValid] = useState(true);

  const navigate = useNavigate();

  // Validation functions
  const validateEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const validatePassword = (value) => value.length >= 6;
  const validateMobile = (value) => /^\d{10}$/.test(value);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateEmail(email)) return setError("Invalid email address!");
    if (!validatePassword(password)) return setError("Password must be at least 6 characters!");
    if (!validateMobile(mobile)) return setError("Mobile number must be 10 digits!");

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await set(ref(db, "users/" + user.uid), {
        name,
        email,
        mobile,
        address,
        role,
        registeredAt: new Date().toISOString(),
      });

      setSuccess("Signup successful! Redirecting to login...");
      setTimeout(() => navigate("/login"), 1500);

      setName("");
      setEmail("");
      setPassword("");
      setMobile("");
      setAddress("");
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
          <div className="input-group">
            <FaUser className="input-icon" />
            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <FaEnvelope className="input-icon" />
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailValid(validateEmail(e.target.value));
              }}
              className={emailValid ? "" : "invalid"}
              required
            />
          </div>
          {!emailValid && <p className="validation-msg">Invalid email format!</p>}

          <div className="input-group">
            <FaLock className="input-icon" />
            <input
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordValid(validatePassword(e.target.value));
              }}
              className={passwordValid ? "" : "invalid"}
              required
            />
          </div>
          {!passwordValid && <p className="validation-msg">Password must be at least 6 characters!</p>}

          <div className="input-group">
            <FaMobileAlt className="input-icon" />
            <input
              type="text"
              placeholder="Mobile Number"
              value={mobile}
              onChange={(e) => {
                setMobile(e.target.value);
                setMobileValid(validateMobile(e.target.value));
              }}
              className={mobileValid ? "" : "invalid"}
              required
            />
          </div>
          {!mobileValid && <p className="validation-msg">Mobile number must be 10 digits!</p>}

          <div className="input-group">
            <FaHome className="input-icon" />
            <input
              type="text"
              placeholder="Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>

          <select value={role} onChange={(e) => setRole(e.target.value)} required>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>

          <button type="submit" disabled={!emailValid || !passwordValid || !mobileValid}>
            Sign Up
          </button>
        </form>

        <p className="login-link">
          Already have an account?{" "}
          <span onClick={() => navigate("/login")}>Login</span>
        </p>
      </div>

      <style>{`
        .signup-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: url('/your-home-background.jpg') no-repeat center center/cover;
        }
        .signup-container {
          width: 100%;
          max-width: 420px;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(15px);
          padding: 40px 30px;
          border-radius: 20px;
          box-shadow: 0 8px 35px rgba(0, 0, 0, 0.3);
          text-align: center;
          color: #fff;
        }
        .signup-heading { font-size: 28px; font-weight: bold; margin-bottom: 8px; }
        .signup-subtitle { font-size: 14px; margin-bottom: 25px; opacity: 0.9; }
        .signup-form { display: flex; flex-direction: column; gap: 15px; }
        .input-group { position: relative; display: flex; align-items: center; }
        .input-icon { position: absolute; left: 12px; color: rgba(255,255,255,0.7); font-size: 16px; }
        .signup-form input { 
          padding: 12px 12px 12px 36px; 
          font-size: 15px; 
          border-radius: 10px; 
          border: none; 
          outline: none; 
          background: rgba(255,255,255,0.2); 
          color: #fff; 
          transition: all 0.2s ease-in-out; 
        }
        .signup-form input.invalid { border: 2px solid #ff4d4f; background: rgba(255,77,79,0.2); }
        .signup-form input::placeholder { color: rgba(255,255,255,0.7); }
        .signup-form select { padding: 12px 15px; font-size: 15px; border-radius: 10px; border: none; outline: none; background: rgba(255,255,255,0.2); color: #fff; }
        .signup-form select option { color: #000; }
        .signup-form input:focus, .signup-form select:focus { background: rgba(255,255,255,0.35); box-shadow: 0 0 0 2px rgba(255,255,255,0.3); }
        .signup-form button { padding: 14px; font-size: 16px; background: linear-gradient(135deg, #ff512f, #dd2476); color: #fff; border: none; border-radius: 30px; font-weight: bold; cursor: pointer; transition: transform 0.2s ease, background 0.3s ease; }
        .signup-form button:hover { transform: translateY(-2px); background: linear-gradient(135deg, #dd2476, #ff512f); }
        .signup-error { color: #ffcccc; font-size: 14px; margin-bottom: 10px; }
        .signup-success { color: #c3f9c3; font-size: 14px; margin-bottom: 10px; }
        .validation-msg { font-size: 13px; color: #ffbbbb; margin: -10px 0 10px 0; text-align: left; padding-left: 36px; }
        .login-link { margin-top: 18px; font-size: 14px; color: #eee; }
        .login-link span { color: #ffd369; font-weight: bold; cursor: pointer; }
        .login-link span:hover { text-decoration: underline; }
      `}</style>
    </div>
  );
}
