"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { deleteFileFromDisk } from "@/lib/utils/file.utils";
import { isAdmin } from "@/lib/auth-helpers";

/**
 * Server Action untuk menghapus kursus
 * @param courseId ID kursus yang akan dihapus
 */
export async function deleteCourse(courseId: string) {
  try {
    const session = await auth();

    // Proteksi Role using new multi-role system
    if (!isAdmin(session)) {
      console.error("[DELETE_COURSE] Unauthorized access attempt", {
        email: session?.user?.email,
        activeRole: session?.user?.activeRole,
        courseId,
      });
      return { success: false, error: "Tidak memiliki akses (Unauthorized)" };
    }

    // Check for active enrollments (Security: Prevent data loss)
    const activeEnrollments = await db.enrollment.count({
      where: { 
        courseId,
        status: { in: ["IN_PROGRESS", "PENDING"] }
      }
    });

    if (activeEnrollments > 0) {
      return { 
        success: false, 
        error: `Tidak dapat menghapus kursus. Masih ada ${activeEnrollments} enrollment aktif. Harap selesaikan atau batalkan enrollment tersebut terlebih dahulu.` 
      };
    }

    // Check for any enrollments with progress (Warning)
    const enrollmentsWithProgress = await db.enrollment.count({
      where: { courseId }
    });

    if (enrollmentsWithProgress > 0) {
      // Log this action for audit trail
      console.warn(`[DELETE_COURSE] Deleting course ${courseId} with ${enrollmentsWithProgress} historical enrollments`);
    }

    // 1. Temukan semua modul dalam kursus ini untuk membersihkan file fisik
    const modules = await db.module.findMany({
      where: { courseId }
    });

    // 2. Hapus file PDF dari disk jika ada
    for (const m of modules) {
      if (m.type === "PDF" && m.url) {
        try {
          await deleteFileFromDisk(m.url);
        } catch (fileError) {
          console.error(`[DELETE_COURSE_FILE_ERROR] ${m.url}:`, fileError);
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
    revalidatePath("/courses");         // Katalog user
    revalidatePath("/dashboard");       // Dashboard user
    return { success: true };
  } catch (error) {
    console.error("[DELETE_COURSE_ERROR]:", error);
    return { success: false, error: "Gagal menghapus kursus" };
  }
}
