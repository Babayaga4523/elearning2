import { db } from "@/lib/db";
import { Users, BookOpen, CheckCircle, BarChart3, TrendingUp } from "lucide-react";
import { DataCard } from "@/components/analytics/data-card";
import { AnalyticsClient } from "@/components/analytics/analytics-client";
import { ExportButton } from "@/components/analytics/export-button";
import { PageHeader } from "@/components/admin/ui/page-header";
import { startOfMonth, subMonths, format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5));

  const [
    totalEnrollments,
    statusGroups,
    totalCourses,
    courseGroupData,
    trendDataRaw,
  ] = await Promise.all([
    db.enrollment.count(),
    db.enrollment.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
    db.course.count(),
    // Only include enrollments for courses that still exist
    db.enrollment.groupBy({
      by: ["courseId"],
      where: {
        course: { 
          isPublished: true
        }
      },
      _count: { status: true },
      orderBy: { _count: { status: "desc" } },
      take: 5,
    }),
    db.enrollment.findMany({
      where: { 
        createdAt: { gte: sixMonthsAgo },
        course: { 
          isPublished: true
        }
      },
      select: { createdAt: true },
    }),
  ]);

  const completedEnrollments = statusGroups.find((g) => g.status === "COMPLETED")?._count.status ?? 0;
  const failedEnrollments = statusGroups.find((g) => g.status === "FAILED")?._count.status ?? 0;
  const inProgressEnrollments = statusGroups.find((g) => g.status === "IN_PROGRESS")?._count.status ?? 0;
  const pendingEnrollments = statusGroups.find((g) => g.status === "PENDING")?._count.status ?? 0;
  const rejectedEnrollments = statusGroups.find((g) => g.status === "REJECTED")?._count.status ?? 0;
  const finishedEnrollments = completedEnrollments + failedEnrollments;

  const completionRate = totalEnrollments > 0 ? Math.round((finishedEnrollments / totalEnrollments) * 100) : 0;
  const passRate = finishedEnrollments > 0 ? Math.round((completedEnrollments / finishedEnrollments) * 100) : 0;

  const courseIds = courseGroupData.map((c) => c.courseId);
  const [courses, completionStats] = await Promise.all([
    db.course.findMany({
      where: { 
        id: { in: courseIds },
        // Ensure courses still exist and are valid
        isPublished: true
      },
      select: { id: true, title: true },
    }),
    db.enrollment.groupBy({
      by: ["courseId"],
      where: { 
        courseId: { in: courseIds }, 
        status: "COMPLETED",
        course: { 
          isPublished: true
        }
      },
      _count: { status: true },
    }),
  ]);

  const courseTitleMap = Object.fromEntries(courses.map((c) => [c.id, c.title]));
  const completionMap = Object.fromEntries(completionStats.map((s) => [s.courseId, s._count.status]));

  const chartData = courseGroupData.map((c) => ({
    name: (courseTitleMap[c.courseId] ?? "Unknown").split(" ").slice(0, 3).join(" "),
    total: c._count.status,
    completed: completionMap[c.courseId] ?? 0,
  }));

  const pieData = [
    { name: "Lulus", value: completedEnrollments, fill: "#0F1C3F" },
    { name: "Gagal", value: failedEnrollments, fill: "#EF4444" },
    { name: "Berjalan", value: inProgressEnrollments, fill: "#E8A020" },
    { name: "Menunggu", value: pendingEnrollments, fill: "#94A3B8" },
    { name: "Ditolak", value: rejectedEnrollments, fill: "#64748B" },
  ];

  // Radar Data (Actual 6-month trend)
  const monthlyData: Record<string, { count: number; label: string }> = {};
  for (let i = 5; i >= 0; i--) {
    const d = subMonths(new Date(), i);
    const key = format(d, "yyyy-MM"); // unique key per year+month
    const label = format(d, "MMMM", { locale: localeId }); // display label
    monthlyData[key] = { count: 0, label };
  }

  trendDataRaw.forEach((e) => {
    const key = format(e.createdAt, "yyyy-MM");
    if (monthlyData[key] !== undefined) {
      monthlyData[key].count++;
    }
  });

  const radarData = Object.entries(monthlyData).map(([, { count, label }]) => ({
    month: label,
    total: count,
  }));

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      <PageHeader 
        title="Laporan & Wawasan"
        description="Analisis mendalam mengenai pendaftaran, efektivitas materi, dan sebaran aktivitas peserta."
        actions={<ExportButton />}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DataCard label="Total Enrollment" value={totalEnrollments} icon={Users} description="Seluruh pendaftaran materi" color="blue" />
        <DataCard label="Pros. Penyelesaian" value={`${completionRate}%`} icon={CheckCircle} description="Tingkat selesai kursus" color="emerald" />
        <DataCard label="Pros. Kelulusan" value={`${passRate}%`} icon={TrendingUp} description="Efektivitas pembelajaran" color="amber" />
        <DataCard label="Materi Aktif" value={totalCourses} icon={BookOpen} description="Total materi tersedia" color="indigo" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
           <AnalyticsClient
             data={chartData}
             type="multiple-bar"
             title="Efektivitas Kursus Terpopuler"
             description="Perbandingan jumlah pendaftaran vs kelulusan peserta."
             height={350}
           />
        </div>
        <div className="lg:col-span-4">
           <AnalyticsClient 
             data={radarData} 
             type="radar" 
             title="Sebaran Tren Belajar" 
             description="Aktivitas enrollment 6 bulan"
             height={350}
           />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
         <div className="lg:col-span-4">
            <AnalyticsClient 
               data={pieData} 
               type="pie" 
               title="Status Belajar Global" 
               description="Rasio kelulusan vs kegagalan sistem"
               height={320}
            />
         </div>
         <div className="lg:col-span-8">
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm h-full flex flex-col justify-center items-center text-center">
               <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6" />
               </div>
               <h3 className="text-sm font-bold text-[#0F1C3F] font-lexend">Analitik Lanjutan</h3>
               <p className="text-[11px] font-medium text-slate-400 mt-2 max-w-[280px]">Gunakan filter untuk melihat data yang lebih spesifik berdasarkan departemen atau periode waktu tertentu.</p>
            </div>
         </div>
      </div>
    </div>
  );
}
