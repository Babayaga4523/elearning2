"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Clock,
  PlayCircle,
  CheckCircle2,
  Award,
  ChevronRight,
  Play,
  TrendingUp,
  Shield,
  Brain,
  BookOpen,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import ActivityChart from "@/app/(karyawan)/dashboard/_components/ActivityChart";
import Leaderboard from "@/app/(karyawan)/dashboard/_components/Leaderboard";
import { LearningProgressChart } from "@/app/(karyawan)/dashboard/_components/LearningProgressChart";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface DashboardClientProps {
  user: {
    name: string;
    email: string;
    department: string;
    avatar: string;
  };
  kpis: {
    activeCourses: number;
    modulesDone: number;
    testsPassed: number;
  };
  urgentAlerts: Array<{
    title: string;
    deadline: string;
    daysRemaining: number;
    courseId: string;
  }>;
  activeCourses: Array<any>;
  activityData: Array<{ day: string; count: number }>;
  learningProgressData: Array<any>;
  leaderboard: Array<{
    rank: number;
    name: string;
    department: string;
    score: number;
    isCurrentUser: boolean;
  }>;
  exploreCourses: Array<any>;
  resumeData: { title?: string; href: string } | null;
  avgScore: number;
  isAdmin: boolean;
}

/* ════════════════════════════════════════════════════════════════════════
   DESIGN TOKENS — BNI Finance World-Class Design System
═══════════════════════════════════════════════════════════════════════ */
const t = {
  navy: {
    900: "#0F1C3F",
    800: "#1A2D5A",
    700: "#243868",
  },
  gold: {
    600: "#C4861A",
    500: "#E8A020",
    400: "#F5C05A",
    100: "#FEF3DC",
  },
  surface: "#F8F9FB",
  surface2: "#F1F3F7",
  border: "#E4E7EC",
  text: {
    primary: "#101828",
    secondary: "#475467",
    tertiary: "#98A2B3",
  },
  success: {
    bg: "#ECFDF3",
    text: "#027A48",
    border: "#6CE9A6",
    icon: "#12B76A",
  },
  danger: {
    bg: "#FEF3F2",
    text: "#B42318",
    border: "#FDA29B",
    icon: "#F04438",
  },
  warning: {
    bg: "#FFFAEB",
    text: "#B54708",
    border: "#FEC84B",
    icon: "#F79009",
  },
  info: {
    bg: "#EFF8FF",
    text: "#175CD3",
    border: "#B2DDFF",
    icon: "#2E90FA",
  },
};

/* ─── Skeleton ───────────────────────────────────────────────────────── */
function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-gradient-to-r from-[#E4E7EC] via-[#F1F3F7] to-[#E4E7EC] bg-[length:200%_100%]",
        className
      )}
    />
  );
}

function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-[#E4E7EC] p-5 space-y-4">
      <div className="flex items-start justify-between">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-9 w-9 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

/* ─── Stat Card ───────────────────────────────────────────────────────── */
function KPICard({
  label,
  value,
  icon: Icon,
  variant = "default",
  trend,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  variant?: "default" | "navy" | "gold" | "success";
  trend?: { value: number; label: string };
}) {
  const configs = {
    default: {
      iconBg: "bg-[#F8F9FB]",
      iconColor: "text-[#475467]",
      accent: "border-t-[#E4E7EC]",
    },
    gold: {
      iconBg: "bg-[#FEF3DC]",
      iconColor: "text-[#C4861A]",
      accent: "border-t-[#E8A020]",
    },
    success: {
      iconBg: "bg-[#ECFDF3]",
      iconColor: "text-[#027A48]",
      accent: "border-t-[#6CE9A6]",
    },
    navy: {
      iconBg: "bg-[#1A2D5A]",
      iconColor: "text-[#E8A020]",
      accent: "border-t-[#0F1C3F]",
    },
  };
  const c = configs[variant];

  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-[#E4E7EC] p-5",
        "hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-default",
        "border-t-4",
        c.accent
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className={cn(
            "p-2.5 rounded-lg border border-[#97A4B8]/20",
            c.iconBg
          )}
        >
          <Icon size={18} className={c.iconColor} />
        </div>
        {trend && (
          <span
            className={cn(
              "text-xs font-semibold px-2 py-1 rounded-full",
              trend.value >= 0
                ? "text-[#027A48] bg-[#ECFDF3]"
                : "text-[#B42318] bg-[#FEF3F2]"
            )}
          >
            {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      <p className="text-3xl font-bold text-[#101828] font-['Lexend_Deca'] leading-none mb-1 tabular-nums">
        {value}
      </p>
      <p className="text-sm text-[#475467] font-['DM_Sans']">{label}</p>
      {trend && (
        <p className="text-xs text-[#98A2B3] mt-1 font-['DM_Sans']">
          vs {trend.label} lalu
        </p>
      )}
    </div>
  );
}

/* ─── Course Progress Card ─────────────────────────────────────────── */
function CourseProgressCard({
  course,
  index,
}: {
  course: any;
  index: number;
}) {
  const pct =
    course.totalModules > 0
      ? Math.round((course.completedModules / course.totalModules) * 100)
      : 0;

  const isAlmostDone = pct >= 75;
  const isStarted = pct > 0;

  return (
    <Link
      href={`/courses/${course.id}`}
      className="group block bg-white rounded-xl border border-[#E4E7EC] p-5 hover:border-[#C4861A] hover:shadow-md transition-all duration-200"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EFF8FF] border border-[#B2DDFF] text-xs font-semibold text-[#175CD3] font-['DM_Sans'] mb-2">
            <BookOpen size={11} />
            {course.category || "General"}
          </div>
          <h4 className="text-sm font-semibold text-[#101828] font-['DM_Sans'] leading-snug line-clamp-2 group-hover:text-[#C4861A] transition-colors">
            {course.title}
          </h4>
          <p className="text-xs text-[#475467] mt-1 font-['DM_Sans']">
            {course.completedModules} dari {course.totalModules} modul selesai
          </p>
        </div>

        {/* CTA button */}
        <div className="shrink-0">
          <div
            className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-150",
              isStarted
                ? "bg-[#E8A020] text-white group-hover:bg-[#C4861A] group-hover:scale-105"
                : "bg-[#0F1C3F] text-white group-hover:bg-[#1A2D5A]"
            )}
          >
            <Play size={14} className="ml-0.5" />
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-['DM_Sans']">
          <span className="text-[#475467]">{pct}% selesai</span>
          <span className="text-[#98A2B3]">
            {Math.max(5, (course.totalModules - course.completedModules) * 15)} menit lagi
          </span>
        </div>
        <div className="h-1.5 bg-[#F1F3F7] rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500 ease-out",
              isAlmostDone
                ? "bg-gradient-to-r from-[#12B76A] to-[#027A48]"
                : "bg-gradient-to-r from-[#E8A020] to-[#F5C05A]"
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Deadline */}
      {course.deadline && course.deadline !== "-" && (
        <div className="mt-3 flex items-center gap-1.5 text-[10px] text-[#98A2B3] font-['DM_Sans']">
          <Clock size={11} />
          <span>Deadline: {course.deadline}</span>
        </div>
      )}
    </Link>
  );
}

/* ─── Recommendation Card ──────────────────────────────────────────── */
const REC_ICONS = [TrendingUp, Shield, Brain];

function RecommendationCard({
  rec,
  index,
}: {
  rec: any;
  index: number;
}) {
  const Icon = REC_ICONS[index % REC_ICONS.length];

  return (
    <Link
      href={`/courses/${rec.id}`}
      className="group flex items-start gap-3 p-4 rounded-xl border border-[#E4E7EC] hover:border-[#E8A020] hover:shadow-sm transition-all duration-200 bg-white"
    >
      <div
        className={cn(
          "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-200",
          "bg-[#EFF8FF] text-[#0F1C3F] group-hover:bg-[#E8A020] group-hover:text-white"
        )}
      >
        <Icon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-[#101828] line-clamp-2 font-['DM_Sans'] group-hover:text-[#C4861A] transition-colors leading-snug mb-1">
          {rec.title}
        </h4>
        <p className="text-xs text-[#475467] font-['DM_Sans']">
          {rec.category || "General"} · {rec.modules || rec.enrollments || 0} modul
        </p>
      </div>
      <ArrowUpRight
        size={14}
        className="shrink-0 mt-0.5 text-[#98A2B3] group-hover:text-[#E8A020] transition-colors"
      />
    </Link>
  );
}

/* ─── Dashboard ─────────────────────────────────────────────────────── */
export default function DashboardClient({
  user,
  kpis,
  urgentAlerts,
  activeCourses,
  activityData,
  learningProgressData,
  leaderboard,
  exploreCourses,
  resumeData,
  avgScore,
}: DashboardClientProps) {
  const [greeting, setGreeting] = useState("Halo");
  const [_isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Selamat Pagi");
    else if (hour < 17) setGreeting("Selamat Siang");
    else setGreeting("Selamat Malam");
  }, []);

  /* Top-glowing gradient hero card */
  const getGlowStyle = () => ({
    background: `linear-gradient(135deg, ${t.navy[900]} 0%, ${t.navy[800]} 60%, #1e3a5f 100%)`,
  });

  return (
    <div
      className="min-h-screen bg-[#F8F9FB]"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* ═══ Hero Banner ═══════════════════════════════════════════════ */}
        <section
          className="rounded-2xl overflow-hidden relative shadow-lg"
          style={getGlowStyle()}
        >
          {/* Ambient orbs */}
          <div
            className="absolute -right-20 -top-20 w-72 h-72 rounded-full opacity-10 pointer-events-none"
            style={{
              background: `radial-gradient(circle, ${t.gold[500]} 0%, transparent 70%)`,
            }}
          />
          <div
            className="absolute -left-20 -bottom-20 w-60 h-60 rounded-full opacity-5 pointer-events-none"
            style={{
              background: `radial-gradient(circle, ${t.info.icon} 0%, transparent 70%)`,
            }}
          />

          <div className="relative z-10 px-8 py-8 md:px-10 md:py-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            {/* Greeting text */}
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[10px] font-semibold uppercase tracking-widest text-white/70 mb-2">
                <Sparkles size={10} />
                E-Learning Portal
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white font-['Lexend_Deca'] leading-tight tracking-tight">
                {greeting}, {user.name?.split(" ")[0]}
              </h1>
              <p className="text-sm text-white/60 font-['DM_Sans']">
                {user.department || "Karyawan BNI Finance"} · Lanjutkan pembelajaran Anda
              </p>

              {/* CTA row */}
              <div className="flex flex-wrap gap-3 pt-3">
                {resumeData ? (
                  <Link href={resumeData.href}>
                    <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#E8A020] hover:bg-[#C4861A] active:scale-[0.97] text-white text-sm font-semibold rounded-xl font-['DM_Sans'] transition-all duration-150 shadow-[0_4px_14px_rgba(232,160,32,0.35)]">
                      <Play size={15} />
                      Lanjutkan Belajar
                    </button>
                  </Link>
                ) : (
                  <Link href="/courses">
                    <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#E8A020] hover:bg-[#C4861A] active:scale-[0.97] text-white text-sm font-semibold rounded-xl font-['DM_Sans'] transition-all duration-150 shadow-[0_4px_14px_rgba(232,160,32,0.35)]">
                      <BookOpen size={15} />
                      Mulai Belajar
                    </button>
                  </Link>
                )}
                <Link href="/performance">
                  <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 active:scale-[0.97] border border-white/20 text-white text-sm font-semibold rounded-xl font-['DM_Sans'] transition-all duration-150">
                    <TrendingUp size={15} />
                    Lihat Performa
                  </button>
                </Link>
              </div>
            </div>

            {/* Avg score radial */}
            <div className="shrink-0 flex items-center gap-5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-6 py-4">
              <div className="relative w-18 h-18" style={{ width: 72, height: 72 }}>
                <svg className="w-full h-full -rotate-90" viewBox="0 0 72 72">
                  <circle
                    cx="36" cy="36" r="30"
                    fill="none"
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth="6"
                  />
                  <circle
                    cx="36" cy="36" r="30"
                    fill="none"
                    stroke={t.gold[500]}
                    strokeWidth="6"
                    strokeDasharray={`${avgScore} 100`}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold text-white font-['Lexend_Deca'] leading-none">
                    {avgScore}
                  </span>
                  <span className="text-[10px] text-white/60 font-['DM_Sans']">%</span>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-white/60 uppercase tracking-wider font-['DM_Sans']">
                  Avg Score
                </p>
                <p className="text-sm font-semibold text-white font-['DM_Sans']">
                  Post-Test
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ Urgent Alerts ═══════════════════════════════════════════ */}
        {urgentAlerts.length > 0 && (
          <section className="space-y-3">
            {urgentAlerts.map((alert, idx) => {
              const isExpired = alert.daysRemaining < 0;
              const isToday = alert.daysRemaining === 0;

              const style = isExpired
                ? {
                    bg: t.danger.bg,
                    border: t.danger.border,
                    iconBg: "bg-[#FEF3F2]",
                    iconColor: t.danger.icon,
                    badgeText: t.danger.text,
                    btn: `bg-[#B42318] text-white hover:bg-[#991B1B] border-transparent`,
                    label: "Deadline Terlewat",
                    dotColor: "bg-[#F04438]",
                    pulse: false,
                  }
                : isToday
                ? {
                    bg: t.warning.bg,
                    border: t.warning.border,
                    iconBg: "bg-[#FFFAEB]",
                    iconColor: t.warning.icon,
                    badgeText: t.warning.text,
                    btn: `bg-[#F79009] text-white hover:bg-[#DC6803] border-transparent`,
                    label: "Hari Ini",
                    dotColor: "bg-[#F79009]",
                    pulse: true,
                  }
                : {
                    bg: t.info.bg,
                    border: t.info.border,
                    iconBg: "bg-[#EFF8FF]",
                    iconColor: t.info.icon,
                    badgeText: t.info.text,
                    btn: `bg-[#2E90FA] text-white hover:bg-[#1570EF] border-transparent`,
                    label: `${alert.daysRemaining} hari lagi`,
                    dotColor: "bg-[#2E90FA]",
                    pulse: false,
                  };

              return (
                <div
                  key={idx}
                  className={cn(
                    "flex flex-col sm:flex-row sm:items-center gap-4",
                    "rounded-xl border px-4 py-3.5",
                    "transition-all duration-200",
                    style.bg,
                    style.border
                  )}
                  style={{ borderWidth: 1, borderLeftWidth: 4 }}
                >
                  {/* Alert content */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", style.iconBg)}>
                      <AlertTriangle size={16} style={{ color: style.iconColor }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-xs font-semibold uppercase tracking-wide font-['DM_Sans']"
                          style={{ color: style.badgeText }}
                        >
                          {style.label}
                        </span>
                        {style.pulse && (
                          <span className="relative flex h-2 w-2">
                            <span
                              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                              style={{ backgroundColor: style.dotColor }}
                            />
                            <span
                              className="relative inline-flex rounded-full h-2 w-2"
                              style={{ backgroundColor: style.dotColor }}
                            />
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-[#101828] font-['DM_Sans'] leading-tight mt-0.5">
                        {alert.title}
                      </p>
                    </div>
                  </div>

                  {/* Action */}
                  <Link href={`/courses/${alert.courseId}`} className="shrink-0">
                    <button
                      className={cn(
                        "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold font-['DM_Sans']",
                        "border transition-all duration-150 active:scale-[0.97]",
                        style.btn
                      )}
                    >
                      {isExpired ? "Lihat Detail" : isToday ? "Selesaikan Sekarang" : "Lanjutkan"}
                      <ChevronRight size={14} />
                    </button>
                  </Link>
                </div>
              );
            })}
          </section>
        )}

        {/* ═══ KPI Grid ════════════════════════════════════════════════ */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <KPICard
            label="Kursus Aktif"
            value={kpis.activeCourses}
            icon={PlayCircle}
            variant="gold"
          />
          <KPICard
            label="Modul Selesai"
            value={kpis.modulesDone}
            icon={CheckCircle2}
            variant="success"
          />
          <KPICard
            label="Ujian Lulus"
            value={kpis.testsPassed}
            icon={Award}
            variant="navy"
          />
        </section>

        {/* ═══ Charts Row ══════════════════════════════════════════════ */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Learning Progress */}
          <div className="bg-white rounded-xl border border-[#E4E7EC] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E4E7EC] flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-[#101828] font-['Lexend_Deca']">
                  Learning Progress
                </h3>
                <p className="text-xs text-[#98A2B3] font-['DM_Sans'] mt-0.5">
                  6 bulan terakhir
                </p>
              </div>
              <Link
                href="/performance"
                className="text-xs text-[#C4861A] font-semibold font-['DM_Sans'] hover:text-[#B5751A] flex items-center gap-1 transition-colors"
              >
                Detail
                <ChevronRight size={12} />
              </Link>
            </div>
            <div className="p-5 h-full min-h-[280px]">
              <LearningProgressChart data={learningProgressData} />
            </div>
          </div>

          {/* Activity Chart */}
          <div className="bg-white rounded-xl border border-[#E4E7EC] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E4E7EC] flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-[#101828] font-['Lexend_Deca']">
                  Aktivitas Mingguan
                </h3>
                <p className="text-xs text-[#98A2B3] font-['DM_Sans'] mt-0.5">
                  7 hari terakhir
                </p>
              </div>
            </div>
            <div className="p-5 h-full">
              <ActivityChart data={activityData} />
            </div>
          </div>
        </section>

        {/* ═══ Leaderboard ══════════════════════════════════════════════ */}
        <section className="bg-white rounded-xl border border-[#E4E7EC] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E4E7EC] flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-[#101828] font-['Lexend_Deca']">
                Leaderboard
              </h3>
              <p className="text-xs text-[#98A2B3] font-['DM_Sans'] mt-0.5">
                Peringkat pembelajaran karyawan
              </p>
            </div>
          </div>
          <div className="px-5 pb-5">
            <Leaderboard data={leaderboard} />
          </div>
        </section>

        {/* ═══ Active Courses ═══════════════════════════════════════════ */}
        {activeCourses.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-semibold text-[#101828] font-['Lexend_Deca']">
                  Pelajaran Aktif
                </h3>
                <p className="text-sm text-[#98A2B3] font-['DM_Sans']">
                  Kursus yang sedang Anda ikuti
                </p>
              </div>
              <Link
                href="/courses"
                className="text-sm text-[#C4861A] font-semibold font-['DM_Sans'] hover:text-[#B5751A] flex items-center gap-1 transition-colors"
              >
                Lihat Semua
                <ChevronRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {activeCourses.slice(0, 3).map((course, idx) => (
                <CourseProgressCard
                  key={course.id}
                  course={course}
                  index={idx}
                />
              ))}
            </div>
          </section>
        )}

        {/* ═══ Recommendations ══════════════════════════════════════════ */}
        {exploreCourses.length > 0 && (
          <section className="bg-white rounded-xl border border-[#E4E7EC] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E4E7EC] flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[#101828] font-['Lexend_Deca']">
                  Rekomendasi Untuk Anda
                </h3>
                <p className="text-sm text-[#98A2B3] font-['DM_Sans']">
                  Kursus yang mungkin Anda sukai
                </p>
              </div>
              <Link
                href="/courses"
                className="text-sm text-[#C4861A] font-semibold font-['DM_Sans'] hover:text-[#B5751A] flex items-center gap-1 transition-colors"
              >
                Jelajahi
                <ChevronRight size={14} />
              </Link>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {exploreCourses.slice(0, 4).map((rec, idx) => (
                  <RecommendationCard key={rec.id} rec={rec} index={idx} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ═══ Empty State ══════════════════════════════════════════════ */}
        {activeCourses.length === 0 && exploreCourses.length === 0 && (
          <div className="bg-white rounded-xl border border-[#E4E7EC] p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#EFF8FF] flex items-center justify-center mx-auto mb-4">
              <BookOpen size={28} className="text-[#98A2B3]" />
            </div>
            <h3 className="text-lg font-semibold text-[#101828] font-['Lexend_Deca'] mb-2">
              Belum Ada Kursus
            </h3>
            <p className="text-sm text-[#475467] font-['DM_Sans'] mb-6 max-w-xs mx-auto leading-relaxed">
              Mulai jelajahi katalog kursus dan enroll untuk memulai pembelajaran Anda.
            </p>
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#E8A020] hover:bg-[#C4861A] text-white text-sm font-semibold rounded-xl font-['DM_Sans'] transition-colors shadow-[0_4px_14px_rgba(232,160,32,0.3)]"
            >
              <BookOpen size={15} />
              Jelajahi Katalog
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
