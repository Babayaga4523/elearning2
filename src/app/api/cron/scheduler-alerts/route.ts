import { NextRequest, NextResponse } from "next/server";
import { checkAndSendAlerts, checkRetryQueueHealth } from "@/lib/scheduler-alerts";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  return handleRequest(req);
}

export async function POST(req: NextRequest) {
  return handleRequest(req);
}

async function handleRequest(req: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Run alert checks
    const [alertResults, queueCheck] = await Promise.all([
      checkAndSendAlerts(),
      checkRetryQueueHealth(),
    ]);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results: {
        alerts: alertResults,
        queueHealthChecked: true,
      },
    });
  } catch (error: any) {
    console.error("Scheduler alerts cron failed:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
