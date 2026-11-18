const prisma = require("../db/prisma");
const { verifyToken } = require("../utils/token");

function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }
  return null;
}

async function requireAuth(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const payload = verifyToken(token);
    if (!payload || !payload.id) {
      return res.status(401).json({ message: "Invalid or expired session. Please log in again." });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      created_at: user.createdAt ? user.createdAt.toISOString() : null,
      createdAt: user.createdAt ? user.createdAt.toISOString() : null,
    };
    next();
  } catch (error) {
    console.error("requireAuth error:", error);
    return res.status(500).json({ message: "Authentication error" });
  }
}

async function optionalAuth(req, res, next) {
  try {
    const token = extractToken(req);
    if (token) {
      const payload = verifyToken(token);
      if (payload && payload.id) {
        const user = await prisma.user.findUnique({
          where: { id: payload.id },
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
        });
        if (user) {
          req.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            created_at: user.createdAt ? user.createdAt.toISOString() : null,
            createdAt: user.createdAt ? user.createdAt.toISOString() : null,
          };
        }
      }
    }
    next();
  } catch (error) {
    console.error("optionalAuth error:", error);
    next();
  }
}

module.exports = {
  requireAuth,
  optionalAuth,
};
