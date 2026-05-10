import { db } from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { TestClient } from "@/components/courses/test-client";

export default async function TestPlayerPage({
  params,
}: {
  params: { courseId: string; testId: string };
}) {
  const session = await auth();
  if (!session?.user?.id) return redirect("/");

  const userId = session.user.id;
  const isAdmin = session.user.activeRole === "ADMIN" || session.user.activeRole === "SUPER_ADMIN";

  const test = await db.test.findUnique({
    where: { id: params.testId },
    include: {
      course: {
        select: { deadlineDate: true }
      },
      questions: {
        include: { options: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!test || test.courseId !== params.courseId) {
    return redirect(`/courses/${params.courseId}`);
  }

  // SECURITY: Remove isCorrect from options before sending to client
  const sanitizedTest = {
    ...test,
    questions: test.questions.map((q) => ({
      ...q,
      options: q.options.map((opt) => {
        const { isCorrect, ...safeOption } = opt;
        return safeOption;
      }),
    })),
  };

  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId: params.courseId } },
    select: {
      id: true,
      status: true,
      maxPostTestAttempts: true,
      postTestAttempts: true
    },
  });

  const isEnrollmentActive =
    !!enrollment &&
    ["IN_PROGRESS", "FAILED", "COMPLETED"].includes(enrollment.status);

  // Admin bisa bypass enrollment & deadline
  if (!isAdmin && (!isEnrollmentActive || (test.course.deadlineDate && test.course.deadlineDate.getTime() < Date.now()))) {
    return redirect(`/courses/${params.courseId}`);
  }

  // Count actual SUBMITTED attempts from TestAttempt table (server-side validation)
  const actualAttemptCount = await db.testAttempt.count({
    where: {
      userId,
      testId: params.testId,
      status: "SUBMITTED",
    },
  });

  // Get the latest attempt for redirection
  const latestAttempt = await db.testAttempt.findFirst({
    where: { userId, testId: params.testId },
    orderBy: { createdAt: "desc" },
  });

  // Admin can preview test without restrictions
  if (!isAdmin) {
    // Get effective max attempts from test configuration (admin configurable per test)
    // If maxAttempts = 0, it means unlimited attempts
    const effectiveMaxAttempts = test.maxAttempts > 0 ? test.maxAttempts : 999;

    // RULE: If max attempts is set (> 0) and user has used all attempts, redirect to latest result
    const hasUsedAllAttempts = effectiveMaxAttempts > 0 && actualAttemptCount >= effectiveMaxAttempts;

    if (hasUsedAllAttempts && latestAttempt) {
      return redirect(
        `/courses/${params.courseId}/tests/${params.testId}/result?attemptId=${latestAttempt.id}`
      );
    }
  }

  if (test.type === "POST" && !isAdmin) {
    const modules = await db.module.findMany({
      where: { courseId: params.courseId, isPublished: true },
      include: { userProgress: { where: { userId } } },
    });
    const isAllDone = modules.every(
      (m) => m.userProgress[0]?.isCompleted === true
    );
    if (!isAllDone) return redirect(`/courses/${params.courseId}`);
  }

  const latestSession = await db.testSession.findFirst({
    where: { userId, testId: params.testId },
    orderBy: { startedAt: "desc" },
  });

  const now = new Date();
  const durationMs = test.duration * 60 * 1000;

  let startedAt: string;

  // Logic: Jika belum ada session, ATAU session terakhir sudah kadaluarsa, ATAU session terakhir sudah pernah disubmit (ada attempt baru setelah session start), maka buat session baru.
  const isSessionValid = latestSession &&
    (now.getTime() - latestSession.startedAt.getTime() < durationMs) &&
    (!latestAttempt || latestSession.startedAt.getTime() > latestAttempt.createdAt.getTime());

  if (!isSessionValid) {
    // CRITICAL FIX: Create session with enrollmentId (optional for admin)
    const newSession = await db.testSession.create({
      data: {
        userId,
        testId: params.testId,
        enrollmentId: enrollment?.id ?? null, // FIXED: Optional for admin preview
        startedAt: now,
      }
    });
    startedAt = newSession.startedAt.toISOString();
  } else {
    startedAt = latestSession!.startedAt.toISOString();
  }

  // Attempt number is actual attempt count + 1
  const attemptNumber = actualAttemptCount + 1;

  return (
    <TestClient
      test={sanitizedTest}
      courseId={params.courseId}
      attemptNumber={attemptNumber}
      maxAttempts={test.maxAttempts}
      startedAt={startedAt}
      userId={userId}
    />
  );
}
