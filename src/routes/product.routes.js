/**
 * ── Product Routes ──
 */
import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import {
  listProducts, getProduct, createProduct, updateProduct, deleteProduct,
} from "../controllers/productController.js";

const router = Router();

router.get("/", listProducts);
router.get("/:slugOrId", getProduct);
router.post("/", authenticate, requireAdmin, createProduct);
router.patch("/:slugOrId", authenticate, requireAdmin, updateProduct);
router.delete("/:slugOrId", authenticate, requireAdmin, deleteProduct);

export default router;
