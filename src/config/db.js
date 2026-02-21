/**
 * ── Prisma Client Singleton ──
 * Reuses the same PrismaClient instance across the app.
 * Configured for Supabase Transaction Pooler (pgbouncer) compatibility.
 */
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * Test database connectivity with retries.
 * Returns true if connected, false otherwise.
 */
export async function testConnection(retries = 3, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log("[db] ✅ Connected to database");
      return true;
    } catch (err) {
      console.error(`[db] Connection attempt ${i + 1}/${retries} failed:`, err.message);
      if (i < retries - 1) {
        console.log(`[db] Retrying in ${delay / 1000}s...`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  console.error("[db] ❌ All connection attempts failed");
  return false;
}

export default prisma;
