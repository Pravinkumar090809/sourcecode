/**
 * ── User Routes (Admin) ──
 */
import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import {
  listUsers, getUser, updateUser, deleteUser,
} from "../controllers/userController.js";

const router = Router();

router.get("/", authenticate, requireAdmin, listUsers);
router.get("/:id", authenticate, requireAdmin, getUser);
router.patch("/:id", authenticate, requireAdmin, updateUser);
router.delete("/:id", authenticate, requireAdmin, deleteUser);

export default router;
