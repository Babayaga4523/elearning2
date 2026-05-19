"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Search, BookOpen, CheckCircle2, Clock, ChevronRight, ChevronLeft, X, Filter,
  List, Building, Scale, Users, Terminal, Brain, AlertTriangle, CalendarClock
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { format, differenceInDays, isPast, isToday } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Pagination } from "@/components/admin/Pagination";
import { cn } from "@/lib/utils";

interface CatalogClientProps {
  courses: any[];
  categories: any[];
  categoryCounts: Record<string, number>;
  totalAllCourses: number;
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

// Helper function untuk singkat nama kategori
const getCategoryShortName = (name: string) => {
  const shortNames: Record<string, string> = {
    "Ilmu Pengetahuan Alam": "IPA",
    "Ilmu Pengetahuan Sosial": "IPS",
    "Technical Skills": "Tech Skills",
    "Corporate Culture": "Corporate",
  };
  return shortNames[name] || name;
};

// Icon mapper untuk kategori
const getCategoryIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes("finance") || n.includes("keuangan") || n.includes("bank")) return <Building className="w-5 h-5" />;
  if (n.includes("legal") || n.includes("hukum") || n.includes("compliance")) return <Scale className="w-5 h-5" />;
  if (n.includes("leader") || n.includes("pimpin")) return <Users className="w-5 h-5" />;
  if (n.includes("tech") || n.includes("it") || n.includes("data")) return <Terminal className="w-5 h-5" />;
  if (n.includes("soft skill") || n.includes("komunikasi")) return <Brain className="w-5 h-5" />;
  return <BookOpen className="w-5 h-5" />;
};

export function CatalogClient({ 
  courses, 
  categories,
  categoryCounts,
  totalAllCourses,
  currentPage,
  totalPages,
  totalItems
}: CatalogClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const activeCategory = searchParams.get("category") || "all";

  const updateUrl = (newSearch: string, newCategory: string, page: number = 1) => {
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
    <div className="bg-[#f8f9ff] text-[#0b1c30] font-sans antialiased min-h-[calc(100vh-4rem)] flex flex-col w-full">
      {/* Header Hero */}
      <header className="bg-gradient-to-r from-[#00474c] to-[#0b1c30] py-12 px-4 md:px-8 relative overflow-hidden">
        <div className="max-w-[1440px] mx-auto relative z-10">
          <h1 className="text-[#ffffff] text-4xl md:text-5xl font-bold mb-2">Katalog Kursus</h1>
          <p className="text-[#cbdbf5] text-lg mb-8 max-w-2xl">
            Tingkatkan kompetensi Anda dengan berbagai modul pelatihan yang dirancang khusus untuk profesional BNI Finance.
          </p>
          <div className="relative max-w-3xl">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#544435] w-5 h-5" />
              <input 
                className="w-full pl-12 pr-28 py-4 rounded-xl border-none shadow-lg text-base text-[#0b1c30] bg-[#ffffff] focus:ring-2 focus:ring-[#f7941d] focus:outline-none placeholder:text-[#544435]" 
                placeholder="Cari berdasarkan nama kursus, kategori, atau keahlian..." 
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button 
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#f7941d] text-[#ffffff] px-6 py-2 rounded-lg text-sm font-semibold hover:bg-opacity-90 transition-colors shadow-sm"
              >
                Cari
              </button>
            </form>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-1/3 h-full opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#f7941d] via-transparent to-transparent"></div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 md:px-8 py-8 flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Navigation (Filters) */}
        <aside className="w-full md:w-[250px] shrink-0">
          <div className="bg-[#ffffff] rounded-xl shadow-sm border border-[#d3e4fe] p-4 sticky top-24">
            <h2 className="text-xl font-semibold text-[#0b1c30] mb-4 px-2">Kategori</h2>
            <div className="flex flex-col gap-1">
              <button 
                onClick={() => handleCategorySelect("all")}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-lg transition-colors text-left ${
                  activeCategory === "all" 
                    ? "bg-[#eff4ff] text-[#f7941d] border-l-4 border-[#f7941d] rounded-l-none" 
                    : "text-[#544435] hover:bg-[#f8f9ff] hover:text-[#0b1c30]"
                }`}
              >
                <List className="w-5 h-5" />
                <span className="flex-1">Semua Kursus</span>
                <span className="bg-[#e5eeff] text-[#206e7a] py-0.5 px-2 rounded-full text-xs font-bold">{totalAllCourses}</span>
              </button>
              
              {categories.map((category) => {
                const isActive = activeCategory === category.id;
                const count = categoryCounts[category.id] || 0;
                
                return (
                  <button 
                    key={category.id}
                    onClick={() => handleCategorySelect(category.id)}
                    className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-lg transition-colors text-left ${
                      isActive 
                        ? "bg-[#eff4ff] text-[#f7941d] border-l-4 border-[#f7941d] rounded-l-none" 
                        : "text-[#544435] hover:bg-[#f8f9ff] hover:text-[#0b1c30]"
                    }`}
                  >
                    {getCategoryIcon(category.name)}
                    <span className="flex-1">{category.name}</span>
                    {count > 0 && (
                      <span className="bg-[#e5eeff] text-[#206e7a] py-0.5 px-2 rounded-full text-xs font-bold">{count}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Course Grid Area */}
        <section className="flex-1">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="text-base text-[#544435]">
              Menampilkan <span className="font-semibold text-[#0b1c30]">{totalItems} kursus</span>
            </div>
            <div className="flex items-center gap-4 w-full sm:w-auto">
              {hasActiveFilters && (
                <button 
                  onClick={clearFilters}
                  className="text-[#006970] hover:text-[#00474c] text-sm transition-colors flex items-center gap-1 font-semibold"
                >
                  <Filter className="w-4 h-4" /> Clear filters
                </button>
              )}
              <select className="bg-[#ffffff] border border-[#dac2af] rounded-lg text-sm text-[#0b1c30] py-2 pl-4 pr-8 focus:ring-1 focus:ring-[#f7941d] focus:border-[#f7941d] outline-none">
                <option>Terbaru</option>
                <option>Terpopuler</option>
                <option>A-Z</option>
              </select>
            </div>
          </div>

          {/* Grid */}
          {courses.length === 0 ? (
            <div className="bg-[#ffffff] border border-[#dac2af] rounded-xl p-12 text-center flex flex-col items-center">
              <BookOpen className="w-16 h-16 text-[#dac2af] mb-4" />
              <h3 className="text-xl font-semibold text-[#0b1c30] mb-2">Tidak ada kursus ditemukan</h3>
              <p className="text-[#544435] max-w-md mx-auto">
                Coba gunakan kata kunci pencarian lain atau pilih kategori yang berbeda.
              </p>
              {hasActiveFilters && (
                <button 
                  onClick={clearFilters}
                  className="mt-6 bg-[#eff4ff] text-[#166874] px-6 py-2 rounded-lg text-sm font-semibold hover:bg-[#d3e4fe] transition-colors"
                >
                  Hapus Semua Filter
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {courses.map((course) => {
                const enrollment = course.enrollments && course.enrollments.length > 0 
                  ? course.enrollments[0] 
                  : null;
                
                const status = enrollment?.status;
                
                // Status badge mapping
                const statusBadge = {
                  PENDING: {
                    label: "Menunggu",
                    icon: Clock,
                    className: "bg-[#ffdcbf] text-[#6b3b00] border-[#ffb874]"
                  },
                  IN_PROGRESS: {
                    label: "Sedang Berjalan",
                    icon: BookOpen,
                    className: "bg-[#e0f2fe] text-[#0369a1] border-[#bae6fd]"
                  },
                  COMPLETED: {
                    label: "Selesai",
                    icon: CheckCircle2,
                    className: "bg-[#d1fae5] text-[#065f46] border-[#a7f3d0]"
                  },
                  FAILED: {
                    label: "Gagal",
                    icon: Clock,
                    className: "bg-[#fee2e2] text-[#991b1b] border-[#fecaca]"
                  },
                  REJECTED: {
                    label: "Ditolak",
                    icon: Clock,
                    className: "bg-[#fef3c7] text-[#92400e] border-[#fde68a]"
                  }
                };

                const currentStatus = status ? statusBadge[status as keyof typeof statusBadge] : null;
                const StatusIcon = currentStatus?.icon;

                return (
                  <Link href={`/courses/${course.id}`} key={course.id}>
                    <article className="bg-[#ffffff] rounded-xl border border-[#d3e4fe] shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col cursor-pointer group h-full">
                      <div className="h-40 bg-[#e5eeff] relative overflow-hidden">
                        {course.imageUrl ? (
                          <Image 
                            src={course.imageUrl} 
                            alt={course.title} 
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#eff4ff] to-[#d3e4fe] group-hover:scale-105 transition-transform duration-500">
                            <BookOpen className="w-12 h-12 text-[#3abcc6] opacity-50" />
                          </div>
                        )}
                      </div>
                      <div className="p-4 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-2 gap-2">
                          <span className="bg-[#e5eeff] text-[#006970] text-xs font-semibold px-2 py-1 rounded-md shrink-0">
                            {getCategoryShortName(course.category?.name || "General")}
                          </span>
                          
                          {currentStatus && StatusIcon && (
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full border flex items-center gap-1 shrink-0 ${currentStatus.className}`}>
                              <StatusIcon className="w-3 h-3" /> {currentStatus.label}
                            </span>
                          )}
                        </div>
                        
                        <h3 className="text-lg font-semibold text-[#0b1c30] mb-2 leading-tight group-hover:text-[#f7941d] transition-colors line-clamp-2">
                          {course.title}
                        </h3>
                        
                        <p className="text-sm text-[#544435] line-clamp-2 mb-4 flex-1">
                          {course.description || "Pelajari materi ini untuk meningkatkan kompetensi dan keahlian Anda di lingkungan perusahaan."}
                        </p>
                        
                        {/* Deadline - Enhanced Display */}
                        {course.deadlineDate && (
                          <div className={cn(
                            "mb-3 flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg border",
                            isPast(new Date(course.deadlineDate))
                              ? "bg-red-50 text-red-700 border-red-200"
                              : differenceInDays(new Date(course.deadlineDate), new Date()) <= 3
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-[#eff4ff] text-[#006970] border-blue-200"
                          )}>
                            {isPast(new Date(course.deadlineDate)) ? (
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            ) : (
                              <CalendarClock className="w-3.5 h-3.5 shrink-0" />
                            )}
                            <span className="font-medium">
                              {isPast(new Date(course.deadlineDate))
                                ? "Deadline Terlewat"
                                : isToday(new Date(course.deadlineDate))
                                  ? "Deadline Hari Ini"
                                  : `${differenceInDays(new Date(course.deadlineDate), new Date())} hari lagi`}
                            </span>
                            <span className="text-[10px] opacity-75">
                              {format(new Date(course.deadlineDate), "dd MMM yyyy", { locale: idLocale })}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between border-t border-[#d3e4fe] pt-3 mt-auto">
                          <div className="flex items-center gap-1 text-[#544435] text-xs font-semibold">
                            <BookOpen className="w-4 h-4" /> {course._count?.modules || 0} Modul
                          </div>
                          <div className="flex items-center gap-1 text-[#544435] text-xs font-semibold">
                            <Users className="w-4 h-4" /> {course._count?.enrollments || 0} Peserta
                          </div>
                        </div>
                      </div>
                    </article>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-12 flex justify-center items-center gap-2">
              <button 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="w-10 h-10 flex items-center justify-center rounded-lg border border-[#d3e4fe] text-[#544435] hover:bg-[#f8f9ff] hover:text-[#0b1c30] transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              {Array.from({ length: totalPages }).map((_, i) => {
                const page = i + 1;
                const isCurrent = page === currentPage;
                // Simple logic to show limited pages
                if (totalPages > 5 && Math.abs(page - currentPage) > 1 && page !== 1 && page !== totalPages) {
                  if (page === 2 || page === totalPages - 1) {
                    return <span key={page} className="text-[#544435] text-sm px-2">...</span>;
                  }
                  return null;
                }
                
                return (
                  <button 
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`w-10 h-10 flex items-center justify-center rounded-lg border text-sm font-semibold transition-colors ${
                      isCurrent 
                        ? "bg-[#f7941d] text-[#ffffff] border-transparent shadow-sm" 
                        : "border-[#d3e4fe] text-[#0b1c30] hover:bg-[#f8f9ff]"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              
              <button 
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="w-10 h-10 flex items-center justify-center rounded-lg border border-[#d3e4fe] text-[#544435] hover:bg-[#f8f9ff] hover:text-[#0b1c30] transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </section>
        
      </main>
    </div>
  );
}