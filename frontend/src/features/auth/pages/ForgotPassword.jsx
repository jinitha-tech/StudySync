import { useState } from "react";
import { Link } from "react-router-dom";
import { AUTH_API_URL } from "../../../config/api";
import "../auth.css";

export default function ForgotPassword() {
  const [email, setEmail]     = useState("");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Dev-only: show reset link when backend has no SMTP configured
  const [devInfo, setDevInfo] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setDevInfo(null);
    setIsSuccess(false);
    setLoading(true);

    try {
      const res  = await fetch(`${AUTH_API_URL}/forgot-password`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();

      if (res.ok) {
        setIsSuccess(true);
        setMessage(data.message || "If that email exists, a recovery link has been sent.");

        // Surface dev token when no SMTP is configured
        if (data._dev_token) {
          setDevInfo({
            token: data._dev_token,
            link:  data._dev_link,
            note:  data._dev_note,
          });
        }
      } else {
        setMessage(data.message || "Something went wrong. Please try again.");
      }
    } catch (err) {
      setMessage(
        err.message === "Failed to fetch"
          ? "Cannot connect to backend. Please ensure the server is running."
          : "Something went wrong. Please try again."
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
          <p className="auth-eyebrow">ACCOUNT RECOVERY</p>
          <h1>Forgot your password?</h1>
          <p>Enter your email and we&apos;ll send you a recovery link.</p>
        </div>

        {!isSuccess ? (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="forgot-email">Email address</label>
              <input
                id="forgot-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <button type="submit" disabled={loading} className="auth-submit">
              {loading ? "Sending..." : "Send Recovery Link →"}
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

            {/* Dev mode: show token when SMTP is not configured */}
            {devInfo && (
              <div
                style={{
                  marginTop: "1rem",
                  padding: "12px 16px",
                  background: "#fef9c3",
                  border: "1px solid #fde68a",
                  borderRadius: "10px",
                  fontSize: "13px",
                  lineHeight: 1.6,
                }}
              >
                <strong>🛠 Dev mode — no SMTP configured</strong>
                <p style={{ marginTop: 6 }}>{devInfo.note}</p>
                <p>
                  <a
                    href={devInfo.link}
                    style={{ color: "#7664ed", wordBreak: "break-all" }}
                  >
                    {devInfo.link}
                  </a>
                </p>
              </div>
            )}

            <p className="auth-footer" style={{ marginTop: "1.2rem" }}>
              Check your inbox and click the link to reset your password.
            </p>
          </div>
        )}

        <p className="auth-footer">
          Remembered it?{" "}
          <Link to="/login">Back to login</Link>
        </p>
      </section>

      <aside className="auth-visual">
        <div className="visual-orb orb-one" />
        <div className="visual-orb orb-two" />
        <div className="visual-content">
          <span className="visual-tag">✦ ACCOUNT RECOVERY</span>
          <h2>It happens to everyone.</h2>
          <p>We&apos;ll get you back to your study space in no time.</p>
        </div>
        <p className="visual-footer">BUILT FOR YOUR NEXT BIG THING.</p>
      </aside>
    </main>
  );
}

