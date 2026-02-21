/**
 * Review Controller — Prisma (product_id=Int)
 * Maps: Prisma "user" → "profiles" for frontend compatibility
 */
import prisma from "../config/db.js";

function mapReview(r) {
  if (!r) return r;
  const { user, ...rest } = r;
  return { ...rest, profiles: user };
}

export async function listReviews(req, res) {
  try {
    const pid = parseInt(req.params.productId);
    const where = isNaN(pid) ? { product: { slug: req.params.productId } } : { product_id: pid };
    const reviews = await prisma.review.findMany({
      where, include: { user: { select: { full_name: true, avatar_url: true } } },
      orderBy: { created_at: "desc" },
    });
    return res.json({ success: true, data: reviews.map(mapReview) });
  } catch (err) {
    console.error("List reviews error:", err.message);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}

export async function createReview(req, res) {
  try {
    const { product_id, rating, comment } = req.body;
    if (!product_id || !rating) return res.status(400).json({ success: false, error: "Product ID and rating are required" });
    const review = await prisma.review.create({
      data: { user_id: req.user.id, product_id: parseInt(product_id), rating: parseInt(rating), comment: comment || "" },
      include: { user: { select: { full_name: true, avatar_url: true } } },
    });
    return res.status(201).json({ success: true, data: mapReview(review) });
  } catch (err) {
    console.error("Create review error:", err.message);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}
