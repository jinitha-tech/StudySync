import { Link } from 'react-router-dom'

const actions = [
  {
    title: 'Add a new task',
    description: 'Plan your next study task and stay organized.',
    icon: '＋',
    link: '/study-planner',
    label: 'Open planner',
  },
  {
    title: 'Explore resources',
    description: 'Find useful materials for your next study session.',
    icon: '▤',
    link: '/resources',
    label: 'View resources',
  },
]

function DashboardQuickActions() {
  return (
    <section
      className="quick-actions-card"
      aria-labelledby="quick-actions-title"
    >
      <div className="quick-actions-header">
        <h3 id="quick-actions-title">Quick actions</h3>
        <p>Pick up where you want to focus next.</p>
      </div>

      <div className="quick-actions-grid">
        {actions.map((action) => (
          <article className="quick-action" key={action.title}>
            <div className="quick-action-icon" aria-hidden="true">
              {action.icon}
            </div>

            <div className="quick-action-content">
              <h4>{action.title}</h4>
              <p>{action.description}</p>
            </div>

            <Link className="quick-action-link" to={action.link}>
              {action.label}
              <span aria-hidden="true"> →</span>
            </Link>
          </article>
        ))}
      </div>
    </section>
  )
}

export default DashboardQuickActions