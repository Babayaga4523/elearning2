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
  deadline: string | null;
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
  courses: { id: string; title: string }[];
  users: User[];
  departments: string[];
  existingEnrollments: { userId: string; courseId: string }[];
  stats: {
    totalEnrollments: number;
    completed: number;
    inProgress: number;
    failed: number;
  };
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
}: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "COMPLETED" | "IN_PROGRESS" | "FAILED">("all");
  const [courseFilter, setCourseFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEnrollment, setEditingEnrollment] = useState<{
    id: string;
    userId: string;
    courseId: string;
    deadline: string | null;
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
      deadline: enrollment.deadline,
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
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-100",
    },
    {
      label: "Selesai",
      value: stats.completed,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
    },
    {
      label: "Berjalan",
      value: stats.inProgress,
      icon: Clock,
      color: "text-blue-500",
      bg: "bg-blue-50",
      border: "border-blue-100",
    },
    {
      label: "Gagal / Dropout",
      value: stats.failed,
      icon: XCircle,
      color: "text-rose-600",
      bg: "bg-rose-50",
      border: "border-rose-100",
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
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Data Enrollment");
    workbook.creator = "HCMS E-Learning";
    workbook.created = new Date();

    sheet.mergeCells("A1:M1");
    const titleCell = sheet.getCell("A1");
    titleCell.value = "Laporan Enrollment Karyawan - BNI Finance E-Learning";
    titleCell.font = { bold: true, size: 13, color: { argb: "FFFFFFFF" } };
    titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F1C3F" } };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    sheet.getRow(1).height = 28;

    sheet.mergeCells("A2:M2");
    const sub = sheet.getCell("A2");
    sub.value = `Diekspor pada: ${new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })} | Total: ${filtered.length} data`;
    sub.font = { italic: true, size: 10, color: { argb: "FF555555" } };
    sub.alignment = { horizontal: "center" };
    sheet.getRow(2).height = 16;

    const cols = [
      { header: "No. Induk Pegawai", width: 22 },
      { header: "Nama Karyawan", width: 25 },
      { header: "Email", width: 30 },
      { header: "Departemen", width: 18 },
      { header: "Lokasi", width: 18 },
      { header: "Nama Kursus", width: 35 },
      { header: "Kategori", width: 18 },
      { header: "Status", width: 13 },
      { header: "Tgl Daftar", width: 15 },
      { header: "Deadline", width: 15 },
      { header: "Nilai Pre-Test", width: 15 },
      { header: "Nilai Post-Test", width: 15 },
      { header: "Lulus Post-Test", width: 15 },
    ];
    cols.forEach((c, i) => { sheet.getColumn(i + 1).width = c.width; });

    const headerRow = sheet.getRow(3);
    headerRow.height = 20;
    cols.forEach((c, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = c.header;
      cell.font = { bold: true, size: 10, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8A020" } };
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      cell.border = {
        top: { style: "thin", color: { argb: "FFCCCCCC" } },
        bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
        left: { style: "thin", color: { argb: "FFCCCCCC" } },
        right: { style: "thin", color: { argb: "FFCCCCCC" } },
      };
    });

    filtered.forEach((e, idx) => {
      const row = sheet.addRow([
        e.userNip, e.userName, e.userEmail, e.userDept, e.userLokasi,
        e.courseTitle, e.courseCategory,
        STATUS_LABEL[e.status] ?? e.status,
        new Date(e.enrolledAt).toLocaleDateString("id-ID"),
        e.deadline ? new Date(e.deadline).toLocaleDateString("id-ID") : "-",
        e.preScore ?? "-", e.postScore ?? "-",
        e.postPassed === null ? "-" : e.postPassed ? "Ya" : "Tidak",
      ]);
      const bg = idx % 2 === 0 ? "FFF5F7FA" : "FFFFFFFF";
      row.height = 18;
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
        cell.font = { size: 10 };
        cell.alignment = { vertical: "middle" };
        cell.border = { bottom: { style: "hair", color: { argb: "FFDDDDDD" } }, right: { style: "hair", color: { argb: "FFDDDDDD" } } };
      });
      const statusCell = row.getCell(8);
      if (e.status === "COMPLETED") {
        statusCell.font = { size: 10, bold: true, color: { argb: "FF166534" } };
        statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDCFCE7" } };
      } else if (e.status === "FAILED") {
        statusCell.font = { size: 10, bold: true, color: { argb: "FF991B1B" } };
        statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEE2E2" } };
      } else {
        statusCell.font = { size: 10, bold: true, color: { argb: "FF1D4ED8" } };
        statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDBEAFE" } };
      }
      statusCell.alignment = { horizontal: "center", vertical: "middle" };

      if (e.deadline && e.status !== "COMPLETED") {
        const dDate = new Date(e.deadline);
        const now = new Date();
        if (dDate < now) {
          row.getCell(10).font = { size: 10, color: { argb: "FF991B1B" }, bold: true };
        }
      }

      const passCell = row.getCell(13);
      if (e.postPassed === true) passCell.font = { size: 10, color: { argb: "FF166534" } };
      else if (e.postPassed === false) passCell.font = { size: 10, color: { argb: "FF991B1B" } };
      passCell.alignment = { horizontal: "center", vertical: "middle" };
    });

    sheet.views = [{ state: "frozen", xSplit: 0, ySplit: 3 }];
    sheet.autoFilter = { from: "A3", to: "L3" };

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(
      new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
      `Enrollment_BNI_${Date.now()}.xlsx`
    );
  }, [filtered]);

  return (
    <div className="space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
        existingEnrollments={existingEnrollments}
        editData={editingEnrollment}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Manajemen Enrollment</h1>
          <p className="text-slate-500 font-medium mt-1">
            Pantau status pendaftaran dan nilai karyawan di semua kursus.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Button
            onClick={handleOpenEnrollModal}
            className="gap-2 font-black bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
          >
            <UserPlus className="h-4 w-4" />
            Daftarkan Karyawan
          </Button>
          <Button
            onClick={handleExport}
            variant="outline"
            className="gap-2 font-black border-emerald-200 text-emerald-700 hover:bg-emerald-50"
          >
            <Download className="h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((s) => (
          <Card key={s.label} className={cn("border shadow-sm bg-white hover:shadow-md transition-all", s.border)}>
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

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, NIP, email, kursus..."
            className="w-full pl-11 pr-4 h-11 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="relative shrink-0">
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="h-11 pl-4 pr-10 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
          >
            <option value="all">Semua Kursus</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        </div>
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 shrink-0">
          {(["all", "COMPLETED", "IN_PROGRESS", "FAILED"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "px-3 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all",
                statusFilter === s ? "bg-white shadow-sm text-slate-800" : "text-slate-400 hover:text-slate-600"
              )}
            >
              {s === "all" ? "Semua" : s === "COMPLETED" ? "Selesai" : s === "IN_PROGRESS" ? "Berjalan" : "Gagal"}
            </button>
          ))}
        </div>
        <div className="text-xs font-bold text-slate-400 shrink-0">
          {filtered.length} dari {enrollments.length} data
        </div>
      </div>

      {/* Table */}
      <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="p-5 bg-slate-50 rounded-full">
              <GraduationCap className="h-8 w-8 text-slate-200" />
            </div>
            <div>
              <p className="text-slate-600 font-bold">Tidak ada enrollment ditemukan.</p>
              <p className="text-slate-400 text-sm mt-1">Mulai daftarkan karyawan menggunakan tombol di atas.</p>
            </div>
            <Button onClick={handleOpenEnrollModal} className="gap-2 font-bold">
              <UserPlus className="h-4 w-4" />
              Daftarkan Karyawan
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-5 py-3.5 font-black text-xs text-slate-500 uppercase tracking-wider">Karyawan</th>
                  <th className="text-left px-4 py-3.5 font-black text-xs text-slate-500 uppercase tracking-wider">Kursus</th>
                  <th className="text-center px-4 py-3.5 font-black text-xs text-slate-500 uppercase tracking-wider">Tgl Daftar</th>
                  <th className="text-center px-4 py-3.5 font-black text-xs text-slate-500 uppercase tracking-wider">Target Deadline</th>
                  <th className="text-center px-4 py-3.5 font-black text-xs text-slate-500 uppercase tracking-wider">Pre-Test</th>
                  <th className="text-center px-4 py-3.5 font-black text-xs text-slate-500 uppercase tracking-wider">Post-Test</th>
                  <th className="text-center px-4 py-3.5 font-black text-xs text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-center px-4 py-3.5 font-black text-xs text-slate-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors shrink-0 text-sm">
                          {row.userName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 leading-tight">{row.userName}</p>
                          <div className="flex flex-wrap items-center gap-x-2 mt-0.5">
                            <span className="text-[11px] text-slate-400">{row.userEmail}</span>
                            {row.userNip !== "-" && (
                              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{row.userNip}</span>
                            )}
                          </div>
                          {row.userDept !== "-" && (
                            <span className="text-[10px] text-slate-400">{row.userDept} · {row.userLokasi}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-bold text-slate-700 text-xs leading-snug line-clamp-2">{row.courseTitle}</p>
                      {row.courseCategory !== "-" && (
                        <Badge variant="outline" className="mt-1 text-[10px] font-semibold text-slate-400 border-slate-200 bg-slate-50">
                          {row.courseCategory}
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center text-xs font-medium text-slate-500">
                      {new Date(row.enrolledAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {row.deadline ? (
                        <div className="flex flex-col items-center">
                          <span className={cn(
                            "text-xs font-bold",
                            row.status !== "COMPLETED" && new Date(row.deadline) < new Date() 
                              ? "text-rose-600 animate-pulse" 
                              : "text-slate-600"
                          )}>
                            {new Date(row.deadline).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                          {row.status !== "COMPLETED" && new Date(row.deadline) < new Date() && (
                            <span className="text-[9px] font-black uppercase text-rose-500 mt-0.5">Overdue</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-300 text-xs italic">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {row.preScore === null ? (
                        <span className="text-slate-300 text-xs italic">—</span>
                      ) : (
                        <span className="text-base font-black text-indigo-600">{row.preScore}</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {row.postScore === null ? (
                        <span className="text-slate-300 text-xs italic">—</span>
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <span className={cn("text-base font-black", row.postPassed ? "text-emerald-600" : "text-rose-500")}>
                            {row.postScore}
                          </span>
                          <span className={cn("text-[10px] font-bold", row.postPassed ? "text-emerald-500" : "text-rose-400")}>
                            {row.postPassed ? "Lulus" : "Tidak Lulus"}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <Badge className={cn("text-xs font-black border-none px-3 py-1", STATUS_CLASS[row.status] ?? "bg-slate-100 text-slate-500")}>
                        {STATUS_LABEL[row.status] ?? row.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {/* Tombol Laporan (Icon Only) */}
                        <Link href={`/admin/courses/${row.courseId}/report`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Lihat Laporan"
                            className="h-8 w-8 text-indigo-600 hover:bg-indigo-50 transition-colors"
                          >
                            <TrendingUp className="h-4 w-4" />
                          </Button>
                        </Link>

                        {/* Tombol Edit (Icon Only) */}
                        <button
                          onClick={() => handleOpenEditModal(row)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Edit Deadline"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        {/* Tombol Hapus (Icon Only) */}
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Hapus Enrollment"
                          disabled={deletingId === row.id}
                          onClick={() => handleDelete(row.id)}
                          className="h-8 w-8 text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
