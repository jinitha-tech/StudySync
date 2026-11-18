const service = require("../services/planner.service");

async function listTasks(req, res, next) {
  try {
    const userId = req.user?.id || null;
    const tasks = await service.listTasks(userId);
    res.json({ success: true, data: tasks });
  } catch (error) {
    next(error);
  }
}

async function getTask(req, res, next) {
  try {
    const userId = req.user?.id || null;
    const task = await service.getTask(req.params.id, userId);
    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
}

async function createTask(req, res, next) {
  try {
    const userId = req.user?.id || null;
    const task = await service.createTask(req.body, userId);
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
}

async function updateTask(req, res, next) {
  try {
    const userId = req.user?.id || null;
    const task = await service.updateTask(req.params.id, req.body, userId);
    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
}

async function deleteTask(req, res, next) {
  try {
    const userId = req.user?.id || null;
    await service.deleteTask(req.params.id, userId);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

async function completeTask(req, res, next) {
  try {
    const userId = req.user?.id || null;
    const task = await service.completeTask(req.params.id, req.body.completed, userId);
    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
}

module.exports = { listTasks, getTask, createTask, updateTask, deleteTask, completeTask };
