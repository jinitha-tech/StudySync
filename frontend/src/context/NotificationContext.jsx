import { useEffect, useState, useCallback, useMemo } from "react";
import { NOTIFICATIONS_API_URL, getAuthHeaders } from "../config/api";
import { useAuth } from "./useAuth";
import { NotificationContext } from "./notificationContextDef";

const STORAGE_KEY = "studysync-notifications-v1";

function getInitialLocalNotifications() {
  const now = Date.now();
  return [
    {
      id: "welcome_init",
      title: "Welcome to StudySync!",
      message: "Your study workspace is ready. Keep your tasks and study sessions organized.",
      type: "general",
      createdAt: new Date(now - 5 * 60 * 1000).toISOString(),
      read: false,
    },
    {
      id: "planner_init",
      title: "Review your study plan",
      message: "Take a moment to review your upcoming study tasks and deadlines.",
      type: "reminder",
      createdAt: new Date(now - 60 * 60 * 1000).toISOString(),
      read: false,
    },
    {
      id: "progress_init",
      title: "Keep up your progress",
      message: "Visit Study Tracking to review your study activity and progress.",
      type: "achievement",
      createdAt: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
      read: true,
    },
  ];
}

export function NotificationProvider({ children }) {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return getInitialLocalNotifications();
  });

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((toastData) => {
    setToast(toastData);
    const timer = setTimeout(() => {
      setToast(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const headers = getAuthHeaders(token);
      const res = await fetch(NOTIFICATIONS_API_URL, { headers });
      if (res.ok) {
        const json = await res.json();
        const list = Array.isArray(json.data) ? json.data : [];
        if (list.length > 0) {
          setNotifications(list);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        }
      }
    } catch (err) {
      console.warn("Could not fetch remote notifications, using local:", err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Refetch when user or token changes
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const headers = getAuthHeaders(token);
        const res = await fetch(NOTIFICATIONS_API_URL, { headers });
        if (res.ok && active) {
          const json = await res.json();
          const list = Array.isArray(json.data) ? json.data : [];
          if (list.length > 0) {
            setNotifications(list);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
          }
        }
      } catch (err) {
        console.warn("Could not fetch notifications:", err.message);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [token, user]);

  // Keep local storage synced
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch (e) {
      console.warn("Notification storage save error:", e);
    }
  }, [notifications]);

  const unreadCount = useMemo(() => {
    return notifications.filter((item) => !item.read).length;
  }, [notifications]);

  const markAsRead = useCallback(async (id) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item))
    );

    try {
      await fetch(`${NOTIFICATIONS_API_URL}/${id}/read`, {
        method: "PATCH",
        headers: getAuthHeaders(token),
      });
    } catch (err) {
      console.warn("Backend mark-read failed:", err.message);
    }
  }, [token]);

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));

    try {
      await fetch(`${NOTIFICATIONS_API_URL}/read-all`, {
        method: "PATCH",
        headers: getAuthHeaders(token),
      });
    } catch (err) {
      console.warn("Backend mark-all-read failed:", err.message);
    }
  }, [token]);

  const deleteNotification = useCallback(async (id) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));

    try {
      await fetch(`${NOTIFICATIONS_API_URL}/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(token),
      });
    } catch (err) {
      console.warn("Backend delete-notification failed:", err.message);
    }
  }, [token]);

  const clearAllNotifications = useCallback(async () => {
    setNotifications([]);

    try {
      await fetch(NOTIFICATIONS_API_URL, {
        method: "DELETE",
        headers: getAuthHeaders(token),
      });
    } catch (err) {
      console.warn("Backend clear-notifications failed:", err.message);
    }
  }, [token]);

  const addNotification = useCallback(async ({ title, message, type = "general", link = null }) => {
    const tempId = `notif_${Date.now()}`;
    const newNotif = {
      id: tempId,
      title,
      message,
      type,
      link,
      read: false,
      createdAt: new Date().toISOString(),
    };

    setNotifications((prev) => [newNotif, ...prev]);
    showToast({ title, message, type });

    try {
      const res = await fetch(NOTIFICATIONS_API_URL, {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify({ title, message, type, link }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.data?.id) {
          setNotifications((prev) =>
            prev.map((item) => (item.id === tempId ? json.data : item))
          );
        }
      }
    } catch (err) {
      console.warn("Backend add-notification failed, kept locally:", err.message);
    }
  }, [token, showToast]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        toast,
        setToast,
        showToast,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAllNotifications,
        addNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
