import { db } from "@/lib/db";
import { Users, BookOpen, CheckCircle, BarChart3 } from "lucide-react";
import { DataCard } from "@/components/analytics/data-card";
import { AnalyticsClient } from "@/components/analytics/analytics-client";
import { ExportButton } from "@/components/analytics/export-button";

export default async function AdminAnalyticsPage() {
  const [
    totalEnrollments,
    statusGroups,
    totalCourses,
    courseGroupData,
  ] = await Promise.all([
    db.enrollment.count(),
    db.enrollment.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
    db.course.count(),
    db.enrollment.groupBy({
      by: ["courseId"],
      _count: { courseId: true },
      orderBy: { _count: { courseId: "desc" } },
      take: 5,
    }),
  ]);

  const completedEnrollments =
    statusGroups.find((g) => g.status === "COMPLETED")?._count.status ?? 0;
  const failedEnrollments =
    statusGroups.find((g) => g.status === "FAILED")?._count.status ?? 0;
  const inProgressEnrollments =
    statusGroups.find((g) => g.status === "IN_PROGRESS")?._count.status ?? 0;
  const finishedEnrollments = completedEnrollments + failedEnrollments;

  const completionRate =
    totalEnrollments > 0
      ? Math.round((finishedEnrollments / totalEnrollments) * 100)
      : 0;
  const passRate =
    finishedEnrollments > 0
      ? Math.round((completedEnrollments / finishedEnrollments) * 100)
      : 0;

  const courseIds = courseGroupData.map((c) => c.courseId);
  const courses = await db.course.findMany({
    where: { id: { in: courseIds } },
    select: { id: true, title: true },
  });
  const courseTitleMap = Object.fromEntries(courses.map((c) => [c.id, c.title]));

  const chartData = courseGroupData.map((c) => ({
    name:
      (courseTitleMap[c.courseId] ?? "Tanpa judul").length > 22
        ? `${(courseTitleMap[c.courseId] ?? "?").slice(0, 22)}…`
        : courseTitleMap[c.courseId] ?? "Tanpa judul",
    total: c._count.courseId,
    completed: 0,
  }));

  const pieData = [
    { name: "Lulus", value: completedEnrollments, fill: "#059669" },
    { name: "Gagal", value: failedEnrollments, fill: "#EF4444" },
    { name: "Berjalan", value: inProgressEnrollments, fill: "#0F1C3F" },
  ];

  return (
    <div
      className="min-h-full w-full min-w-0 space-y-6 bg-slate-50/50 py-6 transition-all duration-500 animate-in fade-in md:space-y-8"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p
            className="mb-1 text-[10px] font-black uppercase tracking-[0.2em]"
            style={{ color: "#9AAABF" }}
          >
            Wawasan & pelaporan
          </p>
          <h1
            className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl"
            style={{ color: "#0F1C3F", fontFamily: "'Lexend Deca', sans-serif" }}
          >
            Laporan data
          </h1>
          <p className="mt-0.5 text-sm font-medium" style={{ color: "#7A8599" }}>
            Ringkasan enrollment, penyelesaian, dan distribusi per kursus — BNI Finance
            E-Learning.
          </p>
        </div>
        <div className="shrink-0">
          <ExportButton />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
        <DataCard
          label="Total enrollment"
          value={totalEnrollments}
          icon={Users}
          description="Seluruh pendaftaran karyawan ke kursus"
          trend="Agregat real-time dari basis data"
          color="blue"
        />
        <DataCard
          label="Tingkat penyelesaian"
          value={`${completionRate}%`}
          icon={CheckCircle}
          description="Selesai (lulus atau gagal) dari total enrollment"
          trend={totalEnrollments > 0 ? "Proporsi peserta yang sudah menyelesai" : "Belum ada data"}
          color="emerald"
        />
        <DataCard
          label="Tingkat kelulusan"
          value={`${passRate}%`}
          icon={BarChart3}
          description="Lulus dibanding yang sudah selesai (lulus + gagal)"
          trend={finishedEnrollments > 0 ? "Dari peserta yang sudah rampung" : "—"}
          color="amber"
        />
        <DataCard
          label="Kursus aktif"
          value={totalCourses}
          icon={BookOpen}
          description="Total kursus di katalog"
          color="indigo"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
        <div className="min-w-0 lg:col-span-2">
          <AnalyticsClient
            data={chartData}
            type="bar"
            title="Enrollment terbanyak per kursus (top 5)"
          />
        </div>
        <div className="min-w-0">
          <AnalyticsClient data={pieData} type="pie" title="Status pembelajaran" />
        </div>
      </div>
    </div>
  );
}
