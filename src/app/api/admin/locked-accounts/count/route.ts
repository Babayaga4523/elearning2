import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { windowStart, EMAIL_MAX_ATTEMPTS, IP_MAX_ATTEMPTS } from "@/lib/rate-limiter";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await requireAdmin();
    if (!result || "success" in result) {
      return NextResponse.json(
        { error: result?.error || "Unauthorized" },
        { status: 401 }
      );
    }

    const since = windowStart();

    // Get all login attempts in the window
    const allAttempts = await db.loginAttempt.findMany({
      where: { createdAt: { gte: since } },
      select: {
        email: true,
        ipAddress: true,
      },
    });

    // Group by email manually
    const emailMap = new Map<string, number>();
    const ipMap = new Map<string, number>();

    for (const attempt of allAttempts) {
      emailMap.set(attempt.email, (emailMap.get(attempt.email) || 0) + 1);
      ipMap.set(attempt.ipAddress, (ipMap.get(attempt.ipAddress) || 0) + 1);
    }

    // Count locked
    const lockedEmailsCount = Array.from(emailMap.values()).filter(count => count >= EMAIL_MAX_ATTEMPTS).length;
    const lockedIpsCount = Array.from(ipMap.values()).filter(count => count >= IP_MAX_ATTEMPTS).length;
    const totalLocked = lockedEmailsCount + lockedIpsCount;

    return NextResponse.json({
      total: totalLocked,
      emails: lockedEmailsCount,
      ips: lockedIpsCount,
    });
  } catch (error) {
    console.error("[LOCKED_ACCOUNTS_COUNT]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
