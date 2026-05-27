"use client";

/**
 * Progress Analytics Client Component
 * Interactive dashboard for video and PDF progress analytics
 */

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, RefreshCw, Video, FileText, AlertTriangle, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

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
  enrolledDate: string;
  daysSinceEnrollment: number;
  completionRate: number;
  completedModules: number;
  totalModules: number;
  stuckModule: {
    moduleId: string;
    moduleName: string;
    moduleType: string;
    progress: number;
  } | null;
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
          { header: "Course", key: "courseName", width: 30 },
          { header: "Days Enrolled", key: "daysEnrolled", width: 15 },
          { header: "Completion (%)", key: "completion", width: 15 },
          { header: "Stuck Module", key: "stuckModule", width: 30 },
          { header: "Module Progress (%)", key: "moduleProgress", width: 20 },
        ];

        strugglingUsers.forEach((user) => {
          sheet.addRow({
            userName: user.userName,
            email: user.email,
            department: user.department,
            courseName: user.courseName,
            daysEnrolled: user.daysSinceEnrollment,
            completion: user.completionRate.toFixed(2),
            stuckModule: user.stuckModule?.moduleName || "N/A",
            moduleProgress: user.stuckModule?.progress?.toFixed(2) ?? "0",
          });
        });

        sheet.getRow(1).font = { bold: true };
        sheet.getRow(1).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFF6B6B" },
        };
      }

      // Generate and download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(blob, `${type}-analytics-${new Date().toISOString().split("T")[0]}.xlsx`);

      toast.success("Data berhasil di-export");
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
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Memuat analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertTriangle className="h-8 w-8 text-red-500" />
        <p className="text-red-600 font-medium">{error}</p>
        <Button onClick={() => { setError(null); loadAnalytics(); }}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Coba Lagi
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Progress Analytics</h1>
          <p className="text-gray-600 mt-1">
            Monitor video dan PDF progress tracking
          </p>
        </div>
        <Button onClick={loadAnalytics} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Course ID</label>
              <Input
                placeholder="Filter by course..."
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Department</label>
              <Input
                placeholder="Filter by department..."
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Start Date</label>
              <Input
                type="date"
                value={dateRangeStart}
                onChange={(e) => setDateRangeStart(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">End Date</label>
              <Input
                type="date"
                value={dateRangeEnd}
                onChange={(e) => setDateRangeEnd(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-4">
            <Button onClick={loadAnalytics}>
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
            <Video className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{videoAnalytics?.totalVideos || 0}</div>
            <p className="text-xs text-gray-600 mt-1">
              {videoAnalytics?.totalUsers || 0} users, Avg: {videoAnalytics?.averageCompletionRate?.toFixed(1) || 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total PDFs</CardTitle>
            <FileText className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pdfAnalytics?.totalPDFs || 0}</div>
            <p className="text-xs text-gray-600 mt-1">
              {pdfAnalytics?.totalUsers || 0} users, Avg: {pdfAnalytics?.averageCompletionRate?.toFixed(1) || 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Watch Time</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatTime(videoAnalytics?.totalWatchTime || 0)}
            </div>
            <p className="text-xs text-gray-600 mt-1">{videoAnalytics?.usersWhoStarted || 0} users started</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Struggling Users</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{strugglingUsers.length}</div>
            <p className="text-xs text-gray-600 mt-1">Need attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="video" className="space-y-4">
        <TabsList>
          <TabsTrigger value="video">Video Analytics</TabsTrigger>
          <TabsTrigger value="pdf">PDF Analytics</TabsTrigger>
          <TabsTrigger value="struggling">Struggling Users</TabsTrigger>
        </TabsList>

        {/* Video Analytics Tab */}
        <TabsContent value="video" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Video Progress</CardTitle>
                <CardDescription>Detailed video watch analytics</CardDescription>
              </div>
              <Button
                onClick={() => exportToExcel("video")}
                disabled={isExporting}
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Module Name</th>
                      <th className="text-right p-3">Views</th>
                      <th className="text-right p-3">Avg Watch Time</th>
                      <th className="text-right p-3">Completion</th>
                      <th className="text-right p-3">Completed</th>
                      <th className="text-right p-3">In Progress</th>
                      <th className="text-right p-3">Not Started</th>
                    </tr>
                  </thead>
                  <tbody>
                    {videoAnalytics?.videos.map((video) => (
                      <tr key={video.moduleId} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div className="font-medium">{video.moduleName}</div>
                          <div className="text-xs text-gray-500">{video.courseId}</div>
                        </td>
                        <td className="text-right p-3">{video.totalViews}</td>
                        <td className="text-right p-3">
                          {formatTime(video.averageWatchTime)}
                        </td>
                        <td className="text-right p-3">
                          <span
                            className={`px-2 py-1 rounded text-sm ${
                              video.completionRate >= 80
                                ? "bg-green-100 text-green-700"
                                : video.completionRate >= 50
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {video.completionRate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="text-right p-3 text-green-600 font-medium">{video.usersCompleted}</td>
                        <td className="text-right p-3 text-yellow-600">{video.usersInProgress}</td>
                        <td className="text-right p-3 text-gray-500">{video.usersNotStarted}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PDF Analytics Tab */}
        <TabsContent value="pdf" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>PDF Progress</CardTitle>
                <CardDescription>Detailed PDF reading analytics</CardDescription>
              </div>
              <Button
                onClick={() => exportToExcel("pdf")}
                disabled={isExporting}
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Module Name</th>
                      <th className="text-right p-3">Reads</th>
                      <th className="text-right p-3">Avg Pages Read</th>
                      <th className="text-right p-3">Completion</th>
                      <th className="text-right p-3">Completed</th>
                      <th className="text-right p-3">In Progress</th>
                      <th className="text-right p-3">Not Started</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pdfAnalytics?.pdfs.map((pdf) => (
                      <tr key={pdf.moduleId} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div className="font-medium">{pdf.moduleName}</div>
                          <div className="text-xs text-gray-500">{pdf.courseId}</div>
                        </td>
                        <td className="text-right p-3">{pdf.totalReads}</td>
                        <td className="text-right p-3">
                          {pdf.averagePagesRead.toFixed(1)}
                        </td>
                        <td className="text-right p-3">
                          <span
                            className={`px-2 py-1 rounded text-sm ${
                              pdf.completionRate >= 80
                                ? "bg-green-100 text-green-700"
                                : pdf.completionRate >= 50
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {pdf.completionRate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="text-right p-3 text-green-600 font-medium">{pdf.usersCompleted}</td>
                        <td className="text-right p-3 text-yellow-600">{pdf.usersInProgress}</td>
                        <td className="text-right p-3 text-gray-500">{pdf.usersNotStarted}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Struggling Users Tab */}
        <TabsContent value="struggling" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Struggling Users</CardTitle>
                <CardDescription>
                  Users with &lt;50% progress after 7+ days
                </CardDescription>
              </div>
              <Button
                onClick={() => exportToExcel("struggling")}
                disabled={isExporting}
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">User</th>
                      <th className="text-left p-3">Course</th>
                      <th className="text-right p-3">Days</th>
                      <th className="text-right p-3">Progress</th>
                      <th className="text-left p-3">Stuck Module</th>
                      <th className="text-right p-3">Module Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {strugglingUsers.map((user) => (
                      <tr key={user.userId} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div>
                            <div className="font-medium">{user.userName}</div>
                            <div className="text-sm text-gray-600">{user.email}</div>
                            <div className="text-xs text-gray-500">{user.department}</div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm">{user.courseName}</div>
                          <div className="text-xs text-gray-500">
                            {user.completedModules}/{user.totalModules} modules
                          </div>
                        </td>
                        <td className="text-right p-3">
                          <div className="flex flex-col items-end">
                            <span className="text-sm">{user.daysSinceEnrollment} hari</span>
                            <span className="text-xs text-gray-500">
                              {user.enrolledDate ? new Date(user.enrolledDate).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }) : "-"}
                            </span>
                          </div>
                        </td>
                        <td className="text-right p-3">
                          <span className="px-2 py-1 rounded text-sm bg-red-100 text-red-700">
                            {user.completionRate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="p-3">
                          {user.stuckModule ? (
                            <div>
                              <div className="text-sm">{user.stuckModule.moduleName}</div>
                              <div className="text-xs text-gray-500">
                                {user.stuckModule.moduleType}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="text-right p-3">
                          {user.stuckModule ? (
                            <span className="text-sm">
                              {user.stuckModule.progress.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
