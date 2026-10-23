
import { useEffect, useMemo, useState } from 'react'
import NotificationPanel from './components/NotificationPanel'
import './notifications.css'

const STORAGE_KEY = 'studysync-notifications-v1'

function createInitialNotifications() {
  const now = Date.now()

  return [
    {
      id: 'welcome',
      title: 'Welcome to StudySync!',
      message: 'Your study workspace is ready. Keep your tasks and study sessions organized.',
      type: 'general',
      createdAt: new Date(now - 5 * 60 * 1000).toISOString(),
      read: false,
    },
    {
      id: 'planner',
      title: 'Review your study plan',
      message: 'Take a moment to review your upcoming study tasks and deadlines.',
      type: 'reminder',
      createdAt: new Date(now - 60 * 60 * 1000).toISOString(),
      read: false,
    },
    {
      id: 'progress',
      title: 'Keep up your progress',
      message: 'Visit Study Tracking to review your study activity and progress.',
      type: 'achievement',
      createdAt: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
      read: true,
    },
  ]
}

function loadNotifications() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)

    if (saved !== null) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed)) return parsed
    }
  } catch (error) {
    console.error('Could not load notifications:', error)
  }

  return createInitialNotifications()
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(loadNotifications)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications))
    } catch (error) {
      console.error('Could not save notifications:', error)
    }
  }, [notifications])

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications]
  )

  const filteredNotifications = useMemo(() => {
    if (filter === 'unread') {
      return notifications.filter((item) => !item.read)
    }

    if (filter === 'read') {
      return notifications.filter((item) => item.read)
    }

    return notifications
  }, [notifications, filter])

  function markAsRead(id) {
    setNotifications((current) =>
      current.map((item) =>
        item.id === id ? { ...item, read: true } : item
      )
    )
  }

  function markAllAsRead() {
    setNotifications((current) =>
      current.map((item) => ({ ...item, read: true }))
    )
  }

  function deleteNotification(id) {
    setNotifications((current) =>
      current.filter((item) => item.id !== id)
    )
  }

  function clearAllNotifications() {
    setNotifications([])
  }

  return (
    <main className="notifications-page">
      <header className="notifications-header">
        <div>
          <p className="notifications-eyebrow">STUDYSYNC</p>
          <h1>Notifications</h1>
          <p className="notifications-subtitle">
            Keep track of your reminders and study updates.
          </p>
        </div>

        <div className="notifications-count" aria-live="polite">
          <span className="notifications-count-number">{unreadCount}</span>
          <span>unread</span>
        </div>
      </header>

      <section className="notifications-toolbar" aria-label="Notification actions">
        <div className="notifications-filters" aria-label="Filter notifications">
          {[
            { label: 'All', value: 'all' },
            { label: 'Unread', value: 'unread' },
            { label: 'Read', value: 'read' },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              className={`notifications-filter ${
                filter === item.value ? 'active' : ''
              }`}
              aria-pressed={filter === item.value}
              onClick={() => setFilter(item.value)}
            >
              {item.label}
              {item.value === 'unread' && unreadCount > 0 && (
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
        {filteredNotifications.length > 0 ? (
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
                ? 'You’re all caught up!'
                : `No ${filter} notifications`}
            </h2>
            <p>
              {notifications.length === 0
                ? 'New notifications will appear here when available.'
                : 'Try another filter to see your notifications.'}
            </p>

            {filter !== 'all' && notifications.length > 0 && (
              <button
                type="button"
                className="notifications-primary-button"
                onClick={() => setFilter('all')}
              >
                View all notifications
              </button>
            )}
          </div>
        )}
      </section>

      <p className="notifications-footer">
        Your notifications are saved in this browser.
      </p>
    </main>
  )
}
