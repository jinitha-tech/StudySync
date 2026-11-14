const express = require("express");
const path    = require("node:path");
const cors    = require("cors");
const routes  = require("./routes");
const { notFound, errorHandler } = require("./middlewares/error.middleware");
const uploadRoutes = require("./routes/uploadRoutes");

const app = express();

// CORS configuration supporting CORS_ORIGIN (Render environment variable)
// Allows comma-separated origins, removes trailing slashes, and preserves local development access.
const rawCorsOrigin = process.env.CORS_ORIGIN || process.env.CORS_ORIGINS || "";
const configuredOrigins = rawCorsOrigin
  .split(",")
  .map((o) => o.trim().replace(/\/+$/, ""))
  .filter(Boolean);

const defaultOrigins = [
  "https://study-sync-tau-nine.vercel.app",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:4173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
];

// Combine configured origins with default origins
const allowedOrigins = Array.from(new Set([...configuredOrigins, ...defaultOrigins]));

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      const normalizedOrigin = origin.replace(/\/+$/, "");

      // Check explicit allowed origins list
      if (allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      // Allow any Vercel deployment of the app (production and preview branches)
      try {
        const hostname = new URL(origin).hostname;
        if (hostname.endsWith(".vercel.app") || hostname === "vercel.app") {
          return callback(null, true);
        }
      } catch {
        // invalid URL format, handled by final check
      }

      callback(new Error(`CORS: origin '${origin}' is not allowed`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
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
