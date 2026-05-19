"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

import { db } from "@/lib/db";
import { notifyCourseEnrollment } from "@/lib/notifications";
import { sendEnrollmentNotification } from "@/lib/notifications/enrollment";
import { createEnrollment, batchCreateEnrollments } from "@/lib/enrollment";
import { requireAdmin } from "@/lib/auth-helpers";

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
    const session = await requireAdmin();
    if (!session || "success" in session) return session;

    const existing = await db.enrollment.findUnique({
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
    const session = await requireAdmin();
    if (!session || "success" in session) return session;

    if (userIds.length === 0) return { success: false, error: "Tidak ada karyawan yang dipilih." };

    // Cek siapa yang sudah terdaftar
    const existingEnrollments = await db.enrollment.findMany({
      where: { courseId, userId: { in: userIds } },
      select: { userId: true },
    });
    const enrolledIds = new Set(existingEnrollments.map((e) => e.userId));
    const toEnroll = userIds.filter((id) => !enrolledIds.has(id));

    if (toEnroll.length === 0) {
      return { success: false, error: "Semua karyawan yang dipilih sudah terdaftar." };
    }

    // Use transaction to ensure atomicity
    const result = await db.$transaction(async (tx) => {
      // Get course deadline info
      const course = await tx.course.findUnique({
        where: { id: courseId },
        select: { deadlineDuration: true, deadlineDate: true }
      });

      const now = new Date();
      const enrollments = toEnroll.map((userId) => {
        let deadline = null;
        if (course?.deadlineDate) {
          deadline = course.deadlineDate;
        } else if (course?.deadlineDuration) {
          deadline = new Date(now.getTime() + course.deadlineDuration * 24 * 60 * 60 * 1000);
        }

        return {
          userId,
          courseId,
          source: "BULK" as const,
          status: "IN_PROGRESS" as const,
          deadline,
          createdAt: now,
          updatedAt: now,
        };
      });

      // Create all enrollments atomically
      await tx.enrollment.createMany({
        data: enrollments,
        skipDuplicates: true,
      });

      return { count: toEnroll.length };
    });

    // Send notifications after successful transaction
    await notifyEnrolledUsers(toEnroll, courseId);
    
    revalidatePath("/admin/enrollments");
    return { 
      success: true, 
      count: result.count,
      skipped: enrolledIds.size
    };
  } catch (error: any) {
    console.error("[ENROLL_MULTIPLE_USERS]", error);
    return { success: false, error: error?.message ?? "Terjadi kesalahan pendaftaran masal." };
  }
}

// ─── Enroll massal per departemen ke satu kursus ──────────────────────────
export async function enrollDepartment(department: string, courseId: string) {
  try {
    const session = await requireAdmin();
    if (!session || "success" in session) return session;

    // Ambil semua user di departemen tersebut (role KARYAWAN)
    const users = await db.user.findMany({
      where: { department, roles: { has: "KARYAWAN" } },
      select: { id: true },
    });

    if (users.length === 0) {
      return { success: false, error: `Tidak ada karyawan di departemen "${department}".` };
    }

    // Cek siapa yang sudah terdaftar dan skip
    const existingEnrollments = await db.enrollment.findMany({
      where: { courseId, userId: { in: users.map((u) => u.id) } },
      select: { userId: true },
    });
    const enrolledIds = new Set(existingEnrollments.map((e) => e.userId));

    const toEnroll = users.filter((u) => !enrolledIds.has(u.id));

    if (toEnroll.length === 0) {
      return {
        success: false,
        error: `Semua karyawan di departemen "${department}" sudah terdaftar.`,
      };
    }

    // Use transaction to ensure atomicity
    const result = await db.$transaction(async (tx) => {
      // Get course deadline info
      const course = await tx.course.findUnique({
        where: { id: courseId },
        select: { deadlineDuration: true, deadlineDate: true }
      });

      const now = new Date();
      const enrollments = toEnroll.map((user) => {
        let deadline = null;
        if (course?.deadlineDate) {
          deadline = course.deadlineDate;
        } else if (course?.deadlineDuration) {
          deadline = new Date(now.getTime() + course.deadlineDuration * 24 * 60 * 60 * 1000);
        }

        return {
          userId: user.id,
          courseId,
          source: "BULK" as const,
          status: "IN_PROGRESS" as const,
          deadline,
          createdAt: now,
          updatedAt: now,
        };
      });

      // Create all enrollments atomically
      await tx.enrollment.createMany({
        data: enrollments,
        skipDuplicates: true,
      });

      return { count: toEnroll.length };
    });

    // Send notifications after successful transaction
    await notifyEnrolledUsers(
      toEnroll.map((u: { id: string }) => u.id),
      courseId
    );
    
    revalidatePath("/admin/enrollments");
    return {
      success: true,
      count: result.count,
      skipped: enrolledIds.size,
    };
  } catch (error: any) {
    console.error("[ENROLL_DEPARTMENT]", error);
    return { success: false, error: error?.message ?? "Terjadi kesalahan." };
  }
}

// ─── Hapus enrollment ──────────────────────────────────────────────────────
export async function unenrollUser(enrollmentId: string) {
  try {
    const session = await requireAdmin();
    if (!session || "success" in session) return session;

    await db.enrollment.delete({ where: { id: enrollmentId } });
    revalidatePath("/admin/enrollments");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message ?? "Terjadi kesalahan." };
  }
}

// ─── Approval System: Setujui Pendaftaran ──────────────────────────────────
export async function approveEnrollment(enrollmentId: string) {
  const session = await requireAdmin();
  if (!session || "success" in session) return session;

  try {
    console.log("[APPROVE_ENROLLMENT] Starting approval for:", enrollmentId);
    
    const enrollment = await db.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        user: { select: { email: true, name: true } },
        course: { select: { title: true } },
      },
    });

    if (!enrollment) {
      console.error("[APPROVE_ENROLLMENT] Enrollment not found:", enrollmentId);
      return { success: false, error: "Enrollment tidak ditemukan." };
    }
    
    console.log("[APPROVE_ENROLLMENT] Current status:", enrollment.status);
    
    if (enrollment.status !== "PENDING") {
      return { success: false, error: "Hanya pendaftaran PENDING yang bisa disetujui." };
    }

    // Guard: Admin tidak boleh approve diri sendiri (Logic Hardening)
    if (enrollment.userId === session.user.id) {
      return { success: false, error: "Anda tidak dapat menyetujui pendaftaran Anda sendiri." };
    }

    console.log("[APPROVE_ENROLLMENT] Updating enrollment to IN_PROGRESS");
    
    await db.enrollment.update({
      where: { id: enrollmentId },
      data: {
        status: "IN_PROGRESS",
        approvedById: session.user.id,
        approvedAt: new Date(),
      },
    });

    console.log("[APPROVE_ENROLLMENT] Enrollment updated successfully");

    // ─── In-App Notification ────────────────────────────────────────────
    try {
      console.log("[APPROVE_ENROLLMENT] Creating in-app notification");
      await db.notification.create({
        data: {
          userId: enrollment.userId,
          type: "ENROLLMENT",
          title: "Pendaftaran Kursus Disetujui",
          body: `Selamat! Pendaftaran Anda untuk kursus "${enrollment.course.title}" telah disetujui. Anda dapat mulai belajar sekarang.`,
          href: `/courses/${enrollment.courseId}`,
        },
      });
      console.log("[APPROVE_ENROLLMENT] In-app notification created successfully");
    } catch (notifErr: any) {
      console.error("[APPROVE_ENROLLMENT] Failed to create in-app notification:", notifErr);
    }

    // Email Notifikasi (Isolated try/catch with database logging)
    if (enrollment.user.email) {
      try {
        console.log("[APPROVE_ENROLLMENT] Sending approval email to:", enrollment.user.email);
        await sendEnrollmentNotification({
          to: enrollment.user.email,
          employeeName: enrollment.user.name ?? "Karyawan",
          courseName: enrollment.course.title,
          type: "APPROVED",
        });
        console.log("[APPROVE_ENROLLMENT] Email sent successfully");
      } catch (err: any) {
        console.error("[APPROVE_ENROLLMENT] Failed to send email:", err);
        
        // Log email failure to database for admin visibility
        await db.schedulerLog.create({
          data: {
            jobName: "EMAIL_NOTIFICATION",
            status: "FAILED",
            message: `Failed to send approval email to ${enrollment.user.email} for course "${enrollment.course.title}": ${err.message}`,
            duration: 0,
            failedRecipients: { email: enrollment.user.email, reason: err.message }
          }
        }).catch(logErr => {
          // Fallback: at least log to console if DB insert fails
          console.error("[APPROVE_ENROLLMENT] Failed to log email error to database:", logErr);
        });
      }
    }

    console.log("[APPROVE_ENROLLMENT] Revalidating paths");
    revalidatePath("/admin/enrollments");
    revalidatePath("/courses", "layout");
    
    console.log("[APPROVE_ENROLLMENT] Approval completed successfully");
    return { success: true };
  } catch (error: any) {
    console.error("[APPROVE_ENROLLMENT] Error:", error);
    return { success: false, error: error.message };
  }
}

// ─── Approval System: Tolak Pendaftaran ────────────────────────────────────
export async function rejectEnrollment(enrollmentId: string, note: string) {
  const session = await requireAdmin();
  if (!session || "success" in session) return session;

  try {
    console.log("[REJECT_ENROLLMENT] Starting rejection for:", enrollmentId);
    
    const enrollment = await db.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        user: { select: { email: true, name: true } },
        course: { select: { title: true } },
      },
    });

    if (!enrollment) {
      console.error("[REJECT_ENROLLMENT] Enrollment not found:", enrollmentId);
      return { success: false, error: "Enrollment tidak ditemukan." };
    }
    
    console.log("[REJECT_ENROLLMENT] Current status:", enrollment.status);
    
    if (enrollment.status !== "PENDING") {
      return { success: false, error: "Hanya pendaftaran PENDING yang bisa ditolak." };
    }

    // Guard: Admin tidak boleh reject enrollment diri sendiri (Security Hardening)
    if (enrollment.userId === session.user.id) {
      return { success: false, error: "Anda tidak dapat menolak pendaftaran Anda sendiri." };
    }

    console.log("[REJECT_ENROLLMENT] Updating enrollment to REJECTED with note:", note);
    
    await db.enrollment.update({
      where: { id: enrollmentId },
      data: {
        status: "REJECTED",
        rejectionNote: note,
        approvedById: session.user.id,
        approvedAt: new Date(),
      },
    });

    console.log("[REJECT_ENROLLMENT] Enrollment rejected successfully");

    // ─── In-App Notification ────────────────────────────────────────────
    try {
      console.log("[REJECT_ENROLLMENT] Creating in-app notification");
      await db.notification.create({
        data: {
          userId: enrollment.userId,
          type: "ENROLLMENT",
          title: "Pendaftaran Kursus Ditolak",
          body: `Pendaftaran Anda untuk kursus "${enrollment.course.title}" telah ditolak. Alasan: ${note}`,
          href: "/courses",
        },
      });
      console.log("[REJECT_ENROLLMENT] In-app notification created successfully");
    } catch (notifErr: any) {
      console.error("[REJECT_ENROLLMENT] Failed to create in-app notification:", notifErr);
    }

    // Email Notifikasi (Isolated try/catch with database logging)
    if (enrollment.user.email) {
      try {
        console.log("[REJECT_ENROLLMENT] Sending rejection email to:", enrollment.user.email);
        await sendEnrollmentNotification({
          to: enrollment.user.email,
          employeeName: enrollment.user.name ?? "Karyawan",
          courseName: enrollment.course.title,
          type: "REJECTED",
          rejectionNote: note,
        });
        console.log("[REJECT_ENROLLMENT] Email sent successfully");
      } catch (err: any) {
        console.error("[REJECT_ENROLLMENT] Failed to send email:", err);
        
        // Log email failure to database for admin visibility
        await db.schedulerLog.create({
          data: {
            jobName: "EMAIL_NOTIFICATION",
            status: "FAILED",
            message: `Failed to send rejection email to ${enrollment.user.email} for course "${enrollment.course.title}": ${err.message}`,
            duration: 0,
            failedRecipients: { email: enrollment.user.email, reason: err.message }
          }
        }).catch(logErr => {
          // Fallback: at least log to console if DB insert fails
          console.error("[REJECT_ENROLLMENT] Failed to log email error to database:", logErr);
        });
      }
    }

    console.log("[REJECT_ENROLLMENT] Revalidating paths");
    revalidatePath("/admin/enrollments");
    revalidatePath("/courses", "layout");
    
    console.log("[REJECT_ENROLLMENT] Rejection completed successfully");
    return { success: true };
  } catch (error: any) {
    console.error("[REJECT_ENROLLMENT] Error:", error);
    return { success: false, error: error.message };
  }
}
// ─── Auto Enrollment Rules ────────────────────────────────────────────────
export async function createAutoEnrollRule(courseId: string, department: string, bypassDeadline: boolean) {
  try {
    const session = await requireAdmin();
    if (!session || "success" in session) return session;

    await db.autoEnrollmentRule.create({
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
    const session = await requireAdmin();
    if (!session || "success" in session) return session;

    await db.autoEnrollmentRule.delete({ where: { id } });
    revalidatePath("/admin/enrollments");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message ?? "Gagal menghapus aturan." };
  }
}

// ─── Department Configs ───────────────────────────────────────────────────
export async function upsertDepartmentConfig(departmentName: string, headName: string, headEmail: string) {
  try {
    const session = await requireAdmin();
    if (!session || "success" in session) return session;

    await db.departmentConfig.upsert({
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
    const session = await requireAdmin();
    if (!session || "success" in session) return session;

    await db.departmentConfig.delete({ where: { id } });
    revalidatePath("/admin/enrollments");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message ?? "Gagal menghapus konfigurasi." };
  }
}

// ─── Manual Poke (Tier 5) ──────────────────────────────────────────────────
import { sendEmailWithAttachment } from "@/lib/email";

const POKE_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 jam cooldown

export async function pokeParticipant(enrollmentId: string, customNote?: string) {
  const session = await requireAdmin();
  if (!session || "success" in session) {
    throw new Error("Unauthorized");
  }

  const adminId = session.user.id;
  const adminName = session.user.name ?? "Admin";
  const startTime = Date.now();

  try {
    // 1. Fetch enrollment
    const enrollment = await db.enrollment.findUnique({
      where: { id: enrollmentId },
    });

    // 2. Validasi enrollment exists
    if (!enrollment) {
      return { success: false, error: "Enrollment tidak ditemukan." };
    }

    // 3. Fetch user data
    const user = await db.user.findUnique({
      where: { id: enrollment.userId },
      select: { id: true, name: true, email: true }
    });

    if (!user) {
      return { success: false, error: "User tidak ditemukan." };
    }

    if (!user.email) {
      return { success: false, error: "User tidak memiliki email." };
    }

    // 4. Fetch course data dengan modules
    const course = await db.course.findUnique({
      where: { id: enrollment.courseId },
      select: { id: true, title: true, modules: { select: { id: true } } }
    });

    if (!course) {
      return { success: false, error: "Kursus tidak ditemukan." };
    }

    // 5. Validasi status enrollment (hanya boleh colekan yang aktif)
    const allowedStatuses = ["IN_PROGRESS", "PENDING", "NOT_STARTED"];
    if (!allowedStatuses.includes(enrollment.status)) {
      const statusLabels: Record<string, string> = {
        COMPLETED: "sudah selesai",
        REJECTED: "ditolak",
        EXPIRED: "kedaluwarsa"
      };
      return { 
        success: false, 
        error: `Tidak dapat mengirim colekan. Enrollment ${statusLabels[enrollment.status] ?? "tidak aktif"}.` 
      };
    }

    // 6. Rate limiting: cek colekan terakhir ke user ini untuk course ini
    const lastPoke = await db.schedulerLog.findFirst({
      where: { 
        jobName: "MANUAL_POKE",
        status: "SUCCESS",
        message: {
          contains: `userId:${user.id}|courseId:${course.id}` // Structured message format
        },
        createdAt: { gte: new Date(Date.now() - POKE_COOLDOWN_MS) }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (lastPoke) {
      const hoursSinceLastPoke = Math.floor((Date.now() - lastPoke.createdAt.getTime()) / (60 * 60 * 1000));
      const hoursRemaining = 24 - hoursSinceLastPoke;
      return { 
        success: false, 
        error: `Colekan terakhir dikirim ${hoursSinceLastPoke} jam yang lalu. Tunggu ${hoursRemaining} jam lagi untuk mengirim colekan ke user ini.` 
      };
    }

    // 7. Cek de-duplikasi notifikasi serupa yang belum dibaca
    const existingNotification = await db.notification.findFirst({
      where: {
        userId: user.id,
        type: "SYSTEM",
        title: { contains: "Colekan" },
        readAt: null,
        createdAt: { gte: new Date(Date.now() - POKE_COOLDOWN_MS) }
      }
    });

    if (existingNotification) {
      return { 
        success: false, 
        error: "User masih memiliki colekan yang belum dibaca." 
      };
    }

    // 8. Hitung progress untuk konteks email
    const totalModules = course.modules.length;
    const completedModules = await db.userProgress.count({
      where: { 
        userId: user.id,
        module: { courseId: course.id },
        isCompleted: true
      }
    });
    const progressPercent = totalModules > 0 
      ? Math.round((completedModules / totalModules) * 100) 
      : 0;

    const courseLink = `${process.env.NEXTAUTH_URL}/courses/${course.id}`;

    // 9. Create System Notification dengan link spesifik
    await db.notification.create({
      data: {
        userId: user.id,
        type: "SYSTEM",
        title: "Colekan Admin: Selesaikan Pelatihan",
        body: customNote 
          ? `${customNote} (Progress: ${progressPercent}%)`
          : `Admin meminta Anda segera menyelesaikan pelatihan "${course.title}". Progress saat ini: ${progressPercent}%`,
        href: `/courses/${course.id}`,
      },
    });

    // 10. Send Email dengan template yang lebih informatif
    const customNoteHtml = customNote 
      ? `<p style="background-color: #fef3c7; padding: 12px; border-left: 4px solid #f59e0b; margin: 16px 0;"><strong>Catatan dari Admin:</strong> ${customNote}</p>`
      : '';

    await sendEmailWithAttachment({
      to: user.email,
      subject: `[Mendesak] Tindak Lanjut Pelatihan: ${course.title}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #0F1C3F 0%, #1A3060 100%); padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #E8A020; margin: 0; font-size: 24px; font-weight: bold;">📢 Colekan Admin</h1>
            <p style="color: #94a3b8; margin: 8px 0 0 0; font-size: 14px;">Dikirim oleh ${adminName}</p>
          </div>
          <div style="padding: 24px; border: 1px solid #e2e8f0; border-top: none; background-color: #ffffff;">
            <p style="font-size: 16px; margin-bottom: 16px;">Halo <strong>${user.name}</strong>,</p>
            <p style="line-height: 1.6;">
              Admin Learning & Development memberikan "colekan" terkait pelatihan 
              <strong style="color: #0F1C3F;">"${course.title}"</strong>.
            </p>
            
            ${customNoteHtml}
            
            <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #64748b;">Progress Anda Saat Ini:</p>
              <div style="background-color: #e2e8f0; height: 8px; border-radius: 4px; overflow: hidden;">
                <div style="background: linear-gradient(90deg, #0F1C3F, #E8A020); height: 100%; width: ${progressPercent}%; border-radius: 4px;"></div>
              </div>
              <p style="margin: 8px 0 0 0; font-weight: bold; color: #0F1C3F;">${progressPercent}% (${completedModules}/${totalModules} modul)</p>
            </div>
            
            <p style="line-height: 1.6;">Mohon segera login dan tuntaskan materi yang tersisa.</p>
            
            <div style="text-align: center; margin: 28px 0;">
              <a href="${courseLink}" style="background: linear-gradient(135deg, #0F1C3F, #1A3060); color: #fff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px rgba(15,28,63,0.2);">
                Lanjutkan Pelatihan →
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="font-size: 12px; color: #64748b; text-align: center;">
              Pesan ini dikirim secara manual oleh Administrator melalui BNI Finance E-Learning System.<br/>
              Enrollment ID: ${enrollment.id}
            </p>
          </div>
        </div>
      `,
    });

    // 11. Log dengan detail admin dan structured format
    const logMessage = `userId:${user.id}|courseId:${course.id}|adminId:${adminId}|adminName:${adminName}|userEmail:${user.email}|userName:${user.name}|courseTitle:${course.title}|progress:${progressPercent}%`;
    await db.schedulerLog.create({
      data: {
        jobName: "MANUAL_POKE",
        status: "SUCCESS",
        message: logMessage,
        duration: Date.now() - startTime,
      }
    });

    return { 
      success: true, 
      data: {
        userName: user.name,
        courseTitle: course.title,
        progressPercent
      }
    };

  } catch (error: any) {
    // Log failure dengan detail
    await db.schedulerLog.create({
      data: {
        jobName: "MANUAL_POKE",
        status: "FAILED",
        message: `Gagal mengirim poke oleh ${adminName}: ${error.message}`,
        duration: Date.now() - startTime,
      }
    });

    return { success: false, error: error.message };
  }
}
