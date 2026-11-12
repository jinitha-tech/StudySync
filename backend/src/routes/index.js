const express = require("express");
const systemRoutes = require("./system.routes");
const plannerRoutes = require("./planner.routes");
const authRoutes = require("./auth.routes");
const notificationRoutes = require("./notification.routes");

const router = express.Router();

router.use("/", systemRoutes);
router.use("/api/planner", plannerRoutes);
router.use("/api/auth", authRoutes);
router.use("/api/notifications", notificationRoutes);

module.exports = router;
