import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { submitTest } from "@/actions/test";
import { db } from "@/lib/db";
import { log } from "@/lib/logger";
import { rateLimit, rateLimitResponse, RateLimitPresets } from "@/lib/rate-limit";

// Known error messages from submitTest action
const KNOWN_ERRORS: Record<string, { message: string; status: number }> = {
  TEST_ALREADY_PASSED: { message: "Anda sudah lulus tes ini.", status: 403 },
  MAX_ATTEMPTS_REACHED: { message: "Batas maksimal percobaan tercapai.", status: 403 },
  MAX_POSTTEST_ATTEMPTS_REACHED: { message: "Batas maksimal percobaan post-test tercapai.", status: 403 },
  MODULES_NOT_COMPLETED: { message: "Selesaikan semua modul terlebih dahulu.", status: 403 },
  ENROLLMENT_NOT_ACTIVE: { message: "Enrollment tidak aktif.", status: 403 },
  WAKTU_HABIS: { message: "Waktu tes telah habis.", status: 403 },
  DEADLINE_PASSED: { message: "Deadline kursus telah lewat.", status: 403 },
};

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
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Security: Verify user is enrolled in this course
    const enrollment = await db.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: params.courseId
        }
      }
    });

    // Allow admin to bypass enrollment check
    const isAdminUser = session.user.activeRole === "ADMIN" || session.user.activeRole === "SUPER_ADMIN";
    if (!enrollment && !isAdminUser) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Not enrolled in this course" },
        { status: 403 }
      );
    }

    // Verify enrollment is active (not REJECTED, PENDING, or EXPIRED)
    if (enrollment && !["IN_PROGRESS", "FAILED", "COMPLETED"].includes(enrollment.status)) {
      return NextResponse.json(
        { success: false, error: `Forbidden: Enrollment status is ${enrollment.status}` },
        { status: 403 }
      );
    }

    const test = await db.test.findUnique({
      where: { id: params.testId },
      select: { courseId: true },
    });

    if (!test || test.courseId !== params.courseId) {
      return NextResponse.json(
        { success: false, error: "Test not found for this course" },
        { status: 404 }
      );
    }

    // Parse and validate request body
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { answers, attemptId, isForceSubmit } = body;

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json(
        { success: false, error: "Invalid answers format" },
        { status: 400 }
      );
    }

    // Validate answer structure
    const invalidAnswer = answers.find(
      (a: any) => typeof a.questionId !== "string" || typeof a.selectedOptionId !== "string"
    );
    if (invalidAnswer) {
      return NextResponse.json(
        { success: false, error: "Invalid answer structure" },
        { status: 400 }
      );
    }

    // Call existing server action for robust scoring and atomic transaction
    const result = await submitTest(params.testId, answers, { attemptId, isForceSubmit });

    return NextResponse.json({
      success: true,
      attemptId: result.id,
      passed: result.passed,
      canRetake: result.canRetake,
      remainingAttempts: result.remainingAttempts,
    });
  } catch (error: any) {
    // Log full error server-side
    log.error("[TEST_SUBMIT]", {
      context: "api",
      courseId: params.courseId,
      testId: params.testId,
      userId: (await auth())?.user?.id,
      error: error.message,
      stack: error?.stack
    });

    // Check if it's a known error
    const knownError = KNOWN_ERRORS[error.message];
    if (knownError) {
      return NextResponse.json(
        { success: false, error: knownError.message },
        { status: knownError.status }
      );
    }

    // Return generic message to client (don't leak internal details)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}