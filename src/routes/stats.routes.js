/**
 * ── Admin Stats Routes ──
 */
import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { getStats } from "../controllers/statsController.js";

const router = Router();

router.get("/stats", authenticate, requireAdmin, getStats);

export default router;
