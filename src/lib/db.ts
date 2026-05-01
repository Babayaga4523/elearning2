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
