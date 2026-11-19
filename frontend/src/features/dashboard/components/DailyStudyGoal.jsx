import { useEffect, useState } from 'react'

const SESSIONS_KEY = 'studysync-study-tracking'
const LEGACY_SESSIONS_KEY = 'studysync-study-sessions'
const GOAL_KEY = 'studysync-daily-study-goal'

function isSameDay(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return false;
  const today = new Date();
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );
}

function DailyStudyGoal() {
  const [goal, setGoal] = useState(() => {
    const saved = localStorage.getItem(GOAL_KEY)
    const parsed = Number(saved)
    return saved && Number.isFinite(parsed) && parsed > 0 ? parsed : 2
  })

  const [sessions, setSessions] = useState([])
  const [editing, setEditing] = useState(false)
  const [goalInput, setGoalInput] = useState(String(goal))

  useEffect(() => {
    function loadSessions() {
      try {
        const saved = localStorage.getItem(SESSIONS_KEY) || localStorage.getItem(LEGACY_SESSIONS_KEY)
        const parsed = saved ? JSON.parse(saved) : []
        setSessions(Array.isArray(parsed) ? parsed : [])
      } catch {
        setSessions([])
      }
    }

    loadSessions()
    window.addEventListener('focus', loadSessions)
    window.addEventListener('storage', loadSessions)

    return () => {
      window.removeEventListener('focus', loadSessions)
      window.removeEventListener('storage', loadSessions)
    }
  }, [])

  const todayHours = sessions
    .filter((session) => isSameDay(session.date))
    .reduce((total, session) => {
      const hours = session.hours !== undefined ? Number(session.hours) : Number(session.minutes || 0) / 60;
      return total + (Number.isFinite(hours) ? hours : 0);
    }, 0)

  const progress = Math.min((todayHours / goal) * 100, 100)
  const goalReached = todayHours >= goal

  function saveGoal(event) {
    event.preventDefault()
    const nextGoal = Number(goalInput)

    if (!Number.isFinite(nextGoal) || nextGoal <= 0 || nextGoal > 24) {
      return
    }

    setGoal(nextGoal)
    localStorage.setItem(GOAL_KEY, String(nextGoal))
    setEditing(false)
  }

  return (
    <div className="daily-goal">
      <div className="daily-goal-heading">
        <span>Today's study goal</span>
        <button
          type="button"
          className="goal-edit-button"
          onClick={() => {
            setGoalInput(String(goal))
            setEditing((value) => !value)
          }}
        >
          {editing ? 'Cancel' : 'Edit goal'}
        </button>
      </div>

      <strong>{todayHours.toFixed(1)} / {goal} hrs</strong>

      <div
        className="goal-progress-track"
        role="progressbar"
        aria-label="Daily study goal progress"
        aria-valuemin={0}
        aria-valuemax={goal}
        aria-valuenow={Math.min(todayHours, goal)}
      >
        <div
          className="goal-progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>

      <span>
        {goalReached
          ? 'Amazing! You reached your daily goal 🎉'
          : `${Math.max(0, goal - todayHours).toFixed(1)} hours to go. Keep going!`}
      </span>

      {editing && (
        <form className="goal-edit-form" onSubmit={saveGoal}>
          <label htmlFor="daily-goal-input">Daily target (hours)</label>
          <input
            id="daily-goal-input"
            type="number"
            min="0.25"
            max="24"
            step="0.25"
            value={goalInput}
            onChange={(event) => setGoalInput(event.target.value)}
            required
          />
          <button type="submit">Save goal</button>
        </form>
      )}
    </div>
  )
}

export default DailyStudyGoal
