import { auth } from "@/auth";
import { redirect } from "next/navigation";
import {
   BarChart3, Trophy, Target, TrendingUp, BookOpen,
   Activity, CheckCircle2, AlertCircle, ClipboardList, Medal, Check
} from "lucide-react";
import { getPerformanceData } from "@/actions/performance";
import Link from "next/link";
import { ExportTranscriptButton } from "./_components/ExportTranscriptButton";
import { TrendAreaChart, CompareBarChart } from "./_components/charts";
import { PerformanceClient } from "./_components/PerformanceClient";

const trendChartConfig = {
   score: { label: "Skor", color: "#f7941d" },
};

const compareChartConfig = {
   preScore: { label: "Pre-Test", color: "#dac2af" },
   postScore: { label: "Post-Test", color: "#f7941d" },
};

export default async function PerformancePage() {
   const session = await auth();
   if (!session?.user?.id) return redirect("/");

   const data = await getPerformanceData();
   
   if (!data || !data.summary) {
      return (
         <div className="flex items-center justify-center min-h-screen">
            <div className="text-center space-y-4">
               <AlertCircle className="h-12 w-12 text-[#544435] mx-auto" />
               <p className="text-[#544435] font-medium">Gagal memuat data performa</p>
            </div>
         </div>
      );
   }
   
   if (data.summary.totalCourses === 0) return <EmptyState />;

   const passRate =
      data.summary.totalTestsTaken > 0
         ? Math.round((data.summary.totalTestsPassed / data.summary.totalTestsTaken) * 100)
         : 0;

   const barData = data.courseAnalysis
      .filter((c: any) => c.preScore !== null || c.postScore !== null)
      .slice(0, 6)
      .map((c: any) => ({
         name: c.title.length > 14 ? c.title.slice(0, 14) + "…" : c.title,
         preScore: c.preScore ?? 0,
         postScore: c.postScore ?? 0,
      }));

   const completionPct = data.summary.totalCourses > 0 
      ? Math.round((data.summary.completedCourses / data.summary.totalCourses) * 100) 
      : 0;

   return (
      <div className="bg-[#eff4ff] text-[#0b1c30] antialiased min-h-screen flex flex-col font-sans overflow-x-hidden">
         <main className="flex-1 w-full max-w-[1440px] mx-auto p-6 md:p-8 space-y-8">
            
            {/* Premium Header */}
            <header className="bg-gradient-to-r from-[#0b1c30] via-[#213145] to-[#0b1c30] rounded-2xl p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between shadow-lg relative overflow-hidden">
               <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-[#f7941d]/10 to-transparent pointer-events-none"></div>
               <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#f7941d]/5 rounded-full blur-3xl pointer-events-none"></div>
               <div className="z-10 relative">
                  <h1 className="text-white text-3xl md:text-[40px] font-bold tracking-tight mb-3">Performa Belajar</h1>
                  <p className="text-[#cbdbf5]/90 text-base font-light max-w-2xl leading-relaxed">
                     Lacak kemajuan pembelajaran Anda, analisis hasil ujian, dan temukan area untuk peningkatan karir Anda dengan insight mendalam.
                  </p>
               </div>
               <div className="z-10 mt-6 md:mt-0 relative">
                  <ExportTranscriptButton data={data} userName={session.user.name || "Karyawan"} />
               </div>
            </header>

            {/* Metric Cards Grid */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
               <div className="bg-[#ffffff] rounded-2xl p-6 border border-[#dac2af]/40 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                     <span className="text-[#544435] text-xs font-semibold uppercase tracking-wider">Kursus Enrolled</span>
                     <div className="w-8 h-8 rounded-lg bg-[#e5eeff] flex items-center justify-center text-[#f7941d]">
                        <BookOpen className="w-[18px] h-[18px]" />
                     </div>
                  </div>
                  <div className="flex items-baseline gap-3">
                     <span className="text-[#0b1c30] text-4xl font-bold tracking-tight">{data.summary.totalCourses}</span>
                  </div>
               </div>

               <div className="bg-[#ffffff] rounded-2xl p-6 border border-[#dac2af]/40 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                     <span className="text-[#544435] text-xs font-semibold uppercase tracking-wider">Kursus Selesai</span>
                     <div className="w-8 h-8 rounded-lg bg-[#e5eeff] flex items-center justify-center text-[#006970]">
                        <CheckCircle2 className="w-[18px] h-[18px]" />
                     </div>
                  </div>
                  <div className="flex items-baseline gap-2 mb-3">
                     <span className="text-[#0b1c30] text-4xl font-bold tracking-tight">{data.summary.completedCourses}</span>
                  </div>
                  <div className="w-full bg-[#dce9ff] rounded-full h-1.5 overflow-hidden">
                     <div className="bg-[#006970] h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${completionPct}%` }}></div>
                  </div>
                  <div className="text-right mt-2 text-[#544435] text-xs font-medium">{completionPct}% Completion</div>
               </div>

               <div className="bg-[#ffffff] rounded-2xl p-6 border border-[#dac2af]/40 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                     <span className="text-[#544435] text-xs font-semibold uppercase tracking-wider">Ujian Diambil</span>
                     <div className="w-8 h-8 rounded-lg bg-[#e5eeff] flex items-center justify-center text-[#166874]">
                        <ClipboardList className="w-[18px] h-[18px]" />
                     </div>
                  </div>
                  <div className="flex items-baseline gap-3">
                     <span className="text-[#0b1c30] text-4xl font-bold tracking-tight">{data.summary.totalTestsTaken}</span>
                     <span className="text-[#544435] text-xs font-medium">Post-Test</span>
                  </div>
               </div>

               <div className="bg-[#ffffff] rounded-2xl p-6 border border-[#dac2af]/40 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                     <span className="text-[#544435] text-xs font-semibold uppercase tracking-wider">Tingkat Kelulusan</span>
                     <div className="w-8 h-8 rounded-lg bg-[#e5eeff] flex items-center justify-center text-[#f7941d]">
                        <Medal className="w-[18px] h-[18px]" />
                     </div>
                  </div>
                  <div className="flex items-baseline gap-3">
                     <span className="text-[#0b1c30] text-4xl font-bold tracking-tight">{passRate}%</span>
                  </div>
                  <div className="text-[#544435] text-sm mt-1 font-medium">{data.summary.totalTestsPassed} Lulus <span className="text-[#dac2af] mx-1">/</span> {data.summary.totalTestsTaken} Post-Test</div>
               </div>
            </section>

            {/* Analytics Row */}
            <section className="grid grid-cols-1 lg:grid-cols-5 gap-6">
               <div className="lg:col-span-3 bg-[#ffffff] rounded-2xl border border-[#dac2af]/40 shadow-sm p-6 flex flex-col min-h-[420px]">
                  <div className="flex justify-between items-center mb-4">
                     <h2 className="text-[#0b1c30] text-xl font-semibold tracking-tight">Tren Skor Ujian</h2>
                     <span className="bg-[#eff4ff] border border-[#dac2af]/50 text-[#544435] text-sm font-medium rounded-lg py-1.5 px-3">
                        10 percobaan terakhir
                     </span>
                  </div>
                  <div className="flex-1 w-full -ml-4 relative mt-2 min-h-[300px]">
                     <TrendAreaChart trendData={data.trendData} config={trendChartConfig} />
                  </div>
               </div>

               <div className="lg:col-span-2 bg-[#ffffff] rounded-2xl border border-[#dac2af]/40 shadow-sm p-6 flex flex-col min-h-[420px]">
                  <div className="flex justify-between items-center mb-4">
                     <h2 className="text-[#0b1c30] text-xl font-semibold tracking-tight">Pre vs Post-Test</h2>
                  </div>
                  <div className="flex-1 w-full min-h-[300px] flex items-center justify-center">
                     <CompareBarChart barData={barData} config={compareChartConfig} />
                  </div>
               </div>
            </section>

            {/* Bottom Row */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               <div className="lg:col-span-2">
                   {/* Table natively wrapped to blend with PerformanceClient rendering */}
                   <div className="bg-[#ffffff] rounded-2xl border border-[#dac2af]/40 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
                     <div className="p-6 border-b border-[#dac2af]/40 flex justify-between items-center bg-[#ffffff]/50">
                        <h2 className="text-[#0b1c30] text-xl font-semibold tracking-tight">Course Analysis</h2>
                     </div>
                     <div className="p-2 w-full">
                        <PerformanceClient courseAnalysis={data.courseAnalysis} />
                     </div>
                   </div>
               </div>

               <div className="flex flex-col gap-6">
                  {/* Recent Activity Feed */}
                  <div className="bg-[#ffffff] rounded-2xl border border-[#dac2af]/40 shadow-sm p-6 flex-1">
                     <h2 className="text-[#0b1c30] text-xl font-semibold tracking-tight mb-6">Recent Activity</h2>
                     <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[15px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-[#dac2af]/30">
                        {data.recentActivity.length === 0 ? (
                            <p className="text-center text-sm text-[#544435] mt-4 relative z-10 bg-white">Belum ada aktivitas.</p>
                        ) : (
                           data.recentActivity.slice(0, 4).map((activity: any) => (
                           <div key={activity.id} className="relative flex items-start gap-4 z-10 bg-white">
                              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 shadow-sm ${
                                 activity.passed ? "border-[#006970] text-[#006970] bg-[#ffffff]" : "border-[#ba1a1a]/40 text-[#ba1a1a] bg-[#ffffff]"
                              }`}>
                                 {activity.passed ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                              </div>
                              <div className="pt-1.5 pb-2">
                                 <p className="text-[#0b1c30] text-sm font-semibold">{activity.passed ? "Assessment Passed" : "Assessment Failed"}</p>
                                 <p className="text-[#544435] text-sm mt-0.5 line-clamp-1">{activity.testTitle} • <span className="font-medium text-[#0b1c30]">{activity.score}%</span></p>
                                 <p className="text-[#dac2af] text-xs mt-1.5">{new Date(activity.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</p>
                              </div>
                           </div>
                           ))
                        )}
                     </div>
                  </div>

                  {/* Average Score Summary Card */}
                  <div className="bg-gradient-to-br from-[#213145] to-[#0b1c30] rounded-2xl p-6 shadow-sm text-center relative overflow-hidden flex flex-col justify-center min-h-[160px] border border-[#dac2af]/10">
                     <div className="absolute -right-8 -top-8 w-32 h-32 bg-[#f7941d]/20 rounded-full blur-2xl"></div>
                     <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-[#006970]/20 rounded-full blur-2xl"></div>
                     <div className="z-10">
                        <p className="text-[#d3e4fe]/80 text-xs font-semibold uppercase tracking-widest mb-3">Average Score</p>
                        <h3 className="text-white text-5xl leading-none font-bold mb-2">{data.summary.averageScore}<span className="text-2xl text-white/70 font-medium ml-1">%</span></h3>
                     </div>
                  </div>
               </div>
            </section>
         </main>
      </div>
   );
}

function EmptyState() {
   return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#f8f9ff]">
         <div className="max-w-sm w-full border border-[#dac2af] shadow-sm rounded-lg bg-white">
            <div className="p-10 text-center space-y-6">
               <div className="h-16 w-16 bg-[#eff4ff] rounded-lg flex items-center justify-center mx-auto">
                  <TrendingUp className="h-8 w-8 text-[#006970]" />
               </div>
               <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-[#0b1c30]">Mulai Perjalanan Anda</h2>
                  <p className="text-sm text-[#544435] leading-relaxed">
                     Anda belum mengambil kursus apapun. Selesaikan modul dan ujian untuk melihat performa belajar di sini.
                  </p>
               </div>
               <button className="w-full bg-[#f7941d] text-white py-2 rounded-lg font-semibold hover:bg-opacity-90">
                  <Link href="/courses" className="w-full block">Explore Katalog</Link>
               </button>
            </div>
         </div>
      </div>
   );
}