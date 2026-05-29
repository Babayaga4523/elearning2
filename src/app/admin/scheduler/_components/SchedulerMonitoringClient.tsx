"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw,
  Play,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────
// UI Primitives
// ─────────────────────────────────────────────
function CustomSkeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
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

interface StatsCardData {
  label: string;
  value: string | number;
  trend?: { value: number; period: string };
  description?: string;
  icon: React.ElementType;
  variant?: "default" | "navy" | "gold" | "success" | "warning";
}

function StatsCard({ label, value, trend, description, icon: Icon, variant = "default" }: StatsCardData) {
  const isNavy = variant === "navy";
  const isGold = variant === "gold";
  const isSuccess = variant === "success";
  const isWarning = variant === "warning";

  return (
    <div
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
    </div>
  );
}

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <h2 className="text-base font-semibold text-slate-900 font-['Lexend_Deca']">{title}</h2>
        {description && <p className="text-xs text-slate-500 mt-0.5 font-['DM_Sans']">{description}</p>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Data Interfaces
// ─────────────────────────────────────────────
interface SchedulerLog {
  id: string;
  jobName: string;
  status: string;
  message: string | null;
  duration: number | null;
  failedRecipients: any;
  metadata: any;
  createdAt: string;
}

interface JobStats {
  jobName: string;
  totalRuns: number;
  successRate: number;
  avgDuration: number;
  lastRun: string | null;
  lastStatus: string | null;
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export function SchedulerMonitoringClient() {
  const [logs, setLogs] = useState<SchedulerLog[]>([]);
  const [stats, setStats] = useState<JobStats[]>([]);
  const [retryQueue, setRetryQueue] = useState<SchedulerLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [logsRes, statsRes, retryRes] = await Promise.all([
        fetch("/api/admin/scheduler/logs"),
        fetch("/api/admin/scheduler/stats"),
        fetch("/api/admin/scheduler/retry-queue"),
      ]);

      if (logsRes.ok) setLogs(await logsRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
      if (retryRes.ok) setRetryQueue(await retryRes.json());
    } catch (error) {
      console.error("Failed to fetch scheduler data:", error);
      toast.error("Gagal memuat data scheduler");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const triggerJob = async (jobName: string) => {
    setTriggering(jobName);
    try {
      const res = await fetch(`/api/admin/scheduler/trigger`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobName }),
      });

      if (res.ok) {
        toast.success(`Job ${jobName} berhasil di-trigger`);
        setTimeout(fetchData, 2000); // Refresh after 2s
      } else {
        const data = await res.json();
        toast.error(data.error || "Gagal trigger job");
      }
    } catch (error) {
      toast.error("Gagal trigger job");
    } finally {
      setTriggering(null);
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "SUCCESS":
        return <StatusBadge variant="success">Success</StatusBadge>;
      case "FAILED":
        return <StatusBadge variant="danger">Failed</StatusBadge>;
      case "PARTIAL_ERROR":
      case "PARTIAL_FAILURE":
        return <StatusBadge variant="warning">Partial</StatusBadge>;
      case "PENDING":
        return <StatusBadge variant="neutral">Pending</StatusBadge>;
      default:
        return <StatusBadge variant="neutral">{status || "Unknown"}</StatusBadge>;
    }
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return "—";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("id-ID", {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

  if (loading) {
    return (
      <div className="w-full min-w-0 space-y-6 lg:space-y-8 animate-pulse">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2"><CustomSkeleton className="h-9 w-56 rounded-lg" /><CustomSkeleton className="h-4 w-72 rounded-md" /></div>
          <CustomSkeleton className="h-9 w-24 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
              <div className="flex items-start justify-between">
                <CustomSkeleton className="h-4 w-28 rounded" />
                <CustomSkeleton className="h-10 w-10 rounded-lg" />
              </div>
              <CustomSkeleton className="h-8 w-20 rounded" />
              <CustomSkeleton className="h-3 w-24 rounded" />
            </div>
          ))}
        </div>
        <CustomSkeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  const successRate = stats.length > 0
    ? (stats.reduce((acc, s) => acc + s.successRate, 0) / stats.length).toFixed(1)
    : "0";

  return (
    <div className="w-full min-w-0 space-y-6 lg:space-y-8">
      {/* ───── Page Header ───── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-['Lexend_Deca']">Scheduler Monitoring</h1>
          <p className="text-sm text-[#475467] mt-1 font-['DM_Sans']">Monitor dan kelola scheduler jobs</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-[#E4E7EC] text-[#344054] bg-white hover:bg-[#F8F9FB] rounded-lg transition-colors font-['DM_Sans']"
          >
            <RefreshCw size={13} />
            Refresh
          </button>
        </div>
      </div>

      {/* ───── KPI Stats Row ───── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5">
        <StatsCard 
          label="Total Jobs" 
          value={stats.length} 
          description="Active scheduler jobs" 
          icon={Activity} 
        />
        <StatsCard 
          label="Success Rate" 
          value={`${successRate}%`} 
          description="Average across all jobs" 
          icon={TrendingUp} 
          variant="success" 
        />
        <StatsCard 
          label="Retry Queue" 
          value={retryQueue.length} 
          description="Pending email retries" 
          icon={Clock} 
          variant="warning" 
        />
        <StatsCard 
          label="Recent Runs" 
          value={logs.length} 
          description="Last 50 executions" 
          icon={CheckCircle2} 
          variant="navy" 
        />
      </div>

      {/* ───── Data Tabs ───── */}
      <Tabs defaultValue="logs" className="space-y-6">
        <TabsList className="bg-[#F8F9FB] p-1 border border-[#E4E7EC] rounded-xl h-auto">
          <TabsTrigger value="logs" className="data-[state=active]:bg-white data-[state=active]:text-[#101828] data-[state=active]:shadow-sm text-[#475467] font-['DM_Sans'] text-sm rounded-lg px-4 py-2">Recent Logs</TabsTrigger>
          <TabsTrigger value="stats" className="data-[state=active]:bg-white data-[state=active]:text-[#101828] data-[state=active]:shadow-sm text-[#475467] font-['DM_Sans'] text-sm rounded-lg px-4 py-2">Job Statistics</TabsTrigger>
          <TabsTrigger value="retry" className="data-[state=active]:bg-white data-[state=active]:text-[#101828] data-[state=active]:shadow-sm text-[#475467] font-['DM_Sans'] text-sm rounded-lg px-4 py-2">Retry Queue</TabsTrigger>
          <TabsTrigger value="manual" className="data-[state=active]:bg-white data-[state=active]:text-[#101828] data-[state=active]:shadow-sm text-[#475467] font-['DM_Sans'] text-sm rounded-lg px-4 py-2">Manual Trigger</TabsTrigger>
        </TabsList>

        {/* Recent Logs Tab */}
        <TabsContent value="logs" className="outline-none">
          <div className="bg-white rounded-xl border border-[#E4E7EC] overflow-hidden">
            <div className="p-5 border-b border-[#E4E7EC] bg-white">
              <SectionHeader title="Recent Executions" description="Last 50 scheduler job executions" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm font-['DM_Sans']">
                <thead className="bg-[#F8F9FB] border-b border-[#E4E7EC] text-xs font-semibold text-[#475467] uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-4">Job Name</th>
                    <th className="px-5 py-4 text-center">Status</th>
                    <th className="px-5 py-4 text-center">Duration</th>
                    <th className="px-5 py-4 text-left">Message</th>
                    <th className="px-5 py-4 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center text-[#98A2B3]">
                        Belum ada log scheduler
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-4 font-medium text-[#101828]">{log.jobName}</td>
                        <td className="px-5 py-4 text-center">{getStatusBadge(log.status)}</td>
                        <td className="px-5 py-4 text-center text-[#475467]">{formatDuration(log.duration)}</td>
                        <td className="px-5 py-4">
                          <p className="text-[#475467]">{log.message || "-"}</p>
                          {log.failedRecipients && Array.isArray(log.failedRecipients) && log.failedRecipients.length > 0 && (
                            <p className="text-xs text-red-500 mt-1">Failed: {log.failedRecipients.join(", ")}</p>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right text-[#475467]">{formatDate(log.createdAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* Job Statistics Tab */}
        <TabsContent value="stats" className="outline-none">
          <div className="bg-white rounded-xl border border-[#E4E7EC] overflow-hidden">
            <div className="p-5 border-b border-[#E4E7EC] bg-white">
              <SectionHeader title="Job Performance" description="Statistics for each scheduler job" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm font-['DM_Sans']">
                <thead className="bg-[#F8F9FB] border-b border-[#E4E7EC] text-xs font-semibold text-[#475467] uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-4">Job Name</th>
                    <th className="px-5 py-4 text-center">Last Status</th>
                    <th className="px-5 py-4 text-center">Total Runs</th>
                    <th className="px-5 py-4 text-center">Success Rate</th>
                    <th className="px-5 py-4 text-center">Avg Duration</th>
                    <th className="px-5 py-4 text-right">Last Run</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-[#98A2B3]">
                        Belum ada statistik
                      </td>
                    </tr>
                  ) : (
                    stats.map((stat) => (
                      <tr key={stat.jobName} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-4 font-medium text-[#101828]">{stat.jobName}</td>
                        <td className="px-5 py-4 text-center">{getStatusBadge(stat.lastStatus)}</td>
                        <td className="px-5 py-4 text-center text-[#475467]">{stat.totalRuns}</td>
                        <td className="px-5 py-4 text-center text-[#475467]">{stat.successRate.toFixed(1)}%</td>
                        <td className="px-5 py-4 text-center text-[#475467]">{formatDuration(stat.avgDuration)}</td>
                        <td className="px-5 py-4 text-right text-[#475467]">{stat.lastRun ? formatDate(stat.lastRun) : "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* Retry Queue Tab */}
        <TabsContent value="retry" className="outline-none">
          <div className="bg-white rounded-xl border border-[#E4E7EC] overflow-hidden">
            <div className="p-5 border-b border-[#E4E7EC] bg-white">
              <SectionHeader title="Email Retry Queue" description="Failed emails waiting for retry" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm font-['DM_Sans']">
                <thead className="bg-[#F8F9FB] border-b border-[#E4E7EC] text-xs font-semibold text-[#475467] uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-4">User Email</th>
                    <th className="px-5 py-4 text-center">Status</th>
                    <th className="px-5 py-4 text-left">Message</th>
                    <th className="px-5 py-4 text-left">Details</th>
                    <th className="px-5 py-4 text-right">Created At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {retryQueue.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center text-[#98A2B3]">
                        ✅ Tidak ada email yang perlu di-retry
                      </td>
                    </tr>
                  ) : (
                    retryQueue.map((retry) => (
                      <tr key={retry.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-4 font-medium text-[#101828]">{retry.metadata?.userEmail || "Unknown"}</td>
                        <td className="px-5 py-4 text-center">{getStatusBadge(retry.status)}</td>
                        <td className="px-5 py-4 text-[#475467]">{retry.message || "-"}</td>
                        <td className="px-5 py-4 text-xs text-[#475467]">
                          {retry.metadata && (
                            <div className="space-y-1">
                              {retry.metadata.reminderType && <p>Type: {retry.metadata.reminderType}</p>}
                              {retry.metadata.attemptCount && <p>Attempts: {retry.metadata.attemptCount}/3</p>}
                              {retry.metadata.error && <p className="text-red-500">Error: {retry.metadata.error}</p>}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right text-[#475467]">{formatDate(retry.createdAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* Manual Trigger Tab */}
        <TabsContent value="manual" className="outline-none">
          <div className="bg-white rounded-xl border border-[#E4E7EC] overflow-hidden">
            <div className="p-5 border-b border-[#E4E7EC] bg-white">
              <SectionHeader title="Manual Job Trigger" description="Trigger scheduler jobs manually for testing" />
            </div>
            <div className="p-5 grid gap-4 md:grid-cols-2">
              {[
                { name: "mark-failed", label: "Tandai Enrollment Gagal", desc: "Ubah status IN_PROGRESS → FAILED untuk semua kursus yang melewati deadline (prioritas!)" },
                { name: "reminders", label: "Proactive Reminders", desc: "Send H-7, H-3, H-1 reminders" },
                { name: "deadline-monitoring", label: "Deadline Monitoring", desc: "Check expired enrollments & send reports" },
                { name: "auto-enrollment", label: "Auto Enrollment", desc: "Process enrollment rules" },
                { name: "monthly-reports", label: "Monthly Reports", desc: "Generate department reports" },
                { name: "retry-failed-emails", label: "Retry Failed Emails", desc: "Process retry queue" },
              ].map((job) => (
                <div key={job.name} className="flex flex-col justify-between p-5 border border-[#E4E7EC] rounded-xl hover:shadow-sm transition-shadow bg-white">
                  <div>
                    <h3 className="text-base font-semibold text-[#101828] font-['Lexend_Deca'] flex items-center gap-2">
                      {job.name === "mark-failed" && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                      {job.label}
                    </h3>
                    <p className="text-sm text-[#475467] mt-1 font-['DM_Sans'] mb-4">{job.desc}</p>
                  </div>
                  <Button
                    onClick={() => triggerJob(job.name)}
                    disabled={triggering === job.name}
                    variant="outline"
                    className="w-full bg-[#0F1C3F] hover:bg-[#1A2D5A] hover:text-white text-white border-transparent font-['DM_Sans']"
                  >
                    {triggering === job.name ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Running...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Trigger Job
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
