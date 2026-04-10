"use client";

import Link from "next/link";
import { BookOpen, Clock, Trophy, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CourseCardProps {
  course: any;
}

export const CourseCard = ({ course }: CourseCardProps) => {
  const isDeadlineSoon = course.deadline && 
    (new Date(course.deadline).getTime() - new Date().getTime()) < (1000 * 60 * 60 * 24 * 3);

  return (
    <Link href={`/courses/${course.id}`} className="group relative">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm group-hover:shadow-xl group-hover:-translate-y-1 transition-all duration-500 overflow-hidden h-full flex flex-col">
        {/* Image / Header Block */}
        <div className="h-40 relative overflow-hidden bg-slate-100">
          {course.imageUrl ? (
            <img 
              src={course.imageUrl} 
              alt={course.title} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400">
              <BookOpen className="h-10 w-10 opacity-30" />
            </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/0 opacity-60 group-hover:opacity-40 transition-opacity" />
          
          <div className="absolute top-3 left-3 flex gap-2">
             <Badge className="bg-white/95 backdrop-blur-sm text-slate-900 font-bold border-none shadow-sm text-[8px] uppercase tracking-wider px-2 py-0.5">
               {course.category?.name || "LMS"}
             </Badge>
          </div>

          <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
             <div className="flex flex-col gap-1">
                {course.progress === 100 ? (
                  <Badge className="bg-emerald-500 text-white border-none font-bold text-[8px] py-0.5 shadow-sm">
                    COMPLETE
                  </Badge>
                ) : (
                  <Badge className="bg-blue-600 text-white border-none font-bold text-[8px] py-0.5 shadow-sm">
                    PROGRESS
                  </Badge>
                )}
             </div>
             {course.progress === 100 && (
               <div className="bg-amber-400 p-1.5 rounded-lg shadow-sm">
                  <Trophy className="h-4 w-4 text-amber-900" />
               </div>
             )}
          </div>
        </div>
        
        {/* Content Block */}
        <div className="p-6 flex-1 flex flex-col">
          <h3 className="text-lg font-black text-slate-800 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors mb-2 tracking-tight">
            {course.title}
          </h3>
          
          {course.deadline && (
            <div className={cn(
              "flex items-center gap-1.5 mb-4 p-1.5 rounded-xl w-fit",
              isDeadlineSoon ? "bg-rose-50 text-rose-600" : "bg-slate-50 text-slate-500"
            )}>
              <Clock className={cn("h-3 w-3", isDeadlineSoon && "animate-pulse")} />
              <span className="text-[9px] font-black uppercase tracking-widest">
                D-Line: {new Date(course.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
              </span>
            </div>
          )}
          
          <div className="mt-auto space-y-4">
             <div className="space-y-2">
               <div className="flex justify-between items-end">
                 <div className="flex flex-col">
                   <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Progres</span>
                   <span className="text-2xl font-black text-slate-900 tracking-tighter leading-none">
                     {course.progress}<span className="text-xs font-bold text-slate-400 ml-0.5">%</span>
                   </span>
                 </div>
                 <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">
                   {course.completedModules}/{course.totalModules} Modul
                 </span>
               </div>
               
               <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden p-0.5">
                 <div 
                   className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full relative transition-[width] duration-1000 ease-out" 
                   style={{ width: `${course.progress}%` }}
                 >
                    <div className="absolute inset-0 bg-white/10 animate-pulse" />
                 </div>
               </div>
             </div>

             <Button variant="ghost" className="w-full justify-between h-9 px-0 hover:bg-transparent group-hover:text-blue-600 font-bold text-slate-400 transition-all">
               <span className="text-[10px] uppercase tracking-widest">
                 {course.progress === 100 ? "Review" : "Lanjutkan"}
               </span>
               <div className="h-7 w-7 bg-slate-50 group-hover:bg-blue-600 group-hover:text-white rounded-lg flex items-center justify-center transition-all duration-300">
                  <ChevronRight className="h-4 w-4" />
               </div>
             </Button>
          </div>
        </div>
      </div>
    </Link>
  );
};
