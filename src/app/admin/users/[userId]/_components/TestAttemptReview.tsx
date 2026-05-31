"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Loader2,
  Clock,
  Target,
  TrendingUp,
} from "lucide-react";
import { getTestAttemptDetail } from "@/actions/test";
import { cn } from "@/lib/utils";

interface TestAttemptReviewProps {
  attemptId: string | null;
}

interface TestAttemptDetail {
  id: string;
  score: number | null;
  passed: boolean | null;
  attemptNumber: number;
  timeSpent?: number;
  startedAt?: Date | string | null;
  completedAt?: Date | string | null;
  answers: Array<{
    id: string;
    questionId: string;
    isCorrect: boolean | null;
    selectedOptionId?: string | null;
    selectedOption?: { text: string } | null;
    question?: {
      id: string;
      text: string;
      options?: Array<{
        id: string;
        text: string;
        isCorrect: boolean;
      }>;
    };
  }>;
  test: {
    title?: string;
    passingScore: number;
    questions: Array<{
      id: string;
      text: string;
      options?: Array<{
        id: string;
        text: string;
        isCorrect: boolean;
      }>;
    }>;
  };
}

// Loading skeleton
function TestReviewSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-20 rounded-xl border border-[#E4E7EC] bg-white p-4 animate-pulse"
          />
        ))}
      </div>
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-32 rounded-xl border border-[#E4E7EC] bg-white p-4 animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}

// Empty state when no attempt selected
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#E4E7EC] bg-[#F8F9FB] py-16 px-6 text-center">
      <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm border border-[#E4E7EC]">
        <Target className="h-8 w-8 text-[#98A2B3]" />
      </div>
      <p className="text-sm font-bold text-[#101828] font-['Lexend_Deca']">
        Pilih Percobaan
      </p>
      <p className="mt-1 text-[13px] text-[#475467] max-w-xs">
        Pilih salah satu percobaan untuk melihat detail jawaban.
      </p>
    </div>
  );
}

// Empty state when answers not available
function AnswersUnavailable() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#E4E7EC] bg-[#F8F9FB] py-16 px-6 text-center">
      <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm border border-[#E4E7EC]">
        <HelpCircle className="h-8 w-8 text-[#E8A020]" />
      </div>
      <p className="text-sm font-bold text-[#101828] font-['Lexend_Deca']">
        Detail Jawaban Tidak Tersedia
      </p>
      <p className="mt-1 text-[13px] text-[#475467] max-w-xs">
        Data jawaban hanya tersedia untuk tes yang dikerjakan setelah
        pembaruan sistem.
      </p>
    </div>
  );
}

import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

// Question card component
function QuestionCard({
  question,
  answer,
  index,
}: {
  question: {
    id: string;
    text: string;
    options?: Array<{ id: string; text: string; isCorrect: boolean; position?: number }>;
  };
  answer?: {
    isCorrect: boolean | null;
    selectedOptionId?: string | null;
    selectedOption?: { text: string } | null;
  };
  index: number;
}) {
  const isCorrect = answer?.isCorrect === true;
  const hasAnswer = !!answer?.selectedOptionId;

  return (
    <div className="rounded-xl border border-[#E4E7EC] bg-white shadow-sm transition-shadow hover:shadow-md overflow-hidden p-4">
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        {/* Question Column */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <div
              className={cn(
                "flex items-center justify-center w-5 h-5 rounded text-[10px] font-medium shrink-0",
                isCorrect
                  ? "bg-[#ECFDF3] text-[#027A48]"
                  : hasAnswer
                  ? "bg-[#FEF3F2] text-[#B42318]"
                  : "bg-[#F8F9FB] text-[#475467]"
              )}
            >
              {index + 1}
            </div>
            {hasAnswer && (
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
            )}
            {!hasAnswer && (
              <Badge
                className="text-[10px] font-medium uppercase tracking-wide bg-[#F8F9FB] text-[#475467] border-[#E4E7EC]"
                variant="outline"
              >
                Kosong
              </Badge>
            )}
          </div>
          <p className="text-[#101828] text-sm leading-relaxed">
            {question.text}
          </p>
        </div>

        {/* Options Column */}
        <div className="flex-1 w-full space-y-1.5">
          {question.options
            ?.sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
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
                    <CheckCircle2 className="h-3 w-3" />
                    Jawaban Karyawan
                  </div>
                );
              } else if (isUserSelected && !isCorrect) {
                stateClass = "bg-[#FEF3F2] border-[#F97066]";
                labelClass = "bg-[#F04438] text-white";
                textClass = "text-[#B42318] font-semibold";
                indicator = (
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-[#F04438] text-white rounded text-[10px] font-bold uppercase tracking-wide shrink-0">
                    <XCircle className="h-3 w-3" />
                    Jawaban Karyawan
                  </div>
                );
              } else if (!isUserSelected && isOptionCorrect) {
                stateClass = "bg-white border-[#32D583] ring-1 ring-[#32D583]";
                labelClass = "bg-white border border-[#32D583] text-[#027A48]";
                textClass = "text-[#027A48] font-medium";
                indicator = (
                  <div className="flex items-center gap-1 px-2 py-0.5 border border-[#32D583] text-[#027A48] rounded text-[10px] font-bold uppercase tracking-wide shrink-0 bg-[#ECFDF3]">
                    <Check className="h-3 w-3" />
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
                  <div
                    className={cn(
                      "w-5 h-5 rounded flex items-center justify-center text-[10px] font-medium shrink-0 mt-0.5",
                      labelClass
                    )}
                  >
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
}

// Stats card component
function StatCard({
  label,
  value,
  icon: Icon,
  variant,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  variant: "default" | "success" | "danger" | "warning";
}) {
  const config = {
    default: "bg-white border-[#E4E7EC] text-[#101828]",
    success: "bg-[#ECFDF3] border-[#6CE9A6] text-[#027A48]",
    danger: "bg-[#FEF3F2] border-[#FDA29B] text-[#B42318]",
    warning: "bg-[#FEF3DC] border-[#F5C05A] text-[#C4861A]",
  };

  const iconConfig = {
    default: "text-[#475467]",
    success: "text-[#12B76A]",
    danger: "text-[#F04438]",
    warning: "text-[#E8A020]",
  };

  return (
    <div
      className={cn(
        "rounded-xl border p-4 flex flex-col items-center justify-center text-center min-h-[80px]",
        config[variant]
      )}
    >
      <Icon className={cn("h-4 w-4 mb-2", iconConfig[variant])} />
      <p className="text-xl md:text-2xl font-bold font-['Lexend_Deca'] leading-none">
        {value}
      </p>
      <p className="text-[10px] font-semibold uppercase tracking-wider mt-1.5 opacity-80">
        {label}
      </p>
    </div>
  );
}

export function TestAttemptReview({ attemptId }: TestAttemptReviewProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TestAttemptDetail | null>(null);

  useEffect(() => {
    async function fetchDetail() {
      if (!attemptId) {
        setData(null);
        return;
      }

      setLoading(true);
      try {
        const detail = await getTestAttemptDetail(attemptId);
        setData(detail);
      } catch (error) {
        console.error("Failed to fetch attempt detail", error);
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    fetchDetail();
  }, [attemptId]);

  // Empty state - no attempt selected
  if (!attemptId) {
    return <EmptyState />;
  }

  // Loading state
  if (loading) {
    return <TestReviewSkeleton />;
  }

  // No data or no answers
  if (!data || !data.answers || data.answers.length === 0) {
    return <AnswersUnavailable />;
  }

  const correctCount = data.answers.filter((a) => a.isCorrect === true).length;
  const totalQuestions = data.answers.length;
  const correctPercent = Math.round((correctCount / totalQuestions) * 100);

  // Calculate time spent
  const timeSpentDisplay = (() => {
    if (data.timeSpent !== undefined && data.timeSpent !== null) {
      const mins = Math.floor(data.timeSpent / 60);
      const secs = data.timeSpent % 60;
      return `${mins}m ${secs}d`;
    }
    if (data.startedAt && data.completedAt) {
      const start = data.startedAt instanceof Date ? data.startedAt : new Date(data.startedAt);
      const end = data.completedAt instanceof Date ? data.completedAt : new Date(data.completedAt);
      const diffMs = end.getTime() - start.getTime();
      const mins = Math.floor(diffMs / 60000);
      return `${mins} menit`;
    }
    return "—";
  })();

  return (
    <div className="space-y-5 font-['DM_Sans']">
      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {/* Score */}
        <StatCard
          label="Nilai Akhir"
          value={data.score ?? "—"}
          icon={TrendingUp}
          variant={data.passed ? "success" : data.score !== null ? "warning" : "default"}
        />

        {/* Result */}
        <StatCard
          label="Hasil"
          value={data.passed ? "Lulus" : "Gagal"}
          icon={data.passed ? CheckCircle2 : XCircle}
          variant={data.passed ? "success" : "danger"}
        />

        {/* Correct */}
        <StatCard
          label="Jawaban Benar"
          value={`${correctCount}/${totalQuestions}`}
          icon={CheckCircle2}
          variant={correctPercent >= 70 ? "success" : correctPercent >= 50 ? "warning" : "danger"}
        />

        {/* Time */}
        <StatCard
          label="Waktu"
          value={timeSpentDisplay}
          icon={Clock}
          variant="default"
        />
      </div>

      {/* Passing score info */}
      <div className="flex items-center justify-between rounded-lg border border-[#E4E7EC] bg-[#F8F9FB] px-4 py-3">
        <span className="text-sm font-medium text-[#475467]">
          Nilai Kelulusan (KKM)
        </span>
        <span className="text-sm font-bold text-[#101828] font-['Lexend_Deca']">
          ≥ {data.test.passingScore}
        </span>
      </div>

      {/* Questions list */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#98A2B3]">
          Detail Jawaban ({totalQuestions} Soal)
        </h4>
        {data.test.questions.map((question, idx) => {
          const answer = data.answers.find((a) => a.questionId === question.id);
          return (
            <QuestionCard
              key={question.id}
              question={question}
              answer={answer}
              index={idx}
            />
          );
        })}
      </div>
    </div>
  );
}
