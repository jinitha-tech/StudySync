/**
 * db/database.js
 *
 * PostgreSQL database client powered by Prisma ORM.
 * Sole runtime database connection manager.
 */

const prisma = require("./prisma");

/**
 * Checks PostgreSQL connectivity.
 */
async function checkDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("✅ PostgreSQL connected successfully via Prisma.");
    return true;
  } catch (error) {
    console.warn("⚠️ PostgreSQL connection note:", error.message);
    return false;
  }
}

prisma.checkDatabaseConnection = checkDatabaseConnection;

module.exports = prisma;
