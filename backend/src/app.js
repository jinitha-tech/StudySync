const express = require("express");
const path    = require("node:path");
const cors    = require("cors");
const routes  = require("./routes");
const { notFound, errorHandler } = require("./middlewares/error.middleware");
const uploadRoutes = require("./routes/uploadRoutes");

const app = express();

// CORS – allow frontend origin (default localhost:5173 for Vite)
const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173,http://localhost:5174,http://localhost:4173")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. curl, mobile apps, same-origin)
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin '${origin}' is not allowed`));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static uploads if stored locally
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Routes
app.use("/api/uploads", uploadRoutes);
app.use("/", routes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;
