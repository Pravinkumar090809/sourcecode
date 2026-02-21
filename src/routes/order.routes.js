/**
 * ── Order Routes ──
 */
import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import {
  listAllOrders, listOrders, createOrder, getOrder,
} from "../controllers/orderController.js";

const router = Router();

// Admin route MUST be before /:id to avoid matching "admin" as an id
router.get("/admin/all", authenticate, requireAdmin, listAllOrders);
router.get("/", authenticate, listOrders);
router.post("/", authenticate, createOrder);
router.get("/:id", authenticate, getOrder);

export default router;
