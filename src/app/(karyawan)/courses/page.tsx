import { db } from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { CatalogClient } from "./_components/catalog-client";

export default async function CoursesPage() {
  const session = await auth();

  if (!session || !session.user?.id) {
    return redirect("/");
  }

  const userId = session.user.id;

  const courses = await db.course.findMany({
    where: { isPublished: true },
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
  });

  const categories = await db.category.findMany({
    orderBy: { name: "asc" }
  });

  return (
    <div className="min-h-full bg-slate-50 relative pb-20">
      {/* Decorative Glows */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-indigo-400/10 rounded-full blur-[120px] -translate-x-1/3 -translate-y-1/2 pointer-events-none" />
      <div className="absolute top-80 right-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="relative z-10 max-w-7xl mx-auto">
        <CatalogClient courses={courses} categories={categories} />
      </div>
    </div>
  );
}
