import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/useAuth";
import { useNotifications } from "../../../context/useNotifications";
import "../auth.css";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { signup } = useAuth();
  const { showToast } = useNotifications();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsSuccess(false);

    if (password.length < 8) {
      setMessage("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);

    try {
      await signup(name.trim(), email.trim().toLowerCase(), password);
      setIsSuccess(true);
      setMessage("Account created successfully! Setting up your workspace...");
      showToast({
        title: "Account Created! 🎉",
        message: `Welcome to StudySync, ${name.trim()}!`,
        type: "achievement",
      });

      setTimeout(() => {
        navigate("/dashboard");
      }, 700);
    } catch (error) {
      setIsSuccess(false);
      setMessage(
        error.message === "Failed to fetch"
          ? "Cannot connect to backend. Please ensure the backend is running."
          : error.message || "Signup failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand">
          <div className="brand-icon">S</div>
          <span>StudySync</span>
        </div>

        <div className="auth-heading">
          <p className="auth-eyebrow">START YOUR JOURNEY</p>
          <h1>Create your account</h1>
          <p>Make your study goals a reality.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="signup-name">Full name</label>
            <input
              id="signup-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your full name"
              autoComplete="name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="signup-email">Email address</label>
            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="signup-password">Password</label>
            <input
              id="signup-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              minLength={8}
              required
            />
            <small style={{ color: "var(--color-text-muted, #71717a)", marginTop: "4px", fontSize: "0.8rem" }}>
              Must be at least 8 characters
            </small>
          </div>

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Create account →"}
          </button>

          {message && (
            <p
              className={`auth-message ${isSuccess ? "auth-message-success" : "auth-message-error"}`}
              role="status"
            >
              {message}
            </p>
          )}
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>

        <p className="auth-footer">
          <button
            className="text-button"
            type="button"
            onClick={() => navigate("/")}
          >
            ← Back to welcome page
          </button>
        </p>
      </section>

      <aside className="auth-visual">
        <div className="visual-content">
          <span className="visual-tag">✦ YOUR NEXT CHAPTER STARTS HERE</span>
          <h2>Small steps.<br />Big achievements.</h2>
          <p>Plan your sessions, track your progress, and study together.</p>
        </div>
      </aside>
    </main>
  );
}
