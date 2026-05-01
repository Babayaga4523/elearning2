"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw,
  Play,
  TrendingUp,
  Activity
} from "lucide-react";

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" />Success</Badge>;
      case "FAILED":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      case "PARTIAL_ERROR":
      case "PARTIAL_FAILURE":
        return <Badge className="bg-yellow-500"><AlertTriangle className="w-3 h-3 mr-1" />Partial</Badge>;
      case "PENDING":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Scheduler Monitoring</h1>
          <p className="text-muted-foreground">Monitor dan kelola scheduler jobs</p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.length}</div>
            <p className="text-xs text-muted-foreground">Active scheduler jobs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.length > 0
                ? `${(stats.reduce((acc, s) => acc + s.successRate, 0) / stats.length).toFixed(1)}%`
                : "—"}
            </div>
            <p className="text-xs text-muted-foreground">Average across all jobs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retry Queue</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{retryQueue.length}</div>
            <p className="text-xs text-muted-foreground">Pending email retries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Runs</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logs.length}</div>
            <p className="text-xs text-muted-foreground">Last 50 executions</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="logs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="logs">Recent Logs</TabsTrigger>
          <TabsTrigger value="stats">Job Statistics</TabsTrigger>
          <TabsTrigger value="retry">Retry Queue</TabsTrigger>
          <TabsTrigger value="manual">Manual Trigger</TabsTrigger>
        </TabsList>

        {/* Recent Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Executions</CardTitle>
              <CardDescription>Last 50 scheduler job executions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {logs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Belum ada log scheduler
                  </p>
                ) : (
                  logs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{log.jobName}</span>
                          {getStatusBadge(log.status)}
                          {log.duration && (
                            <span className="text-xs text-muted-foreground">
                              {formatDuration(log.duration)}
                            </span>
                          )}
                        </div>
                        {log.message && (
                          <p className="text-sm text-muted-foreground">{log.message}</p>
                        )}
                        {log.failedRecipients && Array.isArray(log.failedRecipients) && log.failedRecipients.length > 0 && (
                          <p className="text-xs text-red-500">
                            Failed: {log.failedRecipients.join(", ")}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                        {formatDate(log.createdAt)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Job Statistics Tab */}
        <TabsContent value="stats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Job Performance</CardTitle>
              <CardDescription>Statistics for each scheduler job</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Belum ada statistik
                  </p>
                ) : (
                  stats.map((stat) => (
                    <div key={stat.jobName} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{stat.jobName}</h3>
                        {stat.lastStatus && getStatusBadge(stat.lastStatus)}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Total Runs</p>
                          <p className="font-medium">{stat.totalRuns}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Success Rate</p>
                          <p className="font-medium">{stat.successRate.toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Avg Duration</p>
                          <p className="font-medium">{formatDuration(stat.avgDuration)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Last Run</p>
                          <p className="font-medium">
                            {stat.lastRun ? formatDate(stat.lastRun) : "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Retry Queue Tab */}
        <TabsContent value="retry" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Retry Queue</CardTitle>
              <CardDescription>Failed emails waiting for retry</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {retryQueue.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    ✅ Tidak ada email yang perlu di-retry
                  </p>
                ) : (
                  retryQueue.map((retry) => (
                    <div
                      key={retry.id}
                      className="flex items-start justify-between p-3 border rounded-lg"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          {getStatusBadge(retry.status)}
                          <span className="text-sm font-medium">
                            {retry.metadata?.userEmail || "Unknown"}
                          </span>
                        </div>
                        {retry.message && (
                          <p className="text-sm text-muted-foreground">{retry.message}</p>
                        )}
                        {retry.metadata && (
                          <div className="text-xs text-muted-foreground space-y-1">
                            {retry.metadata.reminderType && (
                              <p>Type: {retry.metadata.reminderType}</p>
                            )}
                            {retry.metadata.attemptCount && (
                              <p>Attempts: {retry.metadata.attemptCount}/3</p>
                            )}
                            {retry.metadata.error && (
                              <p className="text-red-500">Error: {retry.metadata.error}</p>
                            )}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                        {formatDate(retry.createdAt)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manual Trigger Tab */}
        <TabsContent value="manual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manual Job Trigger</CardTitle>
              <CardDescription>Trigger scheduler jobs manually for testing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  { name: "reminders", label: "Proactive Reminders", desc: "Send H-7, H-3, H-1 reminders" },
                  { name: "deadline-monitoring", label: "Deadline Monitoring", desc: "Check expired enrollments" },
                  { name: "auto-enrollment", label: "Auto Enrollment", desc: "Process enrollment rules" },
                  { name: "monthly-reports", label: "Monthly Reports", desc: "Generate department reports" },
                  { name: "retry-failed-emails", label: "Retry Failed Emails", desc: "Process retry queue" },
                ].map((job) => (
                  <Card key={job.name}>
                    <CardHeader>
                      <CardTitle className="text-base">{job.label}</CardTitle>
                      <CardDescription>{job.desc}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        onClick={() => triggerJob(job.name)}
                        disabled={triggering === job.name}
                        className="w-full"
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
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
