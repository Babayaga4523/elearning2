"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function createQuestion(testId: string, data: { text: string }) {
  const session = await auth();

  if (!session || session.user?.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

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
  const session = await auth();

  if (!session || session.user?.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const question = await db.question.update({
    where: { id },
    data: { ...data },
  });

  return question;
}

export async function deleteQuestion(id: string, testId: string) {
  const session = await auth();

  if (!session || session.user?.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  await db.question.delete({
    where: { id },
  });

  revalidatePath(`/admin/courses/[courseId]/tests/${testId}`);
}

export async function addOption(questionId: string, data: { text: string, isCorrect: boolean }) {
  const session = await auth();

  if (!session || session.user?.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

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
  const session = await auth();

  if (!session || session.user?.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  await db.option.delete({
    where: { id },
  });
}

export async function updateTest(id: string, values: any) {
  const session = await auth();

  if (!session || session.user?.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const test = await db.test.update({
    where: { id },
    data: { ...values },
  });

  revalidatePath(`/admin/courses/${test.courseId}/tests/${id}`);
  revalidatePath(`/admin/courses/${test.courseId}`);
  return test;
}

export async function deleteTest(id: string) {
  const session = await auth();

  if (!session || session.user?.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const existingTest = await db.test.findUnique({
    where: { id },
  });

  if (!existingTest) throw new Error("Test not found");

  const test = await db.test.delete({
    where: { id },
  });

  revalidatePath(`/admin/courses/${test.courseId}`);
  return test;
}

/**
 * Submit Test dengan Transaksi Atomik & Perhitungan Jawaban di Server
 */
export async function submitTest(
  testId: string, 
  answersData: { questionId: string, optionId: string }[],
  startedAt?: Date,
  cheated: boolean = false
) {
  const session = await auth();

  if (!session || !session.user?.id) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;

  // 1. Ambil data test & kunci jawaban dari server (Security)
  const test = await db.test.findUnique({
    where: { id: testId },
    include: {
      questions: {
        include: {
          options: true,
        },
      },
    },
  }) as any;

  if (!test) throw new Error("Test tidak ditemukan");

  // 2. SERVER-SIDE ACCESS VALIDATION
  // Rule A: Lulus = Kunci (passed tests are permanently locked)
  const bestPassedAttempt = await db.testAttempt.findFirst({
    where: { userId, testId, passed: true },
    orderBy: { score: "desc" },
  });
  if (bestPassedAttempt) {
    throw new Error("TEST_ALREADY_PASSED");
  }

  // Rule B: Max Attempts enforcement (0 = unlimited)
  const testMaxAttempts = (test as any).maxAttempts as number;
  if (testMaxAttempts > 0) {
    const attemptCount = await db.testAttempt.count({ where: { userId, testId } });
    if (attemptCount >= testMaxAttempts) {
      throw new Error("MAX_ATTEMPTS_REACHED");
    }
  }

  // Rule C: Post-test Prerequisite (All modules completed)
  if (test.type === "POST") {
    const modules = await db.module.findMany({
      where: { courseId: test.courseId, isPublished: true },
      include: { userProgress: { where: { userId } } }
    });
    const isAllModulesCompleted = modules.every(m => m.userProgress[0]?.isCompleted === true);
    if (!isAllModulesCompleted) {
      throw new Error("MODULES_NOT_COMPLETED");
    }
  }

  // 3. Proses perhitungan jawaban secara server-side
  let correctCount = 0;
  const totalQuestions = test.questions.length;
  const results = test.questions.map((question: { id: string; options: { id: string; isCorrect: boolean }[] }) => {
    const userAnswer = answersData.find((a) => a.questionId === question.id);
    const correctOption = question.options.find((o: { id: string; isCorrect: boolean }) => o.isCorrect);
    const isCorrect = !!(userAnswer && correctOption && userAnswer.optionId === correctOption.id);
    
    if (isCorrect) correctCount++;
    
    return {
      questionId: question.id,
      selectedOptionId: userAnswer?.optionId ?? null,
      isCorrect,
    };
  });

  const score = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
  const passed = score >= test.passingScore;

  // 3. Eksekusi transaksi database (Atomic)
  const attempt = await db.$transaction(async (tx) => {
    // Simpan Attempt
    const testAttempt = await (tx as any).testAttempt.create({
      data: {
        userId,
        testId: testId,
        score,
        passed,
        cheated,
        startedAt: startedAt ? new Date(startedAt) : null,
        completedAt: new Date(),
      },
    });

    // Simpan Detail Jawaban
    await (tx as any).testAnswer.createMany({
      data: results.map((r: { questionId: string; selectedOptionId: string | null; isCorrect: boolean }) => ({
        testAttemptId: testAttempt.id,
        questionId: r.questionId,
        selectedOptionId: r.selectedOptionId,
        isCorrect: r.isCorrect,
      })),
    });

    // ─── LOGIKA UPDATE STATUS ENROLLMENT ───
    if (test.type === "POST") {
      const currentEnrollment = await (tx as any).enrollment.findUnique({
        where: { userId_courseId: { userId, courseId: test.courseId } },
      });

      if (currentEnrollment) {
        if (passed) {
          // Rule: Lulus Post-Test -> COMPLETED
          await (tx as any).enrollment.update({
            where: { id: currentEnrollment.id },
            data: { status: "COMPLETED" },
          });
        } else if (testMaxAttempts > 0) {
          // Rule: Gagal Post-Test & Habis Percobaan -> FAILED
          const totalAttempts = await (tx as any).testAttempt.count({
            where: { userId, testId },
          });
          
          if (totalAttempts >= testMaxAttempts) {
            await (tx as any).enrollment.update({
              where: { id: currentEnrollment.id },
              data: { status: "FAILED" },
            });
          }
        }
      }
    }

    return testAttempt;
  });

  revalidatePath(`/courses/${test.courseId}/tests/${testId}`);
  revalidatePath(`/courses/${test.courseId}/tests/${testId}/result`);
  revalidatePath(`/courses/${test.courseId}`);
  
  return attempt;
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
  if (session.user?.role !== "ADMIN" && attempt.userId !== session.user?.id) {
    throw new Error("Unauthorized to view this attempt");
  }

  return attempt as any;
}

/**
 * Ambil SEMUA detail jawaban user untuk Export Excel
 */
export async function getAllUserTestDetails(userId: string) {
  const session = await auth();
  if (!session || session.user?.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

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

