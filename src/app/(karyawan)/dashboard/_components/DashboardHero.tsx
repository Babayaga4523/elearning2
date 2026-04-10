import { Badge } from "@/components/ui/badge";
import { Sparkles, Target } from "lucide-react";

interface DashboardHeroProps {
  userName: string;
}

export const DashboardHero = ({ userName }: DashboardHeroProps) => {
  return (
    <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 md:p-10 flex flex-col md:flex-row md:items-end justify-between gap-8 shadow-xl relative overflow-hidden group">
      {/* Background Decorative Gradient */}
      <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.1),transparent_50%)] pointer-events-none" />
      
      {/* Target Icon background */}
      <div className="absolute -top-10 -right-10 p-8 opacity-[0.03] pointer-events-none group-hover:scale-105 transition-transform duration-700">
        <Target className="w-64 h-64" />
      </div>

      <div className="relative z-10 flex flex-col gap-y-3 max-w-2xl text-white">
        <Badge className="w-fit bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border-white/10 font-bold tracking-widest text-[9px] uppercase py-0.5 px-3 mb-1">
          <Sparkles className="h-3 w-3 mr-2 text-amber-400" /> 
          Next-Gen Learning
        </Badge>
        
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight drop-shadow-sm">
            Selamat Datang, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-200">
              {userName}!
            </span>
          </h1>
        </div>
        
        <p className="text-slate-300 font-medium text-base leading-relaxed mt-2 max-w-md border-l-2 border-indigo-500/50 pl-4">
          Lanjutkan perjalanan belajar Anda dan tingkatkan kompetensi Anda di BNI Finance.
        </p>
      </div>

      {/* Hero Stats / Hint */}
      <div className="relative z-10 flex flex-col items-end gap-2 text-right hidden lg:flex">
         <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-3 rounded-2xl">
            <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest mb-0.5">Status</p>
            <p className="text-sm font-bold text-white">On Track 🚀</p>
         </div>
      </div>
    </div>
  );
};
