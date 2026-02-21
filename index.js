/**
 * CODEVAULT - Premium Source Code Marketplace API v3.0
 * PostgreSQL + Prisma + JWT + Express
 */
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, ".env.local") });

// Debug: print env status (no secrets)
console.log("ENV DEBUG ->", {
  DATABASE_URL: !!process.env.DATABASE_URL,
  JWT_SECRET: !!process.env.JWT_SECRET,
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  FRONTEND_URL: process.env.FRONTEND_URL,
});

// Global error handlers
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION", err);
});
process.on("unhandledRejection", (reason) => {
  console.error("UNHANDLED REJECTION", reason);
});

import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import prisma from "./src/config/db.js";

// Validate env vars
if (!process.env.DATABASE_URL) {
  console.error("Missing DATABASE_URL in environment variables");
  process.exit(1);
}

// Import Routes
import authRoutes from "./src/routes/auth.routes.js";
import productRoutes from "./src/routes/product.routes.js";
import orderRoutes from "./src/routes/order.routes.js";
import userRoutes from "./src/routes/user.routes.js";
import contactRoutes from "./src/routes/contact.routes.js";
import reviewRoutes from "./src/routes/review.routes.js";
import paymentRoutes from "./src/routes/payment.routes.js";
import statsRoutes from "./src/routes/stats.routes.js";

// Express App
const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "10mb" }));

// HEALTH
app.get("/health", (_, res) =>
  res.json({ status: "ok", timestamp: new Date().toISOString() })
);

// same check under /api so that frontend and external tests can easily ping it
app.get("/api/health", async (_, res) => {
  try {
    // simple db query to confirm connectivity
    const count = await prisma.user.count();
    res.json({ status: "ok", dbUsers: count, timestamp: new Date().toISOString() });
  } catch (err) {
    console.error("/api/health error", err.message);
    res.status(500).json({ status: "error", error: err.message });
  }
});

// API ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/users", userRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", statsRoutes);

// EXPORT APP (for combined server)
export { app };

// START SERVER (only when run directly)
const currentFile = fileURLToPath(import.meta.url);
const isDirectRun =
  process.argv[1] &&
  process.argv[1].endsWith("index.js") &&
  currentFile.endsWith(process.argv[1].replace(/.*backend/, "backend"));

async function ensureAdminUser() {
  // create a default admin if none exists; values can be overridden with
  // environment variables for flexibility.
  const email = process.env.DEFAULT_ADMIN_EMAIL || "pravinbairwa584@gmail.com";
  const password = process.env.DEFAULT_ADMIN_PASSWORD || "Pravin1122@";
  const fullName = process.env.DEFAULT_ADMIN_NAME || "Pravin Bairwa";
  const phone = process.env.DEFAULT_ADMIN_PHONE || "9783761084";

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (!existing) {
      const hashed = await bcrypt.hash(password, 10);
      await prisma.user.create({
        data: {
          email,
          password: hashed,
          full_name: fullName,
          phone,
          role: "admin",
        },
      });
      console.log("[init] default admin user created:", email);
    } else {
      // update role if somehow changed
      if (existing.role !== "admin") {
        await prisma.user.update({ where: { email }, data: { role: "admin" } });
        console.log("[init] existing user role updated to admin for", email);
      }
    }
  } catch (err) {
    console.error("[init] failed to ensure admin user:", err);
  }
}

if (isDirectRun) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log("Codevault API v3.0 running on http://localhost:" + PORT);
    console.log("PostgreSQL + Prisma + JWT");
  });

  // create admin asynchronously (don't block listen)
  ensureAdminUser();
}
