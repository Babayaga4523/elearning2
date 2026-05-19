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
} from "lucide-react";
import Link from "next/link";
import { EnrollButton } from "@/components/courses/enroll-button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TestStepWithModal } from "@/components/courses/test-step-with-modal";

// ─── Types ────────────────────────────────────────────────────────────────────

type UserProgress = { isCompleted: boolean };
type TestAttempt = { id: string, passed: boolean, score: number | null };

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
  const isAdmin = session.user.activeRole === "ADMIN" || session.user.activeRole === "SUPER_ADMIN";

  const course = (await db.course.findUnique({
    where: {
      id: params.courseId,
      ...(isAdmin ? {} : { isPublished: true })
    },
    include: {
      category: true,
      modules: {
        where: isAdmin ? {} : { isPublished: true },
        orderBy: { position: "asc" },
        include: { userProgress: { where: { userId } } },
      },
      tests: {
        include: {
          attempts: {
            where: { userId },
            orderBy: { createdAt: "desc" },
          },
          _count: {
            select: { attempts: { where: { userId, status: "SUBMITTED" } } }
          }
        },
      },
      enrollments: { where: { userId } },
    },
  })) as CourseDetail | null;

  if (!course) return notFound();

  const enrollment = course.enrollments[0] ?? null;
  const isParticipant = !!enrollment;

  if (!isAdmin && !course.isVisible && !isParticipant) {
    return notFound();
  }

  const totalModules = course.modules.length;
  const completedModules = course.modules.filter(
    (m) => m.userProgress[0]?.isCompleted === true
  ).length;
  const progress =
    totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

  const preTest = course.tests.find((t) => t.type === "PRE") ?? null;
  const postTest = course.tests.find((t) => t.type === "POST") ?? null;

  const isEnrolled = enrollment && (enrollment.status === "IN_PROGRESS" || enrollment.status === "COMPLETED");
  const isPending = enrollment?.status === "PENDING";
  const isRejected = enrollment?.status === "REJECTED";
  const isCompleted = enrollment?.status === "COMPLETED";

  const deadlineDays = course.deadlineDate
    ? formatDeadlineLabel(course.deadlineDate)
    : "Tanpa Batas";

  const isDeadlinePast =
    !!course.deadlineDate && course.deadlineDate.getTime() < Date.now();

  const isAllModulesCompleted =
    totalModules > 0 && completedModules === totalModules;

  const nextModuleId = isAllModulesCompleted
    ? null
    : course.modules.find((m) => !m.userProgress[0]?.isCompleted)?.id;

  // Calculate best scores for pre-test and post-test (highest score from all attempts)
  const preBestScore = preTest?.attempts.length
    ? Math.max(...preTest.attempts.filter(a => a.score !== null).map(a => a.score!))
    : null;

  const postBestScore = postTest?.attempts.length
    ? Math.max(...postTest.attempts.filter(a => a.score !== null).map(a => a.score!))
    : null;

  // Get latest attempt for status display
  const latestPreAttempt = preTest?.attempts[0];
  const preStatus = latestPreAttempt
    ? latestPreAttempt.passed ? "LULUS" as const : "GAGAL" as const
    : null;

  const latestPostAttempt = postTest?.attempts[0];
  const postStatus = latestPostAttempt
    ? latestPostAttempt.passed ? "LULUS" as const : "GAGAL" as const
    : null;

  // Calculate remaining attempts for display
  const preAttemptCount = preTest?._count?.attempts ?? preTest?.attempts.length ?? 0;
  const postAttemptCount = postTest?._count?.attempts ?? postTest?.attempts.length ?? 0;
  const preMaxAttempts = preTest?.maxAttempts ?? 0;
  const postMaxAttempts = postTest?.maxAttempts ?? 0;
  const preRemaining = preMaxAttempts > 0 ? Math.max(0, preMaxAttempts - preAttemptCount) : 999;
  const postRemaining = postMaxAttempts > 0 ? Math.max(0, postMaxAttempts - postAttemptCount) : 999;

  // Determine if passed KKM (best score >= passing score)
  const prePassedKKM = preBestScore !== null && preBestScore >= (preTest?.passingScore ?? 70);
  const postPassedKKM = postBestScore !== null && postBestScore >= (postTest?.passingScore ?? 70);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <Link
            href={isAdmin ? `/admin/courses/${course.id}` : "/courses"}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            {isAdmin ? "Kembali ke Edit Kursus" : "Kembali ke Katalog"}
          </Link>

          {/* Course Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              {course.category && (
                <Badge className="bg-white/10 text-white border-0">
                  {course.category.name}
                </Badge>
              )}
              {!isEnrolled && !isAdmin && (
                <Badge className="bg-yellow-500/20 text-yellow-200 border-0">
                  <Lock className="h-3 w-3 mr-1" />
                  Mode Pratinjau
                </Badge>
              )}
              {isAdmin && (
                <Badge className="bg-purple-500/20 text-purple-200 border-0">
                  Mode Admin
                </Badge>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-white">
              {course.title}
            </h1>

            {course.description && (
              <p className="text-base text-slate-300 max-w-3xl">
                {course.description}
              </p>
            )}

            {/* Stats */}
            <div className="flex flex-wrap gap-6 text-sm text-slate-300">
              <div>
                <span className="font-medium">{totalModules}</span> Modul
              </div>
              <div>
                <span className="font-medium">{course.tests.length}</span> Ujian
              </div>
              {postTest?.passingScore && (
                <div>
                  Passing Score: <span className="font-medium">{postTest.passingScore}%</span>
                </div>
              )}
              {course.deadlineDate && (
                <div className={cn(
                  "font-medium",
                  isDeadlinePast ? "text-red-400" : "text-green-400"
                )}>
                  {deadlineDays}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left: Curriculum */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-1">
                Jalur Pembelajaran
              </h2>
              <p className="text-sm text-slate-600">
                Selesaikan setiap tahap secara berurutan
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
                  lockReason={isDeadlinePast ? "Batas waktu kursus telah berakhir" : undefined}
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
                  <LearningStep
                    key={module.id}
                    href={
                      (isEnrolled || isAdmin) && !isDeadlinePast
                        ? `/courses/${course.id}/modules/${module.id}`
                        : null
                    }
                    locked={(!isEnrolled && !isAdmin) || isDeadlinePast}
                    done={isDone}
                    type={module.type === "VIDEO" ? "Video" : "Dokumen"}
                    title={module.title}
                    number={index + 1}
                    lockReason={isDeadlinePast ? "Batas waktu kursus telah berakhir" : undefined}
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
                  locked={(!isAllModulesCompleted && !isAdmin) || (!isEnrolled && !isAdmin) || isDeadlinePast}
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

          {/* Right: Sidebar */}
          <aside className="space-y-6 lg:sticky lg:top-8">
            {/* Progress Card */}
            <Card className="bg-white">
              <CardContent className="p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-4">
                    Progres Anda
                  </h3>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Progress</span>
                      <span className="font-semibold text-slate-900">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-slate-600">
                      {completedModules} dari {totalModules} modul selesai
                    </p>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Sisa Waktu</p>
                    <p className={cn(
                      "text-sm font-semibold",
                      isDeadlinePast ? "text-red-600" : "text-slate-900"
                    )}>
                      {deadlineDays}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Passing Score</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {postTest?.passingScore ?? 0}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Pre-Test</p>
                    <p className={cn(
                      "text-sm font-semibold",
                      preTest?.attempts.length ? "text-green-600" : "text-slate-400"
                    )}>
                      {preTest?.attempts.length ? "Selesai" : "Belum"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Post-Test</p>
                    <p className={cn(
                      "text-sm font-semibold",
                      postTest?.attempts.length ? "text-green-600" : "text-slate-400"
                    )}>
                      {postTest?.attempts.length ? "Selesai" : "Belum"}
                    </p>
                  </div>
                </div>

                {/* CTA */}
                <div className="pt-4 border-t border-slate-100">
                  {!enrollment || isRejected ? (
                    <div className="space-y-3">
                      {isRejected && (
                        <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                          <p className="text-xs font-semibold text-red-900 mb-1">
                            Pendaftaran Ditolak
                          </p>
                          <p className="text-xs text-red-700">
                            {enrollment?.rejectionNote || "Tanpa alasan spesifik"}
                          </p>
                        </div>
                      )}
                      <EnrollButton courseId={course.id} />
                    </div>
                  ) : isPending ? (
                    <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200 text-center">
                      <Clock className="h-5 w-5 text-yellow-600 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-yellow-900">
                        Menunggu Persetujuan
                      </p>
                      <p className="text-xs text-yellow-700 mt-1">
                        Admin akan segera memproses
                      </p>
                    </div>
                  ) : isDeadlinePast ? (
                    <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-center">
                      <AlertCircle className="h-5 w-5 text-red-600 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-red-900">
                        Kursus Non-Aktif
                      </p>
                      <p className="text-xs text-red-700 mt-1">
                        Deadline terlewat
                      </p>
                    </div>
                  ) : isCompleted ? (
                    <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-center">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-green-900">
                        Kursus Selesai
                      </p>
                    </div>
                  ) : nextModuleId ? (
                    <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                      <Link href={`/courses/${course.id}/modules/${nextModuleId}`}>
                        Lanjutkan Belajar
                      </Link>
                    </Button>
                  ) : (
                    <Button disabled className="w-full">
                      Materi Belum Tersedia
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Help Card */}
            <Card className="bg-white">
              <CardContent className="p-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <AlertCircle className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 mb-1">
                      Butuh Bantuan?
                    </h4>
                    <p className="text-xs text-slate-600">
                      Hubungi tim Training HC jika ada kendala
                    </p>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
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

// ─── Sub-Components ───────────────────────────────────────────────────────────

function LearningStep({
  href,
  locked,
  done,
  type,
  title,
  meta,
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
  meta?: string;
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
  moduleInfo?: {
    duration: number;
    type: string;
  };
}) {
  const inner = (
    <Card className={cn(
      "transition-all duration-200",
      !locked && href && "hover:shadow-md hover:border-blue-300 cursor-pointer",
      locked && "opacity-60"
    )}>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div className={cn(
            "h-10 w-10 rounded-lg flex items-center justify-center shrink-0 font-semibold",
            done ? "bg-green-100 text-green-700" :
            locked ? "bg-slate-100 text-slate-400" :
            "bg-blue-100 text-blue-700"
          )}>
            {done ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : locked ? (
              <Lock className="h-4 w-4" />
            ) : number ? (
              <span>{number}</span>
            ) : (
              <span>★</span>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                {type}
              </Badge>
              {done && !testStatus && (
                <Badge className="text-xs bg-green-100 text-green-700 border-0">
                  Selesai
                </Badge>
              )}
              {testStatus === "LULUS" && (
                <Badge className="text-xs bg-green-100 text-green-700 border-0">
                  Lulus
                </Badge>
              )}
              {testStatus === "GAGAL" && (
                <Badge className="text-xs bg-red-100 text-red-700 border-0">
                  Gagal
                </Badge>
              )}
            </div>

            <h4 className="text-sm font-semibold text-slate-900 mb-1">
              {title}
            </h4>

            {/* Test Info */}
            {testInfo && (
              <div className="space-y-1.5 mt-2">
                <div className="flex items-center gap-4 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-blue-600" />
                    <span className="font-medium">{testInfo.duration} menit</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                    <span className="font-medium">KKM: {testInfo.passingScore}%</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-600">
                  <div>
                    <span className="font-medium">Percobaan:</span>{" "}
                    {testInfo.maxAttempts === 0 ? (
                      <span className="text-green-600 font-semibold">Unlimited</span>
                    ) : (
                      <span className={cn(
                        "font-semibold",
                        testInfo.attemptCount >= testInfo.maxAttempts ? "text-red-600" : "text-blue-600"
                      )}>
                        {testInfo.attemptCount}/{testInfo.maxAttempts}
                      </span>
                    )}
                  </div>
                  {(testInfo.randomizeQuestions || testInfo.randomizeOptions) && (
                    <div className="flex items-center gap-1">
                      <span className="text-amber-600">🔀</span>
                      <span className="text-amber-700 font-medium">
                        {testInfo.randomizeQuestions && testInfo.randomizeOptions
                          ? "Soal & Opsi Acak"
                          : testInfo.randomizeQuestions
                          ? "Soal Acak"
                          : "Opsi Acak"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Module Info */}
            {moduleInfo && (
              <div className="flex items-center gap-4 text-xs text-slate-600 mt-2">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-blue-600" />
                  <span className="font-medium">
                    {moduleInfo.duration > 0 
                      ? `~${moduleInfo.duration} menit` 
                      : "Durasi fleksibel"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-medium">
                    {moduleInfo.type === "VIDEO" ? "📹 Video" : "📄 Dokumen"}
                  </span>
                </div>
              </div>
            )}

            {meta && !testInfo && !moduleInfo && (
              <p className="text-xs text-slate-600 mt-1">
                {meta}
              </p>
            )}

            {lockReason && (
              <p className="text-xs text-yellow-600 mt-2 flex items-center gap-1">
                <Lock className="h-3 w-3" />
                {lockReason}
              </p>
            )}
          </div>

          {/* Arrow */}
          {!locked && href && (
            <ChevronRight className="h-5 w-5 text-slate-400 shrink-0" />
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (!locked && href) {
    return <Link href={href}>{inner}</Link>;
  }

  return inner;
}
