/**
 * Payment Controller — Cashfree + Prisma (product_id=Int, amount=Int)
 */
import prisma from "../config/db.js";

const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
const CASHFREE_API_URL = process.env.CASHFREE_API_URL || "https://sandbox.cashfree.com/pg";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

export async function createPaymentOrder(req, res) {
  try {
    const { product_id, product_name, amount } = req.body;
    if (!product_id || !amount) return res.status(400).json({ success: false, error: "product_id and amount are required" });
    const pid = parseInt(product_id);
    let product = null;
    try { product = await prisma.product.findUnique({ where: { id: pid } }); } catch {}
    const orderId = "CV" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
    const orderAmount = parseInt(amount) || (product?.price || 0);
    const customerId = req.user.id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 50) || "guest";
    const cfBody = {
      order_id: orderId, order_amount: orderAmount, order_currency: "INR",
      customer_details: {
        customer_id: customerId, customer_email: req.user.email || "customer@codevault.dev",
        customer_phone: (req.user.phone || "9999999999").replace(/[^0-9]/g, "").slice(-10) || "9999999999",
        customer_name: req.user.full_name || req.user.email?.split("@")[0] || "Customer",
      },
      order_meta: { return_url: FRONTEND_URL + "/payment/success?order_id={order_id}" },
      order_note: product?.name || product_name || "Codevault Premium Purchase",
    };
    const cfRes = await fetch(CASHFREE_API_URL + "/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-client-id": CASHFREE_APP_ID, "x-client-secret": CASHFREE_SECRET_KEY, "x-api-version": "2023-08-01" },
      body: JSON.stringify(cfBody),
    });
    const cfData = await cfRes.json();
    if (!cfRes.ok || !cfData.payment_session_id) {
      console.error("Cashfree order creation failed:", cfData);
      return res.status(400).json({ success: false, error: cfData.message || "Failed to create payment order" });
    }
    let dbOrder = null;
    try {
      dbOrder = await prisma.order.create({
        data: {
          user_id: req.user.id, product_id: pid, order_number: orderId, amount: orderAmount,
          status: "pending", payment_method: "cashfree", payment_id: String(cfData.cf_order_id || ""),
          product_name: product?.name || product_name || "Product " + String(product_id).slice(0, 8),
        },
      });
    } catch (err) { console.error("DB order insert error:", err.message); }
    return res.json({
      success: true,
      data: { order_id: orderId, payment_session_id: cfData.payment_session_id, cf_order_id: cfData.cf_order_id, order_amount: orderAmount, product_name: product?.name || product_name, db_order_id: dbOrder?.id || null },
    });
  } catch (err) {
    console.error("Create payment order error:", err.message);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}

export async function verifyPayment(req, res) {
  try {
    const { order_id } = req.body;
    if (!order_id) return res.status(400).json({ success: false, error: "order_id is required" });
    const cfRes = await fetch(CASHFREE_API_URL + "/orders/" + order_id, {
      headers: { "x-client-id": CASHFREE_APP_ID, "x-client-secret": CASHFREE_SECRET_KEY, "x-api-version": "2023-08-01" },
    });
    const cfData = await cfRes.json();
    let payments = [];
    try {
      const payRes = await fetch(CASHFREE_API_URL + "/orders/" + order_id + "/payments", {
        headers: { "x-client-id": CASHFREE_APP_ID, "x-client-secret": CASHFREE_SECRET_KEY, "x-api-version": "2023-08-01" },
      });
      const payData = await payRes.json();
      payments = Array.isArray(payData) ? payData : [];
    } catch {}
    const isPaid = cfData.order_status === "PAID";
    if (isPaid) {
      const paymentId = payments[0]?.cf_payment_id ? String(payments[0].cf_payment_id) : String(cfData.cf_order_id || "");
      await prisma.order.updateMany({ where: { order_number: order_id }, data: { status: "completed", payment_id: paymentId } });
    }
    let dbOrder = null;
    try {
      const o = await prisma.order.findFirst({ where: { order_number: order_id }, include: { product: { select: { name: true, slug: true, image_url: true, price: true } } } });
      if (o) { const { product, ...rest } = o; dbOrder = { ...rest, products: product }; }
    } catch {}
    return res.json({
      success: true,
      data: {
        order_id: cfData.order_id || order_id, order_status: cfData.order_status, order_amount: cfData.order_amount,
        order_currency: cfData.order_currency || "INR", cf_order_id: cfData.cf_order_id,
        payment_method: payments[0]?.payment_group || "online", payment_time: payments[0]?.payment_time || null,
        is_paid: isPaid, product_name: dbOrder?.product_name || cfData.order_note || "Codevault Purchase", db_order: dbOrder,
      },
    });
  } catch (err) {
    console.error("Payment verify error:", err.message);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}

export async function getPaymentStatus(req, res) {
  try {
    const { orderId } = req.params;
    const cfRes = await fetch(CASHFREE_API_URL + "/orders/" + orderId, {
      headers: { "x-client-id": CASHFREE_APP_ID, "x-client-secret": CASHFREE_SECRET_KEY, "x-api-version": "2023-08-01" },
    });
    const cfData = await cfRes.json();
    let dbOrder = null;
    try {
      const o = await prisma.order.findFirst({ where: { order_number: orderId }, include: { product: { select: { name: true, slug: true, image_url: true, price: true } } } });
      if (o) { const { product, ...rest } = o; dbOrder = { ...rest, products: product }; }
    } catch {}
    return res.json({
      success: true,
      data: { order_id: cfData.order_id || orderId, order_status: cfData.order_status, order_amount: cfData.order_amount, is_paid: cfData.order_status === "PAID", product_name: dbOrder?.product_name || cfData.order_note || "Codevault Purchase", db_order: dbOrder },
    });
  } catch (err) {
    console.error("Payment status error:", err.message);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}
