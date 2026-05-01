"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Search, BookOpen, CheckCircle2, Clock, ChevronRight, X, Filter
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Pagination } from "@/components/admin/Pagination";

interface CatalogClientProps {
  courses: any[];
  categories: any[];
}

export function CatalogClient({ courses, categories }: CatalogClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [activeCategory, setActiveCategory] = useState(searchParams.get("category") || "all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  const updateUrl = (newSearch: string, newCategory: string) => {
    const params = new URLSearchParams(searchParams);
    if (newSearch.trim()) params.set("search", newSearch);
    else params.delete("search");
    if (newCategory !== "all") params.set("category", newCategory);
    else params.delete("category");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    updateUrl(val, activeCategory);
  };

  const handleCategorySelect = (categoryId: string) => {
    setActiveCategory(categoryId);
    setCurrentPage(1);
    updateUrl(search, categoryId);
  };

  const clearFilters = () => {
    setSearch("");
    setActiveCategory("all");
    setCurrentPage(1);
    updateUrl("", "all");
  };

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchSearch = course.title.toLowerCase().includes(search.toLowerCase());
      const matchCategory = activeCategory === "all" || course.categoryId === activeCategory;
      return matchSearch && matchCategory;
    });
  }, [courses, search, activeCategory]);

  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);
  const paginatedCourses = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredCourses.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCourses, currentPage, itemsPerPage]);

  const hasActiveFilters = search.trim() !== "" || activeCategory !== "all";

  const CategoryList = () => (
    <div className="space-y-1">
      <button
        onClick={() => handleCategorySelect("all")}
        className={cn(
          "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
          activeCategory === "all"
            ? "bg-blue-600 text-white"
            : "text-slate-700 hover:bg-slate-100"
        )}
      >
        <span>Semua Kursus</span>
        <span className={cn(
          "text-xs px-2 py-0.5 rounded-md font-medium",
          activeCategory === "all" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
        )}>
          {courses.length}
        </span>
      </button>
      <Separator className="my-2" />
      {categories.map((c) => {
        const count = courses.filter((course) => course.categoryId === c.id).length;
        return (
          <button
            key={c.id}
            onClick={() => handleCategorySelect(c.id)}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
              activeCategory === c.id
                ? "bg-blue-600 text-white"
                : "text-slate-700 hover:bg-slate-100"
            )}
          >
            <span className="truncate pr-3">{c.name}</span>
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-md font-medium shrink-0",
              activeCategory === c.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
            )}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-2xl space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                Katalog Kursus
              </h1>
              <p className="text-base text-slate-300">
                Temukan kursus yang sesuai dengan kebutuhan pengembangan karir Anda
              </p>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                type="text"
                placeholder="Cari kursus..."
                value={search}
                onChange={handleSearchChange}
                className="pl-12 pr-12 h-12 bg-white text-slate-900 border-0"
              />
              {search && (
                <button
                  onClick={() => { setSearch(""); updateUrl("", activeCategory); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">

          {/* Sidebar (desktop) */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-6 bg-white rounded-lg border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                Kategori
              </h3>
              <CategoryList />
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0 space-y-6">

            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-600">
                  {filteredCourses.length} kursus
                </span>
                {hasActiveFilters && (
                  <>
                    <Separator orientation="vertical" className="h-4" />
                    <button
                      onClick={clearFilters}
                      className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                    >
                      Hapus filter
                    </button>
                  </>
                )}
              </div>

              {/* Mobile filter */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72">
                  <SheetHeader>
                    <SheetTitle>Filter Kursus</SheetTitle>
                    <SheetDescription>
                      Pilih kategori untuk memfilter kursus
                    </SheetDescription>
                  </SheetHeader>
                  <ScrollArea className="h-[calc(100vh-120px)] mt-6">
                    <CategoryList />
                  </ScrollArea>
                </SheetContent>
              </Sheet>
            </div>

            {/* Active filters */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2">
                {search && (
                  <Badge variant="secondary" className="gap-1.5">
                    <Search className="h-3 w-3" />
                    &quot;{search}&quot;
                    <button onClick={() => { setSearch(""); updateUrl("", activeCategory); }} className="ml-1">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {activeCategory !== "all" && (
                  <Badge variant="secondary" className="gap-1.5">
                    {categories.find((c) => c.id === activeCategory)?.name}
                    <button onClick={() => handleCategorySelect("all")} className="ml-1">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
              </div>
            )}

            {/* Empty state */}
            {filteredCourses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center mb-4">
                  <Search className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Tidak ada kursus ditemukan
                </h3>
                <p className="text-sm text-slate-600 mb-4 max-w-sm">
                  Coba ubah kata kunci atau filter untuk menemukan kursus yang Anda cari
                </p>
                <Button variant="outline" onClick={clearFilters}>
                  Hapus semua filter
                </Button>
              </div>
            ) : (
              <>
                {/* Course Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {paginatedCourses.map((course) => {
                  const enrollment = course.enrollments?.[0];
                  const isEnrolled = enrollment && ["IN_PROGRESS", "COMPLETED"].includes(enrollment.status);
                  const isPending = enrollment?.status === "PENDING";
                  const isRejected = enrollment?.status === "REJECTED";
                  
                  return (
                    <Link key={course.id} href={`/courses/${course.id}`} className="group">
                      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden h-full flex flex-col hover:shadow-md hover:border-blue-300 transition-all duration-200">
                        {/* Thumbnail */}
                        <div className="h-48 relative bg-slate-100">
                          {course.imageUrl ? (
                            <Image
                              src={course.imageUrl}
                              alt={course.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="h-full flex items-center justify-center">
                              <BookOpen className="h-12 w-12 text-slate-300" />
                            </div>
                          )}
                          
                          {/* Status badges */}
                          <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
                            <Badge className="text-xs bg-white text-slate-900 border-0">
                              {course.category?.name || "Course"}
                            </Badge>
                            
                            {isEnrolled && (
                              <Badge className="text-xs bg-green-600 text-white border-0">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Terdaftar
                              </Badge>
                            )}
                            {isPending && (
                              <Badge className="text-xs bg-yellow-600 text-white border-0">
                                <Clock className="h-3 w-3 mr-1" />
                                Menunggu
                              </Badge>
                            )}
                            {isRejected && (
                              <Badge className="text-xs bg-red-600 text-white border-0">
                                Ditolak
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-5 flex flex-col flex-1">
                          <h3 className="font-semibold text-slate-900 line-clamp-2 leading-snug mb-3 group-hover:text-blue-600 transition-colors">
                            {course.title}
                          </h3>

                          <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-600">
                            <span>{course._count?.modules ?? 0} modul</span>
                            <span>{course._count?.enrollments ?? 0} peserta</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
                </div>

                {/* Pagination */}
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={filteredCourses.length}
                  itemsPerPage={itemsPerPage}
                  itemLabel="kursus"
                />
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}