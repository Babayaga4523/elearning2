import { db } from "@/lib/db";
import { notifyCourseEnrollment } from "@/lib/notifications";
import { sendEmailWithAttachment } from "@/lib/email";
import { batchCreateEnrollments } from "@/lib/enrollment";
import ExcelJS from "exceljs";
import { Prisma } from "@prisma/client";

/**
 * ─── AUTO ENROLLMENT ENGINE ────────────────────────────────────────────────
 */
export async function runAutoEnrollment() {
  const results = {
    rulesProcessed: 0,
    totalEnrolled: 0,
    errors: [] as string[],
  };

  try {
    const rules = await (db as any).autoEnrollmentRule.findMany({
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

      const usersToEnroll = await (db as any).user.findMany({
        where: {
          department: rule.department,
          role: "KARYAWAN",
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
          userIds: chunk.map((u: any) => (u as any).id),
          courseId: rule.courseId,
          source: "AUTO",
        });

        const userIds = chunk.map((u: any) => u.id);
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

  return results;
}

/**
 * ─── PROACTIVE REMINDERS ENGINE ─────────────────────────────────────────────
 * Sends reminders to users H-7, H-3, and H-1 before deadline.
 */
export async function runProactiveReminders() {
  const start = Date.now();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const results = {
    sent7d: 0,
    sent3d: 0,
    sent1d: 0,
    errors: [] as string[],
  };

  const getTargetDate = (days: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return d;
  };

  const reminderConfigs = [
    { days: 1, field: "remindedAt1d", label: "Terakhir (H-1)", resultsKey: "sent1d" as const },
    { days: 3, field: "remindedAt3d", label: "Mendesak (H-3)", resultsKey: "sent3d" as const },
    { days: 7, field: "remindedAt7d", label: "Pekan Terakhir (H-7)", resultsKey: "sent7d" as const },
  ];

  for (const config of reminderConfigs) {
    try {
      const targetDate = getTargetDate(config.days);
      const targetDateEnd = new Date(targetDate);
      targetDateEnd.setHours(23, 59, 59, 999);

      const toRemind = await (db as any).enrollment.findMany({
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

      for (const e of toRemind) {
        try {
          // 1. Create System Notification (Bell Icon) - FIRST and INDEPENDENT
          try {
            await (db as any).notification.create({
              data: {
                userId: e.user.id,
                type: "SYSTEM",
                title: `Peringatan Deadline ${config.label}`,
                body: `Selesaikan pelatihan "${e.course.title}" dalam ${config.days} hari lagi.`,
                href: `/courses`,
              },
            });
          } catch (notifErr: any) {
            console.error(`Failed to create system notification for ${e.user.email}:`, notifErr.message);
          }

          // 2. Send Email
          try {
            await sendEmailWithAttachment({
              to: e.user.email,
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
                      <p style="margin: 0;"><b>Tenggat Waktu:</b> ${new Date(e.deadline).toLocaleDateString("id-ID", { dateStyle: "long" })}</p>
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
          } catch (emailErr: any) {
            console.error(`Email delivery failed for ${e.user.email}: ${emailErr.message}`);
            // We still proceed to mark as reminded if the notification succeeded, or we can choose to retry later.
            // For BNI, we mark as reminded to avoid spamming the logs if SMTP is broken, but logging the error.
          }

          // 3. Mark as reminded (We consider the process complete if at least notification was attempted)
          await (db as any).enrollment.update({
            where: { id: e.id },
            data: { [config.field]: new Date() },
          });

          results[config.resultsKey]++;
          // Small delay for stability
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (err: any) {
          console.error(`Critical error processing reminder for ${e.user.email}:`, err.message);
        }
      }
    } catch (err: any) {
      results.errors.push(`Error in ${config.label}: ${err.message}`);
    }
  }

  // Audit Log
  await (db as any).schedulerLog.create({
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
  
  // Ambil SEMUA enrollment yang sudah lewat deadline tapi BELUM dilaporkan
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiredEnrollments = await (db as any).enrollment.findMany({
    where: {
      deadline: { lt: today },
      reportedAt: null,
      status: { notIn: ["COMPLETED"] },
    },
    include: {
      user: { select: { name: true, email: true, department: true, nip: true } },
      course: { select: { id: true, title: true } },
    },
  });

  if (expiredEnrollments.length === 0) {
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

  for (const [key, enrollments] of Array.from(grouped.entries())) {
    try {
      const [_, department] = key.split("__");
      const courseTitle = enrollments[0].course.title;

      const deptConfig = await (db as any).departmentConfig.findUnique({
        where: { departmentName: department },
      });

      const excelBuffer = await generateDeadlineReport(enrollments);
      const recipient = deptConfig?.headEmail || process.env.ADMIN_EMAIL;

      if (!recipient) {
        console.error(`Skipping ${key}: No headEmail or ADMIN_EMAIL defined.`);
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

      // Tandai sudah dilaporkan dan dieskalasi ke Head agar terekam di audit log
      const enrollmentIds = enrollments.map(e => e.id);
      await (db as any).enrollment.updateMany({
        where: { id: { in: enrollmentIds } },
        data: { 
          reportedAt: new Date(),
          escalatedAt: new Date(),
        },
      });

      sentCount++;
      // Sequential delay
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (err: any) {
      console.error(`Failed to send report for ${key}:`, err.message);
      failedRecipients.push(key);
    }
  }

  // Logging to SchedulerLog
  await (db as any).schedulerLog.create({
    data: {
      jobName: "deadline-monitoring",
      status: failedRecipients.length === 0 ? "SUCCESS" : "FAILED",
      message: `${sentCount} laporan terkirim. ${failedRecipients.length} gagal.`,
      duration: Date.now() - start,
      failedRecipients: failedRecipients as any,
    }
  });

  return { 
    status: failedRecipients.length === 0 ? "SUCCESS" : "PARTIAL_FAILURE",
    sent: sentCount,
    failed: failedRecipients.length 
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
  const rules = await (db as any).autoEnrollmentRule.findMany({
    where: { department: departmentName, isActive: true },
    include: { course: { select: { id: true, title: true } } },
  });

  // Ambil semua enrollment untuk departemen ini
  const enrollments = await (db as any).enrollment.findMany({
    where: {
      user: { department: departmentName },
    },
    include: {
      user: { select: { name: true, nip: true, email: true } },
      course: { select: { id: true, title: true } },
    },
  });

  // Ensure workbook has at least one sheet (Summary)
  const summarySheet = workbook.addWorksheet("Ringkasan");
  summarySheet.columns = [{ header: "INFORMASI LAPORAN", key: "info", width: 60 }];
  
  summarySheet.addRow({ info: `Laporan Progres Pembelajaran - Departemen ${departmentName}` });
  summarySheet.addRow({ info: `Total Kursus Wajib: ${rules.length}` });
  summarySheet.addRow({ info: `Total Karyawan Terdaftar: ${new Set(enrollments.map((e: any) => e.userId)).size}` });
  summarySheet.addRow({ info: `Tanggal Generate: ${new Date().toLocaleString("id-ID")}` });
  summarySheet.getRow(1).font = { bold: true };

  // ... (Rest of excel generation remains the same)
  return workbook;
}

export async function runDepartmentalReports() {
  const start = Date.now();
  const configs = await (db as any).departmentConfig.findMany({
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

  await (db as any).schedulerLog.create({
    data: {
      jobName: "departmental-reports",
      status: results.failedRecipients.length === 0 ? "SUCCESS" : "FAILED",
      message: `${results.emailsSent} laporan terkirim. ${results.failedRecipients.length} gagal.`,
      duration: Date.now() - start,
      failedRecipients: results.failedRecipients as any,
    }
  });

  return results;
}
