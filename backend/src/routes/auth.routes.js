const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../db/database");
const { generateToken } = require("../utils/token");
const { requireAuth } = require("../middlewares/auth.middleware");

const router = express.Router();

// POST /api/auth/signup
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({
        message: "Please fill in all fields (name, email, and password)",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const checkStmt = db.prepare("SELECT id FROM users WHERE email = ?");
    const existing = checkStmt.get(normalizedEmail);

    if (existing) {
      return res.status(409).json({
        message: "An account with this email already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const insertUser = db.prepare(
      "INSERT INTO users (id, name, email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
    );
    insertUser.run(userId, name.trim(), normalizedEmail, passwordHash, now, now);

    // Create initial welcome notifications for the newly registered user
    const insertNotif = db.prepare(
      "INSERT INTO notifications (id, user_id, title, message, type, read, link, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    );

    insertNotif.run(
      `notif_${Date.now()}_1`,
      userId,
      "Welcome to StudySync! 🎉",
      `Hi ${name.trim()}! Your study workspace is ready. Plan tasks, track focus sessions, and join study rooms.`,
      "general",
      0,
      "/dashboard",
      now
    );

    insertNotif.run(
      `notif_${Date.now()}_2`,
      userId,
      "Get Started with Study Planner",
      "Add your first subject and upcoming deadlines in the Study Planner to stay organized.",
      "reminder",
      0,
      "/study-planner",
      new Date(Date.now() + 1000).toISOString()
    );

    const token = generateToken({ id: userId, email: normalizedEmail });

    return res.status(201).json({
      success: true,
      message: "Signup successful! Welcome to StudySync.",
      user: {
        id: userId,
        name: name.trim(),
        email: normalizedEmail,
        createdAt: now,
      },
      token,
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({
      message: "Signup failed. Please try again later.",
    });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const findStmt = db.prepare(
      "SELECT id, name, email, password_hash, created_at FROM users WHERE email = ?"
    );
    const user = findStmt.get(normalizedEmail);

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = generateToken({ id: user.id, email: user.email });

    return res.json({
      success: true,
      message: "Login successful! Welcome back.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.created_at,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      message: "Login failed. Please try again later.",
    });
  }
});

// GET /api/auth/me
router.get("/me", requireAuth, (req, res) => {
  return res.json({
    success: true,
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      createdAt: req.user.created_at,
    },
  });
});

// PUT /api/auth/profile
router.put("/profile", requireAuth, (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ message: "Name cannot be empty" });
    }

    const now = new Date().toISOString();
    const updateStmt = db.prepare(
      "UPDATE users SET name = ?, updated_at = ? WHERE id = ?"
    );
    updateStmt.run(name.trim(), now, req.user.id);

    return res.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: req.user.id,
        name: name.trim(),
        email: req.user.email,
        createdAt: req.user.created_at,
      },
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return res.status(500).json({ message: "Failed to update profile" });
  }
});

module.exports = router;
