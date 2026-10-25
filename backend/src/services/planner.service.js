const repository = require("../repositories/planner.repository");

const priorities = ["low", "medium", "high"];

function listTasks() {
  return repository.findAll();
}

function getTask(id) {
  const task = repository.findById(id);
  if (!task) {
    const error = new Error("Task not found");
    error.statusCode = 404;
    throw error;
  }
  return task;
}

function validateTask(data, isUpdate = false) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    const error = new Error("Request body must be a JSON object");
    error.statusCode = 400;
    throw error;
  }

  if (!isUpdate || data.title !== undefined) {
    if (typeof data.title !== "string" || !data.title.trim()) {
      const error = new Error("A non-empty title is required");
      error.statusCode = 400;
      throw error;
    }
  }

  if (data.description !== undefined &&
      typeof data.description !== "string") {
    const error = new Error("Description must be a string");
    error.statusCode = 400;
    throw error;
  }

  if (data.priority !== undefined &&
      !priorities.includes(data.priority)) {
    const error = new Error("Priority must be low, medium, or high");
    error.statusCode = 400;
    throw error;
  }

  if (data.completed !== undefined &&
      typeof data.completed !== "boolean") {
    const error = new Error("Completed must be true or false");
    error.statusCode = 400;
    throw error;
  }

  if (data.deadline !== undefined && data.deadline !== null) {
    if (typeof data.deadline !== "string" ||
        Number.isNaN(Date.parse(data.deadline))) {
      const error = new Error("Deadline must be a valid date string or null");
      error.statusCode = 400;
      throw error;
    }
  }
}

function createTask(data) {
  validateTask(data);
  return repository.create(data);
}

function updateTask(id, data) {
  validateTask(data, true);
  getTask(id);
  return repository.update(id, data);
}

function deleteTask(id) {
  getTask(id);
  repository.remove(id);
}

function completeTask(id, completed) {
  if (typeof completed !== "boolean") {
    const error = new Error("Completed must be true or false");
    error.statusCode = 400;
    throw error;
  }

  getTask(id);
  return repository.update(id, { completed });
}

module.exports = {
  listTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  completeTask
};
