let tasks = [];
let nextId = 1;

function findAll() {
  return [...tasks];
}

function findById(id) {
  return tasks.find((task) => task.id === Number(id)) || null;
}

function create(data) {
  const task = {
    id: nextId++,
    title: data.title.trim(),
    description: data.description || "",
    deadline: data.deadline || null,
    priority: data.priority || "medium",
    completed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  tasks.push(task);
  return task;
}

function update(id, data) {
  const task = findById(id);
  if (!task) return null;

  if (data.title !== undefined) task.title = data.title.trim();
  if (data.description !== undefined) task.description = data.description;
  if (data.deadline !== undefined) task.deadline = data.deadline;
  if (data.priority !== undefined) task.priority = data.priority;
  if (data.completed !== undefined) task.completed = data.completed;

  task.updatedAt = new Date().toISOString();
  return task;
}

function remove(id) {
  const index = tasks.findIndex((task) => task.id === Number(id));
  if (index === -1) return false;

  tasks.splice(index, 1);
  return true;
}

module.exports = { findAll, findById, create, update, remove };
