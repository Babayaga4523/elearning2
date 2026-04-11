"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  Download,
  Users,
  CheckCircle2,
  XCircle,
  TrendingUp,
  BookOpen,
  GraduationCap,
  Clock,
  Award,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";

// Lazy load charts
const CourseReportCharts = dynamic(() => import("./CourseReportCharts"), {
  ssr: false,
  loading: () => <div className="h-96 w-full bg-slate-50 animate-pulse rounded-xl" />
});

interface ReportRow {
  userId: string;
  name: string;
  email: string;
  department: string;
  nip: string;
  lokasi: string;
  status: string;
  enrolledAt: string;
  completedModules: number;
  totalModules: number;
  moduleProgress: number;
  preScore: number | null;
  preTestTitle: string | null;
  prePassing: number;
  preTestPassed: boolean | null;
  postScore: number | null;
  postTestTitle: string | null;
  postPassing: number;
  postTestPassed: boolean | null;
}

interface Props {
  course: any;
  reportRows: ReportRow[];
  avgPre: number;
  avgPost: number;
  scoreDistribution: { range: string; pre: number; post: number }[];
  moduleCompletion: { name: string; completed: number; total: number }[];
  totalEnrolled: number;
}

export function CourseReportClient({
  course,
  reportRows,
  avgPre,
  avgPost,
  scoreDistribution,
  moduleCompletion,
  totalEnrolled,
}: Props) {
  const [search, setSearch] = useState("");

  const completedCount = reportRows.filter((r) => r.status === "COMPLETED").length;
  const passedCount = reportRows.filter((r) => r.postTestPassed === true).length;
  const avgModuleProgress =
    reportRows.length > 0
      ? Math.round(reportRows.reduce((s, r) => s + r.moduleProgress, 0) / reportRows.length)
      : 0;

  const filtered = reportRows.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase()) ||
      r.department.toLowerCase().includes(search.toLowerCase()) ||
      r.nip.toLowerCase().includes(search.toLowerCase()) ||
      r.lokasi.toLowerCase().includes(search.toLowerCase())
  );

  // Export to Excel (Dynamic Import)
  const handleExport = useCallback(async () => {
    try {
      const toastId = toast.loading("Menyiapkan dokumen Excel...");
      
      // Dynamic import with robustness for ESM/CJS differences
      const [ExcelJSModule, FileSaverModule] = await Promise.all([
        import("exceljs"),
        import("file-saver")
      ]);

      const ExcelJS = ExcelJSModule.default || ExcelJSModule;
      const saveAs = FileSaverModule.saveAs || FileSaverModule.default || FileSaverModule;

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Laporan Pelatihan");

      // ─── 1. Metadata ─────────────────────────────────────────────
      workbook.creator = "HCMS BNI Finance";
      workbook.created = new Date();

      // ─── 2. Definisi Kolom (Hanya Mapping & Lebar) ───────────────
      // Menggunakan key agar addRow({ key: value }) berfungsi
      sheet.columns = [
        { key: "nip", width: 20 },
        { key: "name", width: 30 },
        { key: "email", width: 30 },
        { key: "department", width: 25 },
        { key: "lokasi", width: 20 },
        { key: "status", width: 15 },
        { key: "enrolledAt", width: 15 },
        { key: "moduleProgress", width: 15 },
        { key: "completedModules", width: 15 },
        { key: "totalModules", width: 12 },
        { key: "preScore", width: 15 },
        { key: "preTestPassed", width: 15 },
        { key: "postScore", width: 15 },
        { key: "postTestPassed", width: 15 },
      ];

      // ─── 3. Judul Navy (Row 1) ──────────────────────────────────
      sheet.mergeCells("A1:N1");
      const titleCell = sheet.getCell("A1");
      titleCell.value = `LAPORAN HASIL PELATIHAN: ${course.title.toUpperCase()}`;
      titleCell.font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
      titleCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF0F1C3F" },
      };
      titleCell.alignment = { horizontal: "center", vertical: "middle" };
      sheet.getRow(1).height = 35;

      // Sub-judul (Row 2)
      sheet.mergeCells("A2:N2");
      const subTitleCell = sheet.getCell("A2");
      subTitleCell.value = `Tanggal Unduh: ${new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}`;
      subTitleCell.font = { italic: true, size: 10, color: { argb: "FF444444" } };
      subTitleCell.alignment = { horizontal: "center" };
      sheet.getRow(2).height = 20;

      // ─── 4. Header Gold (Row 3) ─────────────────────────────────
      const preTitle = reportRows[0]?.preTestTitle ?? "PRE-TEST";
      const postTitle = reportRows[0]?.postTestTitle ?? "POST-TEST";

      const headerValues = [
        "NIP", "NAMA KARYAWAN", "EMAIL", "DEPARTEMEN", "LOKASI", 
        "STATUS", "TGL DAFTAR", "PROGRESS (%)", "MODUL LULUS", "TOTAL MODUL",
        `NILAI ${preTitle}`, `LULUS ${preTitle}`, `NILAI ${postTitle}`, `LULUS ${postTitle}`
      ];

      const headerRow = sheet.getRow(3);
      headerRow.values = headerValues;
      headerRow.height = 25;
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FF0F1C3F" } }; // Navy text on Gold
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFE8A020" }, // BNI Gold
        };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
          top: { style: "thin", color: { argb: "FFCCCCCC" } },
          bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
          left: { style: "thin", color: { argb: "FFCCCCCC" } },
          right: { style: "thin", color: { argb: "FFCCCCCC" } },
        };
      });

      // ─── 4. Isi Data ────────────────────────────────────────────────
      reportRows.forEach((r, index) => {
        const statusLabel =
          r.status === "COMPLETED" ? "Selesai"
          : r.status === "FAILED" ? "Gagal"
          : "Berjalan";

        const row = sheet.addRow({
          nip: r.nip,
          name: r.name,
          email: r.email,
          department: r.department,
          lokasi: r.lokasi,
          status: statusLabel,
          enrolledAt: new Date(r.enrolledAt).toLocaleDateString("id-ID"),
          moduleProgress: r.moduleProgress,
          completedModules: r.completedModules,
          totalModules: r.totalModules,
          preScore: r.preScore ?? "-",
          preTestPassed: r.preTestPassed === null ? "-" : r.preTestPassed ? "Ya" : "Tidak",
          postScore: r.postScore ?? "-",
          postTestPassed: r.postTestPassed === null ? "-" : r.postTestPassed ? "Ya" : "Tidak",
        });

        const isEven = index % 2 === 0;
        const bgColor = isEven ? "FFF5F7FA" : "FFFFFFFF";

        row.height = 18;
        row.eachCell({ includeEmpty: true }, (cell: any) => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } };
          cell.font = { size: 10 };
          cell.alignment = { vertical: "middle", wrapText: false };
          cell.border = {
            bottom: { style: "hair", color: { argb: "FFDDDDDD" } },
            right: { style: "hair", color: { argb: "FFDDDDDD" } },
          };
        });

        // ─── Conditional: warna status ──────────────────────────────
        const statusCell = row.getCell(6); 
        if (r.status === "COMPLETED") {
          statusCell.font = { size: 10, bold: true, color: { argb: "FF166534" } };
          statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDCFCE7" } };
        } else if (r.status === "FAILED") {
          statusCell.font = { size: 10, bold: true, color: { argb: "FF991B1B" } };
          statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEE2E2" } };
        }
        statusCell.alignment = { horizontal: "center", vertical: "middle" };

        const preCell = row.getCell(12);
        if (r.preTestPassed === true) preCell.font = { color: { argb: "FF166534" } };
        else if (r.preTestPassed === false) preCell.font = { color: { argb: "FF991B1B" } };
        preCell.alignment = { horizontal: "center" };

        const postCell = row.getCell(14);
        if (r.postTestPassed === true) postCell.font = { color: { argb: "FF166534" } };
        else if (r.postTestPassed === false) postCell.font = { color: { argb: "FF991B1B" } };
        postCell.alignment = { horizontal: "center" };

        [8, 9, 10, 11, 13].forEach(col => {
          row.getCell(col).alignment = { horizontal: "center" };
        });
      });

      // ─── 5. Freeze pane & Auto Filter ──────────────────────────────
      sheet.views = [{ state: "frozen", xSplit: 0, ySplit: 3 }]; 
      sheet.autoFilter = { from: "A3", to: `N3` };

      // ─── 6. Export ──────────────────────────────────────────────────
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      
      const safeTitle = course.title.replace(/[^a-z0-9]/gi, "_").substring(0, 50);
      saveAs(blob, `Laporan_${safeTitle}_${Date.now()}.xlsx`);
      
      toast.dismiss(toastId);
      toast.success("Laporan berhasil diunduh.");
    } catch (error) {
      console.error("Export Error:", error);
      toast.error("Gagal mengekspor laporan. Silakan coba lagi.");
    }
  }, [reportRows, course.title, course.tests.length]);

  const summaryCards = [
    {
      label: "Total Peserta",
      value: totalEnrolled,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-100",
    },
    {
      label: "Kursus Selesai",
      value: completedCount,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
    },
    {
      label: "Lulus Post-Test",
      value: passedCount,
      icon: Award,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      border: "border-indigo-100",
    },
    {
      label: "Rata-rata Progress",
      value: `${avgModuleProgress}%`,
      icon: TrendingUp,
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-100",
    },
  ];

  const comparisonData = [
    {
      name: "Rata-rata",
      "Pre-Test": avgPre,
      "Post-Test": avgPost,
      "Passing Score": reportRows[0]?.prePassing ?? 70,
    },
  ];

  return (
    <div className="w-full min-w-0 space-y-6 pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 md:space-y-8 md:pb-10">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="space-y-2">
          <Link
            href="/admin/courses"
            className="flex items-center text-xs font-black text-slate-400 hover:text-primary transition group uppercase tracking-widest"
          >
            <ArrowLeft className="h-3 w-3 mr-2 group-hover:-translate-x-1 transition-transform" />
            Kembali ke Katalog
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{course.title}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <Badge variant="outline" className="text-xs font-semibold text-slate-500">
                {course.category?.name ?? "Tanpa Kategori"}
              </Badge>
              {course.isPublished ? (
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-xs">Published</Badge>
              ) : (
                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-xs">Draft</Badge>
              )}
              <span className="text-xs text-slate-400 font-medium">
                {course.modules.length} modul · {course.tests.length} tes
              </span>
            </div>
          </div>
        </div>
        <Button
          onClick={handleExport}
          className="gap-2 font-black bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200 shrink-0"
        >
          <Download className="h-4 w-4" />
          Export Excel (CSV)
        </Button>
      </div>

      {/* ── Summary Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((s) => (
          <Card key={s.label} className={cn("border shadow-sm bg-white", s.border)}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{s.label}</p>
                <div className={cn("p-2 rounded-xl", s.bg)}>
                  <s.icon className={cn("h-4 w-4", s.color)} />
                </div>
              </div>
              <p className={cn("text-3xl font-black tracking-tighter", s.color)}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Charts Row ── */}
      <CourseReportCharts
        avgPre={avgPre}
        avgPost={avgPost}
        reportRows={reportRows}
        scoreDistribution={scoreDistribution}
        moduleCompletion={moduleCompletion}
        totalEnrolled={totalEnrolled}
        courseModulesLength={course.modules.length}
      />

      {/* ── Data Table ── */}
      <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base font-black text-slate-800">Detail Nilai Per Peserta</CardTitle>
            <p className="text-xs text-slate-400 font-medium mt-0.5">{totalEnrolled} peserta terdaftar</p>
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, email, departemen..."
            className="h-9 w-full md:w-64 border border-slate-200 rounded-lg px-3 text-sm font-medium placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </CardHeader>

        {filtered.length === 0 ? (
          <div className="p-16 text-center text-slate-300 italic text-sm">Tidak ada peserta ditemukan.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-5 py-3 font-black text-xs text-slate-500 uppercase tracking-wider">Peserta</th>
                  <th className="text-left px-4 py-3 font-black text-xs text-slate-500 uppercase tracking-wider">Dept.</th>
                  <th className="text-center px-4 py-3 font-black text-xs text-slate-500 uppercase tracking-wider">Progress Modul</th>
                  <th className="text-center px-4 py-3 font-black text-xs text-slate-500 uppercase tracking-wider">Pre-Test</th>
                  <th className="text-center px-4 py-3 font-black text-xs text-slate-500 uppercase tracking-wider">Post-Test</th>
                  <th className="text-center px-4 py-3 font-black text-xs text-slate-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((row) => (
                  <tr key={row.userId} className="hover:bg-slate-50/60 transition-colors group">
                    {/* Name */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors shrink-0 text-sm">
                          {row.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 leading-tight">{row.name}</p>
                          <p className="text-[11px] text-slate-400">{row.email}</p>
                        </div>
                      </div>
                    </td>
                    {/* Dept */}
                    <td className="px-4 py-4 text-slate-500 font-medium text-xs">{row.department}</td>
                    {/* Module progress */}
                    <td className="px-4 py-4">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs font-black text-slate-700">
                          {row.completedModules}/{row.totalModules}
                        </span>
                        <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              row.moduleProgress === 100 ? "bg-emerald-500" : "bg-primary"
                            )}
                            style={{ width: `${row.moduleProgress}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400">{row.moduleProgress}%</span>
                      </div>
                    </td>
                    {/* Pre-test */}
                    <td className="px-4 py-4 text-center">
                      {row.preScore === null ? (
                        <span className="text-slate-300 text-xs italic">—</span>
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <span
                            className={cn(
                              "text-base font-black",
                              row.preTestPassed ? "text-emerald-600" : "text-rose-500"
                            )}
                          >
                            {row.preScore}
                          </span>
                          <Badge
                            className={cn(
                              "text-[10px] font-bold border-none px-2",
                              row.preTestPassed
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-rose-100 text-rose-600"
                            )}
                          >
                            {row.preTestPassed ? "Lulus" : "Tidak Lulus"}
                          </Badge>
                        </div>
                      )}
                    </td>
                    {/* Post-test */}
                    <td className="px-4 py-4 text-center">
                      {row.postScore === null ? (
                        <span className="text-slate-300 text-xs italic">—</span>
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <span
                            className={cn(
                              "text-base font-black",
                              row.postTestPassed ? "text-emerald-600" : "text-rose-500"
                            )}
                          >
                            {row.postScore}
                          </span>
                          <Badge
                            className={cn(
                              "text-[10px] font-bold border-none px-2",
                              row.postTestPassed
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-rose-100 text-rose-600"
                            )}
                          >
                            {row.postTestPassed ? "Lulus" : "Tidak Lulus"}
                          </Badge>
                        </div>
                      )}
                    </td>
                    {/* Status */}
                    <td className="px-4 py-4 text-center">
                      <Badge
                        className={cn(
                          "text-xs font-black border-none px-3 py-1",
                          row.status === "COMPLETED"
                            ? "bg-emerald-100 text-emerald-700"
                            : row.status === "FAILED"
                            ? "bg-rose-100 text-rose-600"
                            : "bg-blue-100 text-blue-700"
                        )}
                      >
                        {row.status === "COMPLETED"
                          ? "Selesai"
                          : row.status === "FAILED"
                          ? "Gagal"
                          : "Berjalan"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
