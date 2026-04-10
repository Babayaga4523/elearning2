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

  const test = await db.test.findUnique({
    where: { id: params.testId },
    include: {
      questions: {
        include: { options: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!test) return redirect(`/courses/${params.courseId}`);

  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId: params.courseId } },
  });

  if (!enrollment) return redirect(`/courses/${params.courseId}`);

  const attempts = await db.testAttempt.findMany({
    where: { userId, testId: params.testId },
    orderBy: { createdAt: "desc" },
  });

  const bestPassedAttempt = attempts.find((a) => a.passed);
  const latestAttempt = attempts[0];

  if (test.type === "PRE" && latestAttempt) {
    return redirect(
      `/courses/${params.courseId}/tests/${params.testId}/result?attemptId=${latestAttempt.id}`
    );
  }

  if (bestPassedAttempt) {
    return redirect(
      `/courses/${params.courseId}/tests/${params.testId}/result?attemptId=${bestPassedAttempt.id}`
    );
  }

  if (test.maxAttempts > 0 && attempts.length >= test.maxAttempts) {
    return redirect(
      `/courses/${params.courseId}/tests/${params.testId}/result?attemptId=${latestAttempt.id}`
    );
  }

  if (test.type === "POST") {
    const modules = await db.module.findMany({
      where: { courseId: params.courseId, isPublished: true },
      include: { userProgress: { where: { userId } } },
    });
    const isAllDone = modules.every(
      (m) => m.userProgress[0]?.isCompleted === true
    );
    if (!isAllDone) return redirect(`/courses/${params.courseId}`);
  }

  // Shuffle questions / options
  let questions = [...test.questions];
  if ((test as any).randomizeQuestions) {
    questions = questions.sort(() => Math.random() - 0.5);
  }
  if ((test as any).randomizeOptions) {
    questions = questions.map((q) => ({
      ...q,
      options: [...q.options].sort(() => Math.random() - 0.5),
    }));
  }

  const attemptNumber = attempts.length + 1;

  return (
    <TestClient
      test={{ ...test, questions }}
      courseId={params.courseId}
      attemptNumber={attemptNumber}
      maxAttempts={test.maxAttempts}
    />
  );
}
