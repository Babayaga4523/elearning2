import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { UserDetailClient } from "./_components/UserDetailClient";

interface Props {
  params: { userId: string };
}

export async function generateMetadata({ params }: Props) {
  const user = await db.user.findUnique({
    where: { id: params.userId },
    select: { name: true },
  });
  return {
    title: `Detail Karyawan: ${user?.name ?? "Karyawan"} | Admin BNI Finance`,
  };
}

export default async function UserDetailPage({ params }: Props) {
  const [user, enrollments, testAttempts, userProgress, videoProgress, pDFProgress] = await Promise.all([
    (db.user as any).findUnique({
      where: { id: params.userId },
      select: {
        id: true,
        name: true,
        email: true,
        nip: true,
        department: true,
        lokasi: true,
        createdAt: true,
      },
    }),
    (db.enrollment as any).findMany({
      where: { userId: params.userId },
      include: {
        course: {
          include: {
            modules: {
              where: { isPublished: true },
              orderBy: { position: "asc" },
              select: {
                id: true,
                title: true,
                type: true,
                position: true,
                duration: true,
              },
            },
            tests: {
              select: { id: true, title: true, type: true, passingScore: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    (db.testAttempt as any).findMany({
      where: { 
        userId: params.userId,
        status: { in: ["SUBMITTED", "FORCE_SUBMITTED"] }
      },
      select: {
        id: true,
        testId: true,
        score: true,
        passed: true,
        attemptNumber: true,
        startedAt: true,
        completedAt: true,
        createdAt: true,
        test: {
          select: {
            title: true,
            type: true,
            courseId: true,
            passingScore: true,
          },
        },
        answers: {
          include: {
            question: { include: { options: true } },
            selectedOption: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    (db.userProgress as any).findMany({
      where: { userId: params.userId, isCompleted: true },
      select: { moduleId: true, updatedAt: true },
    }),
    (db.videoProgress as any).findMany({
      where: { userId: params.userId },
      select: {
        moduleId: true,
        completionRate: true,
        currentTime: true,
        duration: true,
        completed: true,
      },
    }),
    (db.pDFProgress as any).findMany({
      where: { userId: params.userId },
      select: {
        moduleId: true,
        completionRate: true,
        currentPage: true,
        totalPages: true,
        completed: true,
      },
    }),
  ]);

  if (!user) return redirect("/admin/users");

  // Build lookup maps for progress data
  const completedModulesMap = new Map();
  userProgress.forEach((p: any) => completedModulesMap.set(p.moduleId, p.updatedAt));

  const videoProgressMap = new Map();
  videoProgress.forEach((p: any) => videoProgressMap.set(p.moduleId, p));

  const pDFProgressMap = new Map();
  pDFProgress.forEach((p: any) => pDFProgressMap.set(p.moduleId, p));

  // Process data per course
  const mappedEnrollments = enrollments.map((e: any) => {
    const courseAttempts = testAttempts.filter((a: any) => a.test.courseId === e.courseId);

    // Get highest scores and latest post-test result
    const preAttempts = courseAttempts.filter((a: any) => a.test.type === "PRE");
    const postAttempts = courseAttempts.filter((a: any) => a.test.type === "POST");

    const highestPre = preAttempts.length ? Math.max(...preAttempts.map((a: any) => a.score ?? 0)) : null;
    const highestPost = postAttempts.length ? Math.max(...postAttempts.map((a: any) => a.score ?? 0)) : null;

    // Get the latest post-test result
    const sortedPostAttempts = [...postAttempts].sort((a, b) =>
      new Date(b.completedAt || b.startedAt).getTime() - new Date(a.completedAt || a.startedAt).getTime()
    );
    const postPassed = postAttempts.length > 0 ? postAttempts.some((a: any) => a.passed) : null;

    // Module Progress
    const courseModules = e.course.modules;
    const completedInCourse = courseModules.filter((m: any) => completedModulesMap.has(m.id)).length;
    const moduleProgressPct = courseModules.length > 0
      ? Math.round((completedInCourse / courseModules.length) * 100)
      : 0;

    // Build module data with full progress info
    const modulesData = courseModules.map((m: any) => {
      const videoProg = videoProgressMap.get(m.id);
      const pdfProg = pDFProgressMap.get(m.id);
      const isCompleted = completedModulesMap.has(m.id);
      const completionRate = isCompleted
        ? 100
        : m.type === "VIDEO"
          ? videoProg?.completionRate ?? 0
          : m.type === "PDF"
            ? pdfProg?.completionRate ?? 0
            : 0;

      return {
        id: m.id,
        title: m.title,
        type: m.type, // "VIDEO" or "PDF"
        isCompleted,
        completedAt: completedModulesMap.get(m.id) || undefined,
        completionRate,
        duration: m.type === "VIDEO" ? m.duration : undefined,
        totalPages: m.type === "PDF" ? pdfProg?.totalPages : undefined,
        currentPage: m.type === "PDF" ? pdfProg?.currentPage : undefined,
      };
    });

    // Build test attempts with proper structure
    const testAttemptsData = courseAttempts.map((a: any) => ({
      id: a.id,
      type: a.test.type === "PRE" ? "PRE_TEST" : "POST_TEST",
      test: {
        type: a.test.type,
        passingScore: a.test.passingScore,
      },
      score: a.score,
      passed: a.passed,
      attemptNumber: a.attemptNumber ?? 1,
      startedAt: a.startedAt,
      completedAt: a.completedAt,
      createdAt: a.createdAt,
      answers: a.answers?.map((ans: any) => ({
        id: ans.id,
        questionId: ans.questionId,
        isCorrect: ans.isCorrect,
        selectedOptionId: ans.selectedOptionId,
        selectedOption: ans.selectedOption,
        question: ans.question,
      })),
    }));

    return {
      id: e.id,
      courseId: e.courseId,
      course: { title: e.course.title },
      courseTitle: e.course.title,
      status: e.status,
      enrolledAt: e.createdAt,
      moduleProgress: moduleProgressPct,
      completedModulesCount: completedInCourse,
      completedModules: completedInCourse,
      totalModulesCount: courseModules.length,
      totalModules: courseModules.length,
      preScore: highestPre,
      preTestPassed: preAttempts.length > 0 ? preAttempts.some((a: any) => a.passed) : null,
      postScore: highestPost,
      postPassed: postPassed,
      postTestPassed: postPassed,
      modules: modulesData,
      testAttempts: testAttemptsData,
    };
  });

  // Summary stats
  const totalEnrollments = mappedEnrollments.length;
  const completed = mappedEnrollments.filter((e: any) => e.status === "COMPLETED").length;
  const failed = mappedEnrollments.filter((e: any) => e.status === "FAILED").length;
  const inProgress = mappedEnrollments.filter((e: any) => e.status === "IN_PROGRESS").length;
  
  const postScores = mappedEnrollments.map((e: any) => e.postScore).filter((s: any) => s !== null);
  const avgPostScore = postScores.length 
    ? (postScores.reduce((a: number, b: number) => a + b, 0) / postScores.length)
    : 0;
  
  const complianceRate = totalEnrollments > 0 
    ? ((completed / totalEnrollments) * 100)
    : 0;

  const summary = {
    totalEnrollments,
    completed,
    failed,
    inProgress,
    avgPostScore,
    complianceRate,
  };

  return (
    <UserDetailClient 
      user={user} 
      enrollments={mappedEnrollments} 
      summary={summary}
    />
  );
}
