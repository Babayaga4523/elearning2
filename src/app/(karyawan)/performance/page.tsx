import { auth } from "@/auth";
import { redirect } from "next/navigation";
import {
   BarChart3, Trophy, Target, TrendingUp, BookOpen,
   Activity, CheckCircle2, AlertCircle
} from "lucide-react";
import { getPerformanceData } from "@/actions/performance";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ExportTranscriptButton } from "./_components/ExportTranscriptButton";
import { TrendAreaChart, CompareBarChart } from "./_components/charts";
import { PerformanceClient } from "./_components/PerformanceClient";

// ─── Chart configs ──────────────────────────────────────────────────────────

const trendChartConfig = {
   score: { label: "Skor", color: "hsl(var(--chart-1))" },
};

const compareChartConfig = {
   preScore: { label: "Pre-Test", color: "hsl(var(--chart-2))" },
   postScore: { label: "Post-Test", color: "hsl(var(--chart-1))" },
};

// ─── Page ───────────────────────────────────────────────────────────────────

export default async function PerformancePage() {
   const session = await auth();
   if (!session?.user?.id) return redirect("/");

   const data = await getPerformanceData();
   
   // Null check untuk data dan summary
   if (!data || !data.summary) {
      return (
         <div className="flex items-center justify-center min-h-screen">
            <div className="text-center space-y-4">
               <AlertCircle className="h-12 w-12 text-slate-400 mx-auto" />
               <p className="text-slate-600 font-medium">Gagal memuat data performa</p>
            </div>
         </div>
      );
   }
   
   if (data.summary.totalCourses === 0) return <EmptyState />;

   const passRate =
      data.summary.totalTestsTaken > 0
         ? Math.round((data.summary.totalTestsPassed / data.summary.totalTestsTaken) * 100)
         : 0;

   // Prepare bar chart data (last 6 courses with both scores)
   const barData = data.courseAnalysis
      .filter((c: any) => c.preScore !== null || c.postScore !== null)
      .slice(0, 6)
      .map((c: any) => ({
         name: c.title.length > 14 ? c.title.slice(0, 14) + "…" : c.title,
         preScore: c.preScore ?? 0,
         postScore: c.postScore ?? 0,
      }));

   return (
      <div className="min-h-screen pb-20 bg-slate-50">

         {/* ── Header ─────────────────────────────────────────────────────── */}
         <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
               <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                  <div className="space-y-2">
                     <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">Performa Belajar</h1>
                     <p className="text-base text-slate-300 max-w-lg">
                        Analisis kemajuan kompetensi dan hasil evaluasi Anda di BNI Finance.
                     </p>
                  </div>
                  <ExportTranscriptButton data={data} userName={session.user.name || "Karyawan"} />
               </div>
            </div>
         </div>

         {/* ── Body ──────────────────────────────────────────────────────── */}
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

            {/* ── Metric Cards ─────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
                  sub={`${data.summary.totalCourses > 0
                     ? Math.round((data.summary.completedCourses / data.summary.totalCourses) * 100)
                     : 0}% completion`}
               />
               <MetricCard
                  label="Ujian Diambil"
                  value={data.summary.totalTestsTaken}
                  icon={Activity}
                  color="amber"
               />
               <MetricCard
                  label="Tingkat Kelulusan"
                  value={`${passRate}%`}
                  icon={Target}
                  color="violet"
                  sub={`${data.summary.totalTestsPassed} dari ${data.summary.totalTestsTaken} lulus`}
               />
            </div>

            {/* ── Charts Row ───────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

               {/* Trend Area Chart */}
               <Card className="lg:col-span-3 border shadow-sm rounded-lg bg-white">
                  <CardHeader className="pb-4">
                     <div className="flex items-start justify-between">
                        <div>
                           <CardTitle className="text-lg font-semibold text-slate-900">Tren Skor Ujian</CardTitle>
                           <CardDescription className="mt-1">10 percobaan terakhir</CardDescription>
                        </div>
                     </div>
                  </CardHeader>
                  <CardContent>
                     <TrendAreaChart trendData={data.trendData} config={trendChartConfig} />
                  </CardContent>
               </Card>

               {/* Pre vs Post Bar Chart */}
               <Card className="lg:col-span-2 border shadow-sm rounded-lg bg-white">
                  <CardHeader className="pb-4">
                     <CardTitle className="text-lg font-semibold text-slate-900">Pre vs Post-Test</CardTitle>
                     <CardDescription className="mt-1">Perbandingan skor per kursus</CardDescription>
                  </CardHeader>
                  <CardContent>
                     <CompareBarChart barData={barData} config={compareChartConfig} />
                  </CardContent>
               </Card>
            </div>

            {/* ── Bottom Row ────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

               {/* Course Analysis */}
               <div className="lg:col-span-2">
                  <PerformanceClient courseAnalysis={data.courseAnalysis} />
               </div>

               {/* Recent Activity */}
               <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-slate-900">Aktivitas Terakhir</h2>

                  <Card className="border shadow-sm rounded-lg bg-white">
                     <CardContent className="p-0 divide-y">
                        {data.recentActivity.length === 0 ? (
                           <div className="py-12 flex flex-col items-center text-slate-400 gap-3">
                              <Activity className="h-10 w-10 opacity-20" />
                              <p className="text-sm text-slate-500">Belum ada aktivitas ujian</p>
                           </div>
                        ) : (
                           data.recentActivity.map((activity: any) => (
                              <div key={activity.id} className="flex items-start gap-4 p-4 hover:bg-slate-50 transition-colors">
                                 <div className={cn(
                                    "mt-0.5 h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                                    activity.passed
                                       ? "bg-emerald-50 text-emerald-600"
                                       : "bg-rose-50 text-rose-500"
                                 )}>
                                    {activity.passed
                                       ? <CheckCircle2 className="h-5 w-5" />
                                       : <AlertCircle className="h-5 w-5" />}
                                 </div>

                                 <div className="flex-1 min-w-0 space-y-1">
                                    <p className="text-sm font-semibold text-slate-900 line-clamp-1">{activity.testTitle}</p>
                                    <p className="text-xs text-slate-500 line-clamp-1">{activity.courseTitle}</p>
                                    <p className="text-xs text-slate-400">
                                       {new Date(activity.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                                    </p>
                                 </div>

                                 <Badge
                                    className={cn(
                                       "text-sm font-semibold tabular-nums shrink-0",
                                       activity.passed
                                          ? "bg-emerald-100 text-emerald-700"
                                          : "bg-rose-100 text-rose-700"
                                    )}
                                    variant="outline"
                                 >
                                    {activity.score}%
                                 </Badge>
                              </div>
                           ))
                        )}
                     </CardContent>
                  </Card>

                  {/* Average Score Summary Card */}
                  <Card className="rounded-lg border shadow-md bg-gradient-to-br from-slate-900 to-slate-800">
                     <CardContent className="p-6 flex items-center gap-5">
                        <div className="h-14 w-14 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                           <BarChart3 className="h-7 w-7 text-white" />
                        </div>
                        <div>
                           <p className="text-xs text-slate-300 mb-1">
                              Rata-rata Skor
                           </p>
                           <p className="text-4xl font-bold tabular-nums text-white">
                              {data.summary.averageScore}%
                           </p>
                        </div>
                     </CardContent>
                  </Card>
               </div>

            </div>
         </div>
      </div>
   );
}

// ─── MetricCard ──────────────────────────────────────────────────────────────

const colorMap = {
   blue: { icon: "bg-blue-100 text-blue-600" },
   emerald: { icon: "bg-emerald-100 text-emerald-600" },
   amber: { icon: "bg-amber-100 text-amber-600" },
   violet: { icon: "bg-violet-100 text-violet-600" },
};

function MetricCard({
   label, value, icon: Icon, color, sub,
}: {
   label: string;
   value: string | number;
   icon: any;
   color: keyof typeof colorMap;
   sub?: string;
}) {
   const c = colorMap[color];
   return (
      <Card className="border shadow-sm rounded-lg bg-white hover:shadow-md transition-shadow">
         <CardContent className="p-5 flex items-center gap-4">
            <div className={cn("h-12 w-12 rounded-lg flex items-center justify-center shrink-0", c.icon)}>
               <Icon className="h-6 w-6" />
            </div>
            <div className="min-w-0">
               <p className="text-xs text-slate-500 truncate mb-0.5">{label}</p>
               <p className="text-2xl font-semibold tabular-nums text-slate-900 leading-none">{value}</p>
               {sub && <p className="text-xs text-slate-400 truncate mt-1">{sub}</p>}
            </div>
         </CardContent>
      </Card>
   );
}

// ─── EmptyState ──────────────────────────────────────────────────────────────

function EmptyState() {
   return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
         <Card className="max-w-sm w-full border shadow-sm rounded-lg">
            <CardContent className="p-10 text-center space-y-6">
               <div className="h-16 w-16 bg-slate-100 rounded-lg flex items-center justify-center mx-auto">
                  <TrendingUp className="h-8 w-8 text-slate-400" />
               </div>
               <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-slate-900">Mulai Perjalanan Anda</h2>
                  <p className="text-sm text-slate-500 leading-relaxed">
                     Anda belum mengambil kursus apapun. Selesaikan modul dan ujian untuk melihat performa belajar di sini.
                  </p>
               </div>
               <Button asChild className="w-full">
                  <Link href="/courses">Explore Katalog</Link>
               </Button>
            </CardContent>
         </Card>
      </div>
   );
}