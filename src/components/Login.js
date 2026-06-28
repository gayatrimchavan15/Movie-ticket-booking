import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebaseConfig";
import { useNavigate, Link } from "react-router-dom";
import { ref, get } from "firebase/database";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const roleRef = ref(db, `users/${user.uid}/role`);
      const snapshot = await get(roleRef);
      const role = snapshot.val();

      if (role === "admin") {
        navigate("/admin/AdminDashboard");
      } else if (role === "manager") {
        navigate("/manager-dashboard");
      } else {
        navigate("/homepage"); // ✅ Redirect regular users to dashboard
      }
    } catch (err) {
      setError("Invalid email or password.");
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h2 className="login-heading">🎟️ Welcome Back</h2>
        <p className="login-subtitle">Login to continue booking your favorite movies</p>

        <form onSubmit={handleLogin} className="login-form">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="login-error">{error}</p>}
          <button type="submit">Login</button>
        </form>

        <p className="signup-link">
          Don’t have an account? <Link to="/signup">Sign Up</Link>
        </p>
      </div>

      {/* Internal CSS */}
      <style>{`
        .login-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        .login-container { width: 100%; max-width: 380px; background: rgba(255,255,255,0.15); backdrop-filter: blur(12px); padding: 35px 30px; border-radius: 20px; box-shadow: 0 8px 25px rgba(0,0,0,0.3); text-align: center; color: #fff; }
        .login-heading { font-size: 26px; margin-bottom: 8px; font-weight: bold; }
        .login-subtitle { font-size: 14px; margin-bottom: 25px; opacity: 0.9; }
        .login-form { display: flex; flex-direction: column; gap: 15px; }
        .login-form input { padding: 12px 15px; font-size: 15px; border-radius: 10px; border: none; outline: none; background: rgba(255,255,255,0.2); color: #fff; transition: all 0.2s ease-in-out; }
        .login-form input::placeholder { color: rgba(255,255,255,0.7); }
        .login-form input:focus { background: rgba(255,255,255,0.3); box-shadow: 0 0 0 2px rgba(255,255,255,0.3); }
        .login-form button { padding: 12px; font-size: 16px; background: linear-gradient(135deg,#ff512f,#dd2476); color: #fff; border: none; border-radius: 30px; font-weight: bold; cursor: pointer; transition: transform 0.2s ease, background 0.3s ease; }
        .login-form button:hover { transform: translateY(-2px); background: linear-gradient(135deg,#dd2476,#ff512f); }
        .login-error { color: #ffcccc; font-size: 14px; }
        .signup-link { margin-top: 18px; font-size: 14px; color: #eee; }
        .signup-link a { color: #ffd369; font-weight: bold; text-decoration: none; }
        .signup-link a:hover { text-decoration: underline; }
      `}</style>
    </div>
  );
}
