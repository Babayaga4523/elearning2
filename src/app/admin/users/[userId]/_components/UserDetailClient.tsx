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

interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  department: string | null;
  nip: string | null;
  lokasi: string | null;
  createdAt: Date | string;
}

interface EnrollmentWithProgress {
  id: string;
  courseId: string;
  status: string;
  createdAt: Date | string;
  enrolledAt?: Date | string; // alias for createdAt (API may return either)
  updatedAt?: Date | string;
  moduleProgress: number;
  completedModules: number;
  totalModules: number;
  preScore: number | null;
  preTestPassed: boolean | null;
  postScore: number | null;
  postTestPassed: boolean | null;
  course: { title: string; category?: { name: string } | null };
  testAttempts?: Array<{
    id: string;
    test?: { type: string; passingScore: number };
    score: number | null;
    passed: boolean | null;
    attemptNumber: number;
    startedAt: Date | string;
    completedAt?: Date | string;
    createdAt?: Date | string;
    answers?: Array<{
      question?: { text: string; options?: Array<{ isCorrect: boolean; text: string }> };
      selectedOption?: { text: string };
      isCorrect: boolean | null;
    }>;
  }>;
}

interface UserSummary {
  totalEnrollments: number;
  completed: number;
  failed: number;
  inProgress: number;
  avgPostScore: number;
  complianceRate: number;
}

interface UserDetailClientProps {
  user: UserProfile;
  enrollments: EnrollmentWithProgress[];
  summary: UserSummary;
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
        ["Email", user.email || "-"],
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
        { header: "Nilai Post-Test", key: "postScore", width: 16 },
      ];

      styleTitle(s2, 1, `Riwayat Kursus — ${user.name}`, 8);
      styleSubtitle(s2, 2, 8);
      styleHeaderRow(s2, 3);

      enrollments.forEach((e, i) => {
        const enrolledAt = e.enrolledAt ?? e.createdAt;
        const row = s2.addRow({
          title: e.course.title,
          status: e.status,
          enrolledAt: new Date(enrolledAt).toLocaleDateString("id-ID"),
          progress: e.moduleProgress,
          doneModules: e.completedModules,
          totalModules: e.totalModules,
          preScore: e.preScore ?? "—",
          postScore: e.postScore ?? "—",
        });
        applyDataRow(row, i);
        applyStatusCell(row.getCell("status"), e.status);
        centerCols(row, ["enrolledAt", "progress", "doneModules", "totalModules", "preScore", "postScore"]);
      });
      finalizeSheet(s2, 8);

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
        (e.testAttempts ?? []).map((a: { id: string; test?: { type: string; passingScore: number }; score: number | null; passed: boolean | null; attemptNumber: number; startedAt: Date | string; completedAt?: Date | string; createdAt?: Date | string }, idx: number) => {
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
            date: new Date(a.createdAt ?? Date.now()).toLocaleString("id-ID"),
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
        (e.testAttempts ?? []).flatMap((a: { test?: { type: string }; attemptNumber: number; answers?: Array<{ question?: { text: string; options?: Array<{ isCorrect: boolean; text: string }> }; selectedOption?: { text: string }; isCorrect: boolean | null }> }, attemptIdx: number) =>
          (a.answers ?? []).map((ans, qIdx: number) => ({
            course: e.course.title,
            type: a.test?.type === "PRE" ? "Pre-Test" : "Post-Test",
            attempt: a.attemptNumber || (attemptIdx + 1),
            no: qIdx + 1,
            question: ans.question?.text ?? "—",
            selected: ans.selectedOption?.text ?? "Tidak dijawab",
            correctAns: ans.question?.options?.find((o) => o.isCorrect)?.text ?? "—",
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
          applyCorrectCell(row.getCell("result"), a.isCorrect ?? false);
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
      console.error("[USER_DETAIL_EXPORT]", error);
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
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4">
          <Link href="/admin/users">
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-lg hover:bg-[#F8F9FB] hover:text-[#0F1C3F] text-[#475467]">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#101828] tracking-tight font-lexend">{user.name}</h1>
            <p className="text-[13px] sm:text-sm text-[#475467] font-medium leading-relaxed">Profil dan rekam jejak Karyawan.</p>
          </div>
        </div>
        <Button
          onClick={handleExportExcel}
          disabled={isExporting}
          className="bg-[#0F1C3F] hover:bg-[#1A2D5A] text-white gap-2 h-10 px-5 rounded-lg shadow-sm font-bold transition-all active:scale-95 font-sans"
        >
          {isExporting ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Download className="h-4 w-4 text-white" />}
          Export Data
        </Button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-2">
        {statCards.map((stat) => (
          <Card key={stat.label} className="group overflow-hidden border border-[#E4E7EC] bg-white shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 rounded-xl font-sans">
            <CardContent className="p-4 md:p-5">
              <div className="flex items-start justify-between">
                <div className="rounded-lg bg-[#F8F9FB] border border-[#E4E7EC] p-2 transition-colors group-hover:bg-[#0F1C3F] group-hover:text-white">
                  <stat.icon className="h-4 w-4 text-[#475467] group-hover:text-white transition-colors" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-[#101828] font-lexend tracking-tight">
                  {stat.value}
                </p>
                <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-[#98A2B3]">
                  {stat.label}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Profile */}
        <Card className="border border-[#E4E7EC] bg-white shadow-sm rounded-xl h-fit font-sans">
          <CardContent className="p-5">
            <div className="flex items-center gap-4 mb-6">
              <Avatar className="h-14 w-14 border-2 border-[#E4E7EC] shadow-sm">
                <AvatarFallback className="bg-[#F8F9FB] text-[#0F1C3F] text-lg font-bold font-lexend">
                  {user.name?.charAt(0)?.toUpperCase() ?? "?"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-[#101828] font-lexend truncate">{user.name}</h2>
                <p className="text-[13px] text-[#475467] font-medium truncate mt-0.5">{user.email || "—"}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#98A2B3]">
                  <Contact className="h-3.5 w-3.5" />
                  NIP Karyawan
                </div>
                <div className="font-bold text-[#101828] text-sm pl-5">{user.nip || "—"}</div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#98A2B3]">
                  <Building2 className="h-3.5 w-3.5" />
                  Departemen
                </div>
                <div className="font-bold text-[#101828] text-sm pl-5">{user.department || "—"}</div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#98A2B3]">
                  <MapPin className="h-3.5 w-3.5" />
                  Lokasi / Kantor
                </div>
                <div className="font-bold text-[#101828] text-sm pl-5">{user.lokasi || "—"}</div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#98A2B3]">
                  <Calendar className="h-3.5 w-3.5" />
                  Terdaftar Sejak
                </div>
                <div className="font-bold text-[#101828] text-sm pl-5">
                  {new Date(user.createdAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
            </div>

            <Separator className="my-5 border-[#E4E7EC]" />

            <div className={cn(
              "flex items-center gap-3 p-4 rounded-xl border",
              complianceOk ? "bg-[#ECFDF3] border-[#A6F4C5]" : "bg-[#FFFAEB] border-[#FEC84B]"
            )}>
              <div className={cn(
                "h-8 w-8 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm",
                complianceOk ? "bg-[#12B76A]" : "bg-[#F79009]"
              )}>
                <CheckCircle className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("text-[11px] font-bold uppercase tracking-wider", complianceOk ? "text-[#027A48]" : "text-[#B54708]")}>
                  Tingkat Kepatuhan (Compliance)
                </p>
                <p className={cn("text-xl font-bold font-lexend mt-0.5", complianceOk ? "text-[#027A48]" : "text-[#B54708]")}>
                  {summary.complianceRate.toFixed(0)}%
                </p>
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
