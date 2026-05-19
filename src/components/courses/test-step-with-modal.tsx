"use client";

import { useState } from "react";
import { TestRulesModal } from "./test-rules-modal";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckCircle2, Lock, Clock, ChevronRight, RotateCcw, Eye } from "lucide-react";

interface TestStepWithModalProps {
  courseId: string;
  testId: string;
  testType: "PRE" | "POST";
  testTitle: string;
  locked: boolean;
  done: boolean;
  lockReason?: string;
  testStatus?: "LULUS" | "GAGAL" | null;
  bestScore?: number | null;
  testInfo: {
    duration: number;
    passingScore: number;
    maxAttempts: number;
    attemptCount: number;
    remainingAttempts?: number;
    passedKKM?: boolean;
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

  // Determine if user can retry:
  // - Has remaining attempts (maxAttempts = 0 means unlimited)
  // - Has NOT passed KKM OR wants to improve score
  const hasAttemptsLeft = testInfo.maxAttempts === 0 || testInfo.attemptCount < testInfo.maxAttempts;
  const canRetry = hasAttemptsLeft;
  const hasPassedKKM = testStatus === "LULUS" || testInfo.passedKKM;
  const hasResult = done && resultUrl;

  const handleClick = () => {
    if (locked) return;

    // RULE 1: If no attempts left, redirect to result page
    if (hasResult && !canRetry) {
      window.location.href = resultUrl;
      return;
    }

    // RULE 2: If has attempts left, show modal to allow retry
    setShowModal(true);
  };

  // Determine which icon and text to show
  const renderStatusIcon = () => {
    if (locked) {
      return <Lock className="h-4 w-4" />;
    }
    if (done && hasPassedKKM) {
      return <CheckCircle2 className="h-5 w-5" />;
    }
    if (testInfo.attemptCount > 0) {
      return <RotateCcw className="h-4 w-4" />;
    }
    return <span>★</span>;
  };

  const renderStatusBadge = () => {
    if (testStatus === "LULUS") {
      return (
        <Badge className="text-xs bg-green-100 text-green-700 border-0 gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Lulus
        </Badge>
      );
    }
    if (testStatus === "GAGAL" && hasAttemptsLeft) {
      return (
        <Badge className="text-xs bg-orange-100 text-orange-700 border-0 gap-1">
          <RotateCcw className="h-3 w-3" />
          Gagal — {testInfo.remainingAttempts !== undefined && testInfo.remainingAttempts < 999
            ? `${testInfo.remainingAttempts} percobaan tersisa`
            : "Coba lagi"}
        </Badge>
      );
    }
    if (testStatus === "GAGAL" && !hasAttemptsLeft) {
      return (
        <Badge className="text-xs bg-red-100 text-red-700 border-0">
          Tidak Lulus
        </Badge>
      );
    }
    if (done) {
      return (
        <Badge className="text-xs bg-blue-100 text-blue-700 border-0 gap-1">
          <Eye className="h-3 w-3" />
          Dilihat
        </Badge>
      );
    }
    return null;
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
                locked
                  ? "bg-slate-100 text-slate-400"
                  : hasPassedKKM
                  ? "bg-green-100 text-green-700"
                  : testInfo.attemptCount > 0
                  ? "bg-orange-100 text-orange-700"
                  : "bg-blue-100 text-blue-700"
              )}
            >
              {renderStatusIcon()}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <Badge variant="secondary" className="text-xs">
                  {testType === "PRE" ? "Pre-Test" : "Post-Test"}
                </Badge>
                {renderStatusBadge()}
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
                      <span>Nilai Terbaik: {Number(bestScore).toFixed(0)}%</span>
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

            {/* Arrow / Action Indicator */}
            {!locked && (
              <div className="flex items-center gap-2 shrink-0">
                {canRetry && hasResult && !hasPassedKKM && (
                  <Badge variant="outline" className="text-xs text-orange-600 border-orange-300 bg-orange-50 gap-1">
                    <RotateCcw className="h-3 w-3" />
                    Ulangi
                  </Badge>
                )}
                {canRetry && hasPassedKKM && (
                  <Badge variant="outline" className="text-xs text-blue-600 border-blue-300 bg-blue-50 gap-1">
                    <RotateCcw className="h-3 w-3" />
                    Tingkatkan
                  </Badge>
                )}
                {!canRetry && hasResult && (
                  <Badge variant="outline" className="text-xs text-slate-600 border-slate-300 gap-1">
                    <Eye className="h-3 w-3" />
                    Hasil
                  </Badge>
                )}
                <ChevronRight className="h-5 w-5 text-slate-400" />
              </div>
            )}
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
