import { db } from "@/lib/db";
import {
  Users,
  BookOpen,
  GraduationCap,
  CheckCircle,
  Clock,
  PlusCircle,
  FileBarChart,
  TrendingUp,
  ArrowUpRight,
  Layers,
} from "lucide-react";
import Link from "next/link";
import { AnalyticsClient } from "@/components/analytics/analytics-client";
import { Button } from "@/components/ui/button";

export default async function AdminDashboard() {
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
    db.enrollment.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
    db.enrollment.findMany({
      take: 7,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        course: { select: { title: true } },
      },
    }),
    db.enrollment.groupBy({
      by: ["courseId"],
      _count: { courseId: true },
      orderBy: { _count: { courseId: "desc" } },
      take: 5,
    }),
  ]);

  const completedCount =
    statusGroups.find((g) => g.status === "COMPLETED")?._count.status ?? 0;
  const failedCount =
    statusGroups.find((g) => g.status === "FAILED")?._count.status ?? 0;
  const inProgressCount =
    statusGroups.find((g) => g.status === "IN_PROGRESS")?._count.status ?? 0;

  const topCourseIds = coursePopularity.map((c) => c.courseId);
  const topCourses = await db.course.findMany({
    where: { id: { in: topCourseIds } },
    select: { id: true, title: true },
  });
  const courseTitleMap = Object.fromEntries(
    topCourses.map((c) => [c.id, c.title])
  );

  const completionStats = await db.enrollment.groupBy({
    by: ["courseId"],
    where: { courseId: { in: topCourseIds }, status: "COMPLETED" },
    _count: { status: true },
  });
  const completionMap = Object.fromEntries(
    completionStats.map((s) => [s.courseId, s._count.status])
  );

  const chartData = coursePopularity.map((c) => ({
    name: courseTitleMap[c.courseId] ?? "Unknown",
    total: c._count.courseId,
    completed: completionMap[c.courseId] ?? 0,
  }));

  const statusData = [
    { name: "Lulus", value: completedCount, fill: "#10B981" },
    { name: "Gagal", value: failedCount, fill: "#EF4444" },
    { name: "Berjalan", value: inProgressCount, fill: "#6366F1" },
  ].filter((d) => d.value > 0);

  const completionRate =
    totalEnrollments > 0
      ? Math.round(((completedCount + failedCount) / totalEnrollments) * 100)
      : 0;

  const statCards = [
    {
      label: "Total Kursus",
      value: coursesCount,
      icon: <BookOpen className="h-5 w-5" />,
      sub: "Katalog tersedia",
      iconBg: "#EEF2FF",
      iconColor: "#0F1C3F",
      accent: "#E8A020",
    },
    {
      label: "Karyawan",
      value: usersCount,
      icon: <Users className="h-5 w-5" />,
      sub: "Pengguna terdaftar",
      iconBg: "#F0FDF4",
      iconColor: "#10B981",
      accent: "#10B981",
    },
    {
      label: "Total Enrollment",
      value: totalEnrollments,
      icon: <GraduationCap className="h-5 w-5" />,
      sub: "Pendaftaran aktif",
      iconBg: "#FFF8E7",
      iconColor: "#E8A020",
      accent: "#E8A020",
    },
    {
      label: "Tingkat Selesai",
      value: `${completionRate}%`,
      icon: <CheckCircle className="h-5 w-5" />,
      sub: `${completedCount + failedCount} dari ${totalEnrollments}`,
      iconBg: "#F0F9FF",
      iconColor: "#0EA5E9",
      accent: "#0F1C3F",
    },
  ];

  const statusLabel: Record<string, { label: string; bg: string; color: string }> = {
    COMPLETED: { label: "Selesai", bg: "#F0FDF4", color: "#059669" },
    FAILED: { label: "Gagal", bg: "#FFF0F0", color: "#EF4444" },
    IN_PROGRESS: { label: "Berjalan", bg: "#EEF2FF", color: "#6366F1" },
    ENROLLED: { label: "Terdaftar", bg: "#FFF8E7", color: "#E8A020" },
  };

  return (
    <div className="w-full min-w-0 space-y-6 pb-4 md:space-y-8">
      {/* ── Dashboard Header ── */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between md:p-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div
              className="h-8 w-8 rounded-xl flex items-center justify-center bg-[#E8A020]/10 shadow-inner"
            >
              <Layers className="h-4 w-4 text-[#E8A020]" />
            </div>
            <span
              className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400"
            >
              Statistik Real-time
            </span>
          </div>
          <h1
            className="text-3xl font-black tracking-tight text-slate-900"
            style={{ fontFamily: "'Lexend Deca', sans-serif" }}
          >
            Ikhtisar Performa
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Pantau pertumbuhan kompetensi karyawan BNI Finance secara menyeluruh.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link href="/admin/analytics">
             <Button variant="outline" className="h-12 px-6 rounded-2xl font-black text-xs uppercase tracking-wider border-slate-200 text-slate-700 gap-2 hover:bg-slate-50 transition-all">
                <FileBarChart className="h-4 w-4" />
                Laporan
             </Button>
          </Link>
          <Link href="/admin/courses/new">
             <Button className="h-12 px-6 rounded-2xl font-black text-xs uppercase tracking-wider bg-[#0F1C3F] text-white shadow-xl shadow-[#0F1C3F]/20 gap-2 hover:bg-[#1A3060] transition-all">
                <PlusCircle className="h-4 w-4 text-[#E8A020]" />
                Kursus Baru
             </Button>
          </Link>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl p-5 md:p-6 relative overflow-hidden group transition-all hover:-translate-y-0.5 hover:shadow-md"
            style={{
              background: "white",
              border: "1px solid #E2E6F0",
              boxShadow: "0 1px 4px rgba(15,28,63,0.06)",
            }}
          >
            {/* Subtle accent glow */}
            <div
              className="absolute -top-6 -right-6 h-20 w-20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity blur-2xl pointer-events-none"
              style={{ background: card.accent }}
            />

            <div className="flex items-start justify-between mb-4">
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center"
                style={{ background: card.iconBg, color: card.iconColor }}
              >
                {card.icon}
              </div>
              <ArrowUpRight
                className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: card.accent }}
              />
            </div>

            <p
              className="text-2xl md:text-3xl font-black leading-none mb-1.5"
              style={{ color: "#0F1C3F" }}
            >
              {card.value}
            </p>
            <p
              className="text-[10px] font-black uppercase tracking-widest mb-0.5"
              style={{ color: "#9AAABF" }}
            >
              {card.label}
            </p>
            <p className="text-xs font-medium" style={{ color: "#B0BAD0" }}>
              {card.sub}
            </p>
          </div>
        ))}
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT: Charts */}
        <div className="lg:col-span-2 space-y-5">
          {/* Bar chart */}
          <div
            className="rounded-3xl overflow-hidden"
            style={{
              background: "white",
              border: "1px solid #E2E6F0",
              boxShadow: "0 1px 4px rgba(15,28,63,0.06)",
            }}
          >
            <div
              className="flex items-center justify-between px-6 pt-6 pb-4"
              style={{ borderBottom: "1px solid #F0F2F7" }}
            >
              <div>
                <p
                  className="text-[10px] font-black uppercase tracking-widest mb-0.5"
                  style={{ color: "#9AAABF" }}
                >
                  Popularitas
                </p>
                <h3
                  className="text-base font-black"
                  style={{ color: "#0F1C3F", fontFamily: "'Lexend Deca', sans-serif" }}
                >
                  Kursus Terpopuler
                </h3>
              </div>
              <div
                className="flex items-center gap-1.5 text-[10px] font-black px-3 py-1.5 rounded-xl"
                style={{ background: "#F0F2F7", color: "#7A8599" }}
              >
                <TrendingUp className="h-3.5 w-3.5" />
                Top 5
              </div>
            </div>
            <div className="p-6">
              <AnalyticsClient data={chartData} type="bar" title="" />
            </div>
          </div>

          {/* Recent Activity */}
          <div
            className="rounded-3xl overflow-hidden"
            style={{
              background: "white",
              border: "1px solid #E2E6F0",
              boxShadow: "0 1px 4px rgba(15,28,63,0.06)",
            }}
          >
            <div
              className="flex items-center justify-between px-6 pt-6 pb-4"
              style={{ borderBottom: "1px solid #F0F2F7" }}
            >
              <div>
                <p
                  className="text-[10px] font-black uppercase tracking-widest mb-0.5"
                  style={{ color: "#9AAABF" }}
                >
                  Live Feed
                </p>
                <h3
                  className="text-base font-black"
                  style={{ color: "#0F1C3F", fontFamily: "'Lexend Deca', sans-serif" }}
                >
                  Aktivitas Terbaru
                </h3>
              </div>
              <Link
                href="/admin/users"
                className="text-[11px] font-black uppercase tracking-wider transition-all hover:opacity-70 flex items-center gap-1"
                style={{ color: "#E8A020" }}
              >
                Lihat Semua
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="divide-y" style={{ borderColor: "#F0F2F7" }}>
              {recentEnrollments.length > 0 ? (
                recentEnrollments.map((e) => {
                  const st = statusLabel[e.status] ?? {
                    label: e.status,
                    bg: "#F0F2F7",
                    color: "#7A8599",
                  };
                  const initials = (e.user.name ?? "?")
                    .split(" ")
                    .slice(0, 2)
                    .map((w) => w[0])
                    .join("")
                    .toUpperCase();

                  return (
                    <div
                      key={e.id}
                      className="flex items-center gap-4 px-6 py-4 transition-all hover:bg-slate-50/60 group"
                    >
                      {/* Avatar */}
                      <div
                        className="h-10 w-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 transition-all group-hover:scale-105"
                        style={{ background: "#EEF2FF", color: "#6366F1" }}
                      >
                        {initials}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-black truncate leading-snug"
                          style={{ color: "#0F1C3F" }}
                        >
                          {e.user.name}
                        </p>
                        <p
                          className="text-xs font-medium truncate mt-0.5"
                          style={{ color: "#9AAABF" }}
                        >
                          Mendaftar{" "}
                          <span style={{ color: "#64748B", fontWeight: 700 }}>
                            {e.course.title}
                          </span>
                        </p>
                      </div>

                      {/* Right side */}
                      <div className="text-right shrink-0 space-y-1">
                        <span
                          className="inline-block text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg"
                          style={{ background: st.bg, color: st.color }}
                        >
                          {st.label}
                        </span>
                        <p
                          className="text-[10px] font-bold"
                          style={{ color: "#B0BAD0" }}
                        >
                          {new Intl.DateTimeFormat("id-ID", {
                            day: "numeric",
                            month: "short",
                          }).format(new Date(e.createdAt))}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="px-6 py-10 text-center">
                  <p className="text-sm font-bold" style={{ color: "#C5CEDF" }}>
                    Belum ada aktivitas pendaftaran.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Sidebar */}
        <div className="space-y-5">
          {/* Pie chart */}
          <div
            className="rounded-3xl overflow-hidden"
            style={{
              background: "white",
              border: "1px solid #E2E6F0",
              boxShadow: "0 1px 4px rgba(15,28,63,0.06)",
            }}
          >
            <div
              className="px-6 pt-6 pb-4"
              style={{ borderBottom: "1px solid #F0F2F7" }}
            >
              <p
                className="text-[10px] font-black uppercase tracking-widest mb-0.5"
                style={{ color: "#9AAABF" }}
              >
                Distribusi
              </p>
              <h3
                className="text-base font-black"
                style={{ color: "#0F1C3F", fontFamily: "'Lexend Deca', sans-serif" }}
              >
                Status Pembelajaran
              </h3>
            </div>
            <div className="p-6">
              <AnalyticsClient data={statusData} type="pie" title="" />
            </div>

            {/* Status breakdown list */}
            <div
              className="px-6 pb-6 space-y-2.5"
              style={{ borderTop: "1px solid #F0F2F7", paddingTop: "1rem" }}
            >
              {[
                { label: "Lulus", value: completedCount, color: "#10B981" },
                { label: "Gagal", value: failedCount, color: "#EF4444" },
                { label: "Berjalan", value: inProgressCount, color: "#6366F1" },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ background: s.color }}
                    />
                    <span
                      className="text-xs font-bold"
                      style={{ color: "#64748B" }}
                    >
                      {s.label}
                    </span>
                  </div>
                  <span className="text-xs font-black" style={{ color: "#0F1C3F" }}>
                    {s.value}
                    <span className="text-[10px] font-medium ml-1" style={{ color: "#B0BAD0" }}>
                      ({totalEnrollments > 0
                        ? Math.round((s.value / totalEnrollments) * 100)
                        : 0}%)
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div
            className="rounded-3xl overflow-hidden"
            style={{
              background: "white",
              border: "1px solid #E2E6F0",
              boxShadow: "0 1px 4px rgba(15,28,63,0.06)",
            }}
          >
            <div
              className="px-6 pt-6 pb-4"
              style={{ borderBottom: "1px solid #F0F2F7" }}
            >
              <p
                className="text-[10px] font-black uppercase tracking-widest mb-0.5"
                style={{ color: "#9AAABF" }}
              >
                Navigasi Cepat
              </p>
              <h3
                className="text-base font-black"
                style={{ color: "#0F1C3F", fontFamily: "'Lexend Deca', sans-serif" }}
              >
                Menu Admin
              </h3>
            </div>

            <div className="p-4 space-y-2">
              {[
                { href: "/admin/courses", icon: <BookOpen className="h-4 w-4" />, label: "Kelola Kursus", sub: `${coursesCount} kursus`, color: "#6366F1", bg: "#EEF2FF" },
                { href: "/admin/users", icon: <Users className="h-4 w-4" />, label: "Kelola Karyawan", sub: `${usersCount} pengguna`, color: "#10B981", bg: "#F0FDF4" },
                { href: "/admin/analytics", icon: <FileBarChart className="h-4 w-4" />, label: "Laporan Lengkap", sub: "Analytics & Export", color: "#E8A020", bg: "#FFF8E7" },
              ].map((item) => (
                <Link key={item.href} href={item.href} className="group block">
                  <div
                    className="flex items-center gap-3 p-3.5 rounded-2xl transition-all hover:brightness-97 hover:-translate-y-0.5 cursor-pointer"
                    style={{ background: "#F8FAFC", border: "1px solid #EEF0F6" }}
                  >
                    <div
                      className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: item.bg, color: item.color }}
                    >
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-black leading-none mb-0.5"
                        style={{ color: "#0F1C3F" }}
                      >
                        {item.label}
                      </p>
                      <p className="text-[10px] font-bold" style={{ color: "#B0BAD0" }}>
                        {item.sub}
                      </p>
                    </div>
                    <ArrowUpRight
                      className="h-4 w-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: item.color }}
                    />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Info Banner */}
          <div
            className="rounded-3xl p-6 relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #0F1C3F 0%, #1A2E5A 100%)" }}
          >
            <div
              className="absolute -top-10 -right-10 h-32 w-32 rounded-full opacity-15 pointer-events-none"
              style={{ background: "radial-gradient(circle, #E8A020, transparent 70%)" }}
            />
            <div className="relative z-10 space-y-3">
              <div
                className="h-9 w-9 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(232,160,32,0.15)", border: "1px solid rgba(232,160,32,0.3)" }}
              >
                <Clock className="h-4 w-4" style={{ color: "#E8A020" }} />
              </div>
              <p
                className="text-sm font-black text-white leading-snug"
                style={{ fontFamily: "'Lexend Deca', sans-serif" }}
              >
                Data diperbarui otomatis
              </p>
              <p className="text-xs font-medium leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                Dashboard ini mencerminkan kondisi real-time sistem e-learning BNI Finance.
              </p>
              <Link href="/admin/analytics">
                <button
                  className="w-full h-10 rounded-xl font-black text-xs uppercase tracking-wider transition-all hover:brightness-110 flex items-center justify-center gap-2 mt-2"
                  style={{
                    background: "linear-gradient(135deg, #E8A020, #F5C842)",
                    color: "#0F1C3F",
                  }}
                >
                  <FileBarChart className="h-3.5 w-3.5" />
                  Lihat Analytics Lengkap
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}