"use client";

import { useState, useMemo, useEffect } from "react";
import {
  PlusCircle,
  Search,
  BookOpen,
  CheckCircle2,
  FileEdit,
  Trash,
  Users,
  TrendingUp,
  GraduationCap,
  LayoutGrid,
  List,
  MoreVertical,
  CalendarDays,
  Filter,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { deleteCourse } from "../actions";
import { Pagination } from "@/components/admin/Pagination";
import { startOfMonth, subMonths, format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/admin/ui/page-header";
import { StatusBadge } from "@/components/admin/ui/status-badge";
import { EmptyState } from "@/components/admin/ui/empty-state";
import { DataCard } from "@/components/analytics/data-card";

const ITEMS_PER_PAGE = 10;

interface CoursesClientProps {
  courses: any[];
}

type FilterType = "all" | "published" | "draft";
type ViewMode = "list" | "grid";

export const CoursesClient = ({ courses }: CoursesClientProps) => {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [currentPage, setCurrentPage] = useState(1);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null);

  const onConfirmDelete = async () => {
    if (!courseToDelete) return;
    try {
      setIsDeleting(courseToDelete);
      const result = await deleteCourse(courseToDelete);
      if (result.success) {
        toast.success("Kursus berhasil dihapus");
        router.refresh();
      } else {
        toast.error("Gagal menghapus kursus: " + result.error);
      }
    } catch {
      toast.error("Terjadi kesalahan saat menghapus kursus");
    } finally {
      setIsDeleting(null);
      setShowConfirm(false);
      setCourseToDelete(null);
    }
  };

  const filteredCourses = useMemo(() => {
    return (courses || []).filter((course) => {
      const searchLower = search.toLowerCase();
      
      // Search in title, description, and category name
      const matchSearch = 
        (course.title || "").toLowerCase().includes(searchLower) ||
        (course.description || "").toLowerCase().includes(searchLower) ||
        (course.category?.name || "").toLowerCase().includes(searchLower);
      
      const matchFilter =
        filter === "all" ||
        (filter === "published" && course.isPublished) ||
        (filter === "draft" && !course.isPublished);
      
      return matchSearch && matchFilter;
    });
  }, [courses, search, filter]);

  const totalPages = Math.ceil(filteredCourses.length / ITEMS_PER_PAGE);

  // Auto-adjust currentPage when it exceeds totalPages (e.g., after delete)
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    } else if (totalPages === 0 && currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  // Use currentPage directly (will be auto-adjusted by useEffect)
  const paginatedCourses = filteredCourses.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const publishedCount = courses.filter((c) => c.isPublished).length;
  const draftCount = courses.filter((c) => !c.isPublished).length;
  const totalEnrollments = courses.reduce((sum, c) => sum + (c._count?.enrollments ?? 0), 0);

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-700">
      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={onConfirmDelete}
        title="Hapus Kursus Secara Permanen?"
        description="Aksi ini tidak dapat dibatalkan. Seluruh data modul, asesmen, dan progres peserta akan ikut terhapus."
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
      />

      <PageHeader
        title="Katalog Kursus"
        description="Manajemen kurikulum, materi pembelajaran, dan pemantauan peserta dilingkungan BNI Finance."
        actions={
          <Link href="/admin/courses/create">
            <Button className="bg-[#0F1C3F] hover:bg-[#1A2D5A] text-white gap-2 h-10 px-5 rounded-lg shadow-sm font-bold transition-all active:scale-95 font-['DM_Sans']">
              <PlusCircle className="h-4 w-4 text-white" />
              Tambah Kursus
            </Button>
          </Link>
        }
      />

      {/* Metrics Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
         <DataCard label="Total Kursus" value={courses.length} icon={BookOpen} color="blue" description="Katalog materi terdaftar" />
         <DataCard label="Aktif/Published" value={publishedCount} icon={CheckCircle2} color="emerald" description="Dapat diakses karyawan" />
         <DataCard label="Draft" value={draftCount} icon={FileEdit} color="amber" description="Dalam proses pengembangan" />
         <DataCard label="Total Peserta" value={totalEnrollments} icon={Users} color="indigo" description="Akumulasi pendaftaran materi" />
      </div>

      {/* Modern Toolbar */}
      <Card className="rounded-xl border border-[#E4E7EC] bg-white shadow-sm overflow-hidden p-2.5">
         <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
               <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#98A2B3]" />
               <Input 
                 placeholder="Cari materi berdasarkan judul..."
                 value={search}
                 onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                 }}
                 className="pl-10 h-10 rounded-lg bg-[#F8F9FB] border border-[#E4E7EC] focus-visible:ring-1 focus-visible:ring-[#0F1C3F] focus-visible:bg-white placeholder:text-[#98A2B3] font-medium transition-colors"
               />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
               <Select value={filter} onValueChange={(val: FilterType) => {
                  setFilter(val);
                  setCurrentPage(1);
               }}>
                  <SelectTrigger className="w-full md:w-[160px] h-10 rounded-lg bg-[#F8F9FB] border border-[#E4E7EC] font-bold text-[11px] uppercase tracking-wider text-[#475467] transition-all hover:bg-white hover:border-[#0F1C3F]/30">
                     <div className="flex items-center gap-2">
                        <Filter className="h-3.5 w-3.5" />
                        <SelectValue placeholder="Filter Status" />
                     </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-[#E4E7EC] shadow-lg bg-white">
                     <SelectItem value="all" className="text-[11px] font-bold uppercase py-2.5 focus:bg-[#F8F9FB] focus:text-[#0F1C3F] cursor-pointer">Semua Kursus</SelectItem>
                     <SelectItem value="published" className="text-[11px] font-bold uppercase py-2.5 focus:bg-[#F8F9FB] focus:text-[#0F1C3F] cursor-pointer">Terbit (Published)</SelectItem>
                     <SelectItem value="draft" className="text-[11px] font-bold uppercase py-2.5 focus:bg-[#F8F9FB] focus:text-[#0F1C3F] cursor-pointer">Draft (Editing)</SelectItem>
                  </SelectContent>
               </Select>

               <div className="h-10 w-px bg-[#E4E7EC] hidden md:block" />

               <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)} className="w-[90px]">
                 <TabsList className="grid w-full grid-cols-2 h-10 bg-[#F8F9FB] border border-[#E4E7EC] rounded-lg p-1">
                   <TabsTrigger value="list" className="rounded-md h-7 data-[state=active]:bg-white data-[state=active]:text-[#0F1C3F] data-[state=active]:shadow-sm transition-all">
                      <List className="h-4 w-4" />
                   </TabsTrigger>
                   <TabsTrigger value="grid" className="rounded-md h-7 data-[state=active]:bg-white data-[state=active]:text-[#0F1C3F] data-[state=active]:shadow-sm transition-all">
                      <LayoutGrid className="h-4 w-4" />
                   </TabsTrigger>
                 </TabsList>
               </Tabs>
            </div>
         </div>
      </Card>

      {/* Main Content Area */}
      {filteredCourses.length > 0 ? (
         <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 font-['DM_Sans']">
            {viewMode === "list" ? (
               <Card className="rounded-xl border border-[#E4E7EC] bg-white shadow-sm overflow-hidden">
                  <Table>
                     <TableHeader className="bg-[#F8F9FB] border-b border-[#E4E7EC]">
                        <TableRow className="border-none hover:bg-transparent">
                           <TableHead className="w-[400px] text-[11px] font-bold uppercase tracking-wider text-[#475467] pl-6 py-3 font-['Lexend_Deca']">Detail Kursus</TableHead>
                           <TableHead className="text-[11px] font-bold uppercase tracking-wider text-[#475467] py-3 font-['Lexend_Deca']">Status</TableHead>
                           <TableHead className="text-[11px] font-bold uppercase tracking-wider text-[#475467] py-3 font-['Lexend_Deca']">Modul</TableHead>
                           <TableHead className="text-[11px] font-bold uppercase tracking-wider text-[#475467] py-3 font-['Lexend_Deca']">Peserta</TableHead>
                           <TableHead className="text-[11px] font-bold uppercase tracking-wider text-[#475467] text-right pr-6 py-3 font-['Lexend_Deca']">Aksi</TableHead>
                        </TableRow>
                     </TableHeader>
                     <TableBody className="divide-y divide-[#E4E7EC]">
                        {paginatedCourses.map((course: any) => (
                           <TableRow key={course.id} className="group hover:bg-[#F8F9FB] transition-colors border-none">
                              <TableCell className="pl-6 py-4">
                                 <div className="flex items-center gap-4">
                                    <div className={cn(
                                       "h-12 w-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-[#E4E7EC]",
                                       course.isPublished ? "bg-[#EFF8FF] text-[#175CD3]" : "bg-[#F1F3F7] text-[#475467]"
                                    )}>
                                       <BookOpen className="h-5 w-5" />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                       <span className="text-sm font-bold text-[#101828] font-['Lexend_Deca'] truncate group-hover:text-[#0F1C3F] transition-colors">{course.title}</span>
                                       <span className="text-[11px] font-medium text-[#475467] mt-0.5 truncate">{course.category?.name || "Uncategorized"}</span>
                                    </div>
                                 </div>
                              </TableCell>
                              <TableCell>
                                 <StatusBadge status={course.isPublished ? "PUBLISHED" : "DRAFT"} />
                              </TableCell>
                              <TableCell>
                                 <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-[11px] font-bold bg-[#F8F9FB] text-[#475467] border-[#E4E7EC] shadow-none">
                                       {course._count?.modules ?? 0} Modul
                                    </Badge>
                                 </div>
                              </TableCell>
                              <TableCell>
                                 <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-[#98A2B3]" />
                                    <span className="text-[11px] font-bold text-[#475467]">{course._count?.enrollments ?? 0} Peserta</span>
                                 </div>
                              </TableCell>
                              <TableCell className="text-right pr-6">
                                 <CourseActionMenu course={course} onShowConfirm={setShowConfirm} setCourseToDelete={setCourseToDelete} />
                              </TableCell>
                           </TableRow>
                        ))}
                     </TableBody>
                  </Table>
               </Card>
            ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {paginatedCourses.map((course: any) => (
                     <Card key={course.id} className="group rounded-xl border border-[#E4E7EC] bg-white shadow-sm overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-[#0F1C3F]/20 hover:-translate-y-1">
                        <div className={cn(
                           "h-32 p-6 flex flex-col justify-between relative",
                           course.isPublished ? "bg-[#0F1C3F]" : "bg-[#475467]"
                        )}>
                           <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#E8A020_1px,transparent_1px)] [background-size:20px_20px]" />
                           <div className="flex items-center justify-between relative z-10">
                              <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
                                 <GraduationCap className="h-5 w-5 text-white" />
                              </div>
                              <StatusBadge status={course.isPublished ? "PUBLISHED" : "DRAFT"} />
                           </div>
                           <div className="relative z-10">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-white/80">{course.category?.name || "Materi"}</span>
                           </div>
                        </div>
                        <CardContent className="p-5">
                           <h3 className="text-base font-bold text-[#101828] font-['Lexend_Deca'] line-clamp-2 group-hover:text-[#0F1C3F] transition-colors leading-relaxed h-12 mb-4">
                              {course.title}
                           </h3>
                           <div className="grid grid-cols-2 gap-3 mb-5 pt-4 border-t border-[#E4E7EC]">
                              <div className="flex flex-col">
                                 <span className="text-[9px] font-bold uppercase tracking-wider text-[#98A2B3]">ISI MATERI</span>
                                 <span className="text-xs font-bold text-[#101828] mt-1">{course._count?.modules ?? 0} Modul</span>
                              </div>
                              <div className="flex flex-col">
                                 <span className="text-[9px] font-bold uppercase tracking-wider text-[#98A2B3]">PARTISIPAN</span>
                                 <span className="text-xs font-bold text-[#101828] mt-1">{course._count?.enrollments ?? 0} User</span>
                              </div>
                           </div>
                           <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#475467]">
                                 <CalendarDays className="h-3.5 w-3.5" />
                                 {format(new Date(course.createdAt), "dd MMM yyyy", { locale: localeId })}
                              </div>
                              <div className="flex items-center gap-1">
                                 <Link href={`/admin/courses/${course.id}`}>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-[#F8F9FB] hover:text-[#0F1C3F]">
                                       <FileEdit className="h-4 w-4" />
                                    </Button>
                                 </Link>
                                 <CourseActionMenu course={course} onShowConfirm={setShowConfirm} setCourseToDelete={setCourseToDelete} />
                              </div>
                           </div>
                        </CardContent>
                     </Card>
                  ))}
               </div>
            )}
         </div>
      ) : (
         <EmptyState 
           title={search ? "Pencarian Nihil" : "Belum Ada Kursus"}
           description={search ? "Kami tidak menemukan materi yang sesuai dengan kata kunci Anda." : "Sepertinya platform pembelajaran Anda masih kosong dari materi kursus."}
         />
      )}

      {/* Pagination Section */}
      {filteredCourses.length > 0 && (
         <div className="mt-8 flex justify-center">
            <Pagination
               currentPage={currentPage}
               totalPages={totalPages}
               onPageChange={setCurrentPage}
               totalItems={filteredCourses.length}
               itemsPerPage={ITEMS_PER_PAGE}
               itemLabel="kursus"
            />
         </div>
      )}
    </div>
  );
};

const CourseActionMenu = ({ course, onShowConfirm, setCourseToDelete }: { 
   course: any, 
   onShowConfirm: (v: boolean) => void, 
   setCourseToDelete: (v: string | null) => void 
}) => (
   <DropdownMenu>
     <DropdownMenuTrigger asChild>
       <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-slate-100">
         <MoreVertical className="h-4 w-4 text-slate-500" />
       </Button>
     </DropdownMenuTrigger>
     <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-2xl border-slate-100 animate-in fade-in zoom-in duration-200">
       <div className="px-3 py-2 border-b border-slate-50 mb-1">
          <p className="text-[10px] font-black uppercase tracking-tighter text-slate-300">Opsi Kursus</p>
       </div>
       <Link href={`/admin/courses/${course.id}`}>
         <DropdownMenuItem className="rounded-xl flex items-center gap-3 p-3 cursor-pointer group">
           <FileEdit className="h-4 w-4 text-amber-500 group-hover:scale-110 transition-transform" />
           <div className="flex flex-col">
              <span className="text-sm font-bold text-[#0F1C3F]">Edit Materi</span>
              <p className="text-[9px] font-medium text-slate-400 truncate max-w-[150px]">Modifikasi isi kursus</p>
           </div>
         </DropdownMenuItem>
       </Link>
       <Link href={`/admin/courses/${course.id}/report`}>
         <DropdownMenuItem className="rounded-xl flex items-center gap-3 p-3 cursor-pointer group">
           <TrendingUp className="h-4 w-4 text-indigo-500 group-hover:scale-110 transition-transform" />
           <div className="flex flex-col">
              <span className="text-sm font-bold text-[#0F1C3F]">Laporan Progres</span>
              <p className="text-[9px] font-medium text-slate-400">Pantau hasil belajar</p>
           </div>
         </DropdownMenuItem>
       </Link>
       <DropdownMenuSeparator className="bg-slate-50" />
       <DropdownMenuItem 
         className="rounded-xl flex items-center gap-3 p-3 cursor-pointer text-rose-600 focus:text-rose-600 focus:bg-rose-50 group"
         onClick={() => {
           setCourseToDelete(course.id);
           onShowConfirm(true);
         }}
       >
         <Trash className="h-4 w-4" />
         <div className="flex flex-col">
            <span className="text-sm font-bold">Hapus Kursus</span>
            <p className="text-[9px] font-medium text-rose-400">Aksi tidak dapat dibatalkan</p>
         </div>
       </DropdownMenuItem>
     </DropdownMenuContent>
   </DropdownMenu>
);