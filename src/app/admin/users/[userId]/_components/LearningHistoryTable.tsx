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

// Re-export EnrollmentWithProgress as EnrollmentRow for type compatibility
export interface LearningHistoryTableProps {
  enrollments: {
    id: string;
    courseId: string;
    status: string;
    createdAt: Date | string;
    enrolledAt?: Date | string;
    moduleProgress: number;
    completedModules: number;
    totalModules: number;
    preScore: number | null;
    preTestPassed: boolean | null;
    postScore: number | null;
    postTestPassed: boolean | null;
    course: { title: string };
    modules?: any[];
    testAttempts?: any[];
  }[];
}

// Helper to get course data from EnrollmentWithProgress
function getCourseTitle(e: LearningHistoryTableProps["enrollments"][number]): string {
  return e.course?.title ?? "Kursus Tidak Diketahui";
}

function getEnrolledAt(e: LearningHistoryTableProps["enrollments"][number]): Date {
  return new Date(e.enrolledAt ?? e.createdAt);
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
  const [selectedEnrollment, setSelectedEnrollment] = useState<LearningHistoryTableProps["enrollments"][number] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filtered = enrollments.filter((e) =>
    getCourseTitle(e).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card
      className="overflow-hidden rounded-xl border border-[#E4E7EC] bg-white shadow-sm font-sans"
    >
      <CardHeader className="flex flex-col gap-4 border-b border-[#E4E7EC] px-5 py-4 md:flex-row md:items-center md:justify-between bg-[#F8F9FB]">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0F1C3F] shadow-sm">
            <Layers className="h-4 w-4 text-[#E8A020]" />
          </div>
          <div>
            <CardTitle className="text-base font-bold tracking-tight text-[#101828] font-lexend">
              Riwayat Kursus
            </CardTitle>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#475467] mt-0.5">
              Progress modul & nilai tes
            </p>
          </div>
        </div>
        <div className="relative w-full md:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98A2B3]" />
          <input
            id="history-search"
            name="search"
            aria-label="Cari judul kursus"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari judul kursus..."
            className="h-10 w-full rounded-lg pl-9 pr-3 text-sm font-medium outline-none transition-all border border-[#E4E7EC] bg-white text-[#101828] placeholder:text-[#98A2B3] focus:border-[#0F1C3F] focus:ring-1 focus:ring-[#0F1C3F]"
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
            <div className="rounded-xl p-4 bg-[#F8F9FB] border border-[#E4E7EC]">
              <Search className="h-6 w-6 text-[#98A2B3]" />
            </div>
            <p className="font-bold text-[#101828] font-lexend mt-2">Tidak ada riwayat yang cocok</p>
            <p className="text-[13px] text-[#475467] font-medium">Silakan sesuaikan kata kunci pencarian Anda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E4E7EC] bg-[#F8F9FB]">
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-[#475467] font-lexend">
                    Judul kursus
                  </th>
                  <th className="px-4 py-3.5 text-center text-[11px] font-bold uppercase tracking-wider text-[#475467] font-lexend">
                    Status
                  </th>
                  <th className="px-4 py-3.5 text-center text-[11px] font-bold uppercase tracking-wider text-[#475467] font-lexend">
                    Progress modul
                  </th>
                  <th className="px-4 py-3.5 text-center text-[11px] font-bold uppercase tracking-wider text-[#475467] font-lexend">
                    Pre-test
                  </th>
                  <th className="px-4 py-3.5 text-center text-[11px] font-bold uppercase tracking-wider text-[#475467] font-lexend">
                    Post-test
                  </th>
                  <th className="px-5 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-[#475467] font-lexend">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E7EC]">
                {filtered.map((e) => (
                  <tr key={e.id} className="group transition-colors hover:bg-[#F8F9FB] border-none">
                    <td className="px-5 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-[#101828] transition-colors group-hover:text-[#0F1C3F] font-lexend">
                          {getCourseTitle(e)}
                        </span>
                        <span className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-[#475467]">
                          <Calendar className="h-3.5 w-3.5" />
                          Daftar:{" "}
                          {getEnrolledAt(e).toLocaleDateString("id-ID", {
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
                          <Badge className="border-none bg-[#ECFDF3] text-[11px] font-bold uppercase tracking-wider text-[#027A48] shadow-none">
                            Selesai
                          </Badge>
                        ) : e.status === "FAILED" ? (
                          <Badge className="border-none bg-[#FEF3F2] text-[11px] font-bold uppercase tracking-wider text-[#B42318] shadow-none">
                            Gagal
                          </Badge>
                        ) : (
                          <Badge className="border-none bg-[#EFF8FF] text-[11px] font-bold uppercase tracking-wider text-[#175CD3] shadow-none">
                            Berjalan
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="mx-auto flex min-w-[104px] max-w-[140px] flex-col items-center gap-2">
                        <div className="h-2 w-full overflow-hidden rounded-full bg-[#E4E7EC]">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${e.moduleProgress}%`,
                              background:
                                e.moduleProgress === 100 ? "#12B76A" : "#0F1C3F",
                            }}
                          />
                        </div>
                        <span className="text-center text-[11px] font-medium text-[#475467]">
                          {e.completedModules}/{e.totalModules} ({e.moduleProgress}%)
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {e.preScore !== null ? (
                        <span className="text-sm font-bold text-[#101828]">{e.preScore}</span>
                      ) : (
                        <span className="font-medium text-[#98A2B3]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {e.postScore !== null ? (
                        <div className="flex flex-col items-center">
                          <span
                            className={cn(
                              "text-sm font-bold leading-none",
                              e.postTestPassed ? "text-[#027A48]" : "text-[#B42318]"
                            )}
                          >
                            {e.postScore}
                          </span>
                          <span
                            className={cn(
                              "mt-1 text-[10px] font-bold uppercase tracking-wider",
                              e.postTestPassed ? "text-[#12B76A]" : "text-[#F04438]"
                            )}
                          >
                            {e.postTestPassed ? "Lulus" : "Tidak lulus"}
                          </span>
                        </div>
                      ) : (
                        <span className="font-medium text-[#98A2B3]">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-lg text-[#475467] hover:bg-[#F8F9FB] hover:text-[#0F1C3F]"
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
