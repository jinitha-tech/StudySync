import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../../context/useAuth";
import { useNotifications } from "../../../context/useNotifications";
import "../auth.css";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useNotifications();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsSuccess(false);
    setLoading(true);

    try {
      const loggedUser = await login(email.trim().toLowerCase(), password);
      setIsSuccess(true);
      setMessage("Login successful! Redirecting...");
      showToast({
        title: "Welcome back!",
        message: `Signed in as ${loggedUser.name}`,
        type: "general",
      });

      setTimeout(() => {
        navigate("/dashboard");
      }, 500);
    } catch (error) {
      setIsSuccess(false);
      setMessage(
        error.message === "Failed to fetch"
          ? "Cannot connect to backend. Please ensure the backend server is running."
          : error.message || "Login failed. Please check your credentials."
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
          <p className="auth-eyebrow">YOUR STUDY SPACE</p>
          <h1>Welcome back!</h1>
          <p>Sign in to continue your learning journey.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <div className="password-label">
              <label htmlFor="password">Password</label>
              <button
                type="button"
                className="text-button"
                onClick={() =>
                  setMessage("Tip: Create a new account if you forgot your credentials.")
                }
              >
                Forgot password?
              </button>
            </div>

            <div className="password-input">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="auth-submit">
            {loading ? "Logging in..." : "Login →"}
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

        <div className="auth-divider">
          <span>YOUR PRODUCTIVITY, IN ONE PLACE</span>
        </div>

        <div className="auth-benefits">
          <div>
            <span className="benefit-icon">✓</span>
            Plan your study sessions
          </div>
          <div>
            <span className="benefit-icon">✓</span>
            Track your learning progress
          </div>
          <div>
            <span className="benefit-icon">✓</span>
            Study together with friends
          </div>
        </div>

        <p className="auth-footer">
          New to StudySync? <Link to="/signup">Create an account</Link>
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
        <div className="visual-orb orb-one" />
        <div className="visual-orb orb-two" />

        <div className="visual-content">
          <span className="visual-tag">✦ YOUR NEXT CHAPTER STARTS HERE</span>
          <h2>Small steps.<br />Big achievements.</h2>
          <p>
            Organize your goals, build better habits, and make
            every study session count.
          </p>

          <div className="study-preview">
            <div className="preview-top">
              <div>
                <span className="preview-label">YOUR FOCUS</span>
                <h3>Study smarter</h3>
              </div>
              <div className="preview-check">✓</div>
            </div>

            <div className="progress-track">
              <div className="progress-fill" />
            </div>

            <div className="preview-bottom">
              <span>Keep your momentum going</span>
              <strong>75%</strong>
            </div>

            <div className="preview-pills">
              <span>📚 Study Planner</span>
              <span>🎯 Your Goals</span>
            </div>
          </div>
        </div>

        <p className="visual-footer">
          BUILT FOR YOUR NEXT BIG THING.
        </p>
      </aside>
    </main>
  );
}
