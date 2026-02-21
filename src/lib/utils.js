/**
 * ── Utility Functions ──
 */
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "codevault-secret-key-change-in-production";

/**
 * Generate a JWT token for a user
 */
export function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

/**
 * Verify a JWT token — returns decoded payload or null
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export { JWT_SECRET };
