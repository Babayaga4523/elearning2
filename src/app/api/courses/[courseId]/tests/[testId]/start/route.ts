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

    // Check if user is admin (for preview/practice mode)
    const isAdminUser = session.user.activeRole === "ADMIN" ||
                        session.user.activeRole === "SUPER_ADMIN";

    // Get enrollment for this course
    const enrollment = await db.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      }
    });

    // Allow admin to bypass enrollment check for test preview
    if (!enrollment && !isAdminUser) {
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

    // Check if user has exceeded max attempts (admin bypass for preview)
    if (test.maxAttempts > 0 && !isAdminUser) {
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

    // Determine attempt number
    const attemptCount = await db.testAttempt.count({
      where: {
        testId,
        userId,
      },
    });
    const nextAttemptNumber = attemptCount + 1;

    // Use transaction to create both Session and Attempt
    const result = await db.$transaction(async (tx) => {
      const session = await tx.testSession.create({
        data: {
          testId,
          userId,
          enrollmentId: enrollment?.id ?? null,
          startedAt: new Date(),
          status: "ONGOING",
          attemptNumber: nextAttemptNumber,
        },
      });

      const attempt = await tx.testAttempt.create({
        data: {
          userId,
          testId,
          enrollmentId: enrollment?.id ?? null,
          attemptNumber: nextAttemptNumber,
          startedAt: new Date(),
          status: "ONGOING",
          score: null,
          passed: false,
          timeSpent: 0,
        },
      });

      return { sessionId: session.id, attemptId: attempt.id };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}
