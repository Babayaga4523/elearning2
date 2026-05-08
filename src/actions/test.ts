"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-helpers";

export async function createQuestion(testId: string, data: { text: string }) {
  const session = await requireAdmin();
  if ("success" in session) throw new Error(session.error);

  const question = await db.question.create({
    data: {
      text: data.text,
      testId,
    },
  });

  revalidatePath(`/admin/courses/[courseId]/tests/${testId}`);
  return question;
}

export async function updateQuestion(id: string, data: { text: string }) {
  const session = await requireAdmin();
  if ("success" in session) throw new Error(session.error);

  const question = await db.question.update({
    where: { id },
    data: { ...data },
  });

  return question;
}

export async function deleteQuestion(id: string, testId: string) {
  const session = await requireAdmin();
  if ("success" in session) throw new Error(session.error);

  await db.question.delete({
    where: { id },
  });

  revalidatePath(`/admin/courses/[courseId]/tests/${testId}`);
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

  return option;
}

export async function deleteOption(id: string) {
  const session = await requireAdmin();
  if ("success" in session) throw new Error(session.error);

  await db.option.delete({
    where: { id },
  });
}

export async function updateTest(id: string, values: Partial<any>) {
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
 */
export async function submitTest(
  testId: string, 
  answersData: { questionId: string, optionId: string }[]
) {
  const session = await auth();

  if (!session || !session.user?.id) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;
  const ALLOWED_ENROLLMENT_STATUSES = ["IN_PROGRESS", "FAILED", "COMPLETED"] as const;

  // 1. Fetch test data and session
  const test = await db.test.findUnique({
    where: { id: testId },
    include: {
      course: { select: { id: true, deadlineDate: true } },
      questions: { include: { options: true } },
    },
  }) as any;

  if (!test) throw new Error("Test tidak ditemukan");

  const [testSession, enrollment] = await Promise.all([
    db.testSession.findFirst({
      where: { testId, userId },
      orderBy: { startedAt: 'desc' }
    }),
    db.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId: test.courseId } },
    })
  ]);

  // Require TestSession
  if (!testSession) {
    throw new Error("INVALID_SESSION: Test session not found. Please restart the test.");
  }

  if (!enrollment) throw new Error("Not enrolled in this course");
  if (!ALLOWED_ENROLLMENT_STATUSES.includes(enrollment.status as (typeof ALLOWED_ENROLLMENT_STATUSES)[number])) {
    throw new Error("ENROLLMENT_NOT_ACTIVE");
  }

  // 2. Check Post-Test retake limit
  if (test.type === "POST") {
    const postTestAttempts = (enrollment as any).postTestAttempts ?? 0;
    const maxPostTestAttempts = (enrollment as any).maxPostTestAttempts ?? 3;
    
    if (postTestAttempts >= maxPostTestAttempts && enrollment.status !== "COMPLETED") {
      throw new Error("MAX_POSTTEST_ATTEMPTS_REACHED");
    }
  }

  // 3. Duration Validation
  const startedAt = testSession.startedAt;
  const timeSpent = Math.floor((Date.now() - startedAt.getTime()) / 1000);
  const durationSeconds = test.duration * 60;
  const TOLERANCE_SECONDS = 15;

  if (timeSpent > durationSeconds + TOLERANCE_SECONDS) {
    throw new Error("WAKTU_HABIS");
  }

  if (test.course.deadlineDate && test.course.deadlineDate.getTime() < Date.now()) {
    throw new Error("DEADLINE_PASSED");
  }

  // 4. Calculate Score
  let correctCount = 0;
  test.questions.forEach((question: { id: string, options: { id: string, isCorrect: boolean }[] }) => {
    const userAnswer = answersData.find((a) => a.questionId === question.id);
    const correctOption = question.options.find((o) => o.isCorrect);
    if (userAnswer && correctOption && userAnswer.optionId === correctOption.id) {
      correctCount++;
    }
  });

  const totalQuestions = test.questions.length;
  const score = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

  // 5. Determine status based on test type
  const isPreTest = test.type === "PRE";
  const isPostTest = test.type === "POST";
  
  const enrollmentAttempts = (enrollment as any).postTestAttempts ?? 0;
  const maxAttempts = (enrollment as any).maxPostTestAttempts ?? 3;
  const nextAttemptNumber = isPostTest ? (enrollmentAttempts + 1) : 1;

  let finalPassed = false;
  let enrollmentUpdate: any = {};

  if (isPreTest) {
    finalPassed = score >= test.passingScore;
    // Pre-test: just record score, no enrollment status change
    enrollmentUpdate = {};
  } else if (isPostTest) {
    finalPassed = score >= test.passingScore;
    
    if (finalPassed) {
      enrollmentUpdate = {
        status: "COMPLETED",
        postTestAttempts: nextAttemptNumber,
      } as any;
    } else {
      enrollmentUpdate = {
        status: "FAILED",
        postTestAttempts: nextAttemptNumber,
      } as any;
    }
  }

  // 6. Execute Transaction
  const attempt = await db.$transaction(async (tx: any) => {
    // Create TestAttempt
    const testAttempt = await tx.testAttempt.create({
      data: {
        userId,
        testId: testId,
        enrollmentId: enrollment.id,
        attemptNumber: nextAttemptNumber,
        score,
        passed: finalPassed,
        status: "SUBMITTED",
        timeSpent,
        startedAt,
        completedAt: new Date(),
      },
    });

    // Create TestAnswers
    await tx.testAnswer.createMany({
      data: test.questions.map((q: any) => {
        const userAnswer = answersData.find((a) => a.questionId === q.id);
        const correctOption = q.options.find((o: any) => o.isCorrect);
        return {
          testAttemptId: testAttempt.id,
          questionId: q.id,
          selectedOptionId: userAnswer?.optionId ?? null,
          isCorrect: !!(userAnswer && correctOption && userAnswer.optionId === correctOption.id),
        };
      }),
    });

    // Update Enrollment (if needed)
    if (Object.keys(enrollmentUpdate).length > 0) {
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
  if (isPostTest) {
    revalidatePath(`/courses/${test.courseId}/tests/${testId}`);
  }

  return {
    ...attempt,
    passed: finalPassed,
    canRetake: isPostTest && !finalPassed && nextAttemptNumber < maxAttempts,
    remainingAttempts: isPostTest ? Math.max(0, maxAttempts - nextAttemptNumber) : 0,
  };
}

/**
 * Check if user can retake post-test
 * Returns: { canRetake: boolean, remainingAttempts: number, lastAttempt?: any }
 */
export async function canRetakePostTest(courseId: string) {
  const session = await auth();
  if (!session || !session.user?.id) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;

  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });

  if (!enrollment) {
    return { canRetake: false, remainingAttempts: 0, reason: "Not enrolled" };
  }

  // Get last post-test session
  const postTest = await db.test.findFirst({
    where: {
      courseId: courseId,
      type: "POST"
    },
    select: { id: true }
  });

  const lastPostTestSession = postTest ? await db.testSession.findFirst({
    where: {
      enrollmentId: enrollment.id,
      testId: postTest.id
    },
    orderBy: { startedAt: "desc" }
  }) : null;

  // If already COMPLETED, cannot retake
  if ((enrollment.status as string) === "COMPLETED") {
    return { canRetake: false, remainingAttempts: 0, reason: "Already completed" };
  }

  const postTestAttempts = (enrollment as any).postTestAttempts ?? 0;
  const maxPostTestAttempts = (enrollment as any).maxPostTestAttempts ?? 3;
  const remainingAttempts = Math.max(0, maxPostTestAttempts - postTestAttempts);
  
  return {
    canRetake: remainingAttempts > 0 && (enrollment.status as string) !== "COMPLETED",
    remainingAttempts,
    postTestAttempts,
    maxPostTestAttempts,
    status: enrollment.status,
    lastAttempt: lastPostTestSession || null,
  };
}

/**
 * Fetch Test Attempt Detail (Lazy Loading)
 */
export async function getTestAttemptDetail(attemptId: string) {
  const session = await auth();

  // Only admin or attempt owner can view
  if (!session) throw new Error("Unauthorized");

  const attempt = await db.testAttempt.findUnique({
    where: { id: attemptId },
    include: {
      test: {
        include: {
          questions: {
            orderBy: { createdAt: "asc" },
            include: {
              options: true
            }
          }
        }
      },
      answers: {
        include: {
          selectedOption: true
        }
      }
    } as any
  });

  if (!attempt) return null;

  // Security: Check if admin or owner
  const activeRole = session.user?.activeRole;
  if ((activeRole !== "ADMIN" && activeRole !== "SUPER_ADMIN") && attempt.userId !== session.user?.id) {
    throw new Error("Unauthorized to view this attempt");
  }

  return attempt as any;
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
        }
      },
      answers: {
        include: {
          question: true,
          selectedOption: true,
          testAttempt: true
        }
      }
    } as any,
    orderBy: { createdAt: "desc" }
  });

  // Fetch all questions for these tests to get the correct options
  const results = await Promise.all(attempts.map(async (a: any) => {
    const questionsWithCorrect = await db.question.findMany({
      where: { testId: a.testId },
      include: { options: { where: { isCorrect: true } } }
    });

    return {
      ...a,
      questionsWithCorrect
    };
  }));

  return results as any;
}
