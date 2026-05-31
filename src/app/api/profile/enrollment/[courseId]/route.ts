import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const courseId = params.courseId;

    // Check if user is enrolled
    const enrollment = await db.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      include: {
        course: {
          select: {
            title: true,
            deadlineDate: true,
          },
        },
        testAttempts: {
          where: {
            status: { in: ["SUBMITTED", "FORCE_SUBMITTED"] },
          },
          orderBy: {
            createdAt: "desc",
          },
          include: {
            test: {
              select: {
                id: true,
                title: true,
                type: true,
                passingScore: true,
                maxAttempts: true,
              },
            },
          },
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
    }

    // Get course modules ordered by position
    const courseModules = await db.module.findMany({
      where: { courseId },
      orderBy: { position: "asc" },
      select: { id: true, title: true, type: true },
    });

    // Get user progress for these modules
    const userProgress = await db.userProgress.findMany({
      where: {
        userId,
        moduleId: { in: courseModules.map((m) => m.id) },
      },
      select: {
        moduleId: true,
        isCompleted: true,
        updatedAt: true,
      },
    });

    // Create a map for quick lookup
    const progressMap = new Map(
      userProgress.map((p) => [p.moduleId, p])
    );

    // Get video/pdf progress for completion rate
    const videoProgress = await db.videoProgress.findMany({
      where: {
        userId,
        moduleId: { in: courseModules.map((m) => m.id) },
      },
      select: {
        moduleId: true,
        completionRate: true,
      },
    });

    const pdfProgress = await db.pDFProgress.findMany({
      where: {
        userId,
        moduleId: { in: courseModules.map((m) => m.id) },
      },
      select: {
        moduleId: true,
        completionRate: true,
      },
    });

    const videoMap = new Map(videoProgress.map((p) => [p.moduleId, p.completionRate ?? 0]));
    const pdfMap = new Map(pdfProgress.map((p) => [p.moduleId, p.completionRate ?? 0]));

    // Combine modules with progress
    const modules = courseModules.map((m) => {
      const progress = progressMap.get(m.id);
      const completionRate = m.type === "VIDEO"
        ? (videoMap.get(m.id) ?? 0)
        : (pdfMap.get(m.id) ?? 0);

      return {
        id: m.id,
        title: m.title,
        type: m.type,
        isCompleted: progress?.isCompleted ?? false,
        completedAt: progress?.isCompleted ? progress.updatedAt.toISOString() : null,
        completionRate,
      };
    });

    // Get test info for Pre and Post tests
    const tests = await db.test.findMany({
      where: { courseId },
      select: {
        id: true,
        title: true,
        type: true,
        passingScore: true,
        maxAttempts: true,
      },
    });

    const preTest = tests.find((t) => t.type === "PRE");
    const postTest = tests.find((t) => t.type === "POST");

    // Calculate best scores
    const preAttempts = enrollment.testAttempts.filter((a) => a.test.type === "PRE");
    const postAttempts = enrollment.testAttempts.filter((a) => a.test.type === "POST");

    const preBestScore = preAttempts.length > 0
      ? Math.max(...preAttempts.map((a) => a.score ?? 0))
      : null;
    const postBestScore = postAttempts.length > 0
      ? Math.max(...postAttempts.map((a) => a.score ?? 0))
      : null;

    const response = {
      id: enrollment.id,
      courseId: enrollment.courseId,
      courseTitle: enrollment.course.title,
      status: enrollment.status,
      deadline: enrollment.deadline?.toISOString() ?? enrollment.course.deadlineDate?.toISOString() ?? null,
      completedAt: enrollment.status === "COMPLETED" ? enrollment.updatedAt.toISOString() : null,
      enrolledAt: enrollment.createdAt.toISOString(),
      modules,
      preTest: preTest
        ? {
            id: preTest.id,
            title: preTest.title,
            score: preBestScore,
            passed: preBestScore !== null ? preBestScore >= (preTest.passingScore ?? 70) : null,
            attemptCount: preAttempts.length,
            maxAttempts: preTest.maxAttempts,
            passedKKM: preBestScore !== null ? preBestScore >= (preTest.passingScore ?? 70) : false,
          }
        : null,
      postTest: postTest
        ? {
            id: postTest.id,
            title: postTest.title,
            score: postBestScore,
            passed: postBestScore !== null ? postBestScore >= (postTest.passingScore ?? 70) : null,
            attemptCount: postAttempts.length,
            maxAttempts: postTest.maxAttempts,
            passedKKM: postBestScore !== null ? postBestScore >= (postTest.passingScore ?? 70) : false,
          }
        : null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[PROFILE_ENROLLMENT_API]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}