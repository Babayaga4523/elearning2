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
  BarChart3,
  HelpCircle,
  Flame,
  Medal,
  BookOpen,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
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

  const isPassed = attempt.passed;
  const isCheated = (attempt as any).cheated;
  const score = Math.round(attempt.score);
  const passingScore = attempt.test.passingScore ?? 0;
  const testType = attempt.test.type;
  const totalQ = attempt.test.questions.length;
  const correctCount = attempt.answers.filter((a: any) => a.isCorrect).length;
  const wrongCount = totalQ - correctCount;
  const unansweredCount = totalQ - attempt.answers.length;

  const attemptCount = await db.testAttempt.count({
    where: { userId: session.user.id, testId: params.testId },
  });

  // Circumference for SVG ring r=54
  const R = 54;
  const CIRC = 2 * Math.PI * R;
  const scoreDash = CIRC - (CIRC * score) / 100;

  return (
    <div
      className="min-h-screen"
      style={{ background: "#F0F2F7", fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* ── Accent bar ── */}
      <div
        className="h-1 w-full"
        style={{
          background: isCheated 
            ? "#EF4444"
            : isPassed
              ? "linear-gradient(90deg, #059669, #34D399)"
              : "linear-gradient(90deg, #0F1C3F, #E8A020)",
        }}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 pb-24 space-y-6">

        {/* ── Breadcrumb ── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <Link
            href={`/courses/${params.courseId}`}
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-all group"
            style={{ color: "#5A6480" }}
          >
            <span className="flex items-center justify-center h-8 w-8 rounded-full border border-slate-300 group-hover:border-[#0F1C3F] group-hover:bg-[#0F1C3F] transition-all">
              <ArrowLeft className="h-3.5 w-3.5 group-hover:text-white transition-colors" />
            </span>
            Kembali ke Kursus
          </Link>
          <div
            className="flex items-center gap-2.5 px-4 py-2 rounded-full text-[10px] font-black"
            style={{
              background: "white",
              border: "1px solid #E2E6F0",
              color: "#5A6480",
            }}
          >
            <span
              className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest"
              style={{
                background: testType === "PRE" ? "#EEF2FF" : "#FFF8E7",
                color: testType === "PRE" ? "#3B52A4" : "#B07D0C",
              }}
            >
              {testType}-TEST
            </span>
            <span style={{ color: "#D1D5DB" }}>·</span>
            <span className="uppercase tracking-wider">Percobaan #{attemptCount}</span>
          </div>
        </div>

        {/* ════════════════════════════════════════════
            HERO RESULT CARD
        ════════════════════════════════════════════ */}
        <div
          className="relative rounded-3xl overflow-hidden shadow-2xl"
          style={{
            background: isCheated
              ? "linear-gradient(135deg, #450A0A 0%, #7F1D1D 50%, #991B1B 100%)"
              : isPassed
                ? "linear-gradient(135deg, #064E3B 0%, #065F46 50%, #047857 100%)"
                : "linear-gradient(135deg, #0F1C3F 0%, #1A2E5A 60%, #0F2847 100%)",
          }}
        >
          {/* Decorative circles */}
          <div
            className="absolute -top-24 -right-24 w-80 h-80 rounded-full pointer-events-none opacity-20"
            style={{
              background: isPassed
                ? "radial-gradient(circle, #34D399, transparent 70%)"
                : "radial-gradient(circle, #E8A020, transparent 70%)",
            }}
          />
          <div
            className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full pointer-events-none opacity-10"
            style={{ background: "radial-gradient(circle, #fff, transparent 70%)" }}
          />
          {/* Grid texture */}
          <div
            className="absolute inset-0 opacity-[0.035] pointer-events-none"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg,#fff 0px,transparent 1px,transparent 48px,#fff 49px),repeating-linear-gradient(90deg,#fff 0px,transparent 1px,transparent 48px,#fff 49px)",
              backgroundSize: "48px 48px",
            }}
          />

          <div className="relative z-10 p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16">

              {/* Score Ring */}
              <div className="flex flex-col items-center gap-4 shrink-0">
                <div className="relative">
                  <svg width="148" height="148" viewBox="0 0 148 148">
                    {/* Track */}
                    <circle
                      cx="74" cy="74" r={R}
                      fill="none"
                      stroke="rgba(255,255,255,0.08)"
                      strokeWidth="10"
                    />
                    {/* Score arc */}
                    <circle
                      cx="74" cy="74" r={R}
                      fill="none"
                      stroke={isPassed ? "#34D399" : "#E8A020"}
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={CIRC}
                      strokeDashoffset={scoreDash}
                      transform="rotate(-90 74 74)"
                      style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)" }}
                    />
                    {/* Passing score marker */}
                    <circle
                      cx="74" cy="74" r={R}
                      fill="none"
                      stroke="rgba(255,255,255,0.25)"
                      strokeWidth="2"
                      strokeDasharray={`3 ${CIRC - 3}`}
                      strokeDashoffset={CIRC - (CIRC * passingScore) / 100}
                      transform="rotate(-90 74 74)"
                    />
                  </svg>
                  {/* Center content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span
                      className="text-5xl font-black leading-none tracking-tighter"
                      style={{ color: isPassed ? "#34D399" : "#E8A020" }}
                    >
                      {score}%
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40 mt-1">
                      Skor
                    </span>
                  </div>
                </div>

                {/* Pass/Fail badge */}
                <div
                  className="flex items-center gap-2 px-4 py-2 rounded-full font-black text-xs uppercase tracking-widest"
                  style={{
                    background: isPassed ? "rgba(52,211,153,0.15)" : "rgba(239,68,68,0.15)",
                    border: `1px solid ${isPassed ? "rgba(52,211,153,0.4)" : "rgba(239,68,68,0.4)"}`,
                    color: isPassed ? "#34D399" : "#FC8181",
                  }}
                >
                  {isCheated ? (
                    <><AlertTriangle className="h-3.5 w-3.5" /> Kecurangan</>
                  ) : isPassed ? (
                    <><CheckCircle2 className="h-3.5 w-3.5" /> Lulus</>
                  ) : (
                    <><XCircle className="h-3.5 w-3.5" /> Belum Lulus</>
                  )}
                </div>
              </div>

              {/* Result Text */}
              <div className="flex-1 text-center md:text-left space-y-5">
                <div>
                  <div className="flex items-center gap-3 justify-center md:justify-start mb-3">
                    <div
                      className="h-12 w-12 rounded-2xl flex items-center justify-center"
                      >
                        {isCheated ? (
                          <AlertTriangle className="h-6 w-6" style={{ color: "#FC8181" }} />
                        ) : isPassed ? (
                          <Trophy className="h-6 w-6" style={{ color: "#34D399" }} />
                        ) : (
                          <Flame className="h-6 w-6" style={{ color: "#E8A020" }} />
                        )}
                      </div>
                    </div>
                    <h1
                      className="text-3xl md:text-4xl font-black text-white leading-tight tracking-tight mb-2"
                      style={{ fontFamily: "'Lexend Deca', sans-serif" }}
                    >
                      {isCheated ? "Kecurangan Terdeteksi!" : isPassed ? "Selamat, Anda Lulus!" : "Hampir Sampai!"}
                    </h1>
                    <p className="text-base font-medium leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
                      {isCheated
                        ? "Ujian Anda otomatis dihentikan karena terdeteksi berpindah tab/jendela. Nilai Anda dianggap tidak valid."
                        : isPassed
                          ? "Anda telah melampaui standar kompetensi yang ditetapkan. Pertahankan ritme belajar ini."
                          : "Tinjau kembali materi yang belum dikuasai dan coba lagi. Anda pasti bisa!"}
                    </p>
                  </div>

                {/* Mini stats */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Benar", value: correctCount, color: "#34D399", bg: "rgba(52,211,153,0.12)" },
                    { label: "Salah", value: wrongCount, color: "#FC8181", bg: "rgba(239,68,68,0.12)" },
                    { label: "Batas Lulus", value: `${passingScore}%`, color: "rgba(255,255,255,0.7)", bg: "rgba(255,255,255,0.06)" },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="rounded-2xl p-3 text-center"
                      style={{ background: s.bg, border: "1px solid rgba(255,255,255,0.06)" }}
                    >
                      <p className="text-xl font-black leading-none mb-1" style={{ color: s.color }}>
                        {s.value}
                      </p>
                      <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>
                        {s.label}
                      </p>
                    </div>
                  ))}
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-wrap gap-3 justify-center md:justify-start pt-2">
                  <Link href={`/courses/${params.courseId}`}>
                    <button
                      className="flex items-center gap-2 h-12 px-6 rounded-xl font-black text-sm transition-all hover:brightness-110 active:scale-[0.97]"
                      style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", color: "white" }}
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Dashboard Kursus
                    </button>
                  </Link>

                  {!isPassed && (
                    <Link href={`/courses/${params.courseId}/tests/${params.testId}`}>
                      <button
                        className="flex items-center gap-2 h-12 px-6 rounded-xl font-black text-sm transition-all hover:brightness-110 active:scale-[0.97]"
                        style={{
                          background: "linear-gradient(135deg, #E8A020, #F5C842)",
                          color: "#0F1C3F",
                          boxShadow: "0 4px 20px rgba(232,160,32,0.3)",
                        }}
                      >
                        <RefreshCcw className="h-4 w-4" />
                        Coba Lagi
                      </button>
                    </Link>
                  )}

                  {isPassed && testType === "POST" && (
                    <Link href={`/courses/${params.courseId}`}>
                      <button
                        className="flex items-center gap-2 h-12 px-6 rounded-xl font-black text-sm transition-all hover:brightness-110 active:scale-[0.97]"
                        style={{
                          background: "linear-gradient(135deg, #34D399, #059669)",
                          color: "white",
                          boxShadow: "0 4px 20px rgba(52,211,153,0.3)",
                        }}
                      >
                        Selesaikan Kursus
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════
            STAT CARDS ROW
        ════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              icon: <Target className="h-5 w-5" />,
              label: "Jawaban Benar",
              value: `${correctCount}/${totalQ}`,
              iconBg: "#F0FDF4",
              iconColor: "#10B981",
            },
            {
              icon: <Clock className="h-5 w-5" />,
              label: "Waktu Selesai",
              value: attempt.completedAt
                ? new Date(attempt.completedAt).toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "—",
              iconBg: "#EEF2FF",
              iconColor: "#6366F1",
            },
            {
              icon: <CalendarDays className="h-5 w-5" />,
              label: "Tanggal Ujian",
              value: new Date(attempt.createdAt).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
              }),
              iconBg: "#FFF8E7",
              iconColor: "#E8A020",
            },
            {
              icon: <Medal className="h-5 w-5" />,
              label: "Percobaan Ke",
              value: `#${attemptCount}`,
              iconBg: isPassed ? "#F0FDF4" : "#FFF0F0",
              iconColor: isPassed ? "#10B981" : "#EF4444",
            },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-2xl p-5 flex items-center gap-4"
              style={{
                background: "white",
                border: "1px solid #E2E6F0",
                boxShadow: "0 1px 4px rgba(15,28,63,0.06)",
              }}
            >
              <div
                className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: card.iconBg, color: card.iconColor }}
              >
                {card.icon}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1.5" style={{ color: "#9AAABF" }}>
                  {card.label}
                </p>
                <p className="text-base font-black leading-none truncate" style={{ color: "#0F1C3F" }}>
                  {card.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ════════════════════════════════════════════
            INSIGHT / RECOMMENDATION CARD
        ════════════════════════════════════════════ */}
        <div
          className="rounded-3xl p-7 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-6"
          style={{
            background: "white",
            border: "1px solid #E2E6F0",
            boxShadow: "0 1px 4px rgba(15,28,63,0.06)",
          }}
        >
          <div
            className="h-14 w-14 rounded-2xl flex items-center justify-center shrink-0"
            style={{
              background: isPassed ? "#F0FDF4" : "#FFF8E7",
              color: isPassed ? "#059669" : "#E8A020",
            }}
          >
            {isPassed ? <BarChart3 className="h-7 w-7" /> : <BookOpen className="h-7 w-7" />}
          </div>
          <div className="flex-1">
            <h3
              className="text-lg font-black mb-1.5"
              style={{ color: "#0F1C3F", fontFamily: "'Lexend Deca', sans-serif" }}
            >
              {isPassed ? "Analisis Performa Anda" : "Rekomendasi Belajar"}
            </h3>
            <p className="text-sm font-medium leading-relaxed" style={{ color: "#64748B" }}>
              {isPassed
                ? `Nilai Anda (${score}%) melampaui batas minimal (${passingScore}%) dengan selisih ${score - passingScore} poin. Pemahaman Anda terhadap materi ini sangat baik.`
                : `Nilai Anda (${score}%) masih ${passingScore - score} poin di bawah batas lulus (${passingScore}%). Tinjau kembali modul yang berkaitan dengan soal yang salah sebelum mencoba lagi.`}
            </p>
          </div>
          <a
            href="#review"
            className="shrink-0 flex items-center gap-2 h-11 px-5 rounded-xl font-black text-sm transition-all hover:brightness-95 whitespace-nowrap"
            style={{
              background: "#F0F2F7",
              border: "1px solid #D6DBE8",
              color: "#0F1C3F",
            }}
          >
            <HelpCircle className="h-4 w-4" />
            Review Jawaban
          </a>
        </div>

        {/* ════════════════════════════════════════════
            ANSWER REVIEW SECTION
        ════════════════════════════════════════════ */}
        <section id="review" className="space-y-5 pt-4">
          {/* Section header */}
          <div className="flex items-end justify-between flex-wrap gap-3">
            <div>
              <h2
                className="text-2xl font-black tracking-tight"
                style={{ color: "#0F1C3F", fontFamily: "'Lexend Deca', sans-serif" }}
              >
                Review Jawaban
              </h2>
              <p className="text-sm font-medium mt-0.5" style={{ color: "#7A8599" }}>
                Evaluasi hasil pengerjaan Anda per soal
              </p>
            </div>
            {/* Correct / Wrong summary pills */}
            <div className="flex items-center gap-2">
              <span
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black"
                style={{ background: "#F0FDF4", color: "#059669", border: "1px solid #BBF7D0" }}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {correctCount} Benar
              </span>
              <span
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black"
                style={{ background: "#FFF0F0", color: "#EF4444", border: "1px solid #FECACA" }}
              >
                <XCircle className="h-3.5 w-3.5" />
                {wrongCount} Salah
              </span>
            </div>
          </div>

          {/* Question Cards */}
          <div className="space-y-4">
            {attempt.test.questions.map((question: any, idx: number) => {
              const userAnswer = attempt.answers.find(
                (a: any) => a.questionId === question.id
              );
              const isCorrect = userAnswer?.isCorrect ?? false;
              const isUnanswered = !userAnswer;

              return (
                <div
                  key={question.id}
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: "white",
                    border: `1px solid ${isCorrect ? "#BBF7D0" : isUnanswered ? "#E2E6F0" : "#FECACA"}`,
                    boxShadow: "0 1px 4px rgba(15,28,63,0.05)",
                  }}
                >
                  {/* Question header stripe */}
                  <div
                    className="flex items-center justify-between px-6 py-4"
                    style={{
                      background: isCorrect ? "#F0FDF4" : isUnanswered ? "#F8FAFC" : "#FFF5F5",
                      borderBottom: `1px solid ${isCorrect ? "#BBF7D0" : isUnanswered ? "#E2E6F0" : "#FECACA"}`,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-9 w-9 rounded-xl flex items-center justify-center font-black text-sm"
                        style={{
                          background: isCorrect ? "#059669" : isUnanswered ? "#94A3B8" : "#EF4444",
                          color: "white",
                        }}
                      >
                        {idx + 1}
                      </div>
                      <span
                        className="text-[10px] font-black uppercase tracking-widest"
                        style={{ color: "#7A8599" }}
                      >
                        Soal {idx + 1}
                      </span>
                    </div>
                    <span
                      className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-lg"
                      style={{
                        background: isCorrect ? "#059669" : isUnanswered ? "#94A3B8" : "#EF4444",
                        color: "white",
                      }}
                    >
                      {isCorrect ? (
                        <><CheckCircle2 className="h-3 w-3" /> Benar</>
                      ) : isUnanswered ? (
                        <>Tidak Dijawab</>
                      ) : (
                        <><XCircle className="h-3 w-3" /> Salah</>
                      )}
                    </span>
                  </div>

                  <div className="p-6 space-y-5">
                    {/* Question text */}
                    <p className="text-base font-bold leading-relaxed" style={{ color: "#0F1C3F" }}>
                      {question.text}
                    </p>

                    {/* Options */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {question.options.map((option: any, optIdx: number) => {
                        const label = String.fromCharCode(65 + optIdx);
                        const isUserSelected =
                          userAnswer?.selectedOptionId === option.id;
                        const isOptionCorrect = option.isCorrect;

                        // Determine styling
                        let bg = "#F8FAFC";
                        let border = "1px solid #E8ECF5";
                        let labelBg = "#E8ECF5";
                        let labelColor = "#7A8599";
                        let textColor = "#94A3B8";
                        let opacity = "0.7";

                        if (isUserSelected && isCorrect) {
                          bg = "#F0FDF4"; border = "2px solid #059669";
                          labelBg = "#059669"; labelColor = "white";
                          textColor = "#065F46"; opacity = "1";
                        } else if (isUserSelected && !isCorrect) {
                          bg = "#FFF0F0"; border = "2px solid #EF4444";
                          labelBg = "#EF4444"; labelColor = "white";
                          textColor = "#991B1B"; opacity = "1";
                        } else if (!isUserSelected && isOptionCorrect) {
                          bg = "#F0FDF4"; border = "1.5px dashed #059669";
                          labelBg = "#BBF7D0"; labelColor = "#059669";
                          textColor = "#065F46"; opacity = "1";
                        }

                        return (
                          <div
                            key={option.id}
                            className="flex items-center gap-3 p-4 rounded-xl transition-all"
                            style={{ background: bg, border, opacity }}
                          >
                            <div
                              className="h-8 w-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0"
                              style={{ background: labelBg, color: labelColor }}
                            >
                              {label}
                            </div>
                            <span
                              className="text-sm font-semibold flex-1 leading-snug"
                              style={{ color: textColor }}
                            >
                              {option.text}
                            </span>
                            {isUserSelected && isCorrect && (
                              <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: "#059669" }} />
                            )}
                            {isUserSelected && !isCorrect && (
                              <XCircle className="h-4 w-4 shrink-0" style={{ color: "#EF4444" }} />
                            )}
                            {!isUserSelected && isOptionCorrect && (
                              <span
                                className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg shrink-0"
                                style={{ background: "#BBF7D0", color: "#059669" }}
                              >
                                Jawaban Benar
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom CTAs */}
          <div
            className="rounded-3xl p-7 flex flex-col md:flex-row items-center justify-between gap-5 mt-4"
            style={{ background: "#0F1C3F" }}
          >
            <div>
              <p
                className="text-lg font-black text-white mb-1"
                style={{ fontFamily: "'Lexend Deca', sans-serif" }}
              >
                {isPassed ? "Lanjutkan Perjalanan Belajar" : "Siap Mencoba Lagi?"}
              </p>
              <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.45)" }}>
                {isPassed
                  ? "Kembali ke kursus dan selesaikan semua materi."
                  : "Tinjau materi dan jadwalkan percobaan berikutnya."}
              </p>
            </div>
            <div className="flex gap-3 shrink-0">
              <Link href={`/courses/${params.courseId}`}>
                <button
                  className="flex items-center gap-2 h-12 px-5 rounded-xl font-black text-sm transition-all hover:brightness-125"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "white",
                  }}
                >
                  <BookOpen className="h-4 w-4" />
                  Kursus
                </button>
              </Link>
              {!isPassed && (
                <Link href={`/courses/${params.courseId}/tests/${params.testId}`}>
                  <button
                    className="flex items-center gap-2 h-12 px-6 rounded-xl font-black text-sm transition-all hover:brightness-110 active:scale-[0.97]"
                    style={{
                      background: "linear-gradient(135deg, #E8A020, #F5C842)",
                      color: "#0F1C3F",
                      boxShadow: "0 2px 16px rgba(232,160,32,0.35)",
                    }}
                  >
                    <RefreshCcw className="h-4 w-4" />
                    Coba Lagi
                  </button>
                </Link>
              )}
              {isPassed && (
                <Link href={`/courses/${params.courseId}`}>
                  <button
                    className="flex items-center gap-2 h-12 px-6 rounded-xl font-black text-sm transition-all hover:brightness-110 active:scale-[0.97]"
                    style={{
                      background: "linear-gradient(135deg, #34D399, #059669)",
                      color: "white",
                      boxShadow: "0 2px 16px rgba(52,211,153,0.3)",
                    }}
                  >
                    Lanjutkan
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </Link>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}