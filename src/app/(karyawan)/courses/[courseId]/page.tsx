import React, { cloneElement, ReactElement } from "react";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import {
  BookOpen,
  CheckCircle2,
  Lock,
  PlayCircle,
  Trophy,
  Clock,
  ArrowLeft,
  ChevronRight,
  FileText,
  AlertCircle,
  Target,
  Layers,
  Sparkles,
  BarChart2,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EnrollButton } from "@/components/courses/enroll-button";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type UserProgress = { isCompleted: boolean };
type TestAttempt = { id: string, passed: boolean, cheated?: boolean };

type ModuleWithProgress = {
  id: string;
  title: string;
  type: string;
  position: number;
  isPublished: boolean;
  userProgress: UserProgress[];
};

type TestWithAttempts = {
  id: string;
  title: string;
  type: "PRE" | "POST";
  passingScore: number | null;
  duration: number;
  maxAttempts: number;
  attempts: TestAttempt[];
};

type Enrollment = {
  id: string;
  status: string;
};

type CourseDetail = {
  id: string;
  title: string;
  description: string | null;
  deadlineDate: Date | null;
  deadlineDuration: number | null;
  category: { name: string } | null;
  modules: ModuleWithProgress[];
  tests: TestWithAttempts[];
  enrollments: Enrollment[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDeadlineLabel(deadline: Date): string {
  const diffMs = deadline.getTime() - Date.now();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "Deadline Terlewat";
  if (diffDays === 0) return "Berakhir Hari Ini";
  return `${diffDays} Hari Lagi`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function StudentCourseDetailPage({
  params,
}: {
  params: { courseId: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const userId = session.user.id;

  const course = (await db.course.findUnique({
    where: { id: params.courseId, isPublished: true },
    include: {
      category: true,
      modules: {
        where: { isPublished: true },
        orderBy: { position: "asc" },
        include: { userProgress: { where: { userId } } },
      },
      tests: {
        include: {
          attempts: {
            where: { userId },
            orderBy: { createdAt: "desc" },
          },
        },
      },
      enrollments: { where: { userId } },
    },
  })) as CourseDetail | null;

  if (!course) redirect("/courses");

  const enrollment = course.enrollments[0] ?? null;

  const totalModules = course.modules.length;
  const completedModules = course.modules.filter(
    (m) => m.userProgress[0]?.isCompleted === true
  ).length;
  const progress =
    totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

  const preTest = course.tests.find((t) => t.type === "PRE") ?? null;
  const postTest = course.tests.find((t) => t.type === "POST") ?? null;

  const isEnrolled = !!enrollment;
  const isCompleted = enrollment?.status === "COMPLETED";

  const deadlineDays = course.deadlineDate
    ? formatDeadlineLabel(course.deadlineDate)
    : "Tanpa Batas";

  const isDeadlinePast =
    !!course.deadlineDate && course.deadlineDate.getTime() < Date.now();

  const isAllModulesCompleted =
    totalModules > 0 && completedModules === totalModules;

  const nextModuleId =
    course.modules.find((m) => !m.userProgress[0]?.isCompleted)?.id ??
    course.modules[0]?.id;
  
  const latestPreAttempt = preTest?.attempts[0];
  const preStatus = latestPreAttempt 
    ? latestPreAttempt.cheated 
      ? "KECURANGAN" as const 
      : latestPreAttempt.passed ? "LULUS" as const : "GAGAL" as const
    : null;

  const latestPostAttempt = postTest?.attempts[0];
  const postStatus = latestPostAttempt
    ? latestPostAttempt.cheated
      ? "KECURANGAN" as const
      : latestPostAttempt.passed ? "LULUS" as const : "GAGAL" as const
    : null;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen"
      style={{ background: "#F0F2F7", fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* ── Top Accent Bar ── */}
      <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #0F1C3F 0%, #E8A020 100%)" }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-24">

        {/* ── Breadcrumb ── */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-all group"
            style={{ color: "#5A6480" }}
          >
            <span
              className="flex items-center justify-center h-8 w-8 rounded-full border border-slate-300 group-hover:border-[#0F1C3F] group-hover:bg-[#0F1C3F] transition-all"
            >
              <ArrowLeft className="h-3.5 w-3.5 group-hover:text-white transition-colors" />
            </span>
            Katalog Kursus
          </Link>

          {!isEnrolled && (
            <div
              className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold"
              style={{
                background: "#FFF8E7",
                border: "1px solid #E8A020",
                color: "#B07D0C",
              }}
            >
              <Lock className="h-3.5 w-3.5" />
              Mode Pratinjau — Daftar untuk akses penuh
            </div>
          )}
        </div>

        {/* ── Hero Banner ── */}
        <div
          className="relative rounded-3xl overflow-hidden mb-8 shadow-2xl"
          style={{
            background: "linear-gradient(135deg, #0F1C3F 0%, #1A2E5A 60%, #0F2847 100%)",
          }}
        >
          {/* Decorative elements */}
          <div
            className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-10 pointer-events-none"
            style={{
              background: "radial-gradient(circle, #E8A020 0%, transparent 70%)",
              transform: "translate(30%, -30%)",
            }}
          />
          <div
            className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full opacity-5 pointer-events-none"
            style={{
              background: "radial-gradient(circle, #fff 0%, transparent 70%)",
              transform: "translate(-30%, 30%)",
            }}
          />

          {/* Grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, #fff 0px, transparent 1px, transparent 48px, #fff 49px), repeating-linear-gradient(90deg, #fff 0px, transparent 1px, transparent 48px, #fff 49px)",
              backgroundSize: "48px 48px",
            }}
          />

          <div className="relative z-10 p-8 md:p-12">
            <div className="flex flex-wrap items-center gap-3 mb-5">
              {course.category && (
                <span
                  className="text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full"
                  style={{
                    background: "rgba(232,160,32,0.15)",
                    border: "1px solid rgba(232,160,32,0.4)",
                    color: "#E8A020",
                  }}
                >
                  {course.category.name}
                </span>
              )}
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                #{course.id.slice(-8).toUpperCase()}
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-[2.75rem] font-black text-white leading-[1.1] tracking-tight max-w-3xl mb-4"
              style={{ fontFamily: "'Lexend Deca', 'DM Sans', sans-serif" }}
            >
              {course.title}
            </h1>

            {course.description && (
              <p className="text-slate-300 text-base md:text-lg leading-relaxed max-w-2xl font-medium mb-8 opacity-80">
                {course.description}
              </p>
            )}

            {/* Stat Pills */}
            <div className="flex flex-wrap gap-3">
              <HeroPill
                icon={<Layers className="h-4 w-4" style={{ color: "#7B9CFF" }} />}
                label="Materi"
                value={`${totalModules} Modul`}
              />
              <HeroPill
                icon={<FileText className="h-4 w-4" style={{ color: "#A5F3C0" }} />}
                label="Ujian"
                value={`${course.tests.length} Test`}
              />
              <HeroPill
                icon={<Target className="h-4 w-4" style={{ color: "#FBD38D" }} />}
                label="Passing Score"
                value={postTest?.passingScore ? `${postTest.passingScore}%` : "—"}
              />
              {course.deadlineDate && (
                <HeroPill
                  icon={<Clock className="h-4 w-4" style={{ color: isDeadlinePast ? "#FC8181" : "#A5F3C0" }} />}
                  label="Sisa Waktu"
                  value={deadlineDays}
                  valueStyle={isDeadlinePast ? { color: "#FC8181" } : {}}
                />
              )}
            </div>
          </div>
        </div>

        {/* ── Main Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          {/* ─── LEFT: Curriculum ─── */}
          <div className="lg:col-span-2 space-y-4">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-2 px-1">
              <div>
                <h2
                  className="text-xl font-black tracking-tight mb-0.5"
                  style={{ color: "#0F1C3F", fontFamily: "'Lexend Deca', sans-serif" }}
                >
                  Jalur Pembelajaran
                </h2>
                <p className="text-sm font-medium" style={{ color: "#7A8599" }}>
                  Selesaikan setiap tahap secara berurutan
                </p>
              </div>
              <div
                className="flex items-center gap-2 px-4 py-2 rounded-2xl text-[11px] font-black uppercase tracking-wider"
                style={{
                  background: "white",
                  border: "1px solid #E2E6F0",
                  color: "#0F1C3F",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                }}
              >
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: "#10B981" }}
                />
                {completedModules}/{totalModules} Selesai
              </div>
            </div>

            {/* Learning Path Items */}
            <div className="relative space-y-3">
              {/* Vertical timeline line */}
              <div
                className="absolute left-[42px] top-10 w-0.5 pointer-events-none"
                style={{
                  bottom: "3rem",
                  background: "linear-gradient(to bottom, #0F1C3F11 0%, #0F1C3F22 20%, #E8A02033 50%, #0F1C3F22 80%, #0F1C3F05 100%)",
                }}
              />

              {/* ── Pre-Test ── */}
              {preTest && (
                <LearningStep
                  href={
                    isEnrolled && !isDeadlinePast
                      ? preTest.attempts.length > 0
                        ? `/courses/${course.id}/tests/${preTest.id}/result?attemptId=${preTest.attempts[0].id}`
                        : `/courses/${course.id}/tests/${preTest.id}`
                      : null
                  }
                  locked={!isEnrolled || isDeadlinePast}
                  done={preTest.attempts.length > 0}
                  stepNumber="★"
                  type="PRE-TEST"
                  title={preTest.title}
                  action={preTest.attempts.length > 0 ? "Lihat Hasil" : "Mulai Ujian"}
                  meta={[
                    { icon: <Clock className="h-3.5 w-3.5" />, text: `${preTest.duration} Menit` },
                    {
                      icon: <Target className="h-3.5 w-3.5" />,
                      text: preTest.maxAttempts === 0 ? "Unlimited" : `${preTest.maxAttempts}× Percobaan`,
                    },
                  ]}
                  lockReason={isDeadlinePast ? "Batas waktu kursus telah berakhir." : undefined}
                  variant="pretest"
                  testStatus={preStatus}
                />
              )}

              {/* ── Modules ── */}
              {course.modules.map((module, index) => {
                const isDone = module.userProgress[0]?.isCompleted === true;
                return (
                  <LearningStep
                    key={module.id}
                    href={
                      isEnrolled && !isDeadlinePast
                        ? `/courses/${course.id}/modules/${module.id}`
                        : null
                    }
                    locked={!isEnrolled || isDeadlinePast}
                    done={isDone}
                    stepNumber={String(index + 1).padStart(2, "0")}
                    type={module.type === "VIDEO" ? "Video" : "Dokumen"}
                    title={module.title}
                    action={isDone ? "Ulangi Materi" : "Buka Materi"}
                    variant="module"
                    lockReason={isDeadlinePast ? "Batas waktu kursus telah berakhir." : undefined}
                  />
                );
              })}

              {/* ── Post-Test ── */}
              {postTest && (
                <LearningStep
                  href={
                    isEnrolled && isAllModulesCompleted && !isDeadlinePast
                      ? postTest.attempts.length > 0
                        ? `/courses/${course.id}/tests/${postTest.id}/result?attemptId=${postTest.attempts[0].id}`
                        : `/courses/${course.id}/tests/${postTest.id}`
                      : null
                  }
                  locked={!isAllModulesCompleted || !isEnrolled || isDeadlinePast}
                  done={postTest.attempts.length > 0}
                  stepNumber="🏆"
                  type="POST-TEST"
                  title={postTest.title}
                  action={postTest.attempts.length > 0 ? "Lihat Hasil" : "Ambil Ujian Akhir"}
                  meta={[
                    { icon: <Clock className="h-3.5 w-3.5" />, text: `${postTest.duration} Menit` },
                    { icon: <ShieldCheck className="h-3.5 w-3.5" />, text: `Skor Lulus: ${postTest.passingScore ?? 0}%` },
                  ]}
                  lockReason={
                    isDeadlinePast
                      ? "Batas waktu kursus telah berakhir."
                      : !isAllModulesCompleted
                      ? "Selesaikan semua modul untuk membuka ujian akhir"
                      : undefined
                  }
                  variant="posttest"
                  testStatus={postStatus}
                />
              )}
            </div>
          </div>

          {/* ─── RIGHT: Sidebar ─── */}
          <aside className="space-y-5 lg:sticky lg:top-8">

            {/* Control Center */}
            <div
              className="rounded-3xl overflow-hidden shadow-xl"
              style={{
                background: "white",
                border: "1px solid #E2E6F0",
              }}
            >
              {/* Gold header accent */}
              <div
                className="px-7 pt-6 pb-5"
                style={{
                  background: "linear-gradient(135deg, #0F1C3F 0%, #1A2E5A 100%)",
                }}
              >
                <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-3" style={{ color: "#E8A020" }}>
                  Progres Saya
                </p>

                {/* Circular Progress */}
                <div className="flex items-center gap-5">
                  <div className="relative h-20 w-20 shrink-0">
                    <svg className="h-20 w-20 -rotate-90" viewBox="0 0 72 72">
                      <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
                      <circle
                        cx="36"
                        cy="36"
                        r="30"
                        fill="none"
                        stroke="#E8A020"
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 30}`}
                        strokeDashoffset={`${2 * Math.PI * 30 * (1 - progress / 100)}`}
                        style={{ transition: "stroke-dashoffset 1s ease" }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className="text-xl font-black text-white leading-none">{progress}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-black text-white leading-none">
                      {completedModules}
                      <span className="text-base font-bold text-slate-400">/{totalModules}</span>
                    </p>
                    <p className="text-[11px] font-bold text-slate-400 mt-1">Modul Selesai</p>
                    {isCompleted && (
                      <span
                        className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider mt-2 px-2 py-1 rounded-lg"
                        style={{ background: "rgba(16,185,129,0.15)", color: "#34D399" }}
                      >
                        <Sparkles className="h-3 w-3" />
                        Lulus
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-px" style={{ background: "#E8ECF5" }}>
                <StatCell
                  label="Sisa Waktu"
                  value={deadlineDays}
                  valueStyle={isDeadlinePast ? { color: "#EF4444" } : { color: "#0F1C3F" }}
                />
                <StatCell
                  label="Passing Score"
                  value={`${postTest?.passingScore ?? 0}%`}
                />
                <StatCell
                  label="Pre-Test"
                  value={preTest?.attempts.length ? "✓ Selesai" : "Belum"}
                  valueStyle={preTest?.attempts.length ? { color: "#10B981" } : { color: "#94A3B8" }}
                />
                <StatCell
                  label="Post-Test"
                  value={postTest?.attempts.length ? "✓ Selesai" : "Belum"}
                  valueStyle={postTest?.attempts.length ? { color: "#10B981" } : { color: "#94A3B8" }}
                />
              </div>

              {/* CTA */}
              <div className="p-6">
                {!isEnrolled ? (
                  <EnrollButton courseId={course.id} />
                ) : isDeadlinePast ? (
                  <div
                    className="w-full h-14 rounded-2xl flex items-center justify-center gap-2 font-black text-[13px] px-1 opacity-80"
                    style={{ background: "#FEE2E2", border: "2px solid #FCA5A5", color: "#B91C1C" }}
                  >
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    KURSUS NON-AKTIF (DEADLINE TERLEWAT)
                  </div>
                ) : isCompleted ? (
                  <div
                    className="w-full h-14 rounded-2xl flex items-center justify-center gap-3 font-black text-sm"
                    style={{ background: "#F0FDF4", border: "2px solid #86EFAC", color: "#16A34A" }}
                  >
                    <Trophy className="h-5 w-5" />
                    KURSUS SELESAI
                  </div>
                ) : nextModuleId ? (
                  <Link href={`/courses/${course.id}/modules/${nextModuleId}`} className="block group">
                    <button
                      className="w-full h-14 rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all active:scale-[0.98] group-hover:brightness-110"
                      style={{
                        background: "linear-gradient(135deg, #0F1C3F 0%, #1A3060 100%)",
                        color: "white",
                        boxShadow: "0 4px 20px rgba(15,28,63,0.25)",
                      }}
                    >
                      <span
                        className="h-8 w-8 rounded-full flex items-center justify-center"
                        style={{ background: "rgba(232,160,32,0.2)" }}
                      >
                        <PlayCircle className="h-4 w-4" style={{ color: "#E8A020" }} />
                      </span>
                      LANJUTKAN BELAJAR
                    </button>
                  </Link>
                ) : (
                  <button
                    disabled
                    className="w-full h-14 rounded-2xl font-black text-sm flex items-center justify-center gap-2 opacity-50 cursor-not-allowed"
                    style={{ background: "#E2E6F0", color: "#94A3B8" }}
                  >
                    MATERI BELUM TERSEDIA
                  </button>
                )}

                {isEnrolled && !isCompleted && (
                  <p className="text-center text-[11px] font-medium mt-3" style={{ color: "#94A3B8" }}>
                    {totalModules - completedModules} modul lagi untuk menyelesaikan kursus
                  </p>
                )}
              </div>
            </div>

            {/* Info/Help Card */}
            <div
              className="rounded-3xl p-6 space-y-4"
              style={{
                background: "white",
                border: "1px solid #E2E6F0",
              }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="h-10 w-10 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: "#EEF2FF" }}
                >
                  <AlertCircle className="h-5 w-5" style={{ color: "#0F1C3F" }} />
                </div>
                <div>
                  <h4 className="font-black text-sm mb-1" style={{ color: "#0F1C3F" }}>
                    Butuh Bantuan?
                  </h4>
                  <p className="text-xs leading-relaxed" style={{ color: "#7A8599" }}>
                    Hubungi tim Training HC jika ada kendala teknis atau pertanyaan seputar materi.
                  </p>
                </div>
              </div>
              <button
                className="w-full h-11 rounded-xl font-black text-xs transition-all hover:opacity-90 flex items-center justify-center gap-2"
                style={{
                  background: "#F0F2F7",
                  color: "#0F1C3F",
                  border: "1px solid #D6DBE8",
                }}
              >
                <BarChart2 className="h-4 w-4" />
                HUBUNGI SUPPORT
              </button>
            </div>

          </aside>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

/** Hero stat pill for the banner */
function HeroPill({
  icon,
  label,
  value,
  valueStyle = {},
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueStyle?: React.CSSProperties;
}) {
  return (
    <div
      className="flex items-center gap-2.5 rounded-2xl px-4 py-2.5"
      style={{
        background: "rgba(255,255,255,0.07)",
        border: "1px solid rgba(255,255,255,0.1)",
        backdropFilter: "blur(8px)",
      }}
    >
      {icon}
      <div>
        <p className="text-[9px] font-black uppercase tracking-widest leading-none mb-0.5 text-slate-400">
          {label}
        </p>
        <p className="text-sm font-black leading-none text-white" style={valueStyle}>
          {value}
        </p>
      </div>
    </div>
  );
}

/** Individual stat cell in sidebar */
function StatCell({
  label,
  value,
  valueStyle = {},
}: {
  label: string;
  value: string;
  valueStyle?: React.CSSProperties;
}) {
  return (
    <div className="px-5 py-4 bg-white">
      <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: "#9AAABF" }}>
        {label}
      </p>
      <p className="text-sm font-black" style={{ color: "#0F1C3F", ...valueStyle }}>
        {value}
      </p>
    </div>
  );
}

/** Learning path step card */
function LearningStep({
  href,
  locked,
  done,
  stepNumber,
  type,
  title,
  action,
  meta = [],
  variant,
  lockReason,
  testStatus,
}: {
  href: string | null;
  locked: boolean;
  done: boolean;
  stepNumber: string;
  type: string;
  title: string;
  action: string;
  meta?: { icon: React.ReactNode; text: string }[];
  variant: "pretest" | "posttest" | "module";
  lockReason?: string;
  testStatus?: "LULUS" | "GAGAL" | "KECURANGAN" | null;
}) {
  const variantStyles = {
    pretest: {
      stepBg: done ? "#10B981" : "#0F1C3F",
      stepColor: "white",
      typeBadgeBg: "#EEF2FF",
      typeBadgeColor: "#3B52A4",
      border: done ? "1px solid #86EFAC" : "1px solid #E2E8F0",
      actionColor: "#3B52A4",
    },
    posttest: {
      stepBg: done ? "#10B981" : locked ? "#CBD5E1" : "#E8A020",
      stepColor: "white",
      typeBadgeBg: "#FFF8E7",
      typeBadgeColor: "#B07D0C",
      border: done
        ? "1px solid #86EFAC"
        : locked
        ? "1.5px dashed #E2E8F0"
        : "1px solid #F6CE72",
      actionColor: "#B07D0C",
    },
    module: {
      stepBg: done ? "#10B981" : "white",
      stepColor: done ? "white" : "#0F1C3F",
      typeBadgeBg: "#F1F5F9",
      typeBadgeColor: "#475569",
      border: done ? "1px solid #86EFAC" : "1px solid #E2E8F0",
      actionColor: "#0F1C3F",
    },
  }[variant];

  const inner = (
    <div
      className="relative flex items-center gap-5 px-6 py-5 rounded-[2rem] transition-all duration-300"
      style={{
        background: locked && variant !== "posttest" ? "#F8FAFC" : "white",
        border: variantStyles.border,
        opacity: locked && variant !== "posttest" ? 0.7 : 1,
        boxShadow: locked ? "none" : "0 4px 12px rgba(15,28,63,0.03)",
      }}
    >
      {/* Step Indicator */}
      <div
        className="h-11 w-11 rounded-xl shrink-0 flex items-center justify-center font-black text-sm relative z-10 transition-all"
        style={{
          background: variantStyles.stepBg,
          color: variantStyles.stepColor,
          boxShadow: done ? "0 0 0 3px rgba(16,185,129,0.15)" : undefined,
        }}
      >
        {done ? (
          <CheckCircle2 className="h-5 w-5" />
        ) : locked ? (
          <Lock className="h-4 w-4" />
        ) : (
          <span>{stepNumber}</span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span
            className="text-[9px] font-black uppercase tracking-[0.15em] px-2 py-0.5 rounded-md"
            style={{
              background: variantStyles.typeBadgeBg,
              color: variantStyles.typeBadgeColor,
            }}
          >
            {type}
          </span>
          {done && !testStatus && (
            <span
              className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md"
              style={{ background: "#F0FDF4", color: "#16A34A" }}
            >
              ✓ Selesai
            </span>
          )}
          {testStatus === "LULUS" && (
            <span
              className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md"
              style={{ background: "#F0FDF4", color: "#16A34A" }}
            >
              ✓ Lulus
            </span>
          )}
          {testStatus === "GAGAL" && (
            <span
              className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md"
              style={{ background: "#FFF0F0", color: "#EF4444" }}
            >
              ✕ Gagal
            </span>
          )}
          {testStatus === "KECURANGAN" && (
            <span
              className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md shadow-sm"
              style={{ background: "#450A0A", color: "#FECACA", border: "1px solid #7F1D1D" }}
            >
              ⚠ Kecurangan
            </span>
          )}
        </div>

        <h4
          className="text-sm font-bold leading-snug truncate"
          style={{ color: "#0F1C3F" }}
        >
          {title}
        </h4>

        {meta.length > 0 && (
          <div className="flex items-center gap-4 mt-1.5 flex-wrap">
            {meta.map((m, i) => (
              <span
                key={i}
                className="flex items-center gap-1.5 text-[10px] font-bold"
                style={{ color: "#9AAABF" }}
              >
                {m.icon}
                {m.text}
              </span>
            ))}
          </div>
        )}

        {lockReason && (
          <p
            className="text-[10px] font-bold mt-1.5 flex items-center gap-1"
            style={{ color: "#F59E0B" }}
          >
            <Lock className="h-3 w-3" />
            {lockReason}
          </p>
        )}
      </div>

      {/* Action Indicator */}
      {!locked && href && (
        <div
          className="shrink-0 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider opacity-40 group-hover:opacity-100 transition-all group-hover:translate-x-1"
          style={{ color: variantStyles.actionColor }}
        >
          <span className="hidden sm:inline">{action}</span>
          <ChevronRight className="h-4 w-4" />
        </div>
      )}
    </div>
  );

  const wrapperClass = cn(
    "group block transition-all duration-200",
    !locked && href && "hover:-translate-y-0.5 hover:shadow-md cursor-pointer rounded-2xl"
  );

  if (!locked && href) {
    return (
      <Link href={href} className={wrapperClass}>
        {inner}
      </Link>
    );
  }

  return <div className={wrapperClass}>{inner}</div>;
}