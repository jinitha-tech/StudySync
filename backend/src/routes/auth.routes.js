const express  = require("express");
const bcrypt   = require("bcryptjs");
const crypto   = require("node:crypto");
const prisma   = require("../db/prisma");
const { generateToken } = require("../utils/token");
const { requireAuth }   = require("../middlewares/auth.middleware");

const router = express.Router();

// ─── Utility: send password-reset email ───────────────────────────────────────
async function sendResetEmail(to, resetToken) {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const nodemailer = require("nodemailer");
    const transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST,
      port:   parseInt(process.env.SMTP_PORT || "587", 10),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const resetLink = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${resetToken}`;

    await transporter.sendMail({
      from:    process.env.EMAIL_FROM || `StudySync <no-reply@studysync.io>`,
      to,
      subject: "StudySync – Reset your password",
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:auto">
          <h2>Reset your StudySync password</h2>
          <p>Click the button below to reset your password. This link expires in <strong>1 hour</strong>.</p>
          <a href="${resetLink}" style="display:inline-block;padding:12px 24px;background:#7664ed;color:white;border-radius:8px;text-decoration:none;font-weight:600">Reset Password</a>
          <p style="margin-top:24px;color:#888;font-size:13px">If you didn't request this, please ignore this email. Your password will not change.</p>
        </div>
      `,
    });
    return { sent: true };
  }

  // No SMTP configured – return the token so the caller can surface it in dev
  return { sent: false, devToken: resetToken };
}

// ─── POST /api/auth/signup ─────────────────────────────────────────────────────
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ message: "Please fill in all fields (name, email, and password)" });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now    = new Date().toISOString();

    const user = await prisma.user.create({
      data: {
        id: userId,
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        createdAt: now,
        updatedAt: now,
      },
    });

    // Create initial welcome notifications
    try {
      await prisma.notification.createMany({
        data: [
          {
            id: `notif_${Date.now()}_1`,
            userId,
            title: "Welcome to StudySync! 🎉",
            message: `Hi ${name.trim()}! Your study workspace is ready. Plan tasks, track focus sessions, and join study rooms.`,
            type: "general",
            read: 0,
            link: "/dashboard",
            createdAt: now,
          },
          {
            id: `notif_${Date.now()}_2`,
            userId,
            title: "Get Started with Study Planner",
            message: "Add your first subject and upcoming deadlines in the Study Planner to stay organized.",
            type: "reminder",
            read: 0,
            link: "/study-planner",
            createdAt: new Date(Date.now() + 1000).toISOString(),
          },
        ],
      });
    } catch (notifErr) {
      console.warn("Welcome notifications error:", notifErr.message);
    }

    const token = generateToken({ id: user.id, email: user.email });

    return res.status(201).json({
      success: true,
      message: "Signup successful! Welcome to StudySync.",
      user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt },
      token,
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ message: "Signup failed. Please try again later." });
  }
});

// ─── POST /api/auth/login ──────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = generateToken({ id: user.id, email: user.email });

    return res.json({
      success: true,
      message: "Login successful! Welcome back.",
      user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Login failed. Please try again later." });
  }
});

// ─── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get("/me", requireAuth, (req, res) => {
  return res.json({
    success: true,
    user: {
      id:        req.user.id,
      name:      req.user.name,
      email:     req.user.email,
      createdAt: req.user.created_at || req.user.createdAt,
    },
  });
});

// ─── PUT /api/auth/profile ─────────────────────────────────────────────────────
router.put("/profile", requireAuth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ message: "Name cannot be empty" });
    }

    const now = new Date().toISOString();
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        name: name.trim(),
        updatedAt: now,
      },
    });

    return res.json({
      success: true,
      message: "Profile updated successfully",
      user: { id: updated.id, name: updated.name, email: updated.email, createdAt: updated.createdAt },
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return res.status(500).json({ message: "Failed to update profile" });
  }
});

// ─── PUT /api/auth/change-password ────────────────────────────────────────────
router.put("/change-password", requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new passwords are required" });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: "New password must be at least 8 characters long" });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const match = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!match) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    const now = new Date().toISOString();
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        passwordHash: newHash,
        updatedAt: now,
      },
    });

    return res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({ message: "Failed to change password" });
  }
});

// ─── POST /api/auth/forgot-password ───────────────────────────────────────────
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email?.trim()) {
      return res.status(400).json({ message: "Email is required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Always return generic success to avoid email enumeration
    if (!user) {
      return res.json({
        success: true,
        message: "If an account with that email exists, a recovery link has been sent.",
      });
    }

    // Generate secure random token (hex, 32 bytes = 64 chars)
    const resetToken   = crypto.randomBytes(32).toString("hex");
    const tokenExpires = new Date(Date.now() + 3600000).toISOString(); // 1 hour
    const now          = new Date().toISOString();

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpires: tokenExpires,
        updatedAt: now,
      },
    });

    const emailResult = await sendResetEmail(user.email, resetToken);

    const devInfo = emailResult.sent
      ? {}
      : {
          _dev_note: "SMTP not configured. Use the token below to reset your password via POST /api/auth/reset-password",
          _dev_token: resetToken,
          _dev_link: `http://localhost:5173/reset-password?token=${resetToken}`,
        };

    return res.json({
      success: true,
      message: "If an account with that email exists, a recovery link has been sent.",
      ...devInfo,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({ message: "Failed to process password reset request" });
  }
});

// ─── POST /api/auth/reset-password ────────────────────────────────────────────
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: "Token and new password are required" });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long" });
    }

    const user = await prisma.user.findFirst({
      where: { resetToken: token },
    });

    const now = new Date().toISOString();
    if (!user || !user.resetTokenExpires || user.resetTokenExpires <= now) {
      return res.status(400).json({
        message: "This password reset link is invalid or has expired. Please request a new one.",
      });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newHash,
        resetToken: null,
        resetTokenExpires: null,
        updatedAt: now,
      },
    });

    return res.json({ success: true, message: "Password reset successfully. You can now log in." });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({ message: "Failed to reset password" });
  }
});

// ─── GET /api/auth/verify-reset-token ─────────────────────────────────────────
router.get("/verify-reset-token", async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ valid: false, message: "Token is required" });
    }

    const user = await prisma.user.findFirst({
      where: { resetToken: String(token) },
    });

    const now = new Date().toISOString();
    const isValid = Boolean(user && user.resetTokenExpires && user.resetTokenExpires > now);

    return res.json({ valid: isValid });
  } catch (error) {
    console.error("Verify reset token error:", error);
    return res.status(500).json({ valid: false });
  }
});

module.exports = router;
