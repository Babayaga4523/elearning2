"use client";

import { useState, useCallback } from "react";
import {
  MapPin,
  Building2,
  Contact,
  Download,
  ArrowLeft,
  Calendar,
  GraduationCap,
  Trophy,
  Activity,
  CheckCircle,
  FileSpreadsheet,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { LearningHistoryTable } from "./LearningHistoryTable";
import { toast } from "sonner";

interface UserDetailClientProps {
  user: any;
  enrollments: any[];
  summary: {
    totalEnrollments: number;
    completed: number;
    failed: number;
    inProgress: number;
    avgPostScore: number;
    complianceRate: number;
  };
}

const surface = {
  card: {
    background: "white",
    border: "1px solid #E2E6F0",
    boxShadow: "0 1px 4px rgba(15,28,63,0.06)",
  },
};

export function UserDetailClient({ user, enrollments, summary }: UserDetailClientProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportExcel = useCallback(async () => {
    setIsExporting(true);
    toast.info("Menyiapkan data audit lengkap...");

    try {
      const wb = new ExcelJS.Workbook();
      wb.creator = "HCMS E-Learning — BNI Finance";
      wb.created = new Date();

      const NAVY = "FF0F1C3F";
      const GOLD = "FFE8A020";
      const WHITE = "FFFFFFFF";
      const ZEBRA = "FFF5F7FA";
      const BORDER = "FFDDDDDD";

      const styleTitle = (cell: ExcelJS.Cell, value: string, cols: number, sheet: ExcelJS.Worksheet, row: number) => {
        sheet.mergeCells(row, 1, row, cols);
        cell.value = value.toUpperCase();
        cell.font = { bold: true, size: 14, color: { argb: WHITE } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        sheet.getRow(row).height = 35;
      };

      const styleSubtitle = (sheet: ExcelJS.Worksheet, row: number, cols: number) => {
        sheet.mergeCells(row, 1, row, cols);
        const cell = sheet.getCell(row, 1);
        cell.value = `Tanggal Audit: ${new Date().toLocaleDateString("id-ID", { dateStyle: "long", timeStyle: "short" })} — Rekap HCMS BNI Finance`;
        cell.font = { italic: true, size: 10, color: { argb: "FF666666" } };
        cell.alignment = { horizontal: "center" };
        sheet.getRow(row).height = 20;
      };

      const styleHeaderRow = (sheet: ExcelJS.Worksheet, rowNumber: number) => {
        const row = sheet.getRow(rowNumber);
        row.height = 25;
        sheet.columns.forEach((col, i) => {
          const cell = row.getCell(i + 1);
          cell.value = col.header as any;
          cell.font = { bold: true, size: 10, color: { argb: NAVY } }; // Navy text on Gold
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GOLD } };
          cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });
      };

      const applyDataRow = (row: ExcelJS.Row, index: number) => {
        const bg = index % 2 === 0 ? ZEBRA : WHITE;
        row.height = 18;
        row.eachCell({ includeEmpty: true }, (cell) => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
          cell.font = { size: 10 };
          cell.alignment = { vertical: "middle" };
          cell.border = {
            bottom: { style: "hair", color: { argb: BORDER } },
            right: { style: "hair", color: { argb: BORDER } },
          };
        });
      };

      const applyStatusCell = (cell: ExcelJS.Cell, status: string) => {
        const map: Record<string, { fg: string; text: string; label: string }> = {
          COMPLETED: { fg: "FFDCFCE7", text: "FF166534", label: "Selesai" },
          FAILED: { fg: "FFFEE2E2", text: "FF991B1B", label: "Gagal" },
          IN_PROGRESS: { fg: "FFDBEAFE", text: "FF1D4ED8", label: "Berjalan" },
        };
        const s = map[status] ?? { fg: "FFF1F5F9", text: "FF64748B", label: status };
        cell.value = s.label;
        cell.font = { bold: true, size: 10, color: { argb: s.text } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: s.fg } };
        cell.alignment = { horizontal: "center", vertical: "middle" };
      };

      const applyPassedCell = (cell: ExcelJS.Cell, passed: boolean | null) => {
        if (passed === null) {
          cell.value = "—";
          return;
        }
        cell.value = passed ? "Lulus" : "Tidak Lulus";
        cell.font = { bold: true, size: 10, color: { argb: passed ? "FF166534" : "FF991B1B" } };
        cell.alignment = { horizontal: "center", vertical: "middle" };
      };

      const applyCorrectCell = (cell: ExcelJS.Cell, correct: boolean) => {
        cell.value = correct ? "Benar" : "Salah";
        cell.font = { bold: true, size: 10, color: { argb: correct ? "FF166534" : "FF991B1B" } };
        cell.alignment = { horizontal: "center", vertical: "middle" };
      };

      const centerCols = (row: ExcelJS.Row, keys: string[]) => {
        keys.forEach((k) => {
          row.getCell(k).alignment = { horizontal: "center", vertical: "middle" };
        });
      };

      const s1 = wb.addWorksheet("Profil & Ringkasan");
      s1.columns = [{ key: "label", width: 24 }, { key: "value", width: 38 }];

      styleTitle(s1.getCell(1, 1), `Profil Karyawan — ${user.name}`, 2, s1, 1);
      styleSubtitle(s1, 2, 2);

      const profileFields: [string, any][] = [
        ["Nama Lengkap", user.name],
        ["NIP", user.nip || "-"],
        ["Email", user.email],
        ["Departemen", user.department || "-"],
        ["Lokasi / Kantor", user.lokasi || "-"],
        ["Terdaftar Sejak", new Date(user.createdAt).toLocaleDateString("id-ID")],
      ];

      s1.addRow({});
      profileFields.forEach(([label, value], i) => {
        const row = s1.addRow({ label, value });
        row.height = 18;
        const lc = row.getCell("label");
        const vc = row.getCell("value");
        lc.font = { bold: true, size: 10, color: { argb: "FF0F1C3F" } };
        lc.fill = { type: "pattern", pattern: "solid", fgColor: { argb: i % 2 === 0 ? "FFF0F4FF" : WHITE } };
        vc.font = { size: 10 };
        vc.fill = { type: "pattern", pattern: "solid", fgColor: { argb: i % 2 === 0 ? ZEBRA : WHITE } };
        [lc, vc].forEach((c) => {
          c.border = { bottom: { style: "hair", color: { argb: BORDER } } };
          c.alignment = { vertical: "middle" };
        });
      });

      s1.addRow({});
      const sumTitle = s1.addRow({ label: "Ringkasan Pembelajaran" });
      s1.mergeCells(sumTitle.number, 1, sumTitle.number, 2);
      const sumTitleCell = s1.getCell(sumTitle.number, 1);
      sumTitleCell.font = { bold: true, size: 10, color: { argb: WHITE } };
      sumTitleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GOLD } };
      sumTitleCell.alignment = { horizontal: "left", vertical: "middle" };
      sumTitle.height = 20;

      const summaryFields: [string, any][] = [
        ["Total Kursus Diikuti", summary.totalEnrollments],
        ["Kursus Selesai", summary.completed],
        ["Kursus Gagal", summary.failed],
        ["Kursus Berjalan", summary.inProgress],
        ["Rata-rata Nilai Post", summary.avgPostScore.toFixed(1)],
        ["Tingkat penyelesaian", `${summary.complianceRate.toFixed(1)}%`],
      ];

      summaryFields.forEach(([label, value], i) => {
        const row = s1.addRow({ label, value });
        row.height = 18;
        const lc = row.getCell("label");
        const vc = row.getCell("value");
        lc.font = { size: 10 };
        lc.fill = { type: "pattern", pattern: "solid", fgColor: { argb: i % 2 === 0 ? "FFF0F4FF" : WHITE } };
        vc.font = { bold: true, size: 10, color: { argb: NAVY } };
        vc.fill = { type: "pattern", pattern: "solid", fgColor: { argb: i % 2 === 0 ? ZEBRA : WHITE } };
        [lc, vc].forEach((c) => {
          c.border = { bottom: { style: "hair", color: { argb: BORDER } } };
          c.alignment = { vertical: "middle" };
        });
      });

      const s2 = wb.addWorksheet("Riwayat Kursus");
      s2.columns = [
        { header: "Judul Kursus", key: "title", width: 36 },
        { header: "Status", key: "status", width: 14 },
        { header: "Tgl Daftar", key: "enrolledAt", width: 15 },
        { header: "Progress (%)", key: "progress", width: 14 },
        { header: "Modul Selesai", key: "doneModules", width: 14 },
        { header: "Total Modul", key: "totalModules", width: 13 },
        { header: "Nilai Pre-Test", key: "preScore", width: 16 },
        { header: "Lulus Pre-Test", key: "prePassed", width: 16 },
        { header: "Nilai Post-Test", key: "postScore", width: 16 },
        { header: "Lulus Post-Test", key: "postPassed", width: 16 },
      ];

      styleTitle(s2.getCell(1, 1), `Riwayat Kursus — ${user.name}`, 10, s2, 1);
      styleSubtitle(s2, 2, 10);
      styleHeaderRow(s2, 3);

      enrollments.forEach((e, i) => {
        const row = s2.addRow({
          title: e.course.title,
          status: e.status,
          enrolledAt: new Date(e.enrolledAt).toLocaleDateString("id-ID"),
          progress: e.moduleProgress,
          doneModules: e.completedModules,
          totalModules: e.totalModules,
          preScore: e.preScore ?? "—",
          prePassed: null,
          postScore: e.postScore ?? "—",
          postPassed: null,
        });
        applyDataRow(row, i);
        applyStatusCell(row.getCell("status"), e.status);
        applyPassedCell(row.getCell("prePassed"), e.preTestPassed);
        applyPassedCell(row.getCell("postPassed"), e.postTestPassed);
        centerCols(row, ["enrolledAt", "progress", "doneModules", "totalModules", "preScore", "postScore"]);
      });

      s2.views = [{ state: "frozen", xSplit: 0, ySplit: 3 }];
      s2.autoFilter = { from: "A3", to: "J3" };

      const s3 = wb.addWorksheet("Log Percobaan Test");
      s3.columns = [
        { header: "Kursus", key: "course", width: 36 },
        { header: "Jenis Test", key: "type", width: 13 },
        { header: "Percobaan ke-", key: "attempt", width: 14 },
        { header: "Nilai", key: "score", width: 10 },
        { header: "KKM", key: "kkm", width: 10 },
        { header: "Hasil", key: "passed", width: 14 },
        { header: "Durasi (menit)", key: "duration", width: 16 },
        { header: "Tanggal", key: "date", width: 20 },
      ];

      styleTitle(s3.getCell(1, 1), `Log Percobaan Test — ${user.name}`, 8, s3, 1);
      styleSubtitle(s3, 2, 8);
      styleHeaderRow(s3, 3);

      const allAttempts = enrollments.flatMap((e) =>
        e.testAttempts.map((a: any, idx: number) => {
          const duration =
            a.completedAt && a.startedAt
              ? Math.round((new Date(a.completedAt).getTime() - new Date(a.startedAt).getTime()) / 60000)
              : null;
          return {
            course: e.course.title,
            type: a.type === "PRE_TEST" ? "Pre-Test" : "Post-Test",
            attempt: idx + 1,
            score: a.score,
            kkm: a.passingScore || 70,
            passed: a.isPassed,
            duration: duration ?? "—",
            date: new Date(a.createdAt).toLocaleString("id-ID"),
          };
        })
      );

      allAttempts.forEach((a, i) => {
        const row = s3.addRow(a);
        applyDataRow(row, i);
        applyPassedCell(row.getCell("passed"), a.passed);
        centerCols(row, ["type", "attempt", "score", "kkm", "duration"]);
        row.getCell("date").alignment = { horizontal: "center", vertical: "middle" };
      });

      s3.views = [{ state: "frozen", xSplit: 0, ySplit: 3 }];
      s3.autoFilter = { from: "A3", to: "H3" };

      const s4 = wb.addWorksheet("Detail Jawaban");
      s4.columns = [
        { header: "Kursus", key: "course", width: 30 },
        { header: "Jenis Test", key: "type", width: 13 },
        { header: "Percobaan ke-", key: "attempt", width: 14 },
        { header: "No Soal", key: "no", width: 10 },
        { header: "Pertanyaan", key: "question", width: 46 },
        { header: "Jawaban Karyawan", key: "selected", width: 28 },
        { header: "Kunci Jawaban", key: "correct", width: 28 },
        { header: "Hasil", key: "result", width: 12 },
      ];

      styleTitle(s4.getCell(1, 1), `Detail Jawaban Test — ${user.name}`, 8, s4, 1);
      styleSubtitle(s4, 2, 8);
      styleHeaderRow(s4, 3);

      const allAnswers = enrollments.flatMap((e) =>
        e.testAttempts.flatMap((a: any, attemptIdx: number) =>
          (a.testAnswers ?? []).map((ans: any, qIdx: number) => ({
            course: e.course.title,
            type: a.type === "PRE_TEST" ? "Pre-Test" : "Post-Test",
            attempt: attemptIdx + 1,
            no: qIdx + 1,
            question: ans.question?.text ?? "—",
            selected: ans.selectedOption?.text ?? "Tidak dijawab",
            correct: ans.question?.options?.find((o: any) => o.isCorrect)?.text ?? "—",
            isCorrect: ans.isCorrect,
          }))
        )
      );

      if (allAnswers.length === 0) {
        s4.mergeCells(4, 1, 4, 8);
        const infoCell = s4.getCell(4, 1);
        infoCell.value =
          "Detail jawaban tidak tersedia — data hanya ada untuk test yang dikerjakan setelah pembaruan sistem.";
        infoCell.font = { italic: true, size: 10, color: { argb: "FF888888" } };
        infoCell.alignment = { horizontal: "center", vertical: "middle" };
        s4.getRow(4).height = 28;
      } else {
        allAnswers.forEach((a, i) => {
          const row = s4.addRow({
            course: a.course,
            type: a.type,
            attempt: a.attempt,
            no: a.no,
            question: a.question,
            selected: a.selected,
            correct: a.correct,
            result: a.isCorrect,
          });
          applyDataRow(row, i);
          applyCorrectCell(row.getCell("result"), a.isCorrect);
          centerCols(row, ["type", "attempt", "no"]);
          row.getCell("question").alignment = { vertical: "middle", wrapText: true };
          row.height = a.question.length > 80 ? 30 : 18;
        });
      }

      s4.views = [{ state: "frozen", xSplit: 0, ySplit: 3 }];
      s4.autoFilter = { from: "A3", to: "H3" };

      const buffer = await wb.xlsx.writeBuffer();
      const fileName = `Rekap_${user.name?.replace(/\s+/g, "_")}_${Date.now()}.xlsx`;
      saveAs(new Blob([buffer]), fileName);
      toast.success("Rekap audit berhasil diunduh.");
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengekspor data Excel.");
    } finally {
      setIsExporting(false);
    }
  }, [user, enrollments, summary]);

  const statCards = [
    {
      label: "Kursus terdaftar",
      value: summary.totalEnrollments,
      icon: <FileSpreadsheet className="h-5 w-5" />,
      iconBg: "#EEF2FF",
      iconColor: "#0F1C3F",
    },
    {
      label: "Kursus selesai",
      value: summary.completed,
      icon: <Trophy className="h-5 w-5" />,
      iconBg: "#F0FDF4",
      iconColor: "#059669",
    },
    {
      label: "Rata-rata post-test",
      value: summary.avgPostScore.toFixed(1),
      icon: <Activity className="h-5 w-5" />,
      iconBg: "#FFF8E7",
      iconColor: "#C28700",
    },
    {
      label: "Tingkat penyelesaian",
      value: `${summary.complianceRate.toFixed(1)}%`,
      icon: <GraduationCap className="h-5 w-5" />,
      iconBg: "#F1F5F9",
      iconColor: "#0F1C3F",
    },
  ];

  const complianceOk = summary.complianceRate >= 80;

  return (
    <div
      className="w-full min-w-0 space-y-6 pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 md:space-y-8"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Top bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <Link href="/admin/users">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 shrink-0 rounded-lg border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-[#0F1C3F]"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="min-w-0">
            <p
              className="mb-1 text-[10px] font-black uppercase tracking-[0.2em]"
              style={{ color: "#9AAABF" }}
            >
              Profil karyawan
            </p>
            <h1
              className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl"
              style={{ color: "#0F1C3F", fontFamily: "'Lexend Deca', sans-serif" }}
            >
              {user.name ?? "Karyawan"}
            </h1>
            <p className="mt-0.5 text-sm font-medium" style={{ color: "#7A8599" }}>
              Ringkasan enrollment, modul, dan hasil tes — diekspor ke Excel untuk audit HC.
            </p>
          </div>
        </div>
        <Button
          onClick={handleExportExcel}
          disabled={isExporting}
          className="h-10 shrink-0 gap-2 rounded-xl border-0 px-5 font-black text-white shadow-md sm:self-start"
          style={{
            background: "linear-gradient(135deg, #0F1C3F, #1A3060)",
            boxShadow: "0 4px 16px rgba(15,28,63,0.25)",
          }}
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin text-white" />
          ) : (
            <Download className="h-4 w-4 text-[#E8A020]" />
          )}
          Export rekap Excel
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
        {/* Profil */}
        <div className="space-y-4 lg:col-span-4">
          <div className="overflow-hidden rounded-2xl" style={surface.card}>
            <div
              className="relative h-28 border-b border-[#E8A020]/40"
              style={{
                background: "linear-gradient(135deg, #0F1C3F 0%, #1A3060 55%, #243a6b 100%)",
              }}
            >
              <div className="absolute -bottom-10 left-5 md:left-6">
                <div className="rounded-2xl border-4 border-white bg-white p-1 shadow-lg">
                  <div
                    className="flex h-20 w-20 items-center justify-center rounded-xl text-2xl font-black md:h-[5.25rem] md:w-[5.25rem] md:text-3xl"
                    style={{
                      background: "#F0F2F7",
                      color: "#0F1C3F",
                    }}
                  >
                    {user.name?.charAt(0)?.toUpperCase() ?? "?"}
                  </div>
                </div>
              </div>
            </div>
            <CardContent className="space-y-5 px-5 pb-6 pt-14 md:px-6">
              <div>
                <h2
                  className="text-lg font-black leading-tight text-slate-900 md:text-xl"
                  style={{ fontFamily: "'Lexend Deca', sans-serif" }}
                >
                  {user.name}
                </h2>
                <p className="mt-1 truncate text-sm font-semibold text-slate-500">{user.email}</p>
              </div>

              <div className="space-y-3">
                {[
                  { icon: Contact, label: "NIP", value: user.nip || "—" },
                  { icon: Building2, label: "Departemen", value: user.department || "—" },
                  { icon: MapPin, label: "Lokasi", value: user.lokasi || "—" },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-3"
                  >
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: "#EEF2FF", color: "#0F1C3F" }}
                    >
                      <row.icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                        {row.label}
                      </p>
                      <p className="truncate text-sm font-bold text-slate-800">{row.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-semibold text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  Terdaftar sejak
                </span>
                <span className="text-slate-800">
                  {new Date(user.createdAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            </CardContent>
          </div>

          <div
            className={cn(
              "flex items-center gap-4 rounded-2xl border p-4 md:p-5",
              complianceOk
                ? "border-emerald-200 bg-emerald-50/90"
                : "border-amber-200 bg-amber-50/90"
            )}
          >
            <div
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white",
                complianceOk ? "bg-emerald-600" : "bg-amber-600"
              )}
            >
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                Tingkat penyelesaian
              </p>
              <p className="text-lg font-black text-slate-900">
                {summary.complianceRate.toFixed(0)}% —{" "}
                {complianceOk ? "Memenuhi target" : "Perlu tindak lanjut"}
              </p>
              <p className="mt-0.5 text-xs text-slate-600">
                Proporsi kursus dengan status selesai dari total enrollment.
              </p>
            </div>
          </div>
        </div>

        {/* Ringkasan + tabel */}
        <div className="space-y-6 lg:col-span-8">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {statCards.map((s) => (
              <div
                key={s.label}
                className="flex flex-col rounded-2xl p-4 transition-all hover:-translate-y-0.5 hover:shadow-md md:p-5"
                style={surface.card}
              >
                <div
                  className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: s.iconBg, color: s.iconColor }}
                >
                  {s.icon}
                </div>
                <p
                  className="text-xl font-black leading-none md:text-2xl"
                  style={{ color: "#0F1C3F", fontFamily: "'Lexend Deca', sans-serif" }}
                >
                  {s.value}
                </p>
                <p
                  className="mt-2 text-[10px] font-black uppercase tracking-wider"
                  style={{ color: "#9AAABF" }}
                >
                  {s.label}
                </p>
              </div>
            ))}
          </div>

          <LearningHistoryTable enrollments={enrollments} />
        </div>
      </div>
    </div>
  );
}
