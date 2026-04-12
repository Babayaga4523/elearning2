"use client";

import { useState } from "react";
import { 
  Activity, 
  Search, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  FileJson,
  Calendar
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface LogEntry {
  id: string;
  jobName: string;
  status: string;
  message: string | null;
  duration: number | null;
  createdAt: Date;
  failedRecipients: any;
}

interface LogsClientProps {
  logs: LogEntry[];
}

const JOB_LABELS: Record<string, string> = {
  "REPORTING": "Laporan Mingguan",
  "REMINDERS": "Pengingat Deadline (H-7/3/1)",
  "AUTO_ENROLL": "Pendaftaran Otomatis",
  "MANUAL_POKE": "Colekan Admin (Manual)",
};

const JOB_COLORS: Record<string, string> = {
  "REPORTING": "bg-indigo-50 text-indigo-700 border-indigo-200",
  "REMINDERS": "bg-blue-50 text-blue-700 border-blue-200",
  "AUTO_ENROLL": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "MANUAL_POKE": "bg-amber-50 text-amber-700 border-amber-200",
};

export function LogsClient({ logs }: LogsClientProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "SUCCESS" | "FAILED">("all");

  const filteredLogs = logs.filter((log) => {
    const jobKey = log.jobName.toUpperCase();
    const jobLabel = JOB_LABELS[jobKey] || jobKey;
    const matchSearch = jobLabel.toLowerCase().includes(search.toLowerCase()) || 
                      (log.message?.toLowerCase() || "").includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || log.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 text-slate-400">
            System Diagnostics
          </p>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900" style={{ fontFamily: "'Lexend Deca', sans-serif" }}>
            Audit Log Sistem
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-0.5">
            Pantau riwayat eksekusi cron job dan aktivitas otomatis secara real-time.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm text-center min-w-[100px]">
             <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Total Log</p>
             <p className="text-lg font-black text-slate-900 leading-none mt-1">{logs.length}</p>
          </div>
          <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm text-center min-w-[100px]">
             <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Errors</p>
             <p className="text-lg font-black text-rose-600 leading-none mt-1">{logs.filter(l => l.status === "FAILED").length}</p>
          </div>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="flex flex-col md:flex-row gap-3 p-2 bg-white rounded-3xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
          <input 
            placeholder="Cari nama tugas atau pesan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-11 pr-4 rounded-xl text-sm font-medium bg-slate-50/50 outline-none focus:ring-2 ring-primary/10 transition-all border-none"
          />
        </div>
        <div className="flex items-center gap-1 p-1 bg-slate-100/50 rounded-xl">
           {(["all", "SUCCESS", "FAILED"] as const).map((s) => (
             <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "px-5 h-8 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                statusFilter === s ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
             >
               {s === "all" ? "Semua Status" : s}
             </button>
           ))}
        </div>
      </div>

      {/* ── table ── */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-bottom border-slate-200">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Waktu Eksekusi</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Nama Tugas</th>
                <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-center text-slate-400">Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Ringkasan & Pesan</th>
                <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-center text-slate-400">Durasi (ms)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                   <td colSpan={5} className="py-20 text-center">
                      <Activity className="h-10 w-10 text-slate-100 mx-auto mb-3" />
                      <p className="text-sm font-bold text-slate-400">Tidak ada log sistem yang ditemukan.</p>
                   </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const date = new Date(log.createdAt);
                  return (
                    <tr key={log.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                           <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                              <Calendar className="h-4 w-4" />
                           </div>
                           <div>
                              <p className="text-xs font-black text-slate-700">
                                {date.toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}
                              </p>
                              <p className="text-[10px] font-bold text-slate-400">
                                {date.toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })}
                              </p>
                           </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={cn("font-black text-[9px] uppercase tracking-tighter border", JOB_COLORS[log.jobName] || "bg-slate-50")}>
                          {JOB_LABELS[log.jobName] || log.jobName}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                         <div className="flex justify-center">
                            {log.status === "SUCCESS" ? (
                              <div className="flex items-center gap-1.5 text-emerald-600">
                                <CheckCircle2 className="h-4 w-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">OK</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-rose-600">
                                <XCircle className="h-4 w-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">FAIL</span>
                              </div>
                            )}
                         </div>
                      </td>
                      <td className="px-6 py-4 min-w-[300px]">
                         <div className="flex items-start gap-2">
                           {log.failedRecipients && (
                             <FileJson className="h-3 w-3 mt-0.5 text-rose-400 shrink-0" />
                           )}
                           <p className="text-xs font-medium text-slate-600 line-clamp-2">
                             {log.message || "Tidak ada detail pesan."}
                           </p>
                         </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                         <div className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-lg text-slate-500">
                            <Clock className="h-3 w-3" />
                            <span className="text-[10px] font-black">{log.duration ? `${log.duration}ms` : "-"}</span>
                         </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
