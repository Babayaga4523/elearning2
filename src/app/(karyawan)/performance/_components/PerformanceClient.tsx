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

/* ─── Status Badge ────────────────────────────────────────────────── */
const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  COMPLETED: {
    label: "Selesai",
    className: "bg-[#ECFDF3] text-[#027A48] border-[#6CE9A6]",
  },
  FAILED: {
    label: "Gagal",
    className: "bg-[#FEF3F2] text-[#B42318] border-[#FDA29B]",
  },
  IN_PROGRESS: {
    label: "Berlangsung",
    className: "bg-[#EFF8FF] text-[#175CD3] border-[#B2DDFF]",
  },
};

/* ─── Course Analysis Row ─────────────────────────────────────────────── */
function CourseAnalysisRow({ course }: { course: CourseAnalysisItem }) {
  const status = STATUS_CONFIG[course.status] ?? STATUS_CONFIG.IN_PROGRESS;
  
  const borderAccent = course.status === "COMPLETED" 
    ? "border-l-4 border-l-[#12B76A]" 
    : course.status === "FAILED" 
    ? "border-l-4 border-l-[#F04438]" 
    : "border-l-4 border-l-[#E8A020]";

  return (
    <div className={cn(
      "flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border border-[#E4E7EC] active:scale-[0.99] transition-all duration-300 bg-white",
      borderAccent
    )}>
      {/* Left: title + badges */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant="outline"
            className="text-[10px] font-bold font-['DM_Sans'] text-[#64748B] border-[#E4E7EC] bg-[#F8F9FB] uppercase tracking-wide px-2 py-0.5"
          >
            {course.category}
          </Badge>
          <Badge
            className={cn(
              "text-[10px] font-bold font-['DM_Sans'] border uppercase tracking-wide px-2 py-0.5",
              status.className
            )}
          >
            {status.label}
          </Badge>
        </div>
        <p className="text-sm font-bold text-[#0F1C3F] font-['DM_Sans'] leading-snug line-clamp-1">
          {course.title}
        </p>
        {course.lastAttempt && (
          <p className="text-[10px] font-bold text-[#94A3B8] font-['DM_Sans']">
            Aktivitas Terakhir: {" "}
            {new Date(course.lastAttempt).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        )}
      </div>

      {/* Divider */}
      <Separator className="hidden sm:block h-10 w-px bg-[#E4E7EC]" />

      {/* Progress */}
      <div className="sm:w-36 space-y-1.5">
        <div className="flex justify-between text-xs text-[#64748B] font-['DM_Sans']">
          <span className="font-bold">Progress</span>
          <span className="font-extrabold text-[#101828]">{course.progress}%</span>
        </div>
        <div className="h-1.5 bg-[#F1F3F7] rounded-full overflow-hidden border border-[#E4E7EC]/10">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              course.progress === 100
                ? "bg-gradient-to-r from-[#12B76A] to-[#027A48]"
                : "bg-gradient-to-r from-[#E8A020] to-[#F5C05A]"
            )}
            style={{ width: `${course.progress}%` }}
          />
        </div>
      </div>

      {/* Divider */}
      <Separator className="hidden sm:block h-10 w-px bg-[#E4E7EC]" />

      {/* Scores */}
      <div className="flex items-center gap-3">
        {/* Pre score */}
        <div className="text-center min-w-[56px]">
          <p className="text-[9px] font-bold text-[#98A2B3] font-['DM_Sans'] mb-1 uppercase tracking-widest">
            Pre-Test
          </p>
          <div
            className={cn(
              "px-2.5 py-1.5 rounded-xl border text-xs font-extrabold font-['Lexend_Deca'] leading-none text-center shadow-sm",
              course.preScore !== null
                ? course.preScore >= 70
                  ? "bg-[#ECFDF3] text-[#027A48] border-[#6CE9A6]"
                  : "bg-[#FEF3F2] text-[#B42318] border-[#FDA29B]"
                : "bg-[#F8F9FB] text-[#98A2B3] border-[#E4E7EC]"
            )}
          >
            {course.preScore !== null ? `${Math.round(course.preScore)}%` : "—"}
          </div>
        </div>

        {/* Arrow */}
        <span className="text-[#98A2B3] text-xs font-bold">→</span>

        {/* Post score */}
        <div className="text-center min-w-[56px]">
          <p className="text-[9px] font-bold text-[#98A2B3] font-['DM_Sans'] mb-1 uppercase tracking-widest">
            Post-Test
          </p>
          <div
            className={cn(
              "px-2.5 py-1.5 rounded-xl border text-xs font-extrabold font-['Lexend_Deca'] leading-none text-center shadow-sm",
              course.postScore !== null
                ? course.postScore >= 70
                  ? "bg-[#ECFDF3] text-[#027A48] border-[#6CE9A6]"
                  : "bg-[#FEF3F2] text-[#B42318] border-[#FDA29B]"
                : "bg-[#F8F9FB] text-[#98A2B3] border-[#E4E7EC]"
            )}
          >
            {course.postScore !== null ? `${Math.round(course.postScore)}%` : "—"}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   PERFORMANCE CLIENT — Course Analysis Table
═══════════════════════════════════════════════════════════════════════ */
export function PerformanceClient({
  courseAnalysis,
}: {
  courseAnalysis: CourseAnalysisItem[];
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const totalPages = Math.ceil(courseAnalysis.length / itemsPerPage);
  const paginatedCourses = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return courseAnalysis.slice(start, start + itemsPerPage);
  }, [courseAnalysis, currentPage]);

  return (
    <div className="space-y-4">
      {/* Table header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#EFF8FF] flex items-center justify-center">
            <span className="text-[10px] font-bold text-[#175CD3]">📊</span>
          </div>
          <h3 className="text-sm font-semibold text-[#101828] font-['Lexend_Deca']">
            Analisis Kompetensi
          </h3>
        </div>
        <Badge
          variant="outline"
          className="text-xs font-semibold font-['DM_Sans'] text-[#475467] border-[#E4E7EC] bg-[#F8F9FB]"
        >
          {courseAnalysis.length} kursus
        </Badge>
      </div>

      {/* Rows */}
      {paginatedCourses.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-[#98A2B3] font-['DM_Sans']">
            Belum ada data kursus.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {paginatedCourses.map((course) => (
            <CourseAnalysisRow key={course.id} course={course} />
          ))}
        </div>
      )}

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