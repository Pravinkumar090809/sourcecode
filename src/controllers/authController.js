/**
 * Auth Controller — Prisma + JWT + bcrypt
 */
import bcrypt from "bcryptjs";
import prisma from "../config/db.js";
import { generateToken } from "../lib/utils.js";

export async function register(req, res) {
  try {
    const { email, password, full_name, role } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Email and password are required" });
    }

    // determine which roles are permitted at signup (environment can add more)
    const allowedRoles = (process.env.ALLOWED_SIGNUP_ROLES || "customer").split(",").map((r) => r.trim());

    let signupRole = "customer"; // default
    if (role) {
      if (role === "admin" || !allowedRoles.includes(role)) {
        return res.status(400).json({ success: false, error: "Invalid role" });
      }
      signupRole = role;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ success: false, error: "User already registered" });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        full_name: full_name || email.split("@")[0],
        role: signupRole,
      },
    });
    const access_token = generateToken(user);
    return res.status(201).json({
      success: true, message: "Account created successfully", access_token,
      user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
    });
  } catch (err) {
    console.error("Register error:", err.message);
    const errMsg = process.env.NODE_ENV === "production" ? "Internal server error" : err.message;
    return res.status(500).json({ success: false, error: errMsg });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Email and password are required" });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ success: false, error: "Invalid login credentials" });
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ success: false, error: "Invalid login credentials" });
    const access_token = generateToken(user);
    return res.json({
      success: true, message: "Login successful", access_token,
      user: {
        id: user.id, email: user.email, full_name: user.full_name || user.email.split("@")[0],
        phone: user.phone || null, role: user.role || "customer", avatar_url: user.avatar_url || null,
      },
    });
  } catch (err) {
    console.error("Login error:", err.message);
    const errMsg = process.env.NODE_ENV === "production" ? "Internal server error" : err.message;
    return res.status(500).json({ success: false, error: errMsg });
  }
}

export async function logout(req, res) {
  return res.json({ success: true, message: "Logged out successfully" });
}

export async function me(req, res) {
  return res.json({ success: true, data: req.user });
}

export async function updateProfile(req, res) {
  try {
    const { full_name, phone, avatar_url } = req.body;
    const updates = {};
    if (full_name !== undefined) updates.full_name = full_name;
    if (phone !== undefined) updates.phone = phone;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;
    const data = await prisma.user.update({
      where: { id: req.user.id }, data: updates,
      select: { id: true, email: true, full_name: true, phone: true, avatar_url: true, role: true, created_at: true, updated_at: true },
    });
    return res.json({ success: true, data });
  } catch (err) {
    console.error("Update profile error:", err.message);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}

export async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, error: "New password must be at least 6 characters" });
    }
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ success: false, error: "User not found" });
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) return res.status(400).json({ success: false, error: "Current password is incorrect" });
    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });
    return res.json({ success: true, message: "Password changed successfully" });
  } catch (err) {
    console.error("Change password error:", err.message);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}

export async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, error: "Email is required" });
    return res.json({ success: true, message: "If this email exists, a reset link has been sent" });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}
