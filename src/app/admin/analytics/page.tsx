import { db } from "@/lib/db";
import { 
  Users, 
  BookOpen, 
  CheckCircle, 
  BarChart3, 
  FileDown 
} from "lucide-react";
import { DataCard } from "@/components/analytics/data-card";
import { AnalyticsClient } from "@/components/analytics/analytics-client";
import { ExportButton } from "@/components/analytics/export-button";

export default async function AdminAnalyticsPage() {
  // All queries run in parallel — no sequential waterfall
  const [
    totalEnrollments,
    statusGroups,
    totalUsers,
    totalCourses,
    courseGroupData,
  ] = await Promise.all([
    db.enrollment.count(),
    // Count by status at the DB level — avoids loading all rows into memory
    db.enrollment.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
    db.user.count({ where: { role: "KARYAWAN" } }),
    db.course.count(),
    // Top 5 courses by enrollment count, with titles
    db.enrollment.groupBy({
      by: ["courseId"],
      _count: { courseId: true },
      orderBy: { _count: { courseId: "desc" } },
      take: 5,
    }),
  ]);

  // Parse from groupBy result
  const completedEnrollments = statusGroups.find(g => g.status === "COMPLETED")?._count.status ?? 0;
  const failedEnrollments    = statusGroups.find(g => g.status === "FAILED")?._count.status ?? 0;
  const inProgressEnrollments = statusGroups.find(g => g.status === "IN_PROGRESS")?._count.status ?? 0;
  const finishedEnrollments  = completedEnrollments + failedEnrollments;

  // Calculated rates
  const completionRate = totalEnrollments > 0
    ? Math.round((finishedEnrollments / totalEnrollments) * 100)
    : 0;
  const passRate = finishedEnrollments > 0
    ? Math.round((completedEnrollments / finishedEnrollments) * 100)
    : 0;

  // Resolve course titles in one query
  const courseIds = courseGroupData.map(c => c.courseId);
  const courses = await db.course.findMany({
    where: { id: { in: courseIds } },
    select: { id: true, title: true },
  });
  const courseTitleMap = Object.fromEntries(courses.map(c => [c.id, c.title]));

  const chartData = courseGroupData.map(c => ({
    name: courseTitleMap[c.courseId] ?? "Unknown",
    total: c._count.courseId,
    completed: 0, // per-course completion requires separate groupBy; excluded for performance
  }));


  return (
    <div className="p-6 space-y-8 bg-slate-50/50 min-h-full transition-all duration-500 animate-in fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Organization Analytics</h1>
          <p className="text-slate-500 font-medium">Real-time performance tracking for BNI Finance E-Learning</p>
        </div>
        <ExportButton />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DataCard
          label="Total Enrollments"
          value={totalEnrollments}
          icon={Users}
          description="Active learning sessions"
          trend="+12% from last month"
          color="blue"
        />
        <DataCard
          label="Completion Rate"
          value={`${completionRate}%`}
          icon={CheckCircle}
          description="Finished (Passed/Failed)"
          trend="Target: 85%"
          color="emerald"
        />
        <DataCard
          label="Organization Pass Rate"
          value={`${passRate}%`}
          icon={BarChart3}
          description="Quality of learning"
          trend="Highly stable"
          color="amber"
        />
        <DataCard
          label="Active Courses"
          value={totalCourses}
          icon={BookOpen}
          description="Published content"
          color="indigo"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
           <AnalyticsClient data={chartData} type="bar" title="Course Completion Distribution" />
        </div>
        <div>
           <AnalyticsClient 
             data={[
               { name: "Lulus", value: completedEnrollments, fill: "#10b981" },
               { name: "Gagal", value: failedEnrollments, fill: "#ef4444" },
               { name: "Berjalan", value: inProgressEnrollments, fill: "#6366f1" }
             ]} 
             type="pie" 
             title="Learning Status Breakdown" 
           />
        </div>
      </div>
    </div>
  );
}
