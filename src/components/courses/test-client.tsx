"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Loader2, RotateCcw, Shuffle, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { submitTest } from "@/actions/test";
import { shuffleArray } from "@/lib/shuffle";
import { cn } from "@/lib/utils";

interface TestClientProps {
  test: any;
  courseId: string;
  attemptNumber?: number;
  maxAttempts?: number;
}

export const TestClient = ({
  test,
  courseId,
  attemptNumber = 1,
  maxAttempts = 0,
}: TestClientProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [answers, setAnswers] = useState<{ questionId: string, optionId: string }[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Shuffle is computed ONCE on mount using useMemo (stable per render session)
  // This is safe: `isCorrect` stays attached to the same option object — only display order changes.
  const displayQuestions = useMemo(() => {
    const questions = test.randomizeQuestions
      ? shuffleArray(test.questions)
      : test.questions;
    return questions.map((q: any) => ({
      ...q,
      options: test.randomizeOptions ? shuffleArray(q.options) : q.options,
    }));
  }, [test]);

  const onSelect = (questionId: string, optionId: string) => {
    setAnswers((prev) => {
      const filtered = prev.filter((a) => a.questionId !== questionId);
      return [...filtered, { questionId, optionId }];
    });
  };

  const onSubmit = () => {
    if (answers.length < test.questions.length) {
      toast.error("Jawab semua pertanyaan sebelum mengumpulkan.");
      return;
    }

    setSubmitError(null);
    startTransition(async () => {
      try {
        await submitTest(test.id, answers);
        toast.success("Tes berhasil dikumpulkan!");
        router.push(`/courses/${courseId}/tests/${test.id}/result`);
      } catch (err: any) {
        const msg = err?.message ?? "";
        if (msg === "TEST_ALREADY_PASSED") {
          setSubmitError("Tes ini sudah terkunci karena Anda telah lulus sebelumnya.");
          router.refresh();
        } else if (msg === "MAX_ATTEMPTS_REACHED") {
          setSubmitError("Anda telah mencapai batas maksimal percobaan untuk tes ini.");
          router.refresh();
        } else {
          toast.error("Terjadi kesalahan. Coba lagi.");
        }
      }
    });
  };

  const answeredCount = answers.length;
  const totalCount = test.questions.length;
  const progressPct = Math.round((answeredCount / totalCount) * 100);

  return (
    <div className="space-y-8">
      {/* Attempt Info Header */}
      <div className="bg-white border rounded-2xl p-5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="space-y-1">
            <p className="text-sm font-black text-slate-800">
              Percobaan ke-{attemptNumber} {maxAttempts > 0 ? `dari ${maxAttempts}` : "(Tidak Terbatas)"}
            </p>
            <p className="text-xs text-slate-400 font-medium">
              {answeredCount} dari {totalCount} soal terjawab
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {test.randomizeQuestions && (
            <Badge variant="secondary" className="text-[10px] font-black uppercase tracking-widest bg-violet-50 text-violet-600">
              <Shuffle className="h-3 w-3 mr-1" /> Soal Diacak
            </Badge>
          )}
          {test.randomizeOptions && (
            <Badge variant="secondary" className="text-[10px] font-black uppercase tracking-widest bg-violet-50 text-violet-600">
              <Shuffle className="h-3 w-3 mr-1" /> Opsi Diacak
            </Badge>
          )}
          <div className="w-24 h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-xs font-black text-slate-500">{progressPct}%</span>
        </div>
      </div>

      {/* Error Banner */}
      {submitError && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="font-bold text-sm">{submitError}</p>
        </div>
      )}

      {/* Questions */}
      {displayQuestions.map((question: any, index: number) => (
        <div key={question.id} className="bg-white p-8 rounded-2xl border shadow-sm space-y-6">
          <div className="flex items-start gap-x-4">
            <span className={cn(
              "h-9 w-9 rounded-xl flex items-center justify-center text-sm font-black shrink-0 transition-all",
              answers.find(a => a.questionId === question.id)
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : "bg-slate-100 text-slate-500"
            )}>
              {index + 1}
            </span>
            <h3 className="text-lg font-bold text-slate-800 pt-1 leading-snug">{question.text}</h3>
          </div>
          
          <div className="grid grid-cols-1 gap-3 pl-14">
            {question.options.map((option: any) => {
              const isSelected = answers.find(a => a.questionId === question.id)?.optionId === option.id;
              return (
                <label 
                  key={option.id} 
                  className={cn(
                    "flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all group",
                    isSelected 
                      ? "border-primary bg-primary/5 shadow-sm shadow-primary/20" 
                      : "border-slate-100 hover:border-primary/40 hover:bg-slate-50/80"
                  )}
                >
                  <input 
                    type="radio" 
                    name={`q-${question.id}`} 
                    value={option.id} 
                    className="h-4 w-4 text-primary accent-primary mr-4"
                    onChange={() => onSelect(question.id, option.id)}
                    disabled={isPending}
                  />
                  <span className={cn(
                    "text-sm font-semibold transition-colors",
                    isSelected ? "text-primary font-bold" : "text-slate-700 group-hover:text-slate-900"
                  )}>
                    {option.text}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      ))}

      <div className="pt-10 flex flex-col items-center space-y-4">
        <Button 
          onClick={onSubmit}
          disabled={isPending || answeredCount < totalCount}
          size="lg" 
          className="h-16 px-12 bg-primary hover:bg-primary/90 text-white font-extrabold text-xl shadow-2xl hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100"
        >
          {isPending && <Loader2 className="h-6 w-6 animate-spin mr-2" />}
          {isPending ? "Mengumpulkan..." : "Kumpulkan Jawaban"}
        </Button>
        <p className="text-xs text-slate-400 font-medium">
          {answeredCount < totalCount 
            ? `Masih ada ${totalCount - answeredCount} soal yang belum dijawab.` 
            : "Semua soal sudah dijawab. Siap dikumpulkan!"}
        </p>
      </div>
    </div>
  );
};
