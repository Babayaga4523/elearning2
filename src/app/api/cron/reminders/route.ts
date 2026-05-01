import { NextResponse } from "next/server";
import { runProactiveReminders } from "@/lib/scheduler";

/**
 * Cron Job: Proactive Reminders (H-7, H-3, H-1)
 * Schedule: Daily at 8 AM WIB
 * Vercel Cron: 0 1 * * * (8 AM WIB = 1 AM UTC)
 */
export async function GET(req: Request) {
  try {
    // Security: Verify cron secret
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    console.log("[CRON] Starting proactive reminders job...");
    const result = await runProactiveReminders();
    
    console.log("[CRON] Proactive reminders completed:", result);
    return NextResponse.json({ 
      success: true, 
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("[CRON] Proactive reminders failed:", error);
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
