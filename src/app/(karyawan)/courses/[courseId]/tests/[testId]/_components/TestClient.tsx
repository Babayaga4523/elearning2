"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Timer, 
  ChevronRight, 
  ChevronLeft, 
  Send,
  HelpCircle,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { submitTest } from "@/actions/test";
import { toast } from "sonner";

interface TestClientProps {
  test: any;
  courseId: string;
}

export function TestClient({ test, courseId }: TestClientProps) {
  const router = useRouter();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(test.duration * 60);

  // Timer logic
  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const currentQuestion = test.questions[currentQuestionIndex];
  const totalQuestions = test.questions.length;

  const handleSelectOption = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    const loadingToast = toast.loading("Mengirim jawaban...");

    try {
      const formattedAnswers = Object.entries(answers).map(([qId, oId]) => ({
        questionId: qId,
        optionId: oId,
      }));

      const result = await submitTest(test.id, formattedAnswers);
      
      toast.success("Ujian berhasil dikirim!", { id: loadingToast });
      router.push(`/courses/${courseId}/tests/${test.id}/result?attemptId=${result.id}`);
      router.refresh();
    } catch (error: any) {
      setIsSubmitting(false);
      if (error.message === "TEST_ALREADY_PASSED") {
        toast.error("Anda sudah lulus ujian ini sebelumnya.", { id: loadingToast });
        router.push(`/courses/${courseId}`);
      } else if (error.message === "MAX_ATTEMPTS_REACHED") {
        toast.error("Batas percobaan ujian telah tercapai.", { id: loadingToast });
        router.push(`/courses/${courseId}`);
      } else if (error.message === "MODULES_NOT_COMPLETED") {
        toast.error("Selesaikan semua modul sebelum mengambil Post-Test.", { id: loadingToast });
        router.push(`/courses/${courseId}`);
      } else {
        toast.error("Terjadi kesalahan saat mengirim jawaban.", { id: loadingToast });
      }
    }
  };

  const allAnswered = Object.keys(answers).length === totalQuestions;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      
      {/* Header Sticky */}
      <div className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="h-10 w-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black">
                Q
             </div>
             <div>
                <h2 className="text-lg font-black text-slate-800 leading-tight truncate max-w-[200px] md:max-w-sm">
                  {test.title}
                </h2>
                <div className="flex items-center gap-2">
                   <Badge variant="secondary" className="bg-slate-100 text-[9px] px-2 h-4 font-black uppercase text-slate-500">{test.type} TEST</Badge>
                   <p className="text-[10px] font-bold text-slate-400">Soal {currentQuestionIndex + 1} dari {totalQuestions}</p>
                </div>
             </div>
          </div>

          <div className={cn(
            "flex items-center gap-3 px-6 py-2.5 rounded-2xl border transition-colors",
            timeLeft < 300 ? "bg-rose-50 border-rose-100 text-rose-600 animate-pulse" : "bg-white border-slate-200 text-slate-600 shadow-sm"
          )}>
            <Timer className="h-5 w-5" />
            <span className="text-xl font-black tabular-nums">{formatTime(timeLeft)}</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-10 space-y-8 flex flex-col items-center">
         
         <div className="w-full space-y-6">
            
            {/* Progress Bar */}
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
               <div 
                  className="bg-primary h-full transition-all duration-500" 
                  style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
               />
            </div>

            {/* Question Card */}
            <Card className="rounded-[2.5rem] border-none shadow-2xl shadow-slate-200/50 bg-white min-h-[400px] flex flex-col">
               <CardContent className="p-8 md:p-12 flex-1 flex flex-col">
                  
                  <div className="space-y-4 mb-10">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                       <HelpCircle className="h-5 w-5" />
                    </div>
                    <h3 className="text-2xl md:text-3xl font-black text-slate-800 leading-tight">
                       {currentQuestion.text}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 gap-4 mt-auto">
                     {currentQuestion.options.map((option: any, index: number) => {
                       const char = String.fromCharCode(65 + index);
                       const isSelected = answers[currentQuestion.id] === option.id;

                       return (
                         <button
                           key={option.id}
                           onClick={() => handleSelectOption(currentQuestion.id, option.id)}
                           className={cn(
                             "group flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all duration-300",
                             isSelected 
                               ? "bg-slate-900 border-slate-900 text-white shadow-xl translate-x-1" 
                               : "bg-white border-slate-100 text-slate-600 hover:border-primary/50 hover:bg-slate-50"
                           )}
                         >
                           <div className={cn(
                             "h-10 w-10 shrink-0 rounded-xl flex items-center justify-center font-black transition-colors",
                             isSelected ? "bg-white/20" : "bg-slate-100 group-hover:bg-primary/10 group-hover:text-primary"
                           )}>
                             {char}
                           </div>
                           <span className="font-bold text-lg">{option.text}</span>
                           {isSelected && (
                             <div className="ml-auto">
                                <CheckCircle2 className="h-6 w-6 text-white" />
                             </div>
                           )}
                         </button>
                       );
                     })}
                  </div>
               </CardContent>
            </Card>

            {/* Footer Controls */}
            <div className="flex items-center justify-between gap-4">
               <Button
                 variant="outline"
                 disabled={currentQuestionIndex === 0}
                 onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
                 className="h-14 px-8 rounded-2xl font-bold border-none shadow-sm gap-2"
               >
                 <ChevronLeft className="h-5 w-5" /> Sebelumnya
               </Button>

               <div className="hidden md:flex gap-2">
                 {test.questions.map((_: any, i: number) => (
                   <button
                     key={i}
                     onClick={() => setCurrentQuestionIndex(i)}
                     className={cn(
                       "h-2 w-8 rounded-full transition-all",
                       i === currentQuestionIndex ? "bg-slate-900" : (answers[test.questions[i].id] ? "bg-primary/50" : "bg-slate-200")
                     )}
                   />
                 ))}
               </div>

               {currentQuestionIndex === totalQuestions - 1 ? (
                 <Button
                   disabled={isSubmitting}
                   onClick={handleSubmit}
                   className={cn(
                     "h-14 px-10 rounded-2xl font-black gap-2 transition-all shadow-xl",
                     allAnswered ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20" : "bg-slate-400"
                   )}
                 >
                   Selesai Ujian <Send className="h-5 w-5" />
                 </Button>
               ) : (
                 <Button
                   onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                   className="h-14 px-10 rounded-2xl bg-slate-900 hover:bg-slate-800 font-black gap-2 shadow-xl shadow-slate-900/20"
                 >
                   Lanjut <ChevronRight className="h-5 w-5" />
                 </Button>
               )}
            </div>

            {!allAnswered && currentQuestionIndex === totalQuestions - 1 && (
               <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-center gap-3 text-amber-700 font-bold text-xs animate-in slide-in-from-bottom-2">
                 <AlertCircle className="h-5 w-5 shrink-0" />
                 <span>Ada pertanyaan yang belum Anda jawab. Pastikan semua soal telah terisi sebelum mengakhiri ujian.</span>
               </div>
            )}
         </div>

      </div>

    </div>
  );
}

function CheckCircle2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
