import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { submitTest } from "@/actions/test";
import { db } from "@/lib/db";
import { rateLimit, rateLimitResponse, RateLimitPresets } from "@/lib/rate-limit";

export async function POST(
  req: NextRequest,
  { params }: { params: { courseId: string; testId: string } }
) {
  try {
    // Rate limiting: Prevent test submission spam
    const rateLimitResult = await rateLimit(req, RateLimitPresets.API);
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Security: Verify user is enrolled in this course (CRITICAL FIX)
    const enrollment = await db.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: params.courseId
        }
      }
    });

    // Allow admin to bypass enrollment check
    const isAdminUser = session.user.activeRole === "ADMIN" || session.user.activeRole === "SUPER_ADMIN";
    if (!enrollment && !isAdminUser) {
      return new NextResponse("Forbidden: Not enrolled in this course", { status: 403 });
    }

    // Verify enrollment is active (not REJECTED, PENDING, or EXPIRED)
    if (enrollment && !["IN_PROGRESS", "FAILED", "COMPLETED"].includes(enrollment.status)) {
      return new NextResponse(`Forbidden: Enrollment status is ${enrollment.status}`, { status: 403 });
    }

    const test = await db.test.findUnique({
      where: { id: params.testId },
      select: { courseId: true },
    });
    
    if (!test || test.courseId !== params.courseId) {
      return new NextResponse("Test not found for this course", { status: 404 });
    }

    const body = await req.json();
    const { answers } = body;

    if (!answers || !Array.isArray(answers)) {
      return new NextResponse("Invalid answers format", { status: 400 });
    }

    // Call existing server action for robust scoring and atomic transaction
    const result = await submitTest(params.testId, answers);

    return NextResponse.json({ 
      attemptId: result.id,
      passed: result.passed,
      canRetake: result.canRetake,
      remainingAttempts: result.remainingAttempts,
    });
  } catch (error: any) {
    // Handle known error messages from submitTest action
    if (error.message === "TEST_ALREADY_PASSED") {
      return new NextResponse("You have already passed this test.", { status: 403 });
    }
    if (error.message === "MAX_ATTEMPTS_REACHED") {
      return new NextResponse("Maximum attempts reached.", { status: 403 });
    }
    if (error.message === "MAX_POSTTEST_ATTEMPTS_REACHED") {
      return new NextResponse("Batas maksimal percobaan post-test tercapai.", { status: 403 });
    }
    if (error.message === "MODULES_NOT_COMPLETED") {
      return new NextResponse("Prerequisite modules not completed.", { status: 403 });
    }
    if (error.message === "ENROLLMENT_NOT_ACTIVE") {
      return new NextResponse("Enrollment tidak aktif.", { status: 403 });
    }
    if (error.message === "WAKTU_HABIS") {
      return new NextResponse("Waktu test telah habis.", { status: 403 });
    }
    if (error.message === "DEADLINE_PASSED") {
      return new NextResponse("Deadline kursus telah lewat.", { status: 403 });
    }

    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
}
