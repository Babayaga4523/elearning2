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

// Next.js 15: params and searchParams are now Promises
interface PageProps {
  params: Promise<{ courseId: string; testId: string }>;
  searchParams: Promise<{ attemptId?: string; [key: string]: string | undefined }>;
}

function formatDuration(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}j ${m}m ${s}d`;
  if (m > 0) return `${m}m ${s}d`;
  return `${s}d`;
}

export default async function TestResultPage({ params, searchParams }: PageProps) {
  const { courseId, testId } = await params;
  const { attemptId } = await searchParams;

  const session = await auth();
  if (!session?.user?.id) return redirect("/");
  if (!attemptId)
    return redirect(`/courses/${courseId}/tests/${testId}`);

  const attempt = await getTestAttemptDetail(attemptId);

  // Move redirect checks outside try-catch block
  if (!attempt) {
    return redirect(`/courses/${courseId}`);
  }

  // Validate attempt belongs to the correct test and course
  const attemptCourseId = attempt.test?.courseId;
  if (attempt.testId !== testId || attemptCourseId !== courseId) {
    return redirect(`/courses/${courseId}`);
  }

  const isPassed = attempt.passed;
  const score = Math.round(attempt.score ?? 0);
  const passingScore = attempt.test.passingScore ?? 0;
  const testType = attempt.test.type;
  const totalQ = attempt.test.questions.length;
  const correctCount = attempt.answers.filter((a) => a.isCorrect).length;
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
    (effectiveMaxAttempts > 0
      ? attemptCount < effectiveMaxAttempts
      : true) && bestScore < 100;

  const duration =
    attempt.timeSpent && attempt.timeSpent > 0
      ? formatDuration(attempt.timeSpent)
      : "—";

  // Sort answers by answerOrder
  const sortedAnswers = [...attempt.answers].sort(
    (a, b) => (a.answerOrder ?? 0) - (b.answerOrder ?? 0)
  );

  // Create a map of questionId -> question for O(1) lookup
  const questionMap = new Map(attempt.test.questions.map(q => [q.id, q]));

  // Score ring configuration
  const circumference = 2 * Math.PI * 44;
  const offset = circumference * (1 - score / 100);

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      {/* ═══ Page Header ════════════════════════════════════════════════ */}
      <header className="bg-white border-b border-[#E4E7EC]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-[#98A2B3] mb-4">
            <Link href={`/courses/${courseId}`} className="hover:text-[#475467] transition-colors flex items-center gap-1">
              <ArrowLeft size={12} />
              Kursus
            </Link>
            <ChevronRight size={12} />
            <span className="text-[#101828] font-medium">{attempt.test.title}</span>
          </nav>

          {/* Title Row */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#EFF8FF] text-[#175CD3] text-[10px] font-medium uppercase tracking-wide">
                  {testType === "PRE" ? "Pre-Test" : "Post-Test"}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#F8F9FB] text-[#475467] text-[10px] font-medium uppercase tracking-wide border border-[#E4E7EC]">
                  Percobaan {attemptCount}
                </span>
                {hasBestScore && isCurrentBest && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#FEF3DC] text-[#C4861A] text-[10px] font-medium uppercase tracking-wide border border-[#F5C05A]">
                    <Trophy size={10} className="inline mr-1" />
                    Skor Terbaik
                  </span>
                )}
              </div>
              <h1 className="text-lg md:text-xl font-semibold text-[#0F1C3F] font-['Lexend_Deca'] leading-tight">
                {attempt.test.title}
              </h1>
              <p className="text-sm text-[#475467]">
                Hasil ujian dan review jawaban
              </p>
            </div>

            {/* Page Actions */}
            <div className="flex items-center gap-2">
              {canTryAgain && (
                <Button
                  asChild
                  className={cn(
                    "h-9 px-4 rounded-lg text-xs font-medium transition-all border-0",
                    isPassed
                      ? "bg-[#12B76A] hover:bg-[#027A48] text-white"
                      : "bg-[#E8A020] hover:bg-[#C4861A] text-white"
                  )}
                >
                  <Link href={`/courses/${courseId}/tests/${testId}`}>
                    {isPassed ? "Tingkatkan Nilai" : "Ulangi Ujian"}
                    <ChevronRight size={12} className="ml-1" />
                  </Link>
                </Button>
              )}
              <Button
                asChild
                variant="outline"
                className="h-9 px-4 rounded-lg text-xs font-medium border-[#E4E7EC] text-[#475467] hover:bg-[#F8F9FB] transition-all"
              >
                <Link href={`/courses/${courseId}`}>
                  <BookOpen size={12} className="mr-1.5" />
                  Kembali
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* ═══ Main Content ════════════════════════════════════════════════ */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">

        {/* ── Score Card ─────────────────────────────────────── */}
        <Card className={cn(
          "rounded-lg border overflow-hidden",
          isPassed
            ? "border-[#6CE9A6]/50 bg-white"
            : "border-[#FEC84B]/50 bg-white"
        )}>
          <div className={cn(
            "h-1 w-full",
            isPassed ? "bg-[#12B76A]" : "bg-[#F79009]"
          )} />
          <CardContent className="p-5 sm:p-6">
            <div className="flex flex-col md:flex-row gap-6 items-center">
              {/* Score Ring */}
              <div className="relative shrink-0">
                <svg
                  className="w-32 h-32 transform -rotate-90"
                  viewBox="0 0 100 100"
                  aria-hidden="true"
                >
                  <circle
                    cx="50" cy="50" r="44"
                    fill="none"
                    stroke={isPassed ? "#D1FAE5" : "#FEF3C7"}
                    strokeWidth="6"
                  />
                  <circle
                    cx="50" cy="50" r="44"
                    fill="none"
                    stroke={isPassed ? "#12B76A" : "#F79009"}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-[9px] font-medium text-[#98A2B3] uppercase tracking-wider mb-0.5">
                    Skor
                  </span>
                  <span className="text-4xl font-semibold text-[#0F1C3F] font-['Lexend_Deca'] leading-none">
                    {score}<span className="text-lg">%</span>
                  </span>
                </div>
              </div>

              {/* Result info */}
              <div className="flex-1 w-full space-y-4">
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                      isPassed ? "bg-[#ECFDF3]" : "bg-[#FEF3F2]"
                    )}
                  >
                    {isPassed ? (
                      <CheckCircle2 className="h-5 w-5 text-[#12B76A]" />
                    ) : (
                      <XCircle className="h-5 w-5 text-[#F04438]" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#0F1C3F] font-['Lexend_Deca']">
                      {isPassed ? "Selamat! Anda Lulus." : "Anda Belum Lulus."}
                    </h3>
                    <p className="text-sm text-[#475467] mt-0.5">
                      {isPassed
                        ? `Anda telah melewati ambang batas kelulusan sebesar ${passingScore}%.`
                        : `Skor Anda di bawah ambang batas kelulusan (${passingScore}%). Silakan coba lagi.`}
                    </p>
                  </div>
                </div>

                {/* Meta pills */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F8F9FB] border border-[#E4E7EC] text-xs font-medium text-[#475467]">
                    <Target size={12} className="text-[#64748B]" />
                    Batas Lulus: {passingScore}%
                  </div>
                  {hasBestScore && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FEF3DC] border border-[#F5C05A] text-xs font-medium text-[#C4861A]">
                      <Trophy size={12} className="text-[#E8A020]" />
                      Tertinggi: {bestScore}%
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F8F9FB] border border-[#E4E7EC] text-xs font-medium text-[#475467]">
                    <RotateCcw size={12} className="text-[#64748B]" />
                    Sisa: {effectiveMaxAttempts === 0 ? "∞" : remainingAttempts}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Stats Grid ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="rounded-lg border border-[#E4E7EC] bg-white">
            <CardContent className="p-3 flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-md bg-[#ECFDF3] flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-4 w-4 text-[#12B76A]" />
              </div>
              <div>
                <p className="text-base font-semibold text-[#0F1C3F] tabular-nums leading-none">
                  {correctCount}/{totalQ}
                </p>
                <p className="text-[10px] text-[#64748B] uppercase tracking-wide mt-0.5">
                  Benar
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border border-[#E4E7EC] bg-white">
            <CardContent className="p-3 flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-md bg-[#FEF3F2] flex items-center justify-center shrink-0">
                <XCircle className="h-4 w-4 text-[#F04438]" />
              </div>
              <div>
                <p className="text-base font-semibold text-[#0F1C3F] tabular-nums leading-none">
                  {wrongCount}
                </p>
                <p className="text-[10px] text-[#64748B] uppercase tracking-wide mt-0.5">
                  Salah
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border border-[#E4E7EC] bg-white">
            <CardContent className="p-3 flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-md bg-[#F8F9FB] flex items-center justify-center shrink-0">
                <Clock className="h-4 w-4 text-[#64748B]" />
              </div>
              <div>
                <p className="text-base font-semibold text-[#0F1C3F] tabular-nums leading-none">
                  {duration}
                </p>
                <p className="text-[10px] text-[#64748B] uppercase tracking-wide mt-0.5">
                  Waktu
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border border-[#E4E7EC] bg-white">
            <CardContent className="p-3 flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-md bg-[#F8F9FB] flex items-center justify-center shrink-0">
                <CalendarDays className="h-4 w-4 text-[#64748B]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#0F1C3F] leading-tight">
                  {attempt.completedAt
                    ? new Date(attempt.completedAt).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "—"}
                </p>
                <p className="text-[10px] text-[#64748B] uppercase tracking-wide mt-0.5">
                  Tanggal
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Answer Review ─────────────────────────────────── */}
        <Card id="review" className="rounded-lg border border-[#E4E7EC] bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E4E7EC] bg-[#F8F9FB] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck2 className="h-4 w-4 text-[#475467]" />
              <h2 className="text-sm font-medium text-[#0F1C3F] font-['Lexend_Deca']">
                Lembar Jawaban
              </h2>
            </div>
            <Badge variant="outline" className="bg-white text-[#475467] border-[#E4E7EC] text-[10px] font-medium">
              {totalQ} Soal
            </Badge>
          </div>

          <CardContent className="p-0 divide-y divide-[#F1F3F7]">
            {sortedAnswers.length === 0 && (
              <div className="p-6 text-center text-[#475467] text-sm">
                Belum ada jawaban yang tersimpan.
              </div>
            )}

            {sortedAnswers.map((answer, idx) => {
              const question = questionMap.get(answer.questionId);
              if (!question) return null;

              const isCorrect = answer?.isCorrect ?? false;

              return (
                <div key={question.id} className="p-4 hover:bg-[#F8F9FB]/40 transition-colors">
                  <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">

                    {/* Question Column */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={cn(
                          "flex items-center justify-center w-5 h-5 rounded text-[10px] font-medium shrink-0",
                          isCorrect ? "bg-[#ECFDF3] text-[#027A48]" : "bg-[#FEF3F2] text-[#B42318]"
                        )}>
                          {idx + 1}
                        </div>
                        <Badge
                          className={cn(
                            "text-[10px] font-medium uppercase tracking-wide",
                            isCorrect
                              ? "bg-[#ECFDF3] text-[#027A48] border-[#6CE9A6]"
                              : "bg-[#FEF3F2] text-[#B42318] border-[#FDA29B]"
                          )}
                          variant="outline"
                        >
                          {isCorrect ? "Benar" : "Salah"}
                        </Badge>
                      </div>
                      <p className="text-[#101828] text-sm leading-relaxed">
                        {question.text}
                      </p>
                    </div>

                    {/* Options Column */}
                    <div className="flex-1 w-full space-y-1.5">
                      {question.options
                        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
                        .map((option, optIdx) => {
                          const label = String.fromCharCode(65 + optIdx);
                          const isUserSelected = answer?.selectedOptionId === option.id;
                          const isOptionCorrect = option.isCorrect;

                          let stateClass = "bg-white border-[#E4E7EC]";
                          let labelClass = "bg-[#F1F3F7] text-[#64748B]";
                          let textClass = "text-[#475467]";
                          let indicator = null;

                          if (isUserSelected && isCorrect) {
                            stateClass = "bg-[#ECFDF3] border-[#32D583]";
                            labelClass = "bg-[#12B76A] text-white";
                            textClass = "text-[#027A48] font-semibold";
                            indicator = (
                              <div className="flex items-center gap-1 px-2 py-0.5 bg-[#12B76A] text-white rounded text-[10px] font-bold uppercase tracking-wide shrink-0">
                                <CheckCircle2 size={12} />
                                Jawaban Anda
                              </div>
                            );
                          } else if (isUserSelected && !isCorrect) {
                            stateClass = "bg-[#FEF3F2] border-[#F97066]";
                            labelClass = "bg-[#F04438] text-white";
                            textClass = "text-[#B42318] font-semibold";
                            indicator = (
                              <div className="flex items-center gap-1 px-2 py-0.5 bg-[#F04438] text-white rounded text-[10px] font-bold uppercase tracking-wide shrink-0">
                                <XCircle size={12} />
                                Jawaban Anda
                              </div>
                            );
                          } else if (!isUserSelected && isOptionCorrect) {
                            stateClass = "bg-white border-[#32D583] ring-1 ring-[#32D583]";
                            labelClass = "bg-white border border-[#32D583] text-[#027A48]";
                            textClass = "text-[#027A48] font-medium";
                            indicator = (
                              <div className="flex items-center gap-1 px-2 py-0.5 border border-[#32D583] text-[#027A48] rounded text-[10px] font-bold uppercase tracking-wide shrink-0 bg-[#ECFDF3]">
                                <Check size={12} />
                                Kunci Jawaban
                              </div>
                            );
                          }

                          return (
                            <div
                              key={option.id}
                              className={cn(
                                "flex items-start gap-2 p-2 rounded border transition-colors",
                                stateClass
                              )}
                            >
                              <div className={cn(
                                "w-5 h-5 rounded flex items-center justify-center text-[10px] font-medium shrink-0 mt-0.5",
                                labelClass
                              )}>
                                {label}
                              </div>
                              <div className="flex-1 flex items-start justify-between gap-2">
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
