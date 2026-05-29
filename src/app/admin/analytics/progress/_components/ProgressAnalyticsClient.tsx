"use client";

/**
 * Progress Analytics Client Component
 * Interactive dashboard for video and PDF progress analytics
 */

import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, RefreshCw, Video, FileText, AlertTriangle, TrendingUp, BarChart2, BookOpen, Clock, ArrowUpRight, ArrowDownRight, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
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
// Interfaces
// ─────────────────────────────────────────────
interface VideoAnalytics {
  totalVideos: number;
  averageCompletionRate: number;
  totalWatchTime: number;
  totalUsers: number;
  usersWhoStarted: number;
  videos: Array<{
    moduleId: string;
    moduleName: string;
    courseId: string;
    totalViews: number;
    averageWatchTime: number;
    completionRate: number;
    usersCompleted: number;
    usersInProgress: number;
    usersNotStarted: number;
  }>;
}

interface PDFAnalytics {
  totalPDFs: number;
  averageCompletionRate: number;
  totalReadTime: number;
  totalUsers: number;
  usersWhoStarted: number;
  pdfs: Array<{
    moduleId: string;
    moduleName: string;
    courseId: string;
    totalReads: number;
    averagePagesRead: number;
    completionRate: number;
    usersCompleted: number;
    usersInProgress: number;
    usersNotStarted: number;
  }>;
}

interface StrugglingUser {
  userId: string;
  userName: string;
  email: string;
  department: string;
  courseId: string;
  courseName: string;
  progress: number;
  lastActiveDate: string;
}

export function ProgressAnalyticsClient() {
  const [videoAnalytics, setVideoAnalytics] = useState<VideoAnalytics | null>(null);
  const [pdfAnalytics, setPDFAnalytics] = useState<PDFAnalytics | null>(null);
  const [strugglingUsers, setStrugglingUsers] = useState<StrugglingUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [courseFilter, setCourseFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [dateRangeStart, setDateRangeStart] = useState("");
  const [dateRangeEnd, setDateRangeEnd] = useState("");

  const loadAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null); // Reset error state

      // Build query params
      const params = new URLSearchParams();
      if (courseFilter) params.append("courseId", courseFilter);
      if (departmentFilter) params.append("department", departmentFilter);
      if (dateRangeStart) params.append("startDate", dateRangeStart);
      if (dateRangeEnd) params.append("endDate", dateRangeEnd);

      // Fetch video analytics
      const videoRes = await fetch(`/api/admin/analytics/video?${params}`);
      if (!videoRes.ok) {
        const errText = await videoRes.text();
        throw new Error(`Video analytics failed (${videoRes.status}): ${errText}`);
      }
      const videoData = await videoRes.json();
      if (videoData.success) {
        setVideoAnalytics(videoData.data);
      } else {
        throw new Error(videoData.error ?? "Failed to load video analytics");
      }

      // Fetch PDF analytics
      const pdfRes = await fetch(`/api/admin/analytics/pdf?${params}`);
      if (!pdfRes.ok) {
        const errText = await pdfRes.text();
        throw new Error(`PDF analytics failed (${pdfRes.status}): ${errText}`);
      }
      const pdfData = await pdfRes.json();
      if (pdfData.success) {
        setPDFAnalytics(pdfData.data);
      } else {
        throw new Error(pdfData.error ?? "Failed to load PDF analytics");
      }

      // Fetch struggling users
      const strugglingParams = new URLSearchParams();
      if (courseFilter) strugglingParams.append("courseId", courseFilter);
      if (departmentFilter) strugglingParams.append("department", departmentFilter);
      strugglingParams.append("days", "7");
      strugglingParams.append("progress", "50");

      const strugglingRes = await fetch(`/api/admin/analytics/struggling-users?${strugglingParams}`);
      if (!strugglingRes.ok) {
        const errText = await strugglingRes.text();
        throw new Error(`Struggling users failed (${strugglingRes.status}): ${errText}`);
      }
      const strugglingData = await strugglingRes.json();
      if (strugglingData.success) {
        setStrugglingUsers(strugglingData.data.users);
      } else {
        throw new Error(strugglingData.error ?? "Failed to load struggling users");
      }
    } catch (error) {
      console.error("Failed to load analytics:", error);
      const errorMessage = error instanceof Error ? error.message : "Gagal memuat analytics";
      toast.error(errorMessage);
      setError(errorMessage);
      setVideoAnalytics(null);
      setPDFAnalytics(null);
      setStrugglingUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [courseFilter, departmentFilter, dateRangeStart, dateRangeEnd]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // Export to Excel
  const exportToExcel = async (type: "video" | "pdf" | "struggling") => {
    try {
      setIsExporting(true);

      const workbook = new ExcelJS.Workbook();
      workbook.creator = "E-Learning Admin";
      workbook.created = new Date();

      if (type === "video" && videoAnalytics) {
        const sheet = workbook.addWorksheet("Video Analytics");

        // Headers
        sheet.columns = [
          { header: "Module Name", key: "moduleName", width: 30 },
          { header: "Course ID", key: "courseId", width: 20 },
          { header: "Total Views", key: "totalViews", width: 15 },
          { header: "Avg Watch Time (min)", key: "avgWatchTime", width: 20 },
          { header: "Completion Rate (%)", key: "completionRate", width: 20 },
          { header: "Users Completed", key: "usersCompleted", width: 18 },
          { header: "Users In Progress", key: "usersInProgress", width: 18 },
          { header: "Not Started", key: "usersNotStarted", width: 15 },
        ];

        // Data
        videoAnalytics.videos.forEach((video) => {
          sheet.addRow({
            moduleName: video.moduleName,
            courseId: video.courseId,
            totalViews: video.totalViews,
            avgWatchTime: (video.averageWatchTime / 60).toFixed(2),
            completionRate: video.completionRate.toFixed(2),
            usersCompleted: video.usersCompleted,
            usersInProgress: video.usersInProgress,
            usersNotStarted: video.usersNotStarted,
          });
        });

        // Style header
        sheet.getRow(1).font = { bold: true };
        sheet.getRow(1).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF4472C4" },
        };
      } else if (type === "pdf" && pdfAnalytics) {
        const sheet = workbook.addWorksheet("PDF Analytics");

        sheet.columns = [
          { header: "Module Name", key: "moduleName", width: 30 },
          { header: "Course ID", key: "courseId", width: 20 },
          { header: "Total Reads", key: "totalReads", width: 15 },
          { header: "Avg Pages Read", key: "avgPagesRead", width: 18 },
          { header: "Completion Rate (%)", key: "completionRate", width: 20 },
          { header: "Users Completed", key: "usersCompleted", width: 18 },
          { header: "Users In Progress", key: "usersInProgress", width: 18 },
          { header: "Not Started", key: "usersNotStarted", width: 15 },
        ];

        pdfAnalytics.pdfs.forEach((pdf) => {
          sheet.addRow({
            moduleName: pdf.moduleName,
            courseId: pdf.courseId,
            totalReads: pdf.totalReads,
            avgPagesRead: pdf.averagePagesRead.toFixed(2),
            completionRate: pdf.completionRate.toFixed(2),
            usersCompleted: pdf.usersCompleted,
            usersInProgress: pdf.usersInProgress,
            usersNotStarted: pdf.usersNotStarted,
          });
        });

        sheet.getRow(1).font = { bold: true };
        sheet.getRow(1).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF4472C4" },
        };
      } else if (type === "struggling") {
        const sheet = workbook.addWorksheet("Struggling Users");
        
        sheet.columns = [
          { header: "User Name", key: "userName", width: 25 },
          { header: "Email", key: "email", width: 30 },
          { header: "Department", key: "department", width: 20 },
          { header: "Course ID", key: "courseId", width: 20 },
          { header: "Course Name", key: "courseName", width: 30 },
          { header: "Progress (%)", key: "progress", width: 15 },
          { header: "Last Active", key: "lastActiveDate", width: 20 },
        ];

        strugglingUsers.forEach((user) => {
          sheet.addRow({
            userName: user.userName,
            email: user.email,
            department: user.department,
            courseId: user.courseId,
            courseName: user.courseName,
            progress: user.progress.toFixed(2),
            lastActiveDate: user.lastActiveDate ? new Date(user.lastActiveDate).toLocaleDateString() : "-",
          });
        });

        sheet.getRow(1).font = { bold: true };
        sheet.getRow(1).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF4472C4" },
        };
      }

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `analytics-${type}-${new Date().toISOString().split("T")[0]}.xlsx`);
    } catch (error) {
      console.error("Failed to export:", error);
      toast.error("Gagal export data");
    } finally {
      setIsExporting(false);
    }
  };

  // Format time
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (isLoading) {
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

  if (error) {
    return (
      <motion.div 
        key="error-state"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        className="flex flex-col items-center justify-center min-h-[50vh] gap-4"
      >
        <div className="h-14 w-14 rounded-2xl bg-red-50 flex items-center justify-center border border-red-100/50 shadow-sm">
          <AlertTriangle className="h-6 w-6 text-red-600" />
        </div>
        <div className="text-center space-y-1">
          <h3 className="font-semibold text-lg text-[#101828] font-['Lexend_Deca']">Gagal memuat data</h3>
          <p className="text-[#475467] font-medium text-sm font-['DM_Sans']">{error}</p>
        </div>
        <Button 
          onClick={() => { setError(null); loadAnalytics(); }}
          variant="outline"
          className="mt-2 text-[#344054] border-[#E4E7EC] font-['DM_Sans'] hover:bg-slate-50"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Coba Lagi
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="w-full min-w-0 space-y-6 lg:space-y-8">
      {/* ───── Page Header ───── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-['Lexend_Deca']">Progress Analytics</h1>
          <p className="text-sm text-[#475467] mt-1 font-['DM_Sans']">Monitor video dan PDF progress tracking</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={loadAnalytics}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-[#E4E7EC] text-[#344054] bg-white hover:bg-[#F8F9FB] rounded-lg transition-colors font-['DM_Sans']"
          >
            <RefreshCw size={13} />
            Refresh
          </button>
        </div>
      </div>

      {/* ───── Filters ───── */}
      <div className="bg-white rounded-xl border border-[#E4E7EC] p-5">
        <SectionHeader title="Filter Analytics" description="Sesuaikan data berdasarkan kursus atau departemen" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mt-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#475467] uppercase tracking-wider font-['DM_Sans']">Course ID</label>
            <Input
              placeholder="Filter by course..."
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="border-[#E4E7EC] h-9 text-sm text-[#101828] font-['DM_Sans'] rounded-lg focus-visible:ring-1 focus-visible:ring-[#0F1C3F]"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#475467] uppercase tracking-wider font-['DM_Sans']">Department</label>
            <Input
              placeholder="Filter by department..."
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="border-[#E4E7EC] h-9 text-sm text-[#101828] font-['DM_Sans'] rounded-lg focus-visible:ring-1 focus-visible:ring-[#0F1C3F]"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#475467] uppercase tracking-wider font-['DM_Sans']">Start Date</label>
            <Input
              type="date"
              value={dateRangeStart}
              onChange={(e) => setDateRangeStart(e.target.value)}
              className="border-[#E4E7EC] h-9 text-sm text-[#101828] font-['DM_Sans'] rounded-lg focus-visible:ring-1 focus-visible:ring-[#0F1C3F]"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#475467] uppercase tracking-wider font-['DM_Sans']">End Date</label>
            <Input
              type="date"
              value={dateRangeEnd}
              onChange={(e) => setDateRangeEnd(e.target.value)}
              className="border-[#E4E7EC] h-9 text-sm text-[#101828] font-['DM_Sans'] rounded-lg focus-visible:ring-1 focus-visible:ring-[#0F1C3F]"
            />
          </div>
        </div>
        <div className="mt-5 flex justify-end">
          <Button 
            onClick={loadAnalytics}
            className="bg-[#0F1C3F] hover:bg-[#1A2D5A] text-white font-['DM_Sans'] h-9 rounded-lg"
          >
            Terapkan Filter
          </Button>
        </div>
      </div>

      {/* ───── KPI Stats Row ───── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5">
        <StatsCard 
          label="Total Videos" 
          value={videoAnalytics?.totalVideos || 0} 
          description={`${videoAnalytics?.totalUsers || 0} users watching`} 
          icon={Video} 
        />
        <StatsCard 
          label="Total PDFs" 
          value={pdfAnalytics?.totalPDFs || 0} 
          description={`${pdfAnalytics?.totalUsers || 0} users reading`} 
          icon={FileText} 
        />
        <StatsCard 
          label="Total Watch Time" 
          value={formatTime(videoAnalytics?.totalWatchTime || 0)} 
          icon={Clock} 
          variant="gold" 
        />
        <StatsCard 
          label="Avg Video Completion" 
          value={`${videoAnalytics?.averageCompletionRate?.toFixed(1) || 0}%`} 
          description={`${videoAnalytics?.usersWhoStarted || 0} users started`} 
          icon={TrendingUp} 
          variant="navy" 
        />
      </div>

      {/* ───── Data Tabs ───── */}
      <Tabs defaultValue="video" className="space-y-6">
        <TabsList className="bg-[#F8F9FB] p-1 border border-[#E4E7EC] rounded-xl h-auto">
          <TabsTrigger value="video" className="data-[state=active]:bg-white data-[state=active]:text-[#101828] data-[state=active]:shadow-sm text-[#475467] font-['DM_Sans'] text-sm rounded-lg px-4 py-2">Video Analytics</TabsTrigger>
          <TabsTrigger value="pdf" className="data-[state=active]:bg-white data-[state=active]:text-[#101828] data-[state=active]:shadow-sm text-[#475467] font-['DM_Sans'] text-sm rounded-lg px-4 py-2">PDF Analytics</TabsTrigger>
          <TabsTrigger value="struggling" className="data-[state=active]:bg-white data-[state=active]:text-[#101828] data-[state=active]:shadow-sm text-[#475467] font-['DM_Sans'] text-sm rounded-lg px-4 py-2">Struggling Users</TabsTrigger>
        </TabsList>

        {/* Video Tab */}
        <TabsContent value="video" className="outline-none">
          <div className="bg-white rounded-xl border border-[#E4E7EC] overflow-hidden">
            <div className="p-5 border-b border-[#E4E7EC] flex items-center justify-between bg-white">
              <SectionHeader title="Performa Video per Modul" description="Metrik detail tayangan dan penyelesaian" />
              <Button 
                variant="outline" 
                size="sm" 
                className="font-['DM_Sans'] text-[#344054] border-[#E4E7EC]"
                onClick={() => exportToExcel("video")}
                disabled={isExporting || !videoAnalytics?.videos.length}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm font-['DM_Sans']">
                <thead className="bg-[#F8F9FB] border-b border-[#E4E7EC] text-xs font-semibold text-[#475467] uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-4">Module</th>
                    <th className="px-5 py-4 text-center">Views</th>
                    <th className="px-5 py-4 text-center">Avg Time</th>
                    <th className="px-5 py-4 text-center">Completion</th>
                    <th className="px-5 py-4 text-right">Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(!videoAnalytics?.videos || videoAnalytics.videos.length === 0) ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center text-[#98A2B3]">
                        Belum ada data analytics video
                      </td>
                    </tr>
                  ) : (
                    videoAnalytics.videos.map((video) => (
                      <tr key={video.moduleId} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-4">
                          <p className="font-medium text-[#101828]">{video.moduleName}</p>
                          <p className="text-xs text-[#98A2B3] mt-0.5">{video.courseId}</p>
                        </td>
                        <td className="px-5 py-4 text-center text-[#475467] font-medium">{video.totalViews}</td>
                        <td className="px-5 py-4 text-center text-[#475467]">{formatTime(video.averageWatchTime)}</td>
                        <td className="px-5 py-4 text-center">
                          <StatusBadge variant={video.completionRate >= 80 ? "success" : video.completionRate >= 50 ? "warning" : "danger"}>
                            {video.completionRate.toFixed(1)}%
                          </StatusBadge>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-3 text-xs text-[#475467]">
                            <span title="Completed" className="flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> {video.usersCompleted}</span>
                            <span title="In Progress" className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-amber-500" /> {video.usersInProgress}</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* PDF Tab */}
        <TabsContent value="pdf" className="outline-none">
          <div className="bg-white rounded-xl border border-[#E4E7EC] overflow-hidden">
            <div className="p-5 border-b border-[#E4E7EC] flex items-center justify-between bg-white">
              <SectionHeader title="Performa PDF per Modul" description="Metrik detail aktivitas baca PDF" />
              <Button 
                variant="outline" 
                size="sm" 
                className="font-['DM_Sans'] text-[#344054] border-[#E4E7EC]"
                onClick={() => exportToExcel("pdf")}
                disabled={isExporting || !pdfAnalytics?.pdfs.length}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm font-['DM_Sans']">
                <thead className="bg-[#F8F9FB] border-b border-[#E4E7EC] text-xs font-semibold text-[#475467] uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-4">Module</th>
                    <th className="px-5 py-4 text-center">Reads</th>
                    <th className="px-5 py-4 text-center">Avg Pages</th>
                    <th className="px-5 py-4 text-center">Completion</th>
                    <th className="px-5 py-4 text-right">Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(!pdfAnalytics?.pdfs || pdfAnalytics.pdfs.length === 0) ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center text-[#98A2B3]">
                        Belum ada data analytics PDF
                      </td>
                    </tr>
                  ) : (
                    pdfAnalytics.pdfs.map((pdf) => (
                      <tr key={pdf.moduleId} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-4">
                          <p className="font-medium text-[#101828]">{pdf.moduleName}</p>
                          <p className="text-xs text-[#98A2B3] mt-0.5">{pdf.courseId}</p>
                        </td>
                        <td className="px-5 py-4 text-center text-[#475467] font-medium">{pdf.totalReads}</td>
                        <td className="px-5 py-4 text-center text-[#475467]">{pdf.averagePagesRead.toFixed(1)}</td>
                        <td className="px-5 py-4 text-center">
                          <StatusBadge variant={pdf.completionRate >= 80 ? "success" : pdf.completionRate >= 50 ? "warning" : "danger"}>
                            {pdf.completionRate.toFixed(1)}%
                          </StatusBadge>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-3 text-xs text-[#475467]">
                            <span title="Completed" className="flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> {pdf.usersCompleted}</span>
                            <span title="In Progress" className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-amber-500" /> {pdf.usersInProgress}</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* Struggling Users Tab */}
        <TabsContent value="struggling" className="outline-none">
          <div className="bg-white rounded-xl border border-[#E4E7EC] overflow-hidden">
            <div className="p-5 border-b border-[#E4E7EC] flex items-center justify-between bg-white">
              <SectionHeader title="Struggling Users" description="Pengguna yang butuh perhatian khusus" />
              <Button 
                variant="outline" 
                size="sm" 
                className="font-['DM_Sans'] text-[#344054] border-[#E4E7EC]"
                onClick={() => exportToExcel("struggling")}
                disabled={isExporting || strugglingUsers.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
            
            <div className="p-5 bg-[#FFFAEB] border-b border-[#E4E7EC] flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-amber-800 font-['DM_Sans']">Kriteria Struggling User</h4>
                <p className="text-sm text-amber-700 mt-1 font-['DM_Sans']">
                  Daftar di bawah ini adalah pengguna yang telah terdaftar selama lebih dari 7 hari namun progress belajarnya masih di bawah 50%.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm font-['DM_Sans']">
                <thead className="bg-[#F8F9FB] border-b border-[#E4E7EC] text-xs font-semibold text-[#475467] uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-4">User</th>
                    <th className="px-5 py-4">Department</th>
                    <th className="px-5 py-4">Course</th>
                    <th className="px-5 py-4 text-center">Progress</th>
                    <th className="px-5 py-4 text-right">Last Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {strugglingUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center text-[#98A2B3]">
                        Tidak ada struggling users yang ditemukan
                      </td>
                    </tr>
                  ) : (
                    strugglingUsers.map((user) => (
                      <tr key={`${user.userId}-${user.courseId}`} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-4">
                          <p className="font-medium text-[#101828]">{user.userName}</p>
                          <p className="text-xs text-[#98A2B3] mt-0.5">{user.email}</p>
                        </td>
                        <td className="px-5 py-4 text-[#475467]">{user.department || "-"}</td>
                        <td className="px-5 py-4 text-[#475467]">{user.courseName}</td>
                        <td className="px-5 py-4 text-center">
                          <StatusBadge variant="danger">{user.progress.toFixed(0)}%</StatusBadge>
                        </td>
                        <td className="px-5 py-4 text-right text-[#475467]">
                          {user.lastActiveDate ? new Date(user.lastActiveDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
