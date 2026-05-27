import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/auth-helpers";
import { log } from "@/lib/logger";
import {
  BRAND,
  createWorkbook,
  styleTitle,
  styleSubtitle,
  styleHeaderRow,
  applyDataRow,
  applyStatusCell,
  applyPassedCell,
  finalizeSheet,
} from "@/lib/excel-template";

// ── Column-letter helper (supports >26 columns) ────────────────────────────
function colLetter(n: number): string {
  let s = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

export async function GET() {
  const session = await auth();

  if (!isAdmin(session)) {
    log.error("[ANALYTICS_EXPORT] Unauthorized access attempt", {
      email: session?.user?.email,
      activeRole: session?.user?.activeRole,
      context: "api",
    });
    return new NextResponse("Unauthorized - Admin access required", { status: 401 });
  }

  // ── Data queries (2 round trips, join in memory) ────────────────────────
  const enrollments = await db.enrollment.findMany({
    include: {
      user: {
        select: { name: true, email: true, department: true, nip: true, lokasi: true },
      },
      course: {
        select: {
          title: true,
          category: { select: { name: true } },
          tests: { select: { type: true, passingScore: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const testAttempts = await db.testAttempt.findMany({
    select: {
      userId: true,
      score: true,
      passed: true,
      createdAt: true,
      test: { select: { type: true, courseId: true, passingScore: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  // ── Enrich enrollment data with best test scores ────────────────────────
  // Uses the backend's `passed` field from the best-scoring POST attempt
  // instead of recomputing, ensuring consistency with the application logic.
  const enriched = enrollments.map((e) => {
    const userAttempts = testAttempts.filter(
      (a) => a.userId === e.userId && a.test.courseId === e.courseId
    );
    const preAttempts  = userAttempts.filter((a) => a.test.type === "PRE" && a.score !== null);
    const postAttempts = userAttempts.filter((a) => a.test.type === "POST" && a.score !== null);

    // Best PRE score
    const bestPre = preAttempts.length
      ? Math.max(...preAttempts.map((a) => a.score ?? 0))
      : null;

    // Best POST attempt — use the one with the highest score
    // and take its `passed` field directly from the backend
    const bestPostAttempt = postAttempts.length
      ? postAttempts.reduce((best, a) => ((a.score ?? 0) > (best.score ?? 0) ? a : best), postAttempts[0])
      : null;

    const bestPost   = bestPostAttempt?.score ?? null;
    const postPassed = bestPostAttempt?.passed ?? null;

    return {
      ...e,
      bestPre,
      bestPost,
      postPassed,
      categoryName: e.course.category?.name ?? "-",
    };
  });

  // ── Status counts (all 6 statuses matching the analytics page) ──────────
  const total      = enrollments.length;
  const completed  = enrollments.filter((e) => e.status === "COMPLETED").length;
  const failed     = enrollments.filter((e) => e.status === "FAILED").length;
  const inProgress = enrollments.filter((e) => e.status === "IN_PROGRESS").length;
  const pending    = enrollments.filter((e) => e.status === "PENDING").length;
  const rejected   = enrollments.filter((e) => e.status === "REJECTED").length;
  const finished   = completed + failed;

  const postScores = enriched
    .map((e) => e.bestPost)
    .filter((s): s is number => s !== null);
  const avgPost = postScores.length
    ? (postScores.reduce((a, b) => a + b, 0) / postScores.length).toFixed(1)
    : "-";

  // ── Build Workbook ────────────────────────────────────────────────────────
  const wb = createWorkbook();

  // ═══════════════════════════════════════════════════════════════════════════
  // SHEET 1 — Ringkasan Statistik
  // ═══════════════════════════════════════════════════════════════════════════
  const S1_COLS = 2;
  const s1 = wb.addWorksheet("Ringkasan Statistik");
  s1.columns = [
    { header: "METRIK", key: "metric", width: 36 },
    { header: "NILAI", key: "value", width: 20 },
  ];

  styleTitle(s1, 1, "Ringkasan Statistik Pembelajaran — BNI Finance", S1_COLS);
  styleSubtitle(s1, 2, S1_COLS);
  styleHeaderRow(s1, 3);

  const statsRows: [string, string | number][] = [
    ["Total Enrollment",         total],
    ["Kursus Selesai (Lulus)",   completed],
    ["Kursus Gagal",             failed],

    ["Kursus Berjalan",          inProgress],
    ["Menunggu Persetujuan",     pending],
    ["Ditolak",                  rejected],
    ["Tingkat Penyelesaian",     total > 0 ? `${((finished / total) * 100).toFixed(1)}%` : "-"],
    ["Tingkat Kelulusan",        finished > 0 ? `${((completed / finished) * 100).toFixed(1)}%` : "-"],
    ["Rata-rata Nilai Post-Test", avgPost],
    ["Total Karyawan Unik",      new Set(enrollments.map((e) => e.userId)).size],
    ["Total Kursus Unik",        new Set(enrollments.map((e) => e.courseId)).size],
  ];

  statsRows.forEach(([metric, value], i) => {
    const row = s1.addRow({ metric, value });
    applyDataRow(row, i);
    row.getCell("metric").font = { bold: true, size: 10, name: "Calibri" };
    row.getCell("value").alignment = { horizontal: "center", vertical: "middle" };
  });

  finalizeSheet(s1, S1_COLS);

  // ═══════════════════════════════════════════════════════════════════════════
  // SHEET 2 — Riwayat Enrollment
  // ═══════════════════════════════════════════════════════════════════════════
  const S2_COLS = 12;
  const s2 = wb.addWorksheet("Riwayat Enrollment");
  s2.columns = [
    { header: "NIP",               key: "nip",          width: 20 },
    { header: "NAMA KARYAWAN",     key: "name",         width: 26 },
    { header: "EMAIL",             key: "email",        width: 30 },
    { header: "DEPARTEMEN",        key: "dept",         width: 20 },
    { header: "LOKASI",            key: "lokasi",       width: 18 },
    { header: "JUDUL KURSUS",      key: "course",       width: 36 },
    { header: "KATEGORI",          key: "category",     width: 18 },
    { header: "STATUS",            key: "status",       width: 14 },
    { header: "TGL DAFTAR",        key: "enrolledAt",   width: 16 },
    { header: "NILAI PRE-TEST",    key: "preScore",     width: 15 },
    { header: "NILAI POST-TEST",   key: "postScore",    width: 15 },
    { header: "HASIL POST-TEST",   key: "postPassed",   width: 16 },
  ];

  styleTitle(s2, 1, "Riwayat Enrollment Seluruh Karyawan — BNI Finance", S2_COLS);
  styleSubtitle(s2, 2, S2_COLS, `${enriched.length} Record`);
  styleHeaderRow(s2, 3);

  enriched.forEach((e, i) => {
    const row = s2.addRow({
      nip:          e.user.nip ?? "-",
      name:         e.user.name ?? "-",
      email:        e.user.email ?? "-",
      dept:         e.user.department ?? "-",
      lokasi:       e.user.lokasi ?? "-",
      course:       e.course.title,
      category:     e.categoryName,
      status:       e.status,
      enrolledAt:   new Date(e.createdAt).toLocaleDateString("id-ID"),
      preScore:     e.bestPre ?? "—",
      postScore:    e.bestPost ?? "—",
      postPassed:   e.postPassed,
    });

    applyDataRow(row, i);
    applyStatusCell(row.getCell("status"), e.status);
    applyPassedCell(row.getCell("postPassed"), e.postPassed);

    ["enrolledAt", "preScore", "postScore"].forEach((key) => {
      row.getCell(key).alignment = { horizontal: "center", vertical: "middle" };
    });
  });

  finalizeSheet(s2, S2_COLS);

  // ═══════════════════════════════════════════════════════════════════════════
  // SHEET 3 — Rekap Per Departemen
  // ═══════════════════════════════════════════════════════════════════════════
  const S3_COLS = 9;
  const s3 = wb.addWorksheet("Rekap Per Departemen");
  s3.columns = [
    { header: "DEPARTEMEN",        key: "dept",       width: 26 },
    { header: "TOTAL ENROLLMENT",  key: "total",      width: 18 },
    { header: "SELESAI",           key: "completed",  width: 14 },
    { header: "GAGAL",             key: "failed",     width: 14 },
    { header: "BERJALAN",          key: "inProgress", width: 14 },
    { header: "MENUNGGU",          key: "pending",    width: 14 },
    { header: "DITOLAK",           key: "rejected",   width: 14 },
    { header: "RATA-RATA POST",    key: "avgPost",    width: 18 },
    { header: "TINGKAT LULUS %",   key: "passRate",   width: 18 },
  ];

  styleTitle(s3, 1, "Rekap Pembelajaran Per Departemen — BNI Finance", S3_COLS);
  styleSubtitle(s3, 2, S3_COLS);
  styleHeaderRow(s3, 3);

  // Group by department
  const deptMap = new Map<string, typeof enriched>();
  enriched.forEach((e) => {
    const dept = e.user.department ?? "Tidak Diketahui";
    if (!deptMap.has(dept)) deptMap.set(dept, []);
    deptMap.get(dept)!.push(e);
  });

  const sortedDepts = Array.from(deptMap.entries()).sort(
    ([, a], [, b]) => b.length - a.length
  );

  sortedDepts.forEach(([dept, items], i) => {
    const dCompleted  = items.filter((e) => e.status === "COMPLETED").length;
    const dFailed     = items.filter((e) => e.status === "FAILED").length;
    const dInProgress = items.filter((e) => e.status === "IN_PROGRESS").length;
    const dPending    = items.filter((e) => e.status === "PENDING").length;
    const dRejected   = items.filter((e) => e.status === "REJECTED").length;
    const dFinished   = dCompleted + dFailed;
    const dPostScores = items
      .map((e) => e.bestPost)
      .filter((s: number | null): s is number => s !== null);
    const dAvgPost = dPostScores.length
      ? (dPostScores.reduce((a, b) => a + b, 0) / dPostScores.length).toFixed(1)
      : "-";
    const dPassRate = dFinished > 0
      ? `${((dCompleted / dFinished) * 100).toFixed(1)}%`
      : "-";

    const row = s3.addRow({
      dept,
      total:      items.length,
      completed:  dCompleted,
      failed:     dFailed,
      inProgress: dInProgress,
      pending:    dPending,
      rejected:   dRejected,
      avgPost:    dAvgPost,
      passRate:   dPassRate,
    });

    applyDataRow(row, i);
    ["total", "completed", "failed", "inProgress", "pending", "rejected", "avgPost", "passRate"].forEach(
      (key) => { row.getCell(key).alignment = { horizontal: "center", vertical: "middle" }; }
    );

    // Color the pass rate cell
    const passRateValue = parseFloat(dPassRate);
    if (!isNaN(passRateValue)) {
      const cell = row.getCell("passRate");
      cell.font = {
        bold: true, size: 10, name: "Calibri",
        color: { argb: passRateValue >= 80 ? BRAND.STATUS_COMPLETED_FG : BRAND.STATUS_FAILED_FG },
      };
    }
  });

  finalizeSheet(s3, S3_COLS);

  // ═══════════════════════════════════════════════════════════════════════════
  // SHEET 4 — Rekap Per Kursus
  // ═══════════════════════════════════════════════════════════════════════════
  const S4_COLS = 9;
  const s4 = wb.addWorksheet("Rekap Per Kursus");
  s4.columns = [
    { header: "JUDUL KURSUS",      key: "course",     width: 36 },
    { header: "KATEGORI",          key: "category",   width: 18 },
    { header: "TOTAL ENROLLMENT",  key: "total",      width: 18 },
    { header: "SELESAI",           key: "completed",  width: 14 },
    { header: "GAGAL",             key: "failed",     width: 14 },
    { header: "BERJALAN",          key: "inProgress", width: 14 },
    { header: "RATA-RATA POST",    key: "avgPost",    width: 18 },
    { header: "TINGKAT LULUS %",   key: "passRate",   width: 18 },
    { header: "KARYAWAN UNIK",     key: "uniqueUsers", width: 16 },
  ];

  styleTitle(s4, 1, "Rekap Pembelajaran Per Kursus — BNI Finance", S4_COLS);
  styleSubtitle(s4, 2, S4_COLS);
  styleHeaderRow(s4, 3);

  // Group by course
  const courseMap = new Map<string, { items: typeof enriched; title: string; category: string }>();
  enriched.forEach((e) => {
    if (!courseMap.has(e.courseId)) {
      courseMap.set(e.courseId, {
        items: [],
        title: e.course.title,
        category: e.categoryName,
      });
    }
    courseMap.get(e.courseId)!.items.push(e);
  });

  const sortedCourses = Array.from(courseMap.entries()).sort(
    ([, a], [, b]) => b.items.length - a.items.length
  );

  sortedCourses.forEach(([, data], i) => {
    const { items, title, category } = data;
    const cCompleted  = items.filter((e) => e.status === "COMPLETED").length;
    const cFailed     = items.filter((e) => e.status === "FAILED").length;
    const cInProgress = items.filter((e) => e.status === "IN_PROGRESS").length;
    const cFinished   = cCompleted + cFailed;
    const cPostScores = items
      .map((e) => e.bestPost)
      .filter((s: number | null): s is number => s !== null);
    const cAvgPost = cPostScores.length
      ? (cPostScores.reduce((a, b) => a + b, 0) / cPostScores.length).toFixed(1)
      : "-";
    const cPassRate = cFinished > 0
      ? `${((cCompleted / cFinished) * 100).toFixed(1)}%`
      : "-";

    const row = s4.addRow({
      course:     title,
      category,
      total:      items.length,
      completed:  cCompleted,
      failed:     cFailed,
      inProgress: cInProgress,
      avgPost:    cAvgPost,
      passRate:   cPassRate,
      uniqueUsers: new Set(items.map((e) => e.userId)).size,
    });

    applyDataRow(row, i);
    ["total", "completed", "failed", "inProgress", "avgPost", "passRate", "uniqueUsers"].forEach(
      (key) => { row.getCell(key).alignment = { horizontal: "center", vertical: "middle" }; }
    );

    // Color the pass rate cell
    const passRateValue = parseFloat(cPassRate);
    if (!isNaN(passRateValue)) {
      const cell = row.getCell("passRate");
      cell.font = {
        bold: true, size: 10, name: "Calibri",
        color: { argb: passRateValue >= 80 ? BRAND.STATUS_COMPLETED_FG : BRAND.STATUS_FAILED_FG },
      };
    }
  });

  finalizeSheet(s4, S4_COLS);

  // ─── Serialize & Return ───────────────────────────────────────────────────
  const buffer = await wb.xlsx.writeBuffer();
  const filename = `Laporan_LMS_BNI_Finance_${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
