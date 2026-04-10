import { db } from "@/lib/db";
import { 
  Users, 
  BookOpen, 
  GraduationCap, 
  BarChart3,
  CheckCircle,
  Clock,
  LayoutDashboard,
  PlusCircle,
  FileBarChart
} from "lucide-react";
import Link from "next/link";
import { DataCard } from "@/components/analytics/data-card";
import { AnalyticsClient } from "@/components/analytics/analytics-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminDashboard() {
  // Efficient parallel queries — aggregate at DB level, not in-memory
  const [
    coursesCount,
    usersCount,
    totalEnrollments,
    statusGroups,
    recentEnrollments,
    coursePopularity,
  ] = await Promise.all([
    db.course.count(),
    db.user.count({ where: { role: "KARYAWAN" } }),
    db.enrollment.count(),
    // Group enrollment counts by status in the database — no in-memory filtering
    db.enrollment.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
    // Only fetch the 5 most recent for the activity feed
    db.enrollment.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        course: { select: { title: true } },
      },
    }),
    // Count enrollments per course at DB level for chart data
    db.enrollment.groupBy({
      by: ["courseId"],
      _count: { courseId: true },
      orderBy: { _count: { courseId: "desc" } },
      take: 5,
    }),
  ]);

  // Parse status counts from groupBy result
  const completedCount = statusGroups.find(g => g.status === "COMPLETED")?._count.status ?? 0;
  const failedCount = statusGroups.find(g => g.status === "FAILED")?._count.status ?? 0;
  const inProgressCount = statusGroups.find(g => g.status === "IN_PROGRESS")?._count.status ?? 0;

  // Resolve course titles for the chart
  const topCourseIds = coursePopularity.map(c => c.courseId);
  const topCourses = await db.course.findMany({
    where: { id: { in: topCourseIds } },
    select: { id: true, title: true },
  });
  const courseTitleMap = Object.fromEntries(topCourses.map(c => [c.id, c.title]));

  // Fetch real completion counts for these top courses
  const completionStats = await db.enrollment.groupBy({
    by: ["courseId"],
    where: {
      courseId: { in: topCourseIds },
      status: "COMPLETED"
    },
    _count: { status: true }
  });

  const completionMap = Object.fromEntries(
    completionStats.map(s => [s.courseId, s._count.status])
  );

  const chartData = coursePopularity.map(c => ({
    name: courseTitleMap[c.courseId] ?? "Unknown",
    total: c._count.courseId,
    completed: completionMap[c.courseId] ?? 0,
  }));

  // Status Breakdown for Pie Chart
  const statusData = [
    { name: "Lulus", value: completedCount, fill: "#10b981" },
    { name: "Gagal", value: failedCount, fill: "#ef4444" },
    { name: "Berjalan", value: inProgressCount, fill: "#6366f1" },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Admin Dashboard</h1>
          <p className="text-slate-500 font-medium font-sans">Ringkasan sistem e-learning BNI Finance hari ini.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/courses">
            <Button className="font-bold gap-2">
              <PlusCircle className="h-4 w-4" />
              Kursus Baru
            </Button>
          </Link>
          <Link href="/admin/analytics">
             <Button variant="outline" className="font-bold border-slate-200 gap-2">
                <FileBarChart className="h-4 w-4" />
                Laporan Lengkap
             </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DataCard
          label="Total Kursus"
          value={coursesCount}
          icon={BookOpen}
          description="Kursus dipublikasikan"
          color="blue"
        />
        <DataCard
          label="Karyawan"
          value={usersCount}
          icon={Users}
          description="Pengguna terdaftar"
          color="indigo"
        />
        <DataCard
          label="Pendaftaran"
          value={totalEnrollments}
          icon={GraduationCap}
          description="Enrollment aktif"
          color="emerald"
        />
        <DataCard
          label="Selesai"
          value={completedCount + failedCount}
          icon={CheckCircle}
          description="Tes diselesaikan"
          color="amber"
          trend={`${totalEnrollments > 0 ? Math.round(((completedCount + failedCount) / totalEnrollments) * 100) : 0}% selesai`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <AnalyticsClient 
            data={chartData} 
            type="bar" 
            title="Kursus Terpopuler" 
          />
          
          <Card className="glass-morphism border-slate-200/60 shadow-xl overflow-hidden ring-1 ring-white/20">
            <CardHeader className="bg-white/50 border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold text-slate-800">Aktivitas Terbaru</CardTitle>
              <Users className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent className="p-0">
               <div className="divide-y divide-slate-50">
                  {recentEnrollments.length > 0 ? (
                    recentEnrollments.map((e) => (
                      <div key={e.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors group">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                            {e.user.name?.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{e.user.name}</p>
                            <p className="text-xs text-slate-500 font-medium">Mendaftar {e.course.title}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold text-slate-700">
                             {new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(new Date(e.createdAt))}
                          </p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${
                            e.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 
                            e.status === 'FAILED' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {e.status}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-slate-400 italic text-sm">
                      Belum ada aktivitas pendaftaran.
                    </div>
                  )}
               </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <AnalyticsClient 
            data={statusData} 
            type="pie" 
            title="Status Pembelajaran" 
          />

          <Card className="bg-primary text-white overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full bg-white/10 blur-2xl group-hover:bg-white/20 transition-all duration-700" />
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest opacity-80">Info Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <h3 className="text-lg font-black leading-tight mb-2">Pantau Progress Organisasi</h3>
              <p className="text-sm text-slate-100/80 mb-6 flex items-start gap-2 italic">
                <Clock className="h-4 w-4 shrink-0 mt-0.5" />
                "Data di dashboard ini diperbarui secara otomatis setiap ada aktivitas pendaftaran atau penyelesaian modul."
              </p>
              <Link href="/admin/analytics">
                <Button variant="secondary" size="sm" className="w-full font-bold">
                  Lihat Analytics Lengkap →
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

