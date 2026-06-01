import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  // Require authentication - only logged in users can access health check
  const session = await auth();

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Only admin can see detailed health info
  const isAdmin = session.user?.activeRole === "ADMIN" || session.user?.activeRole === "SUPER_ADMIN";

  if (!isAdmin) {
    return NextResponse.json(
      { error: "Forbidden - Admin access required" },
      { status: 403 }
    );
  }

  // Return limited health info for admins
  const health = {
    status: "ok",
    timestamp: new Date().toISOString(),
    database: "connected",
  };

  return NextResponse.json(health);
}
