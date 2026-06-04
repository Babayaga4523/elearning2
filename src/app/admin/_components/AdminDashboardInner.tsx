"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  BookOpen,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  BarChart3,
  RefreshCw,
  GraduationCap,
  XCircle,
  PlayCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import Link from "next/link";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface StatsCardData {
  label: string;
  value: string | number;
  trend?: { value: number; period: string };
  description?: string;
  icon: React.ElementType;
  variant?: "default" | "navy" | "gold" | "success" | "warning";
}

interface ActivityItem {
  id: string;
  user: { name: string; email: string };
  action: string;
  target: string;
  status: "completed" | "in_progress" | "failed" | "pending";
  timestamp: string;
}

interface DashboardStats {
  totalUsers: number;
  activeCourses: number;
  totalCourses: number;
  totalEnrollments: number;
  completedEnrollments: number;
  inProgressEnrollments: number;
  failedEnrollments: number;
  pendingEnrollments: number;
  completionRate: number;
  avgScore: number;
  strugglingUsers: number;
  enrollmentTrend?: number;
  monthlyEnrollments: { month: string; enrollments: number; completed: number }[];
  statusDistribution: { label: string; value: number; color: string }[];
  recentActivity: ActivityItem[];
}

// ─────────────────────────────────────────────
// Skeleton Primitives
// ─────────────────────────────────────────────
function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={cn(
        "animate-pulse bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded",
        className
      )}
      style={style}
    />
  );
}

function StatsCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <Skeleton className="h-4 w-28 rounded" />
        <Skeleton className="h-10 w-10 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-20 rounded" />
      <Skeleton className="h-3 w-24 rounded" />
    </div>
  );
}

function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("bg-white rounded-xl border border-slate-200 p-5 space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-36 rounded" />
            <Skeleton className="h-3 w-24 rounded" />
          </div>
        </div>
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
      <div className="h-[200px] flex items-end justify-center gap-2 p-4">
        {[40, 65, 45, 80, 55, 70, 50].map((h, i) => (
          <Skeleton key={i} className="w-8 rounded-t-lg" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}

function ActivityItemSkeleton() {
  return (
    <div className="flex items-center gap-3 p-4 border-b border-slate-50 last:border-0">
      <Skeleton className="h-10 w-10 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-40 rounded" />
        <Skeleton className="h-3 w-32 rounded" />
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-2.5 w-20 rounded" />
      </div>
    </div>
  );
}

function DonutSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
      <Skeleton className="h-4 w-32 rounded" />
      <div className="flex items-center justify-center py-4">
        <Skeleton className="h-40 w-40 rounded-full" />
      </div>
      <div className="space-y-2 px-2">
        {[60, 40, 50, 30].map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-3 flex-1 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Badge Component
// ─────────────────────────────────────────────
type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral";

const badgeConfig: Record<BadgeVariant, { bg: string; text: string; dot: string }> = {
  success: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  warning: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  danger: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
  info: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  neutral: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" },
};

function StatusBadge({ variant = "neutral", children }: { variant?: BadgeVariant; children: React.ReactNode }) {
  const config = badgeConfig[variant];
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-transparent", config.bg, config.text)}>
      <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", config.dot)} />
      {children}
    </span>
  );
}

// ─────────────────────────────────────────────
// Stats Card
// ─────────────────────────────────────────────
function StatsCard({ label, value, trend, description, icon: Icon, variant = "default" }: StatsCardData) {
  const isNavy = variant === "navy";
  const isGold = variant === "gold";
  const isSuccess = variant === "success";
  const isWarning = variant === "warning";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "rounded-xl border p-5 space-y-3 cursor-default transition-all duration-200",
        isNavy ? "bg-[#0F1C3F] border-[#243868]" : isGold ? "bg-[#FEF3DC] border-[#F5C05A]" : isSuccess ? "bg-[#ECFDF3] border-[#6CE9A6]" : isWarning ? "bg-[#FFFAEB] border-[#FEC84B]" : "bg-white border-[#E4E7EC] hover:shadow-md"
      )}
    >
      <div className="flex items-start justify-between">
        <div className={cn("p-2.5 rounded-lg", isNavy ? "bg-[#1A2D5A]" : isGold ? "bg-[#F5C05A]/30" : isSuccess ? "bg-emerald-100" : isWarning ? "bg-amber-100" : "bg-[#F8F9FB]")}>
          <Icon size={18} className={cn(isNavy ? "text-[#E8A020]" : isGold ? "text-[#C4861A]" : isSuccess ? "text-emerald-600" : isWarning ? "text-amber-600" : "text-[#475467]")} />
        </div>
        {trend && (
          <span className={cn("text-xs font-semibold px-1.5 py-0.5 rounded-full", trend.value >= 0 ? "text-emerald-700 bg-emerald-50" : "text-red-700 bg-red-50")}>
            {trend.value >= 0 ? <ArrowUpRight size={10} className="inline mr-0.5" /> : <ArrowDownRight size={10} className="inline mr-0.5" />}
            {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      <div>
        <p className={cn("text-3xl font-bold leading-none", isNavy ? "text-white font-['Lexend_Deca']" : "text-slate-900 font-['Lexend_Deca']")}>{value}</p>
        <p className={cn("text-sm mt-1 font-['DM_Sans']", isNavy ? "text-slate-400" : "text-[#475467]")}>{label}</p>
      </div>
      {(trend || description) && (
        <p className={cn("text-xs font-['DM_Sans']", isNavy ? "text-slate-500" : "text-[#98A2B3]")}>{trend ? `vs ${trend.period} lalu` : description}</p>
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// Activity Feed
// ─────────────────────────────────────────────
function formatTimeAgo(timestamp: string): string {
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Baru saja";
  if (diffMins < 60) return `${diffMins} menit lalu`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} jam lalu`;
  return `${Math.floor(diffHours / 24)} hari lalu`;
}

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function getActivityStatusLabel(status: ActivityItem["status"]): string {
  switch (status) {
    case "completed": return "Selesai";
    case "in_progress": return "Dikerjakan";
    case "failed": return "Gagal";
    case "pending": return "Menunggu";
  }
}

function getActivityBadgeVariant(status: ActivityItem["status"]): BadgeVariant {
  switch (status) {
    case "completed": return "success";
    case "in_progress": return "info";
    case "failed": return "danger";
    case "pending": return "warning";
  }
}

function ActivityFeedItem({ item }: { item: ActivityItem }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3 p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors"
    >
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E8A020] to-[#C4861A] flex items-center justify-center shrink-0">
        <span className="text-xs font-bold text-white">{getInitials(item.user.name)}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 truncate leading-tight">{item.user.name}</p>
        <p className="text-xs text-slate-500 truncate leading-tight">
          {item.action} <span className="font-medium text-slate-700">{item.target}</span>
        </p>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <StatusBadge variant={getActivityBadgeVariant(item.status)}>{getActivityStatusLabel(item.status)}</StatusBadge>
        <span className="text-xs text-slate-400">{formatTimeAgo(item.timestamp)}</span>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// Quick Actions
// ─────────────────────────────────────────────
const quickActions = [
  {
    label: "Tambah Kursus",
    description: "Buat materi & modul baru",
    icon: BookOpen,
    href: "/admin/courses/create",
    color: "amber",
  },
  {
    label: "Import Karyawan",
    description: "Unggah massal data pengguna",
    icon: Users,
    href: "/admin/import/users",
    color: "blue",
  },
  {
    label: "Lihat Laporan",
    description: "Analisis & statistik belajar",
    icon: BarChart3,
    href: "/admin/analytics",
    color: "emerald",
  },
  {
    label: "Auto Enrollment",
    description: "Atur pendaftaran otomatis",
    icon: Calendar,
    href: "/admin/enrollments",
    color: "violet",
  },
];

interface QuickActionProps {
  label: string;
  description: string;
  icon: React.ElementType;
  href: string;
  color: string;
}

function QuickAction({ label, description, icon: Icon, href, color }: QuickActionProps) {
  const styles: Record<string, { card: string; icon: string; title: string; desc: string; arrow: string }> = {
    amber: {
      card: "bg-white hover:bg-[#FFFDF6] border-[#E4E7EC] hover:border-[#FFE2A3] hover:shadow-[0_4px_20px_-4px_rgba(232,160,32,0.08)]",
      icon: "bg-[#FEF3DC] text-[#C4861A]",
      title: "text-[#101828]",
      desc: "text-[#475467]",
      arrow: "text-[#C4861A] group-hover:translate-x-0.5",
    },
    blue: {
      card: "bg-white hover:bg-[#F5F9FF] border-[#E4E7EC] hover:border-[#B2DDFF] hover:shadow-[0_4px_20px_-4px_rgba(47,104,235,0.08)]",
      icon: "bg-[#EFF8FF] text-[#2F68EB]",
      title: "text-[#101828]",
      desc: "text-[#475467]",
      arrow: "text-[#2F68EB] group-hover:translate-x-0.5",
    },
    emerald: {
      card: "bg-white hover:bg-[#F6FEF9] border-[#E4E7EC] hover:border-[#A6F4C5] hover:shadow-[0_4px_20px_-4px_rgba(18,183,106,0.08)]",
      icon: "bg-[#ECFDF3] text-[#12B76A]",
      title: "text-[#101828]",
      desc: "text-[#475467]",
      arrow: "text-[#12B76A] group-hover:translate-x-0.5",
    },
    violet: {
      card: "bg-white hover:bg-[#FAFAFF] border-[#E4E7EC] hover:border-[#D6BBFB] hover:shadow-[0_4px_20px_-4px_rgba(158,119,237,0.08)]",
      icon: "bg-[#F9F5FF] text-[#9E77ED]",
      title: "text-[#101828]",
      desc: "text-[#475467]",
      arrow: "text-[#9E77ED] group-hover:translate-x-0.5",
    },
  };

  const s = styles[color] || styles.amber;

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3.5 p-3 rounded-xl border transition-all duration-200 group",
        s.card
      )}
    >
      <div className={cn("p-2.5 rounded-lg shrink-0 transition-transform duration-200 group-hover:scale-105", s.icon)}>
        <Icon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-xs font-semibold font-['DM_Sans'] transition-colors", s.title)}>
          {label}
        </p>
        <p className={cn("text-[10px] mt-0.5 text-slate-400 font-medium truncate font-['DM_Sans']", s.desc)}>
          {description}
        </p>
      </div>
      <div className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-slate-50 group-hover:bg-white border border-slate-100/50 transition-colors">
        <ChevronRight
          size={11}
          className={cn("transition-transform duration-150", s.arrow)}
        />
      </div>
    </Link>
  );
}

// ─────────────────────────────────────────────
// Section Header
// ─────────────────────────────────────────────
function SectionHeader({ title, description, action }: { title: string; description?: string; action?: { label: string; href: string; icon?: React.ElementType } }) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <h2 className="text-base font-semibold text-slate-900 font-['Lexend_Deca']">{title}</h2>
        {description && <p className="text-xs text-slate-500 mt-0.5 font-['DM_Sans']">{description}</p>}
      </div>
      {action && (
        <Link href={action.href} className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors font-['DM_Sans']">
          {action.label} <ChevronRight size={12} />
        </Link>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Recharts-based Charts (inline, no AreaChart needed)
// ─────────────────────────────────────────────
import {
  Bar,
  BarChart as RechartsBarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Pie,
  PieChart,
  Cell,
} from "recharts";

const NAVY = "#0F1C3F";
const GOLD = "#E8A020";

function EnrollmentBarChart({ data }: { data: { month: string; enrollments: number; completed: number }[] }) {
  const chartData = data.map((d) => ({
    name: d.month,
    Enrollment: d.enrollments,
    Selesai: d.completed,
  }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <RechartsBarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#64748b", fontWeight: 600 }} />
        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #e4e7ec",
            borderRadius: "8px",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            fontSize: "12px",
            fontFamily: "DM Sans",
          }}
        />
        <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }} />
        <Bar dataKey="Enrollment" fill={NAVY} radius={[3, 3, 0, 0]} maxBarSize={36} />
        <Bar dataKey="Selesai" fill={GOLD} radius={[3, 3, 0, 0]} maxBarSize={36} />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}

function StatusDonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) return <p className="text-sm text-slate-400 text-center py-8">Belum ada data</p>;
  return (
    <div className="flex flex-col items-center">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={3}
            stroke="white"
            strokeWidth={3}
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e4e7ec",
              borderRadius: "8px",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              fontSize: "12px",
              fontFamily: "DM Sans",
            }}
            formatter={(value: number) => value.toLocaleString()}
          />
        </PieChart>
      </ResponsiveContainer>
      {/* Custom legend */}
      <div className="mt-2 w-full grid grid-cols-2 gap-x-4 gap-y-2 px-2">
        {data.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
            <span className="text-xs text-slate-500 font-['DM_Sans'] truncate">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────
// Main Dashboard Component
// ─────────────────────────────────────────────
export function AdminDashboardInner() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/admin/dashboard", { cache: "no-store" });
        if (!res.ok) throw new Error("No data");
        const json = await res.json();
        if (json.success && json.data) {
          setStats(json.data);
        } else {
          throw new Error("Invalid response");
        }
      } catch {
        // API error - show empty state
        setStats({
          totalUsers: 0,
          activeCourses: 0,
          totalCourses: 0,
          totalEnrollments: 0,
          completedEnrollments: 0,
          inProgressEnrollments: 0,
          failedEnrollments: 0,
          pendingEnrollments: 0,
          completionRate: 0,
          avgScore: 0,
          strugglingUsers: 0,
          monthlyEnrollments: [],
          statusDistribution: [],
          recentActivity: [],
        });
      } finally {
        setIsLoading(false);
        setLastUpdated(new Date());
      }
    }
    fetchStats();
  }, []);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/dashboard", { cache: "no-store" });
      if (!res.ok) throw new Error("No data");
      const json = await res.json();
      if (json.success && json.data) {
        setStats(json.data);
        setLastUpdated(new Date());
      } else {
        throw new Error("Invalid response");
      }
    } catch {
      setStats({
        totalUsers: 0,
        activeCourses: 0,
        totalCourses: 0,
        totalEnrollments: 0,
        completedEnrollments: 0,
        inProgressEnrollments: 0,
        failedEnrollments: 0,
        pendingEnrollments: 0,
        completionRate: 0,
        avgScore: 0,
        strugglingUsers: 0,
        monthlyEnrollments: [],
        statusDistribution: [],
        recentActivity: [],
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !stats) {
    return <DashboardLoadingState />;
  }

  return (
    <div className="w-full min-w-0 space-y-6 lg:space-y-8">
      {/* ───── Page Header ───── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-['Lexend_Deca']">Dashboard Admin</h1>
          <p className="text-sm text-[#475467] mt-1 font-['DM_Sans']">Ringkasan performa sistem pembelajaran</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-[#98A2B3] hidden sm:block">
            Diperbarui {lastUpdated.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
          </span>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-[#E4E7EC] text-[#344054] hover:bg-[#F8F9FB] rounded-lg transition-colors font-['DM_Sans']"
          >
            <RefreshCw size={13} />
            Refresh
          </button>
        </div>
      </div>

      {/* ───── KPI Stats Row ───── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5">
        <StatsCard label="Total Karyawan" value={stats.totalUsers.toLocaleString("id-ID")} trend={undefined} description="Pengguna terdaftar" icon={Users} />
        <StatsCard label="Kursus Aktif" value={stats.activeCourses} trend={undefined} description={`dari ${stats.totalCourses} total`} icon={BookOpen} />
        <StatsCard label="Enrollment Aktif" value={stats.inProgressEnrollments.toLocaleString("id-ID")} trend={undefined} icon={PlayCircle} variant="gold" />
        <StatsCard label="Tingkat Penyelesaian" value={`${stats.completionRate}%`} trend={undefined} description={`${stats.completedEnrollments.toLocaleString("id-ID")} enrollment`} icon={GraduationCap} variant="success" />
      </div>

      {/* ───── Row 2: Enrollment Detail + Quick Actions ───── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatsCard label="Enrollment Selesai" value={stats.completedEnrollments.toLocaleString("id-ID")} icon={CheckCircle} variant="success" />
          <StatsCard label="Enrollment Gagal" value={stats.failedEnrollments.toLocaleString("id-ID")} icon={XCircle} />
          <StatsCard label="Menunggu Persetujuan" value={stats.pendingEnrollments.toLocaleString("id-ID")} icon={Clock} variant="warning" />
        </div>
        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-[#E4E7EC] p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#101828] mb-4 font-['DM_Sans']">Aksi Cepat</h3>
            <div className="flex flex-col gap-3">
              {quickActions.map((action) => (
                <QuickAction key={action.label} {...action} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ───── Row 3: Charts ───── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Enrollment Trend Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#E4E7EC] p-5">
          <SectionHeader title="Tren Enrollment Bulanan" description="Enrollment dan penyelesaian per bulan" action={{ label: "Detail", href: "/admin/analytics" }} />
          <EnrollmentBarChart data={stats.monthlyEnrollments} />
        </div>
        {/* Status Distribution */}
        <div className="bg-white rounded-xl border border-[#E4E7EC] p-5">
          <SectionHeader title="Distribusi Status" description="Proporsi setiap status" />
          <StatusDonutChart data={stats.statusDistribution} />
        </div>
      </div>

      {/* ───── Row 4: Activity Feed + Right Column ───── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#E4E7EC] overflow-hidden">
          <SectionHeader title="Aktivitas Terbaru" description="Aktivitas belajar terkini" action={{ label: "Semua", href: "/admin/users" }} />
          {stats.recentActivity.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {stats.recentActivity.slice(0, 6).map((item) => (
                <ActivityFeedItem key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <Clock size={20} className="text-slate-400" />
              </div>
              <p className="text-sm text-slate-500 font-['DM_Sans']">Belum ada aktivitas terbaru</p>
            </div>
          )}
        </div>

        {/* Right column stats */}
        <div className="space-y-5">
          {/* Avg Score */}
          <div className="bg-white rounded-xl border border-[#E4E7EC] p-5">
            <SectionHeader title="Rata-rata Nilai" description="Skor post-test terbaru" />
            <div className="flex items-end justify-between">
              <div>
                <p className="text-4xl font-bold text-slate-900 font-['Lexend_Deca'] leading-none">{stats.avgScore}</p>
                <p className="text-sm text-slate-500 mt-1 font-['DM_Sans']">dari 100</p>
              </div>
              <span className={cn("text-sm font-semibold px-3 py-1 rounded-full", stats.avgScore >= 70 ? "text-emerald-700 bg-emerald-50" : "text-amber-700 bg-amber-50")}>
                {stats.avgScore >= 70 ? "Lulus" : "Perlu Bimbingan"}
              </span>
            </div>
          </div>

          {/* Struggling Alert */}
          {stats.strugglingUsers > 0 && (
            <div className="rounded-xl border border-[#FEC84B] bg-[#FFFAEB] p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-100 shrink-0">
                  <AlertTriangle size={16} className="text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-amber-800 font-['DM_Sans']">{stats.strugglingUsers} Karyawan Memerlukan Perhatian</p>
                  <p className="text-xs text-amber-700 mt-0.5 font-['DM_Sans']">Progress di bawah threshold</p>
                  <Link href="/admin/analytics/progress" className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 mt-2 hover:underline">
                    Lihat detail <ChevronRight size={11} />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Dark hero card */}
          <div className="bg-[#0F1C3F] rounded-xl p-5 text-white">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-[#E8A020] shrink-0">
                <TrendingUp size={18} className="text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold font-['Lexend_Deca'] leading-none">{stats.totalEnrollments}</p>
                <p className="text-sm text-slate-400 mt-1 font-['DM_Sans']">Total Enrollment</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Loading State
// ─────────────────────────────────────────────
function DashboardLoadingState() {
  return (
    <div className="w-full min-w-0 space-y-6 lg:space-y-8 animate-pulse">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2"><Skeleton className="h-9 w-56 rounded-lg" /><Skeleton className="h-4 w-72 rounded-md" /></div>
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5">
        <StatsCardSkeleton /><StatsCardSkeleton /><StatsCardSkeleton /><StatsCardSkeleton />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <ChartSkeleton className="lg:col-span-2" />
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <Skeleton className="h-4 w-32 rounded" />
          <Skeleton className="h-40 w-40 rounded-full mx-auto" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <Skeleton className="h-4 w-40 rounded" />
          <ActivityItemSkeleton /><ActivityItemSkeleton /><ActivityItemSkeleton />
        </div>
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-10 w-16 rounded" />
          </div>
          <div className="bg-[#0F1C3F] rounded-xl p-5 h-28" />
        </div>
      </div>
    </div>
  );
}
