import { db } from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { CatalogClient } from "./_components/catalog-client";

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: { search?: string; category?: string; difficulty?: string; page?: string };
}) {
  const session = await auth();

  if (!session || !session.user?.id) {
    return redirect("/");
  }

  const userId = session.user.id;

  const search = searchParams.search || "";
  const categoryId = searchParams.category && searchParams.category !== "all" ? searchParams.category : undefined;
  const difficultyLevels = searchParams.difficulty ? searchParams.difficulty.split(",").filter(Boolean) : [];
  const page = parseInt(searchParams.page || "1", 10);
  const itemsPerPage = 9;
  
  const whereClause: any = {
    AND: [
      { isPublished: true },
      { 
        OR: [
          { isVisible: true },
          { enrollments: { some: { userId } } }
        ]
      }
    ]
  };

  if (search) {
    whereClause.title = { contains: search, mode: "insensitive" };
  }

  if (categoryId) {
    whereClause.categoryId = categoryId;
  }

  if (difficultyLevels.length > 0) {
    whereClause.difficulty = { in: difficultyLevels };
  }

  const totalCourses = await db.course.count({ where: whereClause });
  const totalPages = Math.ceil(totalCourses / itemsPerPage);

  const courses = await db.course.findMany({
    where: whereClause,
    include: {
      category: true,
      _count: {
        select: {
          modules: true,
          enrollments: true,
        }
      },
      enrollments: {
        where: { userId }
      }
    },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * itemsPerPage,
    take: itemsPerPage,
  });

  // Calculate counts for categories for sidebar
  const allCoursesForCounts = await db.course.findMany({
    where: {
      AND: [
        { isPublished: true },
        { 
          OR: [
            { isVisible: true },
            { enrollments: { some: { userId } } }
          ]
        }
      ]
    },
    select: { categoryId: true }
  });

  const totalAllCourses = allCoursesForCounts.length;
  
  const categoryCounts: Record<string, number> = {};
  for (const c of allCoursesForCounts) {
    if (c.categoryId) {
      categoryCounts[c.categoryId] = (categoryCounts[c.categoryId] || 0) + 1;
    }
  }

  const categories = await db.category.findMany({
    orderBy: { name: "asc" }
  });

  return (
    <div className="min-h-full bg-slate-50 pb-20">
      <CatalogClient 
        courses={courses} 
        categories={categories} 
        categoryCounts={categoryCounts}
        totalAllCourses={totalAllCourses}
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalCourses}
      />
    </div>
  );
}
