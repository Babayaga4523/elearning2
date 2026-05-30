"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-helpers";

export async function createQuestion(testId: string, data: { text: string; position?: number }) {
  const session = await requireAdmin();
  if ("success" in session) throw new Error(session.error);

  // Auto-assign position if not provided: append at end
  let position = data.position;
  if (position === undefined) {
    const lastQuestion = await db.question.findFirst({
      where: { testId },
      orderBy: { position: "desc" },
      select: { position: true },
    });
    position = (lastQuestion?.position ?? -1) + 1;
  }

  const question = await db.question.create({
    data: {
      text: data.text,
      testId,
      position,
    },
  });

  revalidatePath(`/admin/courses/[courseId]/tests/${testId}`);
  return question;
}

export async function updateQuestion(questionId: string, data: { text: string }) {
  const session = await requireAdmin();
  if ("success" in session) throw new Error(session.error);

  const question = await db.question.update({
    where: { id: questionId },
    data: { text: data.text },
  });

  // Get testId to revalidate path
  const test = await db.test.findFirst({ where: { questions: { some: { id: questionId } } } });
  if (test) {
    revalidatePath(`/admin/courses/${test.courseId}/tests/${test.id}`);
  }
  return question;
}

export async function deleteQuestion(id: string, testId: string) {
  const session = await requireAdmin();
  if ("success" in session) throw new Error(session.error);

  // Get courseId before delete for revalidation
  const test = await db.test.findFirst({
    where: { id: testId },
    select: { courseId: true }
  });

  await db.question.delete({
    where: { id },
  });

  if (test) {
    revalidatePath(`/admin/courses/${test.courseId}/tests/${testId}`);
  }
}

export async function addOption(questionId: string, data: { text: string, isCorrect: boolean }) {
  const session = await requireAdmin();
  if ("success" in session) throw new Error(session.error);

  const option = await db.option.create({
    data: {
      text: data.text,
      isCorrect: data.isCorrect,
      questionId,
    },
  });

  // Get testId to revalidate path
  const test = await db.test.findFirst({
    where: { questions: { some: { id: questionId } } }
  });
  if (test) {
    revalidatePath(`/admin/courses/${test.courseId}/tests/${test.id}`);
  }
  return option;
}

export async function deleteOption(id: string) {
  const session = await requireAdmin();
  if ("success" in session) throw new Error(session.error);

  // Get test info before delete
  const option = await db.option.findUnique({
    where: { id: id },
    include: {
      question: {
        include: {
          test: {
            select: { id: true, courseId: true }
          }
        }
      }
    }
  });

  await db.option.delete({
    where: { id },
  });

  if (option?.question?.test) {
    revalidatePath(`/admin/courses/${option.question.test.courseId}/tests/${option.question.test.id}`);
  }
}

export async function updateTest(id: string, values: Record<string, unknown>) {
  const session = await requireAdmin();
  if ("success" in session) throw new Error(session.error);

  const test = await db.test.update({
    where: { id },
    data: { ...values },
  });

  revalidatePath(`/admin/courses/${test.courseId}/tests/${id}`);
  revalidatePath(`/admin/courses/${test.courseId}`);
  revalidatePath(`/courses/${test.courseId}`);
  revalidatePath("/dashboard");
  return test;
}

export async function deleteTest(id: string) {
  const session = await requireAdmin();
  if ("success" in session) throw new Error(session.error);

  const existingTest = await db.test.findUnique({
    where: { id },
  });

  if (!existingTest) throw new Error("Test not found");

  const test = await db.test.delete({
    where: { id },
  });

  revalidatePath(`/admin/courses/${test.courseId}`);
  revalidatePath(`/courses/${test.courseId}`);
  revalidatePath("/dashboard");
  return test;
}

/**
 * Submit Test — Simplified Logic (No Anti-Cheat):
 * PRE-TEST: score recorded, proceed to modules
 * POST-TEST: pass → COMPLETED, fail → FAILED (can retake within limit)
 *
 * ATTENTION: maxAttempts is now taken from test.maxAttempts (configured per test by admin)
 */
export async function submitTest(
  testId: string,
  answersData: { questionId: string; optionId: string }[]
) {
  const session = await auth();

  if (!session || !session.user?.id) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;
  const isAdmin = session.user.activeRole === "ADMIN" || session.user.activeRole === "SUPER_ADMIN";
  const ALLOWED_ENROLLMENT_STATUSES = ["IN_PROGRESS", "FAILED", "COMPLETED"] as const;

  // 1. Fetch test data and session
  const test = await db.test.findUnique({
    where: { id: testId },
    include: {
      course: { select: { id: true, deadlineDate: true } },
      questions: { include: { options: true } },
    },
  });

  if (!test) throw new Error("Test tidak ditemukan");

  const [testSession, enrollment] = await Promise.all([
    db.testSession.findFirst({
      where: { testId, userId },
      orderBy: { startedAt: "desc" },
    }),
    db.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId: test.courseId } },
    }),
  ]);

  // Require TestSession
  if (!testSession) {
    throw new Error("INVALID_SESSION: Test session not found. Please restart the test.");
  }

  // Admin can bypass enrollment check for test preview/practice
  // Non-admin users must be enrolled
  if (!isAdmin) {
    if (!enrollment) throw new Error("Not enrolled in this course");
    if (!ALLOWED_ENROLLMENT_STATUSES.includes(enrollment.status as (typeof ALLOWED_ENROLLMENT_STATUSES)[number])) {
      throw new Error("ENROLLMENT_NOT_ACTIVE");
    }
  }

  // 2. Count actual SUBMITTED attempts from TestAttempt table
  const actualAttemptCount = await db.testAttempt.count({
    where: {
      userId,
      testId: testId,
      status: "SUBMITTED",
    },
  });

  // 3. Get max attempts from test configuration (admin configurable per test)
  // If maxAttempts = 0, it means unlimited attempts
  const maxAttemptsFromTest = test.maxAttempts ?? 0;
  // For post-test, also check enrollment's maxPostTestAttempts as fallback override
  const effectiveMaxAttempts = maxAttemptsFromTest;

  // Validate: reject if already used all attempts (server-side validation)
  if (!isAdmin && effectiveMaxAttempts > 0 && actualAttemptCount >= effectiveMaxAttempts) {
    throw new Error("MAX_POSTTEST_ATTEMPTS_REACHED");
  }

  // 4. Duration Validation
  const startedAt = testSession.startedAt;
  const timeSpent = Math.floor((Date.now() - startedAt.getTime()) / 1000);
  const durationSeconds = test.duration * 60;
  const TOLERANCE_SECONDS = 15;

  if (timeSpent > durationSeconds + TOLERANCE_SECONDS) {
    throw new Error("WAKTU_HABIS");
  }

  if (test.course.deadlineDate && new Date(test.course.deadlineDate).getTime() < Date.now()) {
    throw new Error("DEADLINE_PASSED");
  }

  // 5. Calculate Score
  let correctCount = 0;
  for (const question of test.questions) {
    const userAnswer = answersData.find((a) => a.questionId === question.id);
    const correctOption = question.options.find((o) => o.isCorrect);
    if (userAnswer && correctOption && userAnswer.optionId === correctOption.id) {
      correctCount++;
    }
  }

  const totalQuestions = test.questions.length;
  const score = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
  const finalPassed = score >= test.passingScore;

  // 6. Determine attempt number (next = actualAttemptCount + 1)
  const nextAttemptNumber = actualAttemptCount + 1;

  // Calculate remaining attempts for response
  const remainingAttempts = effectiveMaxAttempts > 0
    ? Math.max(0, effectiveMaxAttempts - nextAttemptNumber)
    : 999; // Unlimited

  let enrollmentUpdate: Record<string, unknown> = {};

  // 7. Update enrollment status (only for POST test with enrollment)
  if (test.type === "POST" && enrollment && !isAdmin) {
    if (finalPassed) {
      enrollmentUpdate = { status: "COMPLETED" };
    } else {
      // Only set FAILED if already out of attempts
      if (effectiveMaxAttempts > 0 && actualAttemptCount + 1 >= effectiveMaxAttempts) {
        enrollmentUpdate = { status: "FAILED" };
      }
    }
  } else if (test.type === "POST" && isAdmin) {
    // Admin bypass: no enrollment update
    enrollmentUpdate = {};
  }

  // 8. Execute Transaction
  const attempt = await db.$transaction(async (tx) => {
    // Create TestAttempt
    const testAttempt = await tx.testAttempt.create({
      data: {
        userId,
        testId: testId,
        enrollmentId: enrollment?.id ?? null,
        attemptNumber: nextAttemptNumber,
        score,
        passed: finalPassed,
        status: "SUBMITTED",
        timeSpent,
        startedAt,
        completedAt: new Date(),
      },
    });

    // Create TestAnswers — preserve answerOrder so result shows questions in the order user worked on them
    await tx.testAnswer.createMany({
      data: answersData.map((userAnswer, idx) => {
        const question = test.questions.find((q) => q.id === userAnswer.questionId);
        const correctOption = question?.options.find((o) => o.isCorrect);
        return {
          testAttemptId: testAttempt.id,
          questionId: userAnswer.questionId,
          selectedOptionId: userAnswer.optionId ?? null,
          isCorrect: !!(userAnswer.optionId && correctOption && userAnswer.optionId === correctOption.id),
          answerOrder: idx,
        };
      }),
    });

    // Update Enrollment (only if enrollment exists and update is needed)
    if (enrollment && Object.keys(enrollmentUpdate).length > 0) {
      await tx.enrollment.update({
        where: { id: enrollment.id },
        data: enrollmentUpdate,
      });
    }

    // Update TestSession
    if (testSession) {
      await tx.testSession.update({
        where: { id: testSession.id },
        data: {
          status: "SUBMITTED",
          score,
          submittedAt: new Date(),
        },
      });
    }

    return testAttempt;
  });

  // Revalidate paths
  revalidatePath(`/courses/${test.courseId}`);
  revalidatePath("/dashboard");
  if (test.type === "POST") {
    revalidatePath(`/courses/${test.courseId}/tests/${testId}`);
  }

  return {
    ...attempt,
    passed: finalPassed,
    canRetake: !finalPassed && remainingAttempts > 0,
    canRetakeForAdmin: isAdmin,
    remainingAttempts,
    maxAttempts: effectiveMaxAttempts,
    bestScore: score,
  };
}

/**
 * Check if user can retake post-test
 */
export async function canRetakePostTest(courseId: string) {
  const session = await auth();
  if (!session || !session.user?.id) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;
  const isAdmin = session.user.activeRole === "ADMIN" || session.user.activeRole === "SUPER_ADMIN";

  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });

  // Admin can always retake (for preview/practice purposes)
  if (isAdmin) {
    return {
      canRetake: true,
      remainingAttempts: 999,
      postTestAttempts: 0,
      maxPostTestAttempts: 999,
      status: "ADMIN_BYPASS",
      lastAttempt: null,
    };
  }

  if (!enrollment) {
    return { canRetake: false, remainingAttempts: 0, reason: "Not enrolled" };
  }

  // Get post-test configuration
  const postTest = await db.test.findFirst({
    where: { courseId: courseId, type: "POST" },
    select: { id: true, maxAttempts: true, passingScore: true },
  });

  if (!postTest) {
    return { canRetake: false, remainingAttempts: 0, reason: "No post-test found" };
  }

  // Count actual SUBMITTED attempts for this test
  const actualAttemptCount = await db.testAttempt.count({
    where: {
      userId,
      testId: postTest.id,
      status: "SUBMITTED",
    },
  });

  const lastPostTestSession = await db.testSession.findFirst({
    where: { enrollmentId: enrollment.id, testId: postTest.id },
    orderBy: { startedAt: "desc" },
  });

  // If already COMPLETED, cannot retake
  if (enrollment.status === "COMPLETED") {
    return {
      canRetake: false,
      remainingAttempts: 0,
      postTestAttempts: actualAttemptCount,
      maxPostTestAttempts: postTest.maxAttempts,
      status: enrollment.status,
      lastAttempt: lastPostTestSession || null,
    };
  }

  // Determine remaining attempts
  const maxAttemptsFromTest = postTest.maxAttempts ?? 0;
  const remainingAttempts = maxAttemptsFromTest > 0
    ? Math.max(0, maxAttemptsFromTest - actualAttemptCount)
    : 999;

  return {
    canRetake: remainingAttempts > 0,
    remainingAttempts,
    postTestAttempts: actualAttemptCount,
    maxPostTestAttempts: postTest.maxAttempts,
    passingScore: postTest.passingScore,
    status: enrollment.status,
    lastAttempt: lastPostTestSession || null,
  };
}

/**
 * Fetch Test Attempt Detail (Lazy Loading)
 */
export async function getTestAttemptDetail(attemptId: string) {
  const session = await auth();

  if (!session) throw new Error("Unauthorized");

  const attempt = await db.testAttempt.findUnique({
    where: { id: attemptId },
    include: {
      test: {
        include: {
          questions: {
            orderBy: { position: "asc" },
            include: { options: { orderBy: { position: "asc" } } },
          },
        },
      },
      answers: {
        orderBy: { answerOrder: "asc" },
        include: { selectedOption: true },
      },
    },
  });

  if (!attempt) return null;

  // Security: Check if admin or owner
  const activeRole = session.user?.activeRole;
  if (
    (activeRole !== "ADMIN" && activeRole !== "SUPER_ADMIN") &&
    attempt.userId !== session.user?.id
  ) {
    throw new Error("Unauthorized to view this attempt");
  }

  return attempt;
}

/**
 * Fetch ALL user test details for Excel Export
 */
export async function getAllUserTestDetails(userId: string) {
  const session = await requireAdmin();
  if ("success" in session) throw new Error(session.error);

  const attempts = await db.testAttempt.findMany({
    where: { userId },
    include: {
      test: {
        include: {
          course: { select: { title: true } },
        },
      },
      answers: {
        include: {
          question: true,
          selectedOption: true,
          testAttempt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Fix N+1: Fetch all questions in a single query instead of one per attempt
  const testIds = [...new Set(attempts.map((a) => a.testId))];
  const questionsWithCorrectMap = new Map<string, unknown[]>();

  if (testIds.length > 0) {
    const allQuestions = await db.question.findMany({
      where: { testId: { in: testIds } },
      include: { options: { where: { isCorrect: true } } },
    });

    for (const question of allQuestions) {
      if (!questionsWithCorrectMap.has(question.testId)) {
        questionsWithCorrectMap.set(question.testId, []);
      }
      questionsWithCorrectMap.get(question.testId)!.push(question);
    }
  }

  // Attach questions to each attempt
  const results = attempts.map((a) => ({
    ...a,
    questionsWithCorrect: questionsWithCorrectMap.get(a.testId) ?? [],
  }));

  return results;
}