import { BookOpen, CheckCircle2, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPIGridProps {
  activeCourses: number;
  modulesDone: number;
  testsPassed: number;
}

export const KPIGrid = ({ activeCourses, modulesDone, testsPassed }: KPIGridProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <KPICard 
        label="Kursus Aktif" 
        value={activeCourses} 
        icon={BookOpen} 
        color="blue" 
      />
      <KPICard 
        label="Modul Selesai" 
        value={modulesDone} 
        icon={CheckCircle2} 
        color="emerald" 
      />
      <KPICard 
        label="Ujian Lulus" 
        value={testsPassed} 
        icon={Trophy} 
        color="violet" 
      />
    </div>
  );
};

function KPICard({ label, value, icon: Icon, color }: { label: string, value: number, icon: any, color: "blue" | "emerald" | "violet" }) {
  const themes = {
    blue: "bg-blue-500/10 text-blue-600 border-blue-200/50",
    emerald: "bg-emerald-500/10 text-emerald-600 border-emerald-200/50",
    violet: "bg-violet-500/10 text-violet-600 border-violet-200/50",
  };

  return (
    <div className={cn(
      "relative group overflow-hidden bg-white sm:bg-white/80 sm:backdrop-blur-md p-6 rounded-2xl border border-white/50 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
      "max-sm:bg-white max-sm:backdrop-filter-none" // Fallback for mobile performance
    )}>
      {/* Subtle Glow Effect on Hover */}
      <div className={cn(
        "absolute -right-4 -bottom-4 w-20 h-20 rounded-full blur-3xl opacity-0 group-hover:opacity-30 transition-opacity duration-500",
        color === "blue" && "bg-blue-400",
        color === "emerald" && "bg-emerald-400",
        color === "violet" && "bg-violet-400"
      )} />

      <div className="flex items-center gap-4 relative z-10">
        <div className={cn(
          "h-14 w-14 rounded-xl flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-500",
          themes[color]
        )}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex flex-col">
           <span className="text-2xl font-black text-slate-800 tracking-tight leading-none">{value}</span>
           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1.5">{label}</span>
        </div>
      </div>
    </div>
  );
}
