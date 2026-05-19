import { NextResponse } from "next/server";

// DEPRECATED: This endpoint is deprecated. Use /api/cron/auto-enrollment instead.
// Keeping for backwards compatibility, redirects to new endpoint.

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");

  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Redirect to the new endpoint
  return NextResponse.redirect(new URL("/api/cron/auto-enrollment", req.url), 302);
}

export async function POST(req: Request) {
  return GET(req);
}