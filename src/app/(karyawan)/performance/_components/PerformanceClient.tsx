"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Pagination } from "@/components/admin/Pagination";

interface CourseAnalysisItem {
  id: string;
  title: string;
  category: string;
  status: string;
  progress: number;
  preScore: number | null;
  postScore: number | null;
  lastAttempt: string | null;
}

interface PerformanceClientProps {
  courseAnalysis: CourseAnalysisItem[];
}

export function PerformanceClient({ courseAnalysis }: PerformanceClientProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const totalPages = Math.ceil(courseAnalysis.length / itemsPerPage);
  const paginatedCourses = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return courseAnalysis.slice(startIndex, startIndex + itemsPerPage);
  }, [courseAnalysis, currentPage, itemsPerPage]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Analisis Kompetensi Kursus</h2>
        <Badge variant="outline" className="text-slate-700">
          {courseAnalysis.length} kursus
        </Badge>
      </div>

      <div className="space-y-3">
        {paginatedCourses.map((course) => {
          const statusMap: Record<string, { label: string; className: string }> = {
            COMPLETED: { label: "Selesai", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
            FAILED: { label: "Gagal", className: "bg-rose-50 text-rose-700 border-rose-200" },
            CHEATING: { label: "Kecurangan", className: "bg-rose-600 text-white border-transparent" },
            IN_PROGRESS: { label: "Berjalan", className: "bg-blue-50 text-blue-700 border-blue-200" },
          };
          const status = statusMap[course.status] ?? statusMap.IN_PROGRESS;

          return (
            <Card key={course.id} className="border shadow-sm rounded-lg bg-white hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-5">

                  {/* Title + status */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="text-xs">
                        {course.category}
                      </Badge>
                      <Badge className={cn("text-xs", status.className)}>
                        {status.label}
                      </Badge>
                    </div>
                    <p className="font-semibold text-sm leading-snug line-clamp-1 text-slate-900">{course.title}</p>
                    {course.lastAttempt && (
                      <p className="text-xs text-slate-500">
                        {new Date(course.lastAttempt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    )}
                  </div>

                  <Separator orientation="vertical" className="hidden sm:block h-14" />

                  {/* Progress */}
                  <div className="sm:w-36 space-y-2">
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Progres Modul</span>
                      <span className="font-semibold">{course.progress}%</span>
                    </div>
                    <Progress value={course.progress} className="h-2" />
                  </div>

                  <Separator orientation="vertical" className="hidden sm:block h-14" />

                  {/* Scores */}
                  <div className="flex items-center gap-4">
                    <div className="text-center bg-slate-50 p-2 rounded-lg min-w-[50px] border">
                      <p className="text-xs text-slate-500 mb-1">Pre</p>
                      <p className="text-sm font-semibold tabular-nums text-slate-700">
                        {course.preScore !== null ? `${Math.round(course.preScore)}%` : "—"}
                      </p>
                    </div>
                    <div className="text-slate-300">→</div>
                    <div className="text-center bg-slate-50 p-2 rounded-lg min-w-[50px] border">
                      <p className="text-xs text-slate-500 mb-1">Post</p>
                      <p className="text-sm font-semibold tabular-nums text-slate-700">
                        {course.postScore !== null ? `${Math.round(course.postScore)}%` : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={courseAnalysis.length}
          itemsPerPage={itemsPerPage}
          itemLabel="kursus"
        />
      )}
    </div>
  );
}
