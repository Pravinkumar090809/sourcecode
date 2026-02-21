/**
 * ── Authentication Middleware (JWT) ──
 */
import prisma from "../config/db.js";
import { verifyToken } from "../lib/utils.js";

/**
 * Authenticate — verifies JWT token from Authorization header.
 * Attaches req.user with profile data.
 */
export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ success: false, error: "Invalid or expired token" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) {
      return res.status(401).json({ success: false, error: "User not found" });
    }

    req.user = {
      id: user.id,
      email: user.email,
      full_name: user.full_name || user.email.split("@")[0],
      phone: user.phone || null,
      role: user.role || "customer",
      avatar_url: user.avatar_url || null,
      created_at: user.created_at,
    };
    req.token = token;
    next();
  } catch (err) {
    console.error("Auth middleware error:", err.message);
    return res.status(401).json({ success: false, error: "Authentication failed" });
  }
}

/**
 * Require Admin — must be used AFTER authenticate middleware.
 */
export function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ success: false, error: "Admin access required" });
  }
  next();
}
