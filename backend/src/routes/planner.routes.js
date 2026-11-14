const express = require("express");
const controller = require("../controllers/planner.controller");
const { optionalAuth } = require("../middlewares/auth.middleware");

const router = express.Router();

// All planner routes pass through optionalAuth so req.user is populated when logged in
router.use(optionalAuth);

router.get("/",           controller.listTasks);
router.post("/",          controller.createTask);
router.get("/:id",        controller.getTask);
router.put("/:id",        controller.updateTask);
router.patch("/:id/complete", controller.completeTask);
router.delete("/:id",     controller.deleteTask);

module.exports = router;
