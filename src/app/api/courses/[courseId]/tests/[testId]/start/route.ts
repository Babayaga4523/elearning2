import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { rateLimit, rateLimitResponse, RateLimitPresets } from "@/lib/rate-limit";

export async function POST(
  req: NextRequest,
  { params }: { params: { courseId: string; testId: string } }
) {
  try {
    // Rate limiting: Prevent test session spam
    const rateLimitResult = await rateLimit(req, RateLimitPresets.API);
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userId = session.user.id;
    const testId = params.testId;
    const courseId = params.courseId;

    // Get enrollment for this course
    const enrollment = await db.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      }
    });

    if (!enrollment) {
      return new NextResponse("Not enrolled in this course", { status: 403 });
    }

    const test = await db.test.findUnique({
      where: { id: testId },
      select: { 
        courseId: true,
        maxAttempts: true,
        type: true,
      },
    });

    if (!test || test.courseId !== courseId) {
      return new NextResponse("Test not found for this course", { status: 404 });
    }

    // Check if user has exceeded max attempts
    if (test.maxAttempts > 0) {
      const attemptCount = await db.testAttempt.count({
        where: {
          testId,
          userId,
        },
      });

      if (attemptCount >= test.maxAttempts) {
        return new NextResponse(
          JSON.stringify({ 
            error: "MAX_ATTEMPTS_REACHED",
            message: `Anda sudah mencapai batas maksimal ${test.maxAttempts} percobaan untuk ${test.type === "PRE" ? "Pre-Test" : "Post-Test"} ini.`
          }), 
          { 
            status: 403,
            headers: { "Content-Type": "application/json" }
          }
        );
      }
    }

    // CRITICAL FIX: Create session with enrollmentId
    const testSession = await db.testSession.create({
      data: {
        testId,
        userId,
        enrollmentId: enrollment.id, // FIXED: Add enrollmentId
        startedAt: new Date(),
      },
    });

    return NextResponse.json({ sessionId: testSession.id });
  } catch (error: any) {
    console.error("[TEST_START_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
