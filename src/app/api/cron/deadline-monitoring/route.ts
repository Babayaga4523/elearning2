import { NextResponse } from "next/server";
import { log } from "@/lib/logger";
import { runDeadlineMonitoring, cleanupOrphanedTestSessions } from "@/lib/scheduler";

/**
 * Cron Job: Deadline Monitoring & Escalation
 * Schedule: Daily at 9 AM WIB (2 AM UTC)
 * Vercel Cron: 0 2 * * *
 * Security: Bearer token CRON_SECRET required
 */
export async function GET(req: Request) {
  try {
    // Security: Verify cron secret
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    log.info("Deadline monitoring cron job started", { context: "cron" });
    const result = await runDeadlineMonitoring();

    log.info("Orphaned test session cleanup started", { context: "cron" });
    const cleanupResult = await cleanupOrphanedTestSessions();

    log.info("Deadline monitoring cron job completed", {
      context: "cron",
      result,
      cleanup: cleanupResult
    });
    return NextResponse.json({
      success: true,
      result,
      cleanup: cleanupResult,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    log.error("Deadline monitoring cron job failed", { context: "cron", error: String(error) });
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Allow POST as well for manual triggers
// FIX: Use await to prevent floating promise
export async function POST(req: Request) {
  return await GET(req);
}