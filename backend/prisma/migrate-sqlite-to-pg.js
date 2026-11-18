/**
 * prisma/migrate-sqlite-to-pg.js
 *
 * Migrates existing SQLite data (from backend/data/studysync.db) into PostgreSQL via Prisma.
 * Preserves user records, hashed passwords, tasks, and notifications with zero data loss.
 */

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const path = require("node:path");
const fs   = require("node:fs");
const { PrismaClient } = require("@prisma/client");

async function migrateData() {
  const dbPath = path.join(__dirname, "../data/studysync.db");
  if (!fs.existsSync(dbPath)) {
    console.log("ℹ️ No SQLite database found at:", dbPath);
    return;
  }

  const { DatabaseSync } = require("node:sqlite");
  const sqlite = new DatabaseSync(dbPath);
  const prisma = new PrismaClient();

  try {
    console.log("🚀 Starting SQLite -> PostgreSQL data migration...");

    // 1. Migrate Users
    const users = sqlite.prepare("SELECT * FROM users").all();
    console.log(`👤 Found ${users.length} users in SQLite.`);
    for (const u of users) {
      await prisma.user.upsert({
        where: { id: u.id },
        update: {},
        create: {
          id: u.id,
          name: u.name,
          email: u.email,
          passwordHash: u.password_hash,
          resetToken: u.reset_token || null,
          resetTokenExpires: u.reset_token_expires || null,
          createdAt: u.created_at,
          updatedAt: u.updated_at,
        },
      });
    }
    console.log(`✅ Users migrated successfully.`);

    // 2. Migrate Notifications
    const notifs = sqlite.prepare("SELECT * FROM notifications").all();
    console.log(`🔔 Found ${notifs.length} notifications in SQLite.`);
    for (const n of notifs) {
      await prisma.notification.upsert({
        where: { id: n.id },
        update: {},
        create: {
          id: n.id,
          userId: n.user_id || null,
          title: n.title,
          message: n.message,
          type: n.type || "general",
          read: Number(n.read) || 0,
          link: n.link || null,
          createdAt: n.created_at,
        },
      });
    }
    console.log(`✅ Notifications migrated successfully.`);

    // 3. Migrate Tasks
    const tasks = sqlite.prepare("SELECT * FROM tasks").all();
    console.log(`📋 Found ${tasks.length} tasks in SQLite.`);
    for (const t of tasks) {
      await prisma.task.upsert({
        where: { id: Number(t.id) },
        update: {},
        create: {
          id: Number(t.id),
          userId: t.user_id || null,
          title: t.title,
          description: t.description || null,
          deadline: t.deadline || null,
          priority: t.priority || "medium",
          completed: Number(t.completed) || 0,
          createdAt: t.created_at,
          updatedAt: t.updated_at,
        },
      });
    }
    console.log(`✅ Tasks migrated successfully.`);

    // 4. Reset serial sequence for tasks table in PostgreSQL
    try {
      await prisma.$executeRawUnsafe(
        `SELECT setval(pg_get_serial_sequence('tasks', 'id'), coalesce(max(id), 1)) FROM tasks;`
      );
      console.log(`🔢 PostgreSQL tasks sequence synchronized.`);
    } catch (seqErr) {
      console.warn("Sequence sync note:", seqErr.message);
    }

    console.log("🎉 SQLite to PostgreSQL migration complete!");
  } catch (err) {
    console.error("❌ Migration error:", err);
    throw err;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  migrateData().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = migrateData;
