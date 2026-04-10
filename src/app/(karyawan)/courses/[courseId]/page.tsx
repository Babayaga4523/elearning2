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
  BarChart3,
  AlertCircle,
  Target,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EnrollButton } from "@/components/courses/enroll-button";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type UserProgress = { isCompleted: boolean };
type TestAttempt = { id: string };

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
  deadline: Date | null;
};

type CourseDetail = {
  id: string;
  title: string;
  description: string | null;
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

function formatDeadlineDate(deadline: Date): string {
  return new Date(deadline).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
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
      tests: { include: { attempts: { where: { userId }, orderBy: { createdAt: "desc" } } } },
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

  // Deadline
  const deadlineDays = enrollment?.deadline
    ? formatDeadlineLabel(enrollment.deadline)
    : course.deadlineDuration
    ? `${course.deadlineDuration} Hari`
    : "Tanpa Batas";
  const isDeadlinePast =
    !!enrollment?.deadline && enrollment.deadline.getTime() < Date.now();

  const isAllModulesCompleted = totalModules > 0 && completedModules === totalModules;

  // First incomplete module — for "Lanjutkan Belajar" CTA
  const nextModuleId =
    course.modules.find((m) => !m.userProgress[0]?.isCompleted)?.id ??
    course.modules[0]?.id;

  return (
    <div className="min-h-screen bg-[#F4F6FB]">
      {/* Top spacer (navbar clearance) */}
      <div className="h-6 w-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-24 space-y-8">
        {/* ── Navigation ── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <Link
            href="/courses"
            className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-slate-400 hover:text-indigo-600 uppercase tracking-widest transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Katalog Kursus
          </Link>

          {!isEnrolled && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-3 py-1.5">
              <Lock className="h-3.5 w-3.5 shrink-0" />
              <span className="text-[10px] font-black uppercase tracking-widest">
                Mode Pratinjau — Daftar Untuk Akses Penuh
              </span>
            </div>
          )}
        </div>

        {/* ── Main Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* ─────────────── LEFT COLUMN ─────────────── */}
          <div className="lg:col-span-2 space-y-7">
            {/* Hero Card */}
            <div className="relative rounded-3xl bg-[#0F1C3F] overflow-hidden shadow-2xl">
              {/* Decorative blobs */}
              <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full bg-[#E8A020]/10 blur-2xl pointer-events-none" />

              <div className="relative z-10 p-8 md:p-12 space-y-5">
                <Badge className="bg-[#E8A020]/20 text-[#E8A020] border border-[#E8A020]/30 px-3 py-0.5 text-[10px] font-black uppercase tracking-widest hover:bg-[#E8A020]/20">
                  {course.category?.name ?? "Kursus"}
                </Badge>

                <h1 className="text-3xl md:text-4xl font-black text-white leading-tight tracking-tight">
                  {course.title}
                </h1>

                {course.description && (
                  <p className="text-slate-300 text-base leading-relaxed max-w-2xl">
                    {course.description}
                  </p>
                )}

                {/* Stats Row */}
                <div className="flex flex-wrap gap-5 pt-2">
                  <StatPill
                    icon={<BookOpen className="h-4 w-4 text-indigo-300" />}
                    label="Kurikulum"
                    value={`${totalModules} Modul · ${course.tests.length} Tes`}
                    bg="bg-white/5"
                  />

                  {enrollment?.deadline && (
                    <StatPill
                      icon={<Clock className="h-4 w-4 text-rose-300" />}
                      label={formatDeadlineDate(enrollment.deadline)}
                      value={deadlineDays}
                      bg={isDeadlinePast ? "bg-rose-500/20" : "bg-white/5"}
                      valueClass={isDeadlinePast ? "text-rose-400" : "text-white"}
                    />
                  )}

                  <StatPill
                    icon={<BarChart3 className="h-4 w-4 text-emerald-300" />}
                    label="Status"
                    value={
                      enrollment
                        ? enrollment.status.replace(/_/g, " ")
                        : "Belum Terdaftar"
                    }
                    bg="bg-white/5"
                  />
                </div>
              </div>
            </div>

            {/* Curriculum */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-800 tracking-tight">
                  Kurikulum Belajar
                </h2>
                <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                  {totalModules} MATERI
                </span>
              </div>

              <div className="space-y-2.5">
                {/* Pre-Test */}
                {preTest && (
                  <CurriculumItem
                    href={
                      isEnrolled
                        ? preTest.attempts.length > 0
                          ? `/courses/${course.id}/tests/${preTest.id}/result?attemptId=${preTest.attempts[0].id}`
                          : `/courses/${course.id}/tests/${preTest.id}`
                        : null
                    }
                    locked={!isEnrolled}
                    done={preTest.attempts.length > 0}
                    icon={<FileText className="h-5 w-5" />}
                    overline="Mulai Di Sini"
                    title={preTest.title}
                    action={preTest.attempts.length > 0 ? "Lihat Hasil" : "Mulai Ujian"}
                    accentColor="indigo"
                    duration={preTest.duration}
                    maxAttempts={preTest.maxAttempts}
                  />
                )}

                {/* Modules */}
                {course.modules.map((module, index) => {
                  const isDone = module.userProgress[0]?.isCompleted === true;
                  return (
                    <CurriculumItem
                      key={module.id}
                      href={
                        isEnrolled
                          ? `/courses/${course.id}/modules/${module.id}`
                          : null
                      }
                      locked={!isEnrolled}
                      done={isDone}
                      icon={
                        isDone ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : module.type === "VIDEO" ? (
                          <PlayCircle className="h-5 w-5" />
                        ) : (
                          <span className="text-sm font-black">{index + 1}</span>
                        )
                      }
                      overline={module.type}
                      title={module.title}
                      action="Buka Materi"
                      accentColor="emerald"
                    />
                  );
                })}

                {postTest && (
                  <div
                    className={cn(
                      "rounded-2xl border-2 border-dashed overflow-hidden transition-all",
                      isEnrolled && isAllModulesCompleted
                        ? "border-amber-400 bg-amber-50 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
                        : "border-slate-200 bg-slate-50/50 opacity-60"
                    )}
                  >
                    {isEnrolled && isAllModulesCompleted ? (
                      <Link
                        href={
                          postTest.attempts.length > 0
                            ? `/courses/${course.id}/tests/${postTest.id}/result?attemptId=${postTest.attempts[0].id}`
                            : `/courses/${course.id}/tests/${postTest.id}`
                        }
                        className="block"
                      >
                        <PostTestContent
                          postTest={postTest}
                          isEnrolled={isEnrolled}
                          locked={false}
                        />
                      </Link>
                    ) : (
                      <PostTestContent
                        postTest={postTest}
                        isEnrolled={isEnrolled}
                        locked={!isAllModulesCompleted}
                      />
                    )}
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* ─────────────── RIGHT SIDEBAR ─────────────── */}
          <aside className="space-y-4 lg:sticky lg:top-6">
            {/* Progress Card */}
            <Card className="rounded-3xl border-0 shadow-xl overflow-hidden bg-white">
              <CardContent className="p-7 space-y-6">
                {/* Progress circle-ish indicator */}
                <div className="text-center space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Progres Belajar
                  </p>
                  <p className="text-6xl font-black text-slate-900 tabular-nums">
                    {progress}
                    <span className="text-2xl text-slate-300">%</span>
                  </p>
                  <p className="text-xs text-slate-400 font-medium">
                    {completedModules} dari {totalModules} modul selesai
                  </p>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-1000"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="h-px bg-slate-50" />

                {/* Meta Info */}
                <div className="space-y-3 text-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    Informasi Kursus
                  </p>

                  <InfoRow
                    label="Batas Waktu"
                    value={deadlineDays}
                    valueClass={
                      isDeadlinePast
                        ? "text-rose-600"
                        : enrollment?.deadline
                        ? "text-amber-600"
                        : "text-slate-600"
                    }
                  />

                  <InfoRow
                    label="Passing Score"
                    value={
                      postTest?.passingScore != null
                        ? `${postTest.passingScore}%`
                        : "—"
                    }
                    valueClass="text-emerald-600"
                  />

                  <InfoRow
                    label="Pre-Test"
                    value={
                      preTest
                        ? preTest.attempts.length > 0
                          ? "✓ Selesai"
                          : "Belum Dikerjakan"
                        : "Tidak Ada"
                    }
                    valueClass={
                      preTest?.attempts.length ? "text-emerald-600" : "text-slate-500"
                    }
                  />
                </div>

                {/* CTA Button */}
                <div className="pt-1">
                  {!isEnrolled ? (
                    <EnrollButton courseId={course.id} />
                  ) : isCompleted ? (
                    <div className="w-full h-12 bg-emerald-50 text-emerald-600 font-black rounded-2xl flex items-center justify-center gap-2 border border-emerald-100">
                      <Trophy className="h-4 w-4" />
                      Lulus Kursus
                    </div>
                  ) : nextModuleId ? (
                    <Link href={`/courses/${course.id}/modules/${nextModuleId}`}>
                      <Button className="w-full h-12 bg-[#0F1C3F] hover:bg-[#162847] text-white font-black rounded-2xl shadow-md shadow-slate-300 gap-2">
                        Lanjutkan Belajar
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      disabled
                      className="w-full h-12 font-black rounded-2xl"
                    >
                      Belum Ada Materi
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Help Card */}
            <div className="rounded-3xl bg-gradient-to-br from-[#0F1C3F] to-indigo-800 p-7 text-white space-y-3 shadow-xl relative overflow-hidden">
              <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-white/5 blur-xl pointer-events-none" />
              <div className="relative z-10 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300">
                  Butuh Bantuan?
                </p>
                <p className="text-sm text-indigo-100 leading-relaxed font-medium">
                  Kendala teknis atau pertanyaan materi? Hubungi tim Training HC
                  melalui portal support kami.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full font-bold h-9 rounded-xl text-slate-800"
                >
                  Hubungi Support
                </Button>
              </div>
            </div>

            {/* Deadline warning banner — only show if past */}
            {isDeadlinePast && (
              <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 flex items-start gap-3">
                <AlertCircle className="h-4 w-4 text-rose-500 mt-0.5 shrink-0" />
                <p className="text-xs text-rose-700 font-semibold leading-relaxed">
                  Deadline kursus ini telah terlewat. Hubungi admin untuk
                  perpanjangan akses.
                </p>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function StatPill({
  icon,
  label,
  value,
  bg,
  valueClass = "text-white",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  bg: string;
  valueClass?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3 rounded-2xl px-4 py-2.5", bg)}>
      <div className="shrink-0">{icon}</div>
      <div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">
          {label}
        </p>
        <p className={cn("text-sm font-bold capitalize leading-none", valueClass)}>
          {value}
        </p>
      </div>
    </div>
  );
}

function CurriculumItem({
  href,
  locked,
  done,
  icon,
  overline,
  title,
  action,
  accentColor,
  duration,
  maxAttempts,
}: {
  href: string | null;
  locked: boolean;
  done: boolean;
  icon: React.ReactNode;
  overline: string;
  title: string;
  action: string;
  accentColor: "emerald" | "indigo";
  duration?: number;
  maxAttempts?: number;
}) {
  const accent = {
    emerald: {
      hover: "hover:border-emerald-300 hover:shadow-emerald-50",
      iconDone: "bg-emerald-500 text-white",
      iconDefault: "bg-slate-100 text-slate-400 group-hover:bg-emerald-500 group-hover:text-white",
      overline: "text-emerald-500",
      chevron: "group-hover:text-emerald-500",
    },
    indigo: {
      hover: "hover:border-indigo-300 hover:shadow-indigo-50",
      iconDone: "bg-emerald-500 text-white",
      iconDefault: "bg-indigo-50 text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white",
      overline: "text-indigo-400",
      chevron: "group-hover:text-indigo-500",
    },
  }[accentColor];

  const inner = (
    <div className="flex items-center gap-4 p-4">
      <div
        className={cn(
          "h-11 w-11 shrink-0 rounded-xl flex items-center justify-center transition-colors duration-300",
          done ? accent.iconDone : accent.iconDefault
        )}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-[9px] font-black uppercase tracking-widest mb-0.5", accent.overline)}>
          {overline}
        </p>
        <h4 className="text-sm font-black text-slate-800 leading-tight truncate">
          {title}
        </h4>
        {(duration !== undefined || maxAttempts !== undefined) && (
          <div className="flex items-center gap-3 mt-1">
            {duration !== undefined && (
              <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400">
                <Clock className="h-3 w-3" />
                {duration} Menit
              </div>
            )}
            {maxAttempts !== undefined && (
              <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400">
                <BarChart3 className="h-3 w-3" />
                {maxAttempts === 0 ? "Unlimited" : `${maxAttempts} Percobaan`}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {done ? (
          <span className="text-[10px] font-black text-emerald-500">
            Selesai
          </span>
        ) : locked ? (
          <Lock className="h-4 w-4 text-slate-300" />
        ) : (
          <span className={cn("text-[10px] font-bold text-slate-300 hidden group-hover:block", accent.chevron)}>
            {action}
          </span>
        )}
        <ChevronRight
          className={cn(
            "h-4 w-4 text-slate-200 transition-colors",
            !locked && accent.chevron
          )}
        />
      </div>
    </div>
  );

  const cardClass = cn(
    "group bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all duration-200",
    !locked && `${accent.hover} hover:shadow-md hover:-translate-y-0.5 cursor-pointer`,
    locked && "opacity-50 grayscale cursor-not-allowed"
  );

  if (!locked && href) {
    return (
      <Link href={href} className={cardClass}>
        {inner}
      </Link>
    );
  }

  return <div className={cardClass}>{inner}</div>;
}

function PostTestContent({
  postTest,
  isEnrolled,
  locked,
}: {
  postTest: TestWithAttempts;
  isEnrolled: boolean;
  locked: boolean;
}) {
  return (
    <div className="p-4 flex items-center gap-4">
      <div
        className={cn(
          "h-11 w-11 shrink-0 rounded-xl flex items-center justify-center transition-colors duration-300",
          postTest.attempts.length > 0
            ? "bg-emerald-500 text-white"
            : "bg-amber-100 text-amber-500 group-hover:bg-amber-500 group-hover:text-white"
        )}
      >
        <Trophy className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-0.5">
          Final Challenge
        </p>
        <h4 className="text-sm font-black text-slate-800 leading-tight">
          {postTest.title}
        </h4>
        <div className="flex items-center gap-3 mt-1 mb-1">
          <div className="flex items-center gap-1 text-[9px] font-bold text-amber-600/70">
            <Clock className="h-3 w-3" />
            {postTest.duration} Menit
          </div>
          <div className="flex items-center gap-1 text-[9px] font-bold text-amber-600/70">
            <Target className="h-3 w-3" />
            {postTest.maxAttempts === 0 ? "Unlimited" : `${postTest.maxAttempts} Percobaan`}
          </div>
        </div>
        {locked && (
           <p className="text-[10px] text-rose-500 font-bold flex items-center gap-1">
             <Lock className="h-3 w-3" /> Selesaikan semua modul untuk membuka
           </p>
        )}
      </div>
      {isEnrolled && !locked && (
        <span
          className={cn(
            "shrink-0 text-[10px] font-black px-3 py-1.5 rounded-xl",
            postTest.attempts.length > 0
              ? "bg-emerald-100 text-emerald-700"
              : "bg-amber-100 text-amber-700 group-hover:bg-amber-500 group-hover:text-white transition-colors"
          )}
        >
          {postTest.attempts.length > 0 ? "Hasil Ujian" : "Ambil Post-Test"}
        </span>
      )}
      {locked && (
        <Lock className="h-5 w-5 text-slate-300 mr-2" />
      )}
    </div>
  );
}

function InfoRow({
  label,
  value,
  valueClass = "text-slate-700",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-slate-400 font-medium">{label}</span>
      <span className={cn("font-black text-right", valueClass)}>{value}</span>
    </div>
  );
}