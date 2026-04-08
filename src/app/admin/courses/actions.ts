"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { deleteFileFromDisk } from "@/lib/utils/file.utils";

/**
 * Server Action untuk menghapus kursus
 * @param courseId ID kursus yang akan dihapus
 */
export async function deleteCourse(courseId: string) {
  try {
    const session = await auth();

    // Proteksi Role
    if (!session || session.user?.role !== "ADMIN") {
      return { success: false, error: "Tidak memiliki akses (Unauthorized)" };
    }

    // 1. Temukan semua modul dalam kursus ini untuk membersihkan file fisik
    const modules = await db.module.findMany({
      where: { courseId }
    });

    // 2. Hapus file PDF dari disk jika ada
    for (const module of modules) {
      if (module.type === "PDF" && module.url) {
        try {
          await deleteFileFromDisk(module.url);
        } catch (fileError) {
          console.error(`[DELETE_COURSE_FILE_ERROR] ${module.url}:`, fileError);
          // Kita lanjutkan penghapusan DB meskipun file gagal dihapus
        }
      }
    }

    // 3. Hapus kursus dari database
    // Catatan: Karena schema menggunakan onDelete: Cascade, modul dan data terkait akan ikut terhapus otomatis di DB.
    await db.course.delete({
      where: { id: courseId }
    });

    revalidatePath("/admin/courses");
    return { success: true };
  } catch (error) {
    console.error("[DELETE_COURSE_ERROR]:", error);
    return { success: false, error: "Gagal menghapus kursus" };
  }
}
