
import { useEffect, useState } from "react";
import FocusTimer from "../components/FocusTimer";
import "../study-tracking.css";

const STORAGE_KEY = "studysync-study-tracking";

function loadSessions() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function StudyTrackingPage() {
  const [subject, setSubject] = useState("");
  const [sessions, setSessions] = useState(loadSessions);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  }, [sessions]);

  function handleSessionComplete(minutes) {
    const newSession = {
      id: `${Date.now()}-${Math.random()}`,
      subject: subject.trim() || "General Study",
      minutes,
      date: new Date().toISOString(),
    };

    setSessions((previous) => [...previous, newSession]);
  }

  const totalMinutes = sessions.reduce(
    (total, session) => total + session.minutes,
    0
  );

  const today = new Date().toDateString();

  const todayMinutes = sessions
    .filter((session) => new Date(session.date).toDateString() === today)
    .reduce((total, session) => total + session.minutes, 0);

  return (
    <main className="study-tracking-page">
      <header className="study-tracking-header">
        <h1>Study Tracking</h1>
        <p>Build consistent habits and track your study progress.</p>
      </header>

      <section className="study-tracking-stats">
        <article className="tracking-stat-card">
          <h2>Total Study Time</h2>
          <p>{Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m</p>
        </article>

        <article className="tracking-stat-card">
          <h2>Sessions Completed</h2>
          <p>{sessions.length}</p>
        </article>

        <article className="tracking-stat-card">
          <h2>Studied Today</h2>
          <p>{Math.floor(todayMinutes / 60)}h {todayMinutes % 60}m</p>
        </article>
      </section>

      <section className="tracking-subject">
        <label htmlFor="study-subject">What are you studying?</label>
        <input
          id="study-subject"
          type="text"
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          placeholder="e.g. Mathematics, React, DBMS"
        />
      </section>

      <FocusTimer onSessionComplete={handleSessionComplete} />

      <section className="tracking-history">
        <h2>Recent Study Sessions</h2>

        {sessions.length === 0 ? (
          <p>No completed sessions yet. Finish your first focus session to see it here!</p>
        ) : (
          <ul>
            {[...sessions].reverse().map((session) => (
              <li key={session.id}>
                <div>
                  <strong>{session.subject}</strong>
                  <p>{new Date(session.date).toLocaleString()}</p>
                </div>
                <span>{session.minutes} minutes</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

export default StudyTrackingPage;
