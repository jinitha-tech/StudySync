import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { useNotifications } from "../../context/useNotifications";

const pageTitles = {
  "/dashboard": "Dashboard",
  "/study-rooms": "Study Rooms",
  "/study-planner": "Study Planner",
  "/resources": "Resources",
  "/study-tracking": "Study Tracking",
  "/analytics": "Analytics",
  "/notifications": "Notifications",
};

function Topbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const { unreadCount } = useNotifications();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const displayName = user?.name || "Study Student";
  const displayEmail = user?.email || "";

  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("") || "S";

  const pageTitle = location.pathname.startsWith("/study-rooms/")
    ? "Study Room"
    : pageTitles[location.pathname] ?? "StudySync";

  // Close dropdown menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function handleLogout() {
    logout();
    setMenuOpen(false);
    navigate("/login");
  }

  return (
    <header className="topbar">
      <div>
        <p className="topbar-eyebrow">YOUR LEARNING SPACE</p>
        <h1 className="topbar-title">{pageTitle}</h1>
      </div>

      <div className="topbar-actions">
        <button
          className="icon-button notification-button-wrapper"
          type="button"
          aria-label={`Open notifications (${unreadCount} unread)`}
          title="Notifications"
          onClick={() => navigate("/notifications")}
        >
          <span className="topbar-icon" aria-hidden="true">♧</span>
          {unreadCount > 0 && (
            <span className="topbar-badge" aria-label={`${unreadCount} unread notifications`}>
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        <div className="profile-menu-container" ref={menuRef}>
          <button
            className="topbar-avatar"
            type="button"
            aria-label={`Profile menu for ${displayName}`}
            title={displayName}
            onClick={() => {
              if (!isAuthenticated) {
                navigate("/login");
              } else {
                setMenuOpen((prev) => !prev);
              }
            }}
          >
            {initials}
          </button>

          {menuOpen && isAuthenticated && (
            <div className="profile-dropdown-menu" role="menu">
              <div className="dropdown-user-info">
                <strong>{displayName}</strong>
                {displayEmail && <span>{displayEmail}</span>}
              </div>

              <hr className="dropdown-divider" />

              <Link
                to="/notifications"
                className="dropdown-item"
                role="menuitem"
                onClick={() => setMenuOpen(false)}
              >
                <span>♧ Notifications</span>
                {unreadCount > 0 && (
                  <span className="dropdown-badge">{unreadCount}</span>
                )}
              </Link>

              <Link
                to="/study-planner"
                className="dropdown-item"
                role="menuitem"
                onClick={() => setMenuOpen(false)}
              >
                <span>▦ Study Planner</span>
              </Link>

              <hr className="dropdown-divider" />

              <button
                type="button"
                className="dropdown-item dropdown-logout-button"
                role="menuitem"
                onClick={handleLogout}
              >
                <span>🚪 Sign out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Topbar;
