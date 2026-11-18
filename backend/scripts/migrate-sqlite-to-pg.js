require("dotenv").config();
const fs = require("node:fs");
const path = require("node:path");
const prisma = require("../src/db/prisma");

async function migrateSqliteToPg() {
  const sqliteDbPath = path.resolve(__dirname, "../data/studysync.db");
  if (!fs.existsSync(sqliteDbPath)) {
    console.log("No SQLite database found at:", sqliteDbPath);
    return;
  }

  console.log("Starting SQLite to PostgreSQL migration...");
  console.log("Source SQLite database:", sqliteDbPath);

  const { DatabaseSync } = require("node:sqlite");
  const sqlite = new DatabaseSync(sqliteDbPath);

  // 1. Migrate Users
  let usersMigrated = 0;
  try {
    const users = sqlite.prepare("SELECT * FROM users").all();
    console.log(`Found ${users.length} users in SQLite.`);

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
          resetTokenExpires: u.reset_token_expires ? new Date(u.reset_token_expires) : null,
          createdAt: u.created_at ? new Date(u.created_at) : new Date(),
          updatedAt: u.updated_at ? new Date(u.updated_at) : new Date(),
        },
      });
      usersMigrated++;
    }
    console.log(`Successfully migrated ${usersMigrated} users.`);
  } catch (err) {
    console.error("Error migrating users:", err.message);
  }

  // 2. Migrate Notifications
  let notifsMigrated = 0;
  try {
    const notifs = sqlite.prepare("SELECT * FROM notifications").all();
    console.log(`Found ${notifs.length} notifications in SQLite.`);

    for (const n of notifs) {
      // Ensure foreign key integrity
      let validUserId = null;
      if (n.user_id) {
        const userExists = await prisma.user.findUnique({ where: { id: n.user_id } });
        if (userExists) validUserId = n.user_id;
      }

      await prisma.notification.upsert({
        where: { id: n.id },
        update: {},
        create: {
          id: n.id,
          userId: validUserId,
          title: n.title,
          message: n.message,
          type: n.type || "general",
          read: Boolean(n.read),
          link: n.link || null,
          createdAt: n.created_at ? new Date(n.created_at) : new Date(),
        },
      });
      notifsMigrated++;
    }
    console.log(`Successfully migrated ${notifsMigrated} notifications.`);
  } catch (err) {
    console.error("Error migrating notifications:", err.message);
  }

  // 3. Migrate Tasks
  let tasksMigrated = 0;
  try {
    const tasks = sqlite.prepare("SELECT * FROM tasks").all();
    console.log(`Found ${tasks.length} tasks in SQLite.`);

    for (const t of tasks) {
      let validUserId = null;
      if (t.user_id) {
        const userExists = await prisma.user.findUnique({ where: { id: t.user_id } });
        if (userExists) validUserId = t.user_id;
      }

      await prisma.task.upsert({
        where: { id: Number(t.id) },
        update: {},
        create: {
          id: Number(t.id),
          userId: validUserId,
          title: t.title,
          description: t.description || "",
          deadline: t.deadline || null,
          priority: t.priority || "medium",
          completed: Boolean(t.completed),
          createdAt: t.created_at ? new Date(t.created_at) : new Date(),
          updatedAt: t.updated_at ? new Date(t.updated_at) : new Date(),
        },
      });
      tasksMigrated++;
    }
    console.log(`Successfully migrated ${tasksMigrated} tasks.`);

    // Reset PostgreSQL autoincrement sequence to max id
    try {
      await prisma.$executeRawUnsafe(`
        SELECT setval(pg_get_serial_sequence('tasks', 'id'), COALESCE(MAX(id), 1)) FROM tasks;
      `);
    } catch (seqErr) {
      console.warn("Notice: could not reset tasks sequence:", seqErr.message);
    }
  } catch (err) {
    console.error("Error migrating tasks:", err.message);
  }

  console.log("Migration summary:");
  console.log(`  Users: ${usersMigrated}`);
  console.log(`  Notifications: ${notifsMigrated}`);
  console.log(`  Tasks: ${tasksMigrated}`);
  console.log("SQLite to PostgreSQL data migration complete.");
}

if (require.main === module) {
  migrateSqliteToPg()
    .then(async () => {
      await prisma.$disconnect();
      process.exit(0);
    })
    .catch(async (error) => {
      console.error("Fatal migration error:", error);
      await prisma.$disconnect();
      process.exit(1);
    });
}

module.exports = { migrateSqliteToPg };
