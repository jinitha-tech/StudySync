const { PrismaClient } = require("@prisma/client");

let prismaInstance;

if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== "") {
  try {
    prismaInstance = global.__studysync_prisma__ || new PrismaClient();
    if (process.env.NODE_ENV !== "production") {
      global.__studysync_prisma__ = prismaInstance;
    }
  } catch (err) {
    console.warn("PrismaClient initialization error, falling back to local SQLite:", err.message);
    prismaInstance = require("./sqliteFallback");
  }
} else {
  // Graceful local development fallback when DATABASE_URL is not yet set in .env
  console.log("ℹ️  DATABASE_URL is not set. Using local SQLite database (backend/data/studysync.db).");
  console.log("👉 When ready to connect to Render PostgreSQL, configure DATABASE_URL in backend/.env.");
  prismaInstance = require("./sqliteFallback");
}

module.exports = prismaInstance;
