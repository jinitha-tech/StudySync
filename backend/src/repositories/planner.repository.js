const db = require("../db/database");

function findAll() {
  const stmt = db.prepare("SELECT * FROM tasks ORDER BY id DESC");
  const rows = stmt.all();

  return rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description || "",
    deadline: row.deadline || null,
    priority: row.priority || "medium",
    completed: Boolean(row.completed),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

function findById(id) {
  const stmt = db.prepare("SELECT * FROM tasks WHERE id = ?");
  const row = stmt.get(Number(id));
  if (!row) return null;

  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description || "",
    deadline: row.deadline || null,
    priority: row.priority || "medium",
    completed: Boolean(row.completed),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function create(data) {
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO tasks (user_id, title, description, deadline, priority, completed, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    data.userId || null,
    data.title.trim(),
    data.description || "",
    data.deadline || null,
    data.priority || "medium",
    data.completed ? 1 : 0,
    now,
    now
  );

  const taskId = Number(result.lastInsertRowid);

  // Automatically create a notification for task creation
  try {
    const notifStmt = db.prepare(
      "INSERT INTO notifications (id, user_id, title, message, type, read, link, created_at) VALUES (?, ?, ?, ?, ?, 0, ?, ?)"
    );
    notifStmt.run(
      `notif_task_${Date.now()}`,
      data.userId || null,
      "New Study Task Added",
      `"${data.title.trim()}" was scheduled${data.deadline ? ` for ${data.deadline}` : ""}.`,
      "task",
      "/study-planner",
      now
    );
  } catch (err) {
    console.error("Auto notification error:", err);
  }

  return findById(taskId);
}

function update(id, data) {
  const existing = findById(id);
  if (!existing) return null;

  const title = data.title !== undefined ? data.title.trim() : existing.title;
  const description = data.description !== undefined ? data.description : existing.description;
  const deadline = data.deadline !== undefined ? data.deadline : existing.deadline;
  const priority = data.priority !== undefined ? data.priority : existing.priority;
  const completed = data.completed !== undefined ? Boolean(data.completed) : existing.completed;
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    UPDATE tasks
    SET title = ?, description = ?, deadline = ?, priority = ?, completed = ?, updated_at = ?
    WHERE id = ?
  `);

  stmt.run(
    title,
    description,
    deadline,
    priority,
    completed ? 1 : 0,
    now,
    Number(id)
  );

  // If marked completed, create an achievement notification
  if (data.completed === true && !existing.completed) {
    try {
      const notifStmt = db.prepare(
        "INSERT INTO notifications (id, user_id, title, message, type, read, link, created_at) VALUES (?, ?, ?, ?, ?, 0, ?, ?)"
      );
      notifStmt.run(
        `notif_comp_${Date.now()}`,
        existing.userId || null,
        "Task Completed! 🎉",
        `Great job finishing "${title}"! Keep up the momentum.`,
        "achievement",
        "/study-planner",
        now
      );
    } catch (err) {
      console.error("Auto completion notification error:", err);
    }
  }

  return findById(id);
}

function remove(id) {
  const stmt = db.prepare("DELETE FROM tasks WHERE id = ?");
  const result = stmt.run(Number(id));
  return result.changes > 0;
}

module.exports = { findAll, findById, create, update, remove };
