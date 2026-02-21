/**
 * Order Controller — Prisma (product_id=Int, amount=Int)
 * Maps: Prisma "product" → response "products" for frontend compatibility
 * Maps: Prisma "user" → response "profiles" for frontend compatibility
 */
import prisma from "../config/db.js";

function mapOrder(order) {
  if (!order) return order;
  const { product, user, ...rest } = order;
  return { ...rest, ...(product ? { products: product } : {}), ...(user ? { profiles: user } : {}) };
}

export async function listAllOrders(req, res) {
  try {
    const orders = await prisma.order.findMany({
      include: {
        product: { select: { name: true, slug: true, image_url: true } },
        user: { select: { full_name: true, email: true } },
      },
      orderBy: { created_at: "desc" },
    });
    return res.json({ success: true, data: orders.map(mapOrder) });
  } catch (err) {
    console.error("List all orders error:", err.message);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}

export async function listOrders(req, res) {
  try {
    const orders = await prisma.order.findMany({
      where: { user_id: req.user.id },
      include: { product: { select: { name: true, slug: true, image_url: true, demo_url: true } } },
      orderBy: { created_at: "desc" },
    });
    return res.json({ success: true, data: orders.map(mapOrder) });
  } catch (err) {
    console.error("List orders error:", err.message);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}

export async function createOrder(req, res) {
  try {
    const { product_id, amount, payment_method } = req.body;
    if (!product_id) return res.status(400).json({ success: false, error: "product_id is required" });
    const orderNumber = "CV-" + Date.now().toString(36).toUpperCase();
    const pid = parseInt(product_id);
    let product = null;
    try { product = await prisma.product.findUnique({ where: { id: pid } }); } catch {}

    const order = await prisma.order.create({
      data: {
        user_id: req.user.id, product_id: pid, order_number: orderNumber,
        amount: parseInt(amount) || (product?.price || 0), status: "completed",
        payment_method: payment_method || "stripe",
        product_name: product?.name || "Product " + String(product_id).slice(0, 8),
      },
    });
    const joined = await prisma.order.findUnique({
      where: { id: order.id },
      include: { product: { select: { name: true, slug: true, image_url: true, demo_url: true } } },
    });
    return res.status(201).json({ success: true, data: mapOrder(joined || order) });
  } catch (err) {
    console.error("Create order error:", err.message);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}

export async function getOrder(req, res) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { product: { select: { name: true, slug: true, image_url: true, demo_url: true } } },
    });
    if (!order) return res.status(404).json({ success: false, error: "Order not found" });
    if (order.user_id !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ success: false, error: "Access denied" });
    }
    return res.json({ success: true, data: mapOrder(order) });
  } catch (err) {
    console.error("Get order error:", err.message);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}
