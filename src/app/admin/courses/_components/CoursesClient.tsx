"use client";

import { useState } from "react";
import {
  PlusCircle,
  Search,
  BookOpen,
  CheckCircle2,
  FileEdit,
  BarChart3,
  ChevronRight,
  Filter,
  Trash,
  Users,
  Eye,
  GraduationCap,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { deleteCourse } from "../actions";

interface CoursesClientProps {
  courses: any[];
}

export const CoursesClient = ({ courses }: CoursesClientProps) => {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all");
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

  const filteredCourses = courses.filter((course) => {
    const matchSearch = course.title.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "all" ||
      (filter === "published" && course.isPublished) ||
      (filter === "draft" && !course.isPublished);
    return matchSearch && matchFilter;
  });

  const publishedCount = courses.filter((c) => c.isPublished).length;
  const draftCount = courses.filter((c) => !c.isPublished).length;
  const totalEnrollments = courses.reduce((sum, c) => sum + (c._count?.enrollments ?? 0), 0);

  const summaryStats = [
    {
      label: "Total Kursus",
      value: courses.length,
      icon: BookOpen,
      color: "blue" as const,
      bg: "bg-blue-50",
      text: "text-blue-600",
      border: "border-blue-100",
    },
    {
      label: "Published",
      value: publishedCount,
      icon: CheckCircle2,
      color: "emerald" as const,
      bg: "bg-emerald-50",
      text: "text-emerald-600",
      border: "border-emerald-100",
    },
    {
      label: "Draft",
      value: draftCount,
      icon: FileEdit,
      color: "amber" as const,
      bg: "bg-amber-50",
      text: "text-amber-600",
      border: "border-amber-100",
    },
    {
      label: "Total Peserta",
      value: totalEnrollments,
      icon: Users,
      color: "indigo" as const,
      bg: "bg-indigo-50",
      text: "text-indigo-600",
      border: "border-indigo-100",
    },
  ];

  return (
    <div className="space-y-8 pb-10">
      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={onConfirmDelete}
        title="Hapus Kursus?"
        description="Aksi ini akan menghapus kursus secara permanen beserta seluruh modul dan data terkait. Aksi ini tidak dapat dibatalkan."
        confirmLabel="Ya, Hapus Permanen"
        cancelLabel="Batal"
      />

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Katalog Kursus</h1>
          <p className="text-slate-500 font-medium mt-1">
            Kelola materi, kurikulum, dan asesmen secara terpusat.
          </p>
        </div>
        <Link href="/admin/courses/create">
          <Button className="font-black gap-2 h-12 px-6 shadow-lg shadow-primary/20 hover:shadow-xl transition-all">
            <PlusCircle className="h-5 w-5" />
            Buat Kursus Baru
          </Button>
        </Link>
      </div>

      {/* ── Summary Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryStats.map((stat) => (
          <Card
            key={stat.label}
            className={cn(
              "border shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group bg-white",
              stat.border
            )}
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                  {stat.label}
                </p>
                <div className={cn("p-2 rounded-xl", stat.bg)}>
                  <stat.icon className={cn("h-4 w-4", stat.text)} />
                </div>
              </div>
              <p className={cn("text-3xl font-black tracking-tighter", stat.text)}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="flex flex-col md:flex-row gap-3 items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        {/* Search */}
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Cari judul kursus..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-11 h-11 bg-slate-50 border-none font-medium focus-visible:ring-primary/20 rounded-xl"
          />
        </div>
        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 shrink-0">
          {(["all", "published", "draft"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all",
                filter === f
                  ? "bg-white shadow-sm text-slate-800"
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              {f === "all" ? "Semua" : f === "published" ? "Published" : "Draft"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Course List ── */}
      {filteredCourses.length > 0 ? (
        <div className="space-y-3">
          {filteredCourses.map((course) => {
            const enrollmentCount = course._count?.enrollments ?? 0;
            const moduleCount = course._count?.modules ?? 0;

            return (
              <Card
                key={course.id}
                className="group hover:border-primary/30 hover:shadow-md transition-all duration-300 border-slate-100 shadow-sm overflow-hidden bg-white"
              >
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row md:items-center p-5 gap-5">
                    {/* Icon */}
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center shrink-0 border border-slate-100 group-hover:from-primary/5 group-hover:to-primary/10 group-hover:border-primary/20 transition-all">
                      <GraduationCap className="h-7 w-7 text-slate-300 group-hover:text-primary transition-colors" />
                    </div>

                    {/* Course Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <Badge
                          variant="outline"
                          className="text-[10px] font-black uppercase tracking-wider bg-slate-50 border-slate-200 text-slate-500"
                        >
                          {course.category?.name || "Tanpa Kategori"}
                        </Badge>
                        {course.isPublished ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10 border-none text-[10px] font-black">
                            ✓ Published
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/10 border-none text-[10px] font-black">
                            ✎ Draft
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-base font-black text-slate-800 line-clamp-1 group-hover:text-primary transition-colors">
                        {course.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-4 mt-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                          <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                          {moduleCount} Modul
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                          <Users className="h-3.5 w-3.5 text-slate-400" />
                          {enrollmentCount} Peserta
                        </div>
                        <div className="text-xs font-bold text-slate-400">
                          {new Date(course.createdAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Enrollment Progress Bar */}
                    <div className="hidden lg:flex flex-col gap-1 min-w-[120px]">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                        Peserta
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${Math.min(enrollmentCount * 10, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-black text-slate-500">{enrollmentCount}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Detail Report */}
                      <Link href={`/admin/courses/${course.id}/report`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="font-bold text-indigo-600 border-indigo-200 hover:bg-indigo-50 gap-1.5"
                        >
                          <TrendingUp className="h-3.5 w-3.5" />
                          Laporan
                        </Button>
                      </Link>
                      {/* Edit */}
                      <Link href={`/admin/courses/${course.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="font-bold text-slate-600 gap-1.5 hover:bg-primary/5 hover:text-primary"
                        >
                          <FileEdit className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                      </Link>
                      {/* Delete */}
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={isDeleting === course.id}
                        className="text-slate-300 hover:text-red-500 hover:bg-red-50 h-9 w-9 transition-colors"
                        onClick={() => {
                          setCourseToDelete(course.id);
                          setShowConfirm(true);
                        }}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-100 text-center space-y-5">
          <div className="p-6 bg-slate-50 rounded-full">
            <Search className="h-10 w-10 text-slate-200" />
          </div>
          <div>
            <h4 className="text-xl font-black text-slate-800">Tidak ada kursus ditemukan</h4>
            <p className="text-slate-400 font-medium mt-1">
              {search ? "Coba gunakan kata kunci yang berbeda." : "Mulai buat kursus pertama Anda."}
            </p>
          </div>
          {search ? (
            <Button variant="outline" onClick={() => setSearch("")} className="font-bold">
              Reset Pencarian
            </Button>
          ) : (
            <Link href="/admin/courses/create">
              <Button className="font-bold gap-2">
                <PlusCircle className="h-4 w-4" />
                Buat Kursus Pertama
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
};
