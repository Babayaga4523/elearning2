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
} from "lucide-react";
import Link from "next/link";
import { getTestAttemptDetail } from "@/actions/test";

export const metadata = {
  title: "Hasil Ujian | E-Learning BNI Finance",
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
    where: { userId: session.user.id, testId: attempt.testId, status: "SUBMITTED" },
  });

  const allAttempts = await db.testAttempt.findMany({
    where: { userId: session.user.id, testId: attempt.testId, status: "SUBMITTED" },
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

  // Sort answers by answerOrder — the order user worked through the test
  const sortedAnswers = [...attempt.answers].sort(
    (a, b) => (a.answerOrder ?? 0) - (b.answerOrder ?? 0)
  );

  // Color tokens
  const pass = {
    ring: "emerald-500",
    ringBg: "bg-emerald-500",
    surface: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
    badgeWrong: "bg-red-50 text-red-700 border-red-200",
    badgeCorrect: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  const fail = {
    ring: "amber-500",
    ringBg: "bg-amber-500",
    surface: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    badgeWrong: "bg-red-50 text-red-700 border-red-200",
    badgeCorrect: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  const c = isPassed ? pass : fail;

  const circumference = 2 * Math.PI * 44;
  const offset = circumference * (1 - score / 100);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes drawRing {
          from { stroke-dashoffset: ${circumference}; }
          to   { stroke-dashoffset: ${offset}; }
        }
        @keyframes countUp {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .q-card {
          opacity: 0;
          animation: fadeUp 280ms ease-out forwards;
        }
        .q-card:nth-child(1)  { animation-delay: 0ms; }
        .q-card:nth-child(2)  { animation-delay: 60ms; }
        .q-card:nth-child(3)  { animation-delay: 120ms; }
        .q-card:nth-child(4)  { animation-delay: 180ms; }
        .q-card:nth-child(5)  { animation-delay: 240ms; }
        .q-card:nth-child(n+6){ animation-delay: 300ms; }

        .ring-track {
          stroke-dasharray: ${circumference};
          stroke-dashoffset: ${circumference};
          animation: drawRing 1200ms cubic-bezier(0.23, 1, 0.32, 1) forwards;
        }

        .btn-primary {
          transition: transform 120ms ease-out, background-color 150ms ease;
        }
        .btn-primary:active {
          transform: scale(0.97);
        }

        @media (prefers-reduced-motion: reduce) {
          .q-card { animation: none; opacity: 1; }
          .ring-track { animation: none; stroke-dashoffset: ${offset}; }
        }
      `}</style>

      {/* ── Page Header ─────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <Link
                href={`/courses/${params.courseId}`}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Kembali ke Kursus
              </Link>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {attempt.test.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  {testType === "PRE" ? "Pre-Test" : "Post-Test"}
                </span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  Percobaan #{attemptCount}
                </span>
                {hasBestScore && isCurrentBest && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    <Trophy className="h-3 w-3" />
                    Skor Terbaik
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* ── Score Card ─────────────────────────────────────── */}
        <div
          className={`
            bg-white rounded-2xl border-2 shadow-sm overflow-hidden
            ${isPassed ? "border-emerald-200" : "border-amber-200"}
          `}
        >
          {/* Top color bar */}
          <div className={`h-1.5 w-full ${isPassed ? "bg-emerald-500" : "bg-amber-500"}`} />

          <div className="p-6 sm:p-8 flex flex-col md:flex-row gap-8 items-center">

            {/* Ring */}
            <div className="relative shrink-0">
              <svg
                className="w-36 h-36 sm:w-44 sm:h-44 transform -rotate-90"
                viewBox="0 0 100 100"
                aria-hidden="true"
              >
                {/* Track */}
                <circle
                  cx="50" cy="50" r="44"
                  fill="none"
                  stroke={isPassed ? "#d1fae5" : "#fef3c7"}
                  strokeWidth="9"
                />
                {/* Progress */}
                <circle
                  cx="50" cy="50" r="44"
                  fill="none"
                  stroke={isPassed ? "#10b981" : "#f59e0b"}
                  strokeWidth="9"
                  strokeLinecap="round"
                  className="ring-track"
                />
              </svg>

              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Skor
                </span>
                <span className="text-4xl sm:text-5xl font-bold text-slate-900 leading-none">
                  {score}%
                </span>
                {hasBestScore && !isCurrentBest && (
                  <span className="text-xs font-semibold text-amber-600 mt-1">
                    terbaik {bestScore}%
                  </span>
                )}
              </div>
            </div>

            {/* Result info */}
            <div className="flex-1 w-full space-y-5">
              {/* Status badge */}
              <div className="flex items-center gap-3">
                <div
                  className={`
                    h-10 w-10 rounded-xl flex items-center justify-center shrink-0
                    ${isPassed ? "bg-emerald-100" : "bg-amber-100"}
                  `}
                >
                  {isPassed ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-amber-600" />
                  )}
                </div>
                <div>
                  <p className={`text-xl font-bold ${isPassed ? "text-emerald-700" : "text-amber-700"}`}>
                    {isPassed ? "Lulus!" : "Belum Lulus"}
                  </p>
                  <p className="text-sm text-slate-500">
                    {isPassed
                      ? "Selamat! Anda telah memenuhi batas kelulusan."
                      : `Belum mencapai batas kelulusan (${passingScore}%). Coba lagi!`}
                  </p>
                </div>
              </div>

              {/* Meta row */}
              <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5 text-slate-400" />
                  Batas lulus: {passingScore}%
                </span>
                {hasBestScore && (
                  <span className="flex items-center gap-1.5">
                    <Trophy className="h-3.5 w-3.5 text-amber-400" />
                    Tertinggi: {bestScore}%
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
                  Sisa尝试: {effectiveMaxAttempts === 0 ? "Tak terbatas" : remainingAttempts}
                </span>
              </div>

              {/* CTA */}
              <div className="flex flex-wrap gap-3">
                {canTryAgain ? (
                  <>
                    <Link
                      href={`/courses/${params.courseId}/tests/${params.testId}`}
                      className={`
                        btn-primary inline-flex items-center gap-2
                        text-sm font-semibold px-5 py-2.5 rounded-xl
                        text-white shadow-sm
                        ${isPassed ? "bg-emerald-600 hover:bg-emerald-700" : "bg-blue-600 hover:bg-blue-700"}
                      `}
                    >
                      {isPassed ? "Tingkatkan Nilai" : "Ulangi Ujian"}
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                    <Link
                      href={`/courses/${params.courseId}`}
                      className="inline-flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <BookOpen className="h-4 w-4" />
                      Kembali ke Kursus
                    </Link>
                  </>
                ) : (
                  <Link
                    href={`/courses/${params.courseId}`}
                    className="btn-primary inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl text-white shadow-sm bg-slate-700 hover:bg-slate-800"
                  >
                    Kembali ke Kursus
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                )}
                <a
                  href="#review"
                  className="inline-flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Review Jawaban
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats Grid ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              icon: <Target className="h-5 w-5" />,
              value: `${correctCount} / ${totalQ}`,
              label: "Jawaban Benar",
              accent: "text-emerald-600",
              bg: "bg-emerald-50",
              border: "border-emerald-100",
            },
            {
              icon: <XCircle className="h-5 w-5" />,
              value: wrongCount.toString(),
              label: "Jawaban Salah",
              accent: "text-red-600",
              bg: "bg-red-50",
              border: "border-red-100",
            },
            {
              icon: <Clock className="h-5 w-5" />,
              value: duration,
              label: "Waktu Pengerjaan",
              accent: "text-blue-600",
              bg: "bg-blue-50",
              border: "border-blue-100",
            },
            {
              icon: <CalendarDays className="h-5 w-5" />,
              value: attempt.completedAt
                ? new Date(attempt.completedAt).toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "—",
              label: "Tanggal Selesai",
              accent: "text-purple-600",
              bg: "bg-purple-50",
              border: "border-purple-100",
            },
          ].map(({ icon, value, label, accent, bg, border }) => (
            <div
              key={label}
              className={`bg-white rounded-xl border ${border} p-4 sm:p-5 flex items-center gap-3`}
            >
              <div className={`h-10 w-10 rounded-lg ${bg} flex items-center justify-center shrink-0 ${accent}`}>
                {icon}
              </div>
              <div className="min-w-0">
                <p className={`text-xl font-bold ${accent} tabular-nums leading-none`}>{value}</p>
                <p className="text-xs text-slate-500 mt-1 leading-tight">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Answer Review ─────────────────────────────────── */}
        <div id="review" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <BookOpen className="h-5 w-5 text-slate-500" />
              <h2 className="text-base font-semibold text-slate-900">
                Lembar Jawaban
              </h2>
            </div>
            <span className="text-xs font-medium text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
              {totalQ} soal
            </span>
          </div>

          <div className="p-4 sm:p-6 flex flex-col gap-4 max-h-[700px] overflow-y-auto">
            {sortedAnswers.map((answer: any, idx: number) => {
              const question = (attempt as any).test.questions.find(
                (q: any) => q.id === answer.questionId
              );
              if (!question) return null;

              const isCorrect = answer?.isCorrect ?? false;

              return (
                <div
                  key={question.id}
                  className="q-card rounded-xl border bg-white overflow-hidden"
                >
                  {/* Question header */}
                  <div className="px-4 sm:px-5 py-4 flex items-start gap-3">
                    {/* Status icon */}
                    <div
                      className={`
                        mt-0.5 h-7 w-7 rounded-full flex items-center justify-center shrink-0
                        ${isCorrect ? "bg-emerald-500" : "bg-red-500"}
                      `}
                    >
                      {isCorrect ? (
                        <CheckCircle2 className="h-4 w-4 text-white" />
                      ) : (
                        <XCircle className="h-4 w-4 text-white" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                          Soal {idx + 1}
                        </span>
                        <span
                          className={`
                            text-[10px] font-semibold px-2 py-0.5 rounded-full border
                            ${isCorrect ? c.badgeCorrect : c.badgeWrong}
                          `}
                        >
                          {isCorrect ? "Benar" : "Salah"}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-slate-800 leading-relaxed">
                        {question.text}
                      </p>
                    </div>
                  </div>

                  {/* Options */}
                  <div className="px-4 sm:px-5 pb-4 flex flex-col gap-2">
                    {question.options
                      .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))
                      .map((option: any, optIdx: number) => {
                        const label = String.fromCharCode(65 + optIdx);
                        const isUserSelected = answer?.selectedOptionId === option.id;
                        const isOptionCorrect = option.isCorrect;

                        // User picked this — and it's correct
                        if (isUserSelected && isCorrect) {
                          return (
                            <div
                              key={option.id}
                              className="flex items-start gap-3 px-3 py-2.5 rounded-lg bg-emerald-50 border border-emerald-200"
                            >
                              <span className="text-sm font-bold text-emerald-600 mt-0.5 w-5 shrink-0">
                                {label}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-slate-800">{option.text}</p>
                                <p className="text-xs font-semibold text-emerald-600 mt-0.5">
                                  Jawaban Anda — Benar
                                </p>
                              </div>
                              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-1" />
                            </div>
                          );
                        }

                        // User picked this — but wrong
                        if (isUserSelected && !isCorrect) {
                          return (
                            <div
                              key={option.id}
                              className="flex items-start gap-3 px-3 py-2.5 rounded-lg bg-red-50 border border-red-200"
                            >
                              <span className="text-sm font-bold text-red-600 mt-0.5 w-5 shrink-0">
                                {label}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-slate-800">{option.text}</p>
                                <p className="text-xs font-semibold text-red-600 mt-0.5">
                                  Jawaban Anda — Salah
                                </p>
                              </div>
                              <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-1" />
                            </div>
                          );
                        }

                        // User didn't pick — but this is the correct answer
                        if (!isUserSelected && isOptionCorrect) {
                          return (
                            <div
                              key={option.id}
                              className="flex items-start gap-3 px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200"
                            >
                              <span className="text-sm font-bold text-slate-400 mt-0.5 w-5 shrink-0">
                                {label}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-slate-700">{option.text}</p>
                                <p className="text-xs font-semibold text-slate-500 mt-0.5">
                                  Kunci Jawaban
                                </p>
                              </div>
                              <CheckCircle2 className="h-4 w-4 text-slate-300 shrink-0 mt-1" />
                            </div>
                          );
                        }

                        // Not selected, not correct — plain option
                        return (
                          <div
                            key={option.id}
                            className="flex items-start gap-3 px-3 py-2.5 rounded-lg"
                          >
                            <span className="text-sm font-bold text-slate-300 mt-0.5 w-5 shrink-0">
                              {label}
                            </span>
                            <p className="text-sm text-slate-500">{option.text}</p>
                          </div>
                        );
                      })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}