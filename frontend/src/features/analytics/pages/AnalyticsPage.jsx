
import { useEffect, useMemo, useState } from "react";
import "../analytics.css";

const SESSION_KEY = "studysync-study-tracking";
const GOAL_KEY = "studysync-analytics-goals";

const DEFAULT_GOALS = { daily: 180, weekly: 1200 };

function readStorage(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function getSessions() {
  const value = readStorage(SESSION_KEY, []);

  if (!Array.isArray(value)) return [];

  return value.filter(
    (session) =>
      session &&
      Number.isFinite(session.minutes) &&
      session.minutes > 0 &&
      session.date &&
      !Number.isNaN(new Date(session.date).getTime())
  );
}

function getDayKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return hours ? `${hours}h ${mins}m` : `${mins}m`;
}

function formatDate(date, options = { month: "short", day: "numeric" }) {
  return new Date(date).toLocaleDateString("en", options);
}

function AnalyticsPage() {
  const [sessions, setSessions] = useState(getSessions);
  const [range, setRange] = useState("7");
  const [chartMode, setChartMode] = useState("minutes");
  const [goals, setGoals] = useState(() =>
    readStorage(GOAL_KEY, DEFAULT_GOALS)
  );
  const [editingGoals, setEditingGoals] = useState(false);
  const [draftGoals, setDraftGoals] = useState(() =>
    readStorage(GOAL_KEY, DEFAULT_GOALS)
  );
  const [goalMessage, setGoalMessage] = useState("");

  useEffect(() => {
    function refresh() {
      setSessions(getSessions());
    }

    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);

    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  const data = useMemo(() => {
    const now = new Date();
    const todayKey = getDayKey(now);

    const days = Array.from({ length: Number(range) }, (_, i) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (Number(range) - 1 - i));

      const key = getDayKey(date);
      const minutes = sessions
        .filter((s) => getDayKey(s.date) === key)
        .reduce((sum, s) => sum + s.minutes, 0);

      return {
        key,
        date,
        minutes,
        label:
          range === "7"
            ? date.toLocaleDateString("en", { weekday: "short" })
            : date.getDate().toString(),
        title: formatDate(date, {
          weekday: "short",
          month: "short",
          day: "numeric",
        }),
      };
    });

    const totalMinutes = sessions.reduce((sum, s) => sum + s.minutes, 0);
    const rangeMinutes = days.reduce((sum, d) => sum + d.minutes, 0);
    const todayMinutes =
      days.find((d) => d.key === todayKey)?.minutes ?? 0;
    const completedDays = days.filter((d) => d.minutes > 0).length;

    const subjectMap = {};
    sessions.forEach((s) => {
      const subject = s.subject?.trim() || "General Study";
      subjectMap[subject] = (subjectMap[subject] || 0) + s.minutes;
    });

    const subjects = Object.entries(subjectMap)
      .map(([name, minutes]) => ({ name, minutes }))
      .sort((a, b) => b.minutes - a.minutes);

    const previousDays = Array.from({ length: Number(range) }, (_, i) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - Number(range) - (Number(range) - 1 - i));
      return getDayKey(date);
    });

    const previousMinutes = sessions
      .filter((s) => previousDays.includes(getDayKey(s.date)))
      .reduce((sum, s) => sum + s.minutes, 0);

    const change =
      previousMinutes > 0
        ? Math.round(((rangeMinutes - previousMinutes) / previousMinutes) * 100)
        : null;

    const studyDates = new Set(
      sessions.filter((s) => s.minutes > 0).map((s) => getDayKey(s.date))
    );

    let streak = 0;
    const streakDate = new Date();
    streakDate.setHours(0, 0, 0, 0);

    if (!studyDates.has(getDayKey(streakDate))) {
      streakDate.setDate(streakDate.getDate() - 1);
    }

    while (studyDates.has(getDayKey(streakDate))) {
      streak++;
      streakDate.setDate(streakDate.getDate() - 1);
    }

    const recentSessions = [...sessions]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 6);

    const bestDay = [...days].sort((a, b) => b.minutes - a.minutes)[0];

    // Four-week activity grid, using real recorded sessions.
    const heatmap = Array.from({ length: 28 }, (_, i) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (27 - i));

      const key = getDayKey(date);
      const minutes = sessions
        .filter((s) => getDayKey(s.date) === key)
        .reduce((sum, s) => sum + s.minutes, 0);

      return { date, key, minutes };
    });

    return {
      days,
      totalMinutes,
      rangeMinutes,
      todayMinutes,
      completedDays,
      subjects,
      change,
      streak,
      recentSessions,
      bestDay,
      heatmap,
      sessionsCount: sessions.length,
    };
  }, [sessions, range]);

  const maxDaily = Math.max(...data.days.map((d) => d.minutes), 1);
  const maxSubject = Math.max(...data.subjects.map((s) => s.minutes), 1);
  const topSubject = data.subjects[0];

  const dailyProgress = Math.min(
    100,
    Math.round((data.todayMinutes / Math.max(Number(goals.daily), 1)) * 100)
  );

  const weeklyProgress = Math.min(
    100,
    Math.round(
      (data.days.slice(-7).reduce((sum, d) => sum + d.minutes, 0) /
        Math.max(Number(goals.weekly), 1)) *
        100
    )
  );

  function saveGoals(event) {
    event.preventDefault();

    const daily = Number(draftGoals.daily);
    const weekly = Number(draftGoals.weekly);

    if (
      !Number.isFinite(daily) ||
      !Number.isFinite(weekly) ||
      daily < 1 ||
      weekly < 1 ||
      daily > 1440 ||
      weekly > 10080
    ) {
      setGoalMessage("Enter valid goals within the allowed limits.");
      return;
    }

    const nextGoals = { daily, weekly };
    setGoals(nextGoals);
    setDraftGoals(nextGoals);
    localStorage.setItem(GOAL_KEY, JSON.stringify(nextGoals));
    setEditingGoals(false);
    setGoalMessage("Goals saved successfully!");
  }

  const insights = [
    {
      icon: "↗",
      title:
        data.change === null
          ? "Keep building your baseline"
          : data.change >= 0
            ? `Study time increased by ${data.change}%`
            : `Study time decreased by ${Math.abs(data.change)}%`,
      detail:
        data.change === null
          ? "Complete more sessions to compare your progress."
          : "Compared with the previous period of equal length.",
    },
    {
      icon: "✦",
      title: topSubject
        ? `${topSubject.name} is your top subject`
        : "Your first subject is waiting",
      detail: topSubject
        ? `${Math.round((topSubject.minutes / Math.max(data.totalMinutes, 1)) * 100)}% of your recorded study time.`
        : "Complete a focus session to see your subject insights.",
    },
    {
      icon: "🔥",
      title: `${data.streak}-day study streak`,
      detail:
        data.streak > 0
          ? "Keep your momentum going!"
          : "Start a session today to begin your streak.",
    },
    {
      icon: "★",
      title: data.bestDay?.minutes
        ? `${data.bestDay.title} was your best day`
        : "Your best day is yet to come",
      detail: data.bestDay?.minutes
        ? `${formatTime(data.bestDay.minutes)} studied.`
        : "Your daily activity will appear here.",
    },
  ];

  return (
    <main className="analytics-page">
      <header className="analytics-hero">
        <div>
          <p className="analytics-eyebrow">YOUR PROGRESS</p>
          <h1>
            Study Analytics <span className="hero-sparkle">↗</span>
          </h1>
          <p className="analytics-subtitle">
            Turn your efforts into progress. Track, analyze and achieve more!
          </p>
        </div>

        <div className="analytics-range">
          <span aria-hidden="true">▦</span>
          <select
            aria-label="Analytics date range"
            value={range}
            onChange={(event) => setRange(event.target.value)}
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
          </select>
        </div>
      </header>

      <section className="analytics-stats">
        <article className="analytics-stat-card stat-purple">
          <span className="stat-icon">◷</span>
          <p>Total study time</p>
          <h2>{formatTime(data.totalMinutes)}</h2>
          <small>Across all recorded sessions</small>
        </article>

        <article className="analytics-stat-card stat-teal">
          <span className="stat-icon">◎</span>
          <p>Sessions completed</p>
          <h2>{data.sessionsCount}</h2>
          <small>{formatTime(data.rangeMinutes)} in selected period</small>
        </article>

        <article className="analytics-stat-card stat-pink">
          <span className="stat-icon">▦</span>
          <p>Studied today</p>
          <h2>{formatTime(data.todayMinutes)}</h2>
          <small>{dailyProgress}% of daily goal</small>
        </article>

        <article className="analytics-stat-card stat-orange">
          <span className="stat-icon">☆</span>
          <p>Current streak</p>
          <h2>
            {data.streak} {data.streak === 1 ? "day" : "days"}
          </h2>
          <small>{data.completedDays} active days in this period</small>
        </article>
      </section>

      <div className="analytics-main-grid">
        <div className="analytics-primary">
          <section className="analytics-panel">
            <div className="panel-heading">
              <div>
                <h2>▦ Weekly study activity</h2>
                <p>Your daily study time over the selected period.</p>
              </div>
              <div className="analytics-toggle">
                <button
                  className={chartMode === "minutes" ? "selected" : ""}
                  onClick={() => setChartMode("minutes")}
                >
                  Minutes
                </button>
                <button
                  className={chartMode === "hours" ? "selected" : ""}
                  onClick={() => setChartMode("hours")}
                >
                  Hours
                </button>
              </div>
            </div>

            <div className={`activity-chart ${range === "30" ? "monthly-chart" : ""}`}>
              {data.days.map((day) => {
                const height = (day.minutes / maxDaily) * 100;
                const shownValue =
                  chartMode === "hours"
                    ? (day.minutes / 60).toFixed(1)
                    : day.minutes;

                return (
                  <div className="activity-column" key={day.key}>
                    <span className="bar-value">
                      {day.minutes ? shownValue : "—"}
                    </span>
                    <div className="activity-bar-track">
                      <div
                        className="activity-bar"
                        style={{
                          height: `${height}%`,
                          minHeight: day.minutes ? "5px" : "0",
                        }}
                        title={`${day.title}: ${formatTime(day.minutes)}`}
                      />
                    </div>
                    <strong>{day.label}</strong>
                    {range === "7" && (
                      <small>{formatDate(day.date)}</small>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="chart-footer">
              <span>Total: {formatTime(data.rangeMinutes)}</span>
              <span>{data.completedDays} active days</span>
            </div>
          </section>

          <section className="analytics-panel">
            <div className="panel-heading">
              <div>
                <h2>◉ Subject breakdown</h2>
                <p>Where your study time goes.</p>
              </div>
            </div>

            {data.subjects.length === 0 ? (
              <p className="analytics-empty">
                Complete a focus session to discover your top subjects.
              </p>
            ) : (
              <div className="subject-analytics">
                <div
                  className="subject-donut"
                  style={{
                    background: `conic-gradient(${data.subjects
                      .map((subject, index) => {
                        const colors = [
                          "#a78bfa",
                          "#38bdf8",
                          "#34d399",
                          "#fb923c",
                          "#f472b6",
                          "#818cf8",
                        ];
                        const start =
                          (data.subjects
                            .slice(0, index)
                            .reduce((sum, s) => sum + s.minutes, 0) /
                            Math.max(data.totalMinutes, 1)) *
                          100;
                        const end =
                          start + (subject.minutes / data.totalMinutes) * 100;

                        return `${colors[index % colors.length]} ${start}% ${end}%`;
                      })
                      .join(", ")})`,
                  }}
                >
                  <div className="donut-center">
                    <strong>{formatTime(data.totalMinutes)}</strong>
                    <span>Total time</span>
                  </div>
                </div>

                <div className="subject-list">
                  {data.subjects.map((subject, index) => (
                    <div className="subject-item" key={subject.name}>
                      <div className="subject-item-heading">
                        <span className={`subject-dot dot-${index % 6}`} />
                        <strong>{subject.name}</strong>
                        <span>{formatTime(subject.minutes)}</span>
                        <small>
                          {Math.round(
                            (subject.minutes / data.totalMinutes) * 100
                          )}%
                        </small>
                      </div>
                      <div className="subject-progress-track">
                        <div
                          className={`subject-progress-bar dot-${index % 6}`}
                          style={{
                            width: `${(subject.minutes / maxSubject) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="analytics-panel">
            <div className="panel-heading">
              <div>
                <h2>▦ Study consistency</h2>
                <p>Your activity over the last 28 days.</p>
              </div>
            </div>

            <div className="heatmap">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                (day) => (
                  <span className="heatmap-day-label" key={day}>
                    {day}
                  </span>
                )
              )}

              {data.heatmap.map((day) => {
                const intensity =
                  day.minutes === 0
                    ? 0
                    : day.minutes < 30
                      ? 1
                      : day.minutes < 60
                        ? 2
                        : day.minutes < 120
                          ? 3
                          : 4;

                // Grid is arranged by weekday columns for a compact calendar.
                return (
                  <div
                    className={`heatmap-cell heat-${intensity}`}
                    key={day.key}
                    title={`${formatDate(day.date, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}: ${formatTime(day.minutes)}`}
                    aria-label={`${day.key}: ${formatTime(day.minutes)}`}
                  />
                );
              })}
            </div>
            <div className="heatmap-legend">
              <span>Less</span>
              {[0, 1, 2, 3, 4].map((level) => (
                <span
                  key={level}
                  className={`heatmap-cell heat-${level}`}
                />
              ))}
              <span>More</span>
            </div>
          </section>

          <section className="analytics-panel">
            <div className="panel-heading">
              <div>
                <h2>◷ Recent study sessions</h2>
                <p>Your latest completed focus sessions.</p>
              </div>
            </div>

            {data.recentSessions.length === 0 ? (
              <p className="analytics-empty">
                Your completed sessions will appear here.
              </p>
            ) : (
              <div className="session-table-wrap">
                <table className="session-table">
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Duration</th>
                      <th>Date and time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentSessions.map((session) => (
                      <tr key={session.id || `${session.date}-${session.subject}`}>
                        <td>
                          <span className="session-subject">
                            {session.subject || "General Study"}
                          </span>
                        </td>
                        <td>{formatTime(session.minutes)}</td>
                        <td>
                          {new Date(session.date).toLocaleString("en", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <aside className="analytics-aside">
          <section className="analytics-panel consistency-card">
            <div className="panel-heading">
              <div>
                <h2>◎ Daily goal</h2>
                <p>One session at a time.</p>
              </div>
            </div>

            <div
              className="goal-ring"
              style={{
                background: `conic-gradient(#a78bfa ${dailyProgress}%, #292747 ${dailyProgress}% 100%)`,
              }}
            >
              <div className="goal-ring-center">
                <strong>{dailyProgress}%</strong>
                <span>Completed</span>
              </div>
            </div>
            <p className="goal-caption">
              {formatTime(data.todayMinutes)} of {formatTime(goals.daily)}
            </p>
            <p className="goal-encouragement">
              {dailyProgress >= 100
                ? "Amazing! You've reached today's goal."
                : "Small steps add up. Keep going!"}
            </p>
          </section>

          <section className="analytics-panel">
            <div className="panel-heading">
              <div>
                <h2>✦ Quick insights</h2>
                <p>Highlights from your data.</p>
              </div>
            </div>

            <div className="insight-list">
              {insights.map((insight, index) => (
                <article className="insight-item" key={insight.title}>
                  <span className={`insight-icon insight-${index}`}>
                    {insight.icon}
                  </span>
                  <div>
                    <strong>{insight.title}</strong>
                    <p>{insight.detail}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="analytics-panel">
            <div className="panel-heading">
              <div>
                <h2>◎ Set your goals</h2>
                <p>Make progress measurable.</p>
              </div>
            </div>

            {editingGoals ? (
              <form className="goal-form" onSubmit={saveGoals}>
                <label>
                  Daily goal (minutes)
                  <input
                    type="number"
                    min="1"
                    max="1440"
                    value={draftGoals.daily}
                    onChange={(event) =>
                      setDraftGoals((g) => ({
                        ...g,
                        daily: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label>
                  Weekly goal (minutes)
                  <input
                    type="number"
                    min="1"
                    max="10080"
                    value={draftGoals.weekly}
                    onChange={(event) =>
                      setDraftGoals((g) => ({
                        ...g,
                        weekly: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <button className="goal-save-button" type="submit">
                  Save goals
                </button>
                <button
                  className="goal-cancel-button"
                  type="button"
                  onClick={() => {
                    setDraftGoals(goals);
                    setEditingGoals(false);
                    setGoalMessage("");
                  }}
                >
                  Cancel
                </button>
              </form>
            ) : (
              <div className="goal-summary">
                <div>
                  <span>Daily study goal</span>
                  <strong>{formatTime(goals.daily)}</strong>
                </div>
                <div>
                  <span>Weekly study goal</span>
                  <strong>{formatTime(goals.weekly)}</strong>
                </div>
                <button
                  className="goal-save-button"
                  onClick={() => {
                    setDraftGoals(goals);
                    setEditingGoals(true);
                    setGoalMessage("");
                  }}
                >
                  Edit goals
                </button>
              </div>
            )}

            <div className="weekly-goal-progress">
              <div>
                <span>Weekly progress</span>
                <strong>{weeklyProgress}%</strong>
              </div>
              <div className="subject-progress-track">
                <div
                  className="subject-progress-bar dot-0"
                  style={{ width: `${weeklyProgress}%` }}
                />
              </div>
            </div>

            {goalMessage && (
              <p className="goal-message" role="status">
                {goalMessage}
              </p>
            )}
          </section>

          <section className="analytics-panel top-subject-card">
            <div className="panel-heading">
              <div>
                <h2>★ Top subject</h2>
                <p>Your most-studied subject.</p>
              </div>
            </div>
            <span className="top-subject-trophy">♛</span>
            <h3>{topSubject?.name || "Your next achievement"}</h3>
            <p>
              {topSubject
                ? `${formatTime(topSubject.minutes)} of focused study`
                : "Finish your first session to unlock your stats."}
            </p>
          </section>
        </aside>
      </div>
    </main>
  );
}

export default AnalyticsPage;
