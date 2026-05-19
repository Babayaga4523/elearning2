import { NextResponse } from "next/server";
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

    console.log("[CRON] Starting auto enrollment job...");
    const result = await runAutoEnrollment();
    
    console.log("[CRON] Auto enrollment completed:", result);
    return NextResponse.json({ 
      success: true, 
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("[CRON] Auto enrollment failed:", error);
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
