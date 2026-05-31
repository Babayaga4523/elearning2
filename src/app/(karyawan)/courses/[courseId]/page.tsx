import React from "react";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import {
  CheckCircle2,
  Lock,
  Clock,
  ArrowLeft,
  ChevronRight,
  AlertCircle,
  BookOpen,
  FileText,
  FileCheck2,
  PlayCircle,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { EnrollButton } from "@/components/courses/enroll-button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TestStepWithModal } from "@/components/courses/test-step-with-modal";

/* ─── Types ──────────────────────────────────────────────────────────── */
type UserProgress = { isCompleted: boolean };
type TestAttempt = { id: string; passed: boolean; score: number | null };

type ModuleWithProgress = {
  id: string;
  title: string;
  type: string;
  duration: number | null;
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
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  attempts: TestAttempt[];
  _count?: { attempts: number };
};

type Enrollment = {
  id: string;
  status: string;
  rejectionNote: string | null;
  deadline?: Date | string | null;
};

type CourseDetail = {
  id: string;
  title: string;
  description: string | null;
  isVisible: boolean;
  deadlineDate: Date | null;
  deadlineDuration: number | null;
  category: { name: string } | null;
  modules: ModuleWithProgress[];
  tests: TestWithAttempts[];
  enrollments: Enrollment[];
};

/* ─── Helpers ─────────────────────────────────────────────────────────── */
function formatDeadlineLabel(deadline: Date): { text: string; date: string } {
  const diffMs = deadline.getTime() - Date.now();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const dateStr = deadline.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

  if (diffDays < 0) return { text: "Terlewat", date: dateStr };
  if (diffDays === 0) return { text: "Hari ini", date: dateStr };
  return { text: `${diffDays} hari lagi`, date: dateStr };
}

/* ─── Step Badge ────────────────────────────────────────────────────── */
function StepBadge({
  type,
  done,
  locked,
  testStatus,
}: {
  type: "PRE" | "POST" | "VIDEO" | "PDF";
  done: boolean;
  locked: boolean;
  testStatus?: "LULUS" | "GAGAL" | null;
}) {
  if (done && !testStatus) {
    return (
      <Badge className="bg-[#ECFDF3] text-[#027A48] border-[#6CE9A6] text-[10px] font-medium">
        <CheckCircle2 size={10} className="mr-1" />
        Selesai
      </Badge>
    );
  }
  if (testStatus === "LULUS") {
    return (
      <Badge className="bg-[#ECFDF3] text-[#027A48] border-[#6CE9A6] text-[10px] font-medium">
        <CheckCircle2 size={10} className="mr-1" />
        Lulus
      </Badge>
    );
  }
  if (testStatus === "GAGAL") {
    return (
      <Badge className="bg-[#FEF3F2] text-[#B42318] border-[#FDA29B] text-[10px] font-medium">
        Gagal
      </Badge>
    );
  }
  if (locked) {
    return (
      <Badge className="bg-[#F1F3F7] text-[#475467] border-[#E4E7EC] text-[10px] font-medium">
        <Lock size={10} className="mr-1" />
        Terkunci
      </Badge>
    );
  }
  if (type === "PRE") {
    return (
      <Badge className="bg-[#EFF8FF] text-[#175CD3] border-[#B2DDFF] text-[10px] font-medium">
        Pre-Test
      </Badge>
    );
  }
  if (type === "POST") {
    return (
      <Badge className="bg-[#FEF3DC] text-[#C4861A] border-[#F5C05A] text-[10px] font-medium">
        Post-Test
      </Badge>
    );
  }
  return null;
}

/* ─── Learning Step Card ─────────────────────────────────────────────── */
function LearningStepCard({
  href,
  locked,
  done,
  type,
  title,
  number,
  lockReason,
  testStatus,
  testInfo,
  moduleInfo,
}: {
  href: string | null;
  locked: boolean;
  done: boolean;
  type: string;
  title: string;
  number?: number;
  lockReason?: string;
  testStatus?: "LULUS" | "GAGAL" | null;
  testInfo?: {
    duration: number;
    passingScore: number;
    maxAttempts: number;
    attemptCount: number;
    randomizeQuestions?: boolean;
    randomizeOptions?: boolean;
  };
  moduleInfo?: { duration: number; type: string };
}) {
  const typeLabel = type === "VIDEO" ? "Video" : "Dokumen";
  const TypeIcon = type === "VIDEO" ? PlayCircle : FileText;

  const borderAccent = done
    ? "border-l-[#12B76A]"
    : locked
    ? "border-l-transparent"
    : "border-l-[#E8A020]";

  const inner = (
<div
      className={cn(
        "rounded-lg border border-[#E4E7EC] bg-white transition-all duration-200",
        "border-l-4",
        borderAccent,
        !locked && href
          ? "hover:border-[#E8A020]/50 hover:shadow-sm cursor-pointer"
          : "opacity-75 cursor-not-allowed bg-[#F8F9FB]/50"
      )}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Number / icon circle */}
          <div
            className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 font-semibold text-sm font-['Lexend_Deca']",
              done
                ? "bg-[#ECFDF3] text-[#027A48]"
                : locked
                ? "bg-[#F8F9FB] text-[#98A2B3]"
                : "bg-[#0F1C3F] text-white"
            )}
          >
            {done ? (
              <CheckCircle2 size={14} />
            ) : locked ? (
              <Lock size={12} />
            ) : (
              <span>{number}</span>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#F8F9FB] border border-[#E4E7EC] text-[10px] font-medium text-[#64748B] uppercase tracking-wide">
                <TypeIcon size={10} />
                {typeLabel}
              </span>
              <StepBadge type={type as any} done={done} locked={locked} testStatus={testStatus} />
            </div>

            <h4 className="text-sm font-medium text-[#0F1C3F] leading-snug mb-1 line-clamp-2">
              {title}
            </h4>

            {/* Test info */}
            {testInfo && (
              <div className="space-y-1 mt-2">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#64748B]">
                  <div className="flex items-center gap-1">
                    <Clock size={11} className="text-[#98A2B3]" />
                    <span>{testInfo.duration} menit</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FileCheck2 size={11} className="text-[#98A2B3]" />
                    <span>KKM: <span className="text-[#C4861A] font-medium">{testInfo.passingScore}%</span></span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>Percobaan:</span>{" "}
                    {testInfo.maxAttempts === 0 ? (
                      <span className="text-[#027A48] font-medium">Tak Terbatas</span>
                    ) : (
                      <span
                        className={cn(
                          "font-medium",
                          testInfo.attemptCount >= testInfo.maxAttempts
                            ? "text-[#B42318]"
                            : "text-[#175CD3]"
                        )}
                      >
                        {testInfo.attemptCount}/{testInfo.maxAttempts}
                      </span>
                    )}
                  </div>
                </div>
                {(testInfo.randomizeQuestions || testInfo.randomizeOptions) && (
                  <div className="inline-flex items-center gap-1 text-[10px] text-[#C4861A] font-medium uppercase tracking-wide bg-[#FEF3DC]/60 border border-[#F5C05A]/30 rounded px-1.5 py-0.5">
                    🔀{" "}
                    {testInfo.randomizeQuestions && testInfo.randomizeOptions
                      ? "Soal & Opsi Acak"
                      : testInfo.randomizeQuestions
                      ? "Soal Acak"
                      : "Opsi Acak"}
                  </div>
                )}
              </div>
            )}

            {/* Module info */}
            {moduleInfo && (
              <div className="flex items-center gap-x-3 gap-y-1 text-[11px] text-[#64748B] mt-1.5">
                <div className="flex items-center gap-1">
                  <Clock size={11} className="text-[#98A2B3]" />
                  <span>
                    {moduleInfo.duration > 0
                      ? `Estimasi ~${moduleInfo.duration} menit`
                      : "Durasi fleksibel"}
                  </span>
                </div>
              </div>
            )}

            {/* Lock reason */}
            {lockReason && (
              <p className="text-xs font-medium text-[#B54708] bg-[#FFFAEB] border border-[#FEC84B]/40 rounded px-2 py-1 mt-2 flex items-center gap-1 w-fit">
                <Lock size={10} className="shrink-0" />
                {lockReason}
              </p>
            )}
          </div>

          {/* Arrow */}
          {!locked && href && (
            <ChevronRight size={16} className="shrink-0 text-[#98A2B3] mt-1 transition-colors" />
          )}
        </div>
      </div>
    </div>
  );

  if (!locked && href) {
    return <Link href={href}>{inner}</Link>;
  }
  return inner;
}

/* ══════════════════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════════════════ */
export default async function StudentCourseDetailPage({
  params,
}: {
  params: { courseId: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const userId = session.user.id;
  const isAdmin =
    session.user.roles?.includes("ADMIN") ||
    session.user.roles?.includes("SUPER_ADMIN");

  const course = (await db.course.findUnique({
    where: { id: params.courseId, ...(isAdmin ? {} : { isPublished: true }) },
    include: {
      category: true,
      modules: {
        where: isAdmin ? {} : { isPublished: true },
        orderBy: { position: "asc" },
        include: { userProgress: { where: { userId } } },
      },
      tests: {
        include: {
          attempts: { where: { userId }, orderBy: { createdAt: "desc" } },
          _count: {
            select: {
              attempts: {
                where: {
                  userId,
                  status: { in: ["SUBMITTED", "FORCE_SUBMITTED"] }
                }
              }
            },
          },
        },
      },
      enrollments: { where: { userId } },
    },
  })) as CourseDetail | null;

  if (!course) return notFound();

  const enrollment = course.enrollments[0] ?? null;
  const isEnrolled =
    enrollment &&
    (enrollment.status === "IN_PROGRESS" || enrollment.status === "COMPLETED");

  if (!isAdmin && !course.isVisible && !enrollment) {
    return notFound();
  }

  const totalModules = course.modules.length;
  const completedModules = course.modules.filter(
    (m) => m.userProgress[0]?.isCompleted === true
  ).length;
  const progress =
    totalModules > 0
      ? Math.round((completedModules / totalModules) * 100)
      : 0;

  const preTest = course.tests.find((t) => t.type === "PRE") ?? null;
  const postTest = course.tests.find((t) => t.type === "POST") ?? null;

  const isCompleted = enrollment?.status === "COMPLETED";
  const isPending = enrollment?.status === "PENDING";
  const isRejected = enrollment?.status === "REJECTED";

  const actualDeadline = enrollment?.deadline
    ? new Date(enrollment.deadline)
    : (course.deadlineDate ? new Date(course.deadlineDate) : null);

  const deadlineDays = actualDeadline
    ? formatDeadlineLabel(actualDeadline)
    : { text: "Tanpa batas", date: "" };

  const isDeadlinePast =
    !!actualDeadline && actualDeadline.getTime() < Date.now();

  const isAllModulesCompleted =
    totalModules > 0 && completedModules === totalModules;

  const nextModuleId = isAllModulesCompleted
    ? null
    : course.modules.find((m) => !m.userProgress[0]?.isCompleted)?.id;

  const preBestScore =
    preTest?.attempts.length
      ? Math.max(...preTest.attempts.filter((a) => a.score !== null).map((a) => a.score!))
      : null;

  const postBestScore =
    postTest?.attempts.length
      ? Math.max(...postTest.attempts.filter((a) => a.score !== null).map((a) => a.score!))
      : null;

  const latestPreAttempt = preTest?.attempts[0];
  const preStatus = latestPreAttempt
    ? latestPreAttempt.passed
      ? "LULUS"
      : "GAGAL"
    : null;

  const latestPostAttempt = postTest?.attempts[0];
  const postStatus = latestPostAttempt
    ? latestPostAttempt.passed
      ? "LULUS"
      : "GAGAL"
    : null;

  const preAttemptCount = preTest?._count?.attempts ?? preTest?.attempts.length ?? 0;
  const postAttemptCount = postTest?._count?.attempts ?? postTest?.attempts.length ?? 0;
  const preMaxAttempts = preTest?.maxAttempts ?? 0;
  const postMaxAttempts = postTest?.maxAttempts ?? 0;
  const preRemaining = preMaxAttempts > 0 ? Math.max(0, preMaxAttempts - preAttemptCount) : 999;
  const postRemaining = postMaxAttempts > 0 ? Math.max(0, postMaxAttempts - postAttemptCount) : 999;

  const prePassedKKM =
    preBestScore !== null && preBestScore >= (preTest?.passingScore ?? 70);
  const postPassedKKM =
    postBestScore !== null && postBestScore >= (postTest?.passingScore ?? 70);

  const isDeadlineUrgent =
    actualDeadline &&
    !isDeadlinePast &&
    (() => {
      const diff = Math.ceil(
        (actualDeadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      return diff <= 3;
    })();

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      {/* ═══ Page Header ════════════════════════════════════════════════ */}
      <header
        className="relative pt-8 pb-10 lg:pt-10 lg:pb-12 overflow-hidden border-b border-[#1A2D5A]"
        style={{
          background: `linear-gradient(135deg, #0F1C3F 0%, #12224A 50%, #1A3060 100%)`,
        }}
      >
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute right-[-10%] top-[-20%] w-[400px] h-[400px] rounded-full bg-[#E8A020] blur-[140px] mix-blend-screen" />
          <div className="absolute left-[-10%] bottom-[-20%] w-[250px] h-[250px] rounded-full bg-[#2E90FA] blur-[100px] mix-blend-screen" />
        </div>
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-white/70 mb-5">
            <Link href={isAdmin ? `/admin/courses/${course.id}` : "/courses"} className="hover:text-white transition-colors flex items-center gap-1">
              <ArrowLeft size={12} />
              {isAdmin ? "Edit Mode" : "Katalog"}
            </Link>
            <ChevronRight size={12} />
            <span className="text-white font-medium line-clamp-1">{course.title}</span>
          </nav>

          {/* Title Row */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="space-y-3 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                {course.category && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-white/10 text-white text-[10px] font-medium uppercase tracking-wide border border-white/20">
                    {course.category.name}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/10 text-white text-[10px] font-medium uppercase tracking-wide border border-white/20">
                  <BookOpen size={10} />
                  {totalModules} Modul
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/10 text-white text-[10px] font-medium uppercase tracking-wide border border-white/20">
                  <FileCheck2 size={10} />
                  {course.tests.length} Ujian
                </span>
                {postTest?.passingScore && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#FEF3DC] text-[#C4861A] text-[10px] font-medium uppercase tracking-wide border border-[#F5C05A]">
                    Target: {postTest.passingScore}%
                  </span>
                )}
                {!isEnrolled && !isAdmin && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/10 text-white/70 text-[10px] font-medium uppercase tracking-wide border border-white/20">
                    <Lock size={8} />
                    Preview
                  </span>
                )}
              </div>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-white font-['Lexend_Deca'] leading-tight">
                {course.title}
              </h1>
              {course.description && (
                <p className="text-sm text-white/80 leading-relaxed max-w-2xl line-clamp-2">
                  {course.description}
                </p>
              )}
            </div>

            {/* Deadline Badge */}
            {actualDeadline && (
              <div className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg border shrink-0",
                isDeadlinePast
                  ? "bg-[#FEF3F2] border-[#FDA29B] text-[#B42318]"
                  : isDeadlineUrgent
                  ? "bg-[#FFFAEB] border-[#FEC84B] text-[#B54708]"
                  : "bg-white/10 border-white/20 text-white"
              )}>
                <Calendar size={13} />
                <div className="text-xs font-medium">
                  <span className="font-semibold">{deadlineDays.text}</span>
                  {deadlineDays.date && <span className="opacity-70 ml-1">({deadlineDays.date})</span>}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ═══ Main Content ════════════════════════════════════════════════ */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ─── Left: Curriculum ─────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-[#0F1C3F] font-['Lexend_Deca']">
                Jalur Pembelajaran
              </h2>
              <p className="text-xs text-[#475467] mt-0.5">
                Selesaikan setiap tahap untuk menyelesaikan kursus
              </p>
            </div>

            <div className="space-y-3">
              {/* Pre-Test */}
              {preTest && (
                <TestStepWithModal
                  courseId={course.id}
                  testId={preTest.id}
                  testType="PRE"
                  testTitle={preTest.title}
                  locked={(!isEnrolled && !isAdmin) || isDeadlinePast}
                  done={preTest.attempts.length > 0}
                  lockReason={
                    isDeadlinePast ? "Batas waktu kursus telah berakhir" : undefined
                  }
                  testStatus={preStatus}
                  bestScore={preBestScore}
                  testInfo={{
                    duration: preTest.duration,
                    passingScore: preTest.passingScore ?? 70,
                    maxAttempts: preTest.maxAttempts,
                    attemptCount: preAttemptCount,
                    remainingAttempts: preRemaining,
                    passedKKM: prePassedKKM,
                    randomizeQuestions: preTest.randomizeQuestions,
                    randomizeOptions: preTest.randomizeOptions,
                  }}
                  resultUrl={
                    preTest.attempts.length > 0
                      ? `/courses/${course.id}/tests/${preTest.id}/result?attemptId=${preTest.attempts[0].id}`
                      : undefined
                  }
                />
              )}

              {/* Modules */}
              {course.modules.map((module, index) => {
                const isDone = module.userProgress[0]?.isCompleted === true;
                return (
                  <LearningStepCard
                    key={module.id}
                    href={
                      (isEnrolled || isAdmin) && !isDeadlinePast
                        ? `/courses/${course.id}/modules/${module.id}`
                        : null
                    }
                    locked={(!isEnrolled && !isAdmin) || isDeadlinePast}
                    done={isDone}
                    type={module.type === "VIDEO" ? "VIDEO" : "PDF"}
                    title={module.title}
                    number={index + 1}
                    lockReason={
                      isDeadlinePast ? "Batas waktu kursus telah berakhir" : undefined
                    }
                    moduleInfo={{
                      duration: module.duration ?? 0,
                      type: module.type,
                    }}
                  />
                );
              })}

              {/* Post-Test */}
              {postTest && (
                <TestStepWithModal
                  courseId={course.id}
                  testId={postTest.id}
                  testType="POST"
                  testTitle={postTest.title}
                  locked={
                    (!isAllModulesCompleted && !isAdmin) ||
                    (!isEnrolled && !isAdmin) ||
                    isDeadlinePast
                  }
                  done={postTest.attempts.length > 0}
                  lockReason={
                    isDeadlinePast
                      ? "Batas waktu kursus telah berakhir"
                      : !isAllModulesCompleted && !isAdmin
                      ? "Selesaikan semua modul untuk membuka ujian akhir"
                      : undefined
                  }
                  testStatus={postStatus}
                  bestScore={postBestScore}
                  testInfo={{
                    duration: postTest.duration,
                    passingScore: postTest.passingScore ?? 70,
                    maxAttempts: postTest.maxAttempts,
                    attemptCount: postAttemptCount,
                    remainingAttempts: postRemaining,
                    passedKKM: postPassedKKM,
                    randomizeQuestions: postTest.randomizeQuestions,
                    randomizeOptions: postTest.randomizeOptions,
                  }}
                  resultUrl={
                    postTest.attempts.length > 0
                      ? `/courses/${course.id}/tests/${postTest.id}/result?attemptId=${postTest.attempts[0].id}`
                      : undefined
                  }
                />
              )}
            </div>
          </div>

          {/* ─── Right: Sidebar ──────────────────────────────────────── */}
          <aside className="space-y-4 lg:sticky lg:top-20">
            {/* Progress Card */}
            <Card className="bg-white rounded-lg border border-[#E4E7EC]">
              <CardContent className="p-4 space-y-4">
                <h3 className="text-sm font-semibold text-[#0F1C3F]">
                  Progres Belajar
                </h3>

                {/* Radial Donut + Stats block */}
                <div className="flex items-center gap-3 bg-[#F8F9FB] border border-[#E4E7EC]/50 p-3 rounded-lg">
                  <div className="relative shrink-0" style={{ width: 56, height: 56 }}>
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 72 72">
                      <circle cx="36" cy="36" r="28" fill="none" stroke="#E4E7EC" strokeWidth="5" />
                      <circle
                        cx="36" cy="36" r="28"
                        fill="none"
                        stroke={progress === 100 ? "#12B76A" : "#E8A020"}
                        strokeWidth="5"
                        strokeDasharray={`${(progress / 100) * 175.93} 175.93`}
                        strokeLinecap="round"
                        className="transition-all duration-700"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xs font-semibold text-[#0F1C3F] leading-none">
                        {progress}%
                      </span>
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-lg font-semibold text-[#0F1C3F] leading-none">
                      {completedModules}/{totalModules}
                    </p>
                    <p className="text-[10px] text-[#64748B] uppercase tracking-wide">
                      modul selesai
                    </p>
                  </div>
                </div>

                {/* Flat Progress bar */}
                <div className="h-1.5 bg-[#F1F3F7] rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      progress === 100
                        ? "bg-[#12B76A]"
                        : "bg-[#E8A020]"
                    )}
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#F1F3F7] text-xs">
                  {[
                    {
                      label: "Sisa Waktu",
                      value: deadlineDays.text || "∞",
                      urgent: isDeadlineUrgent,
                      past: isDeadlinePast
                    },
                    { label: "KKM", value: `${postTest?.passingScore ?? 0}%`, urgent: false, past: false },
                    { label: "Pre-Test", value: preTest?.attempts.length ? "✓" : "—", urgent: false, past: false },
                    { label: "Post-Test", value: postTest?.attempts.length ? "✓" : "—", urgent: false, past: false },
                  ].map((stat, i) => (
                    <div key={i} className="space-y-0.5">
                      <p className="text-[10px] text-[#98A2B3] uppercase tracking-wide">
                        {stat.label}
                      </p>
                      <p
                        className={cn(
                          "font-medium text-sm",
                          stat.urgent ? "text-[#B54708]" : stat.past ? "text-[#B42318]" : "text-[#101828]"
                        )}
                      >
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Action CTA Buttons */}
                <div className="pt-3 border-t border-[#F1F3F7]">
                  {!enrollment || isRejected ? (
                    <div className="space-y-2">
                      {isRejected && enrollment?.rejectionNote && (
                        <div className="p-2.5 rounded-lg bg-[#FEF3F2] border border-[#FDA29B]/50">
                          <p className="text-xs font-medium text-[#B42318]">Pendaftaran Ditolak</p>
                          <p className="text-xs text-[#B42318]/80 mt-0.5">{enrollment.rejectionNote}</p>
                        </div>
                      )}
                      <EnrollButton courseId={course.id} />
                    </div>
                  ) : isPending ? (
                    <div className="p-3 rounded-lg bg-[#FFFAEB] border border-[#FEC84B]/40 text-center">
                      <Clock className="h-4 w-4 text-[#F79009] mx-auto mb-1" />
                      <p className="text-xs font-medium text-[#B54708]">Menunggu Persetujuan</p>
                    </div>
                  ) : isDeadlinePast ? (
                    <div className="p-3 rounded-lg bg-[#FEF3F2] border border-[#FDA29B]/40 text-center">
                      <AlertCircle className="h-4 w-4 text-[#B42318] mx-auto mb-1" />
                      <p className="text-xs font-medium text-[#B42318]">Kursus Non-Aktif</p>
                    </div>
                  ) : isCompleted ? (
                    <div className="p-3 rounded-lg bg-[#ECFDF3] border border-[#6CE9A6]/40 text-center">
                      <CheckCircle2 className="h-4 w-4 text-[#027A48] mx-auto mb-1" />
                      <p className="text-xs font-medium text-[#027A48]">Kursus Selesai!</p>
                      <Link href="/performance" className="block mt-2">
                        <Button variant="outline" className="w-full text-xs font-medium rounded-lg">
                          Lihat Performa
                        </Button>
                      </Link>
                    </div>
                  ) : nextModuleId ? (
                    <Button asChild className="w-full bg-[#E8A020] hover:bg-[#C4861A] text-white text-xs font-medium py-2 rounded-lg transition-all border-0">
                      <Link href={`/courses/${course.id}/modules/${nextModuleId}`}>
                        <PlayCircle size={12} className="mr-1.5 fill-current" />
                        Lanjutkan Belajar
                      </Link>
                    </Button>
                  ) : (
                    <Button disabled className="w-full rounded-lg py-2 text-xs font-medium bg-[#F1F3F7] text-[#98A2B3] cursor-not-allowed border-0">
                      Materi Belum Tersedia
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Help Card */}
            <Card className="bg-white rounded-lg border border-[#E4E7EC]">
              <CardContent className="p-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-md bg-[#EFF8FF] flex items-center justify-center shrink-0">
                    <AlertCircle size={14} className="text-[#175CD3]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-medium text-[#101828]">
                      Butuh Bantuan?
                    </h4>
                    <p className="text-[11px] text-[#475467]">
                      Hubungi tim Training HC
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
