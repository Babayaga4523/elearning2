"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function getPerformanceData() {
  const session = await auth();
  if (!session || !session.user?.id) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;

  // 0. Fetch User Details for Transcript Header
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { name: true, nip: true }
  });

  // 1. Fetch Enrolled Courses with their Modules and Tests
  const enrollments = await db.enrollment.findMany({
    where: { userId },
    include: {
      course: {
        include: {
          category: true,
          modules: {
            where: { isPublished: true },
            select: { id: true, duration: true }
          },
          tests: {
            select: {
              id: true,
              type: true,
              passingScore: true,
            }
          }
        }
      }
    }
  });

  // 2. Fetch User Progress (Modules)
  const userProgress = await db.userProgress.findMany({
    where: { userId, isCompleted: true },
    select: { moduleId: true }
  });
  const completedModuleIds = new Set(userProgress.map(p => p.moduleId));

  // 3. Fetch All Test Attempts for this user
  const allAttempts = await db.testAttempt.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      test: {
        select: {
          id: true,
          title: true,
          type: true,
          courseId: true,
          course: {
            select: {
              title: true
            }
          }
        }
      }
    }
  });

  // 4. Calculate Summary Metrics
  const totalCourses = enrollments.length;
  const completedCourses = enrollments.filter(e => e.status === "COMPLETED").length;
  
  const totalTestsTaken = allAttempts.length;
  const totalTestsPassed = allAttempts.filter(a => a.passed).length;
  
  const allScores = allAttempts.map(a => a.score);
  const averageScore = allScores.length > 0 
    ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) 
    : 0;

  // 5. Build Course-by-Course Analysis
  const courseAnalysis = enrollments.map(en => {
    const course = en.course;
    const publishedModules = course.modules;
    const completedInCourse = publishedModules.filter(m => completedModuleIds.has(m.id)).length;
    
    const progress = publishedModules.length > 0 
      ? Math.round((completedInCourse / publishedModules.length) * 100) 
      : 0;

    // Get BEST attempts for this course (Highest Score)
    const courseAttempts = allAttempts.filter(a => a.test.courseId === course.id);
    
    const bestPre = courseAttempts
      .filter(a => a.test.type === "PRE")
      .sort((a, b) => b.score - a.score)[0];
      
    const bestPost = courseAttempts
      .filter(a => a.test.type === "POST")
      .sort((a, b) => b.score - a.score)[0];

    // Calculate growth delta based on BEST scores
    let growth = null;
    if (bestPre && bestPost) {
      growth = Math.round(bestPost.score - bestPre.score);
    }

    return {
      id: course.id,
      title: course.title,
      category: course.category?.name || "Uncategorized",
      progress,
      status: en.status,
      preScore: bestPre?.score ?? null,
      postScore: bestPost?.score ?? null,
      growth,
      lastAttempt: courseAttempts[0]?.createdAt ?? null
    };
  });

  // 6. Trend Data (Last 10 attempts for chart)
  const trendData = [...allAttempts]
    .reverse() // Chronological order
    .slice(-10)
    .map(a => ({
      date: a.createdAt.toISOString(),
      score: a.score,
      title: a.test.title,
      type: a.test.type
    }));

  // 7. Recent Activity (Top 5)
  const recentActivity = allAttempts.slice(0, 5).map(a => ({
    id: a.id,
    testTitle: a.test.title,
    courseId: a.test.courseId,
    courseTitle: (a.test as any).course.title,
    score: a.score,
    passed: a.passed,
    date: a.createdAt
  }));

  return {
    user: {
      name: user?.name || session.user.name || "Karyawan",
      nip: user?.nip || "-"
    },
    summary: {
      totalCourses,
      completedCourses,
      totalTestsTaken,
      totalTestsPassed,
      averageScore
    },
    courseAnalysis,
    trendData,
    recentActivity
  };
}
