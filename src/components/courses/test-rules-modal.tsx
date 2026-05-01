"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  Shuffle,
  RotateCcw,
  Shield,
  FileText,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TestRulesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  testType: "PRE" | "POST";
  testTitle: string;
  testInfo: {
    duration: number;
    passingScore: number;
    maxAttempts: number;
    attemptCount: number;
    randomizeQuestions?: boolean;
    randomizeOptions?: boolean;
  };
  courseId: string;
  testId: string;
}

export function TestRulesModal({
  open,
  onOpenChange,
  testType,
  testTitle,
  testInfo,
  courseId,
  testId,
}: TestRulesModalProps) {
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);

  const handleStart = () => {
    setIsStarting(true);
    router.push(`/courses/${courseId}/tests/${testId}`);
  };

  const remainingAttempts = testInfo.maxAttempts === 0 
    ? "Unlimited" 
    : Math.max(0, testInfo.maxAttempts - testInfo.attemptCount);

  const isLastAttempt = testInfo.maxAttempts > 0 && 
    testInfo.attemptCount >= testInfo.maxAttempts - 1;

  const hasNoAttemptsLeft = testInfo.maxAttempts > 0 && 
    testInfo.attemptCount >= testInfo.maxAttempts;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <div className={cn(
              "h-8 w-8 rounded-lg flex items-center justify-center",
              testType === "PRE" 
                ? "bg-blue-100 text-blue-600" 
                : "bg-green-100 text-green-600"
            )}>
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base">{testTitle}</DialogTitle>
              <Badge variant="secondary" className="text-xs mt-0.5">
                {testType === "PRE" ? "Pre-Test" : "Post-Test"}
              </Badge>
            </div>
          </div>
          <DialogDescription className="text-xs">
            Baca peraturan ujian sebelum memulai
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* Test Info Grid - Compact */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-center">
              <Clock className="h-3.5 w-3.5 text-blue-600 mx-auto mb-1" />
              <p className="text-lg font-bold text-blue-900">{testInfo.duration}</p>
              <p className="text-[10px] text-blue-700">menit</p>
            </div>

            <div className="p-2 rounded-lg bg-green-50 border border-green-200 text-center">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-600 mx-auto mb-1" />
              <p className="text-lg font-bold text-green-900">{testInfo.passingScore}%</p>
              <p className="text-[10px] text-green-700">KKM</p>
            </div>

            <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-center">
              <RotateCcw className="h-3.5 w-3.5 text-amber-600 mx-auto mb-1" />
              <p className="text-lg font-bold text-amber-900">{remainingAttempts}</p>
              <p className="text-[10px] text-amber-700">sisa</p>
            </div>
          </div>

          {/* Rules Section - Compact */}
          <div className="space-y-2">
            <h3 className="font-semibold text-xs text-slate-900 flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-blue-600" />
              Peraturan Ujian
            </h3>
            
            <div className="space-y-1.5">
              <CompactRule
                icon={<Clock className="h-3 w-3" />}
                text={`Waktu ${testInfo.duration} menit, timer otomatis`}
              />
              
              <CompactRule
                icon={<Eye className="h-3 w-3" />}
                text="Jangan keluar tab atau minimize window"
                variant="warning"
              />

              <CompactRule
                icon={<AlertTriangle className="h-3 w-3" />}
                text="Maks 3 pelanggaran, lebih = kecurangan"
                variant="danger"
              />

              {testInfo.maxAttempts > 0 && (
                <CompactRule
                  icon={<RotateCcw className="h-3 w-3" />}
                  text={`Maks ${testInfo.maxAttempts}x percobaan`}
                  variant={isLastAttempt ? "danger" : "default"}
                />
              )}

              {(testInfo.randomizeQuestions || testInfo.randomizeOptions) && (
                <CompactRule
                  icon={<Shuffle className="h-3 w-3" />}
                  text={
                    testInfo.randomizeQuestions && testInfo.randomizeOptions
                      ? "Soal & opsi diacak"
                      : testInfo.randomizeQuestions
                      ? "Soal diacak"
                      : "Opsi diacak"
                  }
                />
              )}
            </div>
          </div>

          {isLastAttempt && !hasNoAttemptsLeft && (
            <div className="p-2 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-red-600 shrink-0 mt-0.5" />
              <p className="text-xs text-red-900">
                <strong>Percobaan terakhir!</strong> Pastikan siap sebelum mulai.
              </p>
            </div>
          )}

          {hasNoAttemptsLeft && (
            <div className="p-3 rounded-lg bg-red-100 border border-red-300 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-700 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-900 mb-1">
                  Batas Percobaan Tercapai
                </p>
                <p className="text-xs text-red-800">
                  Anda sudah menggunakan semua {testInfo.maxAttempts} percobaan yang tersedia. 
                  Silakan hubungi admin jika memerlukan bantuan.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isStarting}
            size="sm"
          >
            {hasNoAttemptsLeft ? "Tutup" : "Batal"}
          </Button>
          {!hasNoAttemptsLeft && (
            <Button
              onClick={handleStart}
              disabled={isStarting}
              size="sm"
              className="gap-1.5"
            >
              {isStarting ? (
                <>Memulai...</>
              ) : (
                <>
                  Mulai Ujian
                  <ChevronRight className="h-3.5 w-3.5" />
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CompactRule({
  icon,
  text,
  variant = "default",
}: {
  icon: React.ReactNode;
  text: string;
  variant?: "default" | "warning" | "danger";
}) {
  return (
    <div className={cn(
      "flex items-center gap-2 p-2 rounded-md text-xs",
      variant === "warning" && "bg-amber-50 text-amber-900",
      variant === "danger" && "bg-red-50 text-red-900",
      variant === "default" && "bg-slate-50 text-slate-700"
    )}>
      <div className={cn(
        "h-5 w-5 rounded flex items-center justify-center shrink-0",
        variant === "warning" && "bg-amber-100 text-amber-600",
        variant === "danger" && "bg-red-100 text-red-600",
        variant === "default" && "bg-slate-200 text-slate-600"
      )}>
        {icon}
      </div>
      <span className="font-medium">{text}</span>
    </div>
  );
}
