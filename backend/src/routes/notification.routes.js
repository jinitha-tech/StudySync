const express = require("express");
const prisma  = require("../db/prisma");
const { optionalAuth } = require("../middlewares/auth.middleware");

const router = express.Router();

function rowToNotif(row) {
  return {
    id:        row.id,
    userId:    row.userId,
    title:     row.title,
    message:   row.message,
    type:      row.type || "general",
    read:      Boolean(row.read),
    link:      row.link || null,
    createdAt: row.createdAt,
  };
}

// ─── GET /api/notifications ────────────────────────────────────────────────────
router.get("/", optionalAuth, async (req, res) => {
  try {
    let rows;
    if (req.user) {
      rows = await prisma.notification.findMany({
        where: {
          OR: [
            { userId: req.user.id },
            { userId: null },
          ],
        },
        orderBy: { createdAt: "desc" },
      });
    } else {
      rows = await prisma.notification.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      });
    }

    const notifications = rows.map(rowToNotif);

    // Fallback seed if completely empty
    if (notifications.length === 0) {
      const now    = new Date();
      const userId = req.user?.id || null;
      const initial = [
        { id: "welcome_init",  userId, title: "Welcome to StudySync!",       message: "Your study workspace is ready.",                               type: "general",     read: 0, link: null, createdAt: new Date(now - 5*60*1000).toISOString() },
        { id: "planner_init",  userId, title: "Review your study plan",      message: "Take a moment to review your upcoming study tasks.",            type: "reminder",    read: 0, link: null, createdAt: new Date(now - 60*60*1000).toISOString() },
        { id: "progress_init", userId, title: "Keep up your progress",       message: "Visit Study Tracking to review your study activity.",           type: "achievement", read: 1, link: null, createdAt: new Date(now - 24*60*60*1000).toISOString() },
      ];

      for (const item of initial) {
        await prisma.notification.create({ data: item });
      }

      return res.json({ success: true, data: initial.map(rowToNotif) });
    }

    return res.json({ success: true, data: notifications });
  } catch (error) {
    console.error("Fetch notifications error:", error);
    return res.status(500).json({ message: "Failed to load notifications" });
  }
});

// ─── POST /api/notifications ───────────────────────────────────────────────────
router.post("/", optionalAuth, async (req, res) => {
  try {
    const { title, message, type = "general", link = null } = req.body;

    if (!title?.trim() || !message?.trim()) {
      return res.status(400).json({ message: "Title and message are required" });
    }

    const id        = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const createdAt = new Date().toISOString();
    const userId    = req.user?.id || req.body.userId || null;

    const notif = await prisma.notification.create({
      data: {
        id,
        userId,
        title: title.trim(),
        message: message.trim(),
        type,
        read: 0,
        link,
        createdAt,
      },
    });

    return res.status(201).json({
      success: true,
      data: rowToNotif(notif),
    });
  } catch (error) {
    console.error("Create notification error:", error);
    return res.status(500).json({ message: "Failed to create notification" });
  }
});

// ─── PATCH /api/notifications/read-all  ← MUST come before /:id ───────────────
router.patch("/read-all", optionalAuth, async (req, res) => {
  try {
    if (req.user) {
      await prisma.notification.updateMany({
        where: {
          OR: [
            { userId: req.user.id },
            { userId: null },
          ],
        },
        data: { read: 1 },
      });
    } else {
      await prisma.notification.updateMany({
        data: { read: 1 },
      });
    }
    return res.json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    console.error("Mark all read error:", error);
    return res.status(500).json({ message: "Failed to mark all as read" });
  }
});

// ─── PATCH /api/notifications/:id/read ────────────────────────────────────────
router.patch("/:id/read", optionalAuth, async (req, res) => {
  try {
    await prisma.notification.update({
      where: { id: req.params.id },
      data: { read: 1 },
    });
    return res.json({ success: true, message: "Marked as read" });
  } catch (error) {
    console.error("Mark notification read error:", error);
    return res.status(500).json({ message: "Failed to update notification" });
  }
});

// ─── DELETE /api/notifications  ← MUST come before /:id ──────────────────────
router.delete("/", optionalAuth, async (req, res) => {
  try {
    if (req.user) {
      await prisma.notification.deleteMany({
        where: {
          OR: [
            { userId: req.user.id },
            { userId: null },
          ],
        },
      });
    } else {
      await prisma.notification.deleteMany({});
    }
    return res.status(204).end();
  } catch (error) {
    console.error("Clear notifications error:", error);
    return res.status(500).json({ message: "Failed to clear notifications" });
  }
});

// ─── DELETE /api/notifications/:id ────────────────────────────────────────────
router.delete("/:id", optionalAuth, async (req, res) => {
  try {
    await prisma.notification.deleteMany({
      where: { id: req.params.id },
    });
    return res.status(204).end();
  } catch (error) {
    console.error("Delete notification error:", error);
    return res.status(500).json({ message: "Failed to delete notification" });
  }
});

module.exports = router;
