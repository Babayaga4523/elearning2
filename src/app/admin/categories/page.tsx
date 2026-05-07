import { db } from "@/lib/db";
import { CategoriesClient } from "./_components/CategoriesClient";

export const metadata = {
  title: "Kelola Kategori | Admin",
  description: "Kelola kategori kursus",
};

export default async function CategoriesPage() {
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
