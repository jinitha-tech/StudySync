import { useEffect, useState } from 'react'

const STORAGE_KEY = 'studysync-study-planner-tasks'

function StatsGrid() {
  const [tasks, setTasks] = useState([])

  useEffect(() => {
    function loadTasks() {
      try {
        const savedTasks = localStorage.getItem(STORAGE_KEY)
        const parsedTasks = savedTasks ? JSON.parse(savedTasks) : []

        setTasks(Array.isArray(parsedTasks) ? parsedTasks : [])
      } catch (error) {
        console.error('Could not load study planner tasks:', error)
        setTasks([])
      }
    }

    loadTasks()
    window.addEventListener('focus', loadTasks)
    window.addEventListener('storage', loadTasks)

    return () => {
      window.removeEventListener('focus', loadTasks)
      window.removeEventListener('storage', loadTasks)
    }
  }, [])

  const completedTasks = tasks.filter((task) => task.completed).length
  const pendingTasks = tasks.length - completedTasks

  const completionRate =
    tasks.length > 0
      ? Math.round((completedTasks / tasks.length) * 100)
      : 0

  const stats = [
    {
      label: 'Study hours',
      value: '12.5 hrs',
      detail: 'This week',
      icon: '◷',
    },
    {
      label: 'Tasks completed',
      value: completedTasks.toString(),
      detail: 'All-time completed tasks',
      icon: '✓',
    },
    {
      label: 'Tasks remaining',
      value: pendingTasks.toString(),
      detail: 'Still to do',
      icon: '↗',
    },
    {
      label: 'Completion rate',
      value: `${completionRate}%`,
      detail: `${completedTasks} of ${tasks.length} tasks`,
      icon: '◎',
    },
  ]

  return (
    <section className="stats-grid" aria-label="Study statistics">
      {stats.map((stat) => (
        <article className="stat-card" key={stat.label}>
          <div className="stat-card-top">
            <span className="stat-label">{stat.label}</span>
            <span className="stat-icon" aria-hidden="true">
              {stat.icon}
            </span>
          </div>

          <p className="stat-value">{stat.value}</p>
          <p className="stat-detail">{stat.detail}</p>
        </article>
      ))}
    </section>
  )
}

export default StatsGrid