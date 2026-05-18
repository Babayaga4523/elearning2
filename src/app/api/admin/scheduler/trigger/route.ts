import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { 
  runProactiveReminders, 
  runDeadlineMonitoring, 
  runAutoEnrollment, 
  runDepartmentalReports,
  markExpiredEnrollmentsAsFailed,
} from "@/lib/scheduler";
import { isAdmin } from "@/lib/auth-helpers";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!isAdmin(session)) {
      console.error("[SCHEDULER_TRIGGER] Unauthorized access attempt", {
        email: session?.user?.email,
        activeRole: session?.user?.activeRole,
      });
      return new NextResponse("Unauthorized - Admin access required", { status: 401 });
    }

    const { jobName } = await req.json();

    if (!jobName) {
      return NextResponse.json({ error: "jobName is required" }, { status: 400 });
    }

    let result;

    switch (jobName) {
      case "reminders":
        result = await runProactiveReminders();
        break;
      case "deadline-monitoring":
        result = await runDeadlineMonitoring();
        break;
      case "auto-enrollment":
        result = await runAutoEnrollment();
        break;
      case "monthly-reports":
        result = await runDepartmentalReports();
        break;
      case "retry-failed-emails":
        // Trigger retry cron endpoint
        const retryRes = await fetch(`${process.env.NEXTAUTH_URL}/api/cron/retry-failed-emails`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.CRON_SECRET}`,
          },
        });
        result = await retryRes.json();
        break;
      case "mark-failed":
        result = await markExpiredEnrollmentsAsFailed();
        break;
      default:
        return NextResponse.json({ error: "Invalid job name" }, { status: 400 });
    }

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("Failed to trigger job:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
