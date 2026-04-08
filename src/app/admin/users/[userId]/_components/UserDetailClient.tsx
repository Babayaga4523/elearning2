"use client";

import { useState, useCallback } from "react";
import { 
  User, 
  MapPin, 
  Building2, 
  Mail, 
  Contact, 
  Download, 
  ArrowLeft,
  Calendar,
  GraduationCap,
  Trophy,
  Activity,
  CheckCircle,
  Clock,
  FileSpreadsheet,
  AlertCircle,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { LearningHistoryTable } from "./LearningHistoryTable";
import { getAllUserTestDetails } from "@/actions/test";
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

export function UserDetailClient({ user, enrollments, summary }: UserDetailClientProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportExcel = useCallback(async () => {
    setIsExporting(true);
    toast.info("Menyiapkan data audit lengkap...");
    
    try {
      const wb = new ExcelJS.Workbook();
      wb.creator = "HCMS E-Learning — BNI Finance";
      wb.created = new Date();

      // ─── Helper styles ────────────────────────────────────────────
      const NAVY   = "FF0F1C3F";
      const GOLD   = "FFE8A020";
      const WHITE  = "FFFFFFFF";
      const ZEBRA  = "FFF5F7FA";
      const BORDER = "FFDDDDDD";

      const styleTitle = (cell: ExcelJS.Cell, value: string, cols: number, sheet: ExcelJS.Worksheet, row: number) => {
        sheet.mergeCells(row, 1, row, cols);
        cell.value = value;
        cell.font = { bold: true, size: 13, color: { argb: WHITE } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        sheet.getRow(row).height = 32;
      };

      const styleSubtitle = (sheet: ExcelJS.Worksheet, row: number, cols: number) => {
        sheet.mergeCells(row, 1, row, cols);
        const cell = sheet.getCell(row, 1);
        cell.value = `Diekspor: ${new Date().toLocaleDateString("id-ID", { dateStyle: "long" })} — HCMS BNI Finance`;
        cell.font = { italic: true, size: 10, color: { argb: "FF888888" } };
        cell.alignment = { horizontal: "center" };
        sheet.getRow(row).height = 16;
      };

      const styleHeaderRow = (sheet: ExcelJS.Worksheet, rowNumber: number) => {
        const row = sheet.getRow(rowNumber);
        row.height = 22;
        sheet.columns.forEach((col, i) => {
          const cell = row.getCell(i + 1);
          cell.value = col.header as any;
          cell.font = { bold: true, size: 10, color: { argb: WHITE } };
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GOLD } };
          cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
          cell.border = {
            bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
            right:  { style: "hair", color: { argb: "FFCCCCCC" } },
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
            right:  { style: "hair", color: { argb: BORDER } },
          };
        });
      };

      const applyStatusCell = (cell: ExcelJS.Cell, status: string) => {
        const map: Record<string, { fg: string; text: string; label: string }> = {
          COMPLETED:   { fg: "FFDCFCE7", text: "FF166534", label: "Selesai"  },
          FAILED:      { fg: "FFFEE2E2", text: "FF991B1B", label: "Gagal"    },
          IN_PROGRESS: { fg: "FFDBEAFE", text: "FF1D4ED8", label: "Berjalan" },
        };
        const s = map[status] ?? { fg: "FFF1F5F9", text: "FF64748B", label: status };
        cell.value = s.label;
        cell.font = { bold: true, size: 10, color: { argb: s.text } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: s.fg } };
        cell.alignment = { horizontal: "center", vertical: "middle" };
      };

      const applyPassedCell = (cell: ExcelJS.Cell, passed: boolean | null) => {
        if (passed === null) { cell.value = "—"; return; }
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

      // ════════════════════════════════════════════════════════════════
      // SHEET 1 — Profil & Ringkasan
      // ════════════════════════════════════════════════════════════════
      const s1 = wb.addWorksheet("Profil & Ringkasan");
      s1.columns = [{ key: "label", width: 24 }, { key: "value", width: 38 }];

      styleTitle(s1.getCell(1, 1), `Profil Karyawan — ${user.name}`, 2, s1, 1);
      styleSubtitle(s1, 2, 2);

      // Profil section
      const profileFields: [string, any][] = [
        ["Nama Lengkap",   user.name],
        ["NIP",            user.nip || "-"],
        ["Email",          user.email],
        ["Departemen",     user.department || "-"],
        ["Lokasi / Kantor",user.lokasi || "-"],
        ["Terdaftar Sejak",new Date(user.createdAt).toLocaleDateString("id-ID")],
      ];

      s1.addRow({}); // spacer row 3
      profileFields.forEach(([label, value], i) => {
        const row = s1.addRow({ label, value });
        row.height = 18;
        const lc = row.getCell("label");
        const vc = row.getCell("value");
        lc.font = { bold: true, size: 10, color: { argb: "FF0F1C3F" } };
        lc.fill = { type: "pattern", pattern: "solid", fgColor: { argb: i % 2 === 0 ? "FFF0F4FF" : WHITE } };
        vc.font = { size: 10 };
        vc.fill = { type: "pattern", pattern: "solid", fgColor: { argb: i % 2 === 0 ? ZEBRA : WHITE } };
        [lc, vc].forEach(c => {
          c.border = { bottom: { style: "hair", color: { argb: BORDER } } };
          c.alignment = { vertical: "middle" };
        });
      });

      // Summary section
      s1.addRow({});
      const sumTitle = s1.addRow({ label: "Ringkasan Pembelajaran" });
      s1.mergeCells(sumTitle.number, 1, sumTitle.number, 2);
      const sumTitleCell = s1.getCell(sumTitle.number, 1);
      sumTitleCell.font = { bold: true, size: 10, color: { argb: WHITE } };
      sumTitleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GOLD } };
      sumTitleCell.alignment = { horizontal: "left", vertical: "middle" };
      sumTitle.height = 20;

      const summaryFields: [string, any][] = [
        ["Total Kursus Diikuti",   summary.totalEnrollments],
        ["Kursus Selesai",         summary.completed],
        ["Kursus Gagal",           summary.failed],
        ["Kursus Berjalan",        summary.inProgress],
        ["Rata-rata Nilai Post",   summary.avgPostScore.toFixed(1)],
        ["Compliance Rate",        `${summary.complianceRate.toFixed(1)}%`],
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
        [lc, vc].forEach(c => {
          c.border = { bottom: { style: "hair", color: { argb: BORDER } } };
          c.alignment = { vertical: "middle" };
        });
      });

      // ════════════════════════════════════════════════════════════════
      // SHEET 2 — Riwayat Kursus
      // ════════════════════════════════════════════════════════════════
      const s2 = wb.addWorksheet("Riwayat Kursus");
      s2.columns = [
        { header: "Judul Kursus",       key: "title",          width: 36 },
        { header: "Status",             key: "status",         width: 14 },
        { header: "Tgl Daftar",         key: "enrolledAt",     width: 15 },
        { header: "Progress (%)",       key: "progress",       width: 14 },
        { header: "Modul Selesai",      key: "doneModules",    width: 14 },
        { header: "Total Modul",        key: "totalModules",   width: 13 },
        { header: "Nilai Pre-Test",     key: "preScore",       width: 16 },
        { header: "Lulus Pre-Test",     key: "prePassed",      width: 16 },
        { header: "Nilai Post-Test",    key: "postScore",      width: 16 },
        { header: "Lulus Post-Test",    key: "postPassed",     width: 16 },
      ];

      styleTitle(s2.getCell(1, 1), `Riwayat Kursus — ${user.name}`, 10, s2, 1);
      styleSubtitle(s2, 2, 10);
      styleHeaderRow(s2, 3);

      enrollments.forEach((e, i) => {
        const row = s2.addRow({
          title:        e.course.title,
          status:       e.status,
          enrolledAt:   new Date(e.enrolledAt).toLocaleDateString("id-ID"),
          progress:     e.moduleProgress,
          doneModules:  e.completedModules,
          totalModules: e.totalModules,
          preScore:     e.preScore ?? "—",
          prePassed:    null,
          postScore:    e.postScore ?? "—",
          postPassed:   null,
        });
        applyDataRow(row, i);
        applyStatusCell(row.getCell("status"), e.status);
        applyPassedCell(row.getCell("prePassed"), e.preTestPassed);
        applyPassedCell(row.getCell("postPassed"), e.postTestPassed);
        centerCols(row, ["enrolledAt","progress","doneModules","totalModules","preScore","postScore"]);
      });

      s2.views = [{ state: "frozen", xSplit: 0, ySplit: 3 }];
      s2.autoFilter = { from: "A3", to: "J3" };

      // ════════════════════════════════════════════════════════════════
      // SHEET 3 — Log Percobaan Test
      // ════════════════════════════════════════════════════════════════
      const s3 = wb.addWorksheet("Log Percobaan Test");
      s3.columns = [
        { header: "Kursus",          key: "course",    width: 36 },
        { header: "Jenis Test",      key: "type",      width: 13 },
        { header: "Percobaan ke-",   key: "attempt",   width: 14 },
        { header: "Nilai",           key: "score",     width: 10 },
        { header: "KKM",             key: "kkm",       width: 10 },
        { header: "Hasil",           key: "passed",    width: 14 },
        { header: "Durasi (menit)",  key: "duration",  width: 16 },
        { header: "Tanggal",         key: "date",      width: 20 },
      ];

      styleTitle(s3.getCell(1, 1), `Log Percobaan Test — ${user.name}`, 8, s3, 1);
      styleSubtitle(s3, 2, 8);
      styleHeaderRow(s3, 3);

      const allAttempts = enrollments.flatMap((e) =>
        e.testAttempts.map((a: any, idx: number) => {
          const duration = a.completedAt && a.startedAt
            ? Math.round((new Date(a.completedAt).getTime() - new Date(a.startedAt).getTime()) / 60000)
            : null;
          return {
            course:   e.course.title,
            type:     a.type === "PRE_TEST" ? "Pre-Test" : "Post-Test",
            attempt:  idx + 1,
            score:    a.score,
            kkm:      a.passingScore || 70,
            passed:   a.isPassed,
            duration: duration ?? "—",
            date:     new Date(a.createdAt).toLocaleString("id-ID"),
          };
        })
      );

      allAttempts.forEach((a, i) => {
        const row = s3.addRow(a);
        applyDataRow(row, i);
        applyPassedCell(row.getCell("passed"), a.passed);
        centerCols(row, ["type","attempt","score","kkm","duration"]);
        row.getCell("date").alignment = { horizontal: "center", vertical: "middle" };
      });

      s3.views = [{ state: "frozen", xSplit: 0, ySplit: 3 }];
      s3.autoFilter = { from: "A3", to: "H3" };

      // ════════════════════════════════════════════════════════════════
      // SHEET 4 — Detail Jawaban
      // ════════════════════════════════════════════════════════════════
      const s4 = wb.addWorksheet("Detail Jawaban");
      s4.columns = [
        { header: "Kursus",            key: "course",    width: 30 },
        { header: "Jenis Test",        key: "type",      width: 13 },
        { header: "Percobaan ke-",     key: "attempt",   width: 14 },
        { header: "No Soal",           key: "no",        width: 10 },
        { header: "Pertanyaan",        key: "question",  width: 46 },
        { header: "Jawaban Karyawan",  key: "selected",  width: 28 },
        { header: "Kunci Jawaban",     key: "correct",   width: 28 },
        { header: "Hasil",             key: "result",    width: 12 },
      ];

      styleTitle(s4.getCell(1, 1), `Detail Jawaban Test — ${user.name}`, 8, s4, 1);
      styleSubtitle(s4, 2, 8);
      styleHeaderRow(s4, 3);

      const allAnswers = enrollments.flatMap((e) =>
        e.testAttempts.flatMap((a: any, attemptIdx: number) =>
          (a.testAnswers ?? []).map((ans: any, qIdx: number) => ({
            course:    e.course.title,
            type:      a.type === "PRE_TEST" ? "Pre-Test" : "Post-Test",
            attempt:   attemptIdx + 1,
            no:        qIdx + 1,
            question:  ans.question?.text ?? "—",
            selected:  ans.selectedOption?.text ?? "Tidak dijawab",
            correct:   ans.question?.options?.find((o: any) => o.isCorrect)?.text ?? "—",
            isCorrect: ans.isCorrect,
          }))
        )
      );

      if (allAnswers.length === 0) {
        s4.mergeCells(4, 1, 4, 8);
        const infoCell = s4.getCell(4, 1);
        infoCell.value = "Detail jawaban tidak tersedia — data hanya ada untuk test yang dikerjakan setelah pembaruan sistem.";
        infoCell.font = { italic: true, size: 10, color: { argb: "FF888888" } };
        infoCell.alignment = { horizontal: "center", vertical: "middle" };
        s4.getRow(4).height = 28;
      } else {
        allAnswers.forEach((a, i) => {
          const row = s4.addRow({
            course:   a.course,
            type:     a.type,
            attempt:  a.attempt,
            no:       a.no,
            question: a.question,
            selected: a.selected,
            correct:  a.correct,
            result:   a.isCorrect,
          });
          applyDataRow(row, i);
          applyCorrectCell(row.getCell("result"), a.isCorrect);
          centerCols(row, ["type","attempt","no"]);
          row.getCell("question").alignment = { vertical: "middle", wrapText: true };
          row.height = a.question.length > 80 ? 30 : 18;
        });
      }

      s4.views = [{ state: "frozen", xSplit: 0, ySplit: 3 }];
      s4.autoFilter = { from: "A3", to: "H3" };

      // ─── Export ───────────────────────────────────────────────────
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
    { label: "Kursus Terdaftar", value: summary.totalEnrollments, icon: FileSpreadsheet, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Kursus Lulus", value: summary.completed, icon: Trophy, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Avg. Post-Test", value: summary.avgPostScore.toFixed(1), icon: Activity, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Compliance Rate", value: `${summary.complianceRate.toFixed(1)}%`, icon: GraduationCap, color: "text-indigo-600", bg: "bg-indigo-50" },
  ];

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 p-6 lg:p-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Top Navigation & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/users">
            <Button variant="ghost" size="icon" className="rounded-2xl hover:bg-white hover:shadow-md transition-all h-12 w-12 border border-slate-100">
              <ArrowLeft className="h-5 w-5 text-slate-600" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Detail Karyawan</h1>
            <p className="text-slate-500 font-medium text-sm mt-0.5">Analisis hasil belajar dan kepatuhan modul.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            onClick={handleExportExcel}
            disabled={isExporting}
            className="rounded-2xl h-12 px-6 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider shadow-xl shadow-slate-200 transition-all flex items-center gap-2"
          >
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Export Rekap Excel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white">
            <div className="h-32 bg-gradient-to-br from-indigo-600 via-primary to-blue-600 relative">
              <div className="absolute -bottom-12 left-8 p-1.5 bg-white rounded-[2rem] shadow-xl">
                 <div className="h-24 w-24 rounded-[1.5rem] bg-slate-100 flex items-center justify-center text-4xl font-black text-primary">
                   {user.name?.charAt(0)}
                 </div>
              </div>
            </div>
            <CardContent className="pt-16 pb-10 px-8">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 leading-tight">{user.name}</h2>
                  <p className="text-sm font-bold text-slate-400 mt-1">{user.email}</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center gap-4 p-4 rounded-3xl bg-slate-50 border border-slate-100/50">
                    <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                      <Contact className="h-5 w-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">NIP</p>
                      <p className="text-xs font-black text-slate-700">{user.nip || "-"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 rounded-3xl bg-slate-50 border border-slate-100/50">
                    <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                      <Building2 className="h-5 w-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">DEPARTEMEN</p>
                      <p className="text-xs font-black text-slate-700">{user.department || "-"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 rounded-3xl bg-slate-50 border border-slate-100/50">
                    <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                      <MapPin className="h-5 w-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">LOKASI</p>
                      <p className="text-xs font-black text-slate-700">{user.lokasi || "-"}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-50">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                    <span className="flex items-center gap-1.5 uppercase tracking-tighter">
                      <Calendar className="h-3 w-3" /> Terdaftar Sejak
                    </span>
                    <span className="text-slate-600">
                      {new Date(user.createdAt).toLocaleDateString("id-ID", { month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Compliance Status */}
          <Card className={cn(
            "border-none shadow-xl rounded-[2rem] p-6 flex items-center gap-4",
            summary.complianceRate >= 80 ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
          )}>
            <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
               <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Compliance Status</p>
              <p className="text-lg font-black leading-tight">
                {summary.complianceRate >= 80 ? "MEMENUHI SYARAT" : "PERLU TINDAK LANJUT"}
              </p>
            </div>
          </Card>
        </div>

        {/* Right Column: Summaries & Table */}
        <div className="lg:col-span-8 space-y-8">
          {/* Summary Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statCards.map((s) => (
              <Card key={s.label} className="border-none shadow-lg shadow-slate-100 rounded-3xl overflow-hidden bg-white group hover:translate-y-[-2px] transition-all">
                <CardContent className="p-6">
                  <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center mb-4 transition-colors", s.bg)}>
                    <s.icon className={cn("h-5 w-5", s.color)} />
                  </div>
                  <p className="text-2xl font-black text-slate-900 leading-none">{s.value}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mt-2 group-hover:text-slate-600 transition-colors">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Learning History Table */}
          <LearningHistoryTable enrollments={enrollments} />
        </div>
      </div>
    </div>
  );
}
