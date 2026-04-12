import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Target, ArrowRight } from "lucide-react";
import Link from "next/link";

interface DashboardHeroProps {
  userName: string;
  resumeData: {
    title: string;
    href: string;
  } | null;
}

export const DashboardHero = ({ userName, resumeData }: DashboardHeroProps) => {
  return (
    <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-[3rem] p-8 md:p-14 flex flex-col md:flex-row md:items-center justify-between gap-10 shadow-2xl relative overflow-hidden group">
      {/* Background Decorative Gradient */}
      <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.15),transparent_60%)] pointer-events-none" />
      
      {/* Target Icon background */}
      <div className="absolute -top-10 -right-10 p-8 opacity-[0.05] pointer-events-none group-hover:scale-105 transition-transform duration-1000">
        <Target className="w-80 h-80" />
      </div>

      <div className="relative z-10 flex flex-col gap-y-5 max-w-2xl text-white">
        <div className="flex items-center gap-3">
           <Badge className="w-fit bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border-white/10 font-black tracking-[0.2em] text-[10px] uppercase py-1 px-4 mb-2">
            <Sparkles className="h-4 w-4 mr-2 text-amber-400" /> 
            BNI Finance E-Learning
          </Badge>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-none drop-shadow-md">
            Selamat Datang, <br />
            <span className="text-[#E8A020]">
              {userName}!
            </span>
          </h1>
        </div>
        
        <p className="text-slate-300 font-medium text-lg leading-relaxed mt-2 max-w-md border-l-4 border-[#E8A020] pl-6">
          Investasi terbaik adalah pengetahuan. Mari lanjutkan pengembangan diri Anda hari ini.
        </p>

        {resumeData && (
          <div className="pt-6 animate-in slide-in-from-left duration-500 delay-300">
            <Link href={resumeData.href}>
              <Button className="h-16 px-8 rounded-2xl bg-white hover:bg-slate-100 text-[#0F1C3F] font-black text-sm uppercase tracking-[0.1em] shadow-xl transition-all hover:scale-[1.03] active:scale-[0.97] group/btn">
                Lanjutkan: {resumeData.title}
                <div className="ml-4 h-8 w-8 rounded-xl bg-[#0F1C3F] text-white flex items-center justify-center group-hover/btn:translate-x-1 transition-all">
                  <ArrowRight className="h-4 w-4" />
                </div>
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Hero Stats / Hint */}
      <div className="relative z-10 flex flex-col items-end gap-3 text-right hidden lg:flex">
         <div className="bg-white/10 backdrop-blur-md border border-white/10 p-6 rounded-[2rem] shadow-2xl">
            <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1.5">Status Belajar</p>
            <p className="text-2xl font-black text-white tracking-tighter">Sangat Baik 🚀</p>
            <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-end gap-2 text-indigo-200">
               <span className="text-[10px] font-bold uppercase tracking-wider">Terus Pertahankan!</span>
            </div>
         </div>
      </div>
    </div>
  );
};
