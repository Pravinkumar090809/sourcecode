/**
 * Contact Controller — Prisma
 */
import prisma from "../config/db.js";

export async function submitContact(req, res) {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, error: "Name, email, and message are required" });
    }
    const data = await prisma.contactMessage.create({
      data: { name, email, subject: subject || "", message, is_read: false },
    });
    return res.status(201).json({ success: true, data });
  } catch (err) {
    console.error("Submit contact error:", err.message);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}

export async function listContacts(req, res) {
  try {
    const data = await prisma.contactMessage.findMany({ orderBy: { created_at: "desc" } });
    return res.json({ success: true, data: data || [] });
  } catch (err) {
    console.error("List contacts error:", err.message);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}

export async function markRead(req, res) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, error: "Invalid ID" });
    const data = await prisma.contactMessage.update({ where: { id }, data: { is_read: true } });
    return res.json({ success: true, data });
  } catch (err) {
    console.error("Mark read error:", err.message);
    if (err.code === "P2025") return res.status(404).json({ success: false, error: "Message not found" });
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}
