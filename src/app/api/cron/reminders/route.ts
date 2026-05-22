import { NextResponse } from "next/server";
import { log } from "@/lib/logger";
import { runProactiveReminders } from "@/lib/scheduler";

/**
 * Cron Job: Proactive Reminders (H-7, H-3, H-1)
 * Schedule: Daily at 8 AM WIB (1 AM UTC)
 * Vercel Cron: 0 1 * * *
 * Security: Bearer token CRON_SECRET required
 */
export async function GET(req: Request) {
  try {
    // Security: Verify cron secret
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    log.info("Proactive reminders cron job started", { context: "cron" });
    const result = await runProactiveReminders();

    log.info("Proactive reminders cron job completed", { context: "cron", result });
    return NextResponse.json({ 
      success: true, 
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    log.error("Proactive reminders cron job failed", { context: "cron", error });
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
