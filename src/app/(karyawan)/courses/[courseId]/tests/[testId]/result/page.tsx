import { db } from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Target,
  Clock,
  CalendarDays,
  Trophy,
  ChevronRight,
  RotateCcw,
  BookOpen,
  FileCheck2,
  Check,
  X,
  PlayCircle,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { getTestAttemptDetail } from "@/actions/test";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Hasil Ujian | E-Learning BNI Finance",
};

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

function formatDuration(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}j ${m}m ${s}d`;
  if (m > 0) return `${m}m ${s}d`;
  return `${s}d`;
}

export default async function TestResultPage({
  params,
  searchParams,
}: {
  params: { courseId: string; testId: string };
  searchParams: { attemptId?: string };
}) {
  const session = await auth();
  if (!session?.user?.id) return redirect("/");
  if (!searchParams.attemptId)
    return redirect(`/courses/${params.courseId}/tests/${params.testId}`);

  const attempt = await getTestAttemptDetail(searchParams.attemptId);
  if (!attempt) return redirect(`/courses/${params.courseId}`);
  if (attempt.testId !== params.testId || (attempt as any).test?.courseId !== params.courseId) {
    return redirect(`/courses/${params.courseId}`);
  }

  const isPassed = attempt.passed;
  const score = Math.round(attempt.score ?? 0);
  const passingScore = attempt.test.passingScore ?? 0;
  const testType = attempt.test.type;
  const totalQ = attempt.test.questions.length;
  const correctCount = attempt.answers.filter((a: any) => a.isCorrect).length;
  const wrongCount = totalQ - correctCount;

  const attemptCount = await db.testAttempt.count({
    where: { userId: session.user.id, testId: attempt.testId, status: { in: ["SUBMITTED", "FORCE_SUBMITTED"] } },
  });

  const allAttempts = await db.testAttempt.findMany({
    where: { userId: session.user.id, testId: attempt.testId, status: { in: ["SUBMITTED", "FORCE_SUBMITTED"] } },
    select: { score: true, passed: true },
    orderBy: { score: "desc" },
  });

  const bestScore = allAttempts[0] ? Math.round(allAttempts[0].score ?? 0) : score;
  const hasBestScore = allAttempts.length > 1;
  const isCurrentBest = score === bestScore;

  const effectiveMaxAttempts = attempt.test.maxAttempts > 0 ? attempt.test.maxAttempts : 999;
  const remainingAttempts =
    effectiveMaxAttempts > 0
      ? Math.max(0, effectiveMaxAttempts - attemptCount)
      : Infinity;
  const canTryAgain =
    effectiveMaxAttempts > 0
      ? attemptCount < effectiveMaxAttempts
      : true;

  const duration =
    attempt.timeSpent && attempt.timeSpent > 0
      ? formatDuration(attempt.timeSpent)
      : "—";

  // Sort answers by answerOrder
  const sortedAnswers = [...attempt.answers].sort(
    (a, b) => (a.answerOrder ?? 0) - (b.answerOrder ?? 0)
  );

  // Score ring configuration
  const circumference = 2 * Math.PI * 44;
  const offset = circumference * (1 - score / 100);

  return (
    <div
      className="min-h-screen bg-[#F8F9FB] selection:bg-[#0F1C3F]/10 pb-20"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* ═══ Hero Header ════════════════════════════════════════════════ */}
      <header
        className="relative pt-8 pb-12 lg:pt-12 lg:pb-16 overflow-hidden border-b border-[#1A2D5A]"
        style={{
          background: `linear-gradient(135deg, ${t.navy} 0%, #12224A 50%, #1A3060 100%)`,
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

        <div className="relative z-10 max-w-[1000px] mx-auto px-5 sm:px-6">
          <Link
            href={`/courses/${params.courseId}`}
            className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-white/70 hover:text-white transition-all font-['DM_Sans'] bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-xl border border-white/10 outline-none mb-6"
          >
            <ArrowLeft size={13} />
            Kembali ke Kursus
          </Link>

          <div className="space-y-4">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white font-['Lexend_Deca'] leading-tight tracking-tight">
              {attempt.test.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#EFF8FF] text-[#175CD3] text-[10px] font-bold uppercase tracking-wider">
                {testType === "PRE" ? "Pre-Test" : "Post-Test"}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 text-white/90 text-[10px] font-bold uppercase tracking-wider border border-white/20">
                Percobaan {attemptCount}
              </span>
              {hasBestScore && isCurrentBest && (
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#FFFAEB] text-[#B54708] text-[10px] font-bold uppercase tracking-wider border border-[#FEC84B]/40">
                  <Trophy size={12} className="inline mr-1" />
                  Skor Terbaik
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ═══ Main Content ════════════════════════════════════════════════ */}
      <div className="relative z-20 max-w-[1000px] mx-auto px-5 sm:px-6 -mt-8 space-y-6">
        
        {/* ── Score Card ─────────────────────────────────────── */}
        <Card className={cn(
          "rounded-2xl border overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)]",
          isPassed
            ? "border-[#6CE9A6]/50 bg-white"
            : "border-[#FEC84B]/50 bg-white"
        )}>
          <div className={cn(
            "h-1.5 w-full",
            isPassed ? "bg-gradient-to-r from-[#12B76A] to-[#027A48]" : "bg-gradient-to-r from-[#F79009] to-[#B54708]"
          )} />
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col md:flex-row gap-8 lg:gap-12 items-center">
              {/* Score Ring */}
              <div className="relative shrink-0">
                <svg
                  className="w-40 h-40 transform -rotate-90"
                  viewBox="0 0 100 100"
                  aria-hidden="true"
                >
                  {/* Track */}
                  <circle
                    cx="50" cy="50" r="44"
                    fill="none"
                    stroke={isPassed ? "#D1FAE5" : "#FEF3C7"}
                    strokeWidth="8"
                  />
                  {/* Progress */}
                  <circle
                    cx="50" cy="50" r="44"
                    fill="none"
                    stroke={isPassed ? "#12B76A" : "#F79009"}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>

                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] font-bold text-[#98A2B3] uppercase tracking-widest mb-1">
                    Skor Akhir
                  </span>
                  <span className="text-5xl font-extrabold text-[#0F1C3F] font-['Lexend_Deca'] leading-none">
                    {score}<span className="text-2xl">%</span>
                  </span>
                </div>
              </div>

              {/* Result info */}
              <div className="flex-1 w-full text-center md:text-left space-y-5">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
                  <div
                    className={cn(
                      "h-12 w-12 rounded-xl flex items-center justify-center shrink-0 border",
                      isPassed ? "bg-[#ECFDF3] border-[#A6F4C5]" : "bg-[#FEF3F2] border-[#FECDCA]"
                    )}
                  >
                    {isPassed ? (
                      <CheckCircle2 className="h-6 w-6 text-[#12B76A]" />
                    ) : (
                      <XCircle className="h-6 w-6 text-[#F04438]" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-2xl font-extrabold text-[#0F1C3F] font-['Lexend_Deca']">
                      {isPassed ? "Selamat! Anda Lulus." : "Anda Belum Lulus."}
                    </h3>
                    <p className="text-[#475467] text-sm mt-1">
                      {isPassed 
                        ? `Anda telah melewati ambang batas kelulusan sebesar ${passingScore}%.`
                        : `Skor Anda di bawah ambang batas kelulusan (${passingScore}%). Silakan coba lagi.`}
                    </p>
                  </div>
                </div>

                {/* Meta pills */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F8F9FB] border border-[#E4E7EC] text-xs font-semibold text-[#475467]">
                    <Target size={14} className="text-[#64748B]" />
                    Batas Lulus: {passingScore}%
                  </div>
                  {hasBestScore && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FFFAEB] border border-[#FEC84B]/40 text-xs font-semibold text-[#B54708]">
                      <Trophy size={14} className="text-[#E8A020]" />
                      Tertinggi: {bestScore}%
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F8F9FB] border border-[#E4E7EC] text-xs font-semibold text-[#475467]">
                    <RotateCcw size={14} className="text-[#64748B]" />
                    Sisa Percobaan: {effectiveMaxAttempts === 0 ? "Tak Terbatas" : remainingAttempts}
                  </div>
                </div>

                {/* CTAs */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                  {canTryAgain ? (
                    <>
                      <Button
                        asChild
                        className={cn(
                          "h-10 px-5 rounded-xl text-sm font-bold transition-all border-0 shadow-sm",
                          isPassed
                            ? "bg-[#12B76A] hover:bg-[#027A48] text-white"
                            : "bg-[#0F1C3F] hover:bg-[#1A3060] text-white"
                        )}
                      >
                        <Link href={`/courses/${params.courseId}/tests/${params.testId}`}>
                          {isPassed ? "Tingkatkan Nilai" : "Ulangi Ujian"}
                          <ChevronRight size={14} className="ml-1" />
                        </Link>
                      </Button>
                      <Button
                        asChild
                        variant="outline"
                        className="h-10 px-5 rounded-xl text-sm font-semibold border-[#E4E7EC] text-[#475467] hover:bg-[#F8F9FB] transition-all"
                      >
                        <Link href={`/courses/${params.courseId}`}>
                          <BookOpen size={14} className="mr-1.5" />
                          Kembali ke Kursus
                        </Link>
                      </Button>
                    </>
                  ) : (
                    <Button
                      asChild
                      className="h-10 px-5 rounded-xl text-sm font-bold bg-[#0F1C3F] hover:bg-[#1A3060] text-white shadow-sm transition-all"
                    >
                      <Link href={`/courses/${params.courseId}`}>
                        Kembali ke Kursus
                        <ChevronRight size={14} className="ml-1" />
                      </Link>
                    </Button>
                  )}
                  <a
                    href="#review"
                    className="inline-flex items-center justify-center h-10 px-5 rounded-xl border border-[#E4E7EC] bg-white text-[#475467] text-sm font-semibold hover:bg-[#F8F9FB] transition-all"
                  >
                    <FileCheck2 size={14} className="mr-1.5" />
                    Review Jawaban
                  </a>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Stats Grid ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="rounded-2xl border border-[#E4E7EC] bg-white shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#ECFDF3] border border-[#A6F4C5] flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-5 w-5 text-[#12B76A]" />
              </div>
              <div>
                <p className="text-xl font-extrabold text-[#0F1C3F] font-['Lexend_Deca'] tabular-nums leading-none">
                  {correctCount}/{totalQ}
                </p>
                <p className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider mt-1">
                  Benar
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-[#E4E7EC] bg-white shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#FEF3F2] border border-[#FECDCA] flex items-center justify-center shrink-0">
                <XCircle className="h-5 w-5 text-[#F04438]" />
              </div>
              <div>
                <p className="text-xl font-extrabold text-[#0F1C3F] font-['Lexend_Deca'] tabular-nums leading-none">
                  {wrongCount}
                </p>
                <p className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider mt-1">
                  Salah
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-[#E4E7EC] bg-white shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#F8F9FB] border border-[#E4E7EC] flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5 text-[#64748B]" />
              </div>
              <div>
                <p className="text-xl font-extrabold text-[#0F1C3F] font-['Lexend_Deca'] tabular-nums leading-none">
                  {duration}
                </p>
                <p className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider mt-1">
                  Waktu
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-[#E4E7EC] bg-white shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#F8F9FB] border border-[#E4E7EC] flex items-center justify-center shrink-0">
                <CalendarDays className="h-5 w-5 text-[#64748B]" />
              </div>
              <div>
                <p className="text-lg font-bold text-[#0F1C3F] font-['Lexend_Deca'] leading-tight">
                  {attempt.completedAt
                    ? new Date(attempt.completedAt).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "—"}
                </p>
                <p className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider mt-1">
                  Tanggal
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Answer Review ─────────────────────────────────── */}
        <Card id="review" className="rounded-2xl border border-[#E4E7EC] bg-white shadow-sm overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-[#E4E7EC] bg-[#F8F9FB] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <BookOpen className="h-5 w-5 text-[#475467]" />
              <h2 className="text-base font-bold text-[#0F1C3F] font-['Lexend_Deca']">
                Lembar Jawaban
              </h2>
            </div>
            <Badge className="bg-white text-[#475467] border-[#E4E7EC] hover:bg-white text-[11px] font-bold">
              {totalQ} Soal
            </Badge>
          </div>

          <CardContent className="p-0 flex flex-col divide-y divide-[#E4E7EC]">
            {sortedAnswers.length === 0 && (
              <div className="p-8 text-center text-[#475467] text-sm">
                Belum ada jawaban yang tersimpan.
              </div>
            )}
            
            {sortedAnswers.map((answer: any, idx: number) => {
              const question = (attempt as any).test.questions.find(
                (q: any) => q.id === answer.questionId
              );
              if (!question) return null;

              const isCorrect = answer?.isCorrect ?? false;

              return (
                <div key={question.id} className="p-5 sm:p-6 hover:bg-[#F8F9FB]/50 transition-colors">
                  <div className="flex flex-col md:flex-row gap-6">
                    
                    {/* Question Column */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={cn(
                          "flex items-center justify-center w-7 h-7 rounded-lg text-xs font-extrabold shrink-0 border",
                          isCorrect ? "bg-[#ECFDF3] border-[#A6F4C5] text-[#027A48]" : "bg-[#FEF3F2] border-[#FECDCA] text-[#B42318]"
                        )}>
                          {idx + 1}
                        </div>
                        <Badge
                          className={cn(
                            "text-[10px] font-bold uppercase tracking-wider",
                            isCorrect
                              ? "bg-[#ECFDF3] text-[#027A48] border-[#A6F4C5] hover:bg-[#ECFDF3]"
                              : "bg-[#FEF3F2] text-[#B42318] border-[#FECDCA] hover:bg-[#FEF3F2]"
                          )}
                          variant="outline"
                        >
                          {isCorrect ? "Benar" : "Salah"}
                        </Badge>
                      </div>
                      <p className="text-[#101828] text-sm font-medium leading-relaxed">
                        {question.text}
                      </p>
                    </div>

                    {/* Options Column */}
                    <div className="flex-1 w-full space-y-2">
                      {question.options
                        .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))
                        .map((option: any, optIdx: number) => {
                          const label = String.fromCharCode(65 + optIdx);
                          const isUserSelected = answer?.selectedOptionId === option.id;
                          const isOptionCorrect = option.isCorrect;

                          // Minimalist Option styling
                          let stateClass = "bg-white border-[#E4E7EC]";
                          let labelClass = "bg-[#F1F3F7] text-[#64748B]";
                          let textClass = "text-[#475467]";
                          let indicator = null;

                          if (isUserSelected && isCorrect) {
                            stateClass = "bg-[#ECFDF3] border-[#6CE9A6]";
                            labelClass = "bg-[#12B76A] text-white";
                            textClass = "text-[#027A48] font-semibold";
                            indicator = <CheckCircle2 size={16} className="text-[#12B76A] shrink-0" />;
                          } else if (isUserSelected && !isCorrect) {
                            stateClass = "bg-[#FEF3F2] border-[#FDA29B]";
                            labelClass = "bg-[#F04438] text-white";
                            textClass = "text-[#B42318] font-semibold";
                            indicator = <XCircle size={16} className="text-[#F04438] shrink-0" />;
                          } else if (!isUserSelected && isOptionCorrect) {
                            stateClass = "bg-white border-[#E4E7EC] ring-1 ring-[#12B76A]/50";
                            labelClass = "bg-white border border-[#E4E7EC] text-[#101828]";
                            textClass = "text-[#101828] font-medium";
                            indicator = (
                              <div className="flex items-center gap-1 text-[10px] font-bold text-[#12B76A] uppercase tracking-wider shrink-0 bg-[#ECFDF3] px-2 py-0.5 rounded">
                                <Check size={12} />
                                Kunci
                              </div>
                            );
                          }

                          return (
                            <div
                              key={option.id}
                              className={cn(
                                "flex items-start gap-3 p-3 rounded-xl border transition-colors",
                                stateClass
                              )}
                            >
                              <div className={cn(
                                "w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 mt-0.5",
                                labelClass
                              )}>
                                {label}
                              </div>
                              <div className="flex-1 flex items-start justify-between gap-4 pt-1">
                                <p className={cn("text-sm leading-snug", textClass)}>
                                  {option.text}
                                </p>
                                {indicator}
                              </div>
                            </div>
                          );
                        })}
                    </div>

                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
