const express = require("express");
const controller = require("../controllers/notes.controller");

const router = express.Router();

router.get("/", controller.listNotes);

module.exports = router;
