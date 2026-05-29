/**
 * Password Reset Token Cleanup Cron
 *
 * Runs daily to clean up expired password reset tokens.
 *
 * CRON_SECRET protected endpoint
 * Schedule: Daily at 02:00 UTC (09:00 WIB)
 *
 * Deletes:
 * - Tokens that have been expired for more than 24 hours
 * - Tokens that have been used for more than 24 hours
 */

import { NextRequest, NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";
import { log } from "@/lib/logger";

/**
 * Delete expired password reset tokens
 *
 * Keeping tokens for 24 hours after expiry allows for:
 * - Users to see "expired" message instead of "invalid"
 * - Audit trail for security monitoring
 */
async function cleanupExpiredTokens(): Promise<{
  deletedExpired: number;
  deletedUsed: number;
  errors: string[];
}> {
  const results = {
    deletedExpired: 0,
    deletedUsed: 0,
    errors: [] as string[],
  };

  const now = new Date();

  // Tokens expired more than 24 hours ago
  const expiredThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Tokens used more than 24 hours ago
  const usedThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  try {
    // Delete expired tokens (passed expiry and 24h past)
    const expiredResult = await prisma.passwordResetToken.deleteMany({
      where: {
        expiresAt: { lt: expiredThreshold },
      },
    });
    results.deletedExpired = expiredResult.count;
  } catch (error) {
    results.errors.push(
      `Failed to delete expired tokens: ${error instanceof Error ? error.message : "Unknown"}`
    );
    log.error("Token cleanup - expired tokens", {
      error: error instanceof Error ? error.message : "Unknown",
      context: "scheduler",
    });
  }

  try {
    // Delete used tokens (more than 24h old)
    const usedResult = await prisma.passwordResetToken.deleteMany({
      where: {
        usedAt: { lt: usedThreshold },
      },
    });
    results.deletedUsed = usedResult.count;
  } catch (error) {
    results.errors.push(
      `Failed to delete used tokens: ${error instanceof Error ? error.message : "Unknown"}`
    );
    log.error("Token cleanup - used tokens", {
      error: error instanceof Error ? error.message : "Unknown",
      context: "scheduler",
    });
  }

  return results;
}

export async function POST(request: NextRequest) {
  try {
    // Verify CRON_SECRET
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      log.error("CRON_SECRET not configured", {
        context: "scheduler",
      });
      return NextResponse.json(
        { error: "Server misconfiguration" },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      log.warn("Unauthorized cron attempt", {
        ip: request.headers.get("x-forwarded-for"),
        context: "scheduler",
      });
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const startTime = Date.now();

    log.info("Starting password token cleanup", {
      context: "scheduler",
    });

    const results = await cleanupExpiredTokens();

    const duration = Date.now() - startTime;

    log.info("Password token cleanup completed", {
      deletedExpired: results.deletedExpired,
      deletedUsed: results.deletedUsed,
      duration,
      errors: results.errors,
      context: "scheduler",
    });

    // Save to scheduler log
    await prisma.schedulerLog.create({
      data: {
        jobName: "cleanup-password-tokens",
        status: results.errors.length === 0 ? "SUCCESS" : "PARTIAL",
        message: `Deleted ${results.deletedExpired} expired, ${results.deletedUsed} used tokens`,
        duration,
        metadata: results,
      },
    });

    return NextResponse.json({
      success: true,
      deletedExpired: results.deletedExpired,
      deletedUsed: results.deletedUsed,
      duration,
      errors: results.errors.length > 0 ? results.errors : undefined,
    });
  } catch (error) {
    log.error("Password token cleanup failed", {
      error: error instanceof Error ? error.message : "Unknown",
      context: "scheduler",
    });

    // Log failure
    await prisma.schedulerLog.create({
      data: {
        jobName: "cleanup-password-tokens",
        status: "FAILED",
        message: error instanceof Error ? error.message : "Unknown error",
      },
    });

    return NextResponse.json(
      { error: "Cleanup failed" },
      { status: 500 }
    );
  }
}

// Also support GET for manual testing
export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Method not allowed" },
      { status: 405 }
    );
  }

  const startTime = Date.now();
  const results = await cleanupExpiredTokens();
  const duration = Date.now() - startTime;

  return NextResponse.json({
    success: true,
    deletedExpired: results.deletedExpired,
    deletedUsed: results.deletedUsed,
    duration,
    errors: results.errors.length > 0 ? results.errors : undefined,
  });
}