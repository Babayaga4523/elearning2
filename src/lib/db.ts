import { PrismaClient } from "@/generated/client";
import { env } from "@/lib/env";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Initialize Prisma Client with connection pool configuration
// The connection pool is configured via DATABASE_URL query parameters:
// - connection_limit: Maximum number of connections (default: 10)
// - pool_timeout: Timeout in seconds for acquiring connection (default: 20)
export const db = globalThis.prisma || new PrismaClient({
  log: env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  datasources: {
    db: {
      url: env.DATABASE_URL,
    },
  },
});

if (process.env.NODE_ENV !== "production") globalThis.prisma = db;

// Graceful shutdown for serverless environments
// Prevents connection leaks on cold shutdowns
if (process.env.NODE_ENV === "production") {
  const handleShutdown = async (signal: string) => {
    console.log(`[Prisma] Received ${signal}, disconnecting gracefully...`);
    try {
      await db.$disconnect();
      console.log("[Prisma] Disconnected successfully");
    } catch (error) {
      console.error("[Prisma] Error during disconnect:", error);
    }
    process.exit(0);
  };

  process.on("SIGTERM", () => handleShutdown("SIGTERM"));
  process.on("SIGINT", () => handleShutdown("SIGINT"));
}