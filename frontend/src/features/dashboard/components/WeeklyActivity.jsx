
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const API_URL = 'http://localhost:5050/api/planner'

function getDeadlineStatus(task) {
  if (task.completed) return 'Completed'
  if (!task.dueDate) return 'No due date'

  const dueDate = new Date(`${task.dueDate}T00:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (Number.isNaN(dueDate.getTime())) return 'No due date'
  if (dueDate < today) return 'Overdue'
  if (dueDate.getTime() === today.getTime()) return 'Due today'

  return 'Upcoming'
}

function UpcomingDeadlines() {
  const [tasks, setTasks] = useState([])

  useEffect(() => {
    async function loadTasks() {
      try {
        const response = await fetch(API_URL)

        if (!response.ok) {
          throw new Error('Could not load planner tasks')
        }

        const result = await response.json()
        const apiTasks = Array.isArray(result.data) ? result.data : []

        const mappedTasks = apiTasks.map((task) => ({
          ...task,
          dueDate: task.deadline || task.dueDate || '',
          subject: task.description || task.subject || '',
        }))

        setTasks(mappedTasks)
      } catch (error) {
        console.error('Could not load upcoming deadlines:', error)
        setTasks([])
      }
    }

    loadTasks()
    window.addEventListener('focus', loadTasks)

    return () => {
      window.removeEventListener('focus', loadTasks)
    }
  }, [])

  const upcomingTasks = tasks
    .filter((task) => !task.completed && task.dueDate)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5)

  return (
    <section className="deadlines-card">
      <div className="deadlines-header">
        <div>
          <h3>Upcoming deadlines</h3>
          <p>Stay on top of your study tasks.</p>
        </div>

        <Link to="/study-planner" className="deadlines-link">
          View planner →
        </Link>
      </div>

      {upcomingTasks.length === 0 ? (
        <div className="deadlines-empty">
          <span className="deadlines-empty-icon" aria-hidden="true">
            ✓
          </span>
          <p>You're all caught up!</p>
          <span>Add a task in your Study Planner to see it here.</span>
          <Link to="/study-planner" className="deadlines-add-link">
            + Add a study task
          </Link>
        </div>
      ) : (
        <div className="deadlines-list">
          {upcomingTasks.map((task) => {
            const status = getDeadlineStatus(task)
            const dueDate = new Date(`${task.dueDate}T00:00:00`)

            return (
              <article className="deadline-item" key={task.id}>
                <div className="deadline-date">
                  <span>
                    {dueDate.toLocaleDateString('en', {
                      month: 'short',
                    })}
                  </span>
                  <strong>{dueDate.getDate()}</strong>
                </div>

                <div className="deadline-details">
                  <h4>{task.title}</h4>
                  <p>{task.subject || 'General study'}</p>
                </div>

                <span
                  className={`deadline-status deadline-${status
                    .toLowerCase()
                    .replace(/\s+/g, '-')}`}
                >
                  {status}
                </span>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default UpcomingDeadlines
