import { db } from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle,
  Target,
  Timer,
  CalendarDays,
  Trophy,
  CheckCircle2,
  XCircle
} from "lucide-react";
import Link from "next/link";
import { getTestAttemptDetail } from "@/actions/test";

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
  if (attempt.testId !== params.testId || attempt.test.courseId !== params.courseId) {
    return redirect(`/courses/${params.courseId}`);
  }

  const isPassed = attempt.passed;
  const score = Math.round(attempt.score ?? 0);
  const passingScore = attempt.test.passingScore ?? 0;
  const testType = attempt.test.type;
  const totalQ = attempt.test.questions.length;
  const correctCount = attempt.answers.filter((a: any) => a.isCorrect).length;
  const wrongCount = totalQ - correctCount;

  // Count actual SUBMITTED attempts for this test (server-side validation)
  const attemptCount = await db.testAttempt.count({
    where: { userId: session.user.id, testId: attempt.testId, status: "SUBMITTED" },
  });

  // PERFECT LOGIC: Get BEST (highest) score from all attempts
  const allAttempts = await db.testAttempt.findMany({
    where: { userId: session.user.id, testId: attempt.testId, status: "SUBMITTED" },
    select: { score: true, passed: true },
    orderBy: { score: 'desc' }
  });

  const bestAttempt = allAttempts[0];
  const bestScore = bestAttempt ? Math.round(bestAttempt.score ?? 0) : score;
  const hasBestScore = allAttempts.length > 1; // Show best score only if multiple attempts
  const isCurrentBest = score === bestScore;
  const hasPassedBefore = allAttempts.some(a => a.passed);

  // Get max attempts from test configuration
  const effectiveMaxAttempts = attempt.test.maxAttempts > 0 ? attempt.test.maxAttempts : 999;
  const remainingAttempts = effectiveMaxAttempts > 0
    ? Math.max(0, effectiveMaxAttempts - attemptCount)
    : Infinity;
  const canTryAgain = effectiveMaxAttempts > 0
    ? attemptCount < effectiveMaxAttempts
    : true; // Unlimited if maxAttempts = 0

  // Determine status color theme
  let statusColor = "#f59e0b"; // fail
  let statusText = "text-[#f59e0b]";
  let statusBg = "bg-[#f59e0b]";
  let statusBorder = "border-[#f59e0b]";

  if (isPassed) {
    statusColor = "#10b981";
    statusText = "text-[#10b981]";
    statusBg = "bg-[#10b981]";
    statusBorder = "border-[#10b981]";
  }

  // Better status messaging
  const getStatusMessage = () => {
    if (isPassed) {
      if (hasBestScore && !isCurrentBest) {
        return `Nilai Anda kali ini ${score}%, namun nilai terbaik Anda tetap ${bestScore}%. Sistem akan menggunakan nilai tertinggi sebagai hasil akhir.`;
      }
      return `Selamat, Anda telah lulus ujian ini dengan nilai yang memuaskan. ${canTryAgain ? "Anda masih bisa mencoba lagi untuk meningkatkan nilai." : ""}`;
    }
    // Failed
    if (!canTryAgain) {
      return `Anda telah menggunakan semua ${attempt.test.maxAttempts} kesempatan dan belum mencapai batas kelulusan. Silakan hubungi admin jika memerlukan bantuan.`;
    }
    return `Anda belum mencapai batas kelulusan (${passingScore}%). Pelajari kembali materi dan coba lagi. Sisa percobaan: ${remainingAttempts === Infinity ? "Unlimited" : remainingAttempts}.`;
  };

  // Time calculation — menggunakan timeSpent (detik) yang direkam saat submit,
  // atau selisih startedAt→completedAt sebagai fallback.
  const getDuration = () => {
    // Primary: gunakan timeSpent (paling akurat, dihitung dari TestSession.startedAt)
    if (attempt.timeSpent && attempt.timeSpent > 0) {
      const totalSecs = attempt.timeSpent;
      const hours = Math.floor(totalSecs / 3600);
      const mins  = Math.floor((totalSecs % 3600) / 60);
      const secs  = totalSecs % 60;
      if (hours > 0) return `${hours}j ${mins}m ${secs}s`;
      if (mins  > 0) return `${mins}m ${secs}s`;
      return `${secs}s`;
    }
    // Fallback: startedAt → completedAt
    if (attempt.startedAt && attempt.completedAt) {
      const diff = Math.max(0, new Date(attempt.completedAt).getTime() - new Date(attempt.startedAt).getTime());
      const totalSecs = Math.floor(diff / 1000);
      const hours = Math.floor(totalSecs / 3600);
      const mins  = Math.floor((totalSecs % 3600) / 60);
      const secs  = totalSecs % 60;
      if (totalSecs === 0) return "< 1s";
      if (hours > 0) return `${hours}j ${mins}m ${secs}s`;
      if (mins  > 0) return `${mins}m ${secs}s`;
      return `${secs}s`;
    }
    return "—";
  };

  return (
    <div className="bg-[#f8f9ff] text-[#0b1c30] font-sans min-h-screen">
      <main className="max-w-[1440px] mx-auto px-6 py-8">

        {/* Premium Header */}
        <div className="flex flex-col gap-2 mb-8">
          <Link
            href={`/courses/${params.courseId}`}
            className="flex items-center text-[#006970] hover:text-[#f7941d] text-sm font-semibold gap-1 transition-colors w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Kursus
          </Link>
          <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mt-2">
            <div>
              <h1 className="text-3xl font-bold text-[#0b1c30] mb-2">Hasil Ujian: {attempt.test.title}</h1>
              <div className="flex gap-2">
                <span className="bg-[#dce9ff] text-[#0b1c30] text-xs font-semibold px-2 py-1 rounded-sm border border-[#dac2af]">
                  {testType}-TEST
                </span>
                <span className="bg-[#dce9ff] text-[#0b1c30] text-xs font-semibold px-2 py-1 rounded-sm border border-[#dac2af]">
                  Percobaan #{attemptCount}
                </span>
                {hasBestScore && isCurrentBest && (
                  <span className="bg-gradient-to-r from-[#f7941d] to-[#ff6b35] text-white text-xs font-bold px-2 py-1 rounded-sm shadow-sm flex items-center gap-1">
                    <Trophy className="w-3 h-3" />
                    BEST SCORE
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Result Card */}
        <div className={`bg-[#ffffff] rounded-xl shadow-sm border border-[#dac2af] border-l-4 ${statusBorder} p-8 mb-8 relative overflow-hidden flex flex-col md:flex-row gap-8 items-center`}>

          {/* Score Visualization */}
          <div className="relative w-48 h-48 flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle className="text-[#dce9ff]" cx="50" cy="50" fill="none" r="45" stroke="currentColor" strokeWidth="10"></circle>
              <circle
                className={statusText}
                cx="50" cy="50" fill="none" r="45"
                stroke="currentColor"
                strokeDasharray="282.7"
                strokeDashoffset={282.7 * (1 - score / 100)}
                strokeWidth="10"
                style={{ transition: "stroke-dashoffset 1.5s ease-out" }}
              ></circle>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xs font-semibold text-[#544435] uppercase tracking-wider mb-1">
                {hasBestScore && !isCurrentBest ? "Skor Ini" : "Skor Akhir"}
              </span>
              <span className="text-4xl font-bold text-[#0b1c30]">{score}%</span>
              {hasBestScore && !isCurrentBest && (
                <div className="mt-2 text-center">
                  <span className="text-[10px] font-semibold text-[#544435] uppercase tracking-wider block">Best Score</span>
                  <span className="text-2xl font-bold text-[#f7941d]">{bestScore}%</span>
                </div>
              )}
            </div>
          </div>

          {/* Action-Oriented Content */}
          <div className="flex-grow flex flex-col items-start gap-6">
            <div>
              <h2 className={`text-2xl font-bold ${statusText} mb-2 flex items-center gap-2`}>
                {isPassed ? (
                  <><CheckCircle className="w-6 h-6 fill-current text-white" /> Luar Biasa!</>
                ) : (
                  <><XCircle className="w-6 h-6 fill-current text-white" /> Jangan Menyerah!</>
                )}
              </h2>
              <p className="text-base text-[#544435] max-w-2xl">
                {getStatusMessage()}
              </p>
              <p className="text-xs font-semibold text-[#544435] mt-3">
                Batas kelulusan: {passingScore}% •
                {hasBestScore && ` Nilai Terbaik: ${bestScore}% • `}
                Sisa Percobaan: {effectiveMaxAttempts === 0 ? "Unlimited" : remainingAttempts}
              </p>
            </div>

            <div className="flex flex-wrap gap-3 mt-auto">
              {/* PERFECT LOGIC: Allow retry if attempts left, regardless of pass/fail status */}
              {canTryAgain ? (
                <>
                  <Link href={`/courses/${params.courseId}/tests/${params.testId}`}>
                    <button className="bg-[#f7941d] text-white text-sm font-semibold px-6 py-3 rounded-lg hover:bg-opacity-90 transition-opacity">
                      {isPassed ? "Tingkatkan Nilai" : "Ulangi Ujian"}
                    </button>
                  </Link>
                  <Link href={`/courses/${params.courseId}`}>
                    <button className="bg-transparent text-[#006970] border border-[#006970] text-sm font-semibold px-6 py-3 rounded-lg hover:bg-[#eff4ff] transition-colors">
                      Kembali ke Kursus
                    </button>
                  </Link>
                </>
              ) : (
                <Link href={`/courses/${params.courseId}`}>
                  <button className="bg-[#f7941d] text-white text-sm font-semibold px-6 py-3 rounded-lg hover:bg-opacity-90 transition-opacity">
                    {isPassed && testType === "POST" ? "Lanjutkan Kursus" : "Kembali ke Kursus"}
                  </button>
                </Link>
              )}
              <a href="#review">
                <button className="bg-transparent text-[#006970] border border-[#006970] text-sm font-semibold px-6 py-3 rounded-lg hover:bg-[#eff4ff] transition-colors">
                  Review Jawaban
                </button>
              </a>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-[#ffffff] rounded-lg shadow-sm border border-[#dac2af] p-6 flex items-center gap-6">
            <div className="w-12 h-12 rounded-full bg-[#e5eeff] flex items-center justify-center text-[#006970] flex-shrink-0">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#544435] uppercase tracking-wide">Jawaban Benar</p>
              <p className="text-xl font-bold text-[#0b1c30]">{correctCount} / {totalQ}</p>
            </div>
          </div>

          <div className="bg-[#ffffff] rounded-lg shadow-sm border border-[#dac2af] p-6 flex items-center gap-6">
            <div className="w-12 h-12 rounded-full bg-[#e5eeff] flex items-center justify-center text-[#006970] flex-shrink-0">
              <Timer className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#544435] uppercase tracking-wide">Waktu Pengerjaan</p>
              <p className="text-xl font-bold text-[#0b1c30]">{getDuration()}</p>
            </div>
          </div>

          <div className="bg-[#ffffff] rounded-lg shadow-sm border border-[#dac2af] p-6 flex items-center gap-6">
            <div className="w-12 h-12 rounded-full bg-[#e5eeff] flex items-center justify-center text-[#006970] flex-shrink-0">
              <CalendarDays className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#544435] uppercase tracking-wide">Tanggal Selesai</p>
              <p className="text-xl font-bold text-[#0b1c30]">
                {attempt.completedAt ? new Date(attempt.completedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "—"}
              </p>
            </div>
          </div>

          <div className="bg-[#ffffff] rounded-lg shadow-sm border border-[#dac2af] p-6 flex items-center gap-6">
            <div className="w-12 h-12 rounded-full bg-[#e5eeff] flex items-center justify-center text-[#006970] flex-shrink-0">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#544435] uppercase tracking-wide">Percobaan</p>
              <p className="text-xl font-bold text-[#0b1c30]">{attemptCount} / {effectiveMaxAttempts === 0 ? "∞" : effectiveMaxAttempts}</p>
            </div>
          </div>
        </div>

        {/* Detailed Answer Review Section */}
        <div id="review" className="bg-[#ffffff] rounded-xl shadow-sm border border-[#dac2af] overflow-hidden">
          <div className="px-8 py-6 border-b border-[#dac2af] bg-[#eff4ff] flex justify-between items-center">
            <h3 className="text-xl font-bold text-[#0b1c30]">Lembar Jawaban</h3>
            <span className="text-xs font-semibold text-[#544435] bg-white px-3 py-1 rounded-full border border-[#dac2af]">
              Tampilkan Semua
            </span>
          </div>

          <div className="p-8 flex flex-col gap-6 max-h-[800px] overflow-y-auto">
            {attempt.test.questions.map((question: any, idx: number) => {
              const userAnswer = attempt.answers.find((a: any) => a.questionId === question.id);
              const isCorrect = userAnswer?.isCorrect ?? false;
              const isUnanswered = !userAnswer;

              return (
                <div key={question.id} className="border border-[#dac2af] rounded-lg p-6 relative pl-14 bg-white">
                  <div className={`absolute left-5 top-6 ${isCorrect ? "text-[#10b981]" : "text-[#ef4444]"}`}>
                    {isCorrect ? (
                      <CheckCircle2 className="w-6 h-6 fill-current text-white" />
                    ) : (
                      <XCircle className="w-6 h-6 fill-current text-white" />
                    )}
                  </div>

                  <div className="mb-4">
                    <span className="text-xs font-semibold text-[#544435]">Soal {idx + 1}</span>
                    <p className="text-base font-medium text-[#0b1c30] mt-1">
                      {question.text}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3">
                    {question.options.map((option: any, optIdx: number) => {
                      const label = String.fromCharCode(65 + optIdx);
                      const isUserSelected = userAnswer?.selectedOptionId === option.id;
                      const isOptionCorrect = option.isCorrect;

                      // Styles based on states
                      if (isUserSelected && isCorrect) {
                        return (
                          <div key={option.id} className="flex items-start gap-2 bg-[#10b981]/10 p-3 rounded-md border border-[#10b981]/30">
                            <span className="text-sm font-semibold text-[#10b981] mt-0.5">{label}.</span>
                            <div>
                              <p className="text-sm text-[#0b1c30]">{option.text}</p>
                              <span className="text-xs font-semibold text-[#10b981] bg-white px-2 py-0.5 rounded-sm inline-block mt-1 border border-[#10b981]/20">
                                Jawaban Anda - Benar
                              </span>
                            </div>
                          </div>
                        );
                      }

                      if (isUserSelected && !isCorrect) {
                        return (
                          <div key={option.id} className="flex items-start gap-2 bg-[#ef4444]/10 p-3 rounded-md border border-[#ef4444]/30">
                            <span className="text-sm font-semibold text-[#ef4444] mt-0.5">{label}.</span>
                            <div>
                              <p className="text-sm text-[#0b1c30]">{option.text}</p>
                              <span className="text-xs font-semibold text-[#ef4444] bg-white px-2 py-0.5 rounded-sm inline-block mt-1 border border-[#ef4444]/20">
                                Jawaban Anda - Salah
                              </span>
                            </div>
                          </div>
                        );
                      }

                      if (!isUserSelected && isOptionCorrect) {
                        return (
                          <div key={option.id} className="flex items-start gap-2 bg-[#e5eeff] p-3 rounded-md border border-[#dac2af]">
                            <span className="text-sm font-semibold text-[#544435] mt-0.5">{label}.</span>
                            <div>
                              <p className="text-sm text-[#0b1c30]">{option.text}</p>
                              <span className="text-xs font-semibold text-[#544435] bg-white px-2 py-0.5 rounded-sm inline-block mt-1 border border-[#dac2af]">
                                Kunci Jawaban
                              </span>
                            </div>
                          </div>
                        );
                      }

                      // Default Option
                      return (
                        <div key={option.id} className="flex items-start gap-2 bg-transparent p-3 rounded-md border border-transparent">
                          <span className="text-sm font-semibold text-[#544435] mt-0.5">{label}.</span>
                          <div>
                            <p className="text-sm text-[#0b1c30]">{option.text}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </main>
    </div>
  );
}