"use client";

import { useState } from "react";
import { TestRulesModal } from "./test-rules-modal";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckCircle2, Lock, Clock, ChevronRight, RotateCcw, Eye, FileCheck2 } from "lucide-react";

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

  const hasAttemptsLeft = testInfo.maxAttempts === 0 || testInfo.attemptCount < testInfo.maxAttempts;
  const canRetry = hasAttemptsLeft && (bestScore === null || bestScore === undefined || bestScore < 100);
  const hasPassedKKM = testStatus === "LULUS" || testInfo.passedKKM;
  const hasResult = done && resultUrl;

  const handleClick = () => {
    if (locked) return;

    if (hasResult && !canRetry) {
      window.location.href = resultUrl;
      return;
    }

    setShowModal(true);
  };

  const renderStatusIcon = () => {
    if (locked) {
      return <Lock className="h-4 w-4" />;
    }
    if (done && hasPassedKKM) {
      return <CheckCircle2 className="h-4.5 w-4.5" />;
    }
    return <span>★</span>;
  };

  const renderStatusBadge = () => {
    if (testStatus === "LULUS") {
      return (
        <Badge className="text-[10px] font-semibold bg-[#ECFDF3] text-[#027A48] border border-[#6CE9A6] rounded-lg shadow-none uppercase tracking-wide">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Lulus
        </Badge>
      );
    }
    if (testStatus === "GAGAL" && hasAttemptsLeft) {
      return (
        <Badge className="text-[10px] font-semibold bg-[#FFFAEB] text-[#B54708] border border-[#FEC84B] rounded-lg shadow-none uppercase tracking-wide gap-1">
          <RotateCcw className="h-3 w-3" />
          Gagal — {testInfo.remainingAttempts !== undefined && testInfo.remainingAttempts < 999
            ? `${testInfo.remainingAttempts} Percobaan`
            : "Coba Lagi"}
        </Badge>
      );
    }
    if (testStatus === "GAGAL" && !hasAttemptsLeft) {
      return (
        <Badge className="text-[10px] font-semibold bg-[#FEF3F2] text-[#B42318] border border-[#FDA29B] rounded-lg shadow-none uppercase tracking-wide">
          Tidak Lulus
        </Badge>
      );
    }
    if (done) {
      return (
        <Badge className="text-[10px] font-semibold bg-[#EFF8FF] text-[#175CD3] border border-[#B2DDFF] rounded-lg shadow-none uppercase tracking-wide gap-1">
          <Eye className="h-3 w-3" />
          Dilihat
        </Badge>
      );
    }
    return null;
  };

  const borderAccent = done 
    ? "border-l-4 border-l-[#12B76A]" 
    : locked 
    ? "border-l-4 border-l-transparent" 
    : "border-l-4 border-l-[#E8A020]";

  return (
    <>
      <Card
        className={cn(
          "rounded-xl border border-[#E4E7EC] bg-white transition-all duration-300 shadow-sm overflow-hidden active:scale-[0.99]",
          !locked && "hover:border-[#E8A020]/50 hover:shadow-md cursor-pointer",
          locked && "opacity-75 cursor-not-allowed bg-[#F8F9FB]/50"
        )}
        onClick={handleClick}
      >
        <CardContent className="p-0">
          <div className={cn("p-4 rounded-xl", borderAccent)}>
            <div className="flex items-start gap-4">
              {/* Number / icon circle */}
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-extrabold text-sm font-['Lexend_Deca'] border shadow-sm transition-all duration-300",
                  done && hasPassedKKM
                    ? "bg-[#ECFDF3] border-[#6CE9A6] text-[#027A48]"
                    : locked
                    ? "bg-[#F8F9FB] border-[#E4E7EC] text-[#98A2B3]"
                    : "bg-[#0F1C3F] border-transparent text-white"
                )}
              >
                {done && hasPassedKKM ? (
                  <CheckCircle2 size={16} />
                ) : locked ? (
                  <Lock size={14} />
                ) : (
                  <span>★</span>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <Badge className={cn(
                    "text-[10px] font-bold px-2.5 py-0.5 rounded-md border font-['DM_Sans'] uppercase tracking-wider shadow-none",
                    testType === "PRE" 
                      ? "bg-[#EFF8FF] text-[#175CD3] border-[#B2DDFF]" 
                      : "bg-[#FFFBEB] text-[#B45309] border-[#FEF3C7]"
                  )}>
                    {testType === "PRE" ? "Pre-Test" : "Post-Test"}
                  </Badge>
                  {renderStatusBadge()}
                </div>

                <h4 className="text-sm font-bold text-[#0F1C3F] font-['DM_Sans'] leading-snug mb-1.5 line-clamp-2">
                  {testTitle}
                </h4>

                {/* Test Info */}
                <div className="space-y-1.5 mt-2">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-[#64748B] font-['DM_Sans'] font-semibold">
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} className="text-[#98A2B3]" />
                      <span>{testInfo.duration} menit</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FileCheck2 size={12} className="text-[#98A2B3]" />
                      <span>KKM: <span className="text-[#C4861A]">{testInfo.passingScore}%</span></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span>Percobaan:</span>{" "}
                      {testInfo.maxAttempts === 0 ? (
                        <span className="text-[#027A48] font-bold">Tak Terbatas</span>
                      ) : (
                        <span
                          className={cn(
                            "font-bold",
                            testInfo.attemptCount >= testInfo.maxAttempts
                              ? "text-[#B42318] bg-[#FEF3F2] px-1.5 py-0.5 rounded"
                              : "text-[#175CD3] bg-[#EFF8FF] px-1.5 py-0.5 rounded"
                          )}
                        >
                          {testInfo.attemptCount}/{testInfo.maxAttempts}
                        </span>
                      )}
                    </div>
                  </div>

                  {(testInfo.randomizeQuestions || testInfo.randomizeOptions) && (
                    <div className="inline-flex items-center gap-1 text-[10px] text-[#C4861A] font-bold font-['DM_Sans'] uppercase tracking-wide bg-[#FEF3DC]/60 border border-[#F5C05A]/30 rounded-md px-2 py-0.5 w-fit">
                      🔀{" "}
                      {testInfo.randomizeQuestions && testInfo.randomizeOptions
                        ? "Soal & Opsi Acak"
                        : testInfo.randomizeQuestions
                        ? "Soal Acak"
                        : "Opsi Acak"}
                    </div>
                  )}

                  {/* Best Score Display */}
                  {bestScore !== null && bestScore !== undefined && !isNaN(bestScore) && (
                    <div className="flex items-center gap-2 pt-1">
                      <div className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-extrabold border shadow-none font-['DM_Sans']",
                        bestScore >= testInfo.passingScore
                          ? "bg-[#ECFDF3] text-[#027A48] border-[#6CE9A6]"
                          : "bg-[#FEF3F2] text-[#B42318] border-[#FDA29B]"
                      )}>
                        <span>⭐</span>
                        <span>Nilai Terbaik: {Number(bestScore).toFixed(0)}%</span>
                      </div>
                    </div>
                  )}
                </div>

                {lockReason && (
                  <p className="text-xs font-semibold text-[#B54708] bg-[#FFFAEB] border border-[#FEC84B]/40 rounded-lg px-2.5 py-1.5 mt-2.5 w-fit font-['DM_Sans'] flex items-center gap-1.5">
                    <Lock size={12} className="shrink-0" />
                    {lockReason}
                  </p>
                )}
              </div>

              {/* Arrow / Action Indicator */}
              {!locked && (
                <div className="flex items-center gap-2 shrink-0 self-center">
                  {canRetry && hasResult && !hasPassedKKM && (
                    <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-[#FFFAEB] text-[#B54708] border-[#FEC84B] shadow-none gap-1 uppercase tracking-wide">
                      <RotateCcw className="h-3 w-3" />
                      Ulangi
                    </Badge>
                  )}
                  {canRetry && hasPassedKKM && (
                    <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-[#EFF8FF] text-[#175CD3] border-[#B2DDFF] shadow-none gap-1 uppercase tracking-wide">
                      <RotateCcw className="h-3 w-3" />
                      Tingkatkan
                    </Badge>
                  )}
                  {!canRetry && hasResult && (
                    <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-[#F8F9FC] text-[#475467] border-[#E4E7EC] shadow-none gap-1 uppercase tracking-wide">
                      <Eye className="h-3 w-3" />
                      Hasil
                    </Badge>
                  )}
                  <ChevronRight size={18} className="text-[#98A2B3] group-hover:text-[#E8A020] group-hover:translate-x-0.5 transition-all duration-200" />
                </div>
              )}
            </div>
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
