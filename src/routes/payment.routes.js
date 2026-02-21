/**
 * ── Payment Routes (Cashfree) ──
 */
import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import {
  createPaymentOrder, verifyPayment, getPaymentStatus,
} from "../controllers/paymentController.js";

const router = Router();

router.post("/create-order", authenticate, createPaymentOrder);
router.post("/verify", authenticate, verifyPayment);
router.get("/status/:orderId", getPaymentStatus);

export default router;
