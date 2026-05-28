import { NextResponse } from "next/server";
import { log } from "@/lib/logger";
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

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    log.info("Combined scheduler jobs started", { context: "cron" });

    // Run sequentially to avoid overwhelming the system
    const proactiveResults = await runProactiveReminders();
    log.info("Proactive reminders completed", { context: "cron", result: proactiveResults });

    const reportResults = await runDepartmentalReports();
    log.info("Departmental reports completed", { context: "cron", result: reportResults });

    const deadlineResults = await runDeadlineMonitoring();
    log.info("Deadline monitoring completed", { context: "cron", result: deadlineResults });

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
    log.error("Combined scheduler jobs failed", { context: "cron", error: err });
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  return GET(req);
}