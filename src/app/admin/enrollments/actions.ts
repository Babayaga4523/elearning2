"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { notifyCourseEnrollment } from "@/lib/notifications";
import { createEnrollment, batchCreateEnrollments } from "@/lib/enrollment";

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
    await createEnrollment({
      userId,
      courseId,
      source: "MANUAL",
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

    const { count } = await batchCreateEnrollments({
      userIds: toEnroll,
      courseId,
      source: "BULK",
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
    const { count } = await batchCreateEnrollments({
      userIds: toEnroll.map((u: any) => (u as any).id),
      courseId,
      source: "BULK",
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

// ─── Manual Poke (Tier 5) ──────────────────────────────────────────────────
import { sendEmailWithAttachment } from "@/lib/email";

export async function pokeParticipant(enrollmentId: string) {
  const session = await auth();
  if (!session || session.user?.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const startTime = Date.now();
  try {
    const enrollment = await db.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        course: { select: { title: true } },
      },
    });

    if (!enrollment) return { success: false, error: "Enrollment tidak ditemukan." };
    if (!enrollment.user.email) return { success: false, error: "User tidak memiliki email." };

    // 1. Create System Notification
    await (db as any).notification.create({
      data: {
        userId: enrollment.user.id,
        type: "SYSTEM",
        title: "Colekan Admin: Selesaikan Pelatihan",
        body: `Admin meminta Anda segera menyelesaikan pelatihan "${enrollment.course.title}".`,
        href: `/courses`,
      },
    });

    // 2. Send Email
    await sendEmailWithAttachment({
      to: enrollment.user.email,
      subject: `[Mendesak] Tindak Lanjut Pelatihan: ${enrollment.course.title}`,
      html: `
        <div style="font-family: sans-serif; color: #0F1C3F;">
          <div style="background-color: #0F1C3F; padding: 20px; text-align: center;">
            <h1 style="color: #E8A020; margin: 0;">Colekan Admin</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #e2e8f0;">
            <p>Halo <b>${enrollment.user.name}</b>,</p>
            <p>Admin Learning & Development baru saja memberikan "colekan" manual terkait pelatihan <b>"${enrollment.course.title}"</b>.</p>
            <p>Kami melihat Anda belum menyelesaikan pelatihan ini. Mohon segera login dan tuntaskan materi sebelum batas waktu berakhir.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL}/courses" style="background-color: #0F1C3F; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Login ke E-Learning</a>
            </div>
            <hr />
            <p style="font-size: 12px; color: #64748b;">Pesan ini dikirim secara manual oleh Administrator melalui BNI Finance E-Learning System.</p>
          </div>
        </div>
      `,
    });

    // 3. Log the manual action (Tier 6 requirement)
    await (db as any).schedulerLog.create({
      data: {
        jobName: "MANUAL_POKE",
        status: "SUCCESS",
        message: `Poke manual dikirim ke ${enrollment.user.email} (${enrollment.user.name}) untuk kursus ${enrollment.course.title}`,
        duration: Date.now() - startTime,
      }
    });

    return { success: true };
  } catch (error: any) {
    // Log the failure
    await (db as any).schedulerLog.create({
      data: {
        jobName: "MANUAL_POKE",
        status: "FAILED",
        message: `Gagal mengirim poke: ${error.message}`,
        duration: Date.now() - startTime,
      }
    });

    return { success: false, error: error.message };
  }
}
import { auth } from "@/auth";
