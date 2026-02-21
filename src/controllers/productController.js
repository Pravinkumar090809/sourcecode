/**
 * Product Controller — Prisma (Integer IDs, matches Supabase schema)
 */
import prisma from "../config/db.js";
import { verifyToken } from "../lib/utils.js";

export async function listProducts(req, res) {
  try {
    const { category, search, limit, featured } = req.query;
    let isAdmin = false;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const decoded = verifyToken(authHeader.split(" ")[1]);
      if (decoded) {
        const u = await prisma.user.findUnique({ where: { id: decoded.id }, select: { role: true } });
        isAdmin = u?.role === "admin";
      }
    }
    const where = {};
    if (!isAdmin) where.is_active = true;
    if (featured === "true") where.featured = true;
    if (category && category !== "all") where.category = category;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { short_description: { contains: search, mode: "insensitive" } },
      ];
    }
    const data = await prisma.product.findMany({
      where, orderBy: { created_at: "desc" },
      ...(limit ? { take: parseInt(limit) } : {}),
    });
    return res.json({ success: true, data: data || [] });
  } catch (err) {
    console.error("List products error:", err.message);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}

export async function getProduct(req, res) {
  try {
    const { slugOrId } = req.params;
    let data = await prisma.product.findUnique({ where: { slug: slugOrId } });
    if (!data) {
      const numId = parseInt(slugOrId);
      if (!isNaN(numId)) data = await prisma.product.findUnique({ where: { id: numId } });
    }
    if (!data) return res.status(404).json({ success: false, error: "Product not found" });
    return res.json({ success: true, data });
  } catch (err) {
    console.error("Get product error:", err.message);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}

export async function createProduct(req, res) {
  try {
    const { name, slug, description, short_description, price, original_price, category, tech_stack, image_url, demo_url, features, is_active } = req.body;
    const productSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const data = await prisma.product.create({
      data: {
        name, slug: productSlug, description, short_description,
        price: parseInt(price) || 0, original_price: original_price ? parseInt(original_price) : 0,
        category, tech_stack: Array.isArray(tech_stack) ? tech_stack : [],
        image_url, demo_url, features: Array.isArray(features) ? features : [],
        is_active: is_active !== false,
      },
    });
    return res.status(201).json({ success: true, data });
  } catch (err) {
    console.error("Create product error:", err.message);
    if (err.code === "P2002") return res.status(400).json({ success: false, error: "Product with this slug already exists" });
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}

export async function updateProduct(req, res) {
  try {
    const { slugOrId } = req.params;
    const updates = { ...req.body };
    delete updates.id; delete updates.created_at;
    if (updates.price !== undefined) updates.price = parseInt(updates.price);
    if (updates.original_price !== undefined) updates.original_price = parseInt(updates.original_price);

    let product = await prisma.product.findUnique({ where: { slug: slugOrId } });
    if (!product) {
      const numId = parseInt(slugOrId);
      if (!isNaN(numId)) product = await prisma.product.findUnique({ where: { id: numId } });
    }
    if (!product) return res.status(404).json({ success: false, error: "Product not found" });
    const data = await prisma.product.update({ where: { id: product.id }, data: updates });
    return res.json({ success: true, data });
  } catch (err) {
    console.error("Update product error:", err.message);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}

export async function deleteProduct(req, res) {
  try {
    const { slugOrId } = req.params;
    let product = await prisma.product.findUnique({ where: { slug: slugOrId } });
    if (!product) {
      const numId = parseInt(slugOrId);
      if (!isNaN(numId)) product = await prisma.product.findUnique({ where: { id: numId } });
    }
    if (!product) return res.status(404).json({ success: false, error: "Product not found" });
    await prisma.product.delete({ where: { id: product.id } });
    return res.json({ success: true, message: "Product deleted" });
  } catch (err) {
    console.error("Delete product error:", err.message);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}
