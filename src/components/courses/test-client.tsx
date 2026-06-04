"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Timer,
  ChevronRight,
  ChevronLeft,
  Send,
  AlertCircle,
  CheckCircle2,
  Flag,
  BookmarkCheck,
  PanelRightClose,
  PanelRightOpen,
  Loader2,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { submitTest } from "@/actions/test";
import { toast } from "sonner";
import { useTestProtection } from "@/hooks/use-test-protection";

interface TestClientProps {
  test: any;
  courseId: string;
  attemptNumber: number;
  maxAttempts: number;
  startedAt?: string;
  userId: string;
  attemptId: string;
}

export function TestClient({
  test,
  courseId,
  attemptNumber,
  userId,
  startedAt,
  attemptId
}: TestClientProps) {
  const router = useRouter();

  // Enable test protection (disable right-click, copy, paste, keyboard shortcuts)
  useTestProtection({ enabled: true, allowPrint: false });

  // Show protection warning when user tries to copy/right-click
  const [protectionWarning, setProtectionWarning] = useState<string | null>(null);

  const showProtectionWarning = useCallback((message: string) => {
    setProtectionWarning(message);
    toast.warning(message, { duration: 2000 });
    setTimeout(() => setProtectionWarning(null), 2000);
  }, []);

  // Storage Key
  const STORAGE_KEY = `elearning_${userId}_${test.id}_${attemptNumber}_progress`;
  const ACTIVE_ATTEMPT_KEY = `active_attempt_${test.id}_${userId}`;

  const [isReady, setIsReady] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [markedQuestions, setMarkedQuestions] = useState<Set<number>>(new Set());
  const [shuffledQuestions, setShuffledQuestions] = useState<any[]>(() => [...test.questions]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [timeLeft, setTimeLeft] = useState(test.duration * 60);

  // Refs to always hold the latest values — needed for timer/auto-submit closures
  const answersRef = useRef<Record<string, string>>(answers);
  const shuffledQuestionsRef = useRef<any[]>(shuffledQuestions);
  const isSubmittingRef = useRef(false);
  const currentQuestionIndexRef = useRef(currentQuestionIndex);
  const markedQuestionsRef = useRef(markedQuestions);

  // Note: we update answersRef synchronously inside setAnswers to avoid 1-render delays
  useEffect(() => { shuffledQuestionsRef.current = shuffledQuestions; }, [shuffledQuestions]);
  useEffect(() => { isSubmittingRef.current = isSubmitting; }, [isSubmitting]);
  useEffect(() => { currentQuestionIndexRef.current = currentQuestionIndex; }, [currentQuestionIndex]);
  useEffect(() => { markedQuestionsRef.current = markedQuestions; }, [markedQuestions]);
  // Sync answersRef with answers state - CRITICAL for auto-submit to capture latest answers
  useEffect(() => { answersRef.current = answers; }, [answers]);
  const [showSidebar, setShowSidebar] = useState(true);
  // Offline States
  const [isOnline, setIsOnline] = useState(true);
  const [showOfflineWarning, setShowOfflineWarning] = useState(false);

  // Load Data
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.answers) {
          setAnswers(parsed.answers);
          answersRef.current = parsed.answers;
        }
        if (typeof parsed.currentIndex === "number") setCurrentQuestionIndex(parsed.currentIndex);
        if (parsed.shuffledQuestions) setShuffledQuestions(parsed.shuffledQuestions);
        if (parsed.markedQuestions) setMarkedQuestions(new Set(parsed.markedQuestions));
      } else if (test.randomizeQuestions || test.randomizeOptions) {
        let shuffled = [...test.questions];
        if (test.randomizeQuestions) {
          shuffled = shuffled.sort(() => Math.random() - 0.5);
        }
        if (test.randomizeOptions) {
          shuffled = shuffled.map((q: any) => ({
            ...q,
            options: [...q.options].sort(() => Math.random() - 0.5),
          }));
        }
        setShuffledQuestions(shuffled);
      } else {
        setShuffledQuestions(test.questions);
      }
    } catch (error) {
      console.error("Failed to load test progress:", error);
      localStorage.removeItem(STORAGE_KEY);
    }

    localStorage.setItem(ACTIVE_ATTEMPT_KEY, attemptId);
    window.history.pushState(null, "", window.location.href);

    setIsReady(true);
  }, []);

  // Intercept back button
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      // Prevent the user from navigating back immediately
      window.history.pushState(null, "", window.location.href);
      setShowExitModal(true);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // ── Reliable answer retrieval: merge state + ref + localStorage ──
  // Guarantees answers are NEVER lost, even in stale closures or race conditions
  // IMPORTANT: ref values take PRIORITY over localStorage (ref is more recent)
  const getReliableAnswers = useCallback((): Record<string, string> => {
    // Source 1: ref (always latest in async contexts) — use first for recent data
    const fromRef = answersRef.current || {};
    // Source 2: localStorage (persisted every state change) — use as fallback
    let fromStorage: Record<string, string> = {};
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.answers && typeof parsed.answers === 'object') {
          fromStorage = parsed.answers;
        }
      }
    } catch { /* ignore parse errors */ }

    // Merge: ref overwrites storage (ref is more recent since answersRef.current
    // is updated synchronously in handleSelectOption before localStorage write)
    const merged = { ...fromStorage, ...fromRef };

    return merged;
  }, [STORAGE_KEY]);

  const getReliableQuestions = useCallback((): any[] => {
    const fromRef = shuffledQuestionsRef.current;
    if (fromRef && fromRef.length > 0) return fromRef;

    // Fallback: localStorage
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.shuffledQuestions?.length > 0) return parsed.shuffledQuestions;
      }
    } catch { /* ignore */ }

    return test.questions;
  }, [STORAGE_KEY, test.questions]);

  // Stable auto-submit function — reads from refs + localStorage fallback
  const handleAutoSubmit = useCallback(async () => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setShowSubmitDialog(false);
    const loadingToast = toast.loading("Waktu habis! Mengirim jawaban...");

    // DEBUG: Log initial state at the very start
    console.log("[AUTO_SUBMIT] === START ===");
    console.log("[AUTO_SUBMIT] answersRef.current:", JSON.stringify(answersRef.current));
    console.log("[AUTO_SUBMIT] currentQuestionIndexRef:", currentQuestionIndexRef.current);
    console.log("[AUTO_SUBMIT] shuffledQuestions.length:", shuffledQuestionsRef.current?.length);

    // Read raw localStorage for debugging
    try {
      const rawStorage = localStorage.getItem(STORAGE_KEY);
      console.log("[AUTO_SUBMIT] localStorage raw:", rawStorage);
      if (rawStorage) {
        const parsed = JSON.parse(rawStorage);
        console.log("[AUTO_SUBMIT] localStorage parsed answers count:", Object.keys(parsed.answers || {}).length);
        console.log("[AUTO_SUBMIT] localStorage parsed answers:", parsed.answers);
      }
    } catch (e) {
      console.log("[AUTO_SUBMIT] localStorage read failed:", e);
    }

    try {
      // SAFETY NET: Force-sync current React state to localStorage BEFORE reading
      // This ensures we capture ALL answers, including any that might not be in ref yet
      // due to React state batching or rapid user interactions
      const currentAnswers = answersRef.current;
      try {
        const currentData = {
          answers: currentAnswers,
          currentIndex: currentQuestionIndexRef.current,
          shuffledQuestions: shuffledQuestionsRef.current,
          markedQuestions: Array.from(markedQuestionsRef.current),
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(currentData));
      } catch (e) {
        console.warn("[AUTO_SUBMIT] localStorage sync failed:", e);
      }

      // Now read from BOTH ref and localStorage, preferring ref (more recent)
      const reliableAnswers = getReliableAnswers();
      const reliableQuestions = getReliableQuestions();

      // DEBUG: Log answer count for troubleshooting
      const answerKeys = Object.keys(reliableAnswers);
      console.log(`[AUTO_SUBMIT] Ref has ${answerKeys.length} answers, Questions: ${reliableQuestions.length}`, {
        answerKeys,
        answers: reliableAnswers
      });

      const formattedAnswers = reliableQuestions.map((q: any) => ({
        questionId: q.id,
        optionId: reliableAnswers[q.id] ?? null,
      }));

      console.log(`[AUTO_SUBMIT] Formatted ${formattedAnswers.filter(f => f.optionId).length} answers for submission`);

      const result = await submitTest(test.id, formattedAnswers, { attemptId, isForceSubmit: true });

      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(ACTIVE_ATTEMPT_KEY);

      toast.success("Waktu habis. Jawaban yang sudah diisi berhasil dikirim.", { id: loadingToast });
      router.push(`/courses/${courseId}/tests/${test.id}/result?attemptId=${result.id}`);
      router.refresh();
    } catch (error: any) {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
      console.error("[AUTO_SUBMIT_ERROR]", error);
      toast.error(error?.message || "Gagal mengirim jawaban otomatis.", { id: loadingToast, duration: 5000 });
    }
  }, [attemptId, courseId, test.id, STORAGE_KEY, ACTIVE_ATTEMPT_KEY, router, getReliableAnswers, getReliableQuestions]);

  // Timer Logic — uses stable handleAutoSubmit (reads from refs, never stale)
  useEffect(() => {
    if (!isReady) return;

    const calculateTimeRemaining = () => {
      if (!startedAt) return test.duration * 60;
      
      const start = new Date(startedAt).getTime();
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - start) / 1000);
      const remaining = (test.duration * 60) - elapsedSeconds;
      
      return Math.max(0, remaining);
    };

    const initialRemaining = calculateTimeRemaining();
    setTimeLeft(initialRemaining);

    if (initialRemaining <= 0) {
      handleAutoSubmit();
      return;
    }

    const timer = setInterval(() => {
      const currentRemaining = calculateTimeRemaining();
      setTimeLeft(currentRemaining);
      
      if (currentRemaining <= 0) {
        clearInterval(timer);
        handleAutoSubmit();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isReady, startedAt, handleAutoSubmit]);

  // Auto-Save Logic
  useEffect(() => {
    if (!isReady || isSubmittingRef.current) return;

    const dataToSave = {
      answers,
      currentIndex: currentQuestionIndexRef.current,
      shuffledQuestions: shuffledQuestionsRef.current,
      markedQuestions: Array.from(markedQuestionsRef.current),
      updatedAt: new Date().toISOString()
    };

    // DEBUG: Log what auto-save is writing
    console.log(`[AUTO_SAVE] Saving ${Object.keys(dataToSave.answers).length} answers:`, Object.keys(dataToSave.answers));

    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  }, [answers, isReady]);

  // Keyboard Navigation - using refs to avoid listener recreation
  const handleSelectOptionRef = useRef<(questionId: string, optionId: string) => void>(() => {});
  const toggleMarkRef = useRef<(index: number) => void>(() => {});

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (isSubmittingRef.current) return;

      const currentIdx = currentQuestionIndexRef.current;
      const questions = shuffledQuestionsRef.current;
      const currentQ = questions[currentIdx];

      if (!currentQ) return;

      // Number keys 1-4 for options A-D
      if (e.key >= '1' && e.key <= '4') {
        const optionIndex = parseInt(e.key) - 1;
        if (currentQ.options?.[optionIndex]) {
          handleSelectOptionRef.current(currentQ.id, currentQ.options[optionIndex].id);
        }
      }

      // Arrow keys for navigation
      if (e.key === 'ArrowLeft' && currentIdx > 0) {
        setCurrentQuestionIndex(prev => prev - 1);
      }
      if (e.key === 'ArrowRight' && currentIdx < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      }

      // M key to mark/unmark
      if (e.key.toLowerCase() === 'm') {
        toggleMarkRef.current(currentIdx);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isSubmitting]);

  // Online/Offline Detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineWarning(false);
      toast.success("Koneksi internet kembali normal");
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineWarning(true);
      toast.warning("Koneksi internet terputus. Jawaban tetap tersimpan di browser.", { duration: 10000 });
    };

    // Set initial state
    setIsOnline(navigator.onLine);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const currentQuestion = shuffledQuestions[currentQuestionIndex];
  const totalQuestions = shuffledQuestions.length;

  const handleSelectOption = (questionId: string, optionId: string) => {
    if (isSubmittingRef.current) return;

    setAnswers((prev) => {
      const nextAnswers = {
        ...prev,
        [questionId]: optionId,
      };

      // 1. Synchronously update ref so auto-submit NEVER misses an answer
      answersRef.current = nextAnswers;

      // DEBUG: Log answer selection
      console.log(`[SELECT] Q:${questionId.slice(0,8)} → O:${optionId.slice(0,8)}, total answers: ${Object.keys(nextAnswers).length}`);

      // 2. Synchronously write to localStorage to prevent debounce race conditions
      // Use refs for currentQuestionIndex and markedQuestions to avoid stale closures
      try {
        const dataToSave = {
          answers: nextAnswers,
          currentIndex: currentQuestionIndexRef.current,
          shuffledQuestions: shuffledQuestionsRef.current,
          markedQuestions: Array.from(markedQuestionsRef.current),
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
        // DEBUG: Verify localStorage write
        const verify = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        console.log(`[LOCALSTORAGE] Written ${Object.keys(verify.answers || {}).length} answers`);
      } catch (err) {
        console.error("Failed to save to localStorage synchronously:", err);
      }

      return nextAnswers;
    });
  };

  const toggleMark = (index: number) => {
    setMarkedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  // Sync function refs after definitions
  useEffect(() => { handleSelectOptionRef.current = handleSelectOption; }, [handleSelectOption]);
  useEffect(() => { toggleMarkRef.current = toggleMark; }, [toggleMark]);

  const handleSubmit = async (isForceSubmit = false) => {
    if (isSubmitting) return;

    // Check if offline before submitting
    if (!navigator.onLine) {
      toast.error("Tidak ada koneksi internet. Jawaban tersimpan di browser. Silakan coba lagi saat koneksi kembali.", { duration: 10000 });
      return;
    }
    
    setIsSubmitting(true);
    setShowSubmitDialog(false);
    const loadingToast = toast.loading("Mengirim jawaban...");

    try {
      // Use reliable answers: merge state + ref + localStorage for safety
      const reliableAnswers = getReliableAnswers();
      const formattedAnswers = shuffledQuestions
        .map((q: any) => ({
          questionId: q.id,
          optionId: reliableAnswers[q.id] ?? null,
        }));

      const result = await submitTest(test.id, formattedAnswers, { attemptId, isForceSubmit });
      
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(ACTIVE_ATTEMPT_KEY);
      
      toast.success(isForceSubmit ? "Ujian diakhiri. Progress tersimpan." : "Ujian berhasil dikirim!", { id: loadingToast });
      
      if (isForceSubmit) {
        router.push(`/courses/${courseId}`);
      } else {
        router.push(`/courses/${courseId}/tests/${test.id}/result?attemptId=${result.id}`);
      }
      router.refresh();
    } catch (error: any) {
      setIsSubmitting(false);

      // Check if error is due to network issue
      if (typeof window !== "undefined" && !navigator.onLine) {
        toast.error("Koneksi terputus. Jawaban tersimpan di browser. Silakan coba submit lagi saat koneksi kembali.", { id: loadingToast, duration: 10000 });
        return;
      }

      // Check if it's a network error
      if (error?.message?.includes("fetch") || error?.message?.includes("network") || error?.message?.includes("Failed to fetch")) {
        toast.error("Gagal mengirim jawaban. Koneksi bermasalah. Jawaban tersimpan di browser.", { id: loadingToast, duration: 10000 });
        return;
      }

      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(ACTIVE_ATTEMPT_KEY);

      const errorMessage = error?.message || error?.toString() || "";

      if (errorMessage.includes("WAKTU_HABIS") || errorMessage.includes("Waktu test telah habis")) {
        toast.error("Waktu ujian telah habis.", { id: loadingToast, duration: 5000 });
        router.push(`/courses/${courseId}`);
      } else if (errorMessage.includes("TEST_ALREADY_PASSED")) {
        toast.error("Anda sudah lulus ujian ini.", { id: loadingToast });
        router.push(`/courses/${courseId}`);
      } else if (errorMessage.includes("MAX_ATTEMPTS_REACHED")) {
        toast.error("Batas percobaan tercapai.", { id: loadingToast });
        router.push(`/courses/${courseId}`);
      } else {
        console.error("[TEST_SUBMIT_ERROR]", error);
        toast.error(errorMessage || "Terjadi kesalahan.", { id: loadingToast, duration: 5000 });
      }
    }
  };

  const confirmSubmit = () => {
    setShowSubmitDialog(true);
  };

  const allAnswered = Object.keys(answers).length === totalQuestions;
  const answeredCount = Object.keys(answers).length;
  const markedCount = markedQuestions.size;

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg font-semibold text-muted-foreground">Mempersiapkan Ujian...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className="min-h-screen bg-background flex flex-col select-none"
        onContextMenu={(e) => e.preventDefault()}
      >
        
        {/* Header */}
        <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
          <div className="container flex h-14 items-center justify-between px-3 sm:px-4">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Badge variant={test.type === 'PRE' ? 'default' : 'secondary'} className="shrink-0 text-xs">
                {test.type === 'PRE' ? 'Pre-Test' : 'Post-Test'}
              </Badge>
              <Separator orientation="vertical" className="h-4" />
              <div className="relative" title="Proteksi aktif - Klik kanan dinonaktifkan">
                <Shield className="h-3.5 w-3.5 text-green-600 shrink-0" />
              </div>
              <Separator orientation="vertical" className="h-4" />
              <div className="min-w-0">
                <h1 className="text-xs sm:text-sm font-medium truncate">{test.title}</h1>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  Soal {currentQuestionIndex + 1}/{totalQuestions}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSidebar(!showSidebar)}
                className="hidden lg:flex gap-1.5 h-8 px-2"
              >
                {showSidebar ? (
                  <><PanelRightClose className="h-3.5 w-3.5" /> <span className="hidden xl:inline text-xs">Sembunyikan</span></>
                ) : (
                  <><PanelRightOpen className="h-3.5 w-3.5" /> <span className="hidden xl:inline text-xs">Tampilkan</span></>
                )}
              </Button>

              {/* Offline Indicator */}
              {!isOnline && (
                <Badge variant="destructive" className="text-xs gap-1 animate-pulse">
                  <AlertCircle className="h-3 w-3" />
                  Offline
                </Badge>
              )}

              <div className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-mono text-xs font-medium",
                timeLeft < 300 
                  ? "bg-destructive/10 border-destructive text-destructive animate-pulse" 
                  : timeLeft < 600
                    ? "bg-yellow-500/10 border-yellow-500 text-yellow-700 dark:text-yellow-500"
                    : "bg-muted"
              )}>
                <Timer className="h-3.5 w-3.5" />
                {formatTime(timeLeft)}
              </div>
            </div>
          </div>
        </div>

        {/* Protection Warning Banner */}
        {protectionWarning && (
          <div className="bg-red-600 text-white px-4 py-2 text-center animate-pulse">
            <div className="container flex items-center justify-center gap-2 text-sm font-semibold">
              <Shield className="h-4 w-4" />
              {protectionWarning}
            </div>
          </div>
        )}

        {/* Offline Warning Banner */}
        {showOfflineWarning && (
          <div className="bg-yellow-500 text-yellow-950 px-4 py-2 text-center">
            <div className="container flex items-center justify-center gap-2 text-sm font-semibold">
              <AlertCircle className="h-4 w-4" />
              Koneksi internet terputus. Jawaban tetap tersimpan di browser. Timer tetap berjalan.
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
            <div className="container max-w-3xl py-4 px-3 sm:px-4 space-y-4">
              
              {/* Progress */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{answeredCount}/{totalQuestions} terjawab</span>
                </div>
                <Progress value={(answeredCount / totalQuestions) * 100} className="h-1.5" />
              </div>

              {/* Question Card */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-semibold">
                        {currentQuestionIndex + 1}
                      </div>
                      <div>
                        <CardTitle className="text-sm">Pertanyaan {currentQuestionIndex + 1}</CardTitle>
                        <p className="text-xs text-muted-foreground">dari {totalQuestions} soal</p>
                      </div>
                    </div>

                    <Button
                      variant={markedQuestions.has(currentQuestionIndex) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleMark(currentQuestionIndex)}
                      className="gap-1.5 h-8 text-xs"
                    >
                      {markedQuestions.has(currentQuestionIndex) ? (
                        <><BookmarkCheck className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Ditandai</span></>
                      ) : (
                        <><Flag className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Tandai</span></>
                      )}
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Question Text */}
                  <div
                    className="rounded-md border bg-muted/50 p-3"
                    onCopy={(e) => e.preventDefault()}
                    onCut={(e) => e.preventDefault()}
                    onPaste={(e) => e.preventDefault()}
                    draggable={false}
                  >
                    <p className="text-sm leading-relaxed">{currentQuestion.text}</p>
                  </div>

                  {/* Options */}
                  <div
                    className="space-y-2"
                    onCopy={(e) => e.preventDefault()}
                    onCut={(e) => e.preventDefault()}
                    onPaste={(e) => e.preventDefault()}
                    draggable={false}
                  >
                    {currentQuestion.options.map((option: any, index: number) => {
                      const char = String.fromCharCode(65 + index);
                      const isSelected = answers[currentQuestion.id] === option.id;

                      return (
                        <button
                          key={option.id}
                          onClick={() => handleSelectOption(currentQuestion.id, option.id)}
                          className={cn(
                            "w-full flex items-center gap-2.5 p-3 rounded-md border-2 text-left transition-all",
                            isSelected 
                              ? "border-primary bg-primary text-primary-foreground shadow-sm" 
                              : "border-border hover:border-primary/50 hover:bg-accent"
                          )}
                        >
                          <div className={cn(
                            "flex h-7 w-7 shrink-0 items-center justify-center rounded text-xs font-semibold",
                            isSelected 
                              ? "bg-primary-foreground/20 text-primary-foreground" 
                              : "bg-muted text-muted-foreground"
                          )}>
                            {char}
                          </div>
                          <span className="flex-1 text-sm">{option.text}</span>
                          {isSelected && <CheckCircle2 className="h-4 w-4 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Keyboard Hint */}
                  <div className="rounded-md border bg-muted/50 p-2.5">
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      <span className="font-semibold">Tip:</span> Gunakan <kbd className="px-1 py-0.5 rounded bg-background border text-[10px] font-mono">1-4</kbd> untuk jawaban, 
                      <kbd className="px-1 py-0.5 rounded bg-background border text-[10px] font-mono mx-1">←</kbd>
                      <kbd className="px-1 py-0.5 rounded bg-background border text-[10px] font-mono">→</kbd> navigasi, 
                      <kbd className="px-1 py-0.5 rounded bg-background border text-[10px] font-mono ml-1">M</kbd> tandai
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Navigation */}
              <div className="flex items-center justify-between gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentQuestionIndex === 0}
                  onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
                  className="gap-1.5 h-9"
                >
                  <ChevronLeft className="h-4 w-4" /> Sebelumnya
                </Button>

                {currentQuestionIndex === totalQuestions - 1 ? (
                  <Button
                    size="sm"
                    disabled={isSubmitting || !isOnline}
                    onClick={confirmSubmit}
                    className="gap-1.5 h-9"
                  >
                    {isSubmitting ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Mengirim...</>
                    ) : !isOnline ? (
                      <>Offline</>
                    ) : (
                      <>Selesai <Send className="h-4 w-4" /></>
                    )}
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => setCurrentQuestionIndex((prev) => prev + 1)} className="gap-1.5 h-9">
                    Lanjut <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Warning */}
              {!allAnswered && currentQuestionIndex === totalQuestions - 1 && (
                <div className="flex items-start gap-2.5 rounded-md border border-yellow-500/50 bg-yellow-500/10 p-3 text-yellow-900 dark:text-yellow-500">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-semibold text-xs">Peringatan</p>
                    <p className="text-[11px] leading-relaxed">
                      Ada {totalQuestions - answeredCount} soal yang belum dijawab. Pastikan semua soal terisi sebelum submit.
                    </p>
                  </div>
                </div>
              )}
            </div>

          {/* Sidebar */}
          {showSidebar && (
            <div className="hidden lg:block w-72 border-l bg-muted/30">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-4">
                  
                  {/* Stats */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold">Statistik</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <Card>
                        <CardContent className="p-3">
                          <p className="text-xl font-bold text-primary">{answeredCount}</p>
                          <p className="text-[10px] text-muted-foreground">Terjawab</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-3">
                          <p className="text-xl font-bold">{totalQuestions - answeredCount}</p>
                          <p className="text-[10px] text-muted-foreground">Belum</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-3">
                          <p className="text-xl font-bold text-yellow-600 dark:text-yellow-500">{markedCount}</p>
                          <p className="text-[10px] text-muted-foreground">Ditandai</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-3">
                          <p className="text-xl font-bold text-green-600 dark:text-green-500">
                            {Math.round((answeredCount/totalQuestions)*100)}%
                          </p>
                          <p className="text-[10px] text-muted-foreground">Progress</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <Separator />

                  {/* Connection Status */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold">Status Koneksi</h3>
                    <Card className={cn(isOnline ? "border-green-500" : "border-yellow-500")}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-muted-foreground">Internet</span>
                          <Badge variant={isOnline ? "secondary" : "outline"} className="text-xs">
                            {isOnline ? "Online" : "Offline"}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
                          {isOnline 
                            ? "Koneksi normal" 
                            : "Jawaban tersimpan di browser"}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <Separator />

                  {/* Question Grid */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold">Navigasi Soal</h3>
                    <div className="grid grid-cols-5 gap-1.5">
                      {shuffledQuestions.map((q: any, i: number) => {
                        const isAnswered = !!answers[q.id];
                        const isMarked = markedQuestions.has(i);
                        const isCurrent = i === currentQuestionIndex;

                        return (
                          <button
                            key={i}
                            onClick={() => setCurrentQuestionIndex(i)}
                            className={cn(
                              "aspect-square rounded text-xs font-semibold transition-all relative",
                              isCurrent && "ring-2 ring-primary ring-offset-1 ring-offset-background",
                              isAnswered && !isCurrent && "bg-primary text-primary-foreground hover:bg-primary/90",
                              !isAnswered && !isCurrent && "bg-muted hover:bg-muted/80",
                              isCurrent && isAnswered && "bg-primary text-primary-foreground",
                              isCurrent && !isAnswered && "border-2 border-primary"
                            )}
                          >
                            {i + 1}
                            {isMarked && (
                              <div className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-yellow-500 rounded-full border border-background" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <Separator />

                  {/* Legend */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold">Keterangan</h3>
                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-5 rounded bg-primary" />
                        <span className="text-muted-foreground">Sudah Dijawab</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-5 rounded bg-muted" />
                        <span className="text-muted-foreground">Belum Dijawab</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-5 rounded border-2 border-primary relative">
                          <div className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-yellow-500 rounded-full border border-background" />
                        </div>
                        <span className="text-muted-foreground">Ditandai</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-5 rounded border-2 border-primary" />
                        <span className="text-muted-foreground">Soal Aktif</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Submit Button */}
                  <Button
                    onClick={confirmSubmit}
                    disabled={isSubmitting || !isOnline}
                    size="sm"
                    className="w-full gap-1.5 h-9"
                    variant={allAnswered ? "default" : "secondary"}
                  >
                    {isSubmitting ? (
                      <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Mengirim...</>
                    ) : !isOnline ? (
                      <>Offline - Tidak Bisa Submit</>
                    ) : (
                      <>Selesai Ujian <Send className="h-3.5 w-3.5" /></>
                    )}
                  </Button>
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </div>

      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Konfirmasi Submit Ujian</DialogTitle>
            <DialogDescription className="text-sm">
              Apakah Anda yakin ingin mengirim jawaban ujian?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Total Soal</p>
                <p className="text-xl font-bold">{totalQuestions}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Terjawab</p>
                <p className="text-xl font-bold text-primary">{answeredCount}</p>
              </div>
            </div>

            {!isOnline && (
              <div className="flex items-start gap-2 rounded-md border border-yellow-500/50 bg-yellow-500/10 p-2.5 text-yellow-900 dark:text-yellow-500">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  Koneksi internet terputus. Silakan tunggu hingga koneksi kembali untuk submit.
                </p>
              </div>
            )}

            {!allAnswered && (
              <div className="flex items-start gap-2 rounded-md border border-yellow-500/50 bg-yellow-500/10 p-2.5 text-yellow-900 dark:text-yellow-500">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  Masih ada {totalQuestions - answeredCount} soal yang belum dijawab. Soal yang tidak dijawab akan dianggap salah.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setShowSubmitDialog(false)}>
              Batal
            </Button>
            <Button size="sm" onClick={() => handleSubmit(false)} disabled={isSubmitting || !isOnline}>
              {isSubmitting ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> Mengirim...</>
              ) : !isOnline ? (
                <>Offline - Tidak Bisa Submit</>
              ) : (
                <>Ya, Submit Sekarang</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Exit Confirmation Dialog */}
      <Dialog open={showExitModal} onOpenChange={setShowExitModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Yakin ingin keluar dari test?</DialogTitle>
            <DialogDescription className="text-sm text-foreground">
              Percobaan ini akan tetap dihitung meskipun kamu keluar sekarang.<br/>
              Jawaban yang sudah diisi akan tersimpan sesuai progress terakhir.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button variant="outline" size="sm" onClick={() => handleSubmit(true)} disabled={isSubmitting}>
              Keluar
            </Button>
            <Button size="sm" onClick={() => setShowExitModal(false)} disabled={isSubmitting}>
              Lanjutkan Test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
