"use client";

import { useEffect, useState } from "react";
import { 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Loader2,
  Info
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
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/60 py-12 text-slate-500">
      <Info className="mb-2 h-8 w-8 opacity-30" />
      <p className="text-xs font-black uppercase tracking-wider">Pilih percobaan untuk melihat detail</p>
    </div>
  );

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="h-8 w-8 animate-spin text-[#0F1C3F]" />
    </div>
  );

  const hasAnswers = data?.answers && data.answers.length > 0;

  if (!hasAnswers) return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-12 text-center text-slate-500">
      <HelpCircle className="mb-2 h-8 w-8 text-[#E8A020]" />
      <p className="text-sm font-black uppercase tracking-tight text-slate-800">
        Detail jawaban tidak tersedia
      </p>
      <p className="mt-1 text-[11px] font-medium text-slate-500">
        Data jawaban hanya tersedia untuk tes yang dikerjakan setelah pembaruan sistem.
      </p>
    </div>
  );

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      <div
        className="grid grid-cols-2 gap-3 rounded-xl p-4 text-white shadow-md md:grid-cols-4 md:gap-4 md:p-5"
        style={{
          background: "linear-gradient(135deg, #0F1C3F 0%, #1A3060 100%)",
          boxShadow: "0 8px 28px rgba(15,28,63,0.2)",
        }}
      >
        <div className="space-y-0.5 border-white/15 px-1 md:border-r md:px-2">
          <p className="text-[9px] font-black uppercase tracking-widest text-white/50">Nilai akhir</p>
          <p className="text-2xl font-black text-[#E8A020]">{data.score}</p>
        </div>
        <div className="space-y-0.5 border-white/15 px-1 md:border-r md:px-2">
          <p className="text-[9px] font-black uppercase tracking-widest text-white/50">Hasil</p>
          <p className={cn("text-base font-black uppercase", data.passed ? "text-emerald-400" : "text-rose-400")}>
            {data.passed ? "Lulus" : "Gagal"}
          </p>
        </div>
        <div className="space-y-0.5 border-white/15 px-1 md:border-r md:px-2">
          <p className="text-[9px] font-black uppercase tracking-widest text-white/50">Benar</p>
          <p className="text-xl font-black">
            {data.answers.filter((a: any) => a.isCorrect).length} / {data.answers.length}
          </p>
        </div>
        <div className="space-y-0.5 px-1 md:px-2">
          <p className="text-[9px] font-black uppercase tracking-widest text-white/50">Durasi</p>
          <p className="text-sm font-black">
            {data.startedAt && data.completedAt
              ? `${Math.round((new Date(data.completedAt).getTime() - new Date(data.startedAt).getTime()) / 60000)} menit`
              : "—"}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {data.test.questions.map((question: any, idx: number) => {
          const answer = data.answers.find((a: any) => a.questionId === question.id);
          const correctOption = question.options.find((o: any) => o.isCorrect);
          
          return (
            <div
              key={question.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md md:p-5"
            >
              <div className="flex items-start gap-3 md:gap-4">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#0F1C3F] text-xs font-black text-[#E8A020]">
                  {idx + 1}
                </div>
                <div className="flex-1 space-y-4">
                  <p className="text-sm font-black text-slate-800 leading-relaxed">
                    {question.text}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Selected Option */}
                    <div className={cn(
                      "p-3 rounded-2xl border flex flex-col gap-1",
                      answer?.isCorrect 
                        ? "bg-emerald-50 border-emerald-100" 
                        : answer?.selectedOptionId 
                          ? "bg-rose-50 border-rose-100" 
                          : "bg-slate-50 border-slate-100"
                    )}>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Jawaban Karyawan</p>
                      <div className="flex items-center justify-between">
                        <span className={cn(
                          "text-xs font-bold",
                          answer?.isCorrect ? "text-emerald-700" : answer?.selectedOptionId ? "text-rose-700" : "text-slate-400 italic"
                        )}>
                          {answer?.selectedOption?.text ?? "Tidak menjawab"}
                        </span>
                        {answer?.isCorrect ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        ) : answer?.selectedOptionId ? (
                          <XCircle className="h-4 w-4 text-rose-500 shrink-0" />
                        ) : null}
                      </div>
                    </div>

                    {/* Correct Option (Always show for admin) */}
                    <div className="flex flex-col gap-1 rounded-xl border border-slate-200 bg-[#EEF2FF]/60 p-3">
                      <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                        Kunci jawaban
                      </p>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-[#0F1C3F]" />
                        <span className="text-xs font-bold text-[#0F1C3F]">{correctOption?.text}</span>
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
