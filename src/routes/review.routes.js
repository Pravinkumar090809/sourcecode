/**
 * ── Review Routes ──
 */
import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { listReviews, createReview } from "../controllers/reviewController.js";

const router = Router();

router.get("/:productId", listReviews);
router.post("/", authenticate, createReview);

export default router;
