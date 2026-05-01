import { NextResponse } from "next/server";
import { runDepartmentalReports } from "@/lib/scheduler";

/**
 * Cron Job: Monthly Departmental Reports
 * Schedule: 1st of every month at 10 AM WIB
 * Vercel Cron: 0 3 1 * * (10 AM WIB = 3 AM UTC on 1st of month)
 */
export async function GET(req: Request) {
  try {
    // Security: Verify cron secret
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    console.log("[CRON] Starting monthly reports job...");
    const result = await runDepartmentalReports();
    
    console.log("[CRON] Monthly reports completed:", result);
    return NextResponse.json({ 
      success: true, 
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("[CRON] Monthly reports failed:", error);
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
