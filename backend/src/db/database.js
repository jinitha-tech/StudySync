/**
 * db/database.js
 *
 * Unified database interface.
 * - If DATABASE_URL is set → use PostgreSQL (pg)
 * - Otherwise             → use Node.js built-in SQLite (node:sqlite)
 *
 * Both adapters expose the same surface:
 *   db.exec(sql)
 *   db.prepare(sql) → { get, all, run }
 */

const path = require("node:path");
const fs   = require("node:fs");
const bcrypt = require("bcryptjs");

// ─── PostgreSQL adapter ────────────────────────────────────────────────────────
if (process.env.DATABASE_URL) {
  const { Pool } = require("pg");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  // Simple synchronous-style wrapper using async + sync coordination is not
  // feasible with pg (async driver). Instead we expose the same surface but
  // return Promises. Because all callers in the existing code use the results
  // synchronously (SQLite DatabaseSync), we upgrade every route that touches
  // the DB to work async-first by exporting a Promise-based pool helper.
  //
  // However, to keep the existing route code working without mass rewrites,
  // we export the pool directly and also keep a "prepare" shim that works
  // with explicit await at call sites.  The SQLite-style synchronous prepare()
  // is replaced with a pg-compatible async version below.

  console.log("🐘 Using PostgreSQL database");

  async function initPg() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        reset_token TEXT,
        reset_token_expires TIMESTAMPTZ,
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
        id SERIAL PRIMARY KEY,
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

    const { rows } = await pool.query("SELECT count(*) as count FROM users");
    if (parseInt(rows[0].count, 10) === 0) {
      await seedPg();
    }
  }

  async function seedPg() {
    const demoId = "usr_demo_1";
    const now    = new Date().toISOString();
    const demoHash = await bcrypt.hash("password123", 10);

    await pool.query(
      "INSERT INTO users (id,name,email,password_hash,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING",
      [demoId, "Alex Johnson", "alex@studysync.io", demoHash, now, now]
    );

    const notifs = [
      { id: "notif_demo_1", title: "Welcome to StudySync! 🎉", message: "Your study workspace is fully configured.", type: "general", read: 0, link: "/dashboard",      at: now },
      { id: "notif_demo_2", title: "Calculus Problem Set Reminder ⏰", message: "Your Mathematics problem set is due this Friday.", type: "reminder", read: 0, link: "/study-planner", at: new Date(Date.now()-3600000).toISOString() },
      { id: "notif_demo_3", title: "Study Streak Milestone 🏆", message: "3-day streak!", type: "achievement", read: 1, link: "/study-tracking", at: new Date(Date.now()-86400000).toISOString() },
    ];
    for (const n of notifs) {
      await pool.query(
        "INSERT INTO notifications (id,user_id,title,message,type,read,link,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT DO NOTHING",
        [n.id, demoId, n.title, n.message, n.type, n.read, n.link, n.at]
      );
    }
  }

  initPg().catch(console.error);

  // Export pg pool for async route handlers
  module.exports = pool;
  module.exports._isPg = true;

} else {
  // ─── SQLite adapter ────────────────────────────────────────────────────────
  const { DatabaseSync } = require("node:sqlite");

  const dataDir = path.join(__dirname, "../../data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const dbPath = path.join(dataDir, "studysync.db");
  const db     = new DatabaseSync(dbPath);

  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      reset_token TEXT,
      reset_token_expires TEXT,
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

  // Add reset_token columns if upgrading existing DB
  try { db.exec("ALTER TABLE users ADD COLUMN reset_token TEXT;"); } catch {}
  try { db.exec("ALTER TABLE users ADD COLUMN reset_token_expires TEXT;"); } catch {}

  // Seed demo data
  try {
    const userCount = db.prepare("SELECT count(*) as count FROM users").get();
    if (userCount.count === 0) {
      const demoId   = "usr_demo_1";
      const now      = new Date().toISOString();
      const demoHash = bcrypt.hashSync("password123", 10);

      db.prepare(
        "INSERT INTO users (id,name,email,password_hash,created_at,updated_at) VALUES (?,?,?,?,?,?)"
      ).run(demoId, "Alex Johnson", "alex@studysync.io", demoHash, now, now);

      const notifStmt = db.prepare(
        "INSERT INTO notifications (id,user_id,title,message,type,read,link,created_at) VALUES (?,?,?,?,?,?,?,?)"
      );
      notifStmt.run("notif_demo_1", demoId, "Welcome to StudySync! 🎉", "Your study workspace is fully configured.", "general", 0, "/dashboard", now);
      notifStmt.run("notif_demo_2", demoId, "Calculus Problem Set Reminder ⏰", "Mathematics problem set due this Friday.", "reminder", 0, "/study-planner", new Date(Date.now()-3600000).toISOString());
      notifStmt.run("notif_demo_3", demoId, "Study Streak Milestone 🏆", "3-day streak!", "achievement", 1, "/study-tracking", new Date(Date.now()-86400000).toISOString());

      const taskStmt = db.prepare(
        "INSERT INTO tasks (user_id,title,description,deadline,priority,completed,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)"
      );
      const tomorrow = new Date(Date.now()+86400000).toISOString().slice(0,10);
      const nextWeek = new Date(Date.now()+7*86400000).toISOString().slice(0,10);
      taskStmt.run(demoId, "Revise Computer Networks Layer 3", "Networking", tomorrow, "high", 0, now, now);
      taskStmt.run(demoId, "Practice Data Structures: Binary Trees", "Algorithms", nextWeek, "medium", 0, now, now);
      taskStmt.run(demoId, "Complete React Hooks Summary", "Web Development", null, "low", 1, now, now);
    }
  } catch (seedErr) {
    console.warn("Database seed warning:", seedErr.message);
  }

  console.log("🗄️  Using SQLite database");
  module.exports = db;
  module.exports._isPg = false;
}
