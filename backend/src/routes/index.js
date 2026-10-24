const express = require("express");
const systemRoutes = require("./system.routes");
const plannerRoutes = require("./planner.routes");

const router = express.Router();

router.use("/", systemRoutes);
router.use("/api/planner", plannerRoutes);

module.exports = router;
