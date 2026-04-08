"use client";

import { useState } from "react";
import { 
  Eye, 
  Search, 
  MapPin, 
  Calendar, 
  Layers, 
  CheckCircle2, 
  AlertCircle,
  MoreVertical
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CourseProgressModal } from "./CourseProgressModal";

interface EnrollmentRow {
  id: string;
  courseId: string;
  courseTitle: string;
  status: string;
  enrolledAt: string;
  moduleProgress: number;
  completedModulesCount: number;
  totalModulesCount: number;
  preScore: number | null;
  postScore: number | null;
  postPassed: boolean | null;
  modules: any[];
  testAttempts: any[];
}

interface LearningHistoryTableProps {
  enrollments: EnrollmentRow[];
}

export function LearningHistoryTable({ enrollments }: LearningHistoryTableProps) {
  const [search, setSearch] = useState("");
  const [selectedEnrollment, setSelectedEnrollment] = useState<EnrollmentRow | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filtered = enrollments.filter(e => 
    e.courseTitle.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card className="border-slate-200 shadow-sm overflow-hidden bg-white rounded-3xl">
      <CardHeader className="border-b border-slate-100 py-6 px-8 flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-slate-100 rounded-xl flex items-center justify-center">
            <Layers className="h-5 w-5 text-slate-500" />
          </div>
          <CardTitle className="text-xl font-black text-slate-800 tracking-tight">Riwayat Kursus</CardTitle>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
          <input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kursus..."
            className="w-full pl-9 pr-4 h-10 bg-slate-50 border-none rounded-xl text-xs font-bold placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <CourseProgressModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          enrollment={selectedEnrollment}
        />

        {filtered.length === 0 ? (
          <div className="p-20 text-center">
            <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-slate-100" />
            </div>
            <p className="text-slate-400 font-bold">Tidak ada riwayat kursus ditemukan.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="text-left px-8 py-4 font-black text-[11px] text-slate-400 uppercase tracking-wider">Judul Kursus</th>
                  <th className="text-center px-6 py-4 font-black text-[11px] text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="text-center px-6 py-4 font-black text-[11px] text-slate-400 uppercase tracking-wider">Progress Modul</th>
                  <th className="text-center px-6 py-4 font-black text-[11px] text-slate-400 uppercase tracking-wider">Pre-Test</th>
                  <th className="text-center px-6 py-4 font-black text-[11px] text-slate-400 uppercase tracking-wider">Post-Test</th>
                  <th className="text-center px-8 py-4 font-black text-[11px] text-slate-400 uppercase tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((e) => (
                  <tr key={e.id} className="group hover:bg-slate-50/40 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-800 text-sm group-hover:text-primary transition-colors">{e.courseTitle}</span>
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mt-1 uppercase tracking-tighter">
                          <Calendar className="h-3 w-3" />
                          Daftar: {new Date(e.enrolledAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex justify-center">
                        {e.status === "COMPLETED" ? (
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none font-black text-[10px] uppercase tracking-wider px-2.5">
                            Lulus
                          </Badge>
                        ) : e.status === "FAILED" ? (
                          <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-none font-black text-[10px] uppercase tracking-wider px-2.5">
                            Gagal
                          </Badge>
                        ) : (
                          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none font-black text-[10px] uppercase tracking-wider px-2.5">
                            Berjalan
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col items-center gap-1.5 min-w-[100px]">
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
                          <div 
                            className={cn(
                              "h-full rounded-full transition-all duration-500 shadow-sm",
                              e.moduleProgress === 100 ? "bg-emerald-500" : "bg-primary"
                            )}
                            style={{ width: `${e.moduleProgress}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                          {e.completedModulesCount} / {e.totalModulesCount} Modul ({e.moduleProgress}%)
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      {e.preScore !== null ? (
                        <span className="font-black text-slate-700 text-base">{e.preScore}</span>
                      ) : (
                        <span className="italic text-slate-300 font-medium">—</span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-center">
                      {e.postScore !== null ? (
                        <div className="flex flex-col items-center">
                          <span className={cn(
                            "font-black text-base leading-none",
                            e.postPassed ? "text-emerald-600" : "text-rose-600"
                          )}>
                            {e.postScore}
                          </span>
                          <span className={cn(
                            "text-[9px] font-black uppercase mt-1",
                            e.postPassed ? "text-emerald-400" : "text-rose-400"
                          )}>
                            {e.postPassed ? "Lulus" : "Tidak Lulus"}
                          </span>
                        </div>
                      ) : (
                        <span className="italic text-slate-300 font-medium">—</span>
                      )}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button 
                        onClick={() => {
                          setSelectedEnrollment(e);
                          setIsModalOpen(true);
                        }}
                        className="p-2.5 rounded-xl text-slate-300 hover:text-primary hover:bg-primary/5 transition-all shadow-sm border border-transparent hover:border-primary/10"
                        title="Tampilkan Detail Progress"
                      >
                        <Eye className="h-4.5 w-4.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
