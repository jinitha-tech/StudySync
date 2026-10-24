
import { NavLink } from 'react-router-dom'

const navigationItems = [
  { label: 'Dashboard', path: '/dashboard', icon: '⌂' },
  { label: 'Study Rooms', path: '/study-rooms', icon: '◫' },
  { label: 'Study Planner', path: '/study-planner', icon: '▦' },
  { label: 'Resources', path: '/resources', icon: '▤' },
  { label: 'Study Tracking', path: '/study-tracking', icon: '◷' },
  { label: 'Analytics', path: '/analytics', icon: '↗' },
  { label: 'Notifications', path: '/notifications', icon: '♧' },
]

function Sidebar() {
  return (
    <aside className="sidebar">
      <NavLink to="/dashboard" className="brand">
        <span className="brand-mark">S</span>
        <span>StudySync</span>
      </NavLink>

      <p className="sidebar-label">WORKSPACE</p>

      <nav className="sidebar-nav" aria-label="Main navigation">
        {navigationItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `nav-link${isActive ? ' active' : ''}`
            }
          >
            <span className="nav-icon" aria-hidden="true">
              {item.icon}
            </span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="avatar">S</div>
        <div>
          <p className="profile-name">Study Student</p>
          <p className="profile-caption">Personal workspace</p>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
