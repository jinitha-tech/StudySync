const express = require("express");
const controller = require("../controllers/system.controller");

const router = express.Router();

router.get("/", controller.getWelcome);
router.get("/health", controller.getHealth);
router.get("/api/health", controller.getHealth);
router.get("/info", controller.getInfo);
router.get("/api/info", controller.getInfo);

module.exports = router;
