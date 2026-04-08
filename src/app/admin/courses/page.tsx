import { db } from "@/lib/db";
import { CoursesClient } from "./_components/CoursesClient";

export const metadata = {
  title: "Katalog Kursus | Admin BNI Finance E-Learning",
};

export default async function CoursesPage() {
  const courses = await db.course.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      category: true,
      _count: {
        select: {
          modules: true,
          enrollments: true,
        },
      },
    },
  });

  return <CoursesClient courses={courses} />;
}
