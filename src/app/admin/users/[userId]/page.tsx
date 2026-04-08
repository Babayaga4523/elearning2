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
  const [user, enrollments, testAttempts, userProgress] = await Promise.all([
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
              select: { id: true, title: true, position: true },
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
      where: { userId: params.userId },
      select: {
        id: true,
        testId: true,
        score: true,
        passed: true,
        startedAt: true,
        completedAt: true,
        createdAt: true,
        test: {
          select: {
            title: true, // Added title for direct usage if needed
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
  ]);

  if (!user) return redirect("/admin/users");

  // Map module progress for easier lookup
  const completedModulesMap = new Map();
  userProgress.forEach((p: any) => completedModulesMap.set(p.moduleId, p.updatedAt));

  // Process data per course
  const mappedEnrollments = enrollments.map((e: any) => {
    const courseAttempts = testAttempts.filter((a: any) => a.test.courseId === e.courseId);
    
    // Get highest scores
    const preAttempts = courseAttempts.filter((a: any) => a.test.type === "PRE");
    const postAttempts = courseAttempts.filter((a: any) => a.test.type === "POST");
    
    const highestPre = preAttempts.length ? Math.max(...preAttempts.map((a: any) => a.score)) : null;
    const highestPost = postAttempts.length ? Math.max(...postAttempts.map((a: any) => a.score)) : null;

    // Check if passed post test
    const postTest = e.course.tests.find((t: any) => t.type === "POST");
    const passingScore = postTest?.passingScore ?? 70;
    const postPassed = highestPost !== null ? highestPost >= passingScore : null;

    // Module Progress
    const courseModules = e.course.modules;
    const completedInCourse = courseModules.filter((m: any) => completedModulesMap.has(m.id)).length;
    const moduleProgressPct = courseModules.length > 0 
      ? Math.round((completedInCourse / courseModules.length) * 100) 
      : 0;

    return {
      id: e.id,
      courseId: e.courseId,
      course: { title: e.course.title },
      courseTitle: e.course.title, // Restore for UI components
      status: e.status,
      enrolledAt: e.createdAt,
      moduleProgress: moduleProgressPct,
      completedModulesCount: completedInCourse, // Restore for UI components
      completedModules: completedInCourse,
      totalModulesCount: courseModules.length, // Restore for UI components
      totalModules: courseModules.length,
      preScore: highestPre,
      preTestPassed: preAttempts.length > 0 ? preAttempts.some((a: any) => a.passed) : null,
      postScore: highestPost,
      postPassed: postAttempts.length > 0 ? postPassed : null, // Restore for UI components
      postTestPassed: postAttempts.length > 0 ? postPassed : null,
      // Pass all modules and attempts for the modal/export
      modules: courseModules.map((m: any) => ({
        id: m.id,
        title: m.title,
        isCompleted: completedModulesMap.has(m.id),
        completedAt: completedModulesMap.get(m.id) || null,
      })),
      testAttempts: courseAttempts.map((a: any) => ({
        id: a.id,
        type: a.test.type === "PRE" ? "PRE_TEST" : "POST_TEST",
        score: a.score,
        isPassed: a.passed,
        passingScore: a.test.passingScore,
        startedAt: a.startedAt,
        completedAt: a.completedAt,
        createdAt: a.createdAt,
        testAnswers: a.answers,
      })),
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
