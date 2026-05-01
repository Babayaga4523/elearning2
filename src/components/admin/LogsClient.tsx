"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, 
  Calendar,
  RefreshCw,
  Clock,
  FileJson,
  CheckCircle2,
  XCircle,
  Loader2,
  Timer,
  Activity,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Pagination } from "@/components/admin/Pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/admin/ui/page-header";
import { EmptyState } from "@/components/admin/ui/empty-state";

const ITEMS_PER_PAGE = 20;

interface LogEntry {
  id: string;
  source?: "SCHEDULER" | "ENROLLMENT";
  jobName: string;
  status: string;
  message: string | null;
  duration: number | null;
  createdAt: Date | string;
  failedRecipients: any;
}

interface LogsClientProps {
  logs: LogEntry[];
}

const JOB_LABELS: Record<string, string> = {
  "REPORTING": "Laporan Mingguan",
  "REMINDERS": "Pengingat Deadline",
  "AUTO_ENROLL": "Pendaftaran Otomatis",
  "MANUAL_POKE": "Colekan Admin (Manual)",
  "ENROLLMENT_ACTIVITY": "Aktivitas Pendaftaran Kursus",
};

type StatusKey = "all" | "SUCCESS" | "FAILED" | "RUNNING" | "PENDING";
type SourceKey = "all" | "SCHEDULER" | "ENROLLMENT";

const STATUS_CONFIG: Record<string, {
  label: string;
  icon: React.ElementType;
  className: string;
  dot: string;
}> = {
  SUCCESS:  { label: "Selesai",     icon: CheckCircle2, className: "bg-emerald-50 text-emerald-700 border-emerald-100", dot: "bg-emerald-500" },
  FAILED:   { label: "Gagal",       icon: XCircle,      className: "bg-rose-50 text-rose-700 border-rose-100",           dot: "bg-rose-500" },
  RUNNING:  { label: "Berlangsung", icon: Loader2,       className: "bg-blue-50 text-blue-700 border-blue-100",           dot: "bg-blue-500" },
  PENDING:  { label: "Menunggu",    icon: Timer,         className: "bg-amber-50 text-amber-700 border-amber-100",        dot: "bg-amber-400" },
  UNKNOWN:  { label: "Tidak Diketahui", icon: Activity,  className: "bg-slate-50 text-slate-500 border-slate-100",       dot: "bg-slate-400" },
};

function StatusPill({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG["UNKNOWN"];
  const Icon = cfg.icon;
  const isSpinning = status === "RUNNING";
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap",
      cfg.className
    )}>
      <Icon className={cn("h-3 w-3 shrink-0", isSpinning && "animate-spin")} />
      {cfg.label}
    </span>
  );
}

export function LogsClient({ logs }: LogsClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusKey>("all");
  const [sourceFilter, setSourceFilter] = useState<SourceKey>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshAt, setLastRefreshAt] = useState<Date | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setLastRefreshAt(new Date());
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setIsRefreshing(true);
      router.refresh();
      setLastRefreshAt(new Date());
      setTimeout(() => setIsRefreshing(false), 500);
    }, 30000);
    return () => clearInterval(id);
  }, [router]);

  const toFilterStatus = (raw: string): string => {
    const s = raw.toUpperCase();
    if (["SUCCESS", "COMPLETED", "OK"].includes(s)) return "SUCCESS";
    if (["FAILED", "REJECTED", "ERROR", "CHEATING"].includes(s)) return "FAILED";
    if (["RUNNING", "IN_PROGRESS"].includes(s)) return "RUNNING";
    if (s === "PENDING") return "PENDING";
    return "UNKNOWN";
  };

  const normalizedLogs = useMemo(() =>
    logs.map((log) => ({
      ...log,
      jobKey: (log.jobName || "UNKNOWN").toUpperCase(),
      filterStatus: toFilterStatus(log.status || ""),
      createdAtDate: new Date(log.createdAt),
    })),
    [logs]
  );

  const filteredLogs = useMemo(() => normalizedLogs.filter((log) => {
    const jobLabel = JOB_LABELS[log.jobKey] || log.jobKey;
    const matchSearch = jobLabel.toLowerCase().includes(search.toLowerCase()) ||
                        (log.message?.toLowerCase() || "").includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || log.filterStatus === statusFilter;
    const matchSource = sourceFilter === "all" || (log.source || "SCHEDULER").toUpperCase() === sourceFilter;
    return matchSearch && matchStatus && matchSource;
  }), [normalizedLogs, search, statusFilter, sourceFilter]);

  const handleSearchChange = (val: string) => { setSearch(val); setCurrentPage(1); };
  const handleStatusFilter = (s: StatusKey) => { setStatusFilter(s); setCurrentPage(1); };
  const handleSourceFilter = (s: SourceKey) => { setSourceFilter(s); setCurrentPage(1); };

  const safePage = filteredLogs.length > 0 && currentPage > Math.ceil(filteredLogs.length / ITEMS_PER_PAGE)
    ? Math.ceil(filteredLogs.length / ITEMS_PER_PAGE)
    : currentPage;

  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);
  const paginatedLogs = filteredLogs.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE
  );

  // Stats
  const successCount = normalizedLogs.filter(l => l.filterStatus === "SUCCESS").length;
  const failedCount  = normalizedLogs.filter(l => l.filterStatus === "FAILED").length;
  const runningCount = normalizedLogs.filter(l => l.filterStatus === "RUNNING").length;

  return (
    <div className="space-y-5 pb-12 animate-in fade-in duration-700">
      <PageHeader
        title="Log Sistem"
        description="Riwayat eksekusi cron job dan aktivitas pendaftaran kursus."
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-100 rounded-lg shadow-sm">
              <RefreshCw className={cn("h-3 w-3 text-slate-400", isRefreshing && "animate-spin")} />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sync</span>
              <span className="text-[11px] font-bold text-slate-700 ml-1">
                {lastRefreshAt?.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) ?? "--:--"}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setIsRefreshing(true); router.refresh(); setTimeout(() => setIsRefreshing(false), 500); }}
              className="h-8 gap-1.5 rounded-lg border-slate-200 text-slate-500 text-xs font-bold hover:border-[#0F1C3F] hover:text-[#0F1C3F]"
            >
              <RefreshCw className={cn("h-3 w-3", isRefreshing && "animate-spin")} />
              Refresh
            </Button>
          </div>
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Log",    value: logs.length,    dot: "bg-[#0F1C3F]" },
          { label: "Berhasil",     value: successCount,   dot: "bg-emerald-500" },
          { label: "Gagal",        value: failedCount,    dot: "bg-rose-500" },
          { label: "Berlangsung",  value: runningCount,   dot: "bg-blue-500" },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-3 bg-white border border-slate-100 rounded-xl px-4 py-3 shadow-sm">
            <div className={cn("h-2 w-2 rounded-full shrink-0", s.dot)} />
            <div>
              <p className="text-base font-black text-[#0F1C3F] leading-none">{s.value}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter toolbar */}
      <Card className="rounded-xl border-slate-100 shadow-sm">
        <CardContent className="p-3">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Cari tugas atau pesan..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9 h-9 rounded-lg bg-slate-50 border-none text-sm focus-visible:ring-[#0F1C3F]/10"
              />
            </div>

            {/* Status filter */}
            <Select value={statusFilter} onValueChange={(v) => handleStatusFilter(v as StatusKey)}>
              <SelectTrigger className="h-9 w-full sm:w-[160px] rounded-lg bg-slate-50 border-none text-[11px] font-bold text-slate-500">
                <div className="flex items-center gap-2">
                  <Filter className="h-3 w-3" />
                  <SelectValue placeholder="Status" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                <SelectItem value="all"     className="text-xs font-semibold">Semua Status</SelectItem>
                <SelectItem value="SUCCESS" className="text-xs font-semibold">✅ Berhasil</SelectItem>
                <SelectItem value="FAILED"  className="text-xs font-semibold">❌ Gagal</SelectItem>
                <SelectItem value="RUNNING" className="text-xs font-semibold">🔵 Berlangsung</SelectItem>
                <SelectItem value="PENDING" className="text-xs font-semibold">⏳ Menunggu</SelectItem>
              </SelectContent>
            </Select>

            {/* Source filter */}
            <Select value={sourceFilter} onValueChange={(v) => handleSourceFilter(v as SourceKey)}>
              <SelectTrigger className="h-9 w-full sm:w-[150px] rounded-lg bg-slate-50 border-none text-[11px] font-bold text-slate-500">
                <div className="flex items-center gap-2">
                  <Activity className="h-3 w-3" />
                  <SelectValue placeholder="Sumber" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                <SelectItem value="all"        className="text-xs font-semibold">Semua Sumber</SelectItem>
                <SelectItem value="SCHEDULER"  className="text-xs font-semibold">🤖 Scheduler</SelectItem>
                <SelectItem value="ENROLLMENT" className="text-xs font-semibold">🎓 Enrollment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active filter chips */}
          {(statusFilter !== "all" || sourceFilter !== "all" || search) && (
            <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-slate-50">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Filter aktif:</span>
              {search && (
                <Badge variant="outline" className="text-[10px] font-bold bg-white cursor-pointer" onClick={() => handleSearchChange("")}>
                  &quot;{search}&quot; ×
                </Badge>
              )}
              {statusFilter !== "all" && (
                <Badge variant="outline" className="text-[10px] font-bold bg-white cursor-pointer" onClick={() => handleStatusFilter("all")}>
                  {statusFilter} ×
                </Badge>
              )}
              {sourceFilter !== "all" && (
                <Badge variant="outline" className="text-[10px] font-bold bg-white cursor-pointer" onClick={() => handleSourceFilter("all")}>
                  {sourceFilter} ×
                </Badge>
              )}
              <button
                onClick={() => { handleSearchChange(""); handleStatusFilter("all"); handleSourceFilter("all"); }}
                className="ml-auto text-[10px] font-bold text-rose-500 hover:text-rose-700"
              >
                Reset semua
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="rounded-xl border-slate-100 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/70">
            <TableRow className="border-slate-100 hover:bg-transparent">
              <TableHead className="w-[130px] text-[10px] font-black uppercase tracking-wider text-slate-400 pl-4">Waktu</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400">Tugas</TableHead>
              <TableHead className="w-[110px] text-[10px] font-black uppercase tracking-wider text-slate-400 text-center">Status</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-wider text-slate-400">Pesan</TableHead>
              <TableHead className="w-[90px] text-[10px] font-black uppercase tracking-wider text-slate-400 text-right pr-4">Durasi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-48">
                  <EmptyState
                    title="Tidak Ada Log"
                    description="Tidak ada riwayat yang sesuai dengan filter yang dipilih."
                    action={
                      <Button variant="outline" size="sm" className="text-xs" onClick={() => { handleSearchChange(""); handleStatusFilter("all"); handleSourceFilter("all"); }}>
                        Reset Filter
                      </Button>
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              paginatedLogs.map((log) => {
                const date = log.createdAtDate;
                const status = log.filterStatus;
                const isFailed = status === "FAILED";

                return (
                  <TableRow
                    key={log.id}
                    className={cn(
                      "group border-slate-50 transition-colors",
                      isFailed && "bg-rose-50/30 hover:bg-rose-50/50"
                    )}
                  >
                    {/* Waktu */}
                    <TableCell className="py-2.5 pl-4">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "h-7 w-7 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                          isFailed ? "bg-rose-100 text-rose-500" : "bg-slate-100 text-slate-400 group-hover:bg-[#0F1C3F]/5 group-hover:text-[#0F1C3F]"
                        )}>
                          <Calendar className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-slate-800 leading-none">
                            {date.toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                          </p>
                          <p className="text-[10px] font-medium text-slate-400 mt-0.5 leading-none">
                            {date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Tugas */}
                    <TableCell className="py-2.5">
                      <div className="flex flex-col gap-1">
                        <span className="text-[11px] font-bold text-[#0F1C3F] leading-tight">
                          {JOB_LABELS[log.jobKey] || log.jobKey}
                        </span>
                        {log.source && (
                          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                            {log.source}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell className="py-2.5 text-center">
                      <StatusPill status={status} />
                    </TableCell>

                    {/* Pesan */}
                    <TableCell className="py-2.5">
                      <div className="flex items-start gap-1.5 max-w-sm">
                        {log.failedRecipients && (
                          <FileJson className="h-3 w-3 mt-0.5 text-rose-500 shrink-0" />
                        )}
                        <p className={cn(
                          "text-[11px] leading-relaxed line-clamp-2",
                          isFailed ? "text-rose-700 font-medium" : "text-slate-500 font-medium"
                        )}>
                          {log.message || "Eksekusi berjalan normal."}
                        </p>
                      </div>
                    </TableCell>

                    {/* Durasi */}
                    <TableCell className="py-2.5 text-right pr-4">
                      {log.duration !== null ? (
                        <span className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border",
                          log.duration > 5000
                            ? "bg-amber-50 text-amber-700 border-amber-100"
                            : "bg-slate-50 text-slate-500 border-slate-100 group-hover:border-slate-200"
                        )}>
                          <Clock className="h-2.5 w-2.5" />
                          {log.duration > 1000 ? `${(log.duration / 1000).toFixed(1)}s` : `${log.duration}ms`}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-300">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={safePage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredLogs.length}
            itemsPerPage={ITEMS_PER_PAGE}
            itemLabel="log"
          />
        </div>
      )}
    </div>
  );
}
