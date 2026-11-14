const db = require("../db/database");

function findAll(userId) {
  const stmt = userId
    ? db.prepare("SELECT * FROM tasks WHERE user_id = ? ORDER BY id DESC")
    : db.prepare("SELECT * FROM tasks ORDER BY id DESC");

  const rows = userId ? stmt.all(userId) : stmt.all();

  return rows.map(rowToTask);
}

function findById(id, userId) {
  const stmt = userId
    ? db.prepare("SELECT * FROM tasks WHERE id = ? AND user_id = ?")
    : db.prepare("SELECT * FROM tasks WHERE id = ?");

  const row = userId
    ? stmt.get(Number(id), userId)
    : stmt.get(Number(id));

  return row ? rowToTask(row) : null;
}

function create(data) {
  const now  = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO tasks (user_id, title, description, deadline, priority, completed, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    data.userId || null,
    data.title.trim(),
    data.description || "",
    data.deadline    || null,
    data.priority    || "medium",
    data.completed   ? 1 : 0,
    now,
    now
  );

  const taskId = Number(result.lastInsertRowid);

  // Auto-notification
  try {
    db.prepare(
      "INSERT INTO notifications (id,user_id,title,message,type,read,link,created_at) VALUES (?,?,?,?,?,0,?,?)"
    ).run(
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

  return findById(taskId, data.userId);
}

function update(id, data, userId) {
  const existing = findById(id, userId);
  if (!existing) return null;

  const title       = data.title       !== undefined ? data.title.trim()      : existing.title;
  const description = data.description !== undefined ? data.description       : existing.description;
  const deadline    = data.deadline    !== undefined ? data.deadline          : existing.deadline;
  const priority    = data.priority    !== undefined ? data.priority          : existing.priority;
  const completed   = data.completed   !== undefined ? Boolean(data.completed): existing.completed;
  const now         = new Date().toISOString();

  db.prepare(`
    UPDATE tasks SET title=?, description=?, deadline=?, priority=?, completed=?, updated_at=?
    WHERE id=?
  `).run(title, description, deadline, priority, completed ? 1 : 0, now, Number(id));

  // Achievement notification when completing a task
  if (data.completed === true && !existing.completed) {
    try {
      db.prepare(
        "INSERT INTO notifications (id,user_id,title,message,type,read,link,created_at) VALUES (?,?,?,?,?,0,?,?)"
      ).run(
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

  return findById(id, userId);
}

function remove(id, userId) {
  const stmt = userId
    ? db.prepare("DELETE FROM tasks WHERE id = ? AND user_id = ?")
    : db.prepare("DELETE FROM tasks WHERE id = ?");

  const result = userId ? stmt.run(Number(id), userId) : stmt.run(Number(id));
  return result.changes > 0;
}

// ── helpers ──────────────────────────────────────────────────────────────────
function rowToTask(row) {
  return {
    id:          row.id,
    userId:      row.user_id,
    title:       row.title,
    description: row.description || "",
    deadline:    row.deadline    || null,
    priority:    row.priority    || "medium",
    completed:   Boolean(row.completed),
    createdAt:   row.created_at,
    updatedAt:   row.updated_at,
  };
}

module.exports = { findAll, findById, create, update, remove };
