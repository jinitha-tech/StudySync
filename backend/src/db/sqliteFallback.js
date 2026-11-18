/**
 * sqliteFallback.js
 *
 * Provides a Prisma-compatible query interface backed by SQLite (backend/data/studysync.db)
 * when DATABASE_URL is not configured in local development.
 * This guarantees that local development never crashes if PostgreSQL credentials have not
 * yet been added to backend/.env.
 */

const path = require("node:path");
const fs = require("node:fs");
const { DatabaseSync } = require("node:sqlite");

const dataDir = path.resolve(__dirname, "../../data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const dbPath = path.join(dataDir, "studysync.db");
const db = new DatabaseSync(dbPath);

db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");

// Ensure tables exist
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

function safeDate(val) {
  if (!val) return new Date();
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? new Date() : val;
  }
  const d = new Date(val);
  return isNaN(d.getTime()) ? new Date() : d;
}

function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    resetToken: row.reset_token || null,
    resetTokenExpires: row.reset_token_expires ? safeDate(row.reset_token_expires) : null,
    createdAt: safeDate(row.created_at),
    updatedAt: safeDate(row.updated_at),
  };
}

function mapNotif(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id || null,
    title: row.title,
    message: row.message,
    type: row.type || "general",
    read: Boolean(row.read),
    link: row.link || null,
    createdAt: safeDate(row.created_at),
  };
}

function mapTask(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    userId: row.user_id || null,
    title: row.title,
    description: row.description || "",
    deadline: row.deadline || null,
    priority: row.priority || "medium",
    completed: Boolean(row.completed),
    createdAt: safeDate(row.created_at),
    updatedAt: safeDate(row.updated_at),
  };
}

const sqlitePrisma = {
  user: {
    findUnique: async ({ where }) => {
      if (where.email) {
        const row = db.prepare("SELECT * FROM users WHERE email = ?").get(where.email.toLowerCase());
        return mapUser(row);
      }
      if (where.id) {
        const row = db.prepare("SELECT * FROM users WHERE id = ?").get(where.id);
        return mapUser(row);
      }
      return null;
    },
    findFirst: async ({ where }) => {
      let sql = "SELECT * FROM users WHERE 1=1";
      const params = [];
      if (where.resetToken) {
        sql += " AND reset_token = ?";
        params.push(where.resetToken);
      }
      if (where.resetTokenExpires?.gt) {
        sql += " AND reset_token_expires > ?";
        params.push(where.resetTokenExpires.gt.toISOString());
      }
      const row = db.prepare(sql).get(...params);
      return mapUser(row);
    },
    create: async ({ data }) => {
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO users (id, name, email, password_hash, reset_token, reset_token_expires, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        data.id,
        data.name.trim(),
        data.email.toLowerCase(),
        data.passwordHash,
        data.resetToken || null,
        data.resetTokenExpires ? data.resetTokenExpires.toISOString() : null,
        now,
        now
      );
      const row = db.prepare("SELECT * FROM users WHERE id = ?").get(data.id);
      return mapUser(row);
    },
    update: async ({ where, data }) => {
      const existing = db.prepare("SELECT * FROM users WHERE id = ?").get(where.id);
      if (!existing) throw new Error("User not found");
      const name = data.name !== undefined ? data.name.trim() : existing.name;
      const passwordHash = data.passwordHash !== undefined ? data.passwordHash : existing.password_hash;
      const resetToken = data.resetToken !== undefined ? data.resetToken : existing.reset_token;
      const resetExpires = data.resetTokenExpires !== undefined
        ? (data.resetTokenExpires ? data.resetTokenExpires.toISOString() : null)
        : existing.reset_token_expires;
      const now = new Date().toISOString();

      db.prepare(`
        UPDATE users SET name = ?, password_hash = ?, reset_token = ?, reset_token_expires = ?, updated_at = ?
        WHERE id = ?
      `).run(name, passwordHash, resetToken, resetExpires, now, where.id);

      const row = db.prepare("SELECT * FROM users WHERE id = ?").get(where.id);
      return mapUser(row);
    },
    count: async () => {
      const row = db.prepare("SELECT count(*) as count FROM users").get();
      return Number(row.count);
    },
  },

  notification: {
    findMany: async ({ where, orderBy, take } = {}) => {
      let sql = "SELECT * FROM notifications";
      const params = [];
      if (where?.OR) {
        const uId = where.OR.find((c) => c.userId !== null)?.userId;
        sql += " WHERE user_id = ? OR user_id IS NULL";
        params.push(uId);
      }
      sql += " ORDER BY created_at DESC";
      if (take) {
        sql += ` LIMIT ${Number(take)}`;
      }
      const rows = db.prepare(sql).all(...params);
      return rows.map(mapNotif);
    },
    create: async ({ data }) => {
      const now = data.createdAt ? safeDate(data.createdAt).toISOString() : new Date().toISOString();
      db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, type, read, link, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        data.id,
        data.userId || null,
        data.title,
        data.message,
        data.type || "general",
        data.read ? 1 : 0,
        data.link || null,
        now
      );
      const row = db.prepare("SELECT * FROM notifications WHERE id = ?").get(data.id);
      return mapNotif(row);
    },
    createMany: async ({ data }) => {
      for (const item of data) {
        await sqlitePrisma.notification.create({ data: item });
      }
      return { count: data.length };
    },
    update: async ({ where, data }) => {
      if (data.read !== undefined) {
        db.prepare("UPDATE notifications SET read = ? WHERE id = ?").run(data.read ? 1 : 0, where.id);
      }
      const row = db.prepare("SELECT * FROM notifications WHERE id = ?").get(where.id);
      return mapNotif(row);
    },
    updateMany: async ({ where, data }) => {
      let sql = "UPDATE notifications SET read = ?";
      const params = [data.read ? 1 : 0];
      if (where?.OR) {
        const uId = where.OR.find((c) => c.userId !== null)?.userId;
        sql += " WHERE user_id = ? OR user_id IS NULL";
        params.push(uId);
      }
      const res = db.prepare(sql).run(...params);
      return { count: res.changes };
    },
    delete: async ({ where }) => {
      db.prepare("DELETE FROM notifications WHERE id = ?").run(where.id);
      return { id: where.id };
    },
    deleteMany: async ({ where } = {}) => {
      let sql = "DELETE FROM notifications";
      const params = [];
      if (where?.OR) {
        const uId = where.OR.find((c) => c.userId !== null)?.userId;
        sql += " WHERE user_id = ? OR user_id IS NULL";
        params.push(uId);
      }
      const res = db.prepare(sql).run(...params);
      return { count: res.changes };
    },
  },

  task: {
    findMany: async ({ where } = {}) => {
      let sql = "SELECT * FROM tasks";
      const params = [];
      if (where?.userId) {
        sql += " WHERE user_id = ?";
        params.push(where.userId);
      }
      sql += " ORDER BY id DESC";
      const rows = db.prepare(sql).all(...params);
      return rows.map(mapTask);
    },
    findFirst: async ({ where } = {}) => {
      let sql = "SELECT * FROM tasks WHERE id = ?";
      const params = [Number(where.id)];
      if (where.userId) {
        sql += " AND user_id = ?";
        params.push(where.userId);
      }
      const row = db.prepare(sql).get(...params);
      return mapTask(row);
    },
    create: async ({ data }) => {
      const now = new Date().toISOString();
      const res = db.prepare(`
        INSERT INTO tasks (user_id, title, description, deadline, priority, completed, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        data.userId || null,
        data.title,
        data.description || "",
        data.deadline || null,
        data.priority || "medium",
        data.completed ? 1 : 0,
        now,
        now
      );
      const taskId = Number(res.lastInsertRowid);
      const row = db.prepare("SELECT * FROM tasks WHERE id = ?").get(taskId);
      return mapTask(row);
    },
    update: async ({ where, data }) => {
      const existing = db.prepare("SELECT * FROM tasks WHERE id = ?").get(Number(where.id));
      if (!existing) throw new Error("Task not found");
      const title = data.title !== undefined ? data.title : existing.title;
      const description = data.description !== undefined ? data.description : existing.description;
      const deadline = data.deadline !== undefined ? data.deadline : existing.deadline;
      const priority = data.priority !== undefined ? data.priority : existing.priority;
      const completed = data.completed !== undefined ? (data.completed ? 1 : 0) : existing.completed;
      const now = new Date().toISOString();

      db.prepare(`
        UPDATE tasks SET title = ?, description = ?, deadline = ?, priority = ?, completed = ?, updated_at = ?
        WHERE id = ?
      `).run(title, description, deadline, priority, completed, now, Number(where.id));

      const row = db.prepare("SELECT * FROM tasks WHERE id = ?").get(Number(where.id));
      return mapTask(row);
    },
    delete: async ({ where }) => {
      db.prepare("DELETE FROM tasks WHERE id = ?").run(Number(where.id));
      return { id: Number(where.id) };
    },
  },

  $connect: async () => Promise.resolve(),
  $disconnect: async () => Promise.resolve(),
};

module.exports = sqlitePrisma;
