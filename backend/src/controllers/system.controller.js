const service = require("../services/system.service");

function getWelcome(req, res) {
  res.json(service.getWelcome());
}

function getHealth(req, res) {
  res.json(service.getHealth());
}

function getInfo(req, res) {
  res.json(service.getInfo());
}

module.exports = { getWelcome, getHealth, getInfo };
