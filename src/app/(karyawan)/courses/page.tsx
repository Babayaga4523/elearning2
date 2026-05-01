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
    where: {
      AND: [
        { isPublished: true },
        { 
          OR: [
            { isVisible: true },
            { 
              enrollments: { 
                some: { 
                  userId
                } 
              } 
            }
          ]
        }
      ]
    },
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
    <div className="min-h-full bg-slate-50 pb-20">
      <CatalogClient courses={courses} categories={categories} />
    </div>
  );
}
