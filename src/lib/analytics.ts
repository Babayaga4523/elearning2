import { db } from "@/lib/db";
import { EnrollmentStatus, TestType } from "@prisma/client";

export async function getAdminAnalytics() {
  // Fetch all enrollments with related data
  // We'll use this to calculate metrics without multiple DB roundtrips for every count
  const enrollments = await db.enrollment.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          department: true,
        }
      },
      course: {
        select: {
          id: true,
          title: true,
          modules: {
            where: { isPublished: true },
            select: { id: true }
          }
        }
      },
    },
  });

  // Fetch all test attempts for these enrollments to calculate scores
  // Mapping attempts to users and courses
  const testAttempts = await db.testAttempt.findMany({
    include: {
      test: {
        select: {
          type: true,
          courseId: true,
        }
      }
    }
  });

  // Fetch published courses for statistics
  const courses = await db.course.findMany({
    where: { isPublished: true },
    include: {
      _count: {
        select: {
          modules: { where: { isPublished: true } },
          enrollments: true,
        }
      }
    },
    orderBy: {
      enrollments: {
        _count: "desc"
      }
    },
    take: 5,
  });

  // High-level metrics
  const totalEnrollments = enrollments.length;
  const completedEnrollments = enrollments.filter(e => e.status === EnrollmentStatus.COMPLETED).length;
  const failedEnrollments = enrollments.filter(e => e.status === EnrollmentStatus.FAILED).length;
  const finishedTasks = completedEnrollments + failedEnrollments;
  
  const completionRate = totalEnrollments > 0 
    ? Math.round((finishedTasks / totalEnrollments) * 100) 
    : 0;
    
  const passRate = finishedTasks > 0
    ? Math.round((completedEnrollments / finishedTasks) * 100)
    : 0;

  // Average Score (Post Tests)
  const postTestScores = testAttempts
    .filter(a => a.test.type === TestType.POST)
    .map(a => a.score);
  
  const avgScore = postTestScores.length > 0
    ? Math.round(postTestScores.reduce((a, b) => a + b, 0) / postTestScores.length)
    : 0;

  // Course Stats for Bar Chart
  const courseStats = await Promise.all(courses.map(async (course) => {
    const courseEnrollments = enrollments.filter(e => e.courseId === course.id);
    const lulus = courseEnrollments.filter(e => e.status === EnrollmentStatus.COMPLETED).length;
    const gagal = courseEnrollments.filter(e => e.status === EnrollmentStatus.FAILED).length;
    const proses = courseEnrollments.filter(e => e.status === EnrollmentStatus.IN_PROGRESS).length;
    
    const finished = lulus + gagal;
    const coursePassRate = finished > 0 ? Math.round((lulus / finished) * 100) : 0;

    return {
      title: course.title,
      lulus,
      gagal,
      proses,
      total: courseEnrollments.length,
      passRate: coursePassRate,
    };
  }));

  // Recent Activity (mapped from enrollments and test attempts)
  const recentActivity = enrollments
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 10)
    .map(e => {
      // Find the latest post test attempt for this user/course if any
      const postTest = testAttempts.find(a => 
        a.userId === e.userId && 
        a.test.courseId === e.courseId && 
        a.test.type === TestType.POST
      );

      return {
        name: e.user.name || "Anonymous",
        course: e.course.title,
        status: e.status,
        score: postTest ? postTest.score : null,
      };
    });

  return {
    metrics: {
      totalKaryawan: await db.user.count({ where: { role: "KARYAWAN" } }),
      totalCourse: await db.course.count({ where: { isPublished: true } }),
      completionRate,
      passRate,
      avgScore,
    },
    donut: {
      lulus: completedEnrollments,
      gagal: failedEnrollments,
      proses: totalEnrollments - finishedTasks,
    },
    courseStats,
    recentActivity,
  };
}
