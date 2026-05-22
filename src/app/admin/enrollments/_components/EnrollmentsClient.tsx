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
  Bell,
  Activity,
  MoreVertical,
  Calendar,
  Filter,
  FileSpreadsheet,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

import {
  createWorkbook,
  styleTitle,
  styleSubtitle,
  styleHeaderRow,
  applyDataRow,
  applyStatusCell,
  applyPassedCell,
  centerCols,
  finalizeSheet,
  downloadExcel,
} from "@/lib/excel-template";

import { unenrollUser, pokeParticipant, approveEnrollment, rejectEnrollment } from "../actions";
import { EnrollmentHistoryTooltip } from "./EnrollmentHistoryTooltip";
import { Pagination } from "@/components/admin/Pagination";
import { PageHeader } from "@/components/admin/ui/page-header";
import { StatusBadge } from "@/components/admin/ui/status-badge";
import { EmptyState } from "@/components/admin/ui/empty-state";

// Lazy load heavy components
const EnrollModal = dynamic(() => import("./EnrollModal").then(mod => mod.EnrollModal), {
  ssr: false,
  loading: () => null
});

const EnrollmentScheduler = dynamic(() => import("./EnrollmentScheduler").then(mod => mod.EnrollmentScheduler), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse bg-slate-50 rounded-3xl" />
});

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100] as const;
const DEFAULT_ITEMS_PER_PAGE = 20;

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
  reportedAt: string | null;
  source: string;
  courseDeadline: string | null;
  remindedAt7d: string | null;
  remindedAt3d: string | null;
  remindedAt1d: string | null;
  escalatedAt: string | null;
  preScore: number | null;
  postScore: number | null;
  postPassed: boolean | null;
  rejectionNote: string | null;
  approvedById: string | null;
  approvedAt: string | null;
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
  const [activeTab, setActiveTab] = useState("list");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEnrollment, setEditingEnrollment] = useState<{
    id: string;
    userId: string;
    courseId: string;
  } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pokingId, setPokingId] = useState<string | null>(null);
  const [pokeDialogOpen, setPokeDialogOpen] = useState(false);
  const [pokeTarget, setPokeTarget] = useState<{id: string; name: string; courseTitle: string} | null>(null);
  const [pokeNote, setPokeNote] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionNote, setRejectionNote] = useState("");
  const [isApproving, setIsApproving] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);
  const [isExporting, setIsExporting] = useState(false);

  const handleOpenEnrollModal = () => {
    setEditingEnrollment(null);
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
    const matchSource = sourceFilter === "all" || e.source === sourceFilter;
    const matchCourse = courseFilter === "all" || e.courseId === courseFilter;
    return matchSearch && matchStatus && matchSource && matchCourse;
  });

  const resetPage = () => setCurrentPage(1);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedEnrollments = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const summaryCards = [
    {
      label: "Total Enrollment",
      value: stats.totalEnrollments,
      icon: Users,
      bg: "bg-blue-50 text-blue-600",
    },
    {
      label: "Menunggu",
      value: enrollments.filter(e => e.status === "PENDING").length,
      icon: Clock,
      bg: "bg-amber-50 text-amber-600",
    },
    {
      label: "Berjalan",
      value: stats.inProgress,
      icon: Activity,
      bg: "bg-indigo-50 text-indigo-600",
    },
    {
      label: "Selesai",
      value: stats.completed,
      icon: CheckCircle2,
      bg: "bg-emerald-50 text-emerald-600",
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
  
  const openPokeDialog = (id: string, name: string, courseTitle: string) => {
    setPokeTarget({ id, name, courseTitle });
    setPokeNote("");
    setPokeDialogOpen(true);
  };

  const closePokeDialog = () => {
    setPokeDialogOpen(false);
    setPokeTarget(null);
    setPokeNote("");
  };

  const handlePoke = async () => {
    if (!pokeTarget) return;
    
    setPokingId(pokeTarget.id);
    try {
      const result = await pokeParticipant(pokeTarget.id, pokeNote.trim() || undefined);
      if (result.success) {
        toast.success(
          <div className="space-y-1">
            <p className="font-semibold">Colekan berhasil dikirim!</p>
            <p className="text-xs text-slate-500">
              Ke: {result.data?.userName} • Kursus: {result.data?.courseTitle} • Progress: {result.data?.progressPercent}%
            </p>
          </div>
        );
        closePokeDialog();
      } else {
        toast.error(result.error || "Gagal mengirim colekan");
      }
    } catch {
      toast.error("Terjadi kesalahan saat mengirim colekan");
    } finally {
      setPokingId(null);
    }
  };

  const handleApprove = async (id: string) => {
    if (!confirm("Setujui pendaftaran ini? Karyawan akan langsung bisa mengakses materi.")) return;
    setIsApproving(id);
    try {
      const result = await approveEnrollment(id);
      if (result.success) {
        toast.success("✅ Pendaftaran berhasil disetujui! Karyawan dapat mengakses materi.");
        router.refresh();
      } else {
        toast.error(result.error ?? "Gagal menyetujui pendaftaran.");
      }
    } catch (error: any) {
      toast.error("Terjadi kesalahan: " + (error.message || "Gagal menyetujui."));
      console.error("[APPROVE_ERROR]", error);
    } finally {
      setIsApproving(null);
    }
  };

  const handleReject = async () => {
    if (!rejectingId || !rejectionNote.trim()) {
      toast.error("Alasan penolakan harus diisi.");
      return;
    }
    
    try {
      const result = await rejectEnrollment(rejectingId, rejectionNote);
      if (result.success) {
        toast.success("❌ Pendaftaran berhasil ditolak. Email notifikasi telah dikirim ke karyawan.");
        setRejectingId(null);
        setRejectionNote("");
        router.refresh();
      } else {
        toast.error(result.error ?? "Gagal menolak pendaftaran.");
      }
    } catch (error: any) {
      toast.error("Terjadi kesalahan: " + (error.message || "Gagal menolak."));
      console.error("[REJECT_ERROR]", error);
    }
  };

  const handleExport = useCallback(async () => {
    if (isExporting) return; // Prevent multiple clicks
    
    setIsExporting(true);
    try {
      const toastId = toast.loading("Menyiapkan data enrollment...");

      const wb = createWorkbook();
      const sheet = wb.addWorksheet("Data Enrollment");

      sheet.columns = [
        { header: "NIP",            key: "nip",        width: 22 },
        { header: "NAMA KARYAWAN",  key: "userName",   width: 25 },
        { header: "EMAIL",          key: "email",      width: 30 },
        { header: "DEPARTEMEN",     key: "dept",       width: 20 },
        { header: "LOKASI",         key: "lokasi",     width: 20 },
        { header: "JUDUL KURSUS",   key: "course",     width: 35 },
        { header: "KATEGORI",       key: "category",   width: 18 },
        { header: "STATUS",         key: "status",     width: 15 },
        { header: "TGL DAFTAR",     key: "enrolledAt", width: 18 },
        { header: "DEADLINE",       key: "deadline",   width: 18 },
        { header: "PRE-TEST",       key: "preScore",   width: 15 },
        { header: "POST-TEST",      key: "postScore",  width: 15 },
        { header: "HASIL POST-TEST",key: "postPassed", width: 16 },
      ];

      styleTitle(sheet, 1, "Laporan Seluruh Data Enrollment Karyawan", 13);
      styleSubtitle(sheet, 2, 13, `${filtered.length} Record`);
      styleHeaderRow(sheet, 3);

      filtered.forEach((e, idx) => {
        const row = sheet.addRow({
          nip:        e.userNip,
          userName:   e.userName,
          email:      e.userEmail,
          dept:       e.userDept,
          lokasi:     e.userLokasi,
          course:     e.courseTitle,
          category:   e.courseCategory,
          status:     e.status,
          enrolledAt: new Date(e.enrolledAt).toLocaleDateString("id-ID"),
          deadline:   e.courseDeadline ? new Date(e.courseDeadline).toLocaleDateString("id-ID") : "-",
          preScore:   e.preScore != null ? Number(e.preScore).toFixed(0) : "-",
          postScore:  e.postScore != null ? Number(e.postScore).toFixed(0) : "-",
          postPassed: e.postPassed === null ? "-" : e.postPassed ? "LULUS" : "TIDAK LULUS",
        });

        applyDataRow(row, idx);
        applyStatusCell(row.getCell("status"), e.status);
        applyPassedCell(row.getCell("postPassed"), e.postPassed);
        centerCols(row, ["enrolledAt", "deadline", "preScore", "postScore"]);

        if (e.courseDeadline && e.status !== "COMPLETED" && new Date(e.courseDeadline) < new Date()) {
          row.getCell("deadline").font = { size: 10, color: { argb: "FF991B1B" }, bold: true, name: "Calibri" };
        }
      });

      finalizeSheet(sheet, 13);

      const fileName = `Laporan_Enrollment_BNI_Finance_${Date.now()}`;
      await downloadExcel(wb, fileName);

      toast.dismiss(toastId);
      toast.success("Data enrollment berhasil diekspor.");
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengekspor data enrollment.");
    } finally {
      setIsExporting(false);
    }
  }, [filtered, isExporting]);

  return (
    <div className="space-y-8 pb-20">
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

      <PageHeader 
        title="Manajemen Enrollment"
        description="Pantau status pendaftaran dan nilai karyawan secara real-time."
        actions={
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleExport} 
              disabled={isExporting}
              className="border-emerald-200 text-emerald-600 hover:bg-emerald-50 gap-2 h-10 px-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Mengekspor...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="h-4 w-4" />
                  Export Excel
                </>
              )}
            </Button>
            <Button onClick={handleOpenEnrollModal} className="bg-[#0F1C3F] hover:bg-[#1A3060] text-white gap-2 h-10 px-5 rounded-xl shadow-lg shadow-[#0F1C3F]/10">
              <UserPlus className="h-4 w-4 text-[#E8A020]" />
              Daftarkan Karyawan
            </Button>
          </div>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="bg-slate-100 p-1 rounded-xl h-11 w-fit border border-slate-200 shadow-sm">
          <TabsTrigger value="list" className="h-9 px-6 rounded-lg text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-[#0F1C3F] data-[state=active]:shadow-sm">
            Daftar Enrollment
          </TabsTrigger>
          <TabsTrigger value="scheduler" className="h-9 px-6 rounded-lg text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-[#0F1C3F] data-[state=active]:shadow-sm gap-2">
            <Clock className="h-3.5 w-3.5" />
            Scheduler
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {summaryCards.map((s) => (
              <div key={s.label} className="flex items-center gap-3 bg-white border border-slate-100 rounded-xl px-4 py-3 shadow-sm">
                <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", s.bg)}>
                  <s.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-base font-black text-[#0F1C3F] leading-none">{s.value}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Cari nama, NIP, atau kursus..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); resetPage(); }}
                className="pl-9 h-9 rounded-lg bg-slate-50 border-none text-sm focus-visible:ring-[#0F1C3F]/10"
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
               <Select value={courseFilter} onValueChange={(v) => { setCourseFilter(v); resetPage(); }}>
                  <SelectTrigger className="w-[160px] h-9 rounded-lg bg-slate-50 border-none text-[11px] font-bold text-slate-500">
                     <SelectValue placeholder="PILIH KURSUS" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                      <SelectItem value="all" className="text-xs font-semibold">Semua Kursus</SelectItem>
                      {courses.map(c => <SelectItem key={c.id} value={c.id} className="text-xs font-semibold">{c.title}</SelectItem>)}
                  </SelectContent>
               </Select>

               <Select value={sourceFilter} onValueChange={(v) => { setSourceFilter(v); resetPage(); }}>
                  <SelectTrigger className="w-[130px] h-9 rounded-lg bg-slate-50 border-none text-[11px] font-bold text-slate-500">
                     <SelectValue placeholder="SUMBER" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                      <SelectItem value="all" className="text-xs font-semibold">Semua Sumber</SelectItem>
                      <SelectItem value="MANUAL" className="text-xs font-semibold">Manual</SelectItem>
                      <SelectItem value="BULK" className="text-xs font-semibold">Bulk</SelectItem>
                      <SelectItem value="AUTO" className="text-xs font-semibold">Otomatis</SelectItem>
                  </SelectContent>
               </Select>

               <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); resetPage(); }}>
                  <SelectTrigger className="w-[130px] h-9 rounded-lg bg-slate-50 border-none text-[11px] font-bold text-slate-500">
                     <SelectValue placeholder="STATUS" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                      <SelectItem value="all" className="text-xs font-semibold">Semua Status</SelectItem>
                      <SelectItem value="PENDING" className="text-xs font-semibold">⏳ Menunggu</SelectItem>
                      <SelectItem value="IN_PROGRESS" className="text-xs font-semibold">🔵 Berjalan</SelectItem>
                      <SelectItem value="COMPLETED" className="text-xs font-semibold">✅ Selesai</SelectItem>
                      <SelectItem value="FAILED" className="text-xs font-semibold">❌ Gagal</SelectItem>
                      <SelectItem value="REJECTED" className="text-xs font-semibold">⛔ Ditolak</SelectItem>
                  </SelectContent>
               </Select>

               <Select value={itemsPerPage.toString()} onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}>
                  <SelectTrigger className="w-[140px] h-9 rounded-lg bg-slate-50 border-none text-[11px] font-bold text-slate-500">
                     <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                     {ITEMS_PER_PAGE_OPTIONS.map(option => (
                       <SelectItem key={option} value={option.toString()} className="text-xs font-semibold">
                         {option} per halaman
                       </SelectItem>
                     ))}
                  </SelectContent>
               </Select>

               <span className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100 text-[11px] font-bold text-slate-500 whitespace-nowrap self-center">
                  {filtered.length} items
               </span>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
             <Table>
                <TableHeader className="bg-slate-50/70">
                   <TableRow className="border-slate-100 hover:bg-transparent">
                      <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400 pl-4">Karyawan</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400">Kursus</TableHead>
                      <TableHead className="text-center text-[10px] font-black uppercase tracking-wider text-slate-400">Tenggat</TableHead>
                      <TableHead className="text-center text-[10px] font-black uppercase tracking-wider text-slate-400">Nilai</TableHead>
                      <TableHead className="text-center text-[10px] font-black uppercase tracking-wider text-slate-400">Status</TableHead>
                      <TableHead className="text-center text-[10px] font-black uppercase tracking-wider text-slate-400">Log</TableHead>
                      <TableHead className="text-right text-[10px] font-black uppercase tracking-wider text-slate-400 pr-4">Opsi</TableHead>
                   </TableRow>
                </TableHeader>
                <TableBody>
                   {paginatedEnrollments.length === 0 ? (
                     <TableRow>
                        <TableCell colSpan={7}>
                           <EmptyState 
                            title="Enrollment Tidak Ditemukan"
                            description="Gunakan filter atau kata kunci lain untuk menemukan data pendaftaran."
                            action={<Button variant="outline" onClick={() => { setSearch(""); setStatusFilter("all"); setCourseFilter("all"); setSourceFilter("all"); }}>Reset Semua Filter</Button>}
                           />
                        </TableCell>
                     </TableRow>
                   ) : (
                    paginatedEnrollments.map((row) => {
                      const isExpired = row.status !== "COMPLETED" && row.courseDeadline && new Date(row.courseDeadline) < new Date();
                      return (
                        <TableRow key={row.id} className={cn(
                          "group hover:bg-slate-50/50 transition-colors h-16",
                          row.status === "PENDING" && "bg-amber-50/30 border-l-4 border-l-amber-400"
                        )}>
                           <TableCell className="px-6">
                              <div className="flex items-center gap-3">
                                 <div className={cn(
                                   "h-9 w-9 rounded-xl border flex items-center justify-center font-bold text-[11px]",
                                   row.status === "PENDING" 
                                     ? "bg-amber-50 border-amber-200 text-amber-700" 
                                     : "bg-indigo-50 border-indigo-100 text-indigo-700"
                                 )}>
                                    {row.userName.charAt(0)}
                                 </div>
                                 <div className="flex flex-col">
                                    <span className="text-[13px] font-bold text-[#0F1C3F]">{row.userName}</span>
                                    <span className="text-[10px] font-medium text-slate-400">{row.userNip} • {row.userDept}</span>
                                 </div>
                              </div>
                           </TableCell>
                           <TableCell>
                              <div className="flex flex-col max-w-[200px]">
                                 <span className="text-[12px] font-bold text-[#0F1C3F] truncate">{row.courseTitle}</span>
                                 <span className="text-[10px] font-medium text-slate-400">{row.courseCategory} • {row.source}</span>
                              </div>
                           </TableCell>
                           <TableCell className="text-center">
                              {row.courseDeadline ? (
                                <div className="flex flex-col items-center">
                                   <span className={cn("text-[11px] font-bold", isExpired ? "text-rose-600" : "text-slate-700")}>
                                      {new Date(row.courseDeadline).toLocaleDateString("id-ID", { day: 'numeric', month: 'short' })}
                                   </span>
                                   <span className="text-[9px] font-medium text-slate-400">
                                      {isExpired ? "Tenggat Lewat" : "Tenggat Aktif"}
                                   </span>
                                </div>
                              ) : <span className="text-slate-300">—</span>}
                           </TableCell>
                           <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-2">
                                <div className="text-center">
                                  <p className="text-[11px] font-bold text-indigo-600">
                                    {row.preScore != null ? Number(row.preScore).toFixed(0) : "—"}
                                  </p>
                                  <p className="text-[8px] font-bold text-slate-300 uppercase">Pre</p>
                                </div>
                                <div className="h-6 w-px bg-slate-100" />
                                <div className="text-center">
                                  <p className={cn("text-[11px] font-bold", row.postPassed === true ? "text-emerald-600" : row.postPassed === false ? "text-rose-600" : "text-slate-600")}>
                                    {row.postScore != null ? Number(row.postScore).toFixed(0) : "—"}
                                  </p>
                                  <p className="text-[8px] font-bold text-slate-300 uppercase">Post</p>
                                </div>
                              </div>
                           </TableCell>
                           <TableCell className="text-center">
                              <EnrollmentHistoryTooltip data={row}>
                                 <div className="flex flex-col items-center gap-1">
                                    <StatusBadge status={row.status as any} />
                                    {/* Attempt Counter for FAILED status */}
                                    {row.status === "FAILED" && (
                                       <span className="text-[9px] text-slate-400">
                                          {(row as any).postTestAttempts ?? 0} / {(row as any).maxPostTestAttempts ?? 3} Perc.
                                       </span>
                                    )}
                                 </div>
                              </EnrollmentHistoryTooltip>
                           </TableCell>
                           <TableCell className="text-center">
                              <EnrollmentHistoryTooltip data={row}>
                                 <div className="flex flex-col items-center cursor-help">
                                    {(row.reportedAt || row.escalatedAt) ? (
                                       <Badge variant={row.escalatedAt ? "destructive" : "default"} className="h-5 text-[8px] font-bold uppercase px-1.5">
                                          {row.escalatedAt ? "Eskalasi" : "Report"}
                                       </Badge>
                                    ) : <span className="text-[#E2E6F0]"><Activity className="h-4 w-4" /></span>}
                                 </div>
                              </EnrollmentHistoryTooltip>
                           </TableCell>
                           <TableCell className="text-right pr-6">
                              <DropdownMenu>
                                 <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                                       <MoreVertical className="h-4 w-4 text-slate-400" />
                                    </Button>
                                 </DropdownMenuTrigger>
                                 <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-2xl border-slate-100">
                                    {row.status === "PENDING" && (
                                      <>
                                        <DropdownMenuItem 
                                          className="rounded-xl p-3 cursor-pointer gap-3" 
                                          onClick={() => handleApprove(row.id)}
                                          disabled={isApproving === row.id}
                                        >
                                           <CheckCircle2 className={cn("h-4 w-4 text-emerald-500", isApproving === row.id && "animate-spin")} />
                                           <div className="flex flex-col">
                                             <span className="text-sm font-bold">
                                               {isApproving === row.id ? "Menyetujui..." : "Setujui"}
                                             </span>
                                           </div>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem 
                                          className="rounded-xl p-3 cursor-pointer gap-3 text-rose-600 focus:text-rose-600" 
                                          onClick={() => setRejectingId(row.id)}
                                        >
                                           <XCircle className="h-4 w-4" />
                                           <div className="flex flex-col"><span className="text-sm font-bold">Tolak</span></div>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                      </>
                                    )}
                                    <Link href={`/admin/courses/${row.courseId}/report`}>
                                      <DropdownMenuItem className="rounded-xl p-3 cursor-pointer gap-3">
                                         <TrendingUp className="h-4 w-4 text-indigo-500" />
                                         <span className="text-sm font-bold">Laporan Kursus</span>
                                      </DropdownMenuItem>
                                    </Link>
                                    <DropdownMenuItem className="rounded-xl p-3 cursor-pointer gap-3" onClick={() => openPokeDialog(row.id, row.userName, row.courseTitle)}>
                                       <Bell className={cn("h-4 w-4", pokingId === row.id ? "text-amber-500 animate-bounce" : "text-amber-500")} />
                                       <span className="text-sm font-bold">Kirim Pengingat (Poke)</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="rounded-xl p-3 cursor-pointer gap-3 text-rose-600 focus:text-rose-600" onClick={() => handleDelete(row.id)}>
                                       <Trash2 className="h-4 w-4" />
                                       <span className="text-sm font-bold">Hapus Enrollment</span>
                                    </DropdownMenuItem>
                                 </DropdownMenuContent>
                              </DropdownMenu>
                           </TableCell>
                        </TableRow>
                      )
                    })
                   )}
                </TableBody>
             </Table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filtered.length}
            itemsPerPage={itemsPerPage}
            itemLabel="enrollment"
          />
        </TabsContent>

        <TabsContent value="scheduler" className="focus-visible:outline-none focus-visible:ring-0">
           <EnrollmentScheduler 
              courses={courses}
              departments={departments}
              autoEnrollRules={autoEnrollRules}
              deptConfigs={deptConfigs}
           />
        </TabsContent>
      </Tabs>

      {/* Poke Dialog */}
      <Dialog open={pokeDialogOpen} onOpenChange={(open) => !open && closePokeDialog()}>
        <DialogContent className="sm:max-w-[420px] rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#0F1C3F] flex items-center gap-2">
              <Bell className="h-5 w-5 text-amber-500" />
              Kirim Colekan
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Kirim pengingat manual ke karyawan untuk menyelesaikan pelatihan.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-3">
            <div className="bg-slate-50 p-2.5 rounded-lg">
              <p className="text-xs text-slate-500">Karyawan</p>
              <p className="font-semibold text-sm text-slate-900">{pokeTarget?.name}</p>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg">
              <p className="text-xs text-slate-500">Kursus</p>
              <p className="font-semibold text-sm text-slate-900">{pokeTarget?.courseTitle}</p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Catatan Tambahan (Opsional)
              </label>
              <Textarea
                value={pokeNote}
                onChange={(e) => setPokeNote(e.target.value)}
                placeholder="Tambahkan pesan khusus untuk karyawan..."
                className="min-h-[80px] resize-none text-sm"
              />
              <p className="text-xs text-slate-500">
                Catatan ini akan muncul di email dan notifikasi karyawan.
              </p>
            </div>

            <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-100">
              <p className="text-xs text-amber-700">
                <strong>Perhatian:</strong> Colekan hanya dapat dikirim sekali setiap 24 jam per karyawan. 
                Pastikan pesan Anda jelas dan sopan.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closePokeDialog} size="sm">
              Batal
            </Button>
            <Button 
              onClick={handlePoke}
              disabled={pokingId === pokeTarget?.id}
              className="bg-amber-500 hover:bg-amber-600 text-white"
              size="sm"
            >
              {pokingId === pokeTarget?.id ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mengirim...
                </>
              ) : (
                <>
                  <Bell className="mr-2 h-4 w-4" />
                  Kirim Colekan
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={!!rejectingId} onOpenChange={(open) => !open && setRejectingId(null)}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-[#0F1C3F]">Tolak Pendaftaran</DialogTitle>
            <DialogDescription className="text-xs font-semibold text-slate-500">
              Pendaftaran akan dibatalkan. Mohon sertakan alasan spesifik untuk diinfokan ke karyawan.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Contoh: Kuota kelas bulan ini sudah penuh..."
              className="resize-none h-24 rounded-xl shadow-sm focus-visible:ring-[#0F1C3F]/20 text-sm"
              value={rejectionNote}
              onChange={(e) => setRejectionNote(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectingId(null)} className="rounded-xl h-10 px-6 text-slate-600 font-bold border-slate-200">
              Batal
            </Button>
            <Button onClick={handleReject} disabled={!rejectionNote.trim()} className="rounded-xl h-10 px-6 font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xl shadow-rose-200">
              Tolak Enrollment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
