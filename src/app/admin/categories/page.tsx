import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { CategoriesClient } from "./_components/CategoriesClient";

export const metadata = {
  title: "Kelola Kategori | Admin",
  description: "Kelola kategori kursus",
};

export default async function CategoriesPage() {
  // Auth check - require admin role
  const session = await requireAdmin();
  if ("success" in session) {
    throw new Error(session.error);
  }

  const categories = await db.category.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { courses: true },
      },
    },
  });

  return <CategoriesClient categories={categories} />;
}
