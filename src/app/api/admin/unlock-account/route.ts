import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { log } from "@/lib/logger";

/**
 * Admin endpoint to manually unlock a locked account
 * Clears all failed login attempts for the specified email
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user has admin role
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { roles: true, activeRole: true }
    });

    // Security: Safe null check for roles array
    const roles = user?.roles ?? [];
    const isAdmin = roles.includes("ADMIN") ||
                    roles.includes("SUPER_ADMIN") ||
                    user?.activeRole === "ADMIN" ||
                    user?.activeRole === "SUPER_ADMIN";

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Delete all login attempts for this email
    const result = await db.loginAttempt.deleteMany({
      where: { email }
    });

    return NextResponse.json({
      success: true,
      message: `Account unlocked successfully. Removed ${result.count} failed attempt(s).`,
      attemptsRemoved: result.count,
    });
  } catch (error) {
    log.error("[UNLOCK_ACCOUNT] Error", { context: "api", error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
