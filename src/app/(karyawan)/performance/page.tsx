import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { 
  BarChart3, 
  Trophy, 
  Target, 
  TrendingUp, 
  Award, 
  BookOpen, 
  Activity,
  Calendar,
  ChevronRight,
  TrendingDown,
  Info,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { getPerformanceData } from "@/actions/performance";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ExportTranscriptButton } from "./_components/ExportTranscriptButton";

export default async function PerformancePage() {
  const session = await auth();
  if (!session || !session.user?.id) {
    return redirect("/");
  }

  const data = await getPerformanceData();

  if (data.summary.totalCourses === 0) {
    return <EmptyState />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      {/* Header Section */}
      <div className="bg-slate-900 pt-12 pb-32 px-6 md:px-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] -ml-32 -mb-32" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <Badge className="bg-blue-500/20 text-blue-300 border-none font-bold tracking-widest text-[10px] uppercase py-1 px-3">
                Learning Analytics
              </Badge>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">Performa Belajar</h1>
              <p className="text-slate-400 font-medium text-lg max-w-xl">
                 Analisis mendalam mengenai kemajuan kompetensi dan hasil evaluasi Anda di BNI Finance.
              </p>
              <div className="pt-4 flex flex-wrap gap-4">
                 <ExportTranscriptButton 
                   data={data} 
                   userName={session.user.name || "Karyawan"} 
                 />
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center gap-4">
               <div className="h-12 w-12 bg-blue-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                  <BarChart3 className="h-6 w-6" />
               </div>
               <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Rata-rata Skor</p>
                  <p className="text-2xl font-black text-white">{data.summary.averageScore}%</p>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 -mt-20 relative z-20 space-y-8">
        
        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
           <MetricCard 
             label="Kursus Enrolled" 
             value={data.summary.totalCourses} 
             icon={BookOpen} 
             color="blue" 
           />
           <MetricCard 
             label="Kursus Selesai" 
             value={data.summary.completedCourses} 
             icon={Trophy} 
             color="emerald" 
           />
           <MetricCard 
             label="Ujian Diambil" 
             value={data.summary.totalTestsTaken} 
             icon={Activity} 
             color="amber" 
           />
           <MetricCard 
             label="Tingkat Kelulusan" 
             value={`${data.summary.totalTestsTaken > 0 ? Math.round((data.summary.totalTestsPassed / data.summary.totalTestsTaken) * 100) : 0}%`} 
             icon={Target} 
             color="violet" 
           />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Chart Section */}
           <Card className="lg:col-span-2 rounded-[2.5rem] border-none shadow-xl bg-white p-8 md:p-10">
              <div className="flex items-center justify-between mb-10">
                 <div>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">Tren Skor Belajar</h3>
                    <p className="text-sm text-slate-400 font-medium">10 percobaan ujian terakhir</p>
                 </div>
                 <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl text-xs font-black">
                    <TrendingUp className="h-4 w-4" /> TREND POSITIF
                 </div>
              </div>
              
              <div className="h-64 w-full relative">
                 <TrendChart data={data.trendData} />
              </div>
           </Card>

           {/* Recent Activity */}
           <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-8 overflow-hidden">
              <h3 className="text-xl font-black text-slate-800 tracking-tight mb-8">Aktivitas Terakhir</h3>
              <div className="space-y-6">
                 {data.recentActivity.map((activity, idx) => (
                   <div key={activity.id} className="flex gap-4 group transition-all">
                      <div className="flex flex-col items-center">
                         <div className={cn(
                           "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                           activity.passed ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                         )}>
                            {activity.passed ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                         </div>
                         {idx !== data.recentActivity.length - 1 && <div className="w-px h-full bg-slate-100 my-2" />}
                      </div>
                      <div className="flex-1 space-y-1 pb-4">
                         <div className="flex items-center justify-between">
                            <p className="text-sm font-black text-slate-800 line-clamp-1">
                               {activity.testTitle}
                            </p>
                            <span className={cn(
                               "text-xs font-black px-2 py-0.5 rounded-md",
                               activity.passed ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                            )}>
                               {activity.score}%
                            </span>
                         </div>
                         <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                               <BookOpen className="h-3 w-3 text-blue-500" />
                               <span className="line-clamp-1 italic">{activity.courseTitle}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                               <Calendar className="h-3 w-3" />
                               {new Date(activity.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                         </div>
                      </div>
                   </div>
                 ))}
                 {data.recentActivity.length === 0 && (
                   <p className="text-slate-400 text-sm font-medium italic text-center py-10">Belum ada aktivitas ujian.</p>
                 )}
              </div>
           </Card>
        </div>

        {/* Course Analysis Table */}
        <section className="space-y-6">
           <div className="flex items-center gap-3">
              <div className="w-1.5 h-8 bg-blue-600 rounded-full" />
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Analisis Kompetensi Kursus</h2>
           </div>

           <div className="grid grid-cols-1 gap-4">
              {data.courseAnalysis.map((course) => (
                <Card key={course.id} className="rounded-[2rem] border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all">
                   <div className="p-6 md:p-8 flex flex-col md:flex-row items-center gap-8">
                      {/* Course Info */}
                      <div className="w-full md:w-1/3 space-y-2">
                         <Badge variant="secondary" className="bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-tighter">
                            {course.category}
                         </Badge>
                         <h4 className="text-lg font-black text-slate-800 leading-tight group-hover:text-blue-600 transition-colors">
                            {course.title}
                         </h4>
                         <div className="flex items-center gap-2">
                            <Badge className={cn(
                              "text-[9px] font-black border-none",
                              course.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                            )}>
                               {course.status === "COMPLETED" ? "SELESAI" : "BERJALAN"}
                            </Badge>
                            {course.lastAttempt && (
                              <span className="text-[10px] font-bold text-slate-400 italic">
                                Terakhir: {new Date(course.lastAttempt).toLocaleDateString()}
                              </span>
                            )}
                         </div>
                      </div>

                      {/* Progress */}
                      <div className="w-full md:w-1/4 space-y-2 text-center md:text-left">
                         <div className="flex justify-between items-baseline mb-1 px-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progress Modul</span>
                            <span className="text-sm font-black text-slate-800">{course.progress}%</span>
                         </div>
                         <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500 rounded-full transition-all duration-1000" 
                              style={{ width: `${course.progress}%` }} 
                            />
                         </div>
                      </div>

                      {/* Test Grid */}
                      <div className="flex-1 grid grid-cols-2 gap-4 w-full">
                         <ScoreBox label="Pre-Test" score={course.preScore} />
                         <ScoreBox label="Post-Test" score={course.postScore} accent />
                      </div>

                      {/* Growth Insight */}
                      <div className="w-full md:w-1/6 flex justify-center">
                         {course.growth !== null ? (
                           <div className="flex flex-col items-center">
                              <span className={cn(
                                "text-2xl font-black",
                                course.growth >= 0 ? "text-emerald-500" : "text-rose-500"
                              )}>
                                 {course.growth >= 0 ? `+${course.growth}` : course.growth}%
                              </span>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Learning Growth</span>
                           </div>
                         ) : (
                           <div className="flex flex-col items-center text-slate-300">
                              <div className="h-6 w-12 bg-slate-50 rounded animate-pulse" />
                              <span className="text-[10px] font-black uppercase tracking-tighter opacity-50">Tunggu Analisis</span>
                           </div>
                         )}
                      </div>
                   </div>
                </Card>
              ))}
           </div>
        </section>

      </div>
    </div>
  );
}

// ─── Local Components ────────────────────────────────────────────────────────

function MetricCard({ label, value, icon: Icon, color }: { label: string, value: string | number, icon: any, color: "blue" | "emerald" | "amber" | "violet" }) {
  const colors = {
    blue: "bg-blue-100 text-blue-600",
    emerald: "bg-emerald-100 text-emerald-600",
    amber: "bg-amber-100 text-amber-600",
    violet: "bg-violet-100 text-violet-600",
  };

  return (
    <Card className="rounded-[2rem] border-none shadow-md bg-white p-6 group hover:-translate-y-1 transition-all duration-300">
       <div className="flex items-center gap-4">
          <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110", colors[color])}>
             <Icon className="h-7 w-7" />
          </div>
          <div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">{label}</p>
             <p className="text-3xl font-black text-slate-800 tracking-tighter leading-none">{value}</p>
          </div>
       </div>
    </Card>
  );
}

function ScoreBox({ label, score, accent = false }: { label: string, score: number | null, accent?: boolean }) {
  return (
    <div className={cn(
      "p-3 rounded-2xl text-center space-y-1 border-2 transition-all",
      score === null 
        ? "bg-slate-50 border-slate-100/50 grayscale" 
        : (accent ? "bg-blue-50/50 border-blue-500/10" : "bg-indigo-50/50 border-indigo-500/10")
    )}>
       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
       <p className={cn(
         "text-xl font-black",
         score === null ? "text-slate-300" : (accent ? "text-blue-600" : "text-indigo-600")
       )}>
          {score !== null ? `${Math.round(score)}%` : "-"}
       </p>
    </div>
  );
}

function TrendChart({ data }: { data: any[] }) {
  if (data.length < 2) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center text-slate-300 gap-2">
         <TrendingUp className="h-12 w-12 opacity-20" />
         <p className="text-xs font-bold font-black uppercase opacity-20 tracking-tighter">Butuh minimal 2 data poin</p>
      </div>
    );
  }

  const scores = data.map(d => d.score);
  const maxScore = 100;
  const height = 200;
  const width = 800;
  const padding = 20;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * (width - 2 * padding) + padding;
    const y = height - ((d.score / maxScore) * (height - 2 * padding) + padding);
    return `${x},${y}`;
  });

  const pathData = `M ${points.join(' L ')}`;
  const areaData = `${pathData} L ${points[points.length - 1].split(',')[0]},${height} L ${points[0].split(',')[0]},${height} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible drop-shadow-2xl">
      <defs>
        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
      </defs>
      
      {/* Grid Lines */}
      {[0, 25, 50, 75, 100].map(val => {
        const y = height - ((val / maxScore) * (height - 2 * padding) + padding);
        return (
          <g key={val}>
            <line 
              x1={padding} 
              y1={y} 
              x2={width - padding} 
              y2={y} 
              stroke="#f1f5f9" 
              strokeWidth="1" 
            />
            <text x="0" y={y + 3} className="text-[10px] fill-slate-300 font-bold">{val}</text>
          </g>
        )
      })}

      {/* Area with Gradient */}
      <path d={areaData} fill="url(#chartGradient)" />
      
      {/* Line */}
      <path 
        d={pathData} 
        fill="none" 
        stroke="#3b82f6" 
        strokeWidth="4" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className="animate-draw-path"
      />

      {/* Points */}
      {data.map((d, i) => {
        const [x, y] = points[i].split(',').map(Number);
        return (
          <g key={i} className="group/dot">
            <circle 
              cx={x} 
              cy={y} 
              r="6" 
              className="fill-blue-600 stroke-white stroke-[3px] group-hover/dot:r-8 transition-all cursor-pointer" 
            />
            {/* Tooltip on hover (simplified) */}
            <title>{`${d.title}: ${d.score}%`}</title>
          </g>
        )
      })}
    </svg>
  );
}

function EmptyState() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
       <Card className="max-w-md w-full rounded-[3rem] border-none shadow-2xl bg-white p-12 text-center space-y-8">
          <div className="h-24 w-24 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto">
             <TrendingUp className="h-12 w-12" />
          </div>
          <div className="space-y-2">
             <h2 className="text-2xl font-black text-slate-800">Mulai Perjalanan Anda</h2>
             <p className="text-slate-400 font-medium tracking-tight">
                Anda belum mengambil kursus apapun. Selesaikan ujian dan modul untuk melihat performa belajar Anda di sini.
             </p>
          </div>
          <Button asChild className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20">
             <Link href="/courses">Explore Katalog</Link>
          </Button>
       </Card>
    </div>
  );
}
