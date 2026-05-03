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
 * Submit Test dengan Revised Logic:
 * PRE-TEST: curang = catat, lanjut ke modul (tidak block)
 * POST-TEST: curang = force submit, FAILED + track attempt
 * POST-TEST: tidak curang + pass = COMPLETED
 * POST-TEST: tidak curang + fail = FAILED (bisa retake)
 */
export async function submitTest(
  testId: string, 
  answersData: { questionId: string, optionId: string }[],
  pendingViolations: { type: string, timestamp: string }[] = []
) {
  const session = await auth();

  if (!session || !session.user?.id) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;
  const ALLOWED_ENROLLMENT_STATUSES = ["IN_PROGRESS", "FAILED", "COMPLETED"] as const;

  // 1. Ambil data test dan session
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

  // CRITICAL FIX #3: Require TestSession
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
    
    // FIXED: Check if NEXT attempt would exceed limit
    // If current attempts >= max, then can't submit
    // Example: max=3, current=2 → next would be 3 → OK (2 < 3)
    //          max=3, current=3 → next would be 4 → NOT OK (3 >= 3)
    if (postTestAttempts >= maxPostTestAttempts && enrollment.status !== "COMPLETED") {
      throw new Error("MAX_POSTTEST_ATTEMPTS_REACHED");
    }
  }

  // 3. Duration Validation (FIXED: Use testSession.startedAt directly)
  const startedAt = testSession.startedAt;
  const timeSpent = Math.floor((Date.now() - startedAt.getTime()) / 1000);
  const durationSeconds = test.duration * 60;
  const TOLERANCE_SECONDS = 15; // FIXED: Reduced from 60 to 15 seconds

  if (timeSpent > durationSeconds + TOLERANCE_SECONDS) {
    throw new Error("WAKTU_HABIS");
  }

  if (test.course.deadlineDate && test.course.deadlineDate.getTime() < Date.now()) {
    throw new Error("DEADLINE_PASSED");
  }

  // 4. Proctoring Validation (CRITICAL FIX #1: Proper violation deduplication)
  
  // 4a. Save pending violations to database first (single source of truth)
  await Promise.all(
    pendingViolations.map(async (pv) => {
      const timestamp = new Date(pv.timestamp);
      
      // Check if already exists (prevent duplicates)
      const existing = await db.testViolationLog.findFirst({
        where: {
          userId,
          testId,
          type: pv.type,
          timestamp: {
            gte: new Date(timestamp.getTime() - 1000), // 1 second tolerance
            lte: new Date(timestamp.getTime() + 1000),
          }
        }
      });
      
      if (!existing) {
        await db.testViolationLog.create({
          data: {
            userId,
            testId,
            type: pv.type,
            timestamp
          }
        });
      }
    })
  );

  // 4b. Get all violations from database (after session started)
  const allViolations = await db.testViolationLog.findMany({
    where: {
      userId,
      testId,
      timestamp: {
        gte: testSession.startedAt
      }
    },
    orderBy: { timestamp: 'asc' }
  });

  const finalViolationCount = allViolations.length;
  const MAX_VIOLATIONS = 3; // TODO: Make configurable per test
  const isMaxViolations = finalViolationCount >= MAX_VIOLATIONS;

  // 4c. Speed hack detection (FIXED: Add network latency buffer)
  const SECONDS_PER_QUESTION = 8;
  const SPEED_HACK_THRESHOLD = 0.3;
  const NETWORK_LATENCY_BUFFER = 10; // 10 seconds buffer for network delay
  
  const minimumTimeRequired = Math.max(
    5, // Absolute minimum 5 seconds
    (test.questions.length * SECONDS_PER_QUESTION * SPEED_HACK_THRESHOLD) - NETWORK_LATENCY_BUFFER
  );
  const isSpeedHack = timeSpent < minimumTimeRequired;

  // 4d. Final Cheated Status (FIXED: Better reason tracking)
  const cheatedReasons: string[] = [];
  if (isSpeedHack) cheatedReasons.push("SPEED_HACK");
  if (isMaxViolations) cheatedReasons.push("MAX_VIOLATIONS");
  
  const isCheated = cheatedReasons.length > 0;
  const cheatedReason = cheatedReasons.length > 0 ? cheatedReasons.join(", ") : null;

  // 5. Calculate Score
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

  // 6. REVISED LOGIC: Determine status based on test type and cheating
  const isPreTest = test.type === "PRE";
  const isPostTest = test.type === "POST";
  
  // Determine attempt number
  const enrollmentAttempts = (enrollment as any).postTestAttempts ?? 0;
  const maxAttempts = (enrollment as any).maxPostTestAttempts ?? 3;
  const nextAttemptNumber = isPostTest ? (enrollmentAttempts + 1) : 1;

  // REVISED LOGIC (CRITICAL FIX #5: Use CHEATING status for post-test cheating):
  // PRE-TEST: curang = catat di enrollment, lanjut ke modul (warning)
  // POST-TEST: curang = force submit, status CHEATING (permanent block)
  // POST-TEST: tidak curang + score >= passing = COMPLETED
  // POST-TEST: tidak curang + score < passing = FAILED (bisa retake)
  
  let finalStatus: "ONGOING" | "SUBMITTED" | "FORCE_SUBMITTED" = "SUBMITTED";
  let finalPassed = false;
  let enrollmentUpdate: any = {};

  if (isCheated) {
    finalStatus = "FORCE_SUBMITTED";
    finalPassed = false;
    
    if (isPreTest) {
      // PRE-TEST: Catat curang sebagai warning, tapi lanjut ke modul
      enrollmentUpdate = {
        hasCheatedPreTest: true,
        preTestCheatingCount: { increment: 1 }
      };
    } else if (isPostTest) {
      // POST-TEST: Set status CHEATING (permanent block, tidak bisa retake)
      enrollmentUpdate = {
        status: "CHEATING", // FIXED: Use CHEATING status instead of FAILED
        hasCheatedPostTest: true,
        cheatedAtAttempt: nextAttemptNumber,
        postTestAttempts: nextAttemptNumber,
      } as any;
    }
  } else {
    // Tidak curang
    finalStatus = "SUBMITTED";
    
    if (isPreTest) {
      // PRE-TEST: Lanjut ke modul (tidak update enrollment)
      finalPassed = score >= test.passingScore; // Catat saja, tidak affect enrollment
      enrollmentUpdate = {};
    } else if (isPostTest) {
      // POST-TEST: Check passing score
      finalPassed = score >= test.passingScore;
      
      if (finalPassed) {
        // PASS: Enrollment jadi COMPLETED
        enrollmentUpdate = {
          status: "COMPLETED",
          postTestAttempts: nextAttemptNumber,
        } as any;
      } else {
        // FAIL: Enrollment jadi FAILED (bisa retake)
        enrollmentUpdate = {
          status: "FAILED",
          postTestAttempts: nextAttemptNumber,
        } as any;
      }
    }
  }

  // 7. Execute Transaction
  const attempt = await db.$transaction(async (tx: any) => {
    // Create TestAttempt with new fields
    const testAttempt = await tx.testAttempt.create({
      data: {
        userId,
        testId: testId,
        enrollmentId: enrollment.id,
        attemptNumber: nextAttemptNumber,
        score,
        passed: finalPassed,
        isCheated,
        cheatedReason,
        cheatedAt: isCheated ? new Date() : null,
        forceSubmittedAt: isCheated ? new Date() : null,
        status: finalStatus,
        violationCount: finalViolationCount,
        violationLogs: allViolations.map(v => ({ type: v.type, timestamp: v.timestamp })), // Use database violations
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

    // Update Enrollment (jika ada perubahan)
    if (Object.keys(enrollmentUpdate).length > 0) {
      await tx.enrollment.update({
        where: { id: enrollment.id },
        data: enrollmentUpdate,
      });
    }

    // Update TestSession if exists
    if (testSession) {
      await tx.testSession.update({
        where: { id: testSession.id },
        data: {
          status: finalStatus,
          score,
          isCheated,
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
    isCheated,
    passed: finalPassed,
    canRetake: isPostTest && !finalPassed && !isCheated && nextAttemptNumber < maxAttempts,
    remainingAttempts: isPostTest ? Math.max(0, maxAttempts - nextAttemptNumber) : 0,
  };
}

/**
 * Cek apakah user bisa retake post-test
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

  // Get last post-test session (using testId instead of nested test filter)
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

  // Jika sudah COMPLETED atau CHEATING, tidak bisa retake
  if ((enrollment.status as string) === "COMPLETED" || (enrollment.status as string) === "CHEATING") {
    return { canRetake: false, remainingAttempts: 0, reason: (enrollment.status as string) === "COMPLETED" ? "Already completed" : "Cheating detected" };
  }

  // Jika pernah curang di post-test, tidak bisa retake
  if ((enrollment as any).hasCheatedPostTest) {
    return { 
      canRetake: false, 
      remainingAttempts: 0, 
      reason: "Cheating detected",
      cheatedAtAttempt: (enrollment as any).cheatedAtAttempt,
    };
  }

  const postTestAttempts = (enrollment as any).postTestAttempts ?? 0;
  const maxPostTestAttempts = (enrollment as any).maxPostTestAttempts ?? 3;
  const remainingAttempts = Math.max(0, maxPostTestAttempts - postTestAttempts);
  
  return {
    canRetake: remainingAttempts > 0 && (enrollment.status as string) !== "COMPLETED" && (enrollment.status as string) !== "CHEATING",
    remainingAttempts,
    postTestAttempts,
    maxPostTestAttempts,
    status: enrollment.status,
    lastAttempt: lastPostTestSession || null,
  };
}

/**
 * Force submit test karena curang (Admin/Auto)
 */
export async function forceSubmitDueToCheating(
  testId: string,
  enrollmentId: string,
  attemptNumber: number,
  reason: string
) {
  const session = await requireAdmin();
  if ("success" in session) throw new Error(session.error);

  const [test, enrollment] = await Promise.all([
    db.test.findUnique({ where: { id: testId } }) as any,
    db.enrollment.findUnique({ where: { id: enrollmentId } }),
  ]);

  if (!test || !enrollment) {
    throw new Error("Test or enrollment not found");
  }

  await db.$transaction(async (tx: any) => {
    // Create force-submitted attempt
    await tx.testAttempt.create({
      data: {
        userId: enrollment.userId,
        testId,
        enrollmentId,
        attemptNumber,
        score: 0,
        passed: false,
        isCheated: true,
        cheatedReason: reason,
        cheatedAt: new Date(),
        forceSubmittedAt: new Date(),
        status: "FORCE_SUBMITTED",
        violationCount: 999, // Marker for manual force submit
        completedAt: new Date(),
      },
    });

    // Update enrollment
    await tx.enrollment.update({
      where: { id: enrollmentId },
      data: {
        status: "CHEATING",
        hasCheatedPostTest: true,
        cheatedAtAttempt: attemptNumber,
        postTestAttempts: attemptNumber,
      },
    });
  });

  revalidatePath(`/admin/enrollments`);
  return { success: true };
}

/**
 * Ambil Detail Jawaban per Attempt (Lazy Loading)
 */
export async function getTestAttemptDetail(attemptId: string) {
  const session = await auth();

  // Hanya admin atau pemilik attempt yang bisa lihat
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
 * Ambil SEMUA detail jawaban user untuk Export Excel
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
          testAttempt: true // to get type/score if needed
        }
      }
    } as any,
    orderBy: { createdAt: "desc" }
  });

  // Fetch all questions for these tests to get the correct options (since answers model only has isCorrect)
  // Actually, we can just get the correct option from the question model
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

