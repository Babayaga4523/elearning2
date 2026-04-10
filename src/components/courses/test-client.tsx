"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Send,
  X,
  BookOpen,
  Eye,
  EyeOff,
  Shield,
  Flag,
  SkipForward,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type Option = {
  id: string;
  text: string;
};

type Question = {
  id: string;
  text: string;
  options: Option[];
  position?: number;
};

type Test = {
  id: string;
  title: string;
  type: "PRE" | "POST";
  duration: number; // in minutes
  passingScore: number | null;
  maxAttempts: number;
  questions: Question[];
};

type Props = {
  test: Test;
  courseId: string;
  attemptNumber: number;
  maxAttempts: number;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const WARN_SECONDS = 120; // show red timer at 2 min
const MAX_VIOLATIONS = 3;
const VIOLATION_LABELS = ["Peringatan Pertama", "Peringatan Kedua", "Terakhir — Ujian Akan Dikumpulkan"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function getTimerColor(secs: number, total: number): string {
  const ratio = secs / total;
  if (secs <= WARN_SECONDS) return "#EF4444";
  if (ratio < 0.3) return "#F59E0B";
  return "#E8A020";
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TestClient({
  test,
  courseId,
  attemptNumber,
  maxAttempts,
}: Props) {
  const router = useRouter();
  const totalSeconds = test.duration * 60;

  // ── State ──
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [violations, setViolations] = useState(0);
  const [showViolationBanner, setShowViolationBanner] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const submitCalledRef = useRef(false);

  const questions = test.questions;
  const currentQ = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const unansweredCount = questions.length - answeredCount;
  const progressPct = Math.round((answeredCount / questions.length) * 100);

  // ── Submit Logic ──────────────────────────────────────────────────────────

  const submitTest = useCallback(
    async (force = false) => {
      if (submitCalledRef.current) return;
      submitCalledRef.current = true;
      setIsSubmitting(true);

      try {
        const payload = {
          testId: test.id,
          answers: Object.entries(answers).map(([questionId, optionId]) => ({
            questionId,
            optionId,
          })),
          forceSubmit: force,
        };

        const res = await axios.post(
          `/api/courses/${courseId}/tests/${test.id}/submit`,
          payload
        );

        const { attemptId } = res.data;
        router.push(
          `/courses/${courseId}/tests/${test.id}/result?attemptId=${attemptId}`
        );
      } catch (err: any) {
        submitCalledRef.current = false;
        setIsSubmitting(false);
        const errorMsg = err?.response?.data || err?.message || "Gagal mengumpulkan ujian. Coba lagi.";
        toast.error(typeof errorMsg === 'string' ? errorMsg : "Gagal mengumpulkan ujian.");
      }
    },
    [answers, test.id, courseId, router]
  );

  // ── Timer ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!hasStarted) return;
    if (timeLeft <= 0) {
      submitTest(true);
      return;
    }
    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [hasStarted, timeLeft, submitTest]);

  // ── Anti-Cheat: Tab / Visibility ──────────────────────────────────────────

  useEffect(() => {
    if (!hasStarted) return;

    const handleVisibilityChange = () => {
      if (document.hidden) triggerViolation();
    };
    const handleBlur = () => triggerViolation();
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("contextmenu", handleContextMenu);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasStarted]);

  function triggerViolation() {
    setViolations((prev) => {
      const next = prev + 1;
      setShowViolationBanner(true);
      setTimeout(() => setShowViolationBanner(false), 5000);
      if (next >= MAX_VIOLATIONS) {
        setTimeout(() => submitTest(true), 1500);
      }
      return next;
    });
  }

  // ── Keyboard Shortcuts ─────────────────────────────────────────────────────

  useEffect(() => {
    if (!hasStarted) return;

    const handler = (e: KeyboardEvent) => {
      // 1-4 → select option
      if (["1", "2", "3", "4"].includes(e.key)) {
        const idx = parseInt(e.key) - 1;
        const opt = currentQ?.options[idx];
        if (opt) selectAnswer(currentQ.id, opt.id);
      }
      // ArrowRight / n → next
      if (e.key === "ArrowRight" || e.key === "n") goNext();
      // ArrowLeft / p → prev
      if (e.key === "ArrowLeft" || e.key === "p") goPrev();
      // f → flag/unflag
      if (e.key === "f") toggleFlag(currentIndex);
      // Enter → submit if last
      if (e.key === "Enter" && currentIndex === questions.length - 1) {
        setShowSubmitModal(true);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasStarted, currentIndex, currentQ]);

  // ── Answer & Navigation ───────────────────────────────────────────────────

  function selectAnswer(questionId: string, optionId: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  }

  function toggleFlag(idx: number) {
    setFlagged((prev) => {
      const s = new Set(prev);
      if (s.has(idx)) {
        s.delete(idx);
      } else {
        s.add(idx);
      }
      return s;
    });
  }

  function goNext() {
    if (currentIndex < questions.length - 1) setCurrentIndex((i) => i + 1);
  }

  function goPrev() {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  }

  // ── Question Status ───────────────────────────────────────────────────────

  function getQStatus(idx: number): "answered" | "flagged" | "current" | "empty" {
    if (idx === currentIndex) return "current";
    if (answers[questions[idx]?.id]) return "answered";
    if (flagged.has(idx)) return "flagged";
    return "empty";
  }

  const timerColor = getTimerColor(timeLeft, totalSeconds);
  const isTimerWarning = timeLeft <= WARN_SECONDS;

  // ─────────────────────────────────────────────────────────────────────────
  // ── START SCREEN ─────────────────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────────────────

  if (!hasStarted) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: "#0F1C3F", fontFamily: "'DM Sans', sans-serif" }}
      >
        {/* Background pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, #fff 0px, transparent 1px, transparent 24px, #fff 25px), repeating-linear-gradient(-45deg, #fff 0px, transparent 1px, transparent 24px, #fff 25px)",
            backgroundSize: "35px 35px",
          }}
        />

        <div
          className="relative max-w-lg w-full rounded-3xl overflow-hidden shadow-2xl"
          style={{ background: "#fff" }}
        >
          {/* Gold top stripe */}
          <div className="h-2 w-full" style={{ background: "linear-gradient(90deg, #E8A020, #F5C842)" }} />

          <div className="p-10 space-y-8">
            {/* Badge */}
            <div className="flex items-center gap-3">
              <span
                className="text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full"
                style={{ background: test.type === "PRE" ? "#EEF2FF" : "#FFF8E7", color: test.type === "PRE" ? "#3B52A4" : "#B07D0C" }}
              >
                {test.type === "PRE" ? "Pre-Test" : "Post-Test"}
              </span>
              {maxAttempts > 0 && (
                <span className="text-[11px] font-bold" style={{ color: "#94A3B8" }}>
                  Percobaan {attemptNumber}/{maxAttempts}
                </span>
              )}
            </div>

            <div>
              <h1
                className="text-2xl font-black mb-3 leading-tight"
                style={{ color: "#0F1C3F", fontFamily: "'Lexend Deca', sans-serif" }}
              >
                {test.title}
              </h1>
              <p className="text-sm font-medium" style={{ color: "#64748B" }}>
                Baca instruksi dengan seksama sebelum memulai ujian.
              </p>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Total Soal", value: `${questions.length} Pertanyaan`, icon: "📝" },
                { label: "Durasi", value: `${test.duration} Menit`, icon: "⏱" },
                { label: "Skor Lulus", value: test.passingScore ? `${test.passingScore}%` : "—", icon: "🎯" },
                { label: "Batas Coba", value: maxAttempts === 0 ? "Tidak Terbatas" : `${maxAttempts}×`, icon: "🔄" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="p-4 rounded-2xl"
                  style={{ background: "#F8FAFC", border: "1px solid #E8ECF5" }}
                >
                  <p className="text-lg mb-1">{item.icon}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest mb-0.5" style={{ color: "#94A3B8" }}>
                    {item.label}
                  </p>
                  <p className="text-sm font-black" style={{ color: "#0F1C3F" }}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Rules */}
            <div className="rounded-2xl p-4 space-y-2" style={{ background: "#FFF8E7", border: "1px solid #F6CE72" }}>
              <p className="text-[11px] font-black uppercase tracking-widest mb-2" style={{ color: "#B07D0C" }}>
                ⚠ Peraturan Ujian
              </p>
              {[
                "Jangan berpindah tab atau minimize browser",
                `Maksimal ${MAX_VIOLATIONS}× pelanggaran, ujian otomatis dikumpulkan`,
                "Ujian dikumpulkan otomatis saat waktu habis",
                "Tidak diperbolehkan klik kanan selama ujian berlangsung",
              ].map((rule, i) => (
                <p key={i} className="text-xs font-medium flex items-start gap-2" style={{ color: "#92650A" }}>
                  <span className="mt-0.5 shrink-0">•</span>
                  {rule}
                </p>
              ))}
            </div>

            <button
              onClick={() => setHasStarted(true)}
              className="w-full h-14 rounded-2xl font-black text-base flex items-center justify-center gap-3 transition-all hover:brightness-110 active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, #0F1C3F 0%, #1A3060 100%)",
                color: "white",
                boxShadow: "0 4px 24px rgba(15,28,63,0.3)",
              }}
            >
              <Shield className="h-5 w-5" style={{ color: "#E8A020" }} />
              MULAI UJIAN SEKARANG
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ── EXAM SCREEN ───────────────────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen flex flex-col select-none"
      style={{ background: "#F0F2F7", fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* ── Violation Banner ── */}
      {showViolationBanner && (
        <div
          className="fixed top-0 inset-x-0 z-[100] flex items-center justify-center gap-3 py-3 text-sm font-black animate-pulse"
          style={{ background: "#EF4444", color: "white" }}
        >
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>
            PELANGGARAN {violations}/{MAX_VIOLATIONS} —{" "}
            {VIOLATION_LABELS[(violations - 1) % VIOLATION_LABELS.length]}
          </span>
          {violations >= MAX_VIOLATIONS && (
            <span className="ml-2 opacity-80">Mengumpulkan ujian...</span>
          )}
        </div>
      )}

      {/* ── Top Header Bar ── */}
      <header
        className="sticky top-0 z-50 flex items-center gap-4 px-4 md:px-6 h-16 shrink-0"
        style={{
          background: "#0F1C3F",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          boxShadow: "0 2px 20px rgba(0,0,0,0.3)",
        }}
      >
        {/* Left: Test Info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(232,160,32,0.15)", border: "1px solid rgba(232,160,32,0.3)" }}
          >
            <BookOpen className="h-4 w-4" style={{ color: "#E8A020" }} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 leading-none mb-0.5">
              {test.type === "PRE" ? "Pre-Test" : "Post-Test"}
            </p>
            <p className="text-sm font-black text-white truncate leading-none">
              {test.title}
            </p>
          </div>
        </div>

        {/* Center: Progress */}
        <div className="hidden md:flex flex-col items-center gap-1 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
              {answeredCount}/{questions.length} Dijawab
            </span>
          </div>
          <div className="w-48 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progressPct}%`,
                background: "linear-gradient(90deg, #E8A020, #F5C842)",
              }}
            />
          </div>
        </div>

        {/* Right: Timer + Controls */}
        <div className="flex items-center gap-3 flex-1 justify-end">
          {/* Violation Indicator */}
          {violations > 0 && (
            <div
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black"
              style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#FC8181" }}
            >
              <Shield className="h-3.5 w-3.5" />
              {violations}/{MAX_VIOLATIONS}
            </div>
          )}

          {/* Sidebar Toggle */}
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="hidden md:flex h-9 w-9 rounded-xl items-center justify-center transition-all hover:brightness-125"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
            title="Toggle navigasi soal"
          >
            {showSidebar ? (
              <EyeOff className="h-4 w-4 text-slate-400" />
            ) : (
              <Eye className="h-4 w-4 text-slate-400" />
            )}
          </button>

          {/* Timer */}
          <div
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl font-black tabular-nums text-base transition-all",
              isTimerWarning && "animate-pulse"
            )}
            style={{
              background: isTimerWarning ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.06)",
              border: `1px solid ${isTimerWarning ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.08)"}`,
              color: timerColor,
              minWidth: "6rem",
              justifyContent: "center",
            }}
          >
            <Clock className="h-4 w-4 shrink-0" />
            {formatTime(timeLeft)}
          </div>

          {/* Submit Button */}
          <button
            onClick={() => setShowSubmitModal(true)}
            className="hidden sm:flex items-center gap-2 h-10 px-5 rounded-xl font-black text-xs uppercase tracking-wider transition-all hover:brightness-110 active:scale-[0.97]"
            style={{
              background: "linear-gradient(135deg, #E8A020, #F5C842)",
              color: "#0F1C3F",
              boxShadow: "0 2px 12px rgba(232,160,32,0.3)",
            }}
          >
            <Send className="h-3.5 w-3.5" />
            Kumpulkan
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Question Area ── */}
        <main className="flex-1 flex flex-col overflow-y-auto">
          <div className="max-w-3xl w-full mx-auto px-4 md:px-8 py-8 flex flex-col flex-1">

            {/* Question Header */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div
                  className="h-10 w-10 rounded-2xl flex items-center justify-center font-black text-sm"
                  style={{
                    background: answers[currentQ.id]
                      ? "linear-gradient(135deg, #10B981, #059669)"
                      : "linear-gradient(135deg, #0F1C3F, #1A3060)",
                    color: "white",
                    boxShadow: answers[currentQ.id]
                      ? "0 2px 8px rgba(16,185,129,0.3)"
                      : "0 2px 8px rgba(15,28,63,0.2)",
                  }}
                >
                  {answers[currentQ.id] ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    currentIndex + 1
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: "#94A3B8" }}>
                    Soal {currentIndex + 1} dari {questions.length}
                  </p>
                  {flagged.has(currentIndex) && (
                    <p className="text-[10px] font-bold flex items-center gap-1" style={{ color: "#F59E0B" }}>
                      <Flag className="h-3 w-3" /> Ditandai untuk ditinjau
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={() => toggleFlag(currentIndex)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all hover:brightness-110"
                style={{
                  background: flagged.has(currentIndex) ? "#FFF8E7" : "#F0F2F7",
                  border: `1px solid ${flagged.has(currentIndex) ? "#F6CE72" : "#E2E6F0"}`,
                  color: flagged.has(currentIndex) ? "#B07D0C" : "#94A3B8",
                }}
              >
                <Flag className="h-3.5 w-3.5" />
                {flagged.has(currentIndex) ? "Ditandai" : "Tandai"}
              </button>
            </div>

            {/* Question Text */}
            <div
              className="rounded-3xl p-7 mb-6 shadow-sm"
              style={{ background: "white", border: "1px solid #E2E6F0" }}
            >
              <p className="text-lg font-bold leading-relaxed" style={{ color: "#0F1C3F" }}>
                {currentQ.text}
              </p>
            </div>

            {/* Options */}
            <div className="space-y-3 flex-1">
              {currentQ.options.map((option, optIdx) => {
                const isSelected = answers[currentQ.id] === option.id;
                const label = String.fromCharCode(65 + optIdx); // A, B, C, D
                return (
                  <button
                    key={option.id}
                    onClick={() => selectAnswer(currentQ.id, option.id)}
                    className="w-full text-left transition-all duration-200 active:scale-[0.99] group"
                    style={{ outline: "none" }}
                  >
                    <div
                      className="flex items-center gap-4 p-5 rounded-2xl transition-all duration-200"
                      style={{
                        background: isSelected ? "#0F1C3F" : "white",
                        border: isSelected
                          ? "2px solid #E8A020"
                          : "2px solid #E2E6F0",
                        boxShadow: isSelected
                          ? "0 4px 20px rgba(15,28,63,0.2)"
                          : "0 1px 3px rgba(0,0,0,0.04)",
                        transform: isSelected ? "translateY(-1px)" : undefined,
                      }}
                    >
                      {/* Option Label */}
                      <div
                        className="h-9 w-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 transition-all"
                        style={{
                          background: isSelected ? "#E8A020" : "#F0F2F7",
                          color: isSelected ? "#0F1C3F" : "#64748B",
                        }}
                      >
                        {label}
                      </div>

                      {/* Option Text */}
                      <p
                        className="text-sm font-semibold leading-relaxed flex-1"
                        style={{ color: isSelected ? "white" : "#1E293B" }}
                      >
                        {option.text}
                      </p>

                      {/* Check Icon */}
                      {isSelected && (
                        <CheckCircle2 className="h-5 w-5 shrink-0" style={{ color: "#E8A020" }} />
                      )}

                      {/* Keyboard hint */}
                      {!isSelected && (
                        <span
                          className="text-[10px] font-black opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 rounded-lg"
                          style={{ background: "#F0F2F7", color: "#94A3B8" }}
                        >
                          {optIdx + 1}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-8 pt-6" style={{ borderTop: "1px solid #E2E6F0" }}>
              <button
                onClick={goPrev}
                disabled={currentIndex === 0}
                className="flex items-center gap-2 h-11 px-5 rounded-xl font-black text-sm transition-all hover:brightness-105 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: "white",
                  border: "1px solid #D6DBE8",
                  color: "#0F1C3F",
                }}
              >
                <ChevronLeft className="h-4 w-4" />
                Sebelumnya
              </button>

              {/* Skip unanswered */}
              {!answers[currentQ.id] && currentIndex < questions.length - 1 && (
                <button
                  onClick={goNext}
                  className="flex items-center gap-1.5 text-xs font-bold transition-all hover:opacity-70"
                  style={{ color: "#94A3B8" }}
                >
                  <SkipForward className="h-3.5 w-3.5" />
                  Lewati
                </button>
              )}

              {currentIndex < questions.length - 1 ? (
                <button
                  onClick={goNext}
                  className="flex items-center gap-2 h-11 px-5 rounded-xl font-black text-sm transition-all hover:brightness-110 active:scale-[0.97]"
                  style={{
                    background: answers[currentQ.id]
                      ? "linear-gradient(135deg, #0F1C3F, #1A3060)"
                      : "#F0F2F7",
                    color: answers[currentQ.id] ? "white" : "#64748B",
                    border: answers[currentQ.id] ? "none" : "1px solid #D6DBE8",
                    boxShadow: answers[currentQ.id]
                      ? "0 2px 12px rgba(15,28,63,0.2)"
                      : "none",
                  }}
                >
                  Selanjutnya
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="flex items-center gap-2 h-11 px-6 rounded-xl font-black text-sm transition-all hover:brightness-110 active:scale-[0.97]"
                  style={{
                    background: "linear-gradient(135deg, #E8A020, #F5C842)",
                    color: "#0F1C3F",
                    boxShadow: "0 2px 16px rgba(232,160,32,0.3)",
                  }}
                >
                  <Send className="h-4 w-4" />
                  Kumpulkan Ujian
                </button>
              )}
            </div>
          </div>
        </main>

        {/* ── Sidebar: Question Navigator ── */}
        {showSidebar && (
          <aside
            className="hidden md:flex flex-col w-72 shrink-0 overflow-y-auto border-l"
            style={{
              background: "white",
              borderColor: "#E2E6F0",
            }}
          >
            <div className="p-5 space-y-5 flex-1">
              {/* Legend */}
              <div>
                <p
                  className="text-[10px] font-black uppercase tracking-widest mb-3"
                  style={{ color: "#9AAABF" }}
                >
                  Navigasi Soal
                </p>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {[
                    { color: "#0F1C3F", label: "Saat ini" },
                    { color: "#10B981", label: "Dijawab" },
                    { color: "#F59E0B", label: "Ditandai" },
                    { color: "#E2E6F0", label: "Belum" },
                  ].map((l) => (
                    <div key={l.label} className="flex items-center gap-2">
                      <div
                        className="h-4 w-4 rounded-md shrink-0"
                        style={{ background: l.color }}
                      />
                      <span className="text-[10px] font-bold" style={{ color: "#7A8599" }}>
                        {l.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Question Grid */}
                <div className="grid grid-cols-5 gap-1.5">
                  {questions.map((q, idx) => {
                    const status = getQStatus(idx);
                    const bgMap = {
                      current: "#0F1C3F",
                      answered: "#10B981",
                      flagged: "#F59E0B",
                      empty: "#F0F2F7",
                    };
                    const colorMap = {
                      current: "white",
                      answered: "white",
                      flagged: "white",
                      empty: "#9AAABF",
                    };
                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentIndex(idx)}
                        className="h-10 w-full rounded-xl font-black text-xs transition-all hover:brightness-90 active:scale-95 relative"
                        style={{
                          background: bgMap[status],
                          color: colorMap[status],
                          boxShadow:
                            status === "current"
                              ? "0 2px 8px rgba(15,28,63,0.25)"
                              : undefined,
                        }}
                        title={`Soal ${idx + 1}`}
                      >
                        {idx + 1}
                        {flagged.has(idx) && status !== "current" && (
                          <span
                            className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full"
                            style={{ background: "#F59E0B", border: "1.5px solid white" }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Stats */}
              <div className="rounded-2xl p-4 space-y-3" style={{ background: "#F8FAFC", border: "1px solid #E8ECF5" }}>
                <StatLine label="Dijawab" value={`${answeredCount} soal`} color="#10B981" />
                <StatLine label="Belum dijawab" value={`${unansweredCount} soal`} color="#EF4444" />
                <StatLine label="Ditandai" value={`${flagged.size} soal`} color="#F59E0B" />
                {violations > 0 && (
                  <StatLine label="Pelanggaran" value={`${violations}/${MAX_VIOLATIONS}`} color="#EF4444" />
                )}
              </div>

              {/* Keyboard hints */}
              <div className="rounded-2xl p-4" style={{ background: "#F8FAFC", border: "1px solid #E8ECF5" }}>
                <p className="text-[9px] font-black uppercase tracking-widest mb-2" style={{ color: "#9AAABF" }}>
                  Pintasan Keyboard
                </p>
                {[
                  ["1 – 4", "Pilih opsi"],
                  ["← →", "Navigasi soal"],
                  ["F", "Tandai soal"],
                ].map(([key, desc]) => (
                  <div key={key} className="flex justify-between items-center py-1">
                    <span className="text-[10px] font-bold" style={{ color: "#7A8599" }}>{desc}</span>
                    <kbd
                      className="text-[9px] font-black px-1.5 py-0.5 rounded"
                      style={{ background: "#E8ECF5", color: "#0F1C3F" }}
                    >
                      {key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Submit */}
            <div className="p-4 border-t" style={{ borderColor: "#E2E6F0" }}>
              <button
                onClick={() => setShowSubmitModal(true)}
                className="w-full h-12 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.98]"
                style={{
                  background: "linear-gradient(135deg, #E8A020, #F5C842)",
                  color: "#0F1C3F",
                  boxShadow: "0 2px 12px rgba(232,160,32,0.25)",
                }}
              >
                <Send className="h-4 w-4" />
                Kumpulkan Ujian
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* ── Mobile: Bottom Question Nav ── */}
      <div
        className="md:hidden flex items-center gap-2 overflow-x-auto px-4 py-3 shrink-0"
        style={{
          background: "white",
          borderTop: "1px solid #E2E6F0",
          scrollbarWidth: "none",
        }}
      >
        {questions.map((q, idx) => {
          const status = getQStatus(idx);
          const bgMap = {
            current: "#0F1C3F",
            answered: "#10B981",
            flagged: "#F59E0B",
            empty: "#F0F2F7",
          };
          return (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(idx)}
              className="h-9 w-9 shrink-0 rounded-xl font-black text-xs transition-all"
              style={{
                background: bgMap[status],
                color: status === "empty" ? "#9AAABF" : "white",
              }}
            >
              {idx + 1}
            </button>
          );
        })}
        <button
          onClick={() => setShowSubmitModal(true)}
          className="h-9 shrink-0 px-4 rounded-xl font-black text-xs flex items-center gap-1.5 ml-2"
          style={{ background: "#E8A020", color: "#0F1C3F" }}
        >
          <Send className="h-3.5 w-3.5" />
          Kumpul
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          ── SUBMIT MODAL ─────────────────────────────────────────────────── */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Overlay */}
          <div
            className="absolute inset-0"
            style={{ background: "rgba(15,28,63,0.75)", backdropFilter: "blur(4px)" }}
            onClick={() => !isSubmitting && setShowSubmitModal(false)}
          />

          {/* Modal */}
          <div
            className="relative max-w-md w-full rounded-3xl overflow-hidden shadow-2xl"
            style={{ background: "white" }}
          >
            <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, #E8A020, #F5C842)" }} />

            <div className="p-8 space-y-6">
              <div className="flex items-start justify-between">
                <div
                  className="h-12 w-12 rounded-2xl flex items-center justify-center"
                  style={{ background: "#FFF8E7" }}
                >
                  <Send className="h-6 w-6" style={{ color: "#E8A020" }} />
                </div>
                {!isSubmitting && (
                  <button
                    onClick={() => setShowSubmitModal(false)}
                    className="h-8 w-8 rounded-xl flex items-center justify-center transition-all hover:opacity-70"
                    style={{ background: "#F0F2F7" }}
                  >
                    <X className="h-4 w-4" style={{ color: "#64748B" }} />
                  </button>
                )}
              </div>

              <div>
                <h2
                  className="text-xl font-black mb-2"
                  style={{ color: "#0F1C3F", fontFamily: "'Lexend Deca', sans-serif" }}
                >
                  Kumpulkan Ujian?
                </h2>
                <p className="text-sm font-medium" style={{ color: "#64748B" }}>
                  Pastikan semua jawaban sudah sesuai sebelum dikumpulkan. Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-3 gap-3">
                <SummaryCell
                  value={answeredCount}
                  label="Dijawab"
                  color="#10B981"
                />
                <SummaryCell
                  value={unansweredCount}
                  label="Belum"
                  color={unansweredCount > 0 ? "#EF4444" : "#10B981"}
                />
                <SummaryCell
                  value={flagged.size}
                  label="Ditandai"
                  color="#F59E0B"
                />
              </div>

              {unansweredCount > 0 && (
                <div
                  className="flex items-start gap-3 p-3 rounded-2xl"
                  style={{ background: "#FFF5F5", border: "1px solid #FCA5A5" }}
                >
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#EF4444" }} />
                  <p className="text-xs font-bold" style={{ color: "#B91C1C" }}>
                    Masih ada {unansweredCount} soal yang belum dijawab. Soal yang tidak dijawab akan dianggap salah.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => setShowSubmitModal(false)}
                  disabled={isSubmitting}
                  className="h-12 rounded-xl font-black text-sm transition-all hover:opacity-80 disabled:opacity-40"
                  style={{
                    background: "#F0F2F7",
                    border: "1px solid #D6DBE8",
                    color: "#0F1C3F",
                  }}
                >
                  Periksa Lagi
                </button>
                <button
                  onClick={() => submitTest()}
                  disabled={isSubmitting}
                  className="h-12 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.97] disabled:opacity-60"
                  style={{
                    background: "linear-gradient(135deg, #E8A020, #F5C842)",
                    color: "#0F1C3F",
                    boxShadow: "0 2px 16px rgba(232,160,32,0.3)",
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <div
                        className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin"
                      />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Ya, Kumpulkan
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Micro Components ─────────────────────────────────────────────────────────

function StatLine({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-medium" style={{ color: "#7A8599" }}>
        {label}
      </span>
      <span className="text-[11px] font-black" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

function SummaryCell({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color: string;
}) {
  return (
    <div
      className="p-3 rounded-2xl text-center"
      style={{ background: "#F8FAFC", border: "1px solid #E8ECF5" }}
    >
      <p className="text-2xl font-black leading-none mb-1" style={{ color }}>
        {value}
      </p>
      <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: "#94A3B8" }}>
        {label}
      </p>
    </div>
  );
}
