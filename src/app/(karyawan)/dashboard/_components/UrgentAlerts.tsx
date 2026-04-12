"use client";

import { AlertTriangle, Clock, ArrowRight, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface UrgentAlertsProps {
  urgentEnrollments: any[];
}

export const UrgentAlerts = ({ urgentEnrollments }: UrgentAlertsProps) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible || urgentEnrollments.length === 0) return null;

  const mostUrgent = urgentEnrollments[0];
  const isPastDue = new Date(mostUrgent.deadline) < new Date();
  
  // Calculate days left
  const diffTime = new Date(mostUrgent.deadline).getTime() - new Date().getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return (
    <div className="relative group animate-in slide-in-from-top duration-700">
      <div className={cn(
        "relative overflow-hidden rounded-[2rem] p-5 md:p-6 shadow-2xl transition-all",
        isPastDue 
          ? "bg-gradient-to-r from-rose-600 to-rose-500 shadow-rose-200/50" 
          : "bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-200/50"
      )}>
        {/* Background Patterns */}
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-700">
          <Clock className="w-32 h-32" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="bg-white/20 backdrop-blur-md p-4 rounded-2xl shadow-inner">
               <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-white/20 text-white border-none font-black text-[9px] uppercase tracking-[0.15em] py-0.5 px-2">
                   {isPastDue ? "Batas Waktu Terlewati" : "Tenggat Mendekat"}
                </Badge>
                {urgentEnrollments.length > 1 && (
                  <span className="text-white/70 text-[10px] font-bold uppercase tracking-wider">
                    (+{urgentEnrollments.length - 1} kursus lainnya)
                  </span>
                )}
              </div>
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight leading-none pt-1">
                {isPastDue 
                  ? `Selesaikan Segera: ${mostUrgent.course.title}`
                  : `${mostUrgent.course.title} akan berakhir!`
                }
              </h2>
              <p className="text-sm font-medium text-white/90">
                {isPastDue 
                  ? "Status Anda telah terhitung tertunggak. Klik untuk segera menuntaskan."
                  : `Hanya tersisa ${diffDays} hari lagi untuk menyelesaikan materi ini.`
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
             <Link href={`/courses/${mostUrgent.courseId}`}>
                <button className="h-14 px-8 rounded-2xl bg-white text-slate-900 font-black text-xs uppercase tracking-widest shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-3">
                  Tuntaskan Sekarang <ArrowRight className="h-4 w-4" />
                </button>
             </Link>
             <button 
              onClick={() => setIsVisible(false)}
              className="h-14 w-14 rounded-2xl bg-black/10 hover:bg-black/20 text-white flex items-center justify-center transition-all"
             >
                <X className="h-5 w-5" />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};
