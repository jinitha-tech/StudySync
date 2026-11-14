const express = require("express");
const db       = require("../db/database");
const { optionalAuth } = require("../middlewares/auth.middleware");

const router = express.Router();

// ─── GET /api/notifications ────────────────────────────────────────────────────
router.get("/", optionalAuth, (req, res) => {
  try {
    let rows;
    if (req.user) {
      rows = db.prepare(
        "SELECT * FROM notifications WHERE user_id = ? OR user_id IS NULL ORDER BY created_at DESC"
      ).all(req.user.id);
    } else {
      rows = db.prepare(
        "SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50"
      ).all();
    }

    const notifications = rows.map(rowToNotif);

    // Fallback seed if completely empty
    if (notifications.length === 0) {
      const now    = new Date();
      const userId = req.user?.id || null;
      const initial = [
        { id: "welcome_init",  userId, title: "Welcome to StudySync!",       message: "Your study workspace is ready.",                               type: "general",     read: false, link: null, createdAt: new Date(now - 5*60*1000).toISOString() },
        { id: "planner_init",  userId, title: "Review your study plan",      message: "Take a moment to review your upcoming study tasks.",            type: "reminder",    read: false, link: null, createdAt: new Date(now - 60*60*1000).toISOString() },
        { id: "progress_init", userId, title: "Keep up your progress",       message: "Visit Study Tracking to review your study activity.",           type: "achievement", read: true,  link: null, createdAt: new Date(now - 24*60*60*1000).toISOString() },
      ];

      const insertStmt = db.prepare(
        "INSERT INTO notifications (id,user_id,title,message,type,read,created_at) VALUES (?,?,?,?,?,?,?)"
      );
      for (const item of initial) {
        insertStmt.run(item.id, item.userId, item.title, item.message, item.type, item.read ? 1 : 0, item.createdAt);
      }
      return res.json({ success: true, data: initial });
    }

    return res.json({ success: true, data: notifications });
  } catch (error) {
    console.error("Fetch notifications error:", error);
    return res.status(500).json({ message: "Failed to load notifications" });
  }
});

// ─── POST /api/notifications ───────────────────────────────────────────────────
router.post("/", optionalAuth, (req, res) => {
  try {
    const { title, message, type = "general", link = null } = req.body;

    if (!title?.trim() || !message?.trim()) {
      return res.status(400).json({ message: "Title and message are required" });
    }

    const id        = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const createdAt = new Date().toISOString();
    const userId    = req.user?.id || req.body.userId || null;

    db.prepare(
      "INSERT INTO notifications (id,user_id,title,message,type,read,link,created_at) VALUES (?,?,?,?,?,0,?,?)"
    ).run(id, userId, title.trim(), message.trim(), type, link, createdAt);

    return res.status(201).json({
      success: true,
      data: { id, userId, title: title.trim(), message: message.trim(), type, read: false, link, createdAt },
    });
  } catch (error) {
    console.error("Create notification error:", error);
    return res.status(500).json({ message: "Failed to create notification" });
  }
});

// ─── PATCH /api/notifications/read-all  ← MUST come before /:id ───────────────
router.patch("/read-all", optionalAuth, (req, res) => {
  try {
    if (req.user) {
      db.prepare("UPDATE notifications SET read = 1 WHERE user_id = ? OR user_id IS NULL").run(req.user.id);
    } else {
      db.prepare("UPDATE notifications SET read = 1").run();
    }
    return res.json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    console.error("Mark all read error:", error);
    return res.status(500).json({ message: "Failed to mark all as read" });
  }
});

// ─── PATCH /api/notifications/:id/read ────────────────────────────────────────
router.patch("/:id/read", optionalAuth, (req, res) => {
  try {
    db.prepare("UPDATE notifications SET read = 1 WHERE id = ?").run(req.params.id);
    return res.json({ success: true, message: "Marked as read" });
  } catch (error) {
    console.error("Mark notification read error:", error);
    return res.status(500).json({ message: "Failed to update notification" });
  }
});

// ─── DELETE /api/notifications  ← MUST come before /:id ──────────────────────
router.delete("/", optionalAuth, (req, res) => {
  try {
    if (req.user) {
      db.prepare("DELETE FROM notifications WHERE user_id = ? OR user_id IS NULL").run(req.user.id);
    } else {
      db.prepare("DELETE FROM notifications").run();
    }
    return res.status(204).end();
  } catch (error) {
    console.error("Clear notifications error:", error);
    return res.status(500).json({ message: "Failed to clear notifications" });
  }
});

// ─── DELETE /api/notifications/:id ────────────────────────────────────────────
router.delete("/:id", optionalAuth, (req, res) => {
  try {
    db.prepare("DELETE FROM notifications WHERE id = ?").run(req.params.id);
    return res.status(204).end();
  } catch (error) {
    console.error("Delete notification error:", error);
    return res.status(500).json({ message: "Failed to delete notification" });
  }
});

// ── helper ───────────────────────────────────────────────────────────────────
function rowToNotif(row) {
  return {
    id:        row.id,
    userId:    row.user_id,
    title:     row.title,
    message:   row.message,
    type:      row.type || "general",
    read:      Boolean(row.read),
    link:      row.link || null,
    createdAt: row.created_at,
  };
}

module.exports = router;
