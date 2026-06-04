import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { CourseReportClient } from "./_components/CourseReportClient";

// Next.js 15: params are now Promises
interface Props {
  params: Promise<{ courseId: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { courseId } = await params;
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { title: true },
  });
  return {
    title: `Laporan: ${course?.title ?? "Kursus"} | Admin BNI Finance`,
  };
}

export default async function CourseReportPage({ params }: Props) {
  const { courseId } = await params;

  const [course, enrollments, testAttempts, moduleProgressAll] = await Promise.all([
    db.course.findUnique({
      where: { id: courseId },
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
    db.enrollment.findMany({
      where: { courseId: courseId },
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
    db.testAttempt.findMany({
      where: { test: { courseId: courseId } },
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
    db.userProgress.findMany({
      where: { module: { courseId: courseId }, isCompleted: true },
      select: { userId: true, moduleId: true },
    }),
  ]);

  if (!course) return redirect("/admin/courses");

  // Build per-user data
  const enrolledUserIds = enrollments.map((e) => e.user.id);

  // Map userId -> completed module IDs
  const completedModulesByUser: Record<string, Set<string>> = {};
  for (const p of moduleProgressAll) {
    if (!completedModulesByUser[p.userId]) completedModulesByUser[p.userId] = new Set();
    completedModulesByUser[p.userId].add(p.moduleId);
  }

  // Get best pre/post attempt per user per test type
  const preTestId = course.tests.find((t) => t.type === "PRE")?.id;
  const postTestId = course.tests.find((t) => t.type === "POST")?.id;

  const preAttemptsByUser: Record<string, number> = {};
  const postAttemptsByUser: Record<string, number> = {};
  for (const a of testAttempts) {
    if (a.score === null || a.score === undefined) continue;
    if (a.test.type === "PRE") {
      if (preAttemptsByUser[a.userId] === undefined || a.score > preAttemptsByUser[a.userId]) {
        preAttemptsByUser[a.userId] = a.score;
      }
    }
    if (a.test.type === "POST") {
      if (postAttemptsByUser[a.userId] === undefined || a.score > postAttemptsByUser[a.userId]) {
        postAttemptsByUser[a.userId] = a.score;
      }
    }
  }

  // Build report rows
  const reportRows = enrollments.map((e) => {
    const userId = e.user.id;
    const completedModules = completedModulesByUser[userId]?.size ?? 0;
    const totalModules = course.modules.length;
    const preScore = preAttemptsByUser[userId] ?? null;
    const postScore = postAttemptsByUser[userId] ?? null;
    const modulePct = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
    const preTest = course.tests.find((t) => t.type === "PRE");
    const postTest = course.tests.find((t) => t.type === "POST");

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
  const usersWithBoth = reportRows.filter((r) => r.preScore !== null && r.postScore !== null);
  const avgPre = usersWithBoth.length
    ? Math.round(usersWithBoth.reduce((s, r) => s + r.preScore!, 0) / usersWithBoth.length)
    : 0;
  const avgPost = usersWithBoth.length
    ? Math.round(usersWithBoth.reduce((s, r) => s + r.postScore!, 0) / usersWithBoth.length)
    : 0;

  // Score distribution for histogram (0-10, 10-20 … 90-100 buckets)
  const scoreDistribution = Array.from({ length: 10 }, (_, i) => {
    const lo = i * 10;
    const hi = i === 9 ? 100 : (i + 1) * 10; // last bucket inclusive of 100
    return {
      range: i === 9 ? "90-100" : `${lo}-${lo + 9}`,
      pre: testAttempts.filter((a) => a.test.type === "PRE" && a.score !== null && a.score >= lo && a.score <= hi).length,
      post: testAttempts.filter((a) => a.test.type === "POST" && a.score !== null && a.score >= lo && a.score <= hi).length,
    };
  });

  // Module completion chart
  const moduleCompletion = course.modules.map((m) => ({
    name: m.title.length > 20 ? m.title.slice(0, 20) + "…" : m.title,
    completed: moduleProgressAll.filter((p) => p.moduleId === m.id).length,
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
