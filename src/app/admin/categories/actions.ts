"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createCategory(name: string) {
  try {
    const existing = await db.category.findUnique({
      where: { name },
    });

    if (existing) {
      return { success: false, error: "Kategori dengan nama ini sudah ada" };
    }

    await db.category.create({
      data: { name },
    });

    revalidatePath("/admin/categories");
    return { success: true };
  } catch (error) {
    console.error("Error creating category:", error);
    return { success: false, error: "Gagal membuat kategori" };
  }
}

export async function updateCategory(id: string, name: string) {
  try {
    const existing = await db.category.findFirst({
      where: {
        name,
        NOT: { id },
      },
    });

    if (existing) {
      return { success: false, error: "Kategori dengan nama ini sudah ada" };
    }

    await db.category.update({
      where: { id },
      data: { name },
    });

    revalidatePath("/admin/categories");
    revalidatePath("/admin/courses");
    return { success: true };
  } catch (error) {
    console.error("Error updating category:", error);
    return { success: false, error: "Gagal mengupdate kategori" };
  }
}

export async function deleteCategory(id: string) {
  try {
    // Check if category has courses
    const category = await db.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { courses: true },
        },
      },
    });

    if (!category) {
      return { success: false, error: "Kategori tidak ditemukan" };
    }

    if (category._count.courses > 0) {
      return {
        success: false,
        error: `Tidak dapat menghapus kategori yang memiliki ${category._count.courses} kursus`,
      };
    }

    await db.category.delete({
      where: { id },
    });

    revalidatePath("/admin/categories");
    return { success: true };
  } catch (error) {
    console.error("Error deleting category:", error);
    return { success: false, error: "Gagal menghapus kategori" };
  }
}
