import { db } from "@/lib/db";
import { notifyCourseEnrollment } from "@/lib/notifications";
import { sendEmailWithAttachment } from "@/lib/email";
import { batchCreateEnrollments } from "@/lib/enrollment";
import ExcelJS from "exceljs";
import { toZonedTime } from "date-fns-tz";

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
 * ─── DEADLINE MONITORING ENGINE ─────────────────────────────────────────────
 * CRITICAL FIX #1: Uses WIB timezone for accurate date calculations
 */

async function generateDeadlineReport(enrollments: any[]) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Laporan Deadline");

  sheet.columns = [
    { header: "NO", key: "no", width: 5 },
    { header: "NIP", key: "nip", width: 15 },
    { header: "NAMA KARYAWAN", key: "name", width: 35 },
    { header: "EMAIL", key: "email", width: 30 },
    { header: "STATUS", key: "status", width: 15 },
    { header: "DEADLINE", key: "deadline", width: 20 },
    { header: "TANGGAL DAFTAR", key: "createdAt", width: 20 },
  ];

  // Header Styling
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0F1C3F" },
  };

  enrollments.forEach((e, idx) => {
    sheet.addRow({
      no: idx + 1,
      nip: e.user.nip,
      name: e.user.name,
      email: e.user.email,
      status: e.status === "COMPLETED" ? "SELESAI" : "PROSES",
      deadline: e.deadline ? new Date(e.deadline).toLocaleDateString("id-ID") : "-",
      createdAt: new Date(e.createdAt).toLocaleDateString("id-ID"),
    });
  });

  return await workbook.xlsx.writeBuffer() as unknown as Buffer;
}

export async function runDeadlineMonitoring() {
  const start = Date.now();
  
  // CRITICAL FIX #1: Get today at midnight in WIB timezone
  const nowWIB = toZonedTime(new Date(), TIMEZONE);
  const todayWIB = new Date(nowWIB);
  todayWIB.setHours(0, 0, 0, 0);

  // CRITICAL FIX #2: Use transaction with atomic update to prevent race condition
  // This ensures only ONE scheduler instance processes each enrollment
  const expiredEnrollments = await db.$transaction(async (tx) => {
    // Find enrollments that need reporting
    const enrollments = await tx.enrollment.findMany({
      where: {
        deadline: { lt: todayWIB },
        reportedAt: null,
        status: { notIn: ["COMPLETED", "CHEATING"] },
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
      message: `${sentCount} laporan terkirim. ${failedRecipients.length} gagal.`,
      duration: Date.now() - start,
      failedRecipients: failedRecipients,
    }
  });

  return { 
    status: failedRecipients.length === 0 ? "SUCCESS" : "PARTIAL_FAILURE",
    sent: sentCount,
    failed: failedRecipients.length,
    successfulEnrollments: successfulEnrollmentIds.length
  };
}

/**
 * ─── DEPARTMENT REPORTS ENGINE ──────────────────────────────────────────────
 */

export async function generateDepartmentExcel(departmentName: string) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "BNI Finance E-Learning System";
  workbook.lastModifiedBy = "Automated Scheduler";
  workbook.created = new Date();

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
  
  // Header dengan styling
  summarySheet.mergeCells('A1:D1');
  const titleCell = summarySheet.getCell('A1');
  titleCell.value = `LAPORAN PROGRES PEMBELAJARAN - ${departmentName.toUpperCase()}`;
  titleCell.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0F1C3F' }
  };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  summarySheet.getRow(1).height = 30;

  // Info Laporan
  summarySheet.addRow([]);
  summarySheet.addRow(['Tanggal Generate:', new Date().toLocaleString("id-ID", { dateStyle: 'full', timeStyle: 'short' })]);
  summarySheet.addRow(['Departemen:', departmentName]);
  summarySheet.addRow(['Total Kursus Wajib:', rules.length]);
  summarySheet.addRow(['Total Karyawan Terdaftar:', new Set(enrollments.map((e: any) => e.userId)).size]);
  summarySheet.addRow([]);

  // Styling info rows
  for (let i = 3; i <= 6; i++) {
    summarySheet.getCell(`A${i}`).font = { bold: true, color: { argb: 'FF0F1C3F' } };
    summarySheet.getCell(`B${i}`).font = { color: { argb: 'FF64748B' } };
  }

  // Statistik per Kursus
  summarySheet.addRow(['STATISTIK PER KURSUS']).font = { bold: true, size: 12, color: { argb: 'FF0F1C3F' } };
  summarySheet.addRow([]);
  
  const statsHeaderRow = summarySheet.addRow(['No', 'Nama Kursus', 'Total Terdaftar', 'Selesai', 'Dalam Proses', '% Completion']);
  statsHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  statsHeaderRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0F1C3F' }
  };
  statsHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' };

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
    const row = summarySheet.addRow([
      rowNum++,
      stats.courseTitle,
      stats.total,
      stats.completed,
      stats.inProgress,
      `${completionRate}%`
    ]);
    
    // Conditional formatting for completion rate
    const rateCell = row.getCell(6);
    const rate = parseFloat(completionRate);
    if (rate >= 80) {
      rateCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } };
      rateCell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    } else if (rate >= 50) {
      rateCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF59E0B' } };
      rateCell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    } else {
      rateCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEF4444' } };
      rateCell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    }
  }

  // Set column widths
  summarySheet.getColumn(1).width = 5;
  summarySheet.getColumn(2).width = 40;
  summarySheet.getColumn(3).width = 15;
  summarySheet.getColumn(4).width = 12;
  summarySheet.getColumn(5).width = 15;
  summarySheet.getColumn(6).width = 15;

  // ═══════════════════════════════════════════════════════════════════════════
  // SHEET 2-N: DETAIL PER KURSUS
  // ═══════════════════════════════════════════════════════════════════════════
  for (const [_, stats] of Array.from(courseStats)) {
    const courseEnrollments = enrollments.filter(e => e.courseId === stats.courseId);
    
    // Sanitize sheet name (max 31 chars, no special chars)
    let sheetName = stats.courseTitle.substring(0, 28);
    sheetName = sheetName.replace(/[:\\/?*\[\]]/g, '');
    
    const courseSheet = workbook.addWorksheet(sheetName);
    
    // Header
    courseSheet.mergeCells('A1:H1');
    const courseTitleCell = courseSheet.getCell('A1');
    courseTitleCell.value = stats.courseTitle.toUpperCase();
    courseTitleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    courseTitleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0F1C3F' }
    };
    courseTitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    courseSheet.getRow(1).height = 25;

    courseSheet.addRow([]);

    // Table Header
    const headerRow = courseSheet.addRow([
      'No',
      'NIP',
      'Nama Karyawan',
      'Email',
      'Status',
      'Progress (%)',
      'Deadline',
      'Tanggal Selesai'
    ]);
    
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E40AF' }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 20;

    // Data rows
    courseEnrollments.forEach((e, idx) => {
      const statusText = e.status === 'COMPLETED' ? 'SELESAI' : 
                        e.status === 'IN_PROGRESS' ? 'DALAM PROSES' : 
                        e.status === 'CHEATING' ? 'CHEATING' : 'TIDAK AKTIF';
      
      // Calculate progress (0-100) - if completed, 100%, otherwise 0 for now
      // TODO: Calculate actual progress from UserProgress if needed
      const progressValue = e.status === 'COMPLETED' ? 100 : 0;
      
      const row = courseSheet.addRow([
        idx + 1,
        e.user.nip || '-',
        e.user.name,
        e.user.email,
        statusText,
        progressValue,
        e.deadline ? new Date(e.deadline).toLocaleDateString('id-ID') : '-',
        e.status === 'COMPLETED' && e.updatedAt ? new Date(e.updatedAt).toLocaleDateString('id-ID') : '-'
      ]);

      // Status color coding
      const statusCell = row.getCell(5);
      if (e.status === 'COMPLETED') {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
        statusCell.font = { bold: true, color: { argb: 'FF065F46' } };
      } else if (e.status === 'CHEATING') {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFECACA' } };
        statusCell.font = { bold: true, color: { argb: 'FF991B1B' } };
      } else {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
        statusCell.font = { bold: true, color: { argb: 'FF92400E' } };
      }

      // Progress bar styling
      const progressCell = row.getCell(6);
      if (progressValue >= 80) {
        progressCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
        progressCell.font = { bold: true, color: { argb: 'FF065F46' } };
      } else if (progressValue >= 50) {
        progressCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
        progressCell.font = { bold: true, color: { argb: 'FF92400E' } };
      } else {
        progressCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFECACA' } };
        progressCell.font = { bold: true, color: { argb: 'FF991B1B' } };
      }
    });

    // Set column widths
    courseSheet.getColumn(1).width = 5;
    courseSheet.getColumn(2).width = 15;
    courseSheet.getColumn(3).width = 30;
    courseSheet.getColumn(4).width = 30;
    courseSheet.getColumn(5).width = 15;
    courseSheet.getColumn(6).width = 12;
    courseSheet.getColumn(7).width = 15;
    courseSheet.getColumn(8).width = 18;

    // Add borders to all cells
    courseSheet.eachRow((row, rowNumber) => {
      if (rowNumber > 2) {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
          };
        });
      }
    });
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
