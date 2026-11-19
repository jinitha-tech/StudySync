import { useState, useMemo } from "react";
import NotificationPanel from "./components/NotificationPanel";
import { useNotifications } from "../../context/useNotifications";
import "./notifications.css";

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    addNotification,
  } = useNotifications();

  const [filter, setFilter] = useState("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [newType, setNewType] = useState("reminder");

  const filteredNotifications = useMemo(() => {
    if (filter === "unread") {
      return notifications.filter((item) => !item.read);
    }
    if (filter === "read") {
      return notifications.filter((item) => item.read);
    }
    return notifications;
  }, [notifications, filter]);

  function handleCreateReminder(e) {
    e.preventDefault();
    if (!newTitle.trim() || !newMessage.trim()) return;

    addNotification({
      title: newTitle.trim(),
      message: newMessage.trim(),
      type: newType,
    });

    setNewTitle("");
    setNewMessage("");
    setNewType("reminder");
    setShowAddForm(false);
  }

  return (
    <main className="notifications-page">
      <header className="notifications-header">
        <div>
          <p className="notifications-eyebrow">STUDYSYNC</p>
          <h1>Notifications & Reminders</h1>
          <p className="notifications-subtitle">
            Stay on track with your study reminders, task milestones, and focus achievements.
          </p>
        </div>

        <div className="notifications-header-right">
          <div className="notifications-count" aria-live="polite">
            <span className="notifications-count-number">{unreadCount}</span>
            <span>unread</span>
          </div>

          <button
            type="button"
            className="notifications-primary-button"
            onClick={() => setShowAddForm((v) => !v)}
          >
            {showAddForm ? "Cancel" : "+ Add Reminder"}
          </button>
        </div>
      </header>

      {showAddForm && (
        <form className="notification-add-form" onSubmit={handleCreateReminder}>
          <h3>Create Custom Reminder</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="reminder-title">Reminder Title</label>
              <input
                id="reminder-title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Math Quiz Practice"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="reminder-type">Type</label>
              <select
                id="reminder-type"
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
              >
                <option value="reminder">Reminder ⏰</option>
                <option value="general">General 🔔</option>
                <option value="achievement">Achievement 🏆</option>
                <option value="task">Task Milestone 📝</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="reminder-msg">Message</label>
            <textarea
              id="reminder-msg"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="e.g. Review calculus problems from chapter 4 before evening."
              rows={2}
              required
            />
          </div>

          <div className="form-buttons">
            <button type="submit" className="notifications-primary-button">
              Save Reminder
            </button>
            <button
              type="button"
              className="notifications-text-button"
              onClick={() => setShowAddForm(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <section className="notifications-toolbar" aria-label="Notification actions">
        <div className="notifications-filters" aria-label="Filter notifications">
          {[
            { label: "All", value: "all" },
            { label: "Unread", value: "unread" },
            { label: "Read", value: "read" },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              className={`notifications-filter ${
                filter === item.value ? "active" : ""
              }`}
              aria-pressed={filter === item.value}
              onClick={() => setFilter(item.value)}
            >
              {item.label}
              {item.value === "unread" && unreadCount > 0 && (
                <span className="notifications-filter-count">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="notifications-actions">
          <button
            type="button"
            className="notifications-text-button"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
          >
            Mark all as read
          </button>

          <button
            type="button"
            className="notifications-text-button danger"
            onClick={clearAllNotifications}
            disabled={notifications.length === 0}
          >
            Clear all
          </button>
        </div>
      </section>

      <section
        className="notifications-list"
        aria-label="Your notifications"
        aria-live="polite"
      >
        {loading && notifications.length === 0 ? (
          <div className="notifications-empty">
            <p>Loading notifications...</p>
          </div>
        ) : filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => (
            <NotificationPanel
              key={notification.id}
              notification={notification}
              onMarkRead={markAsRead}
              onDelete={deleteNotification}
            />
          ))
        ) : (
          <div className="notifications-empty">
            <span className="notifications-empty-icon" aria-hidden="true">
              ♡
            </span>
            <h2>
              {notifications.length === 0
                ? "You’re all caught up!"
                : `No ${filter} notifications`}
            </h2>
            <p>
              {notifications.length === 0
                ? "New notifications will appear when tasks are due or focus sessions are completed."
                : "Try another filter to see your notifications."}
            </p>

            {filter !== "all" && notifications.length > 0 && (
              <button
                type="button"
                className="notifications-primary-button"
                onClick={() => setFilter("all")}
              >
                View all notifications
              </button>
            )}
          </div>
        )}
      </section>

      <p className="notifications-footer">
        Notifications are synchronized with your StudySync database and saved in your workspace.
      </p>
    </main>
  );
}
