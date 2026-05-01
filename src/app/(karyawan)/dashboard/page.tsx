import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import DashboardClient from "./_components/DashboardClient";

export default async function DashboardPage() {
  const session = await auth();

  if (!session || !session.user?.id) {
    return redirect("/");
  }

  const isAdmin = session?.user?.activeRole === "ADMIN" || session?.user?.activeRole === "SUPER_ADMIN";
  const userId = session.user.id;

  // Fetch Current User
  const currentUser = await db.user.findUnique({
    where: { id: userId },
    select: { name: true, department: true }
  });

  // 1. Fetch Basic Data
  const enrollments = await db.enrollment.findMany({
    where: { userId },
    include: {
      course: {
        include: {
          modules: { where: { isPublished: true }, orderBy: { position: "asc" } },
          category: true,
        },
      },
    },
    orderBy: { deadline: "asc" }
  });

  const completedModuleIdsRaw = await db.userProgress.findMany({
    where: { userId, isCompleted: true },
    select: { moduleId: true, module: { select: { courseId: true } } },
  });

  const passedAttemptsText = await db.testAttempt.findMany({
    where: { userId, passed: true },
    select: { testId: true }
  });
  const uniquePassedTestsCount = new Set(passedAttemptsText.map((a) => a.testId)).size;

  const allAttempts = await db.testAttempt.findMany({
    where: { userId },
    select: { score: true, isCheated: true }
  });

  // Get user's enrolled course categories for smart recommendations
  const enrolledCategoryIds = enrollments
    .filter(e => e.course.categoryId)
    .map(e => e.course.categoryId!);
  
  const uniqueEnrolledCategoryIds = Array.from(new Set(enrolledCategoryIds));
  
  // Smart recommendation logic:
  // 1. Prioritize courses from categories user is already interested in
  // 2. If user has no enrollments, show courses matching their department
  // 3. Only show published courses user hasn't enrolled in
  const exploreCoursesRaw = await db.course.findMany({
    where: { 
      isPublished: true, 
      isVisible: true, // Hanya kursus yang ditampilkan di katalog
      enrollments: { none: { userId } },
      // Prioritize courses from categories user already enrolled in
      ...(uniqueEnrolledCategoryIds.length > 0 && {
        categoryId: { in: uniqueEnrolledCategoryIds }
      })
    },
    take: 4,
    include: {
      category: true,
      _count: { select: { modules: true, enrollments: true } }
    },
    orderBy: [
      { enrollments: { _count: 'desc' } }, // Popular courses first
      { createdAt: 'desc' } // Newer courses second
    ]
  });

  // If no recommendations from enrolled categories, fetch general popular courses
  let finalExploreCourses = exploreCoursesRaw;
  if (exploreCoursesRaw.length === 0) {
    finalExploreCourses = await db.course.findMany({
      where: { 
        isPublished: true, 
        isVisible: true, // Hanya kursus yang ditampilkan di katalog
        enrollments: { none: { userId } }
      },
      take: 4,
      include: {
        category: true,
        _count: { select: { modules: true, enrollments: true } }
      },
      orderBy: { enrollments: { _count: 'desc' } }
    });
  }

  const exploreCourses = finalExploreCourses.map(c => ({
    id: c.id,
    title: c.title,
    category: c.category?.name || "General",
    enrollments: c._count.enrollments,
    modules: c._count.modules
  }));

  // 2. Logic: Completed Counts
  const completedByCourse: Record<string, number> = {};
  for (const progress of completedModuleIdsRaw) {
    const courseId = progress.module.courseId;
    completedByCourse[courseId] = (completedByCourse[courseId] || 0) + 1;
  }

  // 3. Logic: Resume Learning
  const lastProgress = await db.userProgress.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: { 
      module: { 
        include: { 
          course: { 
            include: { 
              modules: { where: { isPublished: true }, orderBy: { position: "asc" } } 
            } 
          } 
        } 
      } 
    }
  });

  let resumeData = null;
  if (lastProgress) {
    const currentCourseModules = lastProgress.module.course.modules;
    const currentModuleIndex = currentCourseModules.findIndex(m => m.id === lastProgress.moduleId);
    if (lastProgress.isCompleted && currentModuleIndex < currentCourseModules.length - 1) {
       const nextModule = currentCourseModules[currentModuleIndex + 1];
       resumeData = { title: nextModule.title, href: `/courses/${lastProgress.module.courseId}/modules/${nextModule.id}` };
    } else {
       resumeData = { title: lastProgress.module.title, href: `/courses/${lastProgress.module.courseId}/modules/${lastProgress.moduleId}` };
    }
  }

  // Define active statuses for courses that need action
  // EnrollmentStatus: IN_PROGRESS | COMPLETED | FAILED | PENDING | REJECTED | CHEATING
  const activeStatuses = ["IN_PROGRESS"]; // Hanya kursus yang sedang aktif

  // 4. Logic: Urgent Deadlines
  const today = new Date();
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(today.getDate() + 3);

  const urgentAlerts = enrollments
    .filter(en => {
      // Deadline reminder untuk IN_PROGRESS, FAILED, CHEATING
      if (!activeStatuses.includes(en.status) || !en.deadline) return false;
      const deadlineDate = new Date(en.deadline);
      return deadlineDate <= threeDaysFromNow && deadlineDate >= today;
    })
    .map(en => {
      const deadlineDate = new Date(en.deadline!);
      const diffTime = Math.abs(deadlineDate.getTime() - today.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return {
        title: en.course.title,
        deadline: `${diffDays} hari lagi`,
        courseId: en.course.id
      };
    });

  // activeCourses = kursus yang masih aktif (bisa lanjut/retake)
  const activeCourses = enrollments
    .filter(en => {
      // Exclude COMPLETED (sudah selesai), PENDING (belum approve), REJECTED (ditolak)
      if (!activeStatuses.includes(en.status)) return false;
      
      // Calculate progress
      const publishedModulesCount = en.course.modules.length;
      const completedModulesCount = completedByCourse[en.course.id] || 0;
      const progress = publishedModulesCount > 0
        ? Math.round((completedModulesCount / publishedModulesCount) * 100)
        : 0;
      
      // Tampilkan semua yang statusnya aktif (progress bisa 0-100%)
      return true;
    })
    .map((en) => {
      const publishedModulesCount = en.course.modules.length;
      const completedModulesCount = completedByCourse[en.course.id] || 0;
      const progressPercentage = publishedModulesCount > 0
        ? Math.round((completedModulesCount / publishedModulesCount) * 100)
        : 0;

      return {
        id: en.course.id,
        title: en.course.title,
        category: en.course.category?.name || "General",
        progress: progressPercentage,
        completedModules: completedModulesCount,
        totalModules: publishedModulesCount,
        deadline: en.deadline ? new Date(en.deadline).toLocaleDateString('id-ID') : "-",
        status: en.status,
      };
    });

  // 5. Logic: 7-Day Activity Chart
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const recentActivity = await db.userProgress.findMany({
    where: { userId, isCompleted: true, updatedAt: { gte: sevenDaysAgo } },
    select: { updatedAt: true }
  });

  const activityData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(today.getDate() - (6 - i));
    const dayLabel = d.toLocaleDateString("id-ID", { weekday: "short" });
    const count = recentActivity.filter(a => a.updatedAt.toDateString() === d.toDateString()).length;
    return { day: dayLabel, count };
  });

  // 5.1. Logic: 6-Month Learning Progress Chart
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(today.getMonth() - 6);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  // Get completed modules by month
  const monthlyModules = await db.userProgress.findMany({
    where: { 
      userId, 
      isCompleted: true, 
      updatedAt: { gte: sixMonthsAgo } 
    },
    select: { updatedAt: true }
  });

  // Get passed tests by month
  const monthlyTests = await db.testAttempt.findMany({
    where: { 
      userId, 
      passed: true, 
      createdAt: { gte: sixMonthsAgo } 
    },
    select: { createdAt: true }
  });

  // Generate 6 months data
  const learningProgressData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(today.getMonth() - (5 - i));
    d.setDate(1);
    
    const monthName = d.toLocaleDateString("id-ID", { month: "long" });
    const year = d.getFullYear();
    const monthStart = new Date(year, d.getMonth(), 1);
    const monthEnd = new Date(year, d.getMonth() + 1, 0, 23, 59, 59);
    
    const modulesCount = monthlyModules.filter(m => 
      m.updatedAt >= monthStart && m.updatedAt <= monthEnd
    ).length;
    
    const testsCount = monthlyTests.filter(t => 
      t.createdAt >= monthStart && t.createdAt <= monthEnd
    ).length;
    
    return { 
      month: monthName, 
      modules: modulesCount, 
      tests: testsCount 
    };
  });

  // 6. Logic: Leaderboard
  const allEmployees = await db.user.findMany({
    where: { roles: { has: "KARYAWAN" } },
    select: { 
      id: true, name: true, department: true,
      userProgress: { where: { isCompleted: true }, select: { id: true } },
      testAttempts: { where: { passed: true }, select: { id: true } },
      enrollments: { select: { status: true } }
    }
  });

  const leaderboardCandidates = allEmployees
    .map(u => {
      const hasCheated = u.enrollments.some(e => e.status === "CHEATING");
      if (hasCheated) return null;
      const score = (u.userProgress.length * 10) + (u.testAttempts.length * 50);
      return { id: u.id, name: u.name || "Karyawan", department: u.department || "-", score, isCurrentUser: u.id === userId };
    })
    .filter((c): c is NonNullable<typeof c> => c !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  const leaderboard = leaderboardCandidates.map((c, idx) => ({ ...c, rank: idx + 1 }));

  // Assemble Data Payload
  const userName = currentUser?.name || session.user.name || "Karyawan";
  const userEmail = session.user.email || "";
  const user = {
    name: userName,
    email: userEmail,
    department: currentUser?.department || "-",
    avatar: userName.substring(0, 2).toUpperCase()
  };

  const kpis = {
    activeCourses: activeCourses.length,
    modulesDone: completedModuleIdsRaw.length,
    testsPassed: uniquePassedTestsCount
  };

  // Hanya hitung attempt yang tidak curang untuk rata-rata skor
  const validAttempts = allAttempts.filter((a) => !a.isCheated && a.score !== null);
  const avgScore = validAttempts.length > 0
    ? Math.round(validAttempts.reduce((sum, curr) => sum + (curr.score ?? 0), 0) / validAttempts.length)
    : 0;

  return (
    <DashboardClient 
      user={user}
      kpis={kpis}
      urgentAlerts={urgentAlerts}
      activeCourses={activeCourses}
      activityData={activityData}
      learningProgressData={learningProgressData}
      leaderboard={leaderboard}
      exploreCourses={exploreCourses}
      resumeData={resumeData}
      avgScore={avgScore}
      isAdmin={isAdmin}
    />
  );
}