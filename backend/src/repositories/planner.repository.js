const prisma = require("../db/prisma");

function rowToTask(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.userId,
    title: row.title,
    description: row.description || "",
    deadline: row.deadline || null,
    priority: row.priority || "medium",
    completed: Boolean(row.completed),
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : row.updatedAt,
  };
}

async function findAll(userId) {
  const rows = await prisma.task.findMany({
    where: userId ? { userId } : {},
    orderBy: { id: "desc" },
  });

  return rows.map(rowToTask);
}

async function findById(id, userId) {
  const row = await prisma.task.findFirst({
    where: {
      id: Number(id),
      ...(userId ? { userId } : {}),
    },
  });

  return row ? rowToTask(row) : null;
}

async function create(data) {
  const created = await prisma.task.create({
    data: {
      userId: data.userId || null,
      title: data.title.trim(),
      description: data.description || "",
      deadline: data.deadline || null,
      priority: data.priority || "medium",
      completed: Boolean(data.completed),
    },
  });

  // Auto-notification
  try {
    await prisma.notification.create({
      data: {
        id: `notif_task_${Date.now()}`,
        userId: data.userId || null,
        title: "New Study Task Added",
        message: `"${data.title.trim()}" was scheduled${data.deadline ? ` for ${data.deadline}` : ""}.`,
        type: "task",
        link: "/study-planner",
      },
    });
  } catch (err) {
    console.error("Auto notification error:", err);
  }

  return rowToTask(created);
}

async function update(id, data, userId) {
  const existing = await findById(id, userId);
  if (!existing) return null;

  const title = data.title !== undefined ? data.title.trim() : existing.title;
  const description = data.description !== undefined ? data.description : existing.description;
  const deadline = data.deadline !== undefined ? data.deadline : existing.deadline;
  const priority = data.priority !== undefined ? data.priority : existing.priority;
  const completed = data.completed !== undefined ? Boolean(data.completed) : existing.completed;

  const updated = await prisma.task.update({
    where: { id: Number(id) },
    data: {
      title,
      description,
      deadline,
      priority,
      completed,
    },
  });

  // Achievement notification when completing a task
  if (data.completed === true && !existing.completed) {
    try {
      await prisma.notification.create({
        data: {
          id: `notif_comp_${Date.now()}`,
          userId: existing.userId || null,
          title: "Task Completed! 🎉",
          message: `Great job finishing "${title}"! Keep up the momentum.`,
          type: "achievement",
          link: "/study-planner",
        },
      });
    } catch (err) {
      console.error("Auto completion notification error:", err);
    }
  }

  return rowToTask(updated);
}

async function remove(id, userId) {
  const existing = await findById(id, userId);
  if (!existing) return false;

  await prisma.task.delete({
    where: { id: Number(id) },
  });
  return true;
}

module.exports = { findAll, findById, create, update, remove, rowToTask };
