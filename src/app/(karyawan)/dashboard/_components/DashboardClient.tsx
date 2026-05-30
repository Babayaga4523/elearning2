"use client";

import { useState, useEffect } from "react";
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
  ArrowRight,
  Sparkles,
  Zap,
  Target,
  BookMarked,
  Compass,
} from "lucide-react";
import ActivityChart from "@/app/(karyawan)/dashboard/_components/ActivityChart";
import Leaderboard from "@/app/(karyawan)/dashboard/_components/Leaderboard";
import { LearningProgressChart } from "@/app/(karyawan)/dashboard/_components/LearningProgressChart";
import { cn } from "@/lib/utils";

interface DashboardClientProps {
  user: {
    name: string;
    email: string;
    department: string;
    avatar: string;
  };
  kpis: { activeCourses: number; modulesDone: number; testsPassed: number };
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

/* ─── KPI Stat Card ────────────────────────────────────────────── */
/* ─── KPI Stat Card ────────────────────────────────────────────── */
function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  description,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  accent: "gold" | "green" | "navy";
  description?: string;
}) {
  const styles = {
    gold: {
      bg: "bg-white hover:bg-gradient-to-br hover:from-white hover:to-[#FEF3DC]/10",
      icon: "text-[#C4861A]",
      iconBg: "bg-[#FEF3DC]/70",
      border: "border-l-4 border-l-[#E8A020] border-t border-r border-b border-[#E4E7EC]",
      text: "text-[#C4861A]",
    },
    green: {
      bg: "bg-white hover:bg-gradient-to-br hover:from-white hover:to-[#ECFDF3]/10",
      icon: "text-[#027A48]",
      iconBg: "bg-[#ECFDF3]/70",
      border: "border-l-4 border-l-[#12B76A] border-t border-r border-b border-[#E4E7EC]",
      text: "text-[#027A48]",
    },
    navy: {
      bg: "bg-white hover:bg-gradient-to-br hover:from-white hover:to-[#E8EDF7]/10",
      icon: "text-[#0F1C3F]",
      iconBg: "bg-[#E8EDF7]/70",
      border: "border-l-4 border-l-[#0F1C3F] border-t border-r border-b border-[#E4E7EC]",
      text: "text-[#0F1C3F]",
    },
  };
  const s = styles[accent];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl p-6",
        "shadow-sm hover:shadow-md hover:-translate-y-1 active:scale-[0.98]",
        "transition-all duration-300 cursor-default",
        s.bg,
        s.border
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1.5">
          <p className="text-xs font-bold text-[#64748B] font-['DM_Sans'] tracking-widest uppercase">
            {label}
          </p>
          <p className="text-3xl font-extrabold text-[#0F1C3F] font-['Lexend_Deca'] leading-none tabular-nums">
            {value}
          </p>
          {description && (
            <p className="text-[11px] font-medium text-[#94A3B8] font-['DM_Sans']">
              {description}
            </p>
          )}
        </div>

        <div
          className={cn(
            "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border border-[#E4E7EC]/40 shadow-sm",
            s.iconBg
          )}
        >
          <Icon size={20} className={s.icon} />
        </div>
      </div>
    </div>
  );
}

/* ─── Alert Banner ────────────────────────────────────────────── */
function AlertBanner({
  alert,
}: {
  alert: {
    title: string;
    deadline: string;
    daysRemaining: number;
    courseId: string;
  };
}) {
  const isExpired = alert.daysRemaining < 0;
  const isToday = alert.daysRemaining === 0;

  const style = isExpired
    ? {
        bg: "bg-white border-[#FDA29B]/80",
        border: "border-l-4 border-l-[#F04438]",
        accent: "#F04438",
        label: "Deadline Terlewat",
        text: "text-[#B42318] bg-[#FEF3F2]",
        btn: "bg-[#B42318] hover:bg-[#991B1B] text-white",
        icon: AlertTriangle,
      }
    : isToday
    ? {
        bg: "bg-white border-[#FEC84B]/80",
        border: "border-l-4 border-l-[#F79009]",
        accent: "#F79009",
        label: "Deadline Hari Ini",
        text: "text-[#B45309] bg-[#FFFAEB]",
        btn: "bg-[#F79009] hover:bg-[#DC6803] text-white",
        icon: Clock,
      }
    : {
        bg: "bg-white border-[#B2DDFF]/80",
        border: "border-l-4 border-l-[#2E90FA]",
        accent: "#2E90FA",
        label: `Deadline ${alert.daysRemaining} hari lagi`,
        text: "text-[#175CD3] bg-[#EFF8FF]",
        btn: "bg-[#2E90FA] hover:bg-[#1570EF] text-white",
        icon: Clock,
      };

  const Icon = style.icon;

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-4",
        "rounded-2xl border px-5 py-4 bg-white shadow-sm",
        "transition-all duration-200 hover:shadow-md hover:border-slate-300",
        style.bg,
        style.border
      )}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-[#E4E7EC]/40"
          style={{ backgroundColor: `${style.accent}12` }}
        >
          <Icon size={18} style={{ color: style.accent }} />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider font-['DM_Sans']", style.text)}
            >
              {style.label}
            </span>
            {isToday && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F79009] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F79009]" />
              </span>
            )}
          </div>
          <p className="text-sm font-bold text-[#0F1C3F] font-['DM_Sans'] truncate leading-tight">
            {alert.title}
          </p>
        </div>
      </div>

      <Link href={`/courses/${alert.courseId}`} className="shrink-0">
        <button
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold font-['DM_Sans'] uppercase tracking-wider",
            "transition-all duration-150 active:scale-[0.97]",
            "shadow-sm border border-transparent outline-none",
            style.btn
          )}
        >
          {isExpired ? "Detail" : isToday ? "Selesaikan" : "Lanjutkan"}
          <ChevronRight size={14} />
        </button>
      </Link>
    </div>
  );
}

/* ─── Course Progress Card ─────────────────────────────────────── */
/* ─── Course Progress Card ─────────────────────────────────────── */
function CourseCard({
  course,
}: {
  course: any;
  index: number;
}) {
  const pct =
    course.totalModules > 0
      ? Math.round((course.completedModules / course.totalModules) * 100)
      : 0;

  const isDone = pct >= 100;

  return (
    <Link
      href={`/courses/${course.id}`}
      className="group block rounded-2xl border border-[#E4E7EC] bg-white p-5 hover:border-[#E8A020]/50 hover:shadow-md active:scale-[0.98] transition-all duration-300"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#EFF8FF] border border-[#B2DDFF]/50 text-[10px] font-bold text-[#175CD3] font-['DM_Sans'] mb-2 uppercase tracking-wide">
            <BookOpen size={10} />
            {course.category || "General"}
          </span>
          <h4 className="text-sm font-bold text-[#0F1C3F] font-['DM_Sans'] leading-snug line-clamp-2 group-hover:text-[#C4861A] transition-colors duration-200">
            {course.title}
          </h4>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <p className="text-xs font-semibold text-[#64748B] font-['DM_Sans']">
              {course.completedModules} / {course.totalModules} modul
            </p>
            {course.deadline && course.deadline !== "-" && (
              <p className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-md px-1.5 py-0.5">
                ⏰ Deadline: {course.deadline}
              </p>
            )}
          </div>
        </div>

        {/* Status icon */}
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-[#E4E7EC]/40 transition-all duration-300 shadow-sm",
            isDone
              ? "bg-[#ECFDF3] text-[#027A48] group-hover:bg-[#027A48] group-hover:text-white"
              : "bg-[#FEF3DC] text-[#C4861A] group-hover:bg-[#E8A020] group-hover:text-white"
          )}
        >
          {isDone ? <CheckCircle2 size={16} /> : <Play size={14} className="ml-0.5 fill-current" />}
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-['DM_Sans']">
          <span className="font-bold text-[#0F1C3F]">{pct}% selesai</span>
          <span className="text-[#94A4B8] font-medium">
            {Math.max(5, (course.totalModules - course.completedModules) * 12)} menit lagi
          </span>
        </div>
        <div className="h-2 bg-[#F1F5F9] rounded-full overflow-hidden border border-[#E4E7EC]/10">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-700",
              isDone
                ? "bg-gradient-to-r from-[#12B76A] to-[#027A48]"
                : "bg-gradient-to-r from-[#E8A020] to-[#F5C05A]"
            )}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
      </div>
    </Link>
  );
}

/* ─── Recommendation Card ────────────────────────────────────── */
const RECONS = [TrendingUp, Shield, Brain];

function RecommendationCard({ rec, index }: { rec: any; index: number }) {
  const Icon = RECONS[index % RECONS.length];
  return (
    <Link
      href={`/courses/${rec.id}`}
      className="group flex items-center gap-4 p-4 rounded-2xl border border-[#E4E7EC] bg-white hover:bg-[#F8F9FB] hover:border-[#E8A020]/50 active:scale-[0.98] transition-all duration-300"
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-[#0F1C3F] group-hover:bg-[#E8A020] group-hover:text-white transition-all duration-300 bg-[#EFF8FF] border border-[#E4E7EC]/40"
      >
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-bold text-[#0F1C3F] font-['DM_Sans'] line-clamp-2 leading-snug group-hover:text-[#C4861A] transition-colors duration-200">
          {rec.title}
        </h4>
        <p className="text-xs font-semibold text-[#94A4B8] font-['DM_Sans'] mt-0.5">
          {rec.category || "General"}
        </p>
      </div>
      <ArrowRight
        size={16}
        className="shrink-0 text-[#CBD2E0] group-hover:text-[#E8A020] transition-colors duration-200"
      />
    </Link>
  );
}

/* ─── Section wrapper with header ─────────────────────────────── */
function Section({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("", className)}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-[#0F1C3F] font-['Lexend_Deca']">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm text-[#94A4B8] font-['DM_Sans'] mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

/* ─── Dashboard ─────────────────────────────────────────────── */
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

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Selamat Pagi");
    else if (hour < 17) setGreeting("Selamat Siang");
    else setGreeting("Selamat Sore");
  }, []);

  const firstName = user.name?.split(" ")[0] || "Karyawan";

  return (
    <div className="min-h-screen bg-[#FAFBFD]">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* ── Greeting Hero ──────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F1C3F] via-[#12224A] to-[#1A2D5A] p-8 lg:p-10 border border-[#1A2D5A] shadow-lg shadow-[#0F1C3F]/10">
          {/* Glowing orbs */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute right-[-10%] top-[-20%] w-[450px] h-[450px] rounded-full bg-[#E8A020] blur-[150px] mix-blend-screen" />
            <div className="absolute left-[30%] bottom-[-30%] w-[350px] h-[350px] rounded-full bg-[#2E90FA] blur-[120px] mix-blend-screen animate-pulse" />
          </div>
          {/* Subtle Grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-overlay"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            {/* Text & Primary Actions */}
            <div className="space-y-3.5 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-[9px] font-extrabold uppercase tracking-widest text-[#E8A020]">
                <Sparkles size={10} className="animate-spin-slow" />
                BNI Finance E-Learning Portal
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white font-['Lexend_Deca'] leading-tight tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/90">
                {greeting}, {firstName}
              </h1>
              <p className="text-sm font-medium text-white/60 font-['DM_Sans'] leading-relaxed">
                Divisi: <span className="text-[#E8A020] font-bold">{user.department || "BNI Finance"}</span> ·{" "}
                {resumeData ? "Lanjutkan perjalanan belajar Anda hari ini." : "Silakan jelajahi katalog untuk memulai."}
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-3.5 pt-2">
                {resumeData ? (
                  <Link href={resumeData.href}>
                    <button className="inline-flex items-center gap-2 px-5 py-3 bg-[#E8A020] hover:bg-[#C4861A] active:scale-[0.97] text-white text-xs font-bold uppercase tracking-wider rounded-xl font-['DM_Sans'] shadow-lg shadow-[#E8A020]/25 transition-all duration-150 border border-transparent outline-none">
                      <Play size={12} className="fill-current" />
                      Lanjutkan Belajar
                    </button>
                  </Link>
                ) : (
                  <Link href="/courses">
                    <button className="inline-flex items-center gap-2 px-5 py-3 bg-[#E8A020] hover:bg-[#C4861A] active:scale-[0.97] text-white text-xs font-bold uppercase tracking-wider rounded-xl font-['DM_Sans'] shadow-lg shadow-[#E8A020]/25 transition-all duration-150 border border-transparent outline-none">
                      <BookOpen size={12} />
                      Mulai Belajar
                    </button>
                  </Link>
                )}
                <Link href="/performance">
                  <button className="inline-flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/15 active:scale-[0.97] border border-white/20 hover:border-white/30 text-white text-xs font-bold uppercase tracking-wider rounded-xl font-['DM_Sans'] transition-all duration-150 outline-none">
                    <TrendingUp size={12} />
                    Lihat Performa
                  </button>
                </Link>
              </div>
            </div>

            {/* Avg Score Glass Radial */}
            <div className="flex items-center gap-4 shrink-0 bg-white/[0.07] backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-4 shadow-xl shadow-black/10">
              <div className="relative" style={{ width: 72, height: 72 }}>
                <svg className="w-full h-full -rotate-90" viewBox="0 0 72 72">
                  <circle cx="36" cy="36" r="28" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5.5" />
                  <circle
                    cx="36" cy="36" r="28"
                    fill="none"
                    stroke="#E8A020"
                    strokeWidth="5.5"
                    strokeDasharray={`${(avgScore / 100) * 175.93} 175.93`}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-extrabold text-white font-['Lexend_Deca'] leading-none tracking-tight">{avgScore}</span>
                  <span className="text-[9px] font-bold text-[#E8A020] font-['DM_Sans'] mt-0.5">%</span>
                </div>
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] font-bold text-[#E8A020] uppercase tracking-widest font-['DM_Sans']">
                  Avg Post-Test
                </p>
                <p className="text-sm font-extrabold text-white font-['DM_Sans'] tracking-tight">Performa Anda</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Alerts ────────────────────────────────────────────────── */}
        {urgentAlerts.length > 0 && (
          <section className="space-y-3">
            {urgentAlerts.map((alert, i) => (
              <AlertBanner key={i} alert={alert} />
            ))}
          </section>
        )}

        {/* ── KPI Row ──────────────────────────────────────────────── */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Kursus Aktif"
            value={kpis.activeCourses}
            icon={BookMarked}
            accent="gold"
            description="Sedang berlangsung"
          />
          <StatCard
            label="Modul Selesai"
            value={kpis.modulesDone}
            icon={CheckCircle2}
            accent="green"
            description="Total modul yang diselesaikan"
          />
          <StatCard
            label="Ujian Lulus"
            value={kpis.testsPassed}
            icon={Award}
            accent="navy"
            description="Post-test dengan skor lulus"
          />
        </section>

        {/* ── Charts Row ─────────────────────────────────────────── */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Learning Progress */}
          <div className="bg-white rounded-2xl border border-[#E4E7EC]/60 shadow-sm overflow-hidden">
            <div className="px-5 pt-5 pb-0 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#0F1C3F] font-['Lexend_Deca']">
                  Learning Progress
                </h3>
                <p className="text-xs text-[#94A4B8] font-['DM_Sans'] mt-0.5">
                  6 bulan terakhir
                </p>
              </div>
              <Link
                href="/performance"
                className="inline-flex items-center gap-1 text-xs text-[#C4861A] font-semibold font-['DM_Sans'] hover:text-[#B5751A] transition-colors"
              >
                Detail
                <ArrowRight size={12} />
              </Link>
            </div>
            <div className="p-5 h-[260px]">
              <LearningProgressChart data={learningProgressData} />
            </div>
          </div>

          {/* Activity Chart */}
          <div className="bg-white rounded-2xl border border-[#E4E7EC]/60 shadow-sm overflow-hidden">
            <div className="px-5 pt-5 pb-0">
              <h3 className="text-sm font-bold text-[#0F1C3F] font-['Lexend_Deca']">
                Aktivitas Mingguan
              </h3>
              <p className="text-xs text-[#94A4B8] font-['DM_Sans'] mt-0.5">
                7 hari terakhir
              </p>
            </div>
            <div className="p-5 h-[260px]">
              <ActivityChart data={activityData} />
            </div>
          </div>
        </section>

        {/* ── Leaderboard + Active Courses ───────────────────────── */}
        {activeCourses.length > 0 && (
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Courses */}
            <div className="bg-white rounded-2xl border border-[#E4E7EC]/60 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-[#F1F5F9] flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#0F1C3F] font-['Lexend_Deca']">
                    Pelajaran Aktif
                  </h3>
                  <p className="text-xs text-[#94A4B8] font-['DM_Sans'] mt-0.5">
                    Sedang Anda ikuti
                  </p>
                </div>
                <Link
                  href="/courses"
                  className="inline-flex items-center gap-1 text-xs text-[#C4861A] font-semibold font-['DM_Sans'] hover:text-[#B5751A] transition-colors"
                >
                  Semua
                  <ArrowRight size={12} />
                </Link>
              </div>
              <div className="p-4 space-y-3">
                {activeCourses.slice(0, 3).map((c) => (
                  <CourseCard key={c.id} course={c} index={0} />
                ))}
              </div>
            </div>

            {/* Leaderboard */}
            <div className="bg-white rounded-2xl border border-[#E4E7EC]/60 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-[#F1F5F9]">
                <h3 className="text-sm font-bold text-[#0F1C3F] font-['Lexend_Deca']">
                  Leaderboard
                </h3>
                <p className="text-xs text-[#94A4B8] font-['DM_Sans'] mt-0.5">
                  Peringkat pembelajaran Anda
                </p>
              </div>
              <div className="p-4">
                <Leaderboard data={leaderboard} />
              </div>
            </div>
          </section>
        )}

        {/* ── Recommendations ────────────────────────────────────── */}
        {exploreCourses.length > 0 && (
          <section className="bg-white rounded-2xl border border-[#E4E7EC]/60 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[#F1F5F9] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#0F1C3F] font-['Lexend_Deca']">
                  Rekomendasi Kursus
                </h3>
                <p className="text-xs text-[#94A4B8] font-['DM_Sans'] mt-0.5">
                  Berdasarkan kategori yang Anda minati
                </p>
              </div>
              <Link
                href="/courses"
                className="inline-flex items-center gap-1 text-xs text-[#C4861A] font-semibold font-['DM_Sans'] hover:text-[#B5751A] transition-colors"
              >
                Lihat Semua
                <ArrowRight size={12} />
              </Link>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {exploreCourses.slice(0, 4).map((rec, i) => (
                  <RecommendationCard key={rec.id} rec={rec} index={i} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Empty State ─────────────────────────────────────────── */}
        {activeCourses.length === 0 && exploreCourses.length === 0 && (
          <div className="bg-white rounded-2xl border border-[#E4E7EC]/60 p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#EFF8FF] flex items-center justify-center mx-auto mb-5">
              <BookOpen size={30} className="text-[#94A4B8]" />
            </div>
            <h3 className="text-xl font-bold text-[#0F1C3F] font-['Lexend_Deca'] mb-2">
              Belum Ada Kursus Aktif
            </h3>
            <p className="text-sm text-[#64748B] font-['DM_Sans'] mb-6 max-w-sm mx-auto leading-relaxed">
              Mulai jelajahi katalog kursus dan enroll untuk memulai pembelajaran Anda.
            </p>
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#E8A020] hover:bg-[#C4861A] text-white text-sm font-semibold rounded-xl font-['DM_Sans'] shadow-lg shadow-[#E8A020]/20 transition-all"
            >
              <Compass size={16} />
              Jelajahi Katalog
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
