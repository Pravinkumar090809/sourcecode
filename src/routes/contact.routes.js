/**
 * ── Contact Routes ──
 */
import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import {
  submitContact, listContacts, markRead,
} from "../controllers/contactController.js";

const router = Router();

router.post("/", submitContact);
router.get("/", authenticate, requireAdmin, listContacts);
router.patch("/:id/read", authenticate, requireAdmin, markRead);

export default router;
