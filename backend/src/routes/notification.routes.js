const express = require("express");
const db = require("../db/database");
const { optionalAuth } = require("../middlewares/auth.middleware");

const router = express.Router();

// GET /api/notifications
router.get("/", optionalAuth, (req, res) => {
  try {
    let rows;
    if (req.user) {
      const stmt = db.prepare(
        "SELECT * FROM notifications WHERE user_id = ? OR user_id IS NULL ORDER BY created_at DESC"
      );
      rows = stmt.all(req.user.id);
    } else {
      const stmt = db.prepare(
        "SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50"
      );
      rows = stmt.all();
    }

    // Map `read` integer (0 or 1) to boolean
    const notifications = rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      title: row.title,
      message: row.message,
      type: row.type || "general",
      read: Boolean(row.read),
      link: row.link || null,
      createdAt: row.created_at,
    }));

    // If notifications are completely empty, create initial fallback notifications
    if (notifications.length === 0) {
      const now = new Date();
      const initial = [
        {
          id: "welcome_init",
          userId: req.user?.id || null,
          title: "Welcome to StudySync!",
          message: "Your study workspace is ready. Keep your tasks and study sessions organized.",
          type: "general",
          read: false,
          createdAt: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
        },
        {
          id: "planner_init",
          userId: req.user?.id || null,
          title: "Review your study plan",
          message: "Take a moment to review your upcoming study tasks and deadlines.",
          type: "reminder",
          read: false,
          createdAt: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
        },
        {
          id: "progress_init",
          userId: req.user?.id || null,
          title: "Keep up your progress",
          message: "Visit Study Tracking to review your study activity and progress.",
          type: "achievement",
          read: true,
          createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
        },
      ];

      const insertStmt = db.prepare(
        "INSERT INTO notifications (id, user_id, title, message, type, read, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
      );
      for (const item of initial) {
        insertStmt.run(
          item.id,
          item.userId,
          item.title,
          item.message,
          item.type,
          item.read ? 1 : 0,
          item.createdAt
        );
      }

      return res.json({ success: true, data: initial });
    }

    return res.json({ success: true, data: notifications });
  } catch (error) {
    console.error("Fetch notifications error:", error);
    return res.status(500).json({ message: "Failed to load notifications" });
  }
});

// POST /api/notifications
router.post("/", optionalAuth, (req, res) => {
  try {
    const { title, message, type = "general", link = null } = req.body;

    if (!title?.trim() || !message?.trim()) {
      return res.status(400).json({ message: "Title and message are required" });
    }

    const id = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const createdAt = new Date().toISOString();
    const userId = req.user?.id || req.body.userId || null;

    const stmt = db.prepare(
      "INSERT INTO notifications (id, user_id, title, message, type, read, link, created_at) VALUES (?, ?, ?, ?, ?, 0, ?, ?)"
    );
    stmt.run(id, userId, title.trim(), message.trim(), type, link, createdAt);

    return res.status(201).json({
      success: true,
      data: {
        id,
        userId,
        title: title.trim(),
        message: message.trim(),
        type,
        read: false,
        link,
        createdAt,
      },
    });
  } catch (error) {
    console.error("Create notification error:", error);
    return res.status(500).json({ message: "Failed to create notification" });
  }
});

// PATCH /api/notifications/:id/read
router.patch("/:id/read", optionalAuth, (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare("UPDATE notifications SET read = 1 WHERE id = ?");
    stmt.run(id);

    return res.json({ success: true, message: "Marked as read" });
  } catch (error) {
    console.error("Mark notification read error:", error);
    return res.status(500).json({ message: "Failed to update notification" });
  }
});

// PATCH /api/notifications/read-all
router.patch("/read-all", optionalAuth, (req, res) => {
  try {
    if (req.user) {
      const stmt = db.prepare(
        "UPDATE notifications SET read = 1 WHERE user_id = ? OR user_id IS NULL"
      );
      stmt.run(req.user.id);
    } else {
      const stmt = db.prepare("UPDATE notifications SET read = 1");
      stmt.run();
    }

    return res.json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    console.error("Mark all read error:", error);
    return res.status(500).json({ message: "Failed to mark all as read" });
  }
});

// DELETE /api/notifications/:id
router.delete("/:id", optionalAuth, (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare("DELETE FROM notifications WHERE id = ?");
    stmt.run(id);

    return res.status(204).end();
  } catch (error) {
    console.error("Delete notification error:", error);
    return res.status(500).json({ message: "Failed to delete notification" });
  }
});

// DELETE /api/notifications
router.delete("/", optionalAuth, (req, res) => {
  try {
    if (req.user) {
      const stmt = db.prepare(
        "DELETE FROM notifications WHERE user_id = ? OR user_id IS NULL"
      );
      stmt.run(req.user.id);
    } else {
      const stmt = db.prepare("DELETE FROM notifications");
      stmt.run();
    }

    return res.status(204).end();
  } catch (error) {
    console.error("Clear notifications error:", error);
    return res.status(500).json({ message: "Failed to clear notifications" });
  }
});

module.exports = router;
