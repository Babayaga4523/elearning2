import { NextResponse } from "next/server";
import { purgeExpiredAttempts } from "@/lib/rate-limiter";

/**
 * GET /api/cron/purge-login-attempts
 *
 * Housekeeping job: deletes LoginAttempt records older than the rate-limit
 * window (15 minutes). This keeps the table lean without affecting correctness —
 * the rate limiter only queries within the window anyway.
 *
 * Suggested schedule: every 30 minutes via AKS CronJob or external scheduler.
 * Auth: same CRON_SECRET Bearer token pattern as other cron routes.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");

  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const deleted = await purgeExpiredAttempts();
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      message: `Purged ${deleted} expired login attempt record(s).`,
      deletedCount: deleted,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
