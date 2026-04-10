import { db } from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { TestClient } from "@/components/courses/test-client";

export default async function TestPlayerPage({
  params
}: {
  params: { courseId: string; testId: string }
}) {
  const session = await auth();
  if (!session || !session.user?.id) {
    return redirect("/");
  }

  const userId = session.user.id;

  const test = await db.test.findUnique({
    where: { 
      id: params.testId,
    },
    include: {
      questions: {
        include: {
          options: true
        }
      }
    }
  });

  if (!test) return redirect(`/courses/${params.courseId}`);

  // Fetch enrollment to verify access
  const enrollment = await db.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId: params.courseId
      }
    }
  });

  if (!enrollment) return redirect(`/courses/${params.courseId}`);

  // CHECK COMPLETION STATUS & REDIRECT
  const attempts = await db.testAttempt.findMany({
    where: { userId, testId: params.testId },
    orderBy: { createdAt: "desc" },
  });

  const bestPassedAttempt = attempts.find(a => a.passed);
  const latestAttempt = attempts[0];

  // Rule 1: Pre-test is usually one-off. If they have ANY attempt, redirect.
  if (test.type === "PRE" && latestAttempt) {
    return redirect(`/courses/${params.courseId}/tests/${params.testId}/result?attemptId=${latestAttempt.id}`);
  }

  // Rule 2: If they already PASSED the test, block retake.
  if (bestPassedAttempt) {
    return redirect(`/courses/${params.courseId}/tests/${params.testId}/result?attemptId=${bestPassedAttempt.id}`);
  }

  // Rule 3: Max Attempts reached (0 = unlimited)
  if (test.maxAttempts > 0 && attempts.length >= test.maxAttempts) {
    return redirect(`/courses/${params.courseId}/tests/${params.testId}/result?attemptId=${latestAttempt.id}`);
  }

  // Rule 4: Post-test Prerequisite (All modules must be completed)
  if (test.type === "POST") {
    const modules = await db.module.findMany({
      where: { courseId: params.courseId, isPublished: true },
      include: { userProgress: { where: { userId } } }
    });

    const isAllModulesCompleted = modules.every(m => m.userProgress[0]?.isCompleted === true);

    if (!isAllModulesCompleted) {
      return redirect(`/courses/${params.courseId}`);
    }
  }

  // Shuffle questions if randomization is enabled
  let questions = [...test.questions];
  if ((test as any).randomizeQuestions) {
    questions = questions.sort(() => Math.random() - 0.5);
  }

  // Shuffle options in each question if enabled
  if ((test as any).randomizeOptions) {
    questions = questions.map(q => ({
      ...q,
      options: [...q.options].sort(() => Math.random() - 0.5)
    }));
  }

  const normalizedTest = {
    ...test,
    questions
  };

  return (
    <div className="h-full">
      <TestClient test={normalizedTest} courseId={params.courseId} />
    </div>
  );
}
