import { db } from "@/lib/db";
import { notifyCourseEnrollment } from "@/lib/notifications";
import ExcelJS from "exceljs";

/**
 * ─── AUTO ENROLLMENT ENGINE ────────────────────────────────────────────────
 * Berjalan secara retroaktif untuk mendaftarkan karyawan ke kursus
 * berdasarkan aturan departemen.
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
      include: { course: { select: { title: true, deadlineDate: true } } },
    });

    for (const rule of rules) {
      try {
        results.rulesProcessed++;

        // 1. Optimasi Query: Cari user di departemen ini yang BELUM terdaftar
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

        // 2. Batch Processing: Pecah menjadi chunk 500
        const chunkSize = 500;
        for (let i = 0; i < usersToEnroll.length; i += chunkSize) {
          const chunk = usersToEnroll.slice(i, i + chunkSize);

          await (db as any).enrollment.createMany({
            data: chunk.map((u: any) => ({
              userId: u.id,
              courseId: rule.courseId,
              status: "IN_PROGRESS",
            })),
            skipDuplicates: true,
          });

          // 3. Async Notifications (Fire and forget with Promise.allSettled)
          const userIds = chunk.map((u: any) => u.id);
          notifyCourseEnrollment({
            userIds,
            courseId: rule.courseId,
            courseTitle: rule.course.title,
          }).catch((err) => console.error("Notification Error:", err));

          results.totalEnrolled += chunk.length;
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
 * ─── DEPARTMENT REPORTS ENGINE ──────────────────────────────────────────────
 * Menghasilkan laporan Excel per departemen berisi progress kursus karyawan.
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

  // Inisialisasi Group by Course (Gunakan rules sebagai base untuk template)
  const courseGroups: Record<string, any[]> = {};
  const courseIdToTitle: Record<string, string> = {};
  
  rules.forEach((r: any) => {
    courseGroups[r.course.title] = [];
    courseIdToTitle[r.courseId] = r.course.title;
  });

  // Masukkan data enrollment ke group yang sesuai
  enrollments.forEach((e: any) => {
    if (!courseGroups[e.course.title]) courseGroups[e.course.title] = [];
    courseGroups[e.course.title].push(e);
  });

  // Ambil semua test attempts untuk user-user ini untuk mendapatkan nilai post-test
  const userIds = Array.from(new Set(enrollments.map((e: any) => e.userId)));
  const attempts = await (db as any).testAttempt.findMany({
    where: {
      userId: { in: userIds },
      test: { type: "POST" },
    },
    select: {
      userId: true,
      score: true,
      passed: true,
      test: { select: { courseId: true } },
    },
  });

  // Map scores: userId_courseId -> bestScore
  const scoreMap: Record<string, number> = {};
  attempts.forEach((a: any) => {
    const key = `${a.userId}_${a.test.courseId}`;
    if (!scoreMap[key] || a.score > scoreMap[key]) {
      scoreMap[key] = a.score;
    }
  });

  for (const [courseTitle, members] of Object.entries(courseGroups)) {
    const sheet = workbook.addWorksheet(courseTitle.substring(0, 31)); // Limit title length

    // Styling & Columns
    sheet.columns = [
      { header: "NO", key: "no", width: 5 },
      { header: "NIP", key: "nip", width: 15 },
      { header: "NAMA KARYAWAN", key: "name", width: 35 },
      { header: "EMAIL", key: "email", width: 30 },
      { header: "STATUS", key: "status", width: 15 },
      { header: "NILAI POST-TEST", key: "score", width: 15 },
      { header: "TANGGAL DAFTAR", key: "date", width: 20 },
    ];

    // Header Styling
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0F1C3F" }, // Navy BNI Finance
    };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };

    // Add Data
    members.forEach((m: any, idx: number) => {
      const bestScore = scoreMap[`${m.userId}_${m.courseId}`];
      sheet.addRow({
        no: idx + 1,
        nip: m.user.nip,
        name: m.user.name,
        email: m.user.email,
        status: m.status === "COMPLETED" ? "SELESAI" : "PROSES",
        score: bestScore !== undefined ? bestScore : "-",
        date: new Date(m.createdAt).toLocaleDateString("id-ID"),
      });
    });

    // Formatting Data Rows
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.alignment = { vertical: "middle" };
        if (rowNumber % 2 === 0) {
          row.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF8FAFC" }, // Zebra rows (slate-50)
          };
        }
        // Color status
        const statusCell = row.getCell("status");
        if (statusCell.value === "SELESAI") {
          statusCell.font = { color: { argb: "FF059669" }, bold: true };
        }
      }
      // Borders
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin", color: { argb: "FFE2E8F0" } },
          left: { style: "thin", color: { argb: "FFE2E8F0" } },
          bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
          right: { style: "thin", color: { argb: "FFE2E8F0" } },
        };
      });
    });
  }

  return workbook;
}

export async function runDepartmentalReports() {
  const configs = await (db as any).departmentConfig.findMany({
    where: { isActive: true },
  });

  const results = {
    departmentsProcessed: 0,
    emailsSent: 0,
    errors: [] as string[],
  };

  for (const config of configs) {
    try {
      results.departmentsProcessed++;
      
      // 1. Generate Excel
      const workbook = await generateDepartmentExcel(config.departmentName);
      const buffer = await workbook.xlsx.writeBuffer();

      // 2. Mock Email Sending
      // Di sini hubungkan ke provider email Anda (Resend/SendGrid/dll)
      console.log(`[REPORT] Menyiapkan email laporan untuk ${config.headName} (${config.headEmail}) - Dept: ${config.departmentName}`);
      
      // Placeholder: await sendEmailWithAttachment(config.headEmail, buffer);
      
      results.emailsSent++;
    } catch (err: any) {
      const msg = `Error sending report for ${config.departmentName}: ${err.message}`;
      console.error(msg);
      results.errors.push(msg);
    }
  }

  return results;
}
