const express = require("express");
const path    = require("node:path");
const cors    = require("cors");
const routes  = require("./routes");
const { notFound, errorHandler } = require("./middlewares/error.middleware");
const uploadRoutes = require("./routes/uploadRoutes");

const app = express();

// CORS – configured origins (CORS_ORIGIN / CORS_ORIGINS) with local development fallback
const defaultLocalOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:4173",
  "http://localhost:3000",
];

const envOriginString = process.env.CORS_ORIGIN || process.env.CORS_ORIGINS || "";
const configuredOrigins = envOriginString
  .split(",")
  .map((o) => o.trim().replace(/\/+$/, ""))
  .filter(Boolean);

const allowedOrigins = Array.from(new Set([...defaultLocalOrigins, ...configuredOrigins]));

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. curl, mobile apps, same-origin)
      if (!origin) return callback(null, true);
      const normalizedOrigin = origin.replace(/\/+$/, "");
      if (allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS: origin '${origin}' is not allowed`));
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
