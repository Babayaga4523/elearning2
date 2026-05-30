"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Search,
  BookOpen,
  CheckCircle2,
  Clock,
  ChevronRight,
  ChevronLeft,
  X,
  Filter,
  List,
  Building,
  Scale,
  Users,
  Terminal,
  Brain,
  AlertTriangle,
  CalendarClock,
  ChevronDown,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { format, differenceInDays, isPast, isToday } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Pagination } from "@/components/admin/Pagination";
import { cn } from "@/lib/utils";

/* ════════════════════════════════════════════════════════════════════════
   DESIGN TOKENS — World-Class Design System
═══════════════════════════════════════════════════════════════════════ */
const t = {
  navy: "#0F1C3F",
  gold: "#E8A020",
  surface: "#F8F9FB",
  surface2: "#F1F3F7",
  border: "#E4E7EC",
  text: "#101828",
  textSecondary: "#475467",
  textTertiary: "#98A2B3",
  success: { bg: "#ECFDF3", text: "#027A48", border: "#6CE9A6" },
  warning: { bg: "#FFFAEB", text: "#B54708", border: "#FEC84B" },
  danger: { bg: "#FEF3F2", text: "#B42318", border: "#FDA29B" },
  info: { bg: "#EFF8FF", text: "#175CD3", border: "#B2DDFF" },
};

/* ─── Category Icons ────────────────────────────────────────────────── */
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  finance: Building,
  legal: Scale,
  leader: Users,
  tech: Terminal,
  brain: Brain,
};

function getCategoryIcon(name: string): React.ElementType {
  const n = name.toLowerCase();
  if (n.includes("finance") || n.includes("keuangan") || n.includes("bank"))
    return CATEGORY_ICONS.finance;
  if (n.includes("legal") || n.includes("hukum") || n.includes("compliance"))
    return CATEGORY_ICONS.legal;
  if (n.includes("leader") || n.includes("pimpin"))
    return CATEGORY_ICONS.leader;
  if (n.includes("tech") || n.includes("it") || n.includes("data"))
    return CATEGORY_ICONS.tech;
  return Brain;
}

/* ─── Status Badge Config ────────────────────────────────────────────── */
const STATUS_CONFIG: Record<string, {
  label: string;
  icon: React.ElementType;
  className: string;
}> = {
  PENDING: {
    label: "Menunggu",
    icon: Clock,
    className: "bg-[#FFFAEB] text-[#B54708] border-[#FEC84B]",
  },
  IN_PROGRESS: {
    label: "Sedang Berjalan",
    icon: BookOpen,
    className: "bg-[#EFF8FF] text-[#175CD3] border-[#B2DDFF]",
  },
  COMPLETED: {
    label: "Selesai",
    icon: CheckCircle2,
    className: "bg-[#ECFDF3] text-[#027A48] border-[#6CE9A6]",
  },
  FAILED: {
    label: "Gagal",
    icon: AlertTriangle,
    className: "bg-[#FEF3F2] text-[#B42318] border-[#FDA29B]",
  },
  REJECTED: {
    label: "Ditolak",
    icon: Clock,
    className: "bg-[#F1F3F7] text-[#475467] border-[#E4E7EC]",
  },
};

/* ─── Course Card ───────────────────────────────────────────────────── */
function CourseCard({
  course,
}: {
  course: {
    id: string;
    title: string;
    description?: string | null;
    imageUrl?: string | null;
    deadlineDate?: Date | null;
    category?: { name: string } | null;
    _count?: { modules: number; enrollments: number };
    enrollments?: Array<{ status: string; deadline?: Date | string | null }>;
  };
}) {
  const enrollment = course.enrollments?.[0] ?? null;
  const status = enrollment?.status;
  const statusConfig = status
    ? STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING
    : null;
  const StatusIcon = statusConfig?.icon;

  const rawDeadline = enrollment?.deadline || course.deadlineDate;
  const hasDeadline = !!rawDeadline;
  const deadlineDate = rawDeadline ? new Date(rawDeadline) : null;
  const isDeadlinePast = deadlineDate ? isPast(deadlineDate) : false;
  const isDeadlineSoon =
    deadlineDate && !isDeadlinePast
      ? differenceInDays(deadlineDate, new Date()) <= 3
      : false;

  return (
    <Link
      href={`/courses/${course.id}`}
      className="group block bg-white rounded-2xl border border-[#E4E7EC] overflow-hidden hover:border-[#E8A020]/60 hover:shadow-[0_8px_32px_rgba(15,28,63,0.06)] active:scale-[0.98] transition-all duration-300 h-full flex flex-col"
    >
      {/* Thumbnail */}
      <div className="relative h-44 bg-gradient-to-br from-[#E8EDF7] to-[#EFF8FF] overflow-hidden shrink-0">
        {course.imageUrl ? (
          <Image
            src={course.imageUrl}
            alt={course.title}
            fill
            className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-[#E4E7EC]/40 flex items-center justify-center">
              <BookOpen size={26} className="text-[#98A2B3]" />
            </div>
          </div>
        )}

        {/* Status badge overlay */}
        {statusConfig && (
          <div className="absolute top-3 right-3 z-10">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border font-['DM_Sans'] uppercase tracking-wider shadow-sm",
                statusConfig.className
              )}
            >
              {StatusIcon && <StatusIcon size={10} />}
              {statusConfig.label}
            </span>
          </div>
        )}

        {/* Gradient overlay bottom */}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/10 to-transparent" />
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        {/* Category tag */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[#EFF8FF] border border-[#B2DDFF]/50 text-[10px] font-bold text-[#175CD3] font-['DM_Sans'] mb-3 w-fit uppercase tracking-wider">
          {(() => {
            const Icon = getCategoryIcon(course.category?.name || "");
            return <Icon size={11} />;
          })()}
          {course.category?.name || "General"}
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-[#101828] font-['Lexend_Deca'] leading-snug line-clamp-2 mb-2 group-hover:text-[#C4861A] transition-colors duration-200">
          {course.title}
        </h3>

        {/* Description */}
        <p className="text-sm font-medium text-[#475467] font-['DM_Sans'] line-clamp-2 mb-4 flex-1 leading-relaxed">
          {course.description ||
            "Pelajari materi ini untuk meningkatkan kompetensi dan keahlian Anda di lingkungan perusahaan BNI Finance."}
        </p>

        {/* Deadline */}
        {hasDeadline && deadlineDate && (
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold font-['DM_Sans'] mb-4",
              isDeadlinePast
                ? "bg-[#FEF3F2] text-[#B42318] border-[#FDA29B]/50"
                : isDeadlineSoon
                ? "bg-[#FFFAEB] text-[#B54708] border-[#FEC84B]/50"
                : "bg-[#EFF8FF] text-[#175CD3] border-[#B2DDFF]/50"
            )}
          >
            {isDeadlinePast ? (
              <AlertTriangle size={13} className="shrink-0" />
            ) : (
              <CalendarClock size={13} className="shrink-0" />
            )}
            <span className="flex-1">
              {isDeadlinePast
                ? "Deadline terlewat"
                : isToday(deadlineDate)
                ? "Deadline hari ini"
                : `${differenceInDays(deadlineDate, new Date())} hari lagi`}
            </span>
            <span className="text-[10px] opacity-70 tracking-tight font-semibold">
              {format(deadlineDate, "dd MMM yyyy", { locale: idLocale })}
            </span>
          </div>
        )}

        {/* Footer stats */}
        <div className="flex items-center justify-between pt-3.5 border-t border-[#E4E7EC] mt-auto">
          <div className="flex items-center gap-1.5 text-[#64748B] text-xs font-bold font-['DM_Sans']">
            <BookOpen size={13} className="text-[#94A3B8]" />
            {course._count?.modules ?? 0} Modul
          </div>
          <div className="flex items-center gap-1.5 text-[#64748B] text-xs font-bold font-['DM_Sans']">
            <Users size={13} className="text-[#94A3B8]" />
            {course._count?.enrollments ?? 0} Peserta
          </div>
          <ArrowUpRight
            size={15}
            className="text-[#98A2B3] group-hover:text-[#E8A020] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200"
          />
        </div>
      </div>
    </Link>
  );
}

/* ─── Sidebar Category Button ───────────────────────────────────────── */
function CategoryButton({
  category,
  count,
  isActive,
  onClick,
}: {
  category?: { id: string; name: string };
  count: number;
  isActive: boolean;
  onClick: () => void;
}) {
  const Icon = category ? getCategoryIcon(category.name) : List;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all duration-300 text-left font-['DM_Sans'] active:scale-[0.98] border-l-4 outline-none",
        isActive
          ? "bg-[#E8EDF7]/50 text-[#0F1C3F] border-l-[#E8A020] shadow-sm pl-3"
          : "text-[#475467] hover:bg-[#F8F9FB] hover:text-[#0F1C3F] border-l-transparent pl-4"
      )}
    >
      <div
        className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-300 border border-[#E4E7EC]/20 shadow-sm",
          isActive ? "bg-[#0F1C3F] text-white" : "bg-[#F8F9FB] text-[#64748B]"
        )}
      >
        <Icon size={14} />
      </div>
      <span className="flex-1 truncate">{category?.name || "Semua Kursus"}</span>
      <span
        className={cn(
          "px-2 py-0.5 rounded-full text-[10px] font-extrabold transition-colors duration-300 border",
          isActive 
            ? "bg-[#0F1C3F] text-white border-transparent" 
            : "bg-[#E4E7EC]/50 text-[#64748B] border-[#E4E7EC]/20"
        )}
      >
        {count}
      </span>
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   CATALOG CLIENT
═══════════════════════════════════════════════════════════════════════ */
interface CatalogClientProps {
  courses: any[];
  categories: any[];
  categoryCounts: Record<string, number>;
  totalAllCourses: number;
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

export function CatalogClient({
  courses,
  categories,
  categoryCounts,
  totalAllCourses,
  currentPage,
  totalPages,
  totalItems,
}: CatalogClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const activeCategory = searchParams.get("category") || "all";

  const updateUrl = (
    newSearch: string,
    newCategory: string,
    page: number = 1
  ) => {
    const params = new URLSearchParams(searchParams);
    if (newSearch.trim()) params.set("search", newSearch);
    else params.delete("search");
    if (newCategory !== "all") params.set("category", newCategory);
    else params.delete("category");
    if (page > 1) params.set("page", page.toString());
    else params.delete("page");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    updateUrl(search, activeCategory, 1);
  };

  const handleCategorySelect = (categoryId: string) => {
    updateUrl(search, categoryId, 1);
  };

  const clearFilters = () => {
    setSearch("");
    updateUrl("", "all", 1);
  };

  const handlePageChange = (page: number) => {
    updateUrl(search, activeCategory, page);
  };

  const hasActiveFilters = search.trim() !== "" || activeCategory !== "all";

  return (
    <div
      className="min-h-screen bg-[#F8F9FB]"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* ═══ Hero Header ════════════════════════════════════════════════ */}
      <header
        className="relative overflow-hidden border-b border-[#1A2D5A]"
        style={{
          background: `linear-gradient(135deg, ${t.navy} 0%, #12224A 50%, #1A3060 100%)`,
        }}
      >
        {/* Glowing orbs */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute right-[-10%] top-[-20%] w-[400px] h-[400px] rounded-full bg-[#E8A020] blur-[140px] mix-blend-screen" />
          <div className="absolute left-[-10%] bottom-[-20%] w-[250px] h-[250px] rounded-full bg-[#2E90FA] blur-[100px] mix-blend-screen" />
        </div>
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 py-10 md:py-12">
          {/* Breadcrumb badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[9px] font-extrabold uppercase tracking-widest text-white/80 mb-4">
            <Sparkles size={10} className="animate-spin-slow" />
            E-Learning BNI Finance
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-white font-['Lexend_Deca'] leading-tight tracking-tight mb-3">
            Katalog Kursus
          </h1>
          <p className="text-sm font-medium text-white/60 font-['DM_Sans'] max-w-xl leading-relaxed mb-8">
            Tingkatkan kompetensi profesional Anda dengan modul pelatihan unggulan BNI Finance yang dirancang khusus untuk mempercepat pertumbuhan karir Anda.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="relative max-w-2xl w-full group/form">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
              <Search size={18} className="text-[#98A2B3] group-focus-within/form:text-[#E8A020] transition-colors duration-200" />
            </div>
            <input
              className={cn(
                "w-full pl-11 pr-36 py-3.5 rounded-xl text-sm border bg-white shadow-[0_8px_30px_rgb(15,28,63,0.04)] transition-all duration-300 font-bold",
                "font-['DM_Sans'] text-[#101828]",
                "border-[#E4E7EC] focus:border-[#E8A020] focus:ring-4 focus:ring-[#E8A020]/10 focus:outline-none",
                "placeholder:text-[#98A2B3]/80"
              )}
              placeholder="Cari kursus, kategori, atau keahlian..."
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2 bg-[#E8A020] hover:bg-[#C68215] active:scale-[0.96] text-white text-xs font-bold uppercase tracking-wider rounded-lg font-['DM_Sans'] transition-all duration-200 shadow-md shadow-[#E8A020]/10 border border-transparent outline-none flex items-center gap-1.5"
            >
              <span>Cari</span>
              <ArrowUpRight size={14} className="text-white/80" />
            </button>
          </form>
        </div>
      </header>

      {/* ═══ Main Content ══════════════════════════════════════════════ */}
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 py-8 flex gap-8">

        {/* ═══ Sidebar ══════════════════════════════════════════════════ */}
        <aside className="w-full md:w-56 lg:w-64 shrink-0">
          <div className="bg-white rounded-2xl border border-[#E4E7EC] overflow-hidden sticky top-24">
            {/* Sidebar header */}
            <div className="px-4 py-3.5 border-b border-[#E4E7EC] bg-[#F8F9FB]">
              <h2 className="text-xs font-semibold text-[#98A2B3] uppercase tracking-widest font-['DM_Sans']">
                Kategori
              </h2>
            </div>

            {/* Category list */}
            <div className="p-3 space-y-1">
              <CategoryButton
                category={undefined}
                count={totalAllCourses}
                isActive={activeCategory === "all"}
                onClick={() => handleCategorySelect("all")}
              />
              {categories.map((cat: any) => (
                <CategoryButton
                  key={cat.id}
                  category={cat}
                  count={categoryCounts[cat.id] || 0}
                  isActive={activeCategory === cat.id}
                  onClick={() => handleCategorySelect(cat.id)}
                />
              ))}
            </div>
          </div>
        </aside>

        {/* ═══ Course Grid ═══════════════════════════════════════════════ */}
        <section className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-5 gap-4 flex-wrap">
            <div className="text-sm font-['DM_Sans'] text-[#475467]">
              <span className="font-semibold text-[#101828]">{totalItems}</span> kursus
              {activeCategory !== "all" && (
                <span className="text-[#98A2B3]"> · difilter</span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold font-['DM_Sans'] text-[#B42318] hover:bg-[#FEF3F2] rounded-lg transition-colors"
                >
                  <X size={12} />
                  Clear
                </button>
              )}
              <select
                className={cn(
                  "bg-white border border-[#E4E7EC] rounded-lg text-xs font-['DM_Sans']",
                  "py-2 pl-4 pr-8 text-[#344054] cursor-pointer",
                  "focus:ring-2 focus:ring-[#E8A020]/20 focus:border-[#E8A020] outline-none"
                )}
              >
                <option>Terbaru</option>
                <option>Terpopuler</option>
                <option>A-Z</option>
              </select>
            </div>
          </div>

          {/* Course grid */}
          {courses.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E4E7EC] p-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#EFF8FF] flex items-center justify-center mx-auto mb-4">
                <BookOpen size={28} className="text-[#98A2B3]" />
              </div>
              <h3 className="text-lg font-semibold text-[#101828] font-['Lexend_Deca'] mb-2">
                Tidak ada kursus ditemukan
              </h3>
              <p className="text-sm text-[#475467] font-['DM_Sans'] max-w-sm mx-auto leading-relaxed">
                Coba gunakan kata kunci lain atau pilih kategori berbeda.
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-[#EFF8FF] text-[#175CD3] hover:bg-[#B2DDFF] text-sm font-semibold rounded-xl font-['DM_Sans'] transition-colors"
                >
                  <X size={14} />
                  Hapus Filter
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-10 flex justify-center items-center gap-2">
              <button
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
                className={cn(
                  "w-9 h-9 rounded-lg border border-[#E4E7EC] flex items-center justify-center transition-all",
                  "text-[#475467] hover:bg-[#F8F9FB] hover:text-[#101828]",
                  "disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                )}
              >
                <ChevronLeft size={15} />
              </button>

              {Array.from({ length: totalPages }).map((_, i) => {
                const page = i + 1;
                const isCurrent = page === currentPage;
                if (
                  totalPages > 5 &&
                  Math.abs(page - currentPage) > 1 &&
                  page !== 1 &&
                  page !== totalPages
                ) {
                  if (page === 2 || page === totalPages - 1)
                    return (
                      <span
                        key={page}
                        className="text-[#98A2B3] text-xs px-1"
                      >
                        ···
                      </span>
                    );
                  return null;
                }
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={cn(
                      "w-9 h-9 rounded-lg text-xs font-semibold font-['DM_Sans'] transition-all",
                      isCurrent
                        ? "bg-[#0F1C3F] text-white border border-[#0F1C3F] shadow-sm"
                        : "border border-[#E4E7EC] text-[#475467] hover:bg-[#F8F9FB]"
                    )}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage >= totalPages}
                className={cn(
                  "w-9 h-9 rounded-lg border border-[#E4E7EC] flex items-center justify-center transition-all",
                  "text-[#475467] hover:bg-[#F8F9FB] hover:text-[#101828]",
                  "disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                )}
              >
                <ChevronRight size={15} />
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}