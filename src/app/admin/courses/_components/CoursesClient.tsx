"use client";

import { useState } from "react";
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
  SlidersHorizontal,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { deleteCourse } from "../actions";

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
    const matchSearch = course.title
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchFilter =
      filter === "all" ||
      (filter === "published" && course.isPublished) ||
      (filter === "draft" && !course.isPublished);
    return matchSearch && matchFilter;
  });

  const publishedCount = courses.filter((c) => c.isPublished).length;
  const draftCount = courses.filter((c) => !c.isPublished).length;
  const totalEnrollments = courses.reduce(
    (sum, c) => sum + (c._count?.enrollments ?? 0),
    0
  );

  const stats = [
    {
      label: "Total Kursus",
      value: courses.length,
      iconBg: "#EEF2FF",
      iconColor: "#6366F1",
      icon: <BookOpen className="h-5 w-5" />,
    },
    {
      label: "Published",
      value: publishedCount,
      iconBg: "#F0FDF4",
      iconColor: "#10B981",
      icon: <CheckCircle2 className="h-5 w-5" />,
    },
    {
      label: "Draft",
      value: draftCount,
      iconBg: "#FFF8E7",
      iconColor: "#E8A020",
      icon: <FileEdit className="h-5 w-5" />,
    },
    {
      label: "Total Peserta",
      value: totalEnrollments,
      iconBg: "#F0F9FF",
      iconColor: "#0EA5E9",
      icon: <Users className="h-5 w-5" />,
    },
  ];

  const FILTER_OPTIONS: { key: FilterType; label: string }[] = [
    { key: "all", label: "Semua" },
    { key: "published", label: "Published" },
    { key: "draft", label: "Draft" },
  ];

  return (
    <div
      className="w-full min-w-0 space-y-6 pb-12 md:pb-16"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p
            className="text-[10px] font-black uppercase tracking-[0.2em] mb-1"
            style={{ color: "#9AAABF" }}
          >
            Manajemen Konten
          </p>
          <h1
            className="text-2xl md:text-3xl font-black tracking-tight"
            style={{ color: "#0F1C3F", fontFamily: "'Lexend Deca', sans-serif" }}
          >
            Katalog Kursus
          </h1>
          <p className="text-sm font-medium mt-0.5" style={{ color: "#7A8599" }}>
            Kelola materi, kurikulum, dan asesmen secara terpusat.
          </p>
        </div>
        <Link href="/admin/courses/create">
          <button
            className="flex items-center gap-2.5 h-11 px-6 rounded-xl font-black text-sm uppercase tracking-wider transition-all hover:brightness-110 active:scale-[0.97] whitespace-nowrap"
            style={{
              background: "linear-gradient(135deg, #0F1C3F, #1A3060)",
              color: "white",
              boxShadow: "0 4px 16px rgba(15,28,63,0.25)",
            }}
          >
            <PlusCircle className="h-4 w-4" style={{ color: "#E8A020" }} />
            Buat Kursus Baru
          </button>
        </Link>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl p-5 flex items-center gap-4 transition-all hover:-translate-y-0.5"
            style={{
              background: "white",
              border: "1px solid #E2E6F0",
              boxShadow: "0 1px 4px rgba(15,28,63,0.06)",
            }}
          >
            <div
              className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: s.iconBg, color: s.iconColor }}
            >
              {s.icon}
            </div>
            <div>
              <p
                className="text-2xl font-black leading-none mb-1"
                style={{ color: "#0F1C3F" }}
              >
                {s.value}
              </p>
              <p
                className="text-[10px] font-black uppercase tracking-widest"
                style={{ color: "#9AAABF" }}
              >
                {s.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div
        className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center p-3 rounded-2xl"
        style={{
          background: "white",
          border: "1px solid #E2E6F0",
          boxShadow: "0 1px 4px rgba(15,28,63,0.04)",
        }}
      >
        {/* Search */}
        <div className="relative flex-1">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
            style={{ color: "#B0BAD0" }}
          />
          <input
            placeholder="Cari judul kursus..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-10 rounded-xl text-sm font-medium outline-none transition-all"
            style={{
              background: "#F8FAFC",
              border: "1px solid #E8ECF5",
              color: "#0F1C3F",
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full flex items-center justify-center transition-all hover:brightness-90"
              style={{ background: "#D6DBE8" }}
            >
              <X className="h-3 w-3" style={{ color: "#5A6480" }} />
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div
          className="flex items-center gap-1 p-1 rounded-xl shrink-0"
          style={{ background: "#F0F2F7" }}
        >
          {FILTER_OPTIONS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="px-4 h-8 rounded-lg text-xs font-black uppercase tracking-wider transition-all"
              style={{
                background: filter === f.key ? "white" : "transparent",
                color: filter === f.key ? "#0F1C3F" : "#9AAABF",
                boxShadow:
                  filter === f.key ? "0 1px 3px rgba(15,28,63,0.1)" : "none",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Separator */}
        <div
          className="hidden sm:block h-8 w-px"
          style={{ background: "#E2E6F0" }}
        />

        {/* View toggle */}
        <div
          className="flex items-center gap-1 p-1 rounded-xl shrink-0"
          style={{ background: "#F0F2F7" }}
        >
          {(["list", "grid"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setViewMode(v)}
              className="h-8 w-8 rounded-lg flex items-center justify-center transition-all"
              style={{
                background: viewMode === v ? "white" : "transparent",
                color: viewMode === v ? "#0F1C3F" : "#B0BAD0",
                boxShadow:
                  viewMode === v ? "0 1px 3px rgba(15,28,63,0.1)" : "none",
              }}
            >
              {v === "list" ? (
                <List className="h-4 w-4" />
              ) : (
                <LayoutGrid className="h-4 w-4" />
              )}
            </button>
          ))}
        </div>

        {/* Result count */}
        <div
          className="text-[11px] font-black shrink-0 px-3 py-2 rounded-xl"
          style={{ background: "#F0F2F7", color: "#9AAABF" }}
        >
          {filteredCourses.length} KURSUS
        </div>
      </div>

      {/* ── Course List / Grid ── */}
      {filteredCourses.length > 0 ? (
        viewMode === "list" ? (
          /* ─── LIST VIEW ─── */
          <div className="space-y-3">
            {filteredCourses.map((course) => {
              const enrollmentCount = course._count?.enrollments ?? 0;
              const moduleCount = course._count?.modules ?? 0;
              const maxEnroll = Math.max(...courses.map((c) => c._count?.enrollments ?? 0), 1);
              const barWidth = Math.round((enrollmentCount / maxEnroll) * 100);

              return (
                <div
                  key={course.id}
                  className="group rounded-2xl transition-all hover:-translate-y-0.5 hover:shadow-md"
                  style={{
                    background: "white",
                    border: "1px solid #E2E6F0",
                    boxShadow: "0 1px 4px rgba(15,28,63,0.05)",
                  }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-5 p-5">
                    {/* Icon */}
                    <div
                      className="h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 transition-all group-hover:scale-105"
                      style={{
                        background: course.isPublished ? "#F0FDF4" : "#FFF8E7",
                        border: `1px solid ${course.isPublished ? "#BBF7D0" : "#F6CE72"}`,
                      }}
                    >
                      <GraduationCap
                        className="h-6 w-6"
                        style={{
                          color: course.isPublished ? "#059669" : "#E8A020",
                        }}
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 space-y-2">
                      {/* Badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {course.category?.name && (
                          <span
                            className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg"
                            style={{ background: "#F0F2F7", color: "#7A8599" }}
                          >
                            {course.category.name}
                          </span>
                        )}
                        <span
                          className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg flex items-center gap-1"
                          style={{
                            background: course.isPublished ? "#F0FDF4" : "#FFF8E7",
                            color: course.isPublished ? "#059669" : "#E8A020",
                          }}
                        >
                          {course.isPublished ? (
                            <><CheckCircle2 className="h-2.5 w-2.5" /> Published</>
                          ) : (
                            <><FileEdit className="h-2.5 w-2.5" /> Draft</>
                          )}
                        </span>
                      </div>

                      {/* Title */}
                      <h3
                        className="text-base font-black leading-snug line-clamp-1 transition-colors group-hover:text-indigo-600"
                        style={{ color: "#0F1C3F" }}
                      >
                        {course.title}
                      </h3>

                      {/* Meta */}
                      <div className="flex items-center gap-4 flex-wrap">
                        <span
                          className="flex items-center gap-1.5 text-xs font-bold"
                          style={{ color: "#9AAABF" }}
                        >
                          <BookOpen className="h-3.5 w-3.5" />
                          {moduleCount} Modul
                        </span>
                        <span
                          className="flex items-center gap-1.5 text-xs font-bold"
                          style={{ color: "#9AAABF" }}
                        >
                          <Users className="h-3.5 w-3.5" />
                          {enrollmentCount} Peserta
                        </span>
                        <span className="text-xs font-bold" style={{ color: "#C5CEDF" }}>
                          {new Date(course.createdAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Enrollment bar */}
                    <div className="hidden lg:flex flex-col gap-2 min-w-[140px]">
                      <div className="flex justify-between items-center">
                        <p
                          className="text-[9px] font-black uppercase tracking-widest"
                          style={{ color: "#B0BAD0" }}
                        >
                          Enrollment
                        </p>
                        <span
                          className="text-[11px] font-black"
                          style={{ color: "#0F1C3F" }}
                        >
                          {enrollmentCount}
                        </span>
                      </div>
                      <div
                        className="h-1.5 rounded-full overflow-hidden"
                        style={{ background: "#F0F2F7" }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${barWidth}%`,
                            background: "linear-gradient(90deg, #0F1C3F, #E8A020)",
                          }}
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Link href={`/admin/courses/${course.id}/report`}>
                        <button
                          className="flex items-center gap-1.5 h-9 px-3 rounded-xl font-black text-xs transition-all hover:brightness-95"
                          style={{
                            background: "#EEF2FF",
                            color: "#6366F1",
                            border: "1px solid #C7D2FE",
                          }}
                        >
                          <TrendingUp className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Laporan</span>
                        </button>
                      </Link>

                      <Link href={`/admin/courses/${course.id}`}>
                        <button
                          className="flex items-center gap-1.5 h-9 px-3 rounded-xl font-black text-xs transition-all hover:brightness-95"
                          style={{
                            background: "#F0F2F7",
                            color: "#0F1C3F",
                            border: "1px solid #D6DBE8",
                          }}
                        >
                          <FileEdit className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Edit</span>
                        </button>
                      </Link>

                      <button
                        onClick={() => {
                          setCourseToDelete(course.id);
                          setShowConfirm(true);
                        }}
                        disabled={isDeleting === course.id}
                        className="h-9 w-9 rounded-xl flex items-center justify-center transition-all hover:brightness-95 disabled:opacity-40"
                        style={{
                          background: "#FFF0F0",
                          color: "#EF4444",
                          border: "1px solid #FECACA",
                        }}
                      >
                        <Trash className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ─── GRID VIEW ─── */
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredCourses.map((course) => {
              const enrollmentCount = course._count?.enrollments ?? 0;
              const moduleCount = course._count?.modules ?? 0;

              return (
                <div
                  key={course.id}
                  className="group rounded-3xl overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl"
                  style={{
                    background: "white",
                    border: "1px solid #E2E6F0",
                    boxShadow: "0 2px 8px rgba(15,28,63,0.06)",
                  }}
                >
                  {/* Card top banner */}
                  <div
                    className="h-28 relative flex items-center justify-center"
                    style={{
                      background: course.isPublished
                        ? "linear-gradient(135deg, #064E3B, #065F46)"
                        : "linear-gradient(135deg, #0F1C3F, #1A2E5A)",
                    }}
                  >
                    <div
                      className="absolute inset-0 opacity-[0.04]"
                      style={{
                        backgroundImage:
                          "repeating-linear-gradient(45deg,#fff 0,transparent 1px,transparent 24px,#fff 25px)",
                        backgroundSize: "35px 35px",
                      }}
                    />
                    <div className="relative z-10 h-14 w-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110"
                      style={{
                        background: "rgba(255,255,255,0.1)",
                        border: "1px solid rgba(255,255,255,0.15)",
                      }}
                    >
                      <GraduationCap className="h-7 w-7 text-white" />
                    </div>
                    {/* Status badge */}
                    <div className="absolute top-3 right-3">
                      <span
                        className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg flex items-center gap-1"
                        style={{
                          background: course.isPublished
                            ? "rgba(52,211,153,0.2)"
                            : "rgba(232,160,32,0.2)",
                          color: course.isPublished ? "#34D399" : "#E8A020",
                          border: `1px solid ${course.isPublished ? "rgba(52,211,153,0.3)" : "rgba(232,160,32,0.3)"}`,
                        }}
                      >
                        {course.isPublished ? "Published" : "Draft"}
                      </span>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="p-5 space-y-4">
                    {course.category?.name && (
                      <span
                        className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md"
                        style={{ background: "#F0F2F7", color: "#7A8599" }}
                      >
                        {course.category.name}
                      </span>
                    )}

                    <h3
                      className="text-sm font-black leading-snug line-clamp-2 transition-colors group-hover:text-indigo-600"
                      style={{ color: "#0F1C3F" }}
                    >
                      {course.title}
                    </h3>

                    {/* Stats */}
                    <div
                      className="grid grid-cols-2 gap-2 pt-1"
                      style={{ borderTop: "1px solid #F0F2F7" }}
                    >
                      <div
                        className="flex items-center gap-2 p-2.5 rounded-xl"
                        style={{ background: "#F8FAFC" }}
                      >
                        <BookOpen className="h-3.5 w-3.5 shrink-0" style={{ color: "#9AAABF" }} />
                        <div>
                          <p className="text-xs font-black" style={{ color: "#0F1C3F" }}>
                            {moduleCount}
                          </p>
                          <p className="text-[9px] font-bold" style={{ color: "#B0BAD0" }}>
                            Modul
                          </p>
                        </div>
                      </div>
                      <div
                        className="flex items-center gap-2 p-2.5 rounded-xl"
                        style={{ background: "#F8FAFC" }}
                      >
                        <Users className="h-3.5 w-3.5 shrink-0" style={{ color: "#9AAABF" }} />
                        <div>
                          <p className="text-xs font-black" style={{ color: "#0F1C3F" }}>
                            {enrollmentCount}
                          </p>
                          <p className="text-[9px] font-bold" style={{ color: "#B0BAD0" }}>
                            Peserta
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1">
                      <Link
                        href={`/admin/courses/${course.id}`}
                        className="flex-1"
                      >
                        <button
                          className="w-full h-9 rounded-xl font-black text-xs uppercase tracking-wider transition-all hover:brightness-95"
                          style={{
                            background: "#F0F2F7",
                            color: "#0F1C3F",
                            border: "1px solid #D6DBE8",
                          }}
                        >
                          Edit Kursus
                        </button>
                      </Link>
                      <Link href={`/admin/courses/${course.id}/report`}>
                        <button
                          className="h-9 w-9 rounded-xl flex items-center justify-center transition-all hover:brightness-95"
                          style={{
                            background: "#EEF2FF",
                            color: "#6366F1",
                            border: "1px solid #C7D2FE",
                          }}
                        >
                          <TrendingUp className="h-3.5 w-3.5" />
                        </button>
                      </Link>
                      <button
                        onClick={() => {
                          setCourseToDelete(course.id);
                          setShowConfirm(true);
                        }}
                        disabled={isDeleting === course.id}
                        className="h-9 w-9 rounded-xl flex items-center justify-center transition-all hover:brightness-95 disabled:opacity-40"
                        style={{
                          background: "#FFF0F0",
                          color: "#EF4444",
                          border: "1px solid #FECACA",
                        }}
                      >
                        <Trash className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* ─── EMPTY STATE ─── */
        <div
          className="flex flex-col items-center justify-center py-24 rounded-3xl text-center space-y-5"
          style={{
            background: "white",
            border: "2px dashed #D6DBE8",
          }}
        >
          <div
            className="h-20 w-20 rounded-3xl flex items-center justify-center"
            style={{ background: "#F0F2F7" }}
          >
            <Search className="h-9 w-9" style={{ color: "#C5CEDF" }} />
          </div>
          <div>
            <h4
              className="text-xl font-black mb-1"
              style={{ color: "#0F1C3F", fontFamily: "'Lexend Deca', sans-serif" }}
            >
              {search ? "Tidak ditemukan" : "Belum ada kursus"}
            </h4>
            <p className="text-sm font-medium" style={{ color: "#9AAABF" }}>
              {search
                ? "Coba gunakan kata kunci yang berbeda."
                : "Mulai buat kursus pertama Anda."}
            </p>
          </div>
          {search ? (
            <button
              onClick={() => setSearch("")}
              className="flex items-center gap-2 h-10 px-5 rounded-xl font-black text-sm transition-all hover:brightness-95"
              style={{
                background: "#F0F2F7",
                border: "1px solid #D6DBE8",
                color: "#0F1C3F",
              }}
            >
              <X className="h-4 w-4" />
              Reset Pencarian
            </button>
          ) : (
            <Link href="/admin/courses/create">
              <button
                className="flex items-center gap-2 h-11 px-6 rounded-xl font-black text-sm transition-all hover:brightness-110 active:scale-[0.97]"
                style={{
                  background: "linear-gradient(135deg, #0F1C3F, #1A3060)",
                  color: "white",
                  boxShadow: "0 4px 16px rgba(15,28,63,0.25)",
                }}
              >
                <PlusCircle className="h-4 w-4" style={{ color: "#E8A020" }} />
                Buat Kursus Pertama
              </button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
};