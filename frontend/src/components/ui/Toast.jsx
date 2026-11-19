import { useNotifications } from "../../context/useNotifications";

export default function Toast() {
  const { toast, setToast } = useNotifications();

  if (!toast) return null;

  return (
    <div className={`studysync-toast studysync-toast-${toast.type || "general"}`} role="alert">
      <div className="toast-icon">
        {toast.type === "achievement" ? "🏆" : toast.type === "reminder" ? "⏰" : toast.type === "task" ? "📝" : "🔔"}
      </div>
      <div className="toast-body">
        <strong>{toast.title}</strong>
        {toast.message && <p>{toast.message}</p>}
      </div>
      <button
        type="button"
        className="toast-close"
        onClick={() => setToast(null)}
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
}
