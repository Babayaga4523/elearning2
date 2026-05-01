import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limiter";

/**
 * API endpoint to check if an email/IP is currently locked out
 * This allows the client to sync localStorage with actual server state
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Get client IP
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : req.headers.get("x-real-ip") ?? "unknown";

    // Check current rate limit status
    const rateLimit = await checkRateLimit(email, ip);

    if (rateLimit.blocked) {
      return NextResponse.json({
        locked: true,
        reason: rateLimit.reason,
        retryAfterMinutes: rateLimit.retryAfterMinutes,
        retryAfterSeconds: (rateLimit.retryAfterMinutes ?? 15) * 60,
      });
    }

    return NextResponse.json({
      locked: false,
      attemptsRemaining: rateLimit.remaining,
    });
  } catch (error) {
    console.error("[CHECK_LOCKOUT] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
