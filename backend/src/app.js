const express = require("express");
const path = require("node:path");
const cors = require("cors");
const routes = require("./routes");
const { notFound, errorHandler } = require("./middlewares/error.middleware");
const uploadRoutes = require("./routes/uploadRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// Serve static uploads if stored locally
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Routes
app.use("/api/uploads", uploadRoutes);
app.use("/", routes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;
