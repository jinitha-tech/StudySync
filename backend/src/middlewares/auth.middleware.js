const { verifyToken } = require("../utils/token");
const db = require("../db/database");

function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }
  return null;
}

function requireAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const payload = verifyToken(token);
  if (!payload || !payload.id) {
    return res.status(401).json({ message: "Invalid or expired session. Please log in again." });
  }

  const stmt = db.prepare("SELECT id, name, email, created_at FROM users WHERE id = ?");
  const user = stmt.get(payload.id);

  if (!user) {
    return res.status(401).json({ message: "User not found" });
  }

  req.user = user;
  next();
}

function optionalAuth(req, res, next) {
  const token = extractToken(req);
  if (token) {
    const payload = verifyToken(token);
    if (payload && payload.id) {
      const stmt = db.prepare("SELECT id, name, email, created_at FROM users WHERE id = ?");
      const user = stmt.get(payload.id);
      if (user) {
        req.user = user;
      }
    }
  }
  next();
}

module.exports = {
  requireAuth,
  optionalAuth,
};
