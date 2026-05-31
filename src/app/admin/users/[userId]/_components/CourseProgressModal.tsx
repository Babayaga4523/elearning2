"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle2,
  Clock,
  History,
  Layers,
  FileText,
  Calendar,
  Video,
  FileBadge,
  BarChart3,
  BookOpen,
  ChevronRight,
  Info,
  Loader2,
  Play,
  Eye,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { TestAttemptReview } from "./TestAttemptReview";

interface Module {
  id: string;
  title: string;
  type: "VIDEO" | "PDF";
  isCompleted: boolean;
  completedAt?: string;
  completionRate?: number;
  duration?: number; // seconds for video
  totalPages?: number; // for PDF
  currentPage?: number; // for PDF
}

interface TestAttempt {
  id: string;
  type: string;
  test?: { type: string; passingScore: number };
  score: number | null;
  passed: boolean | null;
  attemptNumber: number;
  startedAt: string;
  completedAt?: string;
  createdAt?: string;
}

interface EnrollmentData {
  id: string;
  courseId: string;
  status: string;
  courseTitle?: string;
  course?: { title?: string };
  enrolledAt?: string | Date;
  createdAt?: string | Date;
  moduleProgress: number;
  completedModulesCount?: number;
  completedModules: number;
  totalModulesCount?: number;
  totalModules: number;
  preScore?: number | null;
  preTestPassed?: boolean | null;
  postScore?: number | null;
  postTestPassed?: boolean | null;
  modules?: Module[];
  testAttempts?: TestAttempt[];
}

interface CourseProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  enrollment: EnrollmentData | null;
}

// Badge component for consistent styling
function StatusBadge({ status }: { status: string }) {
  const config = {
    COMPLETED: {
      bg: "bg-[#ECFDF3]",
      text: "text-[#027A48]",
      border: "border-[#6CE9A6]",
      label: "Selesai",
      dot: "bg-[#12B76A]",
    },
    FAILED: {
      bg: "bg-[#FEF3F2]",
      text: "text-[#B42318]",
      border: "border-[#FDA29B]",
      label: "Gagal",
      dot: "bg-[#F04438]",
    },
    IN_PROGRESS: {
      bg: "bg-[#EFF8FF]",
      text: "text-[#175CD3]",
      border: "border-[#B2DDFF]",
      label: "Berjalan",
      dot: "bg-[#2E90FA]",
    },
    PENDING: {
      bg: "bg-[#FEF3DC]",
      text: "text-[#C4861A]",
      border: "border-[#F5C05A]",
      label: "Menunggu",
      dot: "bg-[#E8A020]",
    },
  };

  const c = config[status as keyof typeof config] || config.PENDING;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border uppercase tracking-wider",
        c.bg,
        c.text,
        c.border
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", c.dot)} />
      {c.label}
    </span>
  );
}

// Skeleton for loading state
function ModuleSkeleton() {
  return (
    <div className="flex items-start gap-4 py-3">
      <div className="h-8 w-8 rounded-full bg-[#E4E7EC] animate-pulse flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-48 rounded bg-[#E4E7EC] animate-pulse" />
        <div className="h-3 w-32 rounded bg-[#E4E7EC] animate-pulse" />
      </div>
    </div>
  );
}

// Empty state for modules tab
function EmptyModulesState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#E4E7EC] bg-[#F8F9FB] py-16 px-6 text-center">
      <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm border border-[#E4E7EC]">
        <BookOpen className="h-8 w-8 text-[#98A2B3]" />
      </div>
      <p className="text-sm font-bold text-[#101828] font-['Lexend_Deca']">
        Belum Ada Modul
      </p>
      <p className="mt-1 text-[13px] text-[#475467] max-w-xs">
        Modul kursus belum tersedia atau belum diunggah.
      </p>
    </div>
  );
}

// Empty state for test tab
function EmptyTestState({ type }: { type: "Pre-Test" | "Post-Test" }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#E4E7EC] bg-[#F8F9FB] py-16 px-6 text-center">
      <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm border border-[#E4E7EC]">
        <FileText className="h-8 w-8 text-[#98A2B3]" />
      </div>
      <p className="text-sm font-bold text-[#101828] font-['Lexend_Deca']">
        {type} Belum Dikerjakan
      </p>
      <p className="mt-1 text-[13px] text-[#475467] max-w-xs">
        {type} belum dikerjakan oleh karyawan ini.
      </p>
    </div>
  );
}

// Module item component
function ModuleItem({ module, index, total }: { module: Module; index: number; total: number }) {
  const isCompleted = module.isCompleted;
  const progress = module.completionRate ?? 0;
  const isVideo = module.type === "VIDEO";
  const isPdf = module.type === "PDF";

  // Format duration for video
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="relative flex items-start gap-4 group">
      {/* Timeline connector */}
      {index < total - 1 && (
        <div className="absolute left-[15px] top-10 bottom-0 w-0.5 bg-[#E4E7EC]" />
      )}

      {/* Dot indicator */}
      <div
        className={cn(
          "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-200",
          isCompleted
            ? "bg-[#12B76A] text-white shadow-sm"
            : progress > 0
            ? "bg-[#E8A020] text-white shadow-sm"
            : "bg-white border-2 border-[#E4E7EC] text-[#98A2B3] group-hover:border-[#CBD2E0]"
        )}
      >
        {isCompleted ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : progress > 0 ? (
          <div className="h-2 w-2 rounded-full bg-white" />
        ) : (
          <span className="text-[10px] font-bold">{index + 1}</span>
        )}
      </div>

      {/* Content card */}
      <div
        className={cn(
          "flex-1 rounded-xl border p-4 transition-all duration-200",
          isCompleted
            ? "border-[#E4E7EC] bg-white shadow-sm"
            : progress > 0
            ? "border-[#F5C05A] bg-[#FEF3DC]/30"
            : "border-transparent bg-[#F8F9FB]"
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              {/* Module type icon */}
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                  isVideo
                    ? "bg-[#EFF8FF] text-[#175CD3]"
                    : "bg-[#FEF3DC] text-[#C4861A]"
                )}
              >
                {isVideo ? (
                  <Video className="h-3 w-3" />
                ) : (
                  <FileBadge className="h-3 w-3" />
                )}
                {isVideo ? "Video" : "PDF"}
              </span>
              {isCompleted && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#ECFDF3] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#027A48]">
                  <CheckCircle2 className="h-3 w-3" />
                  Selesai
                </span>
              )}
            </div>
            <p
              className={cn(
                "text-sm font-bold font-['Lexend_Deca'] leading-snug",
                isCompleted ? "text-[#101828]" : "text-[#475467]"
              )}
            >
              {module.title}
            </p>
          </div>
        </div>

        {/* Progress info */}
        {!isCompleted && progress > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="font-medium text-[#475467]">Progress</span>
              <span className="font-bold text-[#C4861A]">{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#E4E7EC]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#E8A020] to-[#F5C05A] transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="mt-3 flex items-center gap-4 text-[11px] text-[#98A2B3]">
          {isVideo && module.duration && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDuration(module.duration)}
            </span>
          )}
          {isPdf && module.totalPages && (
            <span className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {module.totalPages} halaman
            </span>
          )}
          {isCompleted && module.completedAt && (
            <span className="flex items-center gap-1 font-medium text-[#98A2B3]">
              <Calendar className="h-3 w-3" />
              {new Date(module.completedAt).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function CourseProgressModal({
  isOpen,
  onClose,
  enrollment,
}: CourseProgressModalProps) {
  const [activeTab, setActiveTab] = useState("modules");
  const [selectedPreId, setSelectedPreId] = useState<string | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  // Separate test attempts by type
  const preAttempts =
    enrollment?.testAttempts?.filter(
      (a) =>
        a.type === "PRE_TEST" || a.test?.type === "PRE" || a.type === "PRE"
    ) || [];

  const postAttempts =
    enrollment?.testAttempts?.filter(
      (a) =>
        a.type === "POST_TEST" || a.test?.type === "POST" || a.type === "POST"
    ) || [];

  // Auto-select latest attempt when modal opens or attempts change
  useEffect(() => {
    if (preAttempts.length > 0 && !selectedPreId) {
      setSelectedPreId(preAttempts[preAttempts.length - 1].id);
    }
    if (postAttempts.length > 0 && !selectedPostId) {
      setSelectedPostId(postAttempts[postAttempts.length - 1].id);
    }
  }, [preAttempts, postAttempts, selectedPreId, selectedPostId]);

  // Reset selection when closing
  useEffect(() => {
    if (!isOpen) {
      setActiveTab("modules");
      setSelectedPreId(null);
      setSelectedPostId(null);
    }
  }, [isOpen]);

  if (!enrollment) return null;

  const modulesCompleted = enrollment.completedModules;
  const modulesTotal = enrollment.totalModules;
  const progressPercent = enrollment.moduleProgress;
  const courseTitle = enrollment.courseTitle || enrollment.course?.title || "Kursus";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-[#E4E7EC] bg-white p-0 shadow-xl font-['DM_Sans'] flex flex-col">
        {/* Header */}
        <DialogHeader className="border-b border-[#E4E7EC] bg-white px-0 py-0 shrink-0">
          <div className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-4">
                {/* Icon */}
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0F1C3F] to-[#1e3470] shadow-sm">
                  <BookOpen className="h-5 w-5 text-[#E8A020]" />
                </div>

                {/* Title & Course */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                      Progress Belajar
                    </span>
                    <StatusBadge status={enrollment.status} />
                  </div>
                  <DialogTitle className="text-left text-lg sm:text-xl font-bold tracking-tight text-[#101828] font-['Lexend_Deca']">
                    {courseTitle}
                  </DialogTitle>
                  <DialogDescription className="sr-only">
                    Detail progress belajar karyawan pada kursus {courseTitle}
                  </DialogDescription>
                </div>
              </div>
            </div>

            {/* Quick stats bar */}
            <div className="mt-5 grid grid-cols-3 gap-3">
              {/* Progress */}
              <div className="flex items-center gap-3 rounded-xl border border-[#E4E7EC] bg-[#F8F9FB] p-3 transition-colors hover:bg-[#F1F3F7]">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm border border-[#E4E7EC]">
                  <BarChart3 className="h-5 w-5 text-[#175CD3]" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                    Progress
                  </p>
                  <p className="mt-0.5 text-lg font-bold text-[#0F1C3F] font-['Lexend_Deca'] leading-none">
                    {progressPercent}%
                  </p>
                </div>
              </div>

              {/* Modules completed */}
              <div className="flex items-center gap-3 rounded-xl border border-[#E4E7EC] bg-[#F8F9FB] p-3 transition-colors hover:bg-[#F1F3F7]">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm border border-[#E4E7EC]">
                  <Layers className="h-5 w-5 text-[#C4861A]" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                    Modul
                  </p>
                  <p className="mt-0.5 text-lg font-bold text-[#0F1C3F] font-['Lexend_Deca'] leading-none">
                    {modulesCompleted}/{modulesTotal}
                  </p>
                </div>
              </div>

              {/* Latest post score */}
              <div className="flex items-center gap-3 rounded-xl border border-[#E4E7EC] bg-[#F8F9FB] p-3 transition-colors hover:bg-[#F1F3F7]">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm border border-[#E4E7EC]">
                  <FileText className="h-5 w-5 text-[#027A48]" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                    Post-Test
                  </p>
                  <p
                    className={cn(
                      "mt-0.5 text-lg font-bold font-['Lexend_Deca'] leading-none",
                      enrollment.postTestPassed
                        ? "text-[#027A48]"
                        : enrollment.postScore !== null
                        ? "text-[#B42318]"
                        : "text-[#98A2B3]"
                    )}
                  >
                    {enrollment.postScore ?? "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Tabs content */}
        <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex flex-1 min-h-0 flex-col overflow-hidden"
          >
            {/* Tab list */}
            <div className="border-b border-[#E4E7EC] px-6 pt-4 shrink-0">
              <TabsList className="h-auto w-full gap-1 rounded-none bg-transparent p-0">
                <TabsTrigger
                  value="modules"
                  className={cn(
                    "relative flex items-center gap-2 rounded-t-lg border border-b-0 px-4 py-2.5 text-sm font-semibold transition-all",
                    activeTab === "modules"
                      ? "border-[#E4E7EC] border-b-white bg-white text-[#0F1C3F]"
                      : "border-transparent text-[#475467] hover:bg-[#F8F9FB] hover:text-[#101828]"
                  )}
                >
                  <Layers className="h-4 w-4" />
                  Modul
                  {modulesTotal > 0 && (
                    <span
                      className={cn(
                        "ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                        activeTab === "modules"
                          ? "bg-[#0F1C3F] text-white"
                          : "bg-[#E4E7EC] text-[#475467]"
                      )}
                    >
                      {enrollment.totalModules || 0}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="pre-test"
                  className={cn(
                    "relative flex items-center gap-2 rounded-t-lg border border-b-0 px-4 py-2.5 text-sm font-semibold transition-all",
                    activeTab === "pre-test"
                      ? "border-[#E4E7EC] border-b-white bg-white text-[#0F1C3F]"
                      : "border-transparent text-[#475467] hover:bg-[#F8F9FB] hover:text-[#101828]"
                  )}
                >
                  <FileText className="h-4 w-4" />
                  Pre-Test
                  {preAttempts.length > 0 && (
                    <span
                      className={cn(
                        "ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                        activeTab === "pre-test"
                          ? "bg-[#0F1C3F] text-white"
                          : "bg-[#E4E7EC] text-[#475467]"
                      )}
                    >
                      {preAttempts.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="post-test"
                  className={cn(
                    "relative flex items-center gap-2 rounded-t-lg border border-b-0 px-4 py-2.5 text-sm font-semibold transition-all",
                    activeTab === "post-test"
                      ? "border-[#E4E7EC] border-b-white bg-white text-[#0F1C3F]"
                      : "border-transparent text-[#475467] hover:bg-[#F8F9FB] hover:text-[#101828]"
                  )}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Post-Test
                  {postAttempts.length > 0 && (
                    <span
                      className={cn(
                        "ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                        activeTab === "post-test"
                          ? "bg-[#0F1C3F] text-white"
                          : "bg-[#E4E7EC] text-[#475467]"
                      )}
                    >
                      {postAttempts.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Scrollable content area */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {/* TAB 1: MODULES */}
              <TabsContent value="modules" className="mt-0">
                {(enrollment.modules || []).length === 0 ? (
                  <EmptyModulesState />
                ) : (
                  <div className="space-y-4">
                    {enrollment.modules?.map((module, index) => (
                      <ModuleItem
                        key={module.id}
                        module={module}
                        index={index}
                        total={enrollment.modules?.length || 0}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* TAB 2: PRE-TEST */}
              <TabsContent value="pre-test" className="mt-0">
                <div className="space-y-5">
                  {/* Attempt selector & header */}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <History className="h-4 w-4 text-[#475467]" />
                      <h3 className="text-sm font-bold text-[#101828] font-['Lexend_Deca']">
                        Riwayat Pre-Test
                      </h3>
                      {preAttempts.length > 0 && (
                        <span className="rounded-full bg-[#F8F9FB] px-2 py-0.5 text-[10px] font-bold text-[#475467]">
                          {preAttempts.length} percobaan
                        </span>
                      )}
                    </div>

                    {preAttempts.length > 0 && (
                      <Select
                        value={selectedPreId || ""}
                        onValueChange={setSelectedPreId}
                      >
                        <SelectTrigger className="h-9 w-full min-w-[180px] rounded-lg border-[#E4E7EC] bg-white text-sm font-medium shadow-sm focus:border-[#0F1C3F] focus:ring-[#0F1C3F] focus:ring-1 sm:w-auto">
                          <SelectValue placeholder="Pilih percobaan" />
                        </SelectTrigger>
                        <SelectContent className="rounded-lg border-[#E4E7EC] bg-white shadow-md">
                          {preAttempts.map((a, i) => (
                            <SelectItem
                              key={a.id}
                              value={a.id}
                              className="text-sm focus:bg-[#F8F9FB] focus:text-[#0F1C3F]"
                            >
                              <span className="flex items-center gap-2">
                                <span className="font-bold">Percobaan {i + 1}</span>
                                <span className="text-[#98A2B3]">
                                  — Nilai {a.score ?? "—"}
                                </span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {/* Test review */}
                  {preAttempts.length === 0 ? (
                    <EmptyTestState type="Pre-Test" />
                  ) : (
                    <TestAttemptReview attemptId={selectedPreId || preAttempts[preAttempts.length - 1]?.id} />
                  )}
                </div>
              </TabsContent>

              {/* TAB 3: POST-TEST */}
              <TabsContent value="post-test" className="mt-0">
                <div className="space-y-5">
                  {/* Attempt selector & header */}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <History className="h-4 w-4 text-[#475467]" />
                      <h3 className="text-sm font-bold text-[#101828] font-['Lexend_Deca']">
                        Riwayat Post-Test
                      </h3>
                      {postAttempts.length > 0 && (
                        <span className="rounded-full bg-[#F8F9FB] px-2 py-0.5 text-[10px] font-bold text-[#475467]">
                          {postAttempts.length} percobaan
                        </span>
                      )}
                    </div>

                    {postAttempts.length > 0 && (
                      <Select
                        value={selectedPostId || ""}
                        onValueChange={setSelectedPostId}
                      >
                        <SelectTrigger className="h-9 w-full min-w-[180px] rounded-lg border-[#E4E7EC] bg-white text-sm font-medium shadow-sm focus:border-[#0F1C3F] focus:ring-[#0F1C3F] focus:ring-1 sm:w-auto">
                          <SelectValue placeholder="Pilih percobaan" />
                        </SelectTrigger>
                        <SelectContent className="rounded-lg border-[#E4E7EC] bg-white shadow-md">
                          {postAttempts.map((a, i) => (
                            <SelectItem
                              key={a.id}
                              value={a.id}
                              className="text-sm focus:bg-[#F8F9FB] focus:text-[#0F1C3F]"
                            >
                              <span className="flex items-center gap-2">
                                <span className="font-bold">Percobaan {i + 1}</span>
                                <span className="text-[#98A2B3]">
                                  — Nilai {a.score ?? "—"}
                                </span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {/* Test review */}
                  {postAttempts.length === 0 ? (
                    <EmptyTestState type="Post-Test" />
                  ) : (
                    <TestAttemptReview
                      attemptId={selectedPostId || postAttempts[postAttempts.length - 1]?.id}
                    />
                  )}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
