import { useEffect, useState, useMemo } from "react";
import FocusTimer from "../components/FocusTimer";
import { useNotifications } from "../../../context/useNotifications";
import "../study-tracking.css";

const STORAGE_KEY = "studysync-study-tracking";
const LEGACY_KEY = "studysync-study-sessions";

function loadSessions() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function StudyTrackingPage() {
  const [subject, setSubject] = useState("");
  const [sessions, setSessions] = useState(loadSessions);
  const { addNotification } = useNotifications();

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
      // Mirror to legacy sessions with hours for backward compatibility
      const legacySessions = sessions.map((s) => ({
        id: s.id,
        subject: s.subject,
        hours: (s.minutes || 0) / 60,
        date: s.date ? s.date.slice(0, 10) : "",
      }));
      localStorage.setItem(LEGACY_KEY, JSON.stringify(legacySessions));
    } catch (e) {
      console.warn("Session storage save error:", e);
    }
  }, [sessions]);

  function handleSessionComplete(minutes) {
    const studySubject = subject.trim() || "General Study";
    const newSession = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      subject: studySubject,
      minutes,
      hours: minutes / 60,
      date: new Date().toISOString(),
    };

    setSessions((previous) => [...previous, newSession]);

    // Dispatch real notification and toast
    addNotification({
      title: "Focus Session Completed! ⏱️",
      message: `Great job! You logged ${minutes} min of ${studySubject}.`,
      type: "achievement",
    });
  }

  const [mountDate] = useState(() => new Date());

  const { totalMinutes, todayMinutes } = useMemo(() => {
    const todayStr = `${mountDate.getFullYear()}-${mountDate.getMonth()}-${mountDate.getDate()}`;

    let total = 0;
    let todayTotal = 0;

    for (const session of sessions) {
      const mins = Number(session.minutes) || 0;
      total += mins;

      if (session.date) {
        const d = new Date(session.date);
        if (!Number.isNaN(d.getTime())) {
          const sStr = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
          if (sStr === todayStr) {
            todayTotal += mins;
          }
        }
      }
    }

    return { totalMinutes: total, todayMinutes: todayTotal };
  }, [sessions, mountDate]);

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
