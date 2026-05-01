import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// Basic in-memory rate limiting map
// Note: In a production serverless environment, this should use Redis.
const lastRequestMap = new Map<string, number>();
const RATE_LIMIT_WINDOW = 1500; // ms
const MAX_VIOLATIONS = 3;
const ALLOWED_ENROLLMENT_STATUSES = ["IN_PROGRESS", "FAILED", "COMPLETED"] as const;

export async function POST(
  req: Request,
  { params }: { params: { courseId: string; testId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { type, timestamp, detail } = await req.json();
    const userId = session.user.id;
    const testId = params.testId;
    const courseId = params.courseId;

    const test = await db.test.findUnique({
      where: { id: testId },
      select: { courseId: true },
    });
    if (!test || test.courseId !== courseId) {
      return new NextResponse("Test not found for this course", { status: 404 });
    }

    const enrollment = await db.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
      select: { status: true },
    });
    if (!enrollment) {
      return new NextResponse("Not enrolled", { status: 403 });
    }
    if (!ALLOWED_ENROLLMENT_STATUSES.includes(enrollment.status as (typeof ALLOWED_ENROLLMENT_STATUSES)[number])) {
      return new NextResponse("Enrollment not active", { status: 403 });
    }

    const latestSession = await db.testSession.findFirst({
      where: { userId, testId },
      orderBy: { startedAt: "desc" },
      select: { startedAt: true },
    });
    if (!latestSession) {
      return new NextResponse("Test session not started", { status: 400 });
    }

    // 1. Rate Limiting Check
    const key = `${userId}:${testId}`;
    const now = Date.now();
    const lastRequest = lastRequestMap.get(key) || 0;

    if (now - lastRequest < RATE_LIMIT_WINDOW) {
      return NextResponse.json({ ignored: true, message: "Rate limit exceeded" }, { status: 429 });
    }
    lastRequestMap.set(key, now);

    // 2. Record Violation in DB
    await db.testViolationLog.create({
      data: {
        userId,
        testId,
        type,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
        detail: detail || null
      }
    });

    // 3. Count total violations only for current attempt window
    const violationCount = await db.testViolationLog.count({
      where: {
        userId,
        testId,
        timestamp: { gte: latestSession.startedAt },
      }
    });

    return NextResponse.json({ 
      shouldForceSubmit: violationCount >= MAX_VIOLATIONS,
      currentCount: violationCount
    });

  } catch (error: any) {
    console.error("[TEST_VIOLATION_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
