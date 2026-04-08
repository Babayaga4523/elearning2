import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { CourseReportClient } from "./_components/CourseReportClient";

interface Props {
  params: { courseId: string };
}

export async function generateMetadata({ params }: Props) {
  const course = await db.course.findUnique({
    where: { id: params.courseId },
    select: { title: true },
  });
  return {
    title: `Laporan: ${course?.title ?? "Kursus"} | Admin BNI Finance`,
  };
}

export default async function CourseReportPage({ params }: Props) {
  const [course, enrollments, testAttempts, moduleProgressAll] = await Promise.all([
    (db.course as any).findUnique({
      where: { id: params.courseId },
      select: {
        id: true,
        title: true,
        category: { select: { id: true, name: true } },
        modules: {
          where: { isPublished: true },
          orderBy: { position: "asc" },
          select: { id: true, title: true, position: true },
        },
        tests: {
          select: { id: true, title: true, type: true, passingScore: true },
        },
      },
    }),
    (db.enrollment as any).findMany({
      where: { courseId: params.courseId },
      select: {
        id: true,
        userId: true,
        createdAt: true,
        status: true,
        user: { 
          select: { 
            id: true, 
            name: true, 
            email: true, 
            department: true, 
            nip: true, 
            lokasi: true 
          } 
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    (db.testAttempt as any).findMany({
      where: { test: { courseId: params.courseId } },
      select: {
        userId: true,
        testId: true,
        score: true,
        passed: true,
        createdAt: true,
        test: { select: { type: true, title: true, passingScore: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    (db.userProgress as any).findMany({
      where: { module: { courseId: params.courseId }, isCompleted: true },
      select: { userId: true, moduleId: true },
    }),
  ]);

  if (!course) return redirect("/admin/courses");

  // Build per-user data
  const enrolledUserIds = enrollments.map((e: any) => e.user.id);

  // Map userId -> completed module IDs
  const completedModulesByUser: Record<string, Set<string>> = {};
  for (const p of (moduleProgressAll as any[])) {
    if (!completedModulesByUser[p.userId]) completedModulesByUser[p.userId] = new Set();
    completedModulesByUser[p.userId].add(p.moduleId);
  }

  // Get best pre/post attempt per user per test type
  const preTestId = (course.tests as any[]).find((t: any) => t.type === "PRE")?.id;
  const postTestId = (course.tests as any[]).find((t: any) => t.type === "POST")?.id;

  const preAttemptsByUser: Record<string, number> = {};
  const postAttemptsByUser: Record<string, number> = {};
  for (const a of (testAttempts as any[])) {
    if (a.test.type === "PRE") {
      if (!preAttemptsByUser[a.userId] || a.score > preAttemptsByUser[a.userId]) {
        preAttemptsByUser[a.userId] = a.score;
      }
    }
    if (a.test.type === "POST") {
      if (!postAttemptsByUser[a.userId] || a.score > postAttemptsByUser[a.userId]) {
        postAttemptsByUser[a.userId] = a.score;
      }
    }
  }

  // Build report rows
  const reportRows = (enrollments as any[]).map((e: any) => {
    const userId = e.user.id;
    const completedModules = completedModulesByUser[userId]?.size ?? 0;
    const totalModules = (course.modules as any[]).length;
    const preScore = preAttemptsByUser[userId] ?? null;
    const postScore = postAttemptsByUser[userId] ?? null;
    const modulePct = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
    const preTest = (course.tests as any[]).find((t: any) => t.type === "PRE");
    const postTest = (course.tests as any[]).find((t: any) => t.type === "POST");

    return {
      userId,
      name: e.user.name ?? "-",
      email: e.user.email ?? "-",
      department: e.user.department ?? "-",
      nip: e.user.nip ?? "-",
      lokasi: e.user.lokasi ?? "-",
      status: e.status,
      enrolledAt: e.createdAt.toISOString(),
      completedModules,
      totalModules,
      moduleProgress: modulePct,
      preScore,
      preTestTitle: preTest?.title ?? null,
      prePassing: preTest?.passingScore ?? 70,
      preTestPassed: preScore !== null ? preScore >= (preTest?.passingScore ?? 70) : null,
      postScore,
      postTestTitle: postTest?.title ?? null,
      postPassing: postTest?.passingScore ?? 70,
      postTestPassed: postScore !== null ? postScore >= (postTest?.passingScore ?? 70) : null,
    };
  });

  // Chart: pre vs post average
  const usersWithBoth = reportRows.filter((r: any) => r.preScore !== null && r.postScore !== null);
  const avgPre = usersWithBoth.length
    ? Math.round(usersWithBoth.reduce((s: number, r: any) => s + r.preScore!, 0) / usersWithBoth.length)
    : 0;
  const avgPost = usersWithBoth.length
    ? Math.round(usersWithBoth.reduce((s: number, r: any) => s + r.postScore!, 0) / usersWithBoth.length)
    : 0;

  // Score distribution for histogram (0-10, 10-20 … 90-100 buckets)
  const scoreDistribution = Array.from({ length: 10 }, (_, i) => ({
    range: `${i * 10}-${i * 10 + 9}`,
    pre: (testAttempts as any[]).filter((a: any) => a.test.type === "PRE" && a.score >= i * 10 && a.score < (i + 1) * 10).length,
    post: (testAttempts as any[]).filter((a: any) => a.test.type === "POST" && a.score >= i * 10 && a.score < (i + 1) * 10).length,
  }));

  // Module completion chart
  const moduleCompletion = (course.modules as any[]).map((m: any) => ({
    name: m.title.length > 20 ? m.title.slice(0, 20) + "…" : m.title,
    completed: (moduleProgressAll as any[]).filter((p: any) => p.moduleId === m.id).length,
    total: enrollments.length,
  }));

  return (
    <CourseReportClient
      course={course}
      reportRows={reportRows}
      avgPre={avgPre}
      avgPost={avgPost}
      scoreDistribution={scoreDistribution}
      moduleCompletion={moduleCompletion}
      totalEnrolled={enrollments.length}
    />
  );
}
