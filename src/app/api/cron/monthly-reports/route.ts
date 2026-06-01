import { NextResponse } from "next/server";
import { log } from "@/lib/logger";
import { runDepartmentalReports } from "@/lib/scheduler";

/**
 * Cron Job: Monthly Departmental Reports
 * Schedule: 1st of every month at 10 AM WIB (3 AM UTC)
 * Vercel Cron: 0 3 1 * *
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

    log.info("Monthly reports cron job started", { context: "cron" });
    const result = await runDepartmentalReports();

    log.info("Monthly reports cron job completed", { context: "cron", result });
    return NextResponse.json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    log.error("Monthly reports cron job failed", { context: "cron", error: String(error) });
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