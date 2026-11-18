const express = require("express");
const path    = require("node:path");
const cors    = require("cors");
const routes  = require("./routes");
const { notFound, errorHandler } = require("./middlewares/error.middleware");
const uploadRoutes = require("./routes/uploadRoutes");

const app = express();

// CORS – configured origins (CORS_ORIGIN / CORS_ORIGINS / FRONTEND_URL) with local development support
const defaultLocalOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:4173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:4173",
  "http://127.0.0.1:3000",
];

const envOriginString = [
  process.env.CORS_ORIGIN || "",
  process.env.CORS_ORIGINS || "",
  process.env.FRONTEND_URL || "",
].join(",");

const configuredOrigins = envOriginString
  .split(",")
  .map((o) => o.trim().replace(/\/+$/, ""))
  .filter(Boolean);

const allowedOrigins = Array.from(new Set([...defaultLocalOrigins, ...configuredOrigins]));

// Regular expression to match any local development origin (localhost, 127.0.0.1, [::1] on any port)
const localOriginRegex = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;

function isOriginAllowed(origin) {
  if (!origin) return true;
  const normalizedOrigin = origin.replace(/\/+$/, "");

  // Match explicitly configured origins
  if (allowedOrigins.includes(normalizedOrigin)) {
    return true;
  }

  // Allow any localhost/127.0.0.1 port in development
  if (localOriginRegex.test(normalizedOrigin)) {
    return true;
  }

  // Allow Vercel preview domains if enabled or in non-production
  if (process.env.ALLOW_VERCEL_PREVIEWS === "true" || process.env.NODE_ENV !== "production") {
    if (/^https:\/\/.*\.vercel\.app$/.test(normalizedOrigin)) {
      return true;
    }
  }

  return false;
}

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, same-origin)
    if (!origin || isOriginAllowed(origin)) {
      return callback(null, true);
    }
    // Deny origin gracefully without throwing an unhandled 500 error
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
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
