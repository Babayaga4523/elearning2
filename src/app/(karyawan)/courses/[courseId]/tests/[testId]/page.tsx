import { db } from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { TestClient } from "@/components/courses/test-client";

// Next.js 15: params and searchParams are now Promises
interface PageProps {
  params: Promise<{ courseId: string; testId: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function TestPlayerPage({ params }: PageProps) {
  const { courseId, testId } = await params;
  const session = await auth();
  if (!session?.user?.id) return redirect("/");

  const userId = session.user.id;
  const isAdmin = session.user.activeRole === "ADMIN" || session.user.activeRole === "SUPER_ADMIN";

  const test = await db.test.findUnique({
    where: { id: testId },
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

  if (!test || test.courseId !== courseId) {
    return redirect(`/courses/${courseId}`);
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
    where: { userId_courseId: { userId, courseId: courseId } },
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
    return redirect(`/courses/${courseId}`);
  }

  // Count actual SUBMITTED attempts from TestAttempt table (server-side validation)
  const actualAttemptCount = await db.testAttempt.count({
    where: {
      userId,
      testId: testId,
      status: { in: ["SUBMITTED", "FORCE_SUBMITTED"] },
    },
  });

  // Get the latest attempt for redirection
  const latestAttempt = await db.testAttempt.findFirst({
    where: { userId, testId: testId },
    orderBy: { createdAt: "desc" },
  });

  // Find if there's any attempt with 100 score
  const perfectScoreAttempt = await db.testAttempt.findFirst({
    where: {
      userId,
      testId: testId,
      status: { in: ["SUBMITTED", "FORCE_SUBMITTED"] },
      score: 100,
    },
  });

  // Admin can preview test without restrictions
  if (!isAdmin) {
    // RULE: If they got a perfect score (100) already, redirect to that result
    if (perfectScoreAttempt) {
      return redirect(
        `/courses/${courseId}/tests/${testId}/result?attemptId=${perfectScoreAttempt.id}`
      );
    }

    // Get effective max attempts from test configuration (admin configurable per test)
    // If maxAttempts = 0, it means unlimited attempts
    const effectiveMaxAttempts = test.maxAttempts > 0 ? test.maxAttempts : 999;

    // RULE: If max attempts is set (> 0) and user has used all attempts, redirect to latest result
    const hasUsedAllAttempts = effectiveMaxAttempts > 0 && actualAttemptCount >= effectiveMaxAttempts;

    if (hasUsedAllAttempts && latestAttempt) {
      return redirect(
        `/courses/${courseId}/tests/${testId}/result?attemptId=${latestAttempt.id}`
      );
    }
  }

  if (test.type === "POST" && !isAdmin) {
    const modules = await db.module.findMany({
      where: { courseId: courseId, isPublished: true },
      include: { userProgress: { where: { userId } } },
    });
    const isAllDone = modules.every(
      (m) => m.userProgress[0]?.isCompleted === true
    );
    if (!isAllDone) return redirect(`/courses/${courseId}`);
  }

  const latestSession = await db.testSession.findFirst({
    where: { userId, testId: testId },
    orderBy: { startedAt: "desc" },
  });

  const now = new Date();
  const durationMs = test.duration * 60 * 1000;

  let startedAt: string;
  let activeAttemptId: string = "";

  // Logic: Jika belum ada session, ATAU session terakhir sudah kadaluarsa, ATAU session terakhir sudah pernah disubmit
  const isSessionValid = latestSession &&
    latestSession.status === "ONGOING" &&
    (now.getTime() - latestSession.startedAt.getTime() < durationMs);

  if (!isSessionValid) {
    // Determine attempt number
    const nextAttemptNumber = actualAttemptCount + 1;

    // Create session and attempt together
    const [newSession, newAttempt] = await db.$transaction(async (tx) => {
      const session = await tx.testSession.create({
        data: {
          userId,
          testId: testId,
          enrollmentId: enrollment?.id ?? null,
          startedAt: now,
          status: "ONGOING",
          attemptNumber: nextAttemptNumber,
        }
      });

      const attempt = await tx.testAttempt.create({
        data: {
          userId,
          testId: testId,
          enrollmentId: enrollment?.id ?? null,
          attemptNumber: nextAttemptNumber,
          startedAt: now,
          status: "ONGOING",
          score: null,
          passed: false,
          timeSpent: 0,
        },
      });

      return [session, attempt];
    });

    startedAt = newSession.startedAt.toISOString();
    activeAttemptId = newAttempt.id;
  } else {
    startedAt = latestSession!.startedAt.toISOString();
    
    // Find the existing active attempt
    const activeAttempt = await db.testAttempt.findFirst({
      where: { userId, testId: testId, status: "ONGOING" },
      orderBy: { startedAt: "desc" }
    });
    activeAttemptId = activeAttempt?.id ?? "";
  }

  // Attempt number is actual attempt count + 1
  const attemptNumber = actualAttemptCount + 1;

  return (
    <TestClient
      test={sanitizedTest}
      courseId={courseId}
      attemptNumber={attemptNumber}
      maxAttempts={test.maxAttempts}
      startedAt={startedAt}
      userId={userId}
      attemptId={activeAttemptId}
    />
  );
}
