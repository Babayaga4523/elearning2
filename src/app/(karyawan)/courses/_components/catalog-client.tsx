"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, Compass, Target, BookOpen, CheckCircle2, PlayCircle, Filter, Clock } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CatalogClientProps {
  courses: any[];
  categories: any[];
}

export function CatalogClient({ courses, categories }: CatalogClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Initialize state directly from URL to support shared links out of the box
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [activeCategory, setActiveCategory] = useState(searchParams.get("category") || "all");

  // Sync state to URL seamlessly without triggering full page reloads ("window.history.replaceState")
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
    updateUrl(search, categoryId);
  };

  // Perform robust in-memory instant filtering
  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchSearch = course.title.toLowerCase().includes(search.toLowerCase());
      const matchCategory = activeCategory === "all" || course.categoryId === activeCategory;
      return matchSearch && matchCategory;
    });
  }, [courses, search, activeCategory]);

  return (
    <div className="w-full space-y-8 animate-fade-in-up md:p-10 p-6">
      
      {/* 1. Hero / Search Banner */}
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950 rounded-3xl p-8 shadow-xl relative overflow-hidden flex flex-col items-center text-center">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <Compass className="w-96 h-96 -translate-y-20 translate-x-20" />
        </div>
        
        <div className="relative z-10 space-y-4 max-w-3xl w-full mx-auto">
          <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-indigo-200 tracking-tight">
            Explore Course Catalog
          </h1>
          <p className="text-indigo-200 font-medium text-base max-w-xl mx-auto">
            Discover new skills and elevate your career. Access world-class premium curriculum developed for BNI Finance.
          </p>

          <div className="relative w-full max-w-2xl mx-auto mt-6 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search for subjects, topics, or course names..."
              value={search}
              onChange={handleSearchChange}
              className="w-full h-14 pl-14 pr-6 rounded-xl bg-white text-slate-800 text-base font-medium shadow-xl focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>

      {/* 2. Content Section */}
      <div className="flex flex-col md:flex-row gap-8 pt-4">
         
         {/* Categories Sidebar */}
         <div className="w-full md:w-72 shrink-0 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
              <Filter className="h-5 w-5 text-slate-500" />
              <h3 className="font-black text-slate-800 text-xl">Categories</h3>
            </div>
            
            <div className="flex flex-row md:flex-col gap-2 overflow-x-auto pb-4 md:pb-0 scrollbar-hide">
              <button
                onClick={() => handleCategorySelect("all")}
                className={cn(
                  "px-4 py-3 rounded-xl text-left font-bold transition-all whitespace-nowrap",
                  activeCategory === "all" 
                    ? "bg-primary text-white shadow-md shadow-primary/20" 
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 hover:border-slate-300"
                )}
              >
                All Courses ({courses.length})
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleCategorySelect(c.id)}
                  className={cn(
                    "px-4 py-3 rounded-xl text-left font-bold transition-all flex items-center justify-between group whitespace-nowrap",
                    activeCategory === c.id 
                      ? "bg-primary text-white shadow-md shadow-primary/20" 
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 hover:border-slate-300"
                  )}
                >
                  <span className="truncate pr-4">{c.name}</span>
                  <Badge variant="secondary" className={cn(
                    "px-2 py-0 h-5 text-[10px]",
                    activeCategory === c.id ? "bg-white/20 text-white" : "bg-slate-200 text-slate-500 group-hover:bg-slate-300"
                  )}>
                    {courses.filter(course => course.categoryId === c.id).length}
                  </Badge>
                </button>
              ))}
            </div>
         </div>

         {/* Course Grid Area */}
         <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between">
               <h2 className="text-2xl font-black text-slate-800 tracking-tight">Available Courses</h2>
               <span className="font-bold text-sm text-slate-500 bg-white px-4 py-1.5 rounded-full border shadow-sm">
                 Showing {filteredCourses.length} results
               </span>
            </div>

            {filteredCourses.length === 0 ? (
               <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center flex flex-col items-center justify-center space-y-4">
                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <Search className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">No courses found</h3>
                  <p className="text-slate-500">We couldn't match any courses to your current filters.</p>
                  <Button variant="outline" onClick={() => { setSearch(""); setActiveCategory("all"); updateUrl("", "all"); }} className="font-bold border-2">
                    Clear all filters
                  </Button>
               </div>
            ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                 {filteredCourses.map((course) => {
                   const isEnrolled = course.enrollments.length > 0;

                   return (
                     <Link key={course.id} href={`/courses/${course.id}`} className="group">
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm group-hover:shadow-2xl group-hover:-translate-y-2 transition-all duration-300 overflow-hidden h-full flex flex-col relative">
                           {/* Status Badge Overlays */}
                           <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 items-end">
                             {isEnrolled && (
                               <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-black border-none shadow-md shadow-emerald-500/20 px-3 uppercase tracking-widest text-[9px] flex items-center">
                                 <CheckCircle2 className="h-3 w-3 mr-1" /> Enrolled
                               </Badge>
                             )}
                             {course.deadlineDate && (
                               <Badge className="bg-rose-500 text-white font-black border-none shadow-md shadow-rose-500/20 px-3 uppercase tracking-widest text-[9px] flex items-center">
                                 <Clock className="h-3 w-3 mr-1" /> Deadline: {new Date(course.deadlineDate).toLocaleDateString()}
                               </Badge>
                             )}
                           </div>

                           <div className="h-44 relative bg-slate-100 overflow-hidden">
                             {course.imageUrl ? (
                               <img src={course.imageUrl} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                             ) : (
                               <div className="flex items-center justify-center h-full bg-slate-200 text-slate-400">
                                 <PlayCircle className="h-12 w-12 opacity-50" />
                               </div>
                             )}
                             <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/0" />
                             <div className="absolute bottom-3 left-4">
                                <Badge className="bg-white/90 backdrop-blur-md text-slate-800 font-bold border-none shadow-sm capitalize px-2">
                                  {course.category?.name || "LMS"}
                                </Badge>
                             </div>
                           </div>
                           
                           <div className="p-6 flex-1 flex flex-col">
                             <h3 className="text-lg font-black text-slate-800 line-clamp-2 leading-snug group-hover:text-primary transition-colors mb-4">
                               {course.title}
                             </h3>
                             
                             <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border">
                                  <BookOpen className="h-4 w-4 text-primary" /> {course._count.modules} Modul
                                </div>
                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                  <Target className="h-4 w-4" /> {course._count.enrollments} Peserta
                                </div>
                             </div>
                           </div>
                        </div>
                     </Link>
                   )
                 })}
               </div>
            )}
         </div>
      </div>
    </div>
  );
}
