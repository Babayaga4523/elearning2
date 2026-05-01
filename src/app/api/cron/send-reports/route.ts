import { NextResponse } from "next/server";
import { runDepartmentalReports, runDeadlineMonitoring, runProactiveReminders } from "@/lib/scheduler";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  
  // Security Check
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const proactiveResults = await runProactiveReminders();
    const reportResults = await runDepartmentalReports();
    const deadlineResults = await runDeadlineMonitoring();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      proactiveReminders: proactiveResults,
      reports: reportResults,
      deadlineMonitoring: deadlineResults
    });
  } catch (err: any) {
    return NextResponse.json({ 
      success: false, 
      error: err.message 
    }, { status: 500 });
  }
}
