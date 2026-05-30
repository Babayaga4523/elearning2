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
  Users,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { EnrollButton } from "@/components/courses/enroll-button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TestStepWithModal } from "@/components/courses/test-step-with-modal";

/* ════════════════════════════════════════════════════════════════════════
   DESIGN TOKENS — World-Class Design System
═══════════════════════════════════════════════════════════════════════ */
const t = {
  navy: "#0F1C3F",
  gold: "#E8A020",
  surface: "#F8F9FB",
  border: "#E4E7EC",
  text: "#101828",
  textSecondary: "#475467",
  textTertiary: "#98A2B3",
  success: { bg: "#ECFDF3", text: "#027A48", border: "#6CE9A6", icon: "#12B76A" },
  warning: { bg: "#FFFAEB", text: "#B54708", border: "#FEC84B", icon: "#F79009" },
  danger: { bg: "#FEF3F2", text: "#B42318", border: "#FDA29B", icon: "#F04438" },
  info: { bg: "#EFF8FF", text: "#175CD3", border: "#B2DDFF", icon: "#2E90FA" },
  navyDark: { bg: "#E8EDF7", text: "#0F1C3F", border: "#CBD2E0" },
};

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
      <Badge className="bg-[#ECFDF3] text-[#027A48] border-[#6CE9A6] text-[10px] font-semibold">
        <CheckCircle2 size={10} className="mr-1" />
        Selesai
      </Badge>
    );
  }
  if (testStatus === "LULUS") {
    return (
      <Badge className="bg-[#ECFDF3] text-[#027A48] border-[#6CE9A6] text-[10px] font-semibold">
        <CheckCircle2 size={10} className="mr-1" />
        Lulus
      </Badge>
    );
  }
  if (testStatus === "GAGAL") {
    return (
      <Badge className="bg-[#FEF3F2] text-[#B42318] border-[#FDA29B] text-[10px] font-semibold">
        Gagal
      </Badge>
    );
  }
  if (locked) {
    return (
      <Badge className="bg-[#F1F3F7] text-[#475467] border-[#E4E7EC] text-[10px] font-semibold">
        <Lock size={10} className="mr-1" />
        Terkunci
      </Badge>
    );
  }
  if (type === "PRE") {
    return (
      <Badge className="bg-[#EFF8FF] text-[#175CD3] border-[#B2DDFF] text-[10px] font-semibold">
        Pre-Test
      </Badge>
    );
  }
  if (type === "POST") {
    return (
      <Badge className="bg-[#FEF3DC] text-[#C4861A] border-[#F5C05A] text-[10px] font-semibold">
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

  const inner = (
    <div
      className={cn(
        "rounded-xl border transition-all duration-200",
        "hover:border-[#C4861A] hover:shadow-md",
        !locked && href
          ? "bg-white border-[#E4E7EC] cursor-pointer"
          : "bg-[#F8F9FB] border-[#E4E7EC] opacity-70"
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Number / icon circle */}
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm font-['Lexend_Deca'] transition-colors",
              done
                ? "bg-[#ECFDF3] text-[#027A48]"
                : locked
                ? "bg-[#F1F3F7] text-[#98A2B3]"
                : "bg-[#0F1C3F] text-white"
            )}
          >
            {done ? (
              <CheckCircle2 size={18} />
            ) : locked ? (
              <Lock size={15} />
            ) : (
              <span>{number}</span>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              {/* Type badge */}
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#F8F9FB] border border-[#E4E7EC] text-[10px] font-semibold text-[#475467] font-['DM_Sans']">
                <TypeIcon size={10} />
                {typeLabel}
              </span>
              <StepBadge type={type as any} done={done} locked={locked} testStatus={testStatus} />
            </div>

            <h4 className="text-sm font-semibold text-[#101828] font-['DM_Sans'] leading-snug mb-1.5 line-clamp-2">
              {title}
            </h4>

            {/* Test info */}
            {testInfo && (
              <div className="space-y-1.5 mt-2">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#475467] font-['DM_Sans']">
                  <div className="flex items-center gap-1">
                    <Clock size={11} className="text-[#98A2B3]" />
                    <span className="font-medium">{testInfo.duration} menit</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FileCheck2 size={11} className="text-[#98A2B3]" />
                    <span className="font-medium">KKM: {testInfo.passingScore}%</span>
                  </div>
                  <div>
                    <span className="font-medium">Percobaan:</span>{" "}
                    {testInfo.maxAttempts === 0 ? (
                      <span className="text-[#027A48] font-semibold">Unlimited</span>
                    ) : (
                      <span
                        className={cn(
                          "font-semibold",
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
                  <div className="inline-flex items-center gap-1 text-[10px] text-[#C4861A] font-semibold font-['DM_Sans']">
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
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#475467] font-['DM_Sans'] mt-2">
                <div className="flex items-center gap-1">
                  <Clock size={11} className="text-[#98A2B3]" />
                  <span className="font-medium">
                    {moduleInfo.duration > 0
                      ? `~${moduleInfo.duration} menit`
                      : "Durasi fleksibel"}
                  </span>
                </div>
              </div>
            )}

            {/* Lock reason */}
            {lockReason && (
              <p className="text-xs text-[#B54708] mt-2 font-['DM_Sans'] flex items-center gap-1.5">
                <Lock size={11} />
                {lockReason}
              </p>
            )}
          </div>

          {/* Arrow */}
          {!locked && href && (
            <ChevronRight size={18} className="shrink-0 text-[#98A2B3] mt-1" />
          )}
        </div>
      </CardContent>
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
            select: { attempts: { where: { userId, status: "SUBMITTED" } } },
          },
        },
      },
      enrollments: { where: { userId } },
    },
  })) as CourseDetail | null;

  if (!course) return notFound();

  const enrollment = course.enrollments[0] ?? null;
  const isParticipant = !!enrollment;
  const isEnrolled =
    enrollment &&
    (enrollment.status === "IN_PROGRESS" || enrollment.status === "COMPLETED");

  if (!isAdmin && !course.isVisible && !isParticipant) {
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

  const deadlineDays = course.deadlineDate
    ? formatDeadlineLabel(course.deadlineDate)
    : { text: "Tanpa batas", date: "" };

  const isDeadlinePast =
    !!course.deadlineDate && course.deadlineDate.getTime() < Date.now();

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

  /* Deadline severity */
  const isDeadlineUrgent =
    course.deadlineDate &&
    !isDeadlinePast &&
    (() => {
      const diff = Math.ceil(
        (course.deadlineDate!.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      return diff <= 3;
    })();

  return (
    <div
      className="min-h-screen bg-[#F8F9FB]"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* ═══ Hero Header ════════════════════════════════════════════════ */}
      <header
        className="relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${t.navy} 0%, #1A3060 100%)` }}
      >
        {/* Glow orbs */}
        <div
          className="absolute -right-24 -top-24 w-96 h-96 rounded-full opacity-10 pointer-events-none"
          style={{ background: `radial-gradient(circle, ${t.gold} 0%, transparent 70%)` }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
          {/* Back + Badges row */}
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            <Link
              href={isAdmin ? `/admin/courses/${course.id}` : "/courses"}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-white/60 hover:text-white transition-colors font-['DM_Sans']"
            >
              <ArrowLeft size={15} />
              {isAdmin ? "Kembali ke Edit" : "Katalog"}
            </Link>
            <span className="text-white/30">·</span>
            {course.category && (
              <span className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-white/80">
                {course.category.name}
              </span>
            )}
            {!isEnrolled && !isAdmin && (
              <span className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-200 text-xs font-semibold">
                <Lock size={11} className="inline mr-1" />
                Pratinjau
              </span>
            )}
          </div>

          {/* Title + meta */}
          <div className="space-y-3 max-w-3xl">
            <h1 className="text-2xl md:text-3xl font-bold text-white font-['Lexend_Deca'] leading-tight tracking-tight">
              {course.title}
            </h1>
            {course.description && (
              <p className="text-sm text-white/60 font-['DM_Sans'] leading-relaxed max-w-2xl">
                {course.description}
              </p>
            )}
          </div>

          {/* Quick stats row */}
          <div className="flex flex-wrap gap-5 mt-6 text-xs text-white/60 font-['DM_Sans']">
            <div className="flex items-center gap-1.5">
              <BookOpen size={14} className="text-white/40" />
              <span><span className="font-semibold text-white">{totalModules}</span> Modul</span>
            </div>
            <div className="flex items-center gap-1.5">
              <FileCheck2 size={14} className="text-white/40" />
              <span><span className="font-semibold text-white">{course.tests.length}</span> Ujian</span>
            </div>
            {postTest?.passingScore && (
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-white">{postTest.passingScore}%</span>
                <span>Passing Score</span>
              </div>
            )}
            {course.deadlineDate && (
              <div
                className={cn(
                  "flex items-center gap-1.5 font-semibold",
                  isDeadlinePast ? "text-[#FDA29B]" : isDeadlineUrgent ? "text-[#FEC84B]" : "text-white/60"
                )}
              >
                <Calendar size={14} />
                <span>
                  {deadlineDays.text}
                  {deadlineDays.date && (
                    <span className="opacity-70 font-medium"> ({deadlineDays.date})</span>
                  )}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ═══ Main Content ════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ─── Left: Curriculum ─────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-[#101828] font-['Lexend_Deca'] mb-1">
                Jalur Pembelajaran
              </h2>
              <p className="text-sm text-[#475467] font-['DM_Sans']">
                Selesaikan setiap tahap secara berurutan untuk menyelesaikan kursus
              </p>
            </div>

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

          {/* ─── Right: Sidebar ──────────────────────────────────────── */}
          <aside className="space-y-5 lg:sticky lg:top-24">
            {/* Progress Card */}
            <Card className="bg-white rounded-2xl border border-[#E4E7EC] overflow-hidden shadow-sm">
              <CardContent className="p-6 space-y-5">
                <h3 className="text-sm font-semibold text-[#101828] font-['Lexend_Deca']">
                  Progres Anda
                </h3>

                {/* Radial + stats */}
                <div className="flex items-center gap-4">
                  <div className="relative" style={{ width: 72, height: 72 }}>
                    {/*
                      Correct SVG donut formula:
                      r=28, circumference = 2π × 28 ≈ 175.93
                      strokeDasharray = "(progress% × circumference) circumference"
                      At 0%  → "0 175.93"  (empty)
                      At 100% → "175.93 175.93" (full ring)
                    */}
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 72 72">
                      <circle cx="36" cy="36" r="28" fill="none" stroke="#E4E7EC" strokeWidth="5" />
                      <circle
                        cx="36" cy="36" r="28"
                        fill="none"
                        stroke={progress === 100 ? "#12B76A" : "#E8A020"}
                        strokeWidth="5"
                        strokeDasharray={`${(progress / 100) * 175.93} 175.93`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-lg font-bold text-[#101828] font-['Lexend_Deca'] leading-none">
                        {progress}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#101828] font-['Lexend_Deca'] leading-none">
                      {completedModules}/{totalModules}
                    </p>
                    <p className="text-xs text-[#475467] font-['DM_Sans'] mt-0.5">
                      modul selesai
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="h-1.5 bg-[#F1F3F7] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#E8A020] to-[#F5C05A] transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#F1F3F7]">
                  {[
                    { 
                      label: "Sisa Waktu", 
                      value: (
                        <>
                          {deadlineDays.text}
                          {deadlineDays.date && (
                            <span className="text-xs opacity-70"> ({deadlineDays.date})</span>
                          )}
                        </>
                      ), 
                      urgent: isDeadlineUrgent, 
                      past: isDeadlinePast 
                    },
                    { label: "Passing Score", value: `${postTest?.passingScore ?? 0}%`, urgent: false, past: false },
                    { label: "Pre-Test", value: preTest?.attempts.length ? "Selesai" : "Belum", urgent: false, past: false },
                    { label: "Post-Test", value: postTest?.attempts.length ? "Selesai" : "Belum", urgent: false, past: false },
                  ].map((stat) => (
                    <div key={stat.label}>
                      <p className="text-[10px] text-[#98A2B3] font-['DM_Sans'] uppercase tracking-wider mb-0.5">
                        {stat.label}
                      </p>
                      <p
                        className={cn(
                          "text-sm font-semibold font-['DM_Sans']",
                          stat.urgent ? "text-[#B54708]" : stat.past ? "text-[#B42318]" : "text-[#101828]"
                        )}
                      >
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <div className="pt-4 border-t border-[#F1F3F7]">
                  {!enrollment || isRejected ? (
                    <div className="space-y-3">
                      {isRejected && enrollment?.rejectionNote && (
                        <div className="p-3 rounded-xl bg-[#FEF3F2] border border-[#FDA29B]">
                          <p className="text-xs font-semibold text-[#B42318] mb-1">Pendaftaran Ditolak</p>
                          <p className="text-xs text-[#B42318]/70">{enrollment.rejectionNote}</p>
                        </div>
                      )}
                      <EnrollButton courseId={course.id} />
                    </div>
                  ) : isPending ? (
                    <div className="p-4 rounded-xl bg-[#FFFAEB] border border-[#FEC84B] text-center">
                      <Clock className="h-5 w-5 text-[#F79009] mx-auto mb-2" />
                      <p className="text-sm font-semibold text-[#B54708]">Menunggu Persetujuan</p>
                      <p className="text-xs text-[#B54708]/70 mt-1">Admin akan segera memproses</p>
                    </div>
                  ) : isDeadlinePast ? (
                    <div className="p-4 rounded-xl bg-[#FEF3F2] border border-[#FDA29B] text-center">
                      <AlertCircle className="h-5 w-5 text-[#B42318] mx-auto mb-2" />
                      <p className="text-sm font-semibold text-[#B42318]">Kursus Non-Aktif</p>
                      <p className="text-xs text-[#B42318]/70 mt-1">Deadline terlewat</p>
                    </div>
                  ) : isCompleted ? (
                    <div className="p-4 rounded-xl bg-[#ECFDF3] border border-[#6CE9A6] text-center">
                      <CheckCircle2 className="h-5 w-5 text-[#027A48] mx-auto mb-2" />
                      <p className="text-sm font-semibold text-[#027A48]">Kursus Selesai!</p>
                      <Link href="/performance">
                        <Button variant="outline" className="mt-3 w-full text-sm">
                          Lihat Performa
                        </Button>
                      </Link>
                    </div>
                  ) : nextModuleId ? (
                    <Button asChild className="w-full bg-[#E8A020] hover:bg-[#C4861A] active:scale-[0.97] text-white font-semibold rounded-xl font-['DM_Sans'] transition-all shadow-[0_4px_14px_rgba(232,160,32,0.3)]">
                      <Link href={`/courses/${course.id}/modules/${nextModuleId}`}>
                        <PlayCircle size={15} className="mr-2" />
                        Lanjutkan Belajar
                      </Link>
                    </Button>
                  ) : (
                    <Button disabled className="w-full rounded-xl font-['DM_Sans']">
                      Materi Belum Tersedia
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Help Card */}
            <Card className="bg-white rounded-2xl border border-[#E4E7EC] shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#EFF8FF] flex items-center justify-center shrink-0">
                    <AlertCircle size={18} className="text-[#175CD3]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#101828] font-['DM_Sans'] mb-0.5">
                      Butuh Bantuan?
                    </h4>
                    <p className="text-xs text-[#475467] font-['DM_Sans']">
                      Hubungi tim Training HC jika ada kendala
                    </p>
                  </div>
                </div>
                <Button variant="outline" className="w-full text-sm font-semibold rounded-xl font-['DM_Sans']">
                  Hubungi Support
                </Button>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}