const service      = require("../services/planner.service");
const { requireAuth } = require("../middlewares/auth.middleware");

function listTasks(req, res) {
  const userId = req.user?.id || null;
  res.json({ success: true, data: service.listTasks(userId) });
}

function getTask(req, res) {
  const userId = req.user?.id || null;
  res.json({ success: true, data: service.getTask(req.params.id, userId) });
}

function createTask(req, res) {
  const userId = req.user?.id || null;
  const task = service.createTask(req.body, userId);
  res.status(201).json({ success: true, data: task });
}

function updateTask(req, res) {
  const userId = req.user?.id || null;
  res.json({ success: true, data: service.updateTask(req.params.id, req.body, userId) });
}

function deleteTask(req, res) {
  const userId = req.user?.id || null;
  service.deleteTask(req.params.id, userId);
  res.status(204).end();
}

function completeTask(req, res) {
  const userId = req.user?.id || null;
  res.json({ success: true, data: service.completeTask(req.params.id, req.body.completed, userId) });
}

module.exports = { listTasks, getTask, createTask, updateTask, deleteTask, completeTask };
