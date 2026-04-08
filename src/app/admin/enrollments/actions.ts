"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

// ─── Enroll satu karyawan ke satu kursus ──────────────────────────────────
export async function enrollUser(userId: string, courseId: string, deadline?: Date | null) {
  try {
    const existing = await (db.enrollment as any).findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (existing) {
      return { success: false, error: "Karyawan sudah terdaftar di kursus ini." };
    }
    await (db.enrollment as any).create({
      data: { userId, courseId, deadline, status: "IN_PROGRESS" },
    });
    revalidatePath("/admin/enrollments");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message ?? "Terjadi kesalahan." };
  }
}

// ─── Enroll massal per departemen ke satu kursus ──────────────────────────
export async function enrollDepartment(department: string, courseId: string, deadline?: Date | null) {
  try {
    // Ambil semua user di departemen tersebut (role KARYAWAN)
    const users = await (db.user as any).findMany({
      where: { department, role: "KARYAWAN" },
      select: { id: true },
    });

    if (users.length === 0) {
      return { success: false, error: `Tidak ada karyawan di departemen "${department}".` };
    }

    // Cek siapa yang sudah terdaftar dan skip
    const existingEnrollments = await (db.enrollment as any).findMany({
      where: { courseId, userId: { in: users.map((u: any) => u.id) } },
      select: { userId: true },
    });
    const enrolledIds = new Set(existingEnrollments.map((e: any) => e.userId));

    const toEnroll = users.filter((u: any) => !enrolledIds.has(u.id));

    if (toEnroll.length === 0) {
      return {
        success: false,
        error: `Semua karyawan di departemen "${department}" sudah terdaftar.`,
      };
    }

    // Buat enrollment massal
    await (db.enrollment as any).createMany({
      data: toEnroll.map((u: any) => ({
        userId: u.id,
        courseId,
        deadline,
        status: "IN_PROGRESS",
      })),
      skipDuplicates: true,
    });

    revalidatePath("/admin/enrollments");
    return {
      success: true,
      count: toEnroll.length,
      skipped: enrolledIds.size,
    };
  } catch (error: any) {
    return { success: false, error: error?.message ?? "Terjadi kesalahan." };
  }
}

// ─── Hapus enrollment ──────────────────────────────────────────────────────
export async function unenrollUser(enrollmentId: string) {
  try {
    await db.enrollment.delete({ where: { id: enrollmentId } });
    revalidatePath("/admin/enrollments");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message ?? "Terjadi kesalahan." };
  }
}

// ─── Update deadline enrollment ─────────────────────────────────────────────
export async function updateEnrollmentDeadline(enrollmentId: string, deadline: Date | null) {
  try {
    await (db.enrollment as any).update({
      where: { id: enrollmentId },
      data: { deadline },
    });
    revalidatePath("/admin/enrollments");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message ?? "Terjadi kesalahan saat update deadline." };
  }
}
