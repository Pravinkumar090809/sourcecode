/**
 * ── Auth Routes ──
 */
import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import {
  register, login, logout, me,
  updateProfile, changePassword, forgotPassword,
} from "../controllers/authController.js";

const router = Router();

router.post("/register", register);
router.post("/signup", register);          // alias
router.post("/login", login);
router.post("/logout", authenticate, logout);
router.get("/me", authenticate, me);
router.patch("/profile", authenticate, updateProfile);
router.post("/change-password", authenticate, changePassword);
router.post("/forgot-password", forgotPassword);

export default router;
