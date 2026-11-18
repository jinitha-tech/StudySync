const service = require("../services/planner.service");

async function listTasks(req, res, next) {
  try {
    const userId = req.user?.id || null;
    res.json({ success: true, data: await service.listTasks(userId) });
  } catch (err) {
    next(err);
  }
}

async function getTask(req, res, next) {
  try {
    const userId = req.user?.id || null;
    res.json({ success: true, data: await service.getTask(req.params.id, userId) });
  } catch (err) {
    next(err);
  }
}

async function createTask(req, res, next) {
  try {
    const userId = req.user?.id || null;
    const task = await service.createTask(req.body, userId);
    res.status(201).json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
}

async function updateTask(req, res, next) {
  try {
    const userId = req.user?.id || null;
    res.json({ success: true, data: await service.updateTask(req.params.id, req.body, userId) });
  } catch (err) {
    next(err);
  }
}

async function deleteTask(req, res, next) {
  try {
    const userId = req.user?.id || null;
    await service.deleteTask(req.params.id, userId);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

async function completeTask(req, res, next) {
  try {
    const userId = req.user?.id || null;
    res.json({ success: true, data: await service.completeTask(req.params.id, req.body.completed, userId) });
  } catch (err) {
    next(err);
  }
}

module.exports = { listTasks, getTask, createTask, updateTask, deleteTask, completeTask };
