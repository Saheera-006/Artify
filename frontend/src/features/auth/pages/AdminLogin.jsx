import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../../config/firebase.js";
import { Field } from "../../../components/common/Field.jsx";

export function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const login = async (event) => {
    event.preventDefault();

    if (!email || !password) {
      alert("Enter email and password.");

      return;
    }

    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);

      onLogin();
    } catch (error) {
      console.error(error);

      alert("Invalid admin credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="admin-auth">
      <div className="admin-auth-glow" />

      <form className="admin-login-card" onSubmit={login}>
        <div className="admin-brand">
          <span className="brand-mark">A</span>

          <div>
            <strong>ARTIFY</strong>

            <small>ADMIN PANEL</small>
          </div>
        </div>

        <span className="mini-label">SECURE ACCESS</span>

        <h1>Welcome back.</h1>

        <p>Sign in to manage rounds, submissions and qualification.</p>

        <Field
          label="Admin Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@email.com"
          type="email"
        />

        <Field
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          type="password"
        />

        <button className="primary-btn full" disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}

          <span>→</span>
        </button>

        <button
          type="button"
          className="back-public"
          onClick={() => {
            window.location.href = "/";
          }}
        >
          ← Back to ARTIFY
        </button>
      </form>
    </main>
  );
}
