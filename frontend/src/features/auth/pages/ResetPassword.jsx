import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { AUTH_API_URL } from "../../../config/api";
import "../auth.css";

export default function ResetPassword() {
  const [searchParams]    = useSearchParams();
  const navigate          = useNavigate();
  const token             = searchParams.get("token") || "";

  const [tokenValid, setTokenValid] = useState(null); // null = checking
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage]   = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading]   = useState(false);

  // Verify token on mount
  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      return;
    }

    fetch(`${AUTH_API_URL}/verify-reset-token?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => setTokenValid(data.valid === true))
      .catch(() => setTokenValid(false));
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (newPassword.length < 8) {
      setMessage("Password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res  = await fetch(`${AUTH_API_URL}/reset-password`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        setIsSuccess(true);
        setMessage(data.message || "Password reset successfully!");
        setTimeout(() => navigate("/login"), 2500);
      } else {
        setMessage(data.message || "Failed to reset password. The link may have expired.");
      }
    } catch (err) {
      setMessage("Cannot connect to backend. Please ensure the server is running.");
    } finally {
      setLoading(false);
    }
  };

  // ── Render states ──────────────────────────────────────────────────────────
  if (tokenValid === null) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <div className="auth-brand"><div className="brand-icon">S</div><span>StudySync</span></div>
          <p style={{ marginTop: "2rem", color: "#71717a" }}>Verifying your reset link…</p>
        </section>
      </main>
    );
  }

  if (tokenValid === false) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <div className="auth-brand"><div className="brand-icon">S</div><span>StudySync</span></div>
          <div className="auth-heading">
            <p className="auth-eyebrow">LINK EXPIRED</p>
            <h1>Invalid or expired link</h1>
            <p>This password reset link is no longer valid.</p>
          </div>
          <Link to="/forgot-password" className="auth-submit" style={{ display: "inline-block", marginTop: "1.5rem", textAlign: "center" }}>
            Request a new link →
          </Link>
          <p className="auth-footer"><Link to="/login">← Back to login</Link></p>
        </section>
        <aside className="auth-visual"><div className="visual-orb orb-one" /><div className="visual-orb orb-two" /></aside>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand">
          <div className="brand-icon">S</div>
          <span>StudySync</span>
        </div>

        <div className="auth-heading">
          <p className="auth-eyebrow">SET NEW PASSWORD</p>
          <h1>Reset your password</h1>
          <p>Choose a strong new password for your account.</p>
        </div>

        {!isSuccess ? (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="new-password">New password</label>
              <div className="password-input">
                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirm-password">Confirm new password</label>
              <input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                placeholder="Repeat your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>

            <button type="submit" disabled={loading} className="auth-submit">
              {loading ? "Resetting…" : "Reset Password →"}
            </button>

            {message && (
              <p className="auth-message auth-message-error" role="alert">
                {message}
              </p>
            )}
          </form>
        ) : (
          <div>
            <p className="auth-message auth-message-success" role="status">
              {message}
            </p>
            <p className="auth-footer" style={{ marginTop: "1rem" }}>
              Redirecting you to login…
            </p>
          </div>
        )}

        <p className="auth-footer">
          <Link to="/login">← Back to login</Link>
        </p>
      </section>

      <aside className="auth-visual">
        <div className="visual-orb orb-one" />
        <div className="visual-orb orb-two" />
        <div className="visual-content">
          <span className="visual-tag">✦ SECURE YOUR ACCOUNT</span>
          <h2>New start,<br />fresh password.</h2>
          <p>Pick something strong and memorable to keep your study space secure.</p>
        </div>
        <p className="visual-footer">BUILT FOR YOUR NEXT BIG THING.</p>
      </aside>
    </main>
  );
}

