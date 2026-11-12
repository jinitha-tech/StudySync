const { DatabaseSync } = require("node:sqlite");
const path = require("node:path");
const fs = require("node:fs");
const bcrypt = require("bcryptjs");

const dataDir = path.join(__dirname, "../../data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "studysync.db");
const db = new DatabaseSync(dbPath);

// Enable WAL mode and foreign keys for reliability
db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'general',
    read INTEGER DEFAULT 0,
    link TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    title TEXT NOT NULL,
    description TEXT,
    deadline TEXT,
    priority TEXT DEFAULT 'medium',
    completed INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

// Seed initial demo data if database is empty
try {
  const userCount = db.prepare("SELECT count(*) as count FROM users").get();
  if (userCount.count === 0) {
    const demoId = "usr_demo_1";
    const now = new Date().toISOString();
    const demoHash = bcrypt.hashSync("password123", 10);

    db.prepare(`
      INSERT INTO users (id, name, email, password_hash, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(demoId, "Alex Johnson", "alex@studysync.io", demoHash, now, now);

    // Initial demo notifications
    const notifStmt = db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type, read, link, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    notifStmt.run(
      "notif_demo_1",
      demoId,
      "Welcome to StudySync! 🎉",
      "Your study workspace is fully configured. Plan your sessions, track habits, and study together.",
      "general",
      0,
      "/dashboard",
      now
    );

    notifStmt.run(
      "notif_demo_2",
      demoId,
      "Calculus Problem Set Reminder ⏰",
      "Your Mathematics problem set is due this Friday. Check your Study Planner.",
      "reminder",
      0,
      "/study-planner",
      new Date(Date.now() - 3600000).toISOString()
    );

    notifStmt.run(
      "notif_demo_3",
      demoId,
      "Study Streak Milestone 🏆",
      "You finished your daily goals 3 days in a row! Keep up the momentum.",
      "achievement",
      1,
      "/study-tracking",
      new Date(Date.now() - 86400000).toISOString()
    );

    // Initial demo planner tasks
    const taskStmt = db.prepare(`
      INSERT INTO tasks (user_id, title, description, deadline, priority, completed, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

    taskStmt.run(
      demoId,
      "Revise Computer Networks Layer 3",
      "Networking",
      tomorrow,
      "high",
      0,
      now,
      now
    );

    taskStmt.run(
      demoId,
      "Practice Data Structures: Binary Trees",
      "Algorithms",
      nextWeek,
      "medium",
      0,
      now,
      now
    );

    taskStmt.run(
      demoId,
      "Complete React Hooks Summary",
      "Web Development",
      null,
      "low",
      1,
      now,
      now
    );
  }
} catch (seedErr) {
  console.warn("Database seed warning:", seedErr.message);
}

module.exports = db;
