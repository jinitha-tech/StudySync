import { useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'studysync-study-sessions'

function getWeekStart(date) {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  const day = start.getDay()
  start.setDate(start.getDate() - (day === 0 ? 6 : day - 1))
  return start
}

function formatDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function WeeklyActivity() {
  const [sessions, setSessions] = useState([])
  const [weekOffset, setWeekOffset] = useState(0)
  const [sessionDate, setSessionDate] = useState(formatDate(new Date()))
  const [sessionHours, setSessionHours] = useState('1')
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    function loadSessions() {
      try {
        const saved = localStorage.getItem(STORAGE_KEY)
        const parsed = saved ? JSON.parse(saved) : []
        setSessions(Array.isArray(parsed) ? parsed : [])
      } catch (error) {
        console.error('Could not load study sessions:', error)
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

  const weekStart = useMemo(() => {
    const start = getWeekStart(new Date())
    start.setDate(start.getDate() + weekOffset * 7)
    return start
  }, [weekOffset])

  const weeklyHours = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(weekStart)
      date.setDate(date.getDate() + index)
      const dateKey = formatDate(date)

      const hours = sessions
        .filter((session) => session.date === dateKey)
        .reduce((total, session) => total + Number(session.hours || 0), 0)

      return {
        date: dateKey,
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        hours,
      }
    })
  }, [sessions, weekStart])

  const weeklyTotal = weeklyHours.reduce(
    (total, day) => total + day.hours,
    0,
  )

  const maxHours = Math.max(1, ...weeklyHours.map((day) => day.hours))

  function addSession(event) {
    event.preventDefault()

    const hours = Number(sessionHours)

    if (!sessionDate || !Number.isFinite(hours) || hours <= 0 || hours > 24) {
      return
    }

    const updatedSessions = [
      ...sessions,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        date: sessionDate,
        hours,
      },
    ]

    setSessions(updatedSessions)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSessions))
    setWeekOffset(
      Math.round(
        (getWeekStart(new Date(sessionDate)) - getWeekStart(new Date())) /
          (7 * 24 * 60 * 60 * 1000),
      ),
    )
    setShowForm(false)
    setSessionHours('1')
  }

  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)

  const weekLabel =
    weekOffset === 0
      ? 'This week'
      : `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`

  return (
    <section className="activity-card">
      <div className="activity-header">
        <div>
          <h3>Weekly activity</h3>
          <p>Your recorded study time</p>
        </div>

        <div className="activity-total">
          <strong>{weeklyTotal.toFixed(1)} hrs</strong>
          <span>Total {weekOffset === 0 ? 'this week' : 'for selected week'}</span>
        </div>
      </div>

      <div className="activity-week-navigation">
        <button
          type="button"
          onClick={() => setWeekOffset((offset) => offset - 1)}
        >
          ← Previous
        </button>

        <span>{weekLabel}</span>

        <button
          type="button"
          onClick={() => setWeekOffset((offset) => Math.min(0, offset + 1))}
          disabled={weekOffset === 0}
        >
          Next →
        </button>
      </div>

      <div className="activity-chart">
        {weeklyHours.map((day) => (
          <div className="activity-day" key={day.date}>
            <span className="activity-hours">{day.hours.toFixed(1)}h</span>

            <div className="activity-bar-track">
              <div
                className="activity-bar"
                style={{
                  height: `${day.hours === 0 ? 0 : (day.hours / maxHours) * 100}%`,
                }}
                title={`${day.hours.toFixed(1)} hours on ${day.date}`}
              />
            </div>

            <span className="activity-day-label">{day.day}</span>
          </div>
        ))}
      </div>

      {weeklyTotal === 0 && (
        <p className="activity-empty">
          No study time recorded for this week yet. Add a session to get started!
        </p>
      )}

      <div className="activity-actions">
        <button type="button" onClick={() => setShowForm((visible) => !visible)}>
          {showForm ? 'Cancel' : '+ Add study session'}
        </button>
      </div>

      {showForm && (
        <form className="activity-session-form" onSubmit={addSession}>
          <label>
            Study date
            <input
              type="date"
              value={sessionDate}
              max={formatDate(new Date())}
              onChange={(event) => setSessionDate(event.target.value)}
              required
            />
          </label>

          <label>
            Hours studied
            <input
              type="number"
              min="0.25"
              max="24"
              step="0.25"
              value={sessionHours}
              onChange={(event) => setSessionHours(event.target.value)}
              required
            />
          </label>

          <button type="submit">Save session</button>
        </form>
      )}
    </section>
  )
}

export default WeeklyActivity