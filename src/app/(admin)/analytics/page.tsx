import { getAdminAnalytics } from "@/lib/analytics";
import { BarChartClient } from "@/components/analytics/BarChartClient";
import { DonutChartClient } from "@/components/analytics/DonutChartClient";
import { MetricCard } from "@/components/analytics/MetricCard";
import { ExportButton } from "@/components/analytics/ExportButton";
import { Badge } from "@/components/ui/badge";
import { EnrollmentStatus } from "@prisma/client";
import { 
  Users, 
  BookOpen, 
  CheckCircle2, 
  TrendingUp, 
  Award,
  Clock,
  AlertCircle
} from "lucide-react";

export default async function AnalyticsPage() {
  const data = await getAdminAnalytics();

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Analytics & Pelaporan</h1>
          <p className="text-slate-500 mt-1">Pantau performa pelatihan dan kemajuan karyawan secara real-time.</p>
        </div>
        <ExportButton />
      </div>

      {/* High-Level Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          label="Total Karyawan Aktif"
          value={data.metrics.totalKaryawan}
          hint="Total akun role Karyawan"
        />
        <MetricCard
          label="Kursus Terpublikasi"
          value={data.metrics.totalCourse}
          hint="Kursus yang dapat diakses"
        />
        <MetricCard
          label="Completion Rate"
          value={`${data.metrics.completionRate}%`}
          hint="Enrollment yang sudah selesai"
        />
        <MetricCard
          label="Rata-rata Nilai"
          value={data.metrics.avgScore}
          hint="Berdasarkan hasil Post-Test"
        />
      </div>

      {/* Visualizations Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col: Enrollment Comparison */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-600" />
              <h3 className="text-lg font-semibold text-slate-800">Enrollment per Kursus</h3>
            </div>
          </div>
          <BarChartClient data={data.courseStats} />
        </div>

        {/* Right Col: Performance Distribution */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-8">
            <Award className="h-5 w-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-slate-800">Status Kelulusan</h3>
          </div>
          <DonutChartClient data={data.donut} />
        </div>
      </div>

      {/* Tables & Deep Dive Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Popular Courses Leaderboard */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="h-5 w-5 text-orange-500" />
            <h3 className="text-lg font-semibold text-slate-800">Top 5 Kursus Terpopuler</h3>
          </div>
          <div className="space-y-6">
            {data.courseStats.map((course, i) => (
              <div key={i} className="group flex items-center gap-4 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-sm font-semibold text-slate-700 truncate">{course.title}</p>
                    <span className="text-xs font-medium text-slate-400">{course.total} Peserta</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 transition-all duration-1000 ease-out"
                      style={{ width: `${course.passRate}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Pass Rate: {course.passRate}%</p>
                </div>
                <Badge variant={course.passRate > 80 ? "secondary" : "outline"} className={course.passRate > 80 ? "bg-emerald-50 text-emerald-700 border-emerald-100" : ""}>
                   {course.passRate}% Rank
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="h-5 w-5 text-slate-400" />
            <h3 className="text-lg font-semibold text-slate-800">Aktivitas Terbaru</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Karyawan</th>
                  <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Kursus</th>
                  <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Nilai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.recentActivity.map((item, i) => (
                  <tr key={i} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="py-4">
                      <p className="text-sm font-medium text-slate-700">{item.name}</p>
                    </td>
                    <td className="py-4">
                      <p className="text-sm text-slate-500 truncate max-w-[150px]">{item.course}</p>
                    </td>
                    <td className="py-4">
                      <Badge 
                        variant="outline" 
                        className={
                          item.status === EnrollmentStatus.COMPLETED 
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                            : item.status === EnrollmentStatus.FAILED 
                              ? "bg-rose-50 text-rose-700 border-rose-100" 
                              : "bg-slate-50 text-slate-600 border-slate-200"
                        }
                      >
                        {item.status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="py-4 text-right font-mono text-sm font-semibold text-slate-700">
                      {item.score !== null ? item.score : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
