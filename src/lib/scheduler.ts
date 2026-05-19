import { db } from "@/lib/db";
import { notifyCourseEnrollment } from "@/lib/notifications";
import { sendEmailWithAttachment } from "@/lib/email";
import { batchCreateEnrollments } from "@/lib/enrollment";
import ExcelJS from "exceljs";
import { toZonedTime } from "date-fns-tz";
import { 
  createWorkbook, 
  styleTitle, 
  styleSubtitle, 
  styleHeaderRow, 
  applyDataRow, 
  applyStatusCell,
  finalizeSheet,
  BRAND 
} from "@/lib/excel-template";

// CRITICAL FIX #1: Use WIB timezone explicitly
const TIMEZONE = "Asia/Jakarta";

/**
 * ─── AUTO ENROLLMENT ENGINE ────────────────────────────────────────────────
 */
export async function runAutoEnrollment() {
  const start = Date.now();
  const results = {
    rulesProcessed: 0,
    totalEnrolled: 0,
    errors: [] as string[],
  };

  try {
    const rules = await db.autoEnrollmentRule.findMany({
      where: { isActive: true },
      include: { 
        course: { 
          select: { 
            id: true,
            title: true, 
            deadlineDuration: true 
          } 
        } 
      },
    });

    for (const rule of rules) {
      try {
        results.rulesProcessed++;

        const usersToEnroll = await db.user.findMany({
          where: {
            department: rule.department,
            roles: { has: "KARYAWAN" },
            enrollments: {
              none: {
                courseId: rule.courseId,
              },
            },
          },
          select: { id: true },
        });

        if (usersToEnroll.length === 0) continue;

        const chunkSize = 500;
        for (let i = 0; i < usersToEnroll.length; i += chunkSize) {
          const chunk = usersToEnroll.slice(i, i + chunkSize);

          const { count } = await batchCreateEnrollments({
            userIds: chunk.map((u) => u.id),
            courseId: rule.courseId,
            source: "AUTO",
          });

          const userIds = chunk.map((u) => u.id);
          notifyCourseEnrollment({
            userIds,
            courseId: rule.courseId,
            courseTitle: rule.course.title,
          }).catch((err) => console.error("Notification Error:", err));

          results.totalEnrolled += count;
        }
      } catch (err: any) {
        const msg = `Error processing rule ${rule.id}: ${err.message}`;
        console.error(msg);
        results.errors.push(msg);
      }
    }
  } catch (err: any) {
    results.errors.push(`General error: ${err.message}`);
  }

  // Audit Log
  await db.schedulerLog.create({
    data: {
      jobName: "AUTO_ENROLL",
      status: results.errors.length === 0 ? "SUCCESS" : "FAILED",
      message: `${results.rulesProcessed} rules diproses. ${results.totalEnrolled} karyawan didaftarkan.${results.errors.length > 0 ? ` Errors: ${results.errors.join("; ")}` : ""}`,
      duration: Date.now() - start,
    },
  });

  return results;
}

/**
 * ─── PROACTIVE REMINDERS ENGINE ─────────────────────────────────────────────
 * Sends reminders to users H-7, H-3, and H-1 before deadline.
 * CRITICAL FIX #1: Uses WIB timezone for accurate date calculations
 */
export async function runProactiveReminders() {
  const start = Date.now();
  
  // CRITICAL FIX #1: Get current date in WIB timezone
  const nowWIB = toZonedTime(new Date(), TIMEZONE);
  const todayWIB = new Date(nowWIB);
  todayWIB.setHours(0, 0, 0, 0);

  const results = {
    sent7d: 0,
    sent3d: 0,
    sent1d: 0,
    errors: [] as string[],
  };

  const getTargetDate = (days: number) => {
    const d = new Date(todayWIB);
    d.setDate(d.getDate() + days);
    return d;
  };

  const reminderConfigs = [
    { days: 1, field: "remindedAt1d", label: "Terakhir (H-1)", resultsKey: "sent1d" as const },
    { days: 3, field: "remindedAt3d", label: "Mendesak (H-3)", resultsKey: "sent3d" as const },
    { days: 7, field: "remindedAt7d", label: "Pekan Terakhir (H-7)", resultsKey: "sent7d" as const },
  ];

  // CRITICAL FIX #4: Process in batches for better performance
  const BATCH_SIZE = 50;

  for (const config of reminderConfigs) {
    try {
      const targetDate = getTargetDate(config.days);
      const targetDateEnd = new Date(targetDate);
      targetDateEnd.setHours(23, 59, 59, 999);

      const toRemind = await db.enrollment.findMany({
        where: {
          deadline: { gte: targetDate, lte: targetDateEnd },
          status: "IN_PROGRESS",
          [config.field]: null,
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          course: { select: { title: true } },
        },
      });

      // CRITICAL FIX #4: Process in batches
      for (let i = 0; i < toRemind.length; i += BATCH_SIZE) {
        const batch = toRemind.slice(i, i + BATCH_SIZE);
        
        await Promise.all(batch.map(async (e) => {
        let emailSent = false;
        let notificationCreated = false;

        try {
          // 1. Create System Notification (Bell Icon) - FIRST and INDEPENDENT
          try {
            await db.notification.create({
              data: {
                userId: e.user.id,
                type: "REMINDER",
                title: `Peringatan Deadline ${config.label}`,
                body: `Selesaikan pelatihan "${e.course.title}" dalam ${config.days} hari lagi.`,
                href: `/courses`,
              },
            });
            notificationCreated = true;
          } catch (notifErr: any) {
            console.error(`Failed to create system notification for ${e.user.email}:`, notifErr.message);
          }

          // 2. Send Email
          try {
            await sendEmailWithAttachment({
              to: e.user.email || "",
              subject: `[Reminder] Pelatihan: ${e.course.title} (${config.label})`,
              html: `
                <div style="font-family: sans-serif; color: #0F1C3F;">
                  <div style="background-color: #0F1C3F; padding: 20px; text-align: center;">
                    <h1 style="color: #E8A020; margin: 0;">Peringatan Tenggat Waktu</h1>
                  </div>
                  <div style="padding: 20px; border: 1px solid #e2e8f0;">
                    <p>Halo <b>${e.user.name}</b>,</p>
                    <p>Kami mengingatkan bahwa pelatihan <b>"${e.course.title}"</b> harus segera diselesaikan dalam <b>${config.days} hari</b> lagi.</p>
                    <div style="padding: 15px; background-color: #f8fafc; border-radius: 8px; margin: 20px 0;">
                      <p style="margin: 0;"><b>Tenggat Waktu:</b> ${e.deadline ? new Date(e.deadline).toLocaleDateString("id-ID", { dateStyle: "long" }) : "—"}</p>
                    </div>
                    <p>Segera selesaikan materi dan ujian untuk menghindari eskalasi ke Department Head.</p>
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${process.env.NEXTAUTH_URL}/courses" style="background-color: #0F1C3F; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Ke Dashboard Pelatihan</a>
                    </div>
                    <hr />
                    <p style="font-size: 12px; color: #64748b;">Pesan ini dikirim secara otomatis oleh E-Learning BNI Finance System.</p>
                  </div>
                </div>
              `,
            });
            emailSent = true;
          } catch (emailErr: any) {
            console.error(`Email delivery failed for ${e.user.email}: ${emailErr.message}`);
            
            // CRITICAL FIX #3: Log failed email to retry queue
            await db.schedulerLog.create({
              data: {
                jobName: "email-retry-queue",
                status: "PENDING",
                message: `Failed to send ${config.label} reminder to ${e.user.email}`,
                metadata: {
                  enrollmentId: e.id,
                  userId: e.user.id,
                  userEmail: e.user.email,
                  reminderType: config.field,
                  reminderDays: config.days,
                  courseTitle: e.course.title,
                  error: emailErr.message,
                  timestamp: new Date().toISOString()
                }
              }
            }).catch(logErr => {
              console.error(`Failed to log retry queue:`, logErr);
            });
          }

          // 3. CRITICAL FIX #3: Only mark as reminded if at least one succeeded
          if (emailSent || notificationCreated) {
            await db.enrollment.update({
              where: { id: e.id },
              data: { [config.field]: new Date() },
            });
            results[config.resultsKey]++;
          } else {
            // Both failed - log critical error
            console.error(`CRITICAL: Both email and notification failed for enrollment ${e.id}`);
          }
        } catch (err: any) {
          console.error(`Critical error processing reminder for ${e.user.email}:`, err.message);
        }
      }));
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (err: any) {
      results.errors.push(`Error in ${config.label}: ${err.message}`);
    }
  }

  // Audit Log
  await db.schedulerLog.create({
    data: {
      jobName: "proactive-reminders",
      status: results.errors.length === 0 ? "SUCCESS" : "PARTIAL_ERROR",
      message: `${results.sent7d} H-7, ${results.sent3d} H-3, ${results.sent1d} H-1 reminders sent.`,
      duration: Date.now() - start,
    },
  });

  return results;
}

/**
 * ─── MARK EXPIRED ENROLLMENTS AS FAILED ─────────────────────────────────────
 * Core logic: jika enrollment sudah melewati deadline dan belum COMPLETED,
 * maka status otomatis berubah menjadi FAILED.
 * Dipanggil dari deadline monitoring dan dari server actions halaman.
 */
export async function markExpiredEnrollmentsAsFailed(): Promise<{
  marked: number;
  enrollmentIds: string[];
}> {
  const nowWIB = toZonedTime(new Date(), TIMEZONE);
  const todayWIB = new Date(nowWIB);
  todayWIB.setHours(0, 0, 0, 0);

  // Cari semua enrollment yang deadline-nya sudah lewat
  // dan statusnya masih IN_PROGRESS (bukan COMPLETED, FAILED, REJECTED, PENDING)
  const expiredEnrollments = await db.enrollment.findMany({
    where: {
      deadline: { lt: todayWIB },
      status: { in: ["IN_PROGRESS"] },
    },
    select: { id: true, userId: true, courseId: true, deadline: true },
  });

  if (expiredEnrollments.length === 0) {
    return { marked: 0, enrollmentIds: [] };
  }

  const enrollmentIds = expiredEnrollments.map((e) => e.id);

  // Update semua enrollment yang expired ke FAILED secara atomic
  await db.enrollment.updateMany({
    where: { id: { in: enrollmentIds } },
    data: { status: "FAILED" },
  });

  // Buat notifikasi untuk setiap user
  const notificationData = expiredEnrollments.map((e) => ({
    userId: e.userId,
    type: "SYSTEM" as const,
    title: "Kursus Gagal - Deadline Terlewati",
    body: `Anda tidak menyelesaikan kursus dalam batas waktu yang ditentukan. Status kursus Anda telah diubah menjadi Gagal.`,
    href: `/courses`,
  }));

  // Batch create notifications
  await db.notification.createMany({
    data: notificationData,
    skipDuplicates: true,
  });

  console.log(
    `[DEADLINE] Marked ${expiredEnrollments.length} expired enrollments as FAILED.`
  );

  return { marked: expiredEnrollments.length, enrollmentIds };
}

/**
 * ─── DEADLINE MONITORING ENGINE ─────────────────────────────────────────────
 * CRITICAL FIX #1: Uses WIB timezone for accurate date calculations
 */

async function generateDeadlineReport(enrollments: any[]) {
  const workbook = createWorkbook();
  const sheet = workbook.addWorksheet("Laporan Deadline");

  // Define columns
  sheet.columns = [
    { header: "NO", key: "no", width: 6 },
    { header: "NIP", key: "nip", width: 16 },
    { header: "NAMA KARYAWAN", key: "name", width: 35 },
    { header: "EMAIL", key: "email", width: 32 },
    { header: "STATUS", key: "status", width: 16 },
    { header: "DEADLINE", key: "deadline", width: 18 },
    { header: "TANGGAL DAFTAR", key: "createdAt", width: 18 },
  ];

  // Title row
  styleTitle(sheet, 1, "Laporan Karyawan Melewati Deadline", 7);
  
  // Subtitle row
  styleSubtitle(sheet, 2, 7, `Total: ${enrollments.length} karyawan`);

  // Header row
  styleHeaderRow(sheet, 3);

  // Data rows
  enrollments.forEach((e, idx) => {
    const row = sheet.addRow({
      no: idx + 1,
      nip: e.user.nip || "-",
      name: e.user.name,
      email: e.user.email,
      status: e.status === "COMPLETED" ? "SELESAI" : "PROSES",
      deadline: e.deadline ? new Date(e.deadline).toLocaleDateString("id-ID") : "-",
      createdAt: new Date(e.createdAt).toLocaleDateString("id-ID"),
    });
    
    applyDataRow(row, idx);
    
    // Center align for specific columns
    row.getCell("no").alignment = { horizontal: "center", vertical: "middle" };
    row.getCell("nip").alignment = { horizontal: "center", vertical: "middle" };
    row.getCell("deadline").alignment = { horizontal: "center", vertical: "middle" };
    row.getCell("createdAt").alignment = { horizontal: "center", vertical: "middle" };
    
    // Apply status styling
    const statusCell = row.getCell("status");
    if (e.status === "COMPLETED") {
      statusCell.value = "Selesai";
      statusCell.font = { bold: true, size: 10, color: { argb: BRAND.STATUS_COMPLETED_FG } };
      statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND.STATUS_COMPLETED_BG } };
    } else {
      statusCell.value = "Proses";
      statusCell.font = { bold: true, size: 10, color: { argb: BRAND.STATUS_PROGRESS_FG } };
      statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND.STATUS_PROGRESS_BG } };
    }
    statusCell.alignment = { horizontal: "center", vertical: "middle" };
  });

  // Finalize sheet
  finalizeSheet(sheet, 7, 3);

  return await workbook.xlsx.writeBuffer() as unknown as Buffer;
}

export async function runDeadlineMonitoring() {
  const start = Date.now();
  
  // ── STEP 1: Tandai semua enrollment yang expired sebagai FAILED ──────────
  // Ini adalah langkah utama: ubah status IN_PROGRESS → FAILED untuk semua
  // enrollment yang sudah melewati deadline.
  const failedResult = await markExpiredEnrollmentsAsFailed();
  console.log(`[DEADLINE] Marked ${failedResult.marked} enrollments as FAILED.`);

  // CRITICAL FIX #1: Get today at midnight in WIB timezone
  const nowWIB = toZonedTime(new Date(), TIMEZONE);
  const todayWIB = new Date(nowWIB);
  todayWIB.setHours(0, 0, 0, 0);

  // CRITICAL FIX #2: Use transaction with atomic update to prevent race condition
  // This ensures only ONE scheduler instance processes each enrollment
  const expiredEnrollments = await db.$transaction(async (tx) => {
    // Find enrollments that need reporting (now including FAILED status)
    const enrollments = await tx.enrollment.findMany({
      where: {
        deadline: { lt: todayWIB },
        reportedAt: null,
        status: { notIn: ["COMPLETED", "PENDING", "REJECTED"] },
      },
      include: {
        user: { select: { name: true, email: true, department: true, nip: true } },
        course: { select: { id: true, title: true } },
      },
    });

    // Immediately mark as being processed (atomic operation)
    // This prevents other scheduler instances from picking up the same enrollments
    if (enrollments.length > 0) {
      const enrollmentIds = enrollments.map(e => e.id);
      await tx.enrollment.updateMany({
        where: { id: { in: enrollmentIds } },
        data: { 
          reportedAt: new Date(), // Mark immediately to claim ownership
        },
      });
    }

    return enrollments;
  });

  if (expiredEnrollments.length === 0) {
    await db.schedulerLog.create({
      data: {
        jobName: "deadline-monitoring",
        status: "SUCCESS",
        message: "Tidak ada enrollment tertunggak yang perlu dilaporkan.",
        duration: Date.now() - start,
      }
    });
    return { status: "SUCCESS", message: "Tidak ada enrollment tertunggak yang perlu dilaporkan." };
  }

  // Group by courseId + department
  const grouped = new Map<string, any[]>();
  for (const e of expiredEnrollments) {
    const key = `${e.courseId}__${e.user.department}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(e);
  }

  let sentCount = 0;
  const failedRecipients: string[] = [];
  const successfulEnrollmentIds: string[] = [];

  for (const [key, enrollments] of Array.from(grouped.entries())) {
    try {
      const [_, department] = key.split("__");
      const courseTitle = enrollments[0].course.title;

      const deptConfig = await db.departmentConfig.findUnique({
        where: { departmentName: department },
      });

      const excelBuffer = await generateDeadlineReport(enrollments);
      const recipient = deptConfig?.headEmail || process.env.ADMIN_EMAIL;

      if (!recipient) {
        console.error(`Skipping ${key}: No headEmail or ADMIN_EMAIL defined.`);
        failedRecipients.push(key);
        continue;
      }

      await sendEmailWithAttachment({
        to: recipient,
        cc: process.env.ADMIN_EMAIL,
        subject: `[BNI Finance] Laporan Deadline: ${courseTitle}`,
        html: `
          <div style="font-family: sans-serif; color: #0F1C3F;">
            <h2 style="color: #0F1C3F;">Laporan Deadline Terlewati</h2>
            <p>Halo, berikut adalah daftar karyawan di departemen <b>${department}</b> yang belum menyelesaikan kursus <b>"${courseTitle}"</b> hingga batas waktu deadline kemarin.</p>
            <p>Silakan tinjau file Excel terlampir untuk detail lengkapnya.</p>
            <hr />
            <p style="font-size: 12px; color: #64748b;">Pesan ini dikirim secara otomatis oleh E-Learning BNI Finance System.</p>
          </div>
        `,
        attachments: [{
          filename: `Laporan_Deadline_${department}.xlsx`,
          content: excelBuffer,
          contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }],
      });

      // Mark as escalated only after successful email send
      const enrollmentIds = enrollments.map(e => e.id);
      await db.enrollment.updateMany({
        where: { id: { in: enrollmentIds } },
        data: { 
          escalatedAt: new Date(), // Only set escalatedAt after email sent
        },
      });

      successfulEnrollmentIds.push(...enrollmentIds);
      sentCount++;
      
      // Sequential delay to avoid overwhelming SMTP
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (err: any) {
      console.error(`Failed to send report for ${key}:`, err.message);
      failedRecipients.push(key);
      
      // Rollback reportedAt for failed sends so they can be retried
      const enrollmentIds = enrollments.map(e => e.id);
      await db.enrollment.updateMany({
        where: { id: { in: enrollmentIds } },
        data: { reportedAt: null }, // Reset so it can be retried
      }).catch(rollbackErr => {
        console.error(`Failed to rollback reportedAt for ${key}:`, rollbackErr);
      });
    }
  }

  // Logging to SchedulerLog
  await db.schedulerLog.create({
    data: {
      jobName: "deadline-monitoring",
      status: failedRecipients.length === 0 ? "SUCCESS" : "PARTIAL_FAILURE",
      message: `${failedResult.marked} enrollment ditandai GAGAL. ${sentCount} laporan terkirim. ${failedRecipients.length} gagal.`,
      duration: Date.now() - start,
      failedRecipients: failedRecipients,
    }
  });

  return { 
    status: failedRecipients.length === 0 ? "SUCCESS" : "PARTIAL_FAILURE",
    markedAsFailed: failedResult.marked,
    sent: sentCount,
    failed: failedRecipients.length,
    successfulEnrollments: successfulEnrollmentIds.length
  };
}

/**
 * ─── ORPHANED TEST SESSIONS CLEANUP ─────────────────────────────────────────
 * Cleans up sessions where the user closed the tab without submitting
 */
export async function cleanupOrphanedTestSessions() {
  const start = Date.now();

  // Find ongoing sessions
  const ongoingSessions = await db.testSession.findMany({
    where: { status: "ONGOING" },
    include: {
      enrollment: {
        select: {
          id: true,
          courseId: true,
          status: true,
        }
      }
    }
  });

  let forceSubmitted = 0;
  let enrollmentsMarkedFailed = 0;

  for (const session of ongoingSessions) {
    const test = await db.test.findUnique({
      where: { id: session.testId },
      select: { duration: true, type: true, passingScore: true }
    });

    if (!test) continue;

    const durationMs = test.duration * 60 * 1000;
    // Add 5 minutes buffer
    const bufferMs = 5 * 60 * 1000;
    const expiryTime = new Date(session.startedAt.getTime() + durationMs + bufferMs);

    if (new Date() > expiryTime) {
      // Force submit
      try {
        const attemptNumber = session.attemptNumber;

        // First create the TestAttempt (without answers relation)
        const testAttempt = await db.testAttempt.create({
          data: {
            userId: session.userId,
            testId: session.testId,
            enrollmentId: session.enrollmentId ?? undefined,
            attemptNumber: attemptNumber,
            score: 0,
            passed: false,
            status: "FORCE_SUBMITTED",
            startedAt: session.startedAt,
            completedAt: new Date(),
            timeSpent: Math.floor((Date.now() - session.startedAt.getTime()) / 1000),
          },
        });

        // Copy any saved answers from TestAnswer table to the new attempt
        // (user might have auto-saved some answers before closing)
        const savedAnswers = await db.testAnswer.findMany({
          where: {
            testAttempt: {
              userId: session.userId,
              testId: session.testId,
              status: "ONGOING",
            }
          },
        });

        // Link saved answers to the force-submitted attempt
        if (savedAnswers.length > 0) {
          await db.testAnswer.updateMany({
            where: {
              id: { in: savedAnswers.map(a => a.id) }
            },
            data: {
              testAttemptId: testAttempt.id,
            },
          });

          // Recalculate score based on saved answers
          const correctCount = savedAnswers.filter(a => a.isCorrect).length;
          const totalQuestions = savedAnswers.length;
          const score = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
          const passingScore = test.passingScore ?? 70;

          await db.testAttempt.update({
            where: { id: testAttempt.id },
            data: {
              score,
              passed: score >= passingScore,
            },
          });
        }

        // Update test session
        await db.testSession.update({
          where: { id: session.id },
          data: {
            status: "FORCE_SUBMITTED",
            submittedAt: new Date(),
            score: 0,
          }
        });

        // If this was a post-test and not passed, mark enrollment as FAILED
        if (
          session.enrollmentId &&
          session.enrollment &&
          test.type === "POST" &&
          !testAttempt.passed
        ) {
          await db.enrollment.update({
            where: { id: session.enrollmentId },
            data: { status: "FAILED" },
          });
          enrollmentsMarkedFailed++;
        }

        forceSubmitted++;
      } catch (err) {
        console.error("Failed to cleanup session", session.id, err);
      }
    }
  }

  await db.schedulerLog.create({
    data: {
      jobName: "orphan-session-cleanup",
      status: "SUCCESS",
      message: `Cleaned up ${forceSubmitted} orphaned test sessions. ${enrollmentsMarkedFailed} enrollments marked FAILED.`,
      duration: Date.now() - start,
      metadata: {
        cleaned: forceSubmitted,
        enrollmentsFailed: enrollmentsMarkedFailed,
      },
    }
  });

  return { cleaned: forceSubmitted, enrollmentsFailed: enrollmentsMarkedFailed };
}

/**
 * ─── DEPARTMENT REPORTS ENGINE ──────────────────────────────────────────────
 */

export async function generateDepartmentExcel(departmentName: string) {
  const workbook = createWorkbook();

  // Ambil semua aturan (rules) untuk departemen ini guna menentukan kursus wajib (template)
  const rules = await db.autoEnrollmentRule.findMany({
    where: { department: departmentName, isActive: true },
    include: { course: { select: { id: true, title: true } } },
  });

  // Ambil semua enrollment untuk departemen ini
  const enrollments = await db.enrollment.findMany({
    where: {
      user: { department: departmentName },
    },
    include: {
      user: { select: { name: true, nip: true, email: true } },
      course: { select: { id: true, title: true } },
    },
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SHEET 1: RINGKASAN DEPARTEMEN
  // ═══════════════════════════════════════════════════════════════════════════
  const summarySheet = workbook.addWorksheet("📊 Ringkasan");
  
  // Title
  styleTitle(summarySheet, 1, `Laporan Progres Pembelajaran - ${departmentName}`, 6);
  
  // Subtitle
  const uniqueUsers = new Set(enrollments.map((e: any) => e.userId)).size;
  styleSubtitle(summarySheet, 2, 6, `${rules.length} Kursus Wajib • ${uniqueUsers} Karyawan`);

  // Info section
  summarySheet.addRow([]);
  summarySheet.addRow(['Departemen:', departmentName]);
  summarySheet.addRow(['Total Kursus Wajib:', rules.length]);
  summarySheet.addRow(['Total Karyawan Terdaftar:', uniqueUsers]);
  summarySheet.addRow([]);

  // Styling info rows
  for (let i = 4; i <= 6; i++) {
    const row = summarySheet.getRow(i);
    row.getCell(1).font = { bold: true, size: 10, color: { argb: BRAND.NAVY } };
    row.getCell(2).font = { size: 10, color: { argb: "FF64748B" } };
  }

  // Statistik per Kursus header
  summarySheet.addRow([]);
  const statsLabelRow = summarySheet.addRow(['STATISTIK PER KURSUS']);
  summarySheet.mergeCells(statsLabelRow.number, 1, statsLabelRow.number, 6);
  const statsLabelCell = summarySheet.getCell(statsLabelRow.number, 1);
  statsLabelCell.font = { bold: true, size: 12, color: { argb: BRAND.NAVY } };
  statsLabelCell.alignment = { horizontal: "left", vertical: "middle" };
  
  summarySheet.addRow([]);
  
  // Define columns for stats table
  summarySheet.columns = [
    { header: 'No', key: 'no', width: 6 },
    { header: 'Nama Kursus', key: 'courseName', width: 45 },
    { header: 'Total Terdaftar', key: 'total', width: 16 },
    { header: 'Selesai', key: 'completed', width: 12 },
    { header: 'Dalam Proses', key: 'inProgress', width: 16 },
    { header: '% Completion', key: 'completionRate', width: 16 },
  ];
  
  // Stats header row
  styleHeaderRow(summarySheet, 10);

  // Group enrollments by course
  const courseStats = new Map<string, { courseId: string, courseTitle: string, total: number, completed: number, inProgress: number }>();
  
  for (const e of enrollments) {
    const key = e.courseId;
    if (!courseStats.has(key)) {
      courseStats.set(key, {
        courseId: e.courseId,
        courseTitle: e.course.title,
        total: 0,
        completed: 0,
        inProgress: 0
      });
    }
    const stats = courseStats.get(key)!;
    stats.total++;
    if (e.status === 'COMPLETED') stats.completed++;
    else if (e.status === 'IN_PROGRESS') stats.inProgress++;
  }

  let rowNum = 1;
  for (const [_, stats] of Array.from(courseStats)) {
    const completionRate = stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(1) : '0.0';
    const row = summarySheet.addRow({
      no: rowNum++,
      courseName: stats.courseTitle,
      total: stats.total,
      completed: stats.completed,
      inProgress: stats.inProgress,
      completionRate: `${completionRate}%`
    });
    
    applyDataRow(row, rowNum - 2);
    
    // Center align
    row.getCell('no').alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell('total').alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell('completed').alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell('inProgress').alignment = { horizontal: 'center', vertical: 'middle' };
    
    // Conditional formatting for completion rate
    const rateCell = row.getCell('completionRate');
    rateCell.alignment = { horizontal: 'center', vertical: 'middle' };
    const rate = parseFloat(completionRate);
    if (rate >= 80) {
      rateCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.STATUS_COMPLETED_BG } };
      rateCell.font = { bold: true, size: 10, color: { argb: BRAND.STATUS_COMPLETED_FG } };
    } else if (rate >= 50) {
      rateCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.STATUS_PENDING_BG } };
      rateCell.font = { bold: true, size: 10, color: { argb: BRAND.STATUS_PENDING_FG } };
    } else {
      rateCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.STATUS_FAILED_BG } };
      rateCell.font = { bold: true, size: 10, color: { argb: BRAND.STATUS_FAILED_FG } };
    }
  }

  // Finalize summary sheet
  finalizeSheet(summarySheet, 6, 10);

  // ═══════════════════════════════════════════════════════════════════════════
  // SHEET 2-N: DETAIL PER KURSUS
  // ═══════════════════════════════════════════════════════════════════════════
  for (const [_, stats] of Array.from(courseStats)) {
    const courseEnrollments = enrollments.filter(e => e.courseId === stats.courseId);
    
    // Sanitize sheet name (max 31 chars, no special chars)
    let sheetName = stats.courseTitle.substring(0, 28);
    sheetName = sheetName.replace(/[:\\/?*\[\]]/g, '');
    
    const courseSheet = workbook.addWorksheet(sheetName);
    
    // Define columns
    courseSheet.columns = [
      { header: 'No', key: 'no', width: 6 },
      { header: 'NIP', key: 'nip', width: 16 },
      { header: 'Nama Karyawan', key: 'name', width: 32 },
      { header: 'Email', key: 'email', width: 32 },
      { header: 'Status', key: 'status', width: 16 },
      { header: 'Progress (%)', key: 'progress', width: 14 },
      { header: 'Deadline', key: 'deadline', width: 16 },
      { header: 'Tanggal Selesai', key: 'completedAt', width: 18 },
    ];

    // Title
    styleTitle(courseSheet, 1, stats.courseTitle, 8);
    
    // Subtitle
    styleSubtitle(courseSheet, 2, 8, `${courseEnrollments.length} Peserta`);

    // Header row
    styleHeaderRow(courseSheet, 3);

    // Data rows
    courseEnrollments.forEach((e, idx) => {
      const progressValue = e.status === 'COMPLETED' ? 100 : 0;
      
      const row = courseSheet.addRow({
        no: idx + 1,
        nip: e.user.nip || '-',
        name: e.user.name,
        email: e.user.email,
        status: '', // Will be styled separately
        progress: progressValue,
        deadline: e.deadline ? new Date(e.deadline).toLocaleDateString('id-ID') : '-',
        completedAt: e.status === 'COMPLETED' && e.updatedAt ? new Date(e.updatedAt).toLocaleDateString('id-ID') : '-'
      });

      applyDataRow(row, idx);
      
      // Center align
      row.getCell('no').alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell('nip').alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell('progress').alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell('deadline').alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell('completedAt').alignment = { horizontal: 'center', vertical: 'middle' };

      // Status styling
      applyStatusCell(row.getCell('status'), e.status);

      // Progress bar styling
      const progressCell = row.getCell('progress');
      if (progressValue >= 80) {
        progressCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.STATUS_COMPLETED_BG } };
        progressCell.font = { bold: true, size: 10, color: { argb: BRAND.STATUS_COMPLETED_FG } };
      } else if (progressValue >= 50) {
        progressCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.STATUS_PENDING_BG } };
        progressCell.font = { bold: true, size: 10, color: { argb: BRAND.STATUS_PENDING_FG } };
      } else {
        progressCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.STATUS_FAILED_BG } };
        progressCell.font = { bold: true, size: 10, color: { argb: BRAND.STATUS_FAILED_FG } };
      }
    });

    // Finalize course sheet
    finalizeSheet(courseSheet, 8, 3);
  }

  return workbook;
}

export async function runDepartmentalReports() {
  const start = Date.now();
  const configs = await db.departmentConfig.findMany({
    where: { isActive: true },
  });

  const results = {
    departmentsProcessed: 0,
    emailsSent: 0,
    errors: [] as string[],
    failedRecipients: [] as string[],
  };

  for (const config of configs) {
    try {
      results.departmentsProcessed++;
      const workbook = await generateDepartmentExcel(config.departmentName);
      const buffer = await workbook.xlsx.writeBuffer() as unknown as Buffer;

      await sendEmailWithAttachment({
        to: config.headEmail,
        cc: process.env.ADMIN_EMAIL,
        subject: `[BNI Finance] Laporan Progres Bulanan: ${config.departmentName}`,
        html: `
          <div style="font-family: sans-serif; color: #0F1C3F;">
            <h2 style="color: #0F1C3F;">Laporan Progres Departemen</h2>
            <p>Halo <b>${config.headName}</b>, terlampir laporan progres pembelajaran karyawan untuk departemen ${config.departmentName}.</p>
            <hr />
            <p style="font-size: 12px; color: #64748b;">Pesan ini dikirim secara otomatis oleh E-Learning BNI Finance System.</p>
          </div>
        `,
        attachments: [{
          filename: `Laporan_Bulanan_${config.departmentName}.xlsx`,
          content: buffer,
          contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }],
      });
      
      results.emailsSent++;
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (err: any) {
      const msg = `Error sending report for ${config.departmentName}: ${err.message}`;
      console.error(msg);
      results.errors.push(msg);
      results.failedRecipients.push(config.departmentName);
    }
  }

  await db.schedulerLog.create({
    data: {
      jobName: "departmental-reports",
      status: results.failedRecipients.length === 0 ? "SUCCESS" : "FAILED",
      message: `${results.emailsSent} laporan terkirim. ${results.failedRecipients.length} gagal.`,
      duration: Date.now() - start,
      failedRecipients: results.failedRecipients,
    }
  });

  return results;
}
