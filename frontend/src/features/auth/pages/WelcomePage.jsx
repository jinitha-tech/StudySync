import { Link } from "react-router-dom";
import "../auth.css";

export default function WelcomePage() {
  return (
    <main className="welcome-page">
      <div className="welcome-brand">
        <span className="brand-icon">S</span>
        <span>StudySync</span>
      </div>

      <section className="welcome-content">
        <span className="welcome-tag">YOUR LEARNING SPACE</span>
        <h1>Study smarter.<br />Achieve more.</h1>
        <p>
          Organize your study sessions, track your progress,
          and learn together with StudySync.
        </p>

        <Link className="auth-submit welcome-button" to="/login">
          Get Started <span>→</span>
        </Link>

        <p className="welcome-login">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </section>

      <div className="welcome-features">
        <div>📚 Study Planner</div>
        <div>🎯 Track Progress</div>
        <div>👥 Study Together</div>
      </div>
    </main>
  );
}