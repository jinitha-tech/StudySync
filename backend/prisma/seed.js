/**
 * prisma/seed.js
 *
 * Optional database seeder for StudySync development/demo environment.
 * Run explicitly via: npm run db:seed
 */

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const bcrypt = require("bcryptjs");
const prisma = require("../src/db/prisma");

async function seed() {
  console.log("🌱 Checking if database needs initial seeding...");

  const userCount = await prisma.user.count();
  if (userCount > 0) {
    console.log(`ℹ️ Database already contains ${userCount} user(s). Skipping seed.`);
    return;
  }

  console.log("🌱 Seeding initial demo data...");
  const demoId = "usr_demo_1";
  const now = new Date().toISOString();
  const demoHash = await bcrypt.hash("password123", 10);

  await prisma.user.create({
    data: {
      id: demoId,
      name: "Alex Johnson",
      email: "alex@studysync.io",
      passwordHash: demoHash,
      createdAt: now,
      updatedAt: now,
    },
  });

  await prisma.notification.createMany({
    data: [
      {
        id: "notif_demo_1",
        userId: demoId,
        title: "Welcome to StudySync! 🎉",
        message: "Your study workspace is fully configured. Plan your sessions, track habits, and study together.",
        type: "general",
        read: 0,
        link: "/dashboard",
        createdAt: now,
      },
      {
        id: "notif_demo_2",
        userId: demoId,
        title: "Calculus Problem Set Reminder ⏰",
        message: "Your Mathematics problem set is due this Friday. Check your Study Planner.",
        type: "reminder",
        read: 0,
        link: "/study-planner",
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: "notif_demo_3",
        userId: demoId,
        title: "Study Streak Milestone 🏆",
        message: "You finished your daily goals 3 days in a row! Keep up the momentum.",
        type: "achievement",
        read: 1,
        link: "/study-tracking",
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ],
  });

  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  await prisma.task.createMany({
    data: [
      {
        userId: demoId,
        title: "Revise Computer Networks Layer 3",
        description: "Networking",
        deadline: tomorrow,
        priority: "high",
        completed: 0,
        createdAt: now,
        updatedAt: now,
      },
      {
        userId: demoId,
        title: "Practice Data Structures: Binary Trees",
        description: "Algorithms",
        deadline: nextWeek,
        priority: "medium",
        completed: 0,
        createdAt: now,
        updatedAt: now,
      },
      {
        userId: demoId,
        title: "Complete React Hooks Summary",
        description: "Web Development",
        deadline: null,
        priority: "low",
        completed: 1,
        createdAt: now,
        updatedAt: now,
      },
    ],
  });

  console.log("✅ Demo data seeded successfully.");
}

seed()
  .catch((err) => {
    console.error("❌ Seed error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
