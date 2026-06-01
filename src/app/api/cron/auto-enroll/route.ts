import { NextResponse } from "next/server";
import { log } from "@/lib/logger";

// DEPRECATED: This endpoint is deprecated. Use /api/cron/auto-enrollment instead.
// Keeping for backwards compatibility, redirects to new endpoint.

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");

    // FIX: Always require CRON_SECRET if it's set in environment
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Redirect to the new endpoint
    const baseUrl = req.url?.split("/api/cron/auto-enroll")[0] || "http://localhost:3000";
    return NextResponse.redirect(`${baseUrl}/api/cron/auto-enrollment`, 302);
  } catch (error: any) {
    log.error("[DEPRECATED_AUTO_ENROLL]", { context: "cron", error: String(error) });
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// FIX: Add await to prevent floating promise
export async function POST(req: Request) {
  return await GET(req);
}