"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { submitTest } from "@/actions/test";

interface TestClientProps {
  test: any;
  courseId: string;
}

export const TestClient = ({
  test,
  courseId,
}: TestClientProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [answers, setAnswers] = useState<{ questionId: string, optionId: string }[]>([]);

  const onSelect = (questionId: string, optionId: string) => {
    setAnswers((prev) => {
      const filtered = prev.filter((a) => a.questionId !== questionId);
      return [...filtered, { questionId, optionId }];
    });
  };

  const onSubmit = () => {
    if (answers.length < test.questions.length) {
      toast.error("Please answer all questions before submitting.");
      return;
    }

    startTransition(async () => {
      try {
        await submitTest(test.id, answers);
        toast.success("Assessment submitted!");
        router.refresh();
      } catch {
        toast.error("Something went wrong");
      }
    });
  };

  return (
    <div className="space-y-8">
      {test.questions.map((question: any, index: number) => (
        <div key={question.id} className="bg-white p-8 rounded-2xl border shadow-sm space-y-6">
          <div className="flex items-start gap-x-4">
            <span className="bg-slate-100 h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold text-slate-500 shrink-0">
              {index + 1}
            </span>
            <h3 className="text-lg font-bold text-slate-800 pt-1 leading-snug">{question.text}</h3>
          </div>
          
          <div className="grid grid-cols-1 gap-3 pl-12">
            {question.options.map((option: any) => (
              <label 
                key={option.id} 
                className={`flex items-center p-4 border rounded-xl hover:border-primary/40 hover:bg-slate-50 cursor-pointer transition group ${
                  answers.find(a => a.questionId === question.id)?.optionId === option.id 
                  ? "border-primary bg-primary/5" 
                  : ""
                }`}
              >
                <input 
                  type="radio" 
                  name={`q-${question.id}`} 
                  value={option.id} 
                  className="h-4 w-4 text-primary accent-primary mr-4"
                  onChange={() => onSelect(question.id, option.id)}
                  disabled={isPending}
                />
                <span className={`text-sm font-medium group-hover:text-primary transition ${
                  answers.find(a => a.questionId === question.id)?.optionId === option.id 
                  ? "text-primary border-primary" 
                  : "text-slate-700"
                }`}>
                  {option.text}
                </span>
              </label>
            ))}
          </div>
        </div>
      ))}

      <div className="pt-10 flex flex-col items-center space-y-4">
        <Button 
          onClick={onSubmit}
          disabled={isPending}
          size="lg" 
          className="h-16 px-12 bg-primary hover:bg-primary/90 text-white font-extrabold text-xl shadow-2xl hover:scale-105 transition-all"
        >
          {isPending && <Loader2 className="h-6 w-6 animate-spin mr-2" />}
          Submit Assessment
        </Button>
        <p className="text-xs text-slate-400">Please review all your answers before submitting.</p>
      </div>
    </div>
  );
};
