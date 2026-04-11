"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { notifyCourseEnrollment } from "@/lib/notifications";

async function notifyEnrolledUsers(userIds: string[], courseId: string) {
  try {
    const course = await db.course.findUnique({
      where: { id: courseId },
      select: { title: true },
    });
    if (!course) return;
    await notifyCourseEnrollment({
      userIds,
      courseId,
      courseTitle: course.title,
    });
  } catch {
    /* notifikasi best-effort */
  }
}

// ─── Enroll satu karyawan ke satu kursus ──────────────────────────────────
export async function enrollUser(userId: string, courseId: string) {
  try {
    const existing = await (db.enrollment as any).findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (existing) {
      return { success: false, error: "Karyawan sudah terdaftar di kursus ini." };
    }
    await (db.enrollment as any).create({
      data: { userId, courseId, status: "IN_PROGRESS" },
    });
    await notifyEnrolledUsers([userId], courseId);
    revalidatePath("/admin/enrollments");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message ?? "Terjadi kesalahan." };
  }
}

// ─── Enroll banyak karyawan sekaligus ──────────────────────────────────────
export async function enrollMultipleUsers(userIds: string[], courseId: string) {
  try {
    if (userIds.length === 0) return { success: false, error: "Tidak ada karyawan yang dipilih." };

    // Cek siapa yang sudah terdaftar
    const existingEnrollments = await (db.enrollment as any).findMany({
      where: { courseId, userId: { in: userIds } },
      select: { userId: true },
    });
    const enrolledIds = new Set(existingEnrollments.map((e: any) => e.userId));
    const toEnroll = userIds.filter((id) => !enrolledIds.has(id));

    if (toEnroll.length === 0) {
      return { success: false, error: "Semua karyawan yang dipilih sudah terdaftar." };
    }

    await (db.enrollment as any).createMany({
      data: toEnroll.map((userId) => ({
        userId,
        courseId,
        status: "IN_PROGRESS",
      })),
      skipDuplicates: true,
    });

    await notifyEnrolledUsers(toEnroll, courseId);
    revalidatePath("/admin/enrollments");
    return { 
      success: true, 
      count: toEnroll.length,
      skipped: enrolledIds.size
    };
  } catch (error: any) {
    return { success: false, error: error?.message ?? "Terjadi kesalahan pendaftaran masal." };
  }
}

// ─── Enroll massal per departemen ke satu kursus ──────────────────────────
export async function enrollDepartment(department: string, courseId: string) {
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
        status: "IN_PROGRESS",
      })),
      skipDuplicates: true,
    });

    await notifyEnrolledUsers(
      toEnroll.map((u: { id: string }) => u.id),
      courseId
    );
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
}// ─── Auto Enrollment Rules ────────────────────────────────────────────────
export async function createAutoEnrollRule(courseId: string, department: string, bypassDeadline: boolean) {
  try {
    await (db as any).autoEnrollmentRule.create({
      data: { courseId, department, bypassDeadline },
    });
    revalidatePath("/admin/enrollments");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message ?? "Gagal membuat aturan." };
  }
}

export async function deleteAutoEnrollRule(id: string) {
  try {
    await (db as any).autoEnrollmentRule.delete({ where: { id } });
    revalidatePath("/admin/enrollments");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message ?? "Gagal menghapus aturan." };
  }
}

// ─── Department Configs ───────────────────────────────────────────────────
export async function upsertDepartmentConfig(departmentName: string, headName: string, headEmail: string) {
  try {
    await (db as any).departmentConfig.upsert({
      where: { departmentName },
      update: { headName, headEmail },
      create: { departmentName, headName, headEmail },
    });
    revalidatePath("/admin/enrollments");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message ?? "Gagal menyimpan konfigurasi." };
  }
}

export async function deleteDepartmentConfig(id: string) {
  try {
    await (db as any).departmentConfig.delete({ where: { id } });
    revalidatePath("/admin/enrollments");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message ?? "Gagal menghapus konfigurasi." };
  }
}
