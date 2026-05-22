import { NextResponse } from "next/server";
import { log } from "@/lib/logger";
import { runAutoEnrollment } from "@/lib/scheduler";

/**
 * Cron Job: Auto Enrollment
 * Schedule: Daily at 2 AM WIB (18:00 UTC previous day)
 * Vercel Cron: 0 18 * * *
 * Security: Bearer token CRON_SECRET required
 */
export async function GET(req: Request) {
  try {
    // Security: Verify cron secret
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    log.info("Auto enrollment cron job started", { context: "cron" });
    const result = await runAutoEnrollment();

    log.info("Auto enrollment cron job completed", { context: "cron", result });
    return NextResponse.json({ 
      success: true, 
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    log.error("Auto enrollment cron job failed", { context: "cron", error });
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Allow POST as well for manual triggers
export async function POST(req: Request) {
  return GET(req);
}
