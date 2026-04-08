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
    <div className="flex flex-col items-center justify-center py-12 text-slate-400 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
      <Info className="h-8 w-8 mb-2 opacity-20" />
      <p className="text-sm font-black uppercase tracking-widest">Pilih percobaan untuk melihat detail</p>
    </div>
  );

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  const hasAnswers = data?.answers && data.answers.length > 0;

  if (!hasAnswers) return (
    <div className="flex flex-col items-center justify-center py-12 text-slate-400 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200 text-center px-8">
      <HelpCircle className="h-8 w-8 mb-2 text-amber-400" />
      <p className="text-sm font-black text-slate-800 uppercase tracking-tight">Detail Jawaban Tidak Tersedia</p>
      <p className="text-[11px] font-medium text-slate-400 mt-1">
        Data jawaban hanya tersedia untuk test yang dikerjakan setelah pembaruan sistem.
      </p>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Attempt Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-slate-900 rounded-3xl text-white shadow-xl shadow-slate-200/50">
        <div className="space-y-0.5 border-r border-white/10 px-2">
          <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Nilai Akhir</p>
          <p className="text-2xl font-black">{data.score}</p>
        </div>
        <div className="space-y-0.5 border-r border-white/10 px-2">
          <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Hasil</p>
          <p className={cn("text-base font-black uppercase", data.passed ? "text-emerald-400" : "text-rose-400")}>
            {data.passed ? "LULUS" : "GAGAL"}
          </p>
        </div>
        <div className="space-y-0.5 border-r border-white/10 px-2">
          <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Benar</p>
          <p className="text-xl font-black">{data.answers.filter((a: any) => a.isCorrect).length} / {data.answers.length}</p>
        </div>
        <div className="space-y-0.5 px-2">
          <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Durasi</p>
          <p className="text-sm font-black">
            {data.startedAt && data.completedAt 
              ? `${Math.round((new Date(data.completedAt).getTime() - new Date(data.startedAt).getTime()) / 60000)} Menit`
              : "N/A"}
          </p>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {data.test.questions.map((question: any, idx: number) => {
          const answer = data.answers.find((a: any) => a.questionId === question.id);
          const correctOption = question.options.find((o: any) => o.isCorrect);
          
          return (
            <div key={question.id} className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="h-7 w-7 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-black text-slate-500 shrink-0 mt-0.5">
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
                    <div className="p-3 bg-indigo-50/30 border border-indigo-100/50 rounded-2xl flex flex-col gap-1">
                      <p className="text-[9px] font-black text-indigo-400 uppercase tracking-wider">Kunci Jawaban</p>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-indigo-500 shrink-0" />
                        <span className="text-xs font-bold text-indigo-700">
                          {correctOption?.text}
                        </span>
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
