import { db } from "@/lib/db";
import { EnrollmentsClient } from "./_components/EnrollmentsClient";
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Manajemen Enrollment | Admin BNI Finance E-Learning",
};

export default async function EnrollmentsPage() {
  const [enrollments, courses, users] = await Promise.all([
    db.enrollment.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        userId: true,
        courseId: true,
        status: true,
        createdAt: true,
        deadline: true,
        reportedAt: true,
        source: true,
        remindedAt7d: true,
        remindedAt3d: true,
        remindedAt1d: true,
        escalatedAt: true,
        rejectionNote: true,
        approvedById: true,
        approvedAt: true,
        // Post-test tracking fields (explicit selection - no type casting)
        postTestAttempts: true,
        maxPostTestAttempts: true,
        hasCheatedPostTest: true,
        cheatedAtAttempt: true,
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
      where: { isPublished: true }, // Only show published courses
      orderBy: { title: "asc" },
      select: { 
        id: true, 
        title: true,
        category: { select: { name: true } }
      },
    }),
    db.user.findMany({
      where: { roles: { has: "KARYAWAN" } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, department: true, nip: true },
    }),
  ]);

  // Aggregate: test attempts per enrollment (best score)
  // Optimization: Only fetch attempts for the users we found
  const userIds = enrollments.map((e) => e.userId);
  const testAttempts = await (db.testAttempt as any).findMany({
    where: { userId: { in: userIds } },
    include: {
      test: { select: { type: true, courseId: true } },
    },
  });

  // Build a lookup: userId+courseId -> { preScore, postScore, postPassed }
  const scoreMap: Record<string, { preScore: number | null; postScore: number | null; postPassed: boolean | null }> = {};
  for (const a of testAttempts) {
    if (!a.test) continue;
    const key = `${a.userId}_${a.test.courseId}`;
    if (!scoreMap[key]) scoreMap[key] = { preScore: null, postScore: null, postPassed: null };
    if (a.test.type === "PRE" && a.score !== null) {
      if (scoreMap[key].preScore === null || a.score > scoreMap[key].preScore!) {
        scoreMap[key].preScore = a.score;
      }
    }
    if (a.test.type === "POST" && a.score !== null) {
      if (scoreMap[key].postScore === null || a.score > scoreMap[key].postScore!) {
        scoreMap[key].postScore = a.score;
        scoreMap[key].postPassed = a.passed;
      }
    }
  }

  const enrichedEnrollments = enrollments.map((e: any) => {
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
      postTestAttempts: e.postTestAttempts,
      maxPostTestAttempts: e.maxPostTestAttempts,
      hasCheatedPostTest: e.hasCheatedPostTest,
      cheatedAtAttempt: e.cheatedAtAttempt,
      courseCategory: e.course?.category?.name ?? "-",
      status: e.status as string,
      enrolledAt: e.createdAt.toISOString(),
      deadline: e.deadline ? e.deadline.toISOString() : null,
      reportedAt: e.reportedAt ? e.reportedAt.toISOString() : null,
      source: e.source,
      courseDeadline: e.course?.deadlineDate ? e.course.deadlineDate.toISOString() : null,
      remindedAt7d: e.remindedAt7d ? e.remindedAt7d.toISOString() : null,
      remindedAt3d: e.remindedAt3d ? e.remindedAt3d.toISOString() : null,
      remindedAt1d: e.remindedAt1d ? e.remindedAt1d.toISOString() : null,
      escalatedAt: e.escalatedAt ? e.escalatedAt.toISOString() : null,
      preScore: scores.preScore,
      postScore: scores.postScore,
      postPassed: scores.postPassed,
      rejectionNote: e.rejectionNote,
      approvedById: e.approvedById,
      approvedAt: e.approvedAt ? e.approvedAt.toISOString() : null,
    };
  });

  // Summary stats
  const totalEnrollments = enrichedEnrollments.length;
  const completed = enrichedEnrollments.filter((e) => e.status === "COMPLETED").length;
  const inProgress = enrichedEnrollments.filter((e) => e.status === "IN_PROGRESS").length;
  const failed = enrichedEnrollments.filter((e) => e.status === "FAILED").length;

  // Department list
  const departments = Array.from(
    new Set(users.map((u) => u.department).filter((d): d is string => !!d))
  ).sort();

  // Existing pairs for modal duplicate detection
  const existingEnrollmentPairs = enrichedEnrollments.map((e) => ({
    userId: e.userId,
    courseId: e.courseId,
  }));

  // Normalize users
  const normalizedUsers = users.map((u) => ({
    id: u.id,
    name: u.name ?? "-",
    email: u.email ?? "-",
    department: u.department ?? "-",
    nip: u.nip ?? "-",
  }));

  // Fetch Scheduler Data
  const [autoEnrollRules, deptConfigs] = await Promise.all([
    db.autoEnrollmentRule.findMany({
      include: { course: { select: { title: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.departmentConfig.findMany({
      orderBy: { departmentName: "asc" },
    }),
  ]);

  // Normalize courses for EnrollModal
  const normalizedCourses = courses.map((c) => ({
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
