
function getIcon(type) {
  switch (type) {
    case 'reminder':
      return '◷'
    case 'achievement':
      return '✦'
    default:
      return '♧'
  }
}

function formatDate(dateString) {
  const date = new Date(dateString)

  if (Number.isNaN(date.getTime())) return 'Recently'

  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function NotificationPanel({
  notification,
  onMarkRead,
  onDelete,
}) {
  return (
    <article
      className={`notification-card ${
        notification.read ? 'is-read' : 'is-unread'
      }`}
    >
      <div
        className={`notification-icon notification-icon-${notification.type}`}
        aria-hidden="true"
      >
        {getIcon(notification.type)}
      </div>

      <div className="notification-content">
        <div className="notification-title-row">
          <h2>{notification.title}</h2>
          {!notification.read && (
            <span className="notification-unread-dot" aria-label="Unread" />
          )}
        </div>

        <p className="notification-message">{notification.message}</p>

        <time
          className="notification-time"
          dateTime={notification.createdAt}
        >
          {formatDate(notification.createdAt)}
        </time>
      </div>

      <div className="notification-card-actions">
        {!notification.read && (
          <button
            type="button"
            className="notification-action"
            onClick={() => onMarkRead(notification.id)}
            aria-label={`Mark ${notification.title} as read`}
            title="Mark as read"
          >
            ✓
          </button>
        )}

        <button
          type="button"
          className="notification-action notification-delete"
          onClick={() => onDelete(notification.id)}
          aria-label={`Delete ${notification.title}`}
          title="Delete notification"
        >
          ×
        </button>
      </div>
    </article>
  )
}
