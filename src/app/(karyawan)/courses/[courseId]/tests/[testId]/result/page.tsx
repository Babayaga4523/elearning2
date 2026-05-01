import { db } from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import {
  Trophy,
  XCircle,
  ArrowLeft,
  RefreshCcw,
  CheckCircle2,
  ChevronRight,
  Clock,
  Target,
  CalendarDays,
  BookOpen,
  AlertTriangle,
  Award,
  Flame,
  Medal,
} from "lucide-react";
import Link from "next/link";
import { getTestAttemptDetail } from "@/actions/test";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

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
  const isCheated = !!(attempt as any).isCheated;
  const score = Math.round(attempt.score);
  const passingScore = attempt.test.passingScore ?? 0;
  const testType = attempt.test.type;
  const totalQ = attempt.test.questions.length;
  const correctCount = attempt.answers.filter((a: any) => a.isCorrect).length;
  const wrongCount = totalQ - correctCount;

  const attemptCount = await db.testAttempt.count({
    where: { userId: session.user.id, testId: attempt.testId },
  });

  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId: params.courseId } },
    select: { maxPostTestAttempts: true, postTestAttempts: true, hasCheatedPostTest: true }
  });

  const effectiveMaxAttempts = enrollment?.maxPostTestAttempts ?? attempt.test.maxAttempts ?? 3;
  const remainingAttempts = effectiveMaxAttempts > 0 
    ? Math.max(0, effectiveMaxAttempts - (enrollment?.postTestAttempts ?? attemptCount))
    : Infinity;
  const canTryAgain = effectiveMaxAttempts === 0 || remainingAttempts > 0;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* Breadcrumb */}
        <div className="flex items-center justify-between gap-4">
          <Link
            href={`/courses/${params.courseId}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Kursus
          </Link>
          
          <div className="flex items-center gap-2">
            <Badge variant={testType === 'PRE' ? "default" : "secondary"}>
              {testType}-TEST
            </Badge>
            <Badge variant="outline">
              Percobaan #{attemptCount}
            </Badge>
          </div>
        </div>

        {/* Result Card */}
        <Card className={cn(
          "overflow-hidden",
          isCheated ? "border-l-4 border-l-red-600" :
          isPassed ? "border-l-4 border-l-green-600" :
          "border-l-4 border-l-yellow-600"
        )}>
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center gap-8">
              
              {/* Score Circle */}
              <div className="relative shrink-0">
                <div className="relative w-40 h-40">
                  <svg className="w-full h-full -rotate-90">
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      fill="none"
                      className="stroke-slate-200"
                      strokeWidth="12"
                    />
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      fill="none"
                      className={cn(
                        isCheated ? "stroke-red-500" :
                        isPassed ? "stroke-green-500" :
                        "stroke-yellow-500"
                      )}
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 70}`}
                      strokeDashoffset={`${2 * Math.PI * 70 * (1 - score / 100)}`}
                      style={{ transition: "stroke-dashoffset 1s ease" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold">{score}%</span>
                    <span className="text-xs text-slate-600">Skor Akhir</span>
                  </div>
                </div>
                
                <Badge className={cn(
                  "mt-4 w-full justify-center",
                  isCheated ? "bg-red-600" :
                  isPassed ? "bg-green-600" :
                  "bg-yellow-600"
                )}>
                  {isCheated ? (
                    <><AlertTriangle className="h-4 w-4 mr-1" /> Diskualifikasi</>
                  ) : isPassed ? (
                    <><CheckCircle2 className="h-4 w-4 mr-1" /> Lulus</>
                  ) : (
                    <><XCircle className="h-4 w-4 mr-1" /> Gagal</>
                  )}
                </Badge>
              </div>

              {/* Content */}
              <div className="flex-1 text-center md:text-left space-y-4">
                <h1 className="text-3xl font-bold text-slate-900">
                  {isCheated ? "Kecurangan Terdeteksi!" : isPassed ? "Luar Biasa!" : "Jangan Menyerah!"}
                </h1>
                <p className="text-slate-600">
                  {isCheated
                    ? "Sistem merekam adanya anomali saat ujian berlangsung. Nilai Anda hangus."
                    : isPassed
                      ? `Anda berhasil melampaui batas minimum ${passingScore}%. Pemahaman kompetensi Anda terbukti solid.`
                      : `Anda hanya terpaut ${passingScore - score} poin dari batas kelulusan. Pelajari kembali materi dan coba lagi.`}
                </p>

                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                  {!isCheated && !isPassed && canTryAgain && (
                    <Button asChild>
                      <Link href={`/courses/${params.courseId}/tests/${params.testId}`}>
                        <RefreshCcw className="h-4 w-4 mr-2" />
                        Ulangi Ujian
                      </Link>
                    </Button>
                  )}
                  {isPassed && testType === "POST" && (
                    <Button asChild>
                      <Link href={`/courses/${params.courseId}`}>
                        Lanjutkan Kursus
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  )}
                  <Button asChild variant="outline">
                    <a href="#review">
                      Review Jawaban
                    </a>
                  </Button>
                </div>
              </div>

            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: <Target />, label: "Benar", value: `${correctCount} soal`, color: "text-green-600" },
            { icon: <Clock />, label: "Waktu", value: attempt.completedAt ? new Date(attempt.completedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "—", color: "text-blue-600" },
            { icon: <CalendarDays />, label: "Tanggal", value: new Date(attempt.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" }), color: "text-yellow-600" },
            { icon: <Trophy />, label: "Percobaan", value: `Ke-${attemptCount}`, color: "text-purple-600" },
          ].map((m, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={cn("shrink-0", m.color)}>
                  {m.icon}
                </div>
                <div>
                  <p className="text-xs text-slate-600">{m.label}</p>
                  <p className="text-lg font-bold text-slate-900">{m.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Answer Review */}
        <Card id="review">
          <CardContent className="p-8">
            
            <div className="flex items-center justify-between mb-8 pb-6 border-b">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="h-6 w-6" />
                  Lembar Jawaban
                </h2>
                <p className="text-slate-600 mt-1">Pelajari kembali soal-soal di bawah ini</p>
              </div>
              <div className="flex gap-2">
                <Badge className="bg-green-100 text-green-700 border-0">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> {correctCount} Tepat
                </Badge>
                <Badge className="bg-red-100 text-red-700 border-0">
                  <XCircle className="h-3 w-3 mr-1" /> {wrongCount} Salah
                </Badge>
              </div>
            </div>

            <div className="space-y-6">
              {attempt.test.questions.map((question: any, idx: number) => {
                const userAnswer = attempt.answers.find((a: any) => a.questionId === question.id);
                const isCorrect = userAnswer?.isCorrect ?? false;
                const isUnanswered = !userAnswer;

                return (
                  <Card key={question.id} className={cn(
                    "border-l-4",
                    isCorrect ? "border-l-green-500" :
                    isUnanswered ? "border-l-slate-300" :
                    "border-l-red-500"
                  )}>
                    <CardContent className="p-6">
                      
                      {/* Question Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "h-8 w-8 rounded-full flex items-center justify-center font-semibold text-sm",
                            isCorrect ? "bg-green-100 text-green-700" :
                            isUnanswered ? "bg-slate-100 text-slate-600" :
                            "bg-red-100 text-red-700"
                          )}>
                            {idx + 1}
                          </div>
                          <span className="text-sm font-medium text-slate-600">Pertanyaan</span>
                        </div>
                        {isCorrect ? (
                          <Badge className="bg-green-100 text-green-700 border-0">
                            <CheckCircle2 className="h-3 w-3 mr-1"/> Benar
                          </Badge>
                        ) : isUnanswered ? (
                          <Badge variant="secondary">Kosong</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-700 border-0">
                            <XCircle className="h-3 w-3 mr-1"/> Salah
                          </Badge>
                        )}
                      </div>

                      {/* Question Text */}
                      <p className="text-base font-medium text-slate-900 mb-6">
                        {question.text}
                      </p>

                      {/* Options */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {question.options.map((option: any, optIdx: number) => {
                          const label = String.fromCharCode(65 + optIdx);
                          const isUserSelected = userAnswer?.selectedOptionId === option.id;
                          const isOptionCorrect = option.isCorrect;

                          return (
                            <div key={option.id} className={cn(
                              "flex items-center gap-3 p-3 rounded-lg border",
                              isUserSelected && isCorrect ? "bg-green-50 border-green-200" :
                              isUserSelected && !isCorrect ? "bg-red-50 border-red-200" :
                              !isUserSelected && isOptionCorrect ? "bg-green-50 border-green-200 border-dashed" :
                              "bg-slate-50 border-slate-200"
                            )}>
                              <div className={cn(
                                "h-8 w-8 flex items-center justify-center rounded-lg font-semibold text-sm shrink-0",
                                isUserSelected && isCorrect ? "bg-green-500 text-white" :
                                isUserSelected && !isCorrect ? "bg-red-500 text-white" :
                                !isUserSelected && isOptionCorrect ? "bg-green-100 text-green-700" :
                                "bg-slate-200 text-slate-600"
                              )}>
                                {label}
                              </div>
                              <span className="flex-1 text-sm">
                                {option.text}
                              </span>
                              {isUserSelected && isCorrect && <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0"/>}
                              {isUserSelected && !isCorrect && <XCircle className="h-4 w-4 text-red-600 shrink-0"/>}
                              {!isUserSelected && isOptionCorrect && <Badge variant="outline" className="text-xs shrink-0">Kunci</Badge>}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Bottom CTA */}
            <div className="mt-8 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-slate-900">
                  {isPassed ? "Lanjutkan Perjalanan Belajar" : "Siap Mencoba Lagi?"}
                </p>
                <p className="text-sm text-slate-600">
                  {isPassed
                    ? "Kembali ke kursus dan selesaikan semua materi"
                    : "Tinjau materi dan jadwalkan percobaan berikutnya"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button asChild variant="outline">
                  <Link href={`/courses/${params.courseId}`}>
                    <BookOpen className="h-4 w-4 mr-2" />
                    Kursus
                  </Link>
                </Button>
                {!isPassed && !isCheated && canTryAgain && (
                  <Button asChild>
                    <Link href={`/courses/${params.courseId}/tests/${params.testId}`}>
                      <RefreshCcw className="h-4 w-4 mr-2" />
                      Coba Lagi
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}