"use client";

import { useState } from "react";
import { TestRulesModal } from "./test-rules-modal";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckCircle2, Lock, Clock, ChevronRight } from "lucide-react";

interface TestStepWithModalProps {
  courseId: string;
  testId: string;
  testType: "PRE" | "POST";
  testTitle: string;
  locked: boolean;
  done: boolean;
  lockReason?: string;
  testStatus?: "LULUS" | "GAGAL" | "KECURANGAN" | null;
  bestScore?: number | null;
  testInfo: {
    duration: number;
    passingScore: number;
    maxAttempts: number;
    attemptCount: number;
    randomizeQuestions?: boolean;
    randomizeOptions?: boolean;
  };
  resultUrl?: string;
}

export function TestStepWithModal({
  courseId,
  testId,
  testType,
  testTitle,
  locked,
  done,
  lockReason,
  testStatus,
  bestScore,
  testInfo,
  resultUrl,
}: TestStepWithModalProps) {
  const [showModal, setShowModal] = useState(false);

  const handleClick = () => {
    if (locked) return;
    
    // PERFECT RETRY LOGIC:
    // Calculate if user can retry based on attempts only
    const hasAttemptsLeft = testInfo.maxAttempts === 0 || testInfo.attemptCount < testInfo.maxAttempts;
    
    // RULE 1: If no attempts left, redirect to result page (cannot retry)
    if (done && resultUrl && !hasAttemptsLeft) {
      window.location.href = resultUrl;
      return;
    }
    
    // RULE 2: If has attempts left (regardless of pass/fail), show modal to allow retry
    // This allows users to improve their score even after passing
    // The system will always take the BEST (highest) score as final result
    setShowModal(true);
  };

  return (
    <>
      <Card
        className={cn(
          "transition-all duration-200",
          !locked && "hover:shadow-md hover:border-blue-300 cursor-pointer",
          locked && "opacity-60"
        )}
        onClick={handleClick}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Icon */}
            <div
              className={cn(
                "h-10 w-10 rounded-lg flex items-center justify-center shrink-0 font-semibold",
                done
                  ? "bg-green-100 text-green-700"
                  : locked
                  ? "bg-slate-100 text-slate-400"
                  : "bg-blue-100 text-blue-700"
              )}
            >
              {done ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : locked ? (
                <Lock className="h-4 w-4" />
              ) : (
                <span>★</span>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <Badge variant="secondary" className="text-xs">
                  {testType === "PRE" ? "Pre-Test" : "Post-Test"}
                </Badge>
                {testStatus === "LULUS" && (
                  <Badge className="text-xs bg-green-100 text-green-700 border-0">
                    Lulus
                  </Badge>
                )}
                {testStatus === "GAGAL" && (
                  <Badge className="text-xs bg-red-100 text-red-700 border-0">
                    Gagal
                  </Badge>
                )}
                {testStatus === "KECURANGAN" && (
                  <Badge className="text-xs bg-red-900 text-red-100 border-0">
                    Kecurangan
                  </Badge>
                )}
              </div>

              <h4 className="text-sm font-semibold text-slate-900 mb-1">
                {testTitle}
              </h4>

              {/* Test Info */}
              <div className="space-y-1.5 mt-2">
                <div className="flex items-center gap-4 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-blue-600" />
                    <span className="font-medium">{testInfo.duration} menit</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                    <span className="font-medium">KKM: {testInfo.passingScore}%</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-600">
                  <div>
                    <span className="font-medium">Percobaan:</span>{" "}
                    {testInfo.maxAttempts === 0 ? (
                      <span className="text-green-600 font-semibold">Unlimited</span>
                    ) : (
                      <span
                        className={cn(
                          "font-semibold",
                          testInfo.attemptCount >= testInfo.maxAttempts
                            ? "text-red-600"
                            : "text-blue-600"
                        )}
                      >
                        {testInfo.attemptCount}/{testInfo.maxAttempts}
                      </span>
                    )}
                  </div>
                  {(testInfo.randomizeQuestions || testInfo.randomizeOptions) && (
                    <div className="flex items-center gap-1">
                      <span className="text-amber-600">🔀</span>
                      <span className="text-amber-700 font-medium">
                        {testInfo.randomizeQuestions && testInfo.randomizeOptions
                          ? "Soal & Opsi Acak"
                          : testInfo.randomizeQuestions
                          ? "Soal Acak"
                          : "Opsi Acak"}
                      </span>
                    </div>
                  )}
                </div>
                {/* Best Score Display */}
                {bestScore !== null && bestScore !== undefined && !isNaN(bestScore) && (
                  <div className="flex items-center gap-2 pt-1">
                    <div className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold",
                      bestScore >= testInfo.passingScore
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                    )}>
                      <span>⭐</span>
                      <span>Nilai Terbaik: {Number(bestScore).toFixed(0)}</span>
                    </div>
                  </div>
                )}
              </div>

              {lockReason && (
                <p className="text-xs text-yellow-600 mt-2 flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  {lockReason}
                </p>
              )}
            </div>

            {/* Arrow */}
            {!locked && <ChevronRight className="h-5 w-5 text-slate-400 shrink-0" />}
          </div>
        </CardContent>
      </Card>

      <TestRulesModal
        open={showModal}
        onOpenChange={setShowModal}
        testType={testType}
        testTitle={testTitle}
        testInfo={testInfo}
        courseId={courseId}
        testId={testId}
      />
    </>
  );
}
