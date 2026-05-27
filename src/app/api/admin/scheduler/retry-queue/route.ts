import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/auth-helpers";
import { log } from "@/lib/logger";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!isAdmin(session)) {
      log.error("[RETRY_QUEUE] Unauthorized access attempt", {
        email: session?.user?.email,
        activeRole: session?.user?.activeRole,
        context: "api",
      });
      return new NextResponse("Unauthorized - Admin access required", { status: 401 });
    }

    // Get pending retry queue items
    const retryQueue = await db.schedulerLog.findMany({
      where: {
        jobName: "email-retry-queue",
        status: "PENDING",
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json(retryQueue);
  } catch (error) {
    log.error("[RETRY_QUEUE] Failed to fetch retry queue", { context: "api", error: String(error) });
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
