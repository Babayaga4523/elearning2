import { db } from "@/lib/db";
export const dynamic = "force-dynamic";
import { CoursesClient } from "./_components/CoursesClient";

export const metadata = {
  title: "Katalog Kursus | Admin BNI Finance E-Learning",
};

export default async function CoursesPage() {
  // Optimize: Fetch courses and enrollment counts separately, then join in memory
  const [courses, enrollmentCounts] = await Promise.all([
    db.course.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        category: true,
        _count: {
          select: {
            modules: true,
          },
        },
      },
    }),
    // Separate query for enrollment counts to avoid N+1
    db.enrollment.groupBy({
      by: ["courseId"],
      where: { 
        status: { notIn: ["REJECTED", "PENDING"] }
      },
      _count: { courseId: true },
    }),
  ]);

  // Create a map for O(1) lookup
  const enrollmentCountMap = new Map(
    enrollmentCounts.map(e => [e.courseId, e._count.courseId])
  );

  // Enrich courses with enrollment counts
  const enrichedCourses = courses.map(course => ({
    ...course,
    _count: {
      ...course._count,
      enrollments: enrollmentCountMap.get(course.id) ?? 0,
    },
  }));

  return <CoursesClient courses={enrichedCourses} />;
}
