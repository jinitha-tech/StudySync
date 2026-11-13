const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "studysync_jwt_super_secret_key_2026";

function generateToken(payload, expiresIn = "7d") {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

function verifyToken(token) {
  if (!token || typeof token !== "string") return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

module.exports = { generateToken, verifyToken };
