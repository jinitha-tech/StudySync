/**
 * db/database.js
 *
 * PostgreSQL database client powered by Prisma ORM.
 */

const prisma = require("./prisma");

async function initDb() {
  try {
    await prisma.$connect();
    console.log("Connected to PostgreSQL via Prisma ORM");
  } catch (error) {
    console.error("Prisma database connection error:", error.message);
  }
}

module.exports = prisma;
module.exports.initDb = initDb;
