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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { LearningHistoryTable } from "./LearningHistoryTable";
import { toast } from "sonner";
import {
  createWorkbook,
  styleTitle,
  styleSubtitle,
  styleHeaderRow,
  applyDataRow,
  applyStatusCell,
  applyPassedCell,
  applyCorrectCell,
  centerCols,
  addSectionHeader,
  finalizeSheet,
  downloadExcel,
} from "@/lib/excel-template";

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
      const wb = createWorkbook();

      // ── Sheet 1: Profil & Ringkasan ──────────────────────────────────────
      const s1 = wb.addWorksheet("Profil & Ringkasan");
      s1.columns = [{ key: "label", width: 26 }, { key: "value", width: 40 }];

      styleTitle(s1, 1, `Profil Karyawan — ${user.name}`, 2);
      styleSubtitle(s1, 2, 2);

      s1.addRow({});

      addSectionHeader(s1, "Data Diri Karyawan", 2);
      const profileFields: [string, any][] = [
        ["Nama Lengkap", user.name],
        ["NIP", user.nip || "-"],
        ["Email", user.email],
        ["Departemen", user.department || "-"],
        ["Lokasi / Kantor", user.lokasi || "-"],
        ["Terdaftar Sejak", new Date(user.createdAt).toLocaleDateString("id-ID")],
      ];
      profileFields.forEach(([label, value], i) => {
        const row = s1.addRow({ label, value });
        applyDataRow(row, i);
        row.getCell("label").font = { bold: true, size: 10, name: "Calibri" };
      });

      s1.addRow({});
      addSectionHeader(s1, "Ringkasan Pembelajaran", 2);
      const summaryFields: [string, any][] = [
        ["Total Kursus Diikuti", summary.totalEnrollments],
        ["Kursus Selesai", summary.completed],
        ["Kursus Gagal", summary.failed],
        ["Kursus Berjalan", summary.inProgress],
        ["Rata-rata Nilai Post-Test", summary.avgPostScore.toFixed(1)],
        ["Tingkat Penyelesaian", `${summary.complianceRate.toFixed(1)}%`],
      ];
      summaryFields.forEach(([label, value], i) => {
        const row = s1.addRow({ label, value });
        applyDataRow(row, i);
        row.getCell("label").font = { size: 10, name: "Calibri" };
        row.getCell("value").font = { bold: true, size: 10, name: "Calibri" };
      });

      // ── Sheet 2: Riwayat Kursus ─────────────────────────────────────────
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

      styleTitle(s2, 1, `Riwayat Kursus — ${user.name}`, 10);
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
      finalizeSheet(s2, 10);

      // ── Sheet 3: Log Percobaan Test ─────────────────────────────────────
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

      styleTitle(s3, 1, `Log Percobaan Test — ${user.name}`, 8);
      styleSubtitle(s3, 2, 8);
      styleHeaderRow(s3, 3);

      const allAttempts = enrollments.flatMap((e) =>
        e.testAttempts.map((a: any, idx: number) => {
          const duration =
            a.completedAt && a.startedAt
              ? Math.round(
                  (new Date(a.completedAt).getTime() - new Date(a.startedAt).getTime()) / 60000
                )
              : null;
          return {
            course: e.course.title,
            type: a.test?.type === "PRE" ? "Pre-Test" : "Post-Test",
            attempt: a.attemptNumber || (idx + 1),
            score: a.score ?? "—",
            kkm: a.test?.passingScore || 70,
            passed: a.passed,
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
      finalizeSheet(s3, 8);

      // ── Sheet 4: Detail Jawaban ─────────────────────────────────────────
      const s4 = wb.addWorksheet("Detail Jawaban");
      s4.columns = [
        { header: "Kursus", key: "course", width: 30 },
        { header: "Jenis Test", key: "type", width: 13 },
        { header: "Percobaan ke-", key: "attempt", width: 14 },
        { header: "No Soal", key: "no", width: 10 },
        { header: "Pertanyaan", key: "question", width: 46 },
        { header: "Jawaban Karyawan", key: "selected", width: 28 },
        { header: "Kunci Jawaban", key: "correctAns", width: 28 },
        { header: "Hasil", key: "result", width: 12 },
      ];

      styleTitle(s4, 1, `Detail Jawaban Test — ${user.name}`, 8);
      styleSubtitle(s4, 2, 8);
      styleHeaderRow(s4, 3);

      const allAnswers = enrollments.flatMap((e) =>
        e.testAttempts.flatMap((a: any, attemptIdx: number) =>
          (a.answers ?? []).map((ans: any, qIdx: number) => ({
            course: e.course.title,
            type: a.test?.type === "PRE" ? "Pre-Test" : "Post-Test",
            attempt: a.attemptNumber || (attemptIdx + 1),
            no: qIdx + 1,
            question: ans.question?.text ?? "—",
            selected: ans.selectedOption?.text ?? "Tidak dijawab",
            correctAns: ans.question?.options?.find((o: any) => o.isCorrect)?.text ?? "—",
            isCorrect: ans.isCorrect,
          }))
        )
      );

      if (allAnswers.length === 0) {
        const infoRow = s4.addRow([]);
        s4.mergeCells(infoRow.number, 1, infoRow.number, 8);
        const infoCell = s4.getCell(infoRow.number, 1);
        infoCell.value =
          "Detail jawaban tidak tersedia — data hanya ada untuk test yang dikerjakan setelah pembaruan sistem.";
        infoCell.font = { italic: true, size: 10, color: { argb: "FF888888" } };
        infoCell.alignment = { horizontal: "center", vertical: "middle" };
        infoRow.height = 28;
      } else {
        allAnswers.forEach((a, i) => {
          const row = s4.addRow(a);
          applyDataRow(row, i);
          applyCorrectCell(row.getCell("result"), a.isCorrect);
          centerCols(row, ["type", "attempt", "no"]);
          row.getCell("question").alignment = { vertical: "middle", wrapText: true };
          row.height = a.question.length > 80 ? 32 : 19;
        });
      }
      finalizeSheet(s4, 8);

      const fileName = `Rekap_${user.name?.replace(/\s+/g, "_")}_${Date.now()}.xlsx`;
      await downloadExcel(wb, fileName);
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
      icon: FileSpreadsheet,
      variant: "default" as const,
    },
    {
      label: "Kursus selesai",
      value: summary.completed,
      icon: Trophy,
      variant: "success" as const,
    },
    {
      label: "Rata-rata post-test",
      value: summary.avgPostScore.toFixed(1),
      icon: Activity,
      variant: "warning" as const,
    },
    {
      label: "Tingkat penyelesaian",
      value: `${summary.complianceRate.toFixed(1)}%`,
      icon: GraduationCap,
      variant: "info" as const,
    },
  ];

  const complianceOk = summary.complianceRate >= 80;

  return (
    <div className="w-full space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/admin/users">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Profil Karyawan</p>
            <h1 className="text-base font-bold text-[#0F1C3F]">{user.name}</h1>
          </div>
        </div>
        <Button
          onClick={handleExportExcel}
          disabled={isExporting}
          size="sm"
          className="h-8 gap-1.5 bg-[#0F1C3F] hover:bg-[#1A3060] text-white text-xs"
        >
          {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
          Export
        </Button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-3">
        {statCards.map((stat) => (
          <Card key={stat.label} className="border-none shadow-sm">
            <CardContent className="p-3 flex items-center gap-3">
              <div className={cn(
                "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                stat.variant === "success" && "bg-emerald-100 text-emerald-600",
                stat.variant === "warning" && "bg-amber-100 text-amber-600",
                stat.variant === "info" && "bg-blue-100 text-blue-600",
                stat.variant === "default" && "bg-slate-100 text-slate-600"
              )}>
                <stat.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-lg font-bold text-[#0F1C3F] leading-none">{stat.value}</p>
                <p className="text-[10px] text-slate-500 truncate">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Profile */}
        <Card className="border-none shadow-md h-fit">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="h-12 w-12 border-2 border-[#E8A020]">
                <AvatarFallback className="bg-[#0F1C3F] text-white text-sm font-bold">
                  {user.name?.charAt(0)?.toUpperCase() ?? "?"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-slate-900 truncate">{user.name}</h2>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-xs">
                <Contact className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="text-slate-500">NIP:</span>
                <span className="font-medium text-slate-700">{user.nip || "—"}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="text-slate-500">Dept:</span>
                <span className="font-medium text-slate-700">{user.department || "—"}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="text-slate-500">Lokasi:</span>
                <span className="font-medium text-slate-700">{user.lokasi || "—"}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="text-slate-500">Terdaftar:</span>
                <span className="font-medium text-slate-700">
                  {new Date(user.createdAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>

            <Separator className="my-3" />

            <div className={cn(
              "flex items-center gap-2 p-2.5 rounded-lg",
              complianceOk ? "bg-emerald-50" : "bg-amber-50"
            )}>
              <div className={cn(
                "h-6 w-6 rounded-full flex items-center justify-center text-white text-xs",
                complianceOk ? "bg-emerald-500" : "bg-amber-500"
              )}>
                <CheckCircle className="h-3.5 w-3.5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase">Compliance</p>
                <p className="text-sm font-bold text-slate-900">{summary.complianceRate.toFixed(0)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border-none shadow-md lg:col-span-2">
          <CardHeader className="py-3 px-4 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-[#0F1C3F] flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-[#E8A020]" />
              Riwayat Kursus
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <LearningHistoryTable enrollments={enrollments} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
