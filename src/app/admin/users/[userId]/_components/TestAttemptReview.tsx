"use client";

import { useEffect, useState } from "react";
import { 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Loader2,
  Info,
  Clock
} from "lucide-react";
import { getTestAttemptDetail } from "@/actions/test";
import { cn } from "@/lib/utils";

interface TestAttemptReviewProps {
  attemptId: string | null;
}

export function TestAttemptReview({ attemptId }: TestAttemptReviewProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    async function fetchDetail() {
      if (!attemptId) return;
      setLoading(true);
      try {
        const detail = await getTestAttemptDetail(attemptId);
        setData(detail);
      } catch (error) {
        console.error("Failed to fetch attempt detail", error);
      } finally {
        setLoading(false);
      }
    }
    fetchDetail();
  }, [attemptId]);

  if (!attemptId) return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#E4E7EC] bg-[#F8F9FB] py-12 text-[#98A2B3] font-sans">
      <Info className="mb-2 h-8 w-8 text-[#98A2B3]" />
      <p className="text-[13px] font-bold uppercase tracking-wider">Pilih percobaan untuk melihat detail</p>
    </div>
  );

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="h-8 w-8 animate-spin text-[#0F1C3F]" />
    </div>
  );

  const hasAnswers = data?.answers && data.answers.length > 0;

  if (!hasAnswers) return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#E4E7EC] bg-[#F8F9FB] px-6 py-12 text-center text-[#98A2B3] font-sans">
      <div className="rounded-xl p-3 bg-white border border-[#E4E7EC] mb-3">
        <HelpCircle className="h-6 w-6 text-[#E8A020]" />
      </div>
      <p className="text-sm font-bold tracking-tight text-[#101828] font-lexend">
        Detail Jawaban Tidak Tersedia
      </p>
      <p className="mt-1 text-[13px] font-medium text-[#475467]">
        Data jawaban hanya tersedia untuk tes yang dikerjakan setelah pembaruan sistem.
      </p>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {/* Score Card */}
        <div className="rounded-xl border border-[#E4E7EC] bg-white p-4 shadow-sm text-center flex flex-col items-center justify-center">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#98A2B3] mb-1">Nilai Akhir</p>
          <p className="text-3xl font-bold font-lexend text-[#0F1C3F]">{data.score}</p>
        </div>

        {/* Result Card */}
        <div className="rounded-xl border border-[#E4E7EC] bg-white p-4 shadow-sm text-center flex flex-col items-center justify-center">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#98A2B3] mb-1">Hasil</p>
          <p className={cn("text-xl font-bold font-lexend uppercase", data.passed ? "text-[#027A48]" : "text-[#B42318]")}>
            {data.passed ? "Lulus" : "Gagal"}
          </p>
        </div>

        {/* Correct Card */}
        <div className="rounded-xl border border-[#E4E7EC] bg-white p-4 shadow-sm text-center flex flex-col items-center justify-center">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#98A2B3] mb-1">Benar</p>
          <p className="text-xl font-bold font-lexend text-[#101828]">
            {data.answers.filter((a: any) => a.isCorrect).length} / {data.answers.length}
          </p>
        </div>

        {/* Time Card */}
        <div className="rounded-xl border border-[#E4E7EC] bg-white p-4 shadow-sm text-center flex flex-col items-center justify-center">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#98A2B3] mb-1">Waktu Tempuh</p>
          <p className="text-xl font-bold font-lexend text-[#101828]">
            {data.timeSpent !== undefined 
              ? `${Math.floor(data.timeSpent / 60)}m ${data.timeSpent % 60}s` 
              : data.startedAt && data.completedAt
                ? `${Math.round((new Date(data.completedAt).getTime() - new Date(data.startedAt).getTime()) / 60000)}m`
                : "—"}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {data.test.questions.map((question: any, idx: number) => {
          const answer = data.answers.find((a: any) => a.questionId === question.id);
          const correctOption = question.options.find((o: any) => o.isCorrect);
          
          return (
            <div
              key={question.id}
              className="rounded-xl border border-[#E4E7EC] bg-white p-4 shadow-sm transition-shadow hover:shadow-md md:p-5"
            >
              <div className="flex items-start gap-4">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#F8F9FB] border border-[#E4E7EC] text-sm font-bold text-[#101828] font-lexend">
                  {idx + 1}
                </div>
                <div className="flex-1 space-y-4">
                  <p className="text-sm font-bold text-[#101828] leading-relaxed font-lexend">
                    {question.text}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Selected Option */}
                    <div className={cn(
                      "p-3 rounded-xl border flex flex-col gap-1.5",
                      answer?.isCorrect 
                        ? "bg-[#ECFDF3] border-[#A6F4C5]" 
                        : answer?.selectedOptionId 
                          ? "bg-[#FEF3F2] border-[#FECDCA]" 
                          : "bg-[#F8F9FB] border-[#E4E7EC]"
                    )}>
                      <p className="text-[10px] font-bold text-[#475467] uppercase tracking-wider">Jawaban Karyawan</p>
                      <div className="flex items-center justify-between">
                        <span className={cn(
                          "text-xs font-bold",
                          answer?.isCorrect ? "text-[#027A48]" : answer?.selectedOptionId ? "text-[#B42318]" : "text-[#98A2B3] italic"
                        )}>
                          {answer?.selectedOption?.text ?? "Tidak menjawab"}
                        </span>
                        {answer?.isCorrect ? (
                          <CheckCircle2 className="h-4 w-4 text-[#12B76A] shrink-0" />
                        ) : answer?.selectedOptionId ? (
                          <XCircle className="h-4 w-4 text-[#F04438] shrink-0" />
                        ) : null}
                      </div>
                    </div>

                    {/* Correct Option (Always show for admin) */}
                    <div className="flex flex-col gap-1.5 rounded-xl border border-[#E4E7EC] bg-[#F8F9FB] p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#475467]">
                        Kunci Jawaban
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#101828]">{correctOption?.text}</span>
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-[#12B76A]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
