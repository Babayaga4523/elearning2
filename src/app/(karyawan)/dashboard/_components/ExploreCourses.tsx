import { Target, Compass, BookOpen, PlayCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const EmptyState = () => (
  <div className="bg-white/50 backdrop-blur-sm border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-4 text-slate-400 group hover:border-blue-200 transition-colors">
    <div className="p-4 bg-slate-50 rounded-2xl group-hover:bg-blue-50 transition-colors">
      <Target className="h-10 w-10 opacity-20 group-hover:text-blue-500 group-hover:opacity-100 transition-all" />
    </div>
    <div className="space-y-1">
      <p className="font-black text-xl text-slate-800 tracking-tight">Belum ada kursus aktif.</p>
      <p className="text-slate-500 text-sm font-medium">Jelajahi katalog di bawah untuk memulai perjalanan belajar Anda.</p>
    </div>
    <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white font-black h-11 px-6 rounded-xl shadow-lg shadow-blue-500/20 mt-2">
       <Link href="/courses">Lihat Katalog</Link>
    </Button>
  </div>
);

export const ExploreCourses = ({ courses }: { courses: any[] }) => {
  if (courses.length === 0) return null;

  return (
    <div className="space-y-6 pt-10 border-t border-slate-200 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-8 bg-amber-500 rounded-full" />
          <div className="space-y-0.5">
             <h2 className="text-2xl font-black text-slate-900 tracking-tight">Eksplorasi Kursus</h2>
             <p className="text-slate-400 text-xs font-medium">Rekomendasi kursus unggulan untuk Anda.</p>
          </div>
        </div>
        <Link href="/courses">
          <Button variant="ghost" className="text-amber-600 font-bold text-xs h-9 flex items-center gap-2 hover:bg-amber-50 rounded-xl px-4">
            Lihat Semua <Compass className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {courses.map((ec: any) => (
          <Link key={ec.id} href={`/courses/${ec.id}`} className="group">
            <Card className="bg-white rounded-2xl border border-slate-100 p-4 hover:border-amber-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-500 cursor-pointer h-full flex flex-col">
              <div className="h-28 mb-4 bg-slate-50 rounded-xl overflow-hidden relative">
                {ec.imageUrl ? (
                  <img 
                    src={ec.imageUrl} 
                    alt={ec.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-slate-100 text-slate-300">
                    <PlayCircle className="h-8 w-8" />
                  </div>
                )}
                <div className="absolute top-2 left-2 flex gap-1">
                   <Badge className="text-[7px] font-bold uppercase px-1.5 py-0 border-none bg-white/90 text-slate-800 shadow-sm">
                     {ec.category?.name || "LMS"}
                   </Badge>
                </div>
              </div>
              
              <h4 className="font-black text-slate-800 text-xs line-clamp-2 min-h-[32px] group-hover:text-amber-600 transition-colors leading-snug tracking-tight">
                {ec.title}
              </h4>
              
              <div className="mt-auto pt-4 flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                <span className="flex items-center gap-1"><BookOpen className="h-3 w-3 text-amber-500" /> {ec._count.modules} Modul</span>
                <span className="bg-slate-50 px-1.5 py-0.5 rounded-md font-black">{ec._count.enrollments} ENROLLED</span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};
