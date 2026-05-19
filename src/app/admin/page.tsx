import { db } from "@/lib/db";
import {
  Users,
  BookOpen,
  GraduationCap,
  Trophy,
  Activity,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  CalendarDays,
  ChevronRight,
  BookText,
  UserCircle,
  FileText,
  BarChart3,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { AnalyticsClient } from "@/components/analytics/analytics-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageHeader } from "@/components/admin/ui/page-header";
import { startOfMonth, subMonths, format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { checkAndUpdateExpiredEnrollments } from "@/actions/enrollment-deadline";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

// ─── Stat Card Component ─────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  description: string;
  trend?: { value: number; label: string };
  color: "navy" | "emerald" | "amber" | "indigo" | "rose";
  delay?: number;
}

function StatCard({ label, value, icon: Icon, description, trend, color, delay = 0 }: StatCardProps) {
  const colorMap = {
    navy: { bg: "bg-[#0F1C3F]", accent: "text-[#E8A020]", ring: "ring-[#0F1C3F]/10", iconBg: "bg-[#0F1C3F]/8" },
    emerald: { bg: "bg-emerald-500", accent: "text-emerald-600", ring: "ring-emerald-500/10", iconBg: "bg-emerald-50" },
    amber: { bg: "bg-amber-500", accent: "text-amber-600", ring: "ring-amber-500/10", iconBg: "bg-amber-50" },
    indigo: { bg: "bg-indigo-500", accent: "text-indigo-600", ring: "ring-indigo-500/10", iconBg: "bg-indigo-50" },
    rose: { bg: "bg-rose-500", accent: "text-rose-600", ring: "ring-rose-500/10", iconBg: "bg-rose-50" },
  };
  const c = colorMap[color];

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm",
        "transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-slate-200/80",
        "animate-in fade-in slide-in-from-bottom-4"
      )}
      style={{ animationDelay: `${delay}ms`, animationFillMode: "backwards" }}
    >
      {/* Background accent line */}
      <div className={cn("absolute top-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-500", c.bg)} />

      {/* Icon */}
      <div className="flex items-start justify-between mb-4">
        <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-sm", c.iconBg)}>
          <Icon className={cn("h-5 w-5", c.accent)} />
        </div>
        {trend && (
          <div className={cn(
            "flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold",
            trend.value >= 0
              ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
              : "bg-rose-50 text-rose-600 border border-rose-100"
          )}>
            <TrendingUp className={cn("h-3 w-3", trend.value < 0 && "rotate-180")} />
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>

      {/* Value */}
      <div>
        <p className="text-3xl font-black text-[#0F1C3F] font-lexend tracking-tighter leading-none">
          {value}
        </p>
        <p className="mt-1.5 text-sm font-bold text-slate-500 tracking-tight">{label}</p>
        <p className="mt-1 text-xs text-slate-400 font-medium leading-relaxed">{description}</p>
      </div>

      {/* Bottom decoration */}
      <div className={cn("absolute bottom-0 right-0 h-20 w-20 rounded-tl-full opacity-5 group-hover:opacity-10 transition-opacity duration-500", c.bg)} />
    </div>
  );
}

// ─── Status Badge ────────────────────────────────────────────────────────────
interface StatusBadgeProps {
  status: string;
}
const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  COMPLETED: { label: "Selesai", color: "bg-emerald-50 text-emerald-700 border-emerald-100", dot: "bg-emerald-500" },
  FAILED: { label: "Gagal", color: "bg-rose-50 text-rose-700 border-rose-100", dot: "bg-rose-500" },
  IN_PROGRESS: { label: "Berjalan", color: "bg-amber-50 text-amber-700 border-amber-100", dot: "bg-amber-500" },
  PENDING: { label: "Menunggu", color: "bg-blue-50 text-blue-700 border-blue-100", dot: "bg-blue-500" },
  REJECTED: { label: "Ditolak", color: "bg-slate-100 text-slate-500 border-slate-200", dot: "bg-slate-400" },
};

function StatusBadge({ status }: StatusBadgeProps) {
  const c = statusConfig[status] ?? { label: status, color: "bg-slate-50 text-slate-500 border-slate-100", dot: "bg-slate-400" };
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold", c.color)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", c.dot)} />
      {c.label}
    </span>
  );
}

// ─── Quick Action Card ───────────────────────────────────────────────────────
interface QuickActionProps {
  href: string;
  icon: React.ElementType;
  label: string;
  description: string;
  color: "navy" | "emerald" | "amber" | "indigo";
}

function QuickActionCard({ href, icon: Icon, label, description, color }: QuickActionProps) {
  const colorMap = {
    navy: { iconBg: "bg-[#0F1C3F]/8", iconColor: "text-[#0F1C3F]", hoverBg: "hover:bg-[#0F1C3F]/5" },
    emerald: { iconBg: "bg-emerald-50", iconColor: "text-emerald-600", hoverBg: "hover:bg-emerald-50" },
    amber: { iconBg: "bg-amber-50", iconColor: "text-amber-600", hoverBg: "hover:bg-amber-50" },
    indigo: { iconBg: "bg-indigo-50", iconColor: "text-indigo-600", hoverBg: "hover:bg-indigo-50" },
  };
  const c = colorMap[color];

  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm",
        "transition-all duration-300 hover:shadow-lg hover:border-slate-200 hover:-translate-y-0.5",
        "hover:bg-slate-50/50"
      )}
    >
      <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 shadow-sm", c.iconBg, c.hoverBg)}>
        <Icon className={cn("h-5 w-5", c.iconColor)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-[#0F1C3F] font-lexend leading-tight">{label}</p>
        <p className="mt-0.5 text-[11px] text-slate-400 font-medium">{description}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-[#E8A020] group-hover:translate-x-1 transition-all duration-300 shrink-0" />
    </Link>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default async function AdminDashboard() {
  await checkAndUpdateExpiredEnrollments();
  const session = await auth();

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Selamat Pagi" : hour < 17 ? "Selamat Siang" : "Selamat Sore";
  const formattedDate = format(now, "EEEE, dd MMMM yyyy", { locale: localeId });

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
    db.enrollment.groupBy({ by: ["status"], _count: { status: true } }),
    db.enrollment.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true, image: true } },
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

  // Process trend data
  const enrollmentMonthly: Record<string, number> = {};
  const completionMonthly: Record<string, number> = {};
  const interactivePieRaw: Record<string, {
    COMPLETED: number;
    FAILED: number;
    IN_PROGRESS: number;
    PENDING: number;
    REJECTED: number;
    [key: string]: number;
  }> = {};

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
      }
    }
  });

  const lineEnrollmentData = Object.entries(enrollmentMonthly).map(([name]) => ({
    month: name.split(" ")[0],
    total: enrollmentMonthly[name],
  }));

  const interactivePieData = Object.entries(interactivePieRaw).reduce<Record<string, Array<{
    name: string;
    value: number;
    fill: string;
  }>>>((acc, [monthKey, stats]) => {
    const monthName = monthKey.split(" ")[0];
    acc[monthName] = [
      { name: "Selesai", value: stats.COMPLETED || 0, fill: "#0F1C3F" },
      { name: "Gagal", value: stats.FAILED || 0, fill: "#EF4444" },
      { name: "Berjalan", value: stats.IN_PROGRESS || 0, fill: "#E8A020" },
      { name: "Menunggu", value: stats.PENDING || 0, fill: "#3B82F6" },
      { name: "Ditolak", value: stats.REJECTED || 0, fill: "#94A3B8" },
    ];
    return acc;
  }, {});

  const completedCount = statusGroups.find((g) => g.status === "COMPLETED")?._count.status ?? 0;
  const failedCount = statusGroups.find((g) => g.status === "FAILED")?._count.status ?? 0;
  const rejectedCount = statusGroups.find((g) => g.status === "REJECTED")?._count.status ?? 0;
  const pendingCount = statusGroups.find((g) => g.status === "PENDING")?._count.status ?? 0;
  const inProgressCount = statusGroups.find((g) => g.status === "IN_PROGRESS")?._count.status ?? 0;

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
    name: (courseTitleMap[c.courseId] ?? "Unknown").split(" ").slice(0, 4).join(" "),
    total: c._count.courseId,
    completed: completionMap[c.courseId] ?? 0,
  }));

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-500">

      {/* ─── Hero Section ──────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0F1C3F] via-[#0F1C3F] to-[#162d5a] p-6 sm:p-8 shadow-xl">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-[#E8A020]/10 -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 right-8 h-24 w-24 rounded-full bg-[#E8A020]/5 translate-y-1/2" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8A020]/20 px-3 py-1 text-[11px] font-bold text-[#E8A020] border border-[#E8A020]/30">
                <span className="h-1.5 w-1.5 rounded-full bg-[#E8A020] animate-pulse" />
                {greeting}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white font-lexend tracking-tight leading-tight">
              Halo, {session?.user?.name?.split(" ")[0] ?? "Admin"}
            </h1>
            <p className="mt-2 text-slate-400 text-xs sm:text-sm font-medium">
              {formattedDate}
            </p>
            <p className="mt-1 text-slate-500 text-[11px] sm:text-xs font-medium">
              Overview performa sistem pembelajaran & analytics enrollment
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-3">
              {[
                { label: "Total Kursus", value: coursesCount },
                { label: "Total User", value: usersCount },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <p className="text-2xl font-black text-[#E8A020] font-lexend">{item.value}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</p>
                </div>
              ))}
              <div className="h-10 w-px bg-white/10" />
            </div>
            <Link href="/admin/courses/create">
              <Button className="h-11 px-6 rounded-xl bg-[#E8A020] hover:bg-[#d4951a] text-[#0F1C3F] font-bold text-xs shadow-lg shadow-[#E8A020]/25 gap-2 transition-all hover:scale-105 active:scale-95">
                <BookText className="h-4 w-4" />
                <span className="hidden sm:inline">Buat Kursus Baru</span>
                <span className="sm:hidden">Kursus Baru</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ─── Stats Grid ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Karyawan" value={usersCount.toLocaleString()} icon={Users} description="Pengguna aktif sistem" color="navy" delay={100} />
        <StatCard label="Total Kursus" value={coursesCount} icon={BookOpen} description="Materi pembelajaran" color="indigo" delay={200} />
        <StatCard label="Total Enrollment" value={totalEnrollments} icon={GraduationCap} description="Pendaftaran seluruh kursus" color="amber" delay={300} />
        <StatCard label="Completion Rate" value={`${completionRate}%`} icon={Trophy} description={`${completedCount} dari ${validEnrollments}`} color="emerald" delay={400} />
      </div>

      {/* ─── Charts Grid ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* Trend Chart */}
        <div className="lg:col-span-8">
          <Card className="rounded-2xl border border-slate-100 bg-white shadow-sm h-full overflow-hidden">
            <CardHeader className="pb-0 pt-6 px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-[#0F1C3F]/5 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-[#0F1C3F]" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-[#0F1C3F] font-lexend">Metrik Pertumbuhan</CardTitle>
                    <CardDescription className="text-[11px] font-medium text-slate-400">Analisis 6 bulan terakhir</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#0F1C3F]" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Enrollment</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#E8A020]" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kelulusan</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-5 pb-6 px-6">
              {/* Monthly mini stats */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                {Object.entries(enrollmentMonthly).slice(-3).map(([month]) => (
                  <div key={month} className="rounded-xl bg-slate-50/80 border border-slate-100 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{month.split(" ")[0]}</p>
                    <div className="flex items-end gap-2">
                      <span className="text-lg font-black text-[#0F1C3F] font-lexend">{enrollmentMonthly[month]}</span>
                      <span className="text-[10px] text-slate-400 mb-0.5">enrollment</span>
                      {completionMonthly[month] > 0 && (
                        <>
                          <span className="text-slate-200 mx-0.5 mb-0.5">·</span>
                          <span className="text-sm font-bold text-emerald-600">{completionMonthly[month]}</span>
                          <span className="text-[10px] text-emerald-500 mb-0.5">lulus</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <AnalyticsClient data={lineEnrollmentData} type="line" title="" height={220} />
            </CardContent>
          </Card>
        </div>

        {/* Status Distribution */}
        <div className="lg:col-span-4">
          <Card className="rounded-2xl border border-slate-100 bg-white shadow-sm h-full overflow-hidden">
            <CardHeader className="pt-6 pb-0 px-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#0F1C3F]/5 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-[#0F1C3F]" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-[#0F1C3F] font-lexend">Distribusi Status</CardTitle>
                  <CardDescription className="text-[11px] font-medium text-slate-400">Rasio enrollment</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 pb-6 px-6">
              {/* Status pills */}
              <div className="flex flex-wrap gap-2 mb-5">
                <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold bg-amber-50 text-amber-700 border-amber-100">
                  <span className="text-xs font-black font-lexend">{inProgressCount}</span> Berjalan
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 border-emerald-100">
                  <span className="text-xs font-black font-lexend">{completedCount}</span> Selesai
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold bg-blue-50 text-blue-700 border-blue-100">
                  <span className="text-xs font-black font-lexend">{pendingCount}</span> Menunggu
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold bg-rose-50 text-rose-700 border-rose-100">
                  <span className="text-xs font-black font-lexend">{failedCount}</span> Gagal
                </span>
              </div>
              <AnalyticsClient data={interactivePieData} type="interactive-pie" title="" height={200} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ─── Bottom Row ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* Popular Courses */}
        <div className="lg:col-span-5">
          <Card className="rounded-2xl border border-slate-100 bg-white shadow-sm h-full overflow-hidden">
            <CardHeader className="pt-6 pb-3 px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-[#0F1C3F]/5 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-[#0F1C3F]" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-[#0F1C3F] font-lexend">Kursus Terpopuler</CardTitle>
                    <CardDescription className="text-[11px] font-medium text-slate-400">Pendaftaran & penyelesaian</CardDescription>
                  </div>
                </div>
                <Link href="/admin/courses">
                  <Button variant="ghost" className="h-8 text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-[#E8A020] px-3 rounded-lg">
                    Lihat Semua
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-0 pb-5 px-6">
              {barChartData.length > 0 ? (
                <AnalyticsClient data={barChartData} type="bar" title="" height={220} />
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-3">
                    <BookOpen className="h-6 w-6 text-slate-300" />
                  </div>
                  <p className="text-sm font-bold text-slate-400">Belum ada data kursus</p>
                  <p className="text-xs text-slate-300 mt-1">Kursus akan muncul setelah enrollment dibuat</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Activity Feed */}
        <div className="lg:col-span-7">
          <Card className="rounded-2xl border border-slate-100 bg-white shadow-sm h-full overflow-hidden">
            <CardHeader className="pt-6 pb-0 px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-[#0F1C3F]/5 flex items-center justify-center">
                    <Activity className="h-5 w-5 text-[#0F1C3F]" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-[#0F1C3F] font-lexend">Aktivitas Terkini</CardTitle>
                    <CardDescription className="text-[11px] font-medium text-slate-400">Pendaftaran & progress terbaru</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Real-time</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 pb-5 px-6">
              <div className="space-y-1">
                {recentEnrollments.map((e) => (
                  <div key={e.id} className="flex items-center gap-3.5 rounded-xl p-3 hover:bg-slate-50/80 transition-colors cursor-pointer group">
                    <Avatar className="h-10 w-10 shrink-0 border-2 border-white shadow-sm ring-1 ring-slate-100">
                      <AvatarFallback className="bg-gradient-to-br from-[#0F1C3F] to-[#162d5a] text-white text-[11px] font-black uppercase">
                        {e.user.name?.charAt(0) ?? "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-[#0F1C3F] font-lexend leading-tight truncate">{e.user.name}</p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{e.course.title}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <StatusBadge status={e.status} />
                      <span className="text-[10px] text-slate-300">
                        {format(e.createdAt, "dd MMM, HH:mm", { locale: localeId })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ─── Quick Actions ──────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Menu Cepat</h2>
          <div className="flex-1 h-px bg-slate-100" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickActionCard href="/admin/courses" icon={BookText} label="Kelola Kursus" description="Atur materi & kurikulum" color="navy" />
          <QuickActionCard href="/admin/enrollments" icon={GraduationCap} label="Enrollments" description="Kelola pendaftaran" color="indigo" />
          <QuickActionCard href="/admin/users" icon={UserCircle} label="Kelola User" description="Direktori karyawan" color="emerald" />
          <QuickActionCard href="/admin/analytics" icon={BarChart3} label="Analytics" description="Lihat laporan data" color="amber" />
        </div>
      </div>

      {/* ─── Navigation Links ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { href: "/admin/courses", icon: BookOpen, label: "Materi & Kurikulum", sub: "Atur pustaka e-learning", color: "from-indigo-50 to-indigo-100/50", accent: "text-indigo-600", iconBg: "bg-indigo-100/60" },
          { href: "/admin/users", icon: Users, label: "Direktori Karyawan", sub: "Kelola data & role user", color: "from-emerald-50 to-emerald-100/50", accent: "text-emerald-600", iconBg: "bg-emerald-100/60" },
          { href: "/admin/analytics", icon: RefreshCw, label: "Update Analytics", sub: "Sinkronisasi data terakhir", color: "from-amber-50 to-amber-100/50", accent: "text-amber-600", iconBg: "bg-amber-100/60" },
        ].map((item) => (
          <Link key={item.href} href={item.href} className={cn(
            "group flex items-center gap-4 rounded-2xl border border-slate-100 bg-gradient-to-br p-5 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1",
            item.color
          )}>
            <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 shadow-sm", item.iconBg)}>
              <item.icon className={cn("h-5 w-5", item.accent)} />
            </div>
            <div>
              <p className="text-sm font-bold text-[#0F1C3F] font-lexend leading-tight">{item.label}</p>
              <p className="mt-0.5 text-[11px] text-slate-400 font-medium">{item.sub}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-[#E8A020] group-hover:translate-x-1 transition-all duration-300 ml-auto shrink-0" />
          </Link>
        ))}
      </div>

    </div>
  );
}