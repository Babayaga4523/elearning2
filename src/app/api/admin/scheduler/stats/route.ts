import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/auth-helpers";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!isAdmin(session)) {
      console.error("[SCHEDULER_STATS] Unauthorized access attempt", {
        email: session?.user?.email,
        activeRole: session?.user?.activeRole,
      });
      return new NextResponse("Unauthorized - Admin access required", { status: 401 });
    }

    // Get all scheduler logs grouped by job name
    const logs = await db.schedulerLog.findMany({
      orderBy: { createdAt: "desc" },
    });

    // Calculate statistics per job
    const jobMap = new Map<string, {
      totalRuns: number;
      successCount: number;
      totalDuration: number;
      lastRun: Date | null;
      lastStatus: string | null;
    }>();

    for (const log of logs) {
      if (!jobMap.has(log.jobName)) {
        jobMap.set(log.jobName, {
          totalRuns: 0,
          successCount: 0,
          totalDuration: 0,
          lastRun: null,
          lastStatus: null,
        });
      }

      const stats = jobMap.get(log.jobName)!;
      stats.totalRuns++;
      
      if (log.status === "SUCCESS") {
        stats.successCount++;
      }
      
      if (log.duration) {
        stats.totalDuration += log.duration;
      }

      // Update last run (first log is most recent due to orderBy desc)
      if (!stats.lastRun) {
        stats.lastRun = log.createdAt;
        stats.lastStatus = log.status;
      }
    }

    // Convert to array format
    const statsArray = Array.from(jobMap.entries()).map(([jobName, stats]) => ({
      jobName,
      totalRuns: stats.totalRuns,
      successRate: stats.totalRuns > 0 ? (stats.successCount / stats.totalRuns) * 100 : 0,
      avgDuration: stats.totalRuns > 0 ? stats.totalDuration / stats.totalRuns : 0,
      lastRun: stats.lastRun,
      lastStatus: stats.lastStatus,
    }));

    return NextResponse.json(statsArray);
  } catch (error) {
    console.error("Failed to fetch scheduler stats:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
