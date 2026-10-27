import { useEffect, useState } from 'react'
import '../dashboard.css'
import { PLANNER_API_URL } from "../../../config/api";
function getDayLabels() {
  const today = new Date()
  const startOfWeek = new Date(today)
  const day = today.getDay()

  // Monday is the first day of the week.
  startOfWeek.setDate(today.getDate() - ((day + 6) % 7))
  startOfWeek.setHours(0, 0, 0, 0)

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(startOfWeek)
    date.setDate(startOfWeek.getDate() + index)

    return {
      label: date.toLocaleDateString('en-US', { weekday: 'short' }),
      date: date.toISOString().slice(0, 10),
    }
  })
}

function WeeklyActivity() {
  const [tasks, setTasks] = useState([])
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true

    async function loadTasks() {
      try {
        const response = await fetch(PLANNER_API_URL)

        if (!response.ok) {
          throw new Error('Could not load planner tasks')
        }

        const result = await response.json()
        const apiTasks = Array.isArray(result.data) ? result.data : []

        if (active) {
          setTasks(apiTasks)
          setError(false)
        }
      } catch (err) {
        console.error('Could not load weekly activity:', err)

        if (active) {
          setError(true)
          setTasks([])
        }
      }
    }

    loadTasks()
    window.addEventListener('focus', loadTasks)

    return () => {
      active = false
      window.removeEventListener('focus', loadTasks)
    }
  }, [])

  const days = getDayLabels()

  // Count tasks created on each day, using the task's creation timestamp.
  const activity = days.map((day) => {
    const count = tasks.filter((task) => {
      const createdAt = task.createdAt || task.created_at

      if (!createdAt) return false

      const date = new Date(createdAt)

      if (Number.isNaN(date.getTime())) return false

      const localDate = [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(2, '0'),
      ].join('-')

      return localDate === day.date
    }).length

    return { ...day, count }
  })

  const maxCount = Math.max(...activity.map((day) => day.count), 1)
  const total = activity.reduce((sum, day) => sum + day.count, 0)

  return (
    <section className="weekly-activity-card">
      <div className="weekly-activity-header">
        <div>
          <h3>Weekly activity</h3>
          <p>Study tasks created this week.</p>
        </div>

        <strong>{total} tasks</strong>
      </div>

      {error ? (
        <p role="alert">
          Could not load activity. Check that the backend is running.
        </p>
      ) : (
        <>
          <div
            className="weekly-activity-chart"
            role="img"
            aria-label={`Tasks created this week: ${activity
              .map((day) => `${day.label}: ${day.count}`)
              .join(', ')}`}
          >
            {activity.map((day) => (
              <div className="weekly-activity-day" key={day.date}>
                <span className="weekly-activity-count">{day.count}</span>

                <div className="weekly-activity-bar-track">
                  <div
                    className="weekly-activity-bar"
                    style={{
                      height: `${day.count === 0 ? 0 : Math.max((day.count / maxCount) * 100, 8)}%`,
                    }}
                  />
                </div>

                <span className="weekly-activity-label">{day.label}</span>
              </div>
            ))}
          </div>

          {total === 0 && (
            <p className="weekly-activity-empty">
              No tasks created this week yet. Add a study task to get started!
            </p>
          )}
        </>
      )}
    </section>
  )
}

export default WeeklyActivity