const express = require("express");
const path    = require("node:path");
const cors    = require("cors");
const routes  = require("./routes");
const { notFound, errorHandler } = require("./middlewares/error.middleware");
const uploadRoutes = require("./routes/uploadRoutes");

const app = express();

// CORS configuration supporting CORS_ORIGIN (Render environment variable)
// Automatically supports Vercel preview & production deployments (*.vercel.app),
// custom domains in CORS_ORIGIN, and local development.
const rawCorsOrigin = process.env.CORS_ORIGIN || process.env.CORS_ORIGINS || "";
const configuredOrigins = rawCorsOrigin
  .split(",")
  .map((o) => o.trim().replace(/\/+$/, ""))
  .filter(Boolean);

const defaultLocalOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:4173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
];

const allowedOrigins = Array.from(new Set([...configuredOrigins, ...defaultLocalOrigins]));

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);

    const normalizedOrigin = origin.replace(/\/+$/, "");

    // 1. Allow if wildcard '*' is explicitly set
    if (configuredOrigins.includes("*")) {
      return callback(null, true);
    }

    // 2. Allow explicit origins from allowedOrigins list
    if (allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    // 3. Automatically allow all Vercel deployments (*.vercel.app, preview links, branch links)
    try {
      const { hostname } = new URL(origin);
      if (hostname.endsWith(".vercel.app") || hostname === "vercel.app") {
        return callback(null, true);
      }
    } catch {
      // Invalid URL format
    }

    // Not allowed
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

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
