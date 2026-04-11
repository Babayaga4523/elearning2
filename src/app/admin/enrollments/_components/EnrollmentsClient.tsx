"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Download,
  GraduationCap,
  ChevronDown,
  TrendingUp,
  UserPlus,
  Trash2,
  Pencil,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { toast } from "sonner";

// Lazy load heavy components
const EnrollModal = dynamic(() => import("./EnrollModal").then(mod => mod.EnrollModal), {
  ssr: false,
  loading: () => null
});

const EnrollmentScheduler = dynamic(() => import("./EnrollmentScheduler").then(mod => mod.EnrollmentScheduler), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse bg-slate-50 rounded-3xl" />
});

import { unenrollUser } from "../actions";

interface EnrollmentRow {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userDept: string;
  userNip: string;
  userLokasi: string;
  courseId: string;
  courseTitle: string;
  courseCategory: string;
  status: string;
  enrolledAt: string;
  courseDeadline: string | null;
  preScore: number | null;
  postScore: number | null;
  postPassed: boolean | null;
}

interface User {
  id: string;
  name: string;
  email: string;
  department: string;
  nip: string;
}

interface Props {
  enrollments: EnrollmentRow[];
  courses: { id: string; title: string, category: string }[];
  users: User[];
  departments: string[];
  existingEnrollments: { userId: string; courseId: string }[];
  stats: {
    totalEnrollments: number;
    completed: number;
    inProgress: number;
    failed: number;
  };
  autoEnrollRules: any[];
  deptConfigs: any[];
}

const STATUS_LABEL: Record<string, string> = {
  COMPLETED: "Selesai",
  IN_PROGRESS: "Berjalan",
  FAILED: "Gagal",
};

const STATUS_CLASS: Record<string, string> = {
  COMPLETED: "bg-emerald-100 text-emerald-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  FAILED: "bg-rose-100 text-rose-600",
};

export function EnrollmentsClient({
  enrollments,
  courses,
  users,
  departments,
  existingEnrollments,
  stats,
  autoEnrollRules,
  deptConfigs,
}: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"list" | "scheduler">("list");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "COMPLETED" | "IN_PROGRESS" | "FAILED">("all");
  const [courseFilter, setCourseFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEnrollment, setEditingEnrollment] = useState<{
    id: string;
    userId: string;
    courseId: string;
  } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleOpenEnrollModal = () => {
    setEditingEnrollment(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (enrollment: EnrollmentRow) => {
    setEditingEnrollment({
      id: enrollment.id,
      userId: enrollment.userId,
      courseId: enrollment.courseId,
    });
    setIsModalOpen(true);
  };

  const filtered = enrollments.filter((e) => {
    const matchSearch =
      e.userName.toLowerCase().includes(search.toLowerCase()) ||
      e.userEmail.toLowerCase().includes(search.toLowerCase()) ||
      e.userNip.toLowerCase().includes(search.toLowerCase()) ||
      e.userDept.toLowerCase().includes(search.toLowerCase()) ||
      e.courseTitle.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || e.status === statusFilter;
    const matchCourse = courseFilter === "all" || e.courseId === courseFilter;
    return matchSearch && matchStatus && matchCourse;
  });

  const summaryCards = [
    {
      label: "Total Enrollment",
      value: stats.totalEnrollments,
      icon: <Users className="h-5 w-5" />,
      iconBg: "#EEF2FF",
      iconColor: "#6366F1",
    },
    {
      label: "Selesai",
      value: stats.completed,
      icon: <CheckCircle2 className="h-5 w-5" />,
      iconBg: "#F0FDF4",
      iconColor: "#10B981",
    },
    {
      label: "Berjalan",
      value: stats.inProgress,
      icon: <Clock className="h-5 w-5" />,
      iconBg: "#EEF6FF",
      iconColor: "#3B82F6",
    },
    {
      label: "Gagal / Dropout",
      value: stats.failed,
      icon: <XCircle className="h-5 w-5" />,
      iconBg: "#FFF0F0",
      iconColor: "#EF4444",
    },
  ];

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus enrollment ini? Data progress karyawan di kursus ini mungkin tetap tersimpan.")) return;
    setDeletingId(id);
    const result = await unenrollUser(id);
    if (result.success) {
      toast.success("Enrollment berhasil dihapus.");
      router.refresh();
    } else {
      toast.error(result.error ?? "Gagal menghapus enrollment.");
    }
    setDeletingId(null);
  };

  const handleExport = useCallback(async () => {
    try {
      const toastId = toast.loading("Menyiapkan data enrollment...");
      
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Data Enrollment");
      workbook.creator = "HCMS BNI Finance";
      workbook.created = new Date();

      // 1. Column Definitions (Keys & Widths)
      sheet.columns = [
        { key: "nip", width: 22 },
        { key: "userName", width: 25 },
        { key: "email", width: 30 },
        { key: "dept", width: 20 },
        { key: "lokasi", width: 20 },
        { key: "course", width: 35 },
        { key: "category", width: 18 },
        { key: "status", width: 15 },
        { key: "enrolledAt", width: 18 },
        { key: "deadline", width: 18 },
        { key: "preScore", width: 15 },
        { key: "postScore", width: 15 },
        { key: "postPassed", width: 15 },
      ];

      // 2. Navy Title (Row 1)
      sheet.mergeCells("A1:M1");
      const titleCell = sheet.getCell("A1");
      titleCell.value = "LAPORAN SELURUH DATA ENROLLMENT KARYAWAN";
      titleCell.font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
      titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F1C3F" } };
      titleCell.alignment = { horizontal: "center", vertical: "middle" };
      sheet.getRow(1).height = 35;

      // Sub-title (Row 2)
      sheet.mergeCells("A2:M2");
      const sub = sheet.getCell("A2");
      sub.value = `Diekspor pada: ${new Date().toLocaleDateString("id-ID", { dateStyle: "long", timeStyle: "short" })} | Total: ${filtered.length} Record`;
      sub.font = { italic: true, size: 10, color: { argb: "FF555555" } };
      sub.alignment = { horizontal: "center" };
      sheet.getRow(2).height = 20;

      // 3. Gold Header (Row 3)
      const headerValues = [
        "NIP", "NAMA KARYAWAN", "EMAIL", "DEPARTEMEN", "LOKASI",
        "JUDUL KURSUS", "KATEGORI", "STATUS", "TGL DAFTAR", "DEADLINE",
        "PRE-TEST", "POST-TEST", "HASIL AWAL"
      ];
      const headerRow = sheet.getRow(3);
      headerRow.values = headerValues;
      headerRow.height = 25;

      headerRow.eachCell((cell) => {
        cell.font = { bold: true, size: 10, color: { argb: "FF0F1C3F" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8A020" } };
        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
        cell.border = {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        };
      });

      // 4. Data Rows
      filtered.forEach((e, idx) => {
        const row = sheet.addRow({
          nip: e.userNip,
          userName: e.userName,
          email: e.userEmail,
          dept: e.userDept,
          lokasi: e.userLokasi,
          course: e.courseTitle,
          category: e.courseCategory,
          status: STATUS_LABEL[e.status] ?? e.status,
          enrolledAt: new Date(e.enrolledAt).toLocaleDateString("id-ID"),
          deadline: e.courseDeadline ? new Date(e.courseDeadline).toLocaleDateString("id-ID") : "-",
          preScore: e.preScore ?? "-",
          postScore: e.postScore ?? "-",
          postPassed: e.postPassed === null ? "-" : e.postPassed ? "LULUS" : "TIDAK LULUS",
        });

        const bg = idx % 2 === 0 ? "FFF5F7FA" : "FFFFFFFF";
        row.height = 18;
        row.eachCell({ includeEmpty: true }, (cell) => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
          cell.font = { size: 10 };
          cell.alignment = { vertical: "middle" };
          cell.border = {
            bottom: { style: "hair", color: { argb: "FFDDDDDD" } },
            right: { style: "hair", color: { argb: "FFDDDDDD" } }
          };
        });

        // Dynamic Status Colors
        const statusCell = row.getCell(8);
        if (e.status === "COMPLETED") {
          statusCell.font = { size: 10, bold: true, color: { argb: "FF166534" } };
          statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDCFCE7" } };
        } else if (e.status === "FAILED") {
          statusCell.font = { size: 10, bold: true, color: { argb: "FF991B1B" } };
          statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEE2E2" } };
        }

        // Expiry alert
        if (e.courseDeadline && e.status !== "COMPLETED") {
          if (new Date(e.courseDeadline) < new Date()) {
            row.getCell(10).font = { size: 10, color: { argb: "FF991B1B" }, bold: true };
          }
        }

        row.getCell(13).alignment = { horizontal: "center" };
        [9, 10, 11, 12].forEach(col => row.getCell(col).alignment = { horizontal: "center" });
      });

      sheet.views = [{ state: "frozen", xSplit: 0, ySplit: 3 }];
      sheet.autoFilter = { from: "A3", to: "M3" };

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(
        new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
        `Laporan_Enrollment_BNI_Finance_${Date.now()}.xlsx`
      );
      
      toast.dismiss(toastId);
      toast.success("Data enrollment berhasil diekspor.");
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengekspor data enrollment.");
    }
  }, [filtered]);

  return (
    <div 
      className="w-full min-w-0 space-y-6 pb-12 md:pb-16"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Enrollment Modal */}
      <EnrollModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEnrollment(null);
        }}
        courses={courses}
        users={users}
        departments={departments}
        existingEnrollments={existingEnrollments.map(e => `${e.userId}_${e.courseId}`)}
        editData={editingEnrollment}
      />

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p
            className="text-[10px] font-black uppercase tracking-[0.2em] mb-1"
            style={{ color: "#B0BAD0" }}
          >
            Sistem Administrasi
          </p>
          <h1
            className="text-2xl md:text-3xl font-black tracking-tight"
            style={{ color: "#0F1C3F", fontFamily: "'Lexend Deca', sans-serif" }}
          >
            Manajemen Enrollment
          </h1>
          <p className="text-sm font-medium mt-0.5" style={{ color: "#7A8599" }}>
            Pantau status pendaftaran dan nilai karyawan secara real-time.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 h-10 px-5 rounded-xl font-black text-xs uppercase tracking-wider transition-all hover:bg-emerald-50 active:scale-[0.98] whitespace-nowrap"
            style={{
              background: "white",
              color: "#059669",
              border: "1px solid #BBF7D0",
            }}
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export Excel</span>
          </button>
          <button
            onClick={handleOpenEnrollModal}
            className="flex items-center gap-2.5 h-10 px-6 rounded-xl font-black text-xs uppercase tracking-wider transition-all hover:bg-[#F8FAFC] active:scale-[0.97] whitespace-nowrap"
            style={{
              background: "white",
              color: "#0F1C3F",
              border: "1px solid #0F1C3F",
              boxShadow: "0 2px 8px rgba(15,28,63,0.05)",
            }}
          >
            <UserPlus className="h-4 w-4" style={{ color: "#E8A020" }} />
            Daftarkan Karyawan
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-1 p-1 rounded-2xl w-fit" style={{ background: "#F1F5F9" }}>
        <button
          onClick={() => setActiveTab("list")}
          className={cn(
            "px-6 h-9 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
            activeTab === "list" ? "bg-white text-[#0F1C3F] shadow-sm" : "text-[#94A3B8] hover:text-[#475569]"
          )}
        >
          Daftar Enrollment
        </button>
        <button
          onClick={() => setActiveTab("scheduler")}
          className={cn(
            "px-6 h-9 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
            activeTab === "scheduler" ? "bg-white text-[#0F1C3F] shadow-sm" : "text-[#94A3B8] hover:text-[#475569]"
          )}
        >
          <Clock className="h-4 w-4" />
          Scheduler & Aturan
        </button>
      </div>

      {activeTab === "list" ? (
        <>
          {/* ── Stats Row ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {summaryCards.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl p-5 flex items-center gap-4 transition-all hover:-translate-y-0.5"
                style={{
                  background: "white",
                  border: "1px solid #F0F2F7",
                  boxShadow: "0 1px 2px rgba(15,28,63,0.04)",
                }}
              >
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: s.iconBg, color: s.iconColor }}
                >
                  {s.icon}
                </div>
                <div>
                  <p
                    className="text-xl font-black leading-none mb-1"
                    style={{ color: "#0F1C3F" }}
                  >
                    {s.value}
                  </p>
                  <p
                    className="text-[9px] font-black uppercase tracking-widest"
                    style={{ color: "#B0BAD0" }}
                  >
                    {s.label}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Toolbar ── */}
          <div
            className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center p-2 rounded-2xl"
            style={{
              background: "white",
              border: "1px solid #F0F2F7",
            }}
          >
            {/* Search */}
            <div className="relative flex-1">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                style={{ color: "#B0BAD0" }}
              />
              <input
                placeholder="Cari nama, NIP, email, kursus..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-xl text-sm font-medium outline-none transition-all"
                style={{
                  background: "transparent",
                  color: "#0F1C3F",
                }}
              />
            </div>

            {/* Course Filter */}
            <div className="relative min-w-[170px]">
              <select
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                className="w-full h-10 pl-4 pr-10 rounded-xl text-[11px] font-black uppercase tracking-wider appearance-none outline-none cursor-pointer transition-all"
                style={{
                  background: "#F8FAFC",
                  color: "#0F1C3F",
                }}
              >
                <option value="all">Semua Kursus</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none" style={{ color: "#9AAABF" }} />
            </div>

            {/* Status Tabs */}
            <div
              className="flex items-center gap-1 p-1 rounded-xl shrink-0"
              style={{ background: "#F8FAFC" }}
            >
              {(["all", "COMPLETED", "IN_PROGRESS", "FAILED"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className="px-4 h-7 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
                  style={{
                    background: statusFilter === s ? "white" : "transparent",
                    color: statusFilter === s ? "#0F1C3F" : "#B0BAD0",
                    boxShadow:
                      statusFilter === s ? "0 1px 3px rgba(15,28,63,0.06)" : "none",
                  }}
                >
                  {s === "all" ? "Semua" : STATUS_LABEL[s]}
                </button>
              ))}
            </div>

            {/* Result Count */}
            <div
              className="text-[9px] font-black shrink-0 px-3 py-2 rounded-xl"
              style={{ background: "#F8FAFC", color: "#B0BAD0" }}
            >
              {filtered.length} ITEMS
            </div>
          </div>

          {/* ── Table View ── */}
          <div 
            className="rounded-3xl overflow-hidden"
            style={{ background: "white", border: "1px solid #F0F2F7" }}
          >
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <div 
                  className="h-14 w-14 rounded-2xl flex items-center justify-center"
                  style={{ background: "#F8FAFC" }}
                >
                  <GraduationCap className="h-7 w-7" style={{ color: "#D6DBE8" }} />
                </div>
                <div>
                  <p className="text-sm font-black" style={{ color: "#0F1C3F" }}>Tidak ada enrollment ditemukan</p>
                  <p className="text-[11px] font-medium" style={{ color: "#B0BAD0" }}>Daftarkan karyawan menggunakan tombol di atas.</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr style={{ background: "#FBFBFC", borderBottom: "1px solid #F0F2F7" }}>
                      <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest" style={{ color: "#B0BAD0" }}>Karyawan</th>
                      <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest" style={{ color: "#B0BAD0" }}>Kursus</th>
                      <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-center" style={{ color: "#B0BAD0" }}>Timeline</th>
                      <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-center" style={{ color: "#B0BAD0" }}>Nilai</th>
                      <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-center" style={{ color: "#B0BAD0" }}>Status</th>
                      <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-center" style={{ color: "#B0BAD0" }}>Opsi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: "#F8FAFC" }}>
                    {filtered.map((row) => {
                      const initials = row.userName.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
                      const isExpired = row.status !== "COMPLETED" && row.courseDeadline && new Date(row.courseDeadline) < new Date();

                      return (
                        <tr 
                          key={row.id} 
                          className="group transition-all hover:bg-slate-50/40"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div 
                                className="h-9 w-9 rounded-xl flex items-center justify-center font-black text-[11px] shrink-0 transition-all group-hover:scale-105"
                                style={{ background: "#F0F4FF", color: "#6366F1" }}
                              >
                                {initials}
                              </div>
                              <div className="min-w-0">
                                <p className="font-black text-sm truncate" style={{ color: "#0F1C3F" }}>{row.userName}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-[10px] font-bold" style={{ color: "#B0BAD0" }}>{row.userNip}</span>
                                  <span className="h-1 w-1 rounded-full" style={{ background: "#E2E6F0" }} />
                                  <span className="text-[10px] font-medium truncate" style={{ color: "#B0BAD0" }}>{row.userDept}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="max-w-[200px]">
                              <p className="font-black text-xs leading-snug line-clamp-2" style={{ color: "#0F1C3F" }}>{row.courseTitle}</p>
                              <span className="inline-block mt-0.5 text-[8px] font-black uppercase tracking-widest" style={{ color: "#B0BAD0" }}>
                                {row.courseCategory}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-center space-y-0.5">
                              <p className="text-[9px] font-bold" style={{ color: "#D1D5DB" }}>
                                {new Date(row.enrolledAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                              </p>
                              {row.courseDeadline ? (
                                <div className="flex flex-col items-center">
                                  <span 
                                    className="text-[10px] font-black px-1.5 py-0.5"
                                    style={{ 
                                      color: isExpired ? "#EF4444" : "#0F1C3F",
                                    }}
                                  >
                                    {new Date(row.courseDeadline).toLocaleDateString("id-ID", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    })}
                                  </span>
                                  {isExpired && (
                                    <span className="text-[7px] font-black uppercase" style={{ color: "#EF4444" }}>EXPIRED</span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[10px] font-bold" style={{ color: "#E2E6F0" }}>—</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <div className="text-center">
                                <p className="text-[11px] font-black" style={{ color: row.preScore !== null ? "#6366F1" : "#E2E6F0" }}>
                                  {row.preScore ?? "—"}
                                </p>
                              </div>
                              <div className="h-3 w-px" style={{ background: "#E2E6F0" }} />
                              <div className="text-center">
                                <p className="text-[11px] font-black" style={{ color: row.postScore !== null ? (row.postPassed ? "#10B981" : "#EF4444") : "#E2E6F0" }}>
                                  {row.postScore ?? "—"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span 
                              className="inline-block text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg"
                              style={{ 
                                backgroundColor: row.status === "COMPLETED" ? "#F0FDF4" : row.status === "FAILED" ? "#FFF0F0" : "#F5F7FF",
                                color: row.status === "COMPLETED" ? "#059669" : row.status === "FAILED" ? "#EF4444" : "#6366F1"
                              }}
                            >
                              {STATUS_LABEL[row.status]}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-1">
                              <Link href={`/admin/courses/${row.courseId}/report`}>
                                <button
                                  className="h-8 w-8 rounded-xl flex items-center justify-center transition-all hover:bg-indigo-50"
                                  style={{ color: "#B0BAD0" }}
                                  title="Laporan"
                                >
                                  <TrendingUp className="h-4 w-4" />
                                </button>
                              </Link>
                              <button
                                onClick={() => handleDelete(row.id)}
                                disabled={deletingId === row.id}
                                className="h-8 w-8 rounded-xl flex items-center justify-center transition-all hover:bg-rose-50 disabled:opacity-30"
                                style={{ color: "#B0BAD0" }}
                                title="Hapus"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        <EnrollmentScheduler 
          courses={courses}
          departments={departments}
          autoEnrollRules={autoEnrollRules}
          deptConfigs={deptConfigs}
        />
      )}
    </div>
  );
}
