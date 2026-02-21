/**
 * Stats Controller — Admin Dashboard (Prisma)
 */
import prisma from "../config/db.js";

export async function getStats(req, res) {
  try {
    const [totalUsers, totalProducts, totalOrders, completedOrders] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.order.count(),
      prisma.order.findMany({ where: { status: "completed" }, select: { amount: true } }),
    ]);
    const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
    return res.json({ success: true, data: { totalUsers, totalProducts, totalOrders, totalRevenue } });
  } catch (err) {
    console.error("Admin stats error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}
