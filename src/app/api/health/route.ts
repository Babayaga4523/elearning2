import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const attempt = await db.testAttempt.findFirst({
    orderBy: { createdAt: "desc" },
    include: { answers: true }
  });
  return NextResponse.json(attempt);
}
