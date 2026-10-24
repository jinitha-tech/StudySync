function getWelcome() {
  return {
    message: "Welcome to the StudySync backend!"
  };
}

function getHealth() {
  return {
    status: "ok",
    message: "StudySync API is running successfully!"
  };
}

function getInfo() {
  return {
    name: "StudySync",
    description: "A student study management platform",
    features: ["Study Planner", "Dashboard", "Resources"]
  };
}

module.exports = { getWelcome, getHealth, getInfo };
