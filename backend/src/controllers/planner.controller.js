const service = require("../services/planner.service");

function listTasks(req, res) {
  res.json({ success: true, data: service.listTasks() });
}

function getTask(req, res) {
  res.json({ success: true, data: service.getTask(req.params.id) });
}

function createTask(req, res) {
  const task = service.createTask(req.body);
  res.status(201).json({ success: true, data: task });
}

function updateTask(req, res) {
  res.json({
    success: true,
    data: service.updateTask(req.params.id, req.body)
  });
}

function deleteTask(req, res) {
  service.deleteTask(req.params.id);
  res.status(204).end();
}

function completeTask(req, res) {
  res.json({
    success: true,
    data: service.completeTask(req.params.id, req.body.completed)
  });
}

module.exports = {
  listTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  completeTask
};
