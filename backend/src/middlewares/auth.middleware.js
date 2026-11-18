const { verifyToken } = require("../utils/token");
const prisma = require("../db/prisma");

function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }
  return null;
}

async function requireAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const payload = verifyToken(token);
  if (!payload || !payload.id) {
    return res.status(401).json({ message: "Invalid or expired session. Please log in again." });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = {
      ...user,
      created_at: user.createdAt,
    };
    next();
  } catch (error) {
    console.error("requireAuth error:", error);
    return res.status(500).json({ message: "Authentication check failed" });
  }
}

async function optionalAuth(req, res, next) {
  const token = extractToken(req);
  if (token) {
    const payload = verifyToken(token);
    if (payload && payload.id) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: payload.id },
          select: { id: true, name: true, email: true, createdAt: true },
        });
        if (user) {
          req.user = {
            ...user,
            created_at: user.createdAt,
          };
        }
      } catch (err) {
        // Ignore optional auth errors
      }
    }
  }
  next();
}

module.exports = {
  requireAuth,
  optionalAuth,
};
