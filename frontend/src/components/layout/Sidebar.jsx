import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { useNotifications } from "../../context/useNotifications";

const navigationItems = [
  { label: "Dashboard", path: "/dashboard", icon: "⌂" },
  { label: "Study Rooms", path: "/study-rooms", icon: "◫" },
  { label: "Study Planner", path: "/study-planner", icon: "▦" },
  { label: "Resources", path: "/resources", icon: "▤" },
  { label: "Study Tracking", path: "/study-tracking", icon: "◷" },
  { label: "Analytics", path: "/analytics", icon: "↗" },
  { label: "Notifications", path: "/notifications", icon: "♧" },
];

function Sidebar() {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const { unreadCount } = useNotifications();

  const displayName = user?.name || "Study Student";
  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("") || "S";

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
              `nav-link${isActive ? " active" : ""}`
            }
          >
            <span className="nav-icon" aria-hidden="true">
              {item.icon}
            </span>
            <span>{item.label}</span>
            {item.path === "/notifications" && unreadCount > 0 && (
              <span className="sidebar-nav-badge" aria-label={`${unreadCount} unread`}>
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {isAuthenticated ? (
        <div className="sidebar-footer-wrapper">
          <div className="sidebar-footer">
            <span className="avatar">{initials}</span>
            <span className="sidebar-profile-text">
              <span className="profile-name" title={displayName}>
                {displayName}
              </span>
              <span className="profile-caption">
                {user?.email || "Personal workspace"}
              </span>
            </span>
          </div>
          <button
            type="button"
            className="sidebar-logout-btn"
            onClick={() => {
              logout();
              navigate("/login");
            }}
            title="Sign out"
            aria-label="Sign out"
          >
            Sign out
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="sidebar-footer"
          onClick={() => navigate("/login")}
          aria-label="Sign in to your account"
        >
          <span className="avatar">?</span>
          <span className="sidebar-profile-text">
            <span className="profile-name">Sign In</span>
            <span className="profile-caption">Access your data</span>
          </span>
        </button>
      )}
    </aside>
  );
}

export default Sidebar;
