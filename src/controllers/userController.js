/**
 * User Controller — Admin (Prisma)
 */
import prisma from "../config/db.js";

const SELECT = { id: true, email: true, full_name: true, phone: true, avatar_url: true, role: true, created_at: true, updated_at: true };

export async function listUsers(req, res) {
  try {
    const data = await prisma.user.findMany({ select: SELECT, orderBy: { created_at: "desc" } });
    return res.json({ success: true, data: data || [] });
  } catch (err) {
    console.error("List users error:", err.message);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}

export async function getUser(req, res) {
  try {
    const data = await prisma.user.findUnique({ where: { id: req.params.id }, select: SELECT });
    if (!data) return res.status(404).json({ success: false, error: "User not found" });
    return res.json({ success: true, data });
  } catch (err) {
    console.error("Get user error:", err.message);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}

export async function updateUser(req, res) {
  try {
    const updates = { ...req.body };
    delete updates.id; delete updates.email; delete updates.password;
    const data = await prisma.user.update({ where: { id: req.params.id }, data: updates, select: SELECT });
    return res.json({ success: true, data });
  } catch (err) {
    console.error("Update user error:", err.message);
    if (err.code === "P2025") return res.status(404).json({ success: false, error: "User not found" });
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}

export async function deleteUser(req, res) {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    return res.json({ success: true, message: "User deleted" });
  } catch (err) {
    console.error("Delete user error:", err.message);
    if (err.code === "P2025") return res.status(404).json({ success: false, error: "User not found" });
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}
