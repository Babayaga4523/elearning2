"use client";

import { useState } from "react";
import { Eye, Search, Calendar, Layers } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

const surface = {
  card: {
    background: "white",
    border: "1px solid #E2E6F0",
    boxShadow: "0 1px 4px rgba(15,28,63,0.06)",
  },
  input: {
    background: "#F8FAFC",
    border: "1px solid #E8ECF5",
    color: "#0F1C3F",
  },
};

export function LearningHistoryTable({ enrollments }: LearningHistoryTableProps) {
  const [search, setSearch] = useState("");
  const [selectedEnrollment, setSelectedEnrollment] = useState<EnrollmentRow | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filtered = enrollments.filter((e) =>
    e.courseTitle.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card
      className="overflow-hidden rounded-2xl border-0 shadow-none"
      style={surface.card}
    >
      <CardHeader className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
            style={{
              background: "linear-gradient(135deg, #0F1C3F, #1A3060)",
              boxShadow: "0 2px 8px rgba(15,28,63,0.2)",
            }}
          >
            <Layers className="h-4 w-4" style={{ color: "#E8A020" }} />
          </div>
          <div>
            <CardTitle
              className="text-base font-black tracking-tight text-slate-900 md:text-lg"
              style={{ fontFamily: "'Lexend Deca', sans-serif" }}
            >
              Riwayat kursus
            </CardTitle>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Progress modul & nilai tes
            </p>
          </div>
        </div>
        <div className="relative w-full md:max-w-xs">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
            style={{ color: "#B0BAD0" }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari judul kursus..."
            className="h-10 w-full rounded-xl pl-9 pr-3 text-sm font-medium outline-none transition-all focus:ring-2 focus:ring-[#0F1C3F]/15"
            style={surface.input}
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
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="rounded-full p-5" style={{ background: "#F0F2F7" }}>
              <Search className="h-8 w-8" style={{ color: "#C5CEDF" }} />
            </div>
            <p className="font-bold text-slate-600">Tidak ada riwayat yang cocok.</p>
            <p className="text-sm text-slate-400">Sesuaikan kata kunci pencarian.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-5 py-3.5 text-left text-xs font-black uppercase tracking-wider text-slate-500">
                    Judul kursus
                  </th>
                  <th className="px-4 py-3.5 text-center text-xs font-black uppercase tracking-wider text-slate-500">
                    Status
                  </th>
                  <th className="px-4 py-3.5 text-center text-xs font-black uppercase tracking-wider text-slate-500">
                    Progress modul
                  </th>
                  <th className="px-4 py-3.5 text-center text-xs font-black uppercase tracking-wider text-slate-500">
                    Pre-test
                  </th>
                  <th className="px-4 py-3.5 text-center text-xs font-black uppercase tracking-wider text-slate-500">
                    Post-test
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-black uppercase tracking-wider text-slate-500">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((e) => (
                  <tr key={e.id} className="group transition-colors hover:bg-slate-50/80">
                    <td className="px-5 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-800 transition-colors group-hover:text-[#0F1C3F]">
                          {e.courseTitle}
                        </span>
                        <span className="mt-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          <Calendar className="h-3 w-3" />
                          Daftar:{" "}
                          {new Date(e.enrolledAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex justify-center">
                        {e.status === "COMPLETED" ? (
                          <Badge className="border-0 bg-emerald-50 text-[10px] font-black uppercase tracking-wide text-emerald-700">
                            Selesai
                          </Badge>
                        ) : e.status === "FAILED" ? (
                          <Badge className="border-0 bg-rose-50 text-[10px] font-black uppercase tracking-wide text-rose-700">
                            Gagal
                          </Badge>
                        ) : (
                          <Badge className="border-0 bg-slate-100 text-[10px] font-black uppercase tracking-wide text-slate-700">
                            Berjalan
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="mx-auto flex min-w-[104px] max-w-[140px] flex-col items-center gap-1.5">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${e.moduleProgress}%`,
                              background:
                                e.moduleProgress === 100 ? "#059669" : "#0F1C3F",
                            }}
                          />
                        </div>
                        <span className="text-center text-[10px] font-bold text-slate-500">
                          {e.completedModulesCount}/{e.totalModulesCount} ({e.moduleProgress}%)
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {e.preScore !== null ? (
                        <span className="text-base font-black text-slate-800">{e.preScore}</span>
                      ) : (
                        <span className="font-medium text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {e.postScore !== null ? (
                        <div className="flex flex-col items-center">
                          <span
                            className={cn(
                              "text-base font-black leading-none",
                              e.postPassed ? "text-emerald-600" : "text-rose-600"
                            )}
                          >
                            {e.postScore}
                          </span>
                          <span
                            className={cn(
                              "mt-1 text-[9px] font-black uppercase",
                              e.postPassed ? "text-emerald-500" : "text-rose-500"
                            )}
                          >
                            {e.postPassed ? "Lulus" : "Tidak lulus"}
                          </span>
                        </div>
                      ) : (
                        <span className="font-medium text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-lg text-slate-400 hover:bg-[#EEF2FF] hover:text-[#0F1C3F]"
                        title="Detail progress"
                        onClick={() => {
                          setSelectedEnrollment(e);
                          setIsModalOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
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
