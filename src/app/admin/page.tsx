import { db } from "@/lib/db";
import {
  Users,
  BookOpen,
  GraduationCap,
  PlusCircle,
  History,
  ArrowUpRight,
  Trophy,
  Activity,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { AnalyticsClient } from "@/components/analytics/analytics-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageHeader } from "@/components/admin/ui/page-header";
import { DataCard } from "@/components/analytics/data-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { startOfMonth, subMonths, format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { checkAndUpdateExpiredEnrollments } from "@/actions/enrollment-deadline";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  // ── Auto-check: tandai enrollment yang expired sebagai FAILED ─────────────
  await checkAndUpdateExpiredEnrollments();

  const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5));

  const [
    coursesCount,
    usersCount,
    totalEnrollments,
    statusGroups,
    recentEnrollments,
    coursePopularity,
    trendDataRaw,
  ] = await Promise.all([
    db.course.count(),
    db.user.count({ where: { roles: { has: "KARYAWAN" } } }),
    db.enrollment.count(),
    db.enrollment.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
    db.enrollment.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, image: true } },
        course: { select: { title: true } },
      },
    }),
    db.enrollment.groupBy({
      by: ["courseId"],
      _count: { courseId: true },
      orderBy: { _count: { courseId: "desc" } },
      take: 5,
    }),
    db.enrollment.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true, status: true },
    }),
  ]);

  // -- Process Trends (Line Charts) --
  const enrollmentMonthly: Record<string, number> = {};
  const completionMonthly: Record<string, number> = {};
  const interactivePieRaw: Record<string, any> = {};

  for (let i = 5; i >= 0; i--) {
     const monthDate = subMonths(new Date(), i);
     const monthKey = format(monthDate, "MMMM yyyy", { locale: localeId });
     enrollmentMonthly[monthKey] = 0;
     completionMonthly[monthKey] = 0;
     interactivePieRaw[monthKey] = { COMPLETED: 0, FAILED: 0, IN_PROGRESS: 0, PENDING: 0, REJECTED: 0 };
  }

  trendDataRaw.forEach((e) => {
     const monthKey = format(e.createdAt, "MMMM yyyy", { locale: localeId });
     if (enrollmentMonthly[monthKey] !== undefined) {
        enrollmentMonthly[monthKey]++;
        if (e.status === "COMPLETED") completionMonthly[monthKey]++;
        if (interactivePieRaw[monthKey][e.status] !== undefined) {
           interactivePieRaw[monthKey][e.status]++;
        } else {
           interactivePieRaw[monthKey][e.status] = 1;
        }
     }
  });

  const lineEnrollmentData = Object.entries(enrollmentMonthly).map(([name, total]) => ({
     month: name.split(" ")[0],
     total,
  }));

  const lineCompletionData = Object.entries(completionMonthly).map(([name, total]) => ({
     month: name.split(" ")[0],
     total,
  }));

  const interactivePieData = Object.entries(interactivePieRaw).reduce((acc, [monthKey, stats]) => {
     const monthName = monthKey.split(" ")[0];
     acc[monthName] = [
        { name: "Lulus", value: stats.COMPLETED || 0, fill: "#0F1C3F" },
        { name: "Gagal", value: stats.FAILED || 0, fill: "#EF4444" },
        { name: "Berjalan", value: stats.IN_PROGRESS || 0, fill: "#E8A020" },
        { name: "Menunggu", value: stats.PENDING || 0, fill: "#94A3B8" },
        { name: "Ditolak", value: stats.REJECTED || 0, fill: "#64748B" },
     ];
     return acc;
  }, {} as Record<string, any[]>);

  const completedCount = statusGroups.find((g) => g.status === "COMPLETED")?._count.status ?? 0;
  const failedCount = statusGroups.find((g) => g.status === "FAILED")?._count.status ?? 0;
  const rejectedCount = statusGroups.find((g) => g.status === "REJECTED")?._count.status ?? 0;
  const pendingCount = statusGroups.find((g) => g.status === "PENDING")?._count.status ?? 0;
  
  // Completion rate: exclude REJECTED and PENDING (not actual enrollments)
  const validEnrollments = totalEnrollments - rejectedCount - pendingCount;
  const completionRate = validEnrollments > 0 ? Math.round((completedCount / validEnrollments) * 100) : 0;

  const topCourseIds = coursePopularity.map((c) => c.courseId);
  const [topCourses, completionStats] = await Promise.all([
    db.course.findMany({ where: { id: { in: topCourseIds } }, select: { id: true, title: true } }),
    db.enrollment.groupBy({
      by: ["courseId"],
      where: { courseId: { in: topCourseIds }, status: "COMPLETED" },
      _count: { status: true },
    }),
  ]);

  const courseTitleMap = Object.fromEntries(topCourses.map((c) => [c.id, c.title]));
  const completionMap = Object.fromEntries(completionStats.map((s) => [s.courseId, s._count.status]));

  const barChartData = coursePopularity.map((c) => ({
    name: (courseTitleMap[c.courseId] ?? "Unknown").split(" ").slice(0, 3).join(" "),
    total: c._count.courseId,
    completed: completionMap[c.courseId] ?? 0,
  }));

  const statusMap: Record<string, { label: string; color: string }> = {
    COMPLETED: { label: "Selesai", color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
    FAILED: { label: "Gagal", color: "bg-rose-50 text-rose-700 border-rose-100" },
    IN_PROGRESS: { label: "Berjalan", color: "bg-amber-50 text-amber-700 border-amber-100" },
    PENDING: { label: "Menunggu", color: "bg-slate-50 text-slate-700 border-slate-100" },
    REJECTED: { label: "Ditolak", color: "bg-slate-50 text-slate-500 border-slate-100" },
    ENROLLED: { label: "Terdaftar", color: "bg-indigo-50 text-indigo-700 border-indigo-100" },
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-700">
      <PageHeader 
        title="Dashboard Utama"
        description="Analisis performa pendaftaran dan statistik hasil belajar karyawan secara komprehensif."
        actions={
          <Link href="/admin/courses/create">
             <Button className="bg-[#0F1C3F] hover:bg-[#1A3060] text-white h-10 px-5 rounded-xl gap-2 shadow-lg shadow-[#0F1C3F]/10 font-bold text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95">
                <PlusCircle className="h-4 w-4 text-[#E8A020]" />
                Buat Kursus Baru
             </Button>
          </Link>
        }
      />

      {/* Row 1 — Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DataCard label="Total User" value={usersCount} icon={Users} description="Karyawan terdaftar aktif" color="blue" />
        <DataCard label="Total Kursus" value={coursesCount} icon={BookOpen} description="Katalog materi tersedia" color="emerald" />
        <DataCard label="Enrollment" value={totalEnrollments} icon={GraduationCap} description="Pendaftaran materi total" color="amber" />
        <DataCard label="Completion" value={`${completionRate}%`} icon={Trophy} description="Tingkat keberhasilan sistem" color="indigo" />
      </div>

      {/* Row 2 — Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Trend Area */}
        <div className="lg:col-span-8">
          <Card className="rounded-2xl border border-slate-100 bg-white shadow-sm h-full flex flex-col overflow-hidden">
            <Tabs defaultValue="enrollment" className="flex-1 flex flex-col">
               <div className="flex items-center justify-between px-6 pt-5 pb-3">
                  <div className="space-y-1">
                    <CardTitle className="text-base font-bold text-[#0F1C3F] font-lexend">Metrik Pertumbuhan</CardTitle>
                    <CardDescription className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#E8A020]">Analisis 6 Bulan Terakhir</CardDescription>
                  </div>
                  <TabsList className="bg-slate-50/80 p-1 rounded-xl h-10 border border-slate-100">
                    <TabsTrigger value="enrollment" className="text-[10px] font-bold uppercase py-2 px-4 rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#0F1C3F] data-[state=active]:shadow-sm transition-all duration-300">Enrollment</TabsTrigger>
                    <TabsTrigger value="completion" className="text-[10px] font-bold uppercase py-2 px-4 rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#0F1C3F] data-[state=active]:shadow-sm transition-all duration-300">Kelulusan</TabsTrigger>
                  </TabsList>
               </div>
               <div className="h-px w-full bg-slate-50" />
               <div className="flex-1 p-6">
                 <TabsContent value="enrollment" className="m-0 h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <AnalyticsClient data={lineEnrollmentData} type="line" title="" height={280} />
                 </TabsContent>
                 <TabsContent value="completion" className="m-0 h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <AnalyticsClient data={lineCompletionData} type="line" title="" height={280} />
                 </TabsContent>
               </div>
            </Tabs>
          </Card>
        </div>

        {/* Distribution Area */}
        <div className="lg:col-span-4">
           <AnalyticsClient 
              data={interactivePieData} 
              type="interactive-pie" 
              title="Status Distribusi" 
              description="Rasio keberhasilan per bulan"
              height={260}
           />
        </div>
      </div>

      {/* Row 3 — Success Metrics & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Popular Courses */}
        <div className="lg:col-span-5">
          <AnalyticsClient 
            data={barChartData} 
            type="bar" 
            title="Kursus Terpopuler" 
            description="Performa pendaftaran per materi"
            height={260}
          />
        </div>

        {/* Improved Activity Feed */}
        <div className="lg:col-span-7">
          <Card className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden h-full flex flex-col">
            <CardHeader className="py-5 px-6 border-b border-slate-50 bg-slate-50/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="h-10 w-10 rounded-xl bg-[#0F1C3F]/5 flex items-center justify-center">
                      <Activity className="h-5 w-5 text-[#0F1C3F]" />
                   </div>
                   <div>
                      <CardTitle className="text-sm font-bold text-[#0F1C3F] font-lexend leading-tight">Aktivitas Terkini</CardTitle>
                      <CardDescription className="text-[10px] font-medium text-slate-400 mt-0.5">Log pendaftaran & progres kursus</CardDescription>
                   </div>
                </div>
                <Link href="/admin/enrollments">
                   <Button variant="ghost" className="h-8 px-3 text-[10px] font-bold uppercase tracking-widest text-[#E8A020] hover:text-[#0F1C3F] hover:bg-[#E8A020]/10 rounded-lg">
                      Lihat Semua
                   </Button>
                </Link>
              </div>
            </CardHeader>
            <ScrollArea className="flex-1">
              <div className="divide-y divide-slate-50">
                {recentEnrollments.map((e) => {
                  const config = statusMap[e.status] || { label: e.status, color: "bg-slate-50 text-slate-400" };
                  return (
                    <div key={e.id} className="flex items-center gap-4 p-5 hover:bg-slate-50/50 transition-all duration-300 group">
                      <Avatar className="h-10 w-10 border-2 border-white ring-1 ring-slate-100 shadow-sm transition-transform group-hover:scale-105">
                        <AvatarFallback className="bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase">{e.user.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-[#0F1C3F] leading-tight truncate tracking-tight">{e.user.name}</p>
                        <p className="text-[10px] font-medium text-slate-400 truncate mt-1">{e.course.title}</p>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                         <Badge variant="outline" className={cn("text-[8px] font-black uppercase px-2 py-0.5 rounded-md border shadow-sm", config.color)}>
                            {config.label}
                         </Badge>
                         <span className="text-[10px] font-bold text-slate-300">{format(e.createdAt, "dd MMM", { locale: localeId })}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </Card>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {[
           { href: "/admin/courses", icon: BookOpen, label: "Materi & Kurikulum", subtitle: "Atur pustaka e-learning", color: "text-indigo-600", bg: "bg-indigo-50" },
           { href: "/admin/users", icon: Users, label: "Direktori Karyawan", subtitle: "Kelola data pengguna", color: "text-emerald-600", bg: "bg-emerald-50" },
           { href: "/admin/logs", icon: History, label: "Log Sinkronisasi", subtitle: "Riwayat update sistem", color: "text-amber-600", bg: "bg-amber-50" },
         ].map((item) => (
            <Link key={item.href} href={item.href} className="group overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:border-[#E8A020]/30 hover:-translate-y-1">
               <div className="flex items-center justify-between">
                  <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 group-hover:rotate-3 shadow-sm", item.bg, item.color)}>
                     <item.icon className="h-6 w-6" />
                  </div>
                  <div className="h-8 w-8 rounded-full flex items-center justify-center text-slate-200 group-hover:text-[#E8A020] transition-colors">
                     <ArrowUpRight className="h-5 w-5" />
                  </div>
               </div>
               <div className="mt-8">
                  <h3 className="text-sm font-bold text-[#0F1C3F] font-lexend">{item.label}</h3>
                  <p className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-widest">{item.subtitle}</p>
               </div>
            </Link>
         ))}
      </div>
    </div>
  );
}

const Separator = ({ className }: { className?: string }) => (
   <div className={cn("h-[1px] w-full", className)} />
);