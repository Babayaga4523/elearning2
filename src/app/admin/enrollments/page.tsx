import { db } from "@/lib/db";
import { EnrollmentsClient } from "./_components/EnrollmentsClient";

export const metadata = {
  title: "Manajemen Enrollment | Admin BNI Finance E-Learning",
};

export default async function EnrollmentsPage() {
  const [enrollments, courses, users] = await Promise.all([
    (db.enrollment as any).findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        userId: true,
        courseId: true,
        status: true,
        createdAt: true,
        user: {
          select: { id: true, name: true, email: true, department: true, nip: true, lokasi: true },
        },
        course: {
          select: { 
            id: true, 
            title: true, 
            deadlineDate: true,
            category: { select: { name: true } } 
          },
        },
      },
    }),
    db.course.findMany({
      orderBy: { title: "asc" },
      select: { 
        id: true, 
        title: true,
        category: { select: { name: true } }
      },
    }),
    (db.user as any).findMany({
      where: { role: "KARYAWAN" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, department: true, nip: true },
    }),
  ]);

  // Aggregate: test attempts per enrollment (best score)
  // Optimization: Only fetch attempts for the users we found
  const userIds = enrollments.map((e: any) => e.userId);
  const testAttempts = await (db.testAttempt as any).findMany({
    where: { userId: { in: userIds } },
    select: {
      userId: true,
      score: true,
      passed: true,
      test: { select: { type: true, courseId: true } },
    },
  });

  // Build a lookup: userId+courseId -> { preScore, postScore, postPassed }
  const scoreMap: Record<string, { preScore: number | null; postScore: number | null; postPassed: boolean | null }> = {};
  for (const a of testAttempts) {
    const key = `${a.userId}_${a.test.courseId}`;
    if (!scoreMap[key]) scoreMap[key] = { preScore: null, postScore: null, postPassed: null };
    if (a.test.type === "PRE") {
      if (scoreMap[key].preScore === null || a.score > scoreMap[key].preScore!) {
        scoreMap[key].preScore = a.score;
      }
    }
    if (a.test.type === "POST") {
      if (scoreMap[key].postScore === null || a.score > scoreMap[key].postScore!) {
        scoreMap[key].postScore = a.score;
        scoreMap[key].postPassed = a.passed;
      }
    }
  }

  const enrichedEnrollments = (enrollments as any[]).map((e: any) => {
    const key = `${e.userId}_${e.courseId}`;
    const scores = scoreMap[key] ?? { preScore: null, postScore: null, postPassed: null };
    return {
      id: e.id,
      userId: e.userId,
      userName: e.user?.name ?? "-",
      userEmail: e.user?.email ?? "-",
      userDept: e.user?.department ?? "-",
      userNip: e.user?.nip ?? "-",
      userLokasi: e.user?.lokasi ?? "-",
      courseId: e.courseId,
      courseTitle: e.course?.title ?? "-",
      courseCategory: e.course?.category?.name ?? "-",
      status: e.status as string,
      enrolledAt: e.createdAt.toISOString(),
      courseDeadline: e.course?.deadlineDate ? e.course.deadlineDate.toISOString() : null,
      preScore: scores.preScore,
      postScore: scores.postScore,
      postPassed: scores.postPassed,
    };
  });

  // Summary stats
  const totalEnrollments = enrichedEnrollments.length;
  const completed = enrichedEnrollments.filter((e: any) => e.status === "COMPLETED").length;
  const inProgress = enrichedEnrollments.filter((e: any) => e.status === "IN_PROGRESS").length;
  const failed = enrichedEnrollments.filter((e: any) => e.status === "FAILED").length;

  // Department list
  const departments = Array.from(
    new Set((users as any[]).map((u: any) => u.department).filter(Boolean))
  ).sort() as string[];

  // Existing pairs for modal duplicate detection
  const existingEnrollmentPairs = enrichedEnrollments.map((e: any) => ({
    userId: e.userId,
    courseId: e.courseId,
  }));

  // Normalize users
  const normalizedUsers = (users as any[]).map((u: any) => ({
    id: u.id,
    name: u.name ?? "-",
    email: u.email ?? "-",
    department: u.department ?? "-",
    nip: u.nip ?? "-",
  }));

  // Fetch Scheduler Data
  const [autoEnrollRules, deptConfigs] = await Promise.all([
    (db as any).autoEnrollmentRule.findMany({
      include: { course: { select: { title: true } } },
      orderBy: { createdAt: "desc" },
    }),
    (db as any).departmentConfig.findMany({
      orderBy: { departmentName: "asc" },
    }),
  ]);

  // Normalize courses for EnrollModal
  const normalizedCourses = courses.map((c: any) => ({
    id: c.id,
    title: c.title,
    category: c.category?.name ?? "Tanpa Kategori",
  }));

  return (
    <EnrollmentsClient
      enrollments={enrichedEnrollments}
      courses={normalizedCourses}
      users={normalizedUsers}
      departments={departments}
      existingEnrollments={existingEnrollmentPairs}
      stats={{ totalEnrollments, completed, inProgress, failed }}
      autoEnrollRules={autoEnrollRules}
      deptConfigs={deptConfigs}
    />
  );
}
