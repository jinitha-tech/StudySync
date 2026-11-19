require("dotenv").config();

const db = require("./src/db/database");
const app = require("./src/app");
const PORT = process.env.PORT || 5050;

app.listen(PORT, async () => {
  console.log(`StudySync backend running on port ${PORT}`);
  if (process.env.DATABASE_URL) {
    await db.checkDatabaseConnection();
  }
});
