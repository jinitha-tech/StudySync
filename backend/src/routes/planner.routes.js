const express = require("express");
const controller = require("../controllers/planner.controller");

const router = express.Router();

router.get("/", controller.listTasks);
router.post("/", controller.createTask);
router.get("/:id", controller.getTask);
router.put("/:id", controller.updateTask);
router.patch("/:id/complete", controller.completeTask);
router.delete("/:id", controller.deleteTask);

module.exports = router;
