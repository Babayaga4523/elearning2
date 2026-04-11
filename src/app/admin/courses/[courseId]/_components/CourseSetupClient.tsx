"use client";

import {
  Course,
  Module,
  Test,
  Question,
  Option,
} from "@prisma/client";
import {
  PlusCircle,
  GripVertical,
  Pencil,
  Trash,
  BookOpen,
  GraduationCap,
  Clock,
  Trophy,
  FileVideo,
  FileText,
  LayoutDashboard,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  Target,
  Layers,
  Eye,
  EyeOff,
  ArrowUpDown,
  Sparkles,
  Info,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ModuleFormModal } from "./ModuleFormModal";
import { ConfirmDraftDialog } from "@/components/admin/ConfirmDraftDialog";
import { deleteModule } from "../actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CourseSetupClientProps {
  course: Course;
  modules: Module[];
  preTest: (Test & { questions: (Question & { options: Option[] })[] }) | null;
  postTest: (Test & { questions: (Question & { options: Option[] })[] }) | null;
}

export const CourseSetupClient = ({
  course,
  modules,
  preTest,
  postTest,
}: CourseSetupClientProps) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showDraftConfirm, setShowDraftConfirm] = useState(false);
  const [moduleToDelete, setModuleToDelete] = useState<string | null>(null);

  const onDeleteModule = async (moduleId: string) => {
    if (course.isPublished) {
      setModuleToDelete(moduleId);
      setShowDraftConfirm(true);
      return;
    }
    executeDelete(moduleId);
  };

  const executeDelete = async (moduleId: string) => {
    try {
      setIsDeleting(moduleId);
      const result = await deleteModule(course.id, moduleId);
      if (result.success) {
        toast.success(
          result.statusReverted
            ? "Kursus ditarik ke Draft & Modul dihapus"
            : "Modul berhasil dihapus"
        );
        router.refresh();
      } else {
        toast.error("Gagal menghapus modul");
      }
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setIsDeleting(null);
      setShowDraftConfirm(false);
      setModuleToDelete(null);
    }
  };

  const publishedModules = modules.filter((m: any) => m.isPublished).length;
  const draftModules = modules.length - publishedModules;
  const hasPreTest = !!preTest;
  const hasPostTest = !!postTest;
  const isReadyToPublish =
    modules.length > 0 && hasPreTest && hasPostTest;

  // ── Readiness checklist items
  const checklist = [
    { label: "Minimal 1 modul ditambahkan", done: modules.length > 0 },
    { label: "Pre-Test dikonfigurasi", done: hasPreTest },
    { label: "Post-Test dikonfigurasi", done: hasPostTest },
    { label: "Semua modul dipublikasikan", done: draftModules === 0 && modules.length > 0 },
  ];

  return (
    <div
      className="w-full min-w-0 space-y-0"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* ══════════════════════════════════════════
          READINESS BANNER
      ══════════════════════════════════════════ */}
      <div
        className="relative mb-7 overflow-hidden rounded-3xl"
        style={{
          background: isReadyToPublish
            ? "linear-gradient(135deg, #064E3B 0%, #065F46 100%)"
            : "linear-gradient(135deg, #0F1C3F 0%, #1A2E5A 100%)",
        }}
      >
        {/* Grid texture */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg,#fff 0px,transparent 1px,transparent 40px,#fff 41px),repeating-linear-gradient(90deg,#fff 0px,transparent 1px,transparent 40px,#fff 41px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-6 justify-between">
          {/* Left: status */}
          <div className="flex items-center gap-4">
            <div
              className="h-12 w-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{
                background: isReadyToPublish
                  ? "rgba(52,211,153,0.15)"
                  : "rgba(232,160,32,0.15)",
                border: `1px solid ${isReadyToPublish ? "rgba(52,211,153,0.3)" : "rgba(232,160,32,0.3)"}`,
              }}
            >
              {isReadyToPublish ? (
                <Sparkles className="h-6 w-6" style={{ color: "#34D399" }} />
              ) : (
                <Info className="h-6 w-6" style={{ color: "#E8A020" }} />
              )}
            </div>
            <div>
              <p
                className="text-[10px] font-black uppercase tracking-[0.2em] mb-1"
                style={{ color: isReadyToPublish ? "rgba(52,211,153,0.6)" : "rgba(232,160,32,0.6)" }}
              >
                {isReadyToPublish ? "Siap Dipublikasikan" : "Perlu Dilengkapi"}
              </p>
              <p
                className="font-black text-white text-base"
                style={{ fontFamily: "'Lexend Deca', sans-serif" }}
              >
                {isReadyToPublish
                  ? "Semua komponen kursus sudah lengkap."
                  : "Lengkapi komponen kursus sebelum publikasi."}
              </p>
            </div>
          </div>

          {/* Right: mini checklist */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 shrink-0">
            {checklist.map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <div
                  className="h-4 w-4 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: item.done ? "rgba(52,211,153,0.2)" : "rgba(255,255,255,0.08)",
                    border: `1px solid ${item.done ? "rgba(52,211,153,0.4)" : "rgba(255,255,255,0.12)"}`,
                  }}
                >
                  {item.done && (
                    <CheckCircle2 className="h-2.5 w-2.5" style={{ color: "#34D399" }} />
                  )}
                </div>
                <span
                  className="text-[10px] font-bold"
                  style={{ color: item.done ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.3)" }}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-7">

        {/* ══════════════════════════════════════════
            LEFT COLUMN — MODULES (2/3 width)
        ══════════════════════════════════════════ */}
        <div className="xl:col-span-2 space-y-4">

          {/* Section header */}
          <div
            className="flex items-center justify-between p-5 rounded-2xl"
            style={{
              background: "white",
              border: "1px solid #E2E6F0",
              boxShadow: "0 1px 4px rgba(15,28,63,0.05)",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center"
                style={{ background: "#F0FDF4", color: "#059669" }}
              >
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <h2
                  className="text-base font-black leading-none"
                  style={{ color: "#0F1C3F", fontFamily: "'Lexend Deca', sans-serif" }}
                >
                  Modul Pembelajaran
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className="text-[10px] font-black uppercase tracking-widest"
                    style={{ color: "#9AAABF" }}
                  >
                    {modules.length} Total
                  </span>
                  {publishedModules > 0 && (
                    <>
                      <span style={{ color: "#D6DBE8" }}>·</span>
                      <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: "#10B981" }}>
                        {publishedModules} Aktif
                      </span>
                    </>
                  )}
                  {draftModules > 0 && (
                    <>
                      <span style={{ color: "#D6DBE8" }}>·</span>
                      <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: "#E8A020" }}>
                        {draftModules} Draft
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <ModuleFormModal>
              <button
                className="flex items-center gap-2 h-10 px-5 rounded-xl font-black text-xs uppercase tracking-wider transition-all hover:brightness-110 active:scale-[0.97]"
                style={{
                  background: "linear-gradient(135deg, #0F1C3F, #1A3060)",
                  color: "white",
                  boxShadow: "0 2px 12px rgba(15,28,63,0.2)",
                }}
              >
                <PlusCircle className="h-4 w-4" style={{ color: "#E8A020" }} />
                Tambah Modul
              </button>
            </ModuleFormModal>
          </div>

          {/* Module list */}
          {modules.length > 0 ? (
            <div className="space-y-2.5">
              {modules.map((module: any, index: number) => (
                <ModuleRow
                  key={module.id}
                  module={module}
                  index={index}
                  courseId={course.id}
                  isDeleting={isDeleting === module.id}
                  onDelete={() => onDeleteModule(module.id)}
                />
              ))}
            </div>
          ) : (
            <ModuleEmptyState />
          )}
        </div>

        {/* ══════════════════════════════════════════
            RIGHT COLUMN — TESTS (1/3 width)
        ══════════════════════════════════════════ */}
        <div className="space-y-4">
          {/* Section header */}
          <div
            className="flex items-center gap-3 p-5 rounded-2xl"
            style={{
              background: "white",
              border: "1px solid #E2E6F0",
              boxShadow: "0 1px 4px rgba(15,28,63,0.05)",
            }}
          >
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center"
              style={{ background: "#FFF8E7", color: "#E8A020" }}
            >
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <h2
                className="text-base font-black leading-none"
                style={{ color: "#0F1C3F", fontFamily: "'Lexend Deca', sans-serif" }}
              >
                Evaluasi Belajar
              </h2>
              <p className="text-[10px] font-black uppercase tracking-widest mt-1" style={{ color: "#9AAABF" }}>
                {[hasPreTest, hasPostTest].filter(Boolean).length}/2 Dikonfigurasi
              </p>
            </div>
          </div>

          {/* Pre-Test */}
          <TestCard
            icon={<LayoutDashboard className="h-5 w-5" />}
            label="Pre-Test"
            sublabel="Tes Awal Kompetensi"
            badge="Wajib"
            test={preTest}
            href={`/admin/courses/${course.id}/tests/${preTest?.id || "new"}?type=PRE`}
            accentColor="#6366F1"
            accentBg="#EEF2FF"
            accentBorder="#C7D2FE"
          />

          {/* Post-Test */}
          <TestCard
            icon={<Trophy className="h-5 w-5" />}
            label="Post-Test"
            sublabel="Ujian Akhir Kursus"
            badge="Sertifikasi"
            test={postTest}
            href={`/admin/courses/${course.id}/tests/${postTest?.id || "new"}?type=POST`}
            accentColor="#E8A020"
            accentBg="#FFF8E7"
            accentBorder="#F6CE72"
          />

          {/* Module quick-stats */}
          {modules.length > 0 && (
            <div
              className="rounded-2xl p-5 space-y-3"
              style={{
                background: "white",
                border: "1px solid #E2E6F0",
                boxShadow: "0 1px 4px rgba(15,28,63,0.05)",
              }}
            >
              <p
                className="text-[10px] font-black uppercase tracking-widest"
                style={{ color: "#9AAABF" }}
              >
                Ringkasan Modul
              </p>
              {[
                {
                  label: "Video",
                  count: modules.filter((m: any) => m.type === "VIDEO").length,
                  color: "#EF4444",
                  bg: "#FFF0F0",
                  icon: <FileVideo className="h-3.5 w-3.5" />,
                },
                {
                  label: "Dokumen PDF",
                  count: modules.filter((m: any) => m.type !== "VIDEO").length,
                  color: "#0EA5E9",
                  bg: "#F0F9FF",
                  icon: <FileText className="h-3.5 w-3.5" />,
                },
                {
                  label: "Total Durasi",
                  count:
                    modules.reduce((s: number, m: any) => s + (m.duration || 0), 0) + " menit",
                  color: "#10B981",
                  bg: "#F0FDF4",
                  icon: <Clock className="h-3.5 w-3.5" />,
                },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-6 w-6 rounded-lg flex items-center justify-center"
                      style={{ background: s.bg, color: s.color }}
                    >
                      {s.icon}
                    </div>
                    <span className="text-xs font-bold" style={{ color: "#64748B" }}>
                      {s.label}
                    </span>
                  </div>
                  <span className="text-xs font-black" style={{ color: "#0F1C3F" }}>
                    {s.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDraftDialog
        isOpen={showDraftConfirm}
        onClose={() => setShowDraftConfirm(false)}
        onConfirm={() => moduleToDelete && executeDelete(moduleToDelete)}
        warningDetails={[
          "Menghapus modul ini mungkin membuat kurikulum tidak memenuhi syarat publikasi.",
          "Kursus akan ditarik ke Draft untuk menghindari ketidakkonsistenan materi bagi peserta.",
        ]}
      />
    </div>
  );
};

// ─── ModuleRow ─────────────────────────────────────────────────────────────────

function ModuleRow({
  module,
  index,
  courseId,
  isDeleting,
  onDelete,
}: {
  module: any;
  index: number;
  courseId: string;
  isDeleting: boolean;
  onDelete: () => void;
}) {
  return (
    <div
      className="group rounded-2xl transition-all duration-200 hover:-translate-y-px hover:shadow-md"
      style={{
        background: "white",
        border: "1px solid #E2E6F0",
        boxShadow: "0 1px 3px rgba(15,28,63,0.04)",
      }}
    >
      <div className="flex items-center gap-3 p-4">
        {/* Drag handle */}
        <ArrowUpDown
          className="h-4 w-4 shrink-0 cursor-grab opacity-30 group-hover:opacity-60 transition-opacity"
          style={{ color: "#0F1C3F" }}
        />

        {/* Step number */}
        <div
          className="h-7 w-7 rounded-xl flex items-center justify-center shrink-0 font-black text-xs"
          style={{
            background: module.isPublished ? "#0F1C3F" : "#F0F2F7",
            color: module.isPublished ? "#E8A020" : "#B0BAD0",
          }}
        >
          {String(index + 1).padStart(2, "0")}
        </div>

        {/* Type icon */}
        <div
          className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: module.type === "VIDEO" ? "#FFF0F0" : "#F0F9FF",
            color: module.type === "VIDEO" ? "#EF4444" : "#0EA5E9",
          }}
        >
          {module.type === "VIDEO" ? (
            <FileVideo className="h-4 w-4" />
          ) : (
            <FileText className="h-4 w-4" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p
              className="text-sm font-black truncate"
              style={{ color: "#0F1C3F" }}
            >
              {module.title}
            </p>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className="flex items-center gap-1 text-[10px] font-bold"
              style={{ color: "#B0BAD0" }}
            >
              <Clock className="h-3 w-3" />
              {module.duration || 0}m
            </span>
            <span style={{ color: "#E2E6F0" }}>·</span>
            <span
              className="text-[10px] font-black"
              style={{ color: module.isPublished ? "#10B981" : "#94A3B8" }}
            >
              {module.isPublished ? "● Aktif" : "○ Draft"}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-all">
          <ModuleFormModal initialData={module}>
            <button
              className="h-8 w-8 rounded-xl flex items-center justify-center transition-all hover:brightness-95"
              style={{ background: "#EEF2FF", color: "#6366F1" }}
              title="Edit modul"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          </ModuleFormModal>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="h-8 w-8 rounded-xl flex items-center justify-center transition-all hover:brightness-95"
                style={{ background: "#F8FAFC", color: "#94A3B8", border: "1px solid #E2E6F0" }}
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="rounded-2xl p-1.5 shadow-xl"
              style={{
                background: "white",
                border: "1px solid #E2E6F0",
                minWidth: "160px",
                boxShadow: "0 8px 32px rgba(15,28,63,0.12)",
              }}
            >
              <DropdownMenuItem asChild>
                <Link
                  href={`/admin/courses/${courseId}/modules/${module.id}`}
                  className="flex items-center gap-2.5 cursor-pointer rounded-xl px-3 py-2.5 font-bold text-sm transition-all"
                  style={{ color: "#0F1C3F" }}
                >
                  <Eye className="h-3.5 w-3.5" />
                  Lihat Modul
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator style={{ background: "#F0F2F7" }} />
              <DropdownMenuItem
                className="flex items-center gap-2.5 cursor-pointer rounded-xl px-3 py-2.5 font-black text-sm focus:bg-red-50"
                style={{ color: "#EF4444" }}
                onClick={onDelete}
                disabled={isDeleting}
              >
                <Trash className="h-3.5 w-3.5" />
                {isDeleting ? "Menghapus..." : "Hapus Modul"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

// ─── ModuleEmptyState ──────────────────────────────────────────────────────────

function ModuleEmptyState() {
  return (
    <div
      className="flex flex-col items-center justify-center py-14 rounded-2xl text-center"
      style={{ background: "white", border: "2px dashed #D6DBE8" }}
    >
      <div
        className="h-14 w-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: "#F0F2F7" }}
      >
        <Layers className="h-6 w-6" style={{ color: "#C5CEDF" }} />
      </div>
      <p className="font-black text-sm mb-1" style={{ color: "#0F1C3F" }}>
        Kurikulum masih kosong
      </p>
      <p className="text-xs font-medium mb-5" style={{ color: "#9AAABF" }}>
        Tambahkan modul untuk mulai menyusun materi.
      </p>
      <ModuleFormModal>
        <button
          className="flex items-center gap-2 h-9 px-5 rounded-xl font-black text-xs uppercase tracking-wider transition-all hover:brightness-110"
          style={{
            background: "linear-gradient(135deg, #0F1C3F, #1A3060)",
            color: "white",
            boxShadow: "0 2px 12px rgba(15,28,63,0.2)",
          }}
        >
          <PlusCircle className="h-3.5 w-3.5" style={{ color: "#E8A020" }} />
          Tambah Modul Pertama
        </button>
      </ModuleFormModal>
    </div>
  );
}

// ─── TestCard ─────────────────────────────────────────────────────────────────

function TestCard({
  icon,
  label,
  sublabel,
  badge,
  test,
  href,
  accentColor,
  accentBg,
  accentBorder,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  badge: string;
  test: any;
  href: string;
  accentColor: string;
  accentBg: string;
  accentBorder: string;
}) {
  const hasTest = !!test;
  const questionCount = test?.questions?.length ?? 0;

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all hover:-translate-y-px hover:shadow-md group"
      style={{
        background: "white",
        border: "1px solid #E2E6F0",
        boxShadow: "0 1px 3px rgba(15,28,63,0.04)",
      }}
    >
      {/* Top accent stripe */}
      <div
        className="h-1"
        style={{ background: `linear-gradient(90deg, ${accentColor}, ${accentColor}55)` }}
      />

      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center"
              style={{ background: accentBg, color: accentColor, border: `1px solid ${accentBorder}` }}
            >
              {icon}
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: "#B0BAD0" }}>
                {sublabel}
              </p>
              <h3
                className="font-black leading-none"
                style={{ color: "#0F1C3F", fontFamily: "'Lexend Deca', sans-serif" }}
              >
                {label}
              </h3>
            </div>
          </div>
          <span
            className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg"
            style={{ background: accentBg, color: accentColor, border: `1px solid ${accentBorder}` }}
          >
            {badge}
          </span>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Durasi", value: `${test?.duration ?? 0}m` },
            { label: "Min Score", value: `${test?.passingScore ?? 0}%` },
            { label: "Soal", value: `${questionCount}` },
          ].map((s) => (
            <div
              key={s.label}
              className="text-center py-2 rounded-xl"
              style={{ background: "#F8FAFC", border: "1px solid #EEF0F6" }}
            >
              <p className="text-sm font-black leading-none" style={{ color: "#0F1C3F" }}>
                {s.value}
              </p>
              <p className="text-[9px] font-bold mt-0.5" style={{ color: "#B0BAD0" }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* Status */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{
            background: hasTest ? "#F0FDF4" : "#FFF8E7",
            border: `1px solid ${hasTest ? "#BBF7D0" : "#F6CE72"}`,
          }}
        >
          {hasTest ? (
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" style={{ color: "#059669" }} />
          ) : (
            <AlertCircle className="h-3.5 w-3.5 shrink-0" style={{ color: "#E8A020" }} />
          )}
          <p className="text-[11px] font-bold" style={{ color: hasTest ? "#059669" : "#B07D0C" }}>
            {hasTest ? `${questionCount} soal tersedia` : "Belum dikonfigurasi"}
          </p>
        </div>

        {/* CTA */}
        <Link href={href} className="block">
          <button
            className="w-full h-10 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.98]"
            style={{
              background: hasTest ? accentBg : accentColor,
              color: hasTest ? accentColor : "white",
              border: hasTest ? `1.5px solid ${accentBorder}` : "none",
              boxShadow: hasTest ? "none" : `0 2px 10px ${accentColor}40`,
            }}
          >
            {hasTest ? (
              <><Pencil className="h-3.5 w-3.5" /> Edit {label}</>
            ) : (
              <><PlusCircle className="h-3.5 w-3.5" /> Setup {label}</>
            )}
          </button>
        </Link>
      </div>
    </div>
  );
}