import { NextResponse } from "next/server";
import { runDeadlineMonitoring } from "@/lib/scheduler";

/**
 * Cron Job: Deadline Monitoring & Escalation
 * Schedule: Daily at 9 AM WIB
 * Vercel Cron: 0 2 * * * (9 AM WIB = 2 AM UTC)
 */
export async function GET(req: Request) {
  try {
    // Security: Verify cron secret
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    console.log("[CRON] Starting deadline monitoring job...");
    const result = await runDeadlineMonitoring();
    
    console.log("[CRON] Deadline monitoring completed:", result);
    return NextResponse.json({ 
      success: true, 
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("[CRON] Deadline monitoring failed:", error);
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
