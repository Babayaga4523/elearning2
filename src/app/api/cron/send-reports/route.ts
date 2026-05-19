import { NextResponse } from "next/server";
import { runDepartmentalReports, runDeadlineMonitoring, runProactiveReminders } from "@/lib/scheduler";

/**
 * Combined Cron Job: Run All Reports (Testing/Manual Trigger)
 * Schedule: Manually triggered only
 * Security: Bearer token CRON_SECRET required
 *
 * NOTE: This endpoint runs all three major scheduler jobs sequentially.
 * Use this for manual testing or bulk operations.
 * For production, individual cron endpoints are scheduled separately.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");

  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    console.log("[CRON] Starting all scheduler jobs manually...");

    // Run sequentially to avoid overwhelming the system
    const proactiveResults = await runProactiveReminders();
    console.log("[CRON] Proactive reminders completed:", proactiveResults);

    const reportResults = await runDepartmentalReports();
    console.log("[CRON] Departmental reports completed:", reportResults);

    const deadlineResults = await runDeadlineMonitoring();
    console.log("[CRON] Deadline monitoring completed:", deadlineResults);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results: {
        proactiveReminders: proactiveResults,
        reports: reportResults,
        deadlineMonitoring: deadlineResults,
      },
    });
  } catch (err: any) {
    console.error("[CRON] Combined scheduler jobs failed:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  return GET(req);
}