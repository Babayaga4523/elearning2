"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Settings,
  Rocket,
  CheckCircle2,
  FileCheck,
  AlertTriangle,
  Plus,
  Eye,
  GripVertical,
  Trash,
  MoreVertical,
  Clock,
  FileVideo,
  FileText,
  ChevronRight,
  LayoutDashboard,
  GraduationCap,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { CourseTitleForm } from "@/components/admin/course-title-form";
import { CourseDescriptionForm } from "@/components/admin/course-description-form";
import { CourseCategoryForm } from "@/components/admin/course-category-form";
import { CourseDurationForm } from "@/components/admin/course-duration-form";
import { CourseVisibilityForm } from "@/components/admin/course-visibility-form";
import { PublishButton } from "./PublishButton";
import { ModuleFormModal } from "./ModuleFormModal";
import { deleteModule } from "../actions";

type Module = { [key: string]: any };
type Test = { [key: string]: any } | null;

interface Props {
  courseId: string;
  activeStep: number;
  courseTitle: string;
  isPublished: boolean;
  modules: Module[];
  preTest: Test;
  postTest: Test;
  initialData: any;
  categories: { label: string; value: string }[];
}

const STEP_LABELS = ["", "Identitas", "Kurikulum", "Pengaturan", "Publikasi"];

/* ─── Custom Semantic Badge ────────────────────────────── */
function SemanticBadge({ variant, children, withDot = true }: { variant: "success"|"warning"|"danger"|"info"|"neutral"|"gold"|"navy"|"draft", children: React.ReactNode, withDot?: boolean }) {
  const config = {
    success: { bg: "bg-[#ECFDF3]", text: "text-[#027A48]", border: "border-[#6CE9A6]", dot: "bg-[#12B76A]" },
    warning: { bg: "bg-[#FFFAEB]", text: "text-[#B54708]", border: "border-[#FEC84B]", dot: "bg-[#F79009]" },
    danger:  { bg: "bg-[#FEF3F2]", text: "text-[#B42318]", border: "border-[#FDA29B]", dot: "bg-[#F04438]" },
    info:    { bg: "bg-[#EFF8FF]", text: "text-[#175CD3]", border: "border-[#B2DDFF]", dot: "bg-[#2E90FA]" },
    neutral: { bg: "bg-[#F8F9FB]", text: "text-[#344054]", border: "border-[#E4E7EC]",  dot: "bg-[#98A2B3]" },
    gold:    { bg: "bg-[#FEF3DC]", text: "text-[#C4861A]", border: "border-[#F5C05A]",  dot: "bg-[#E8A020]" },
    navy:    { bg: "bg-[#E8EDF7]", text: "text-[#0F1C3F]", border: "border-[#CBD2E0]",  dot: "bg-[#0F1C3F]" },
    draft:   { bg: "bg-[#F1F3F7]", text: "text-[#475467]", border: "border-[#CBD2E0]",  dot: "bg-[#9AA4B8]" },
  }[variant];

  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-widest border font-['DM_Sans']", config.bg, config.text, config.border)}>
      {withDot && <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", config.dot)} />}
      {children}
    </span>
  );
}

export function CourseSetupClient({
  courseId,
  activeStep,
  courseTitle,
  isPublished,
  modules,
  preTest,
  postTest,
  initialData,
  categories,
}: Props) {
  const router = useRouter();

  const publishedModules = modules.filter((m) => m.isPublished).length;
  const postTestValid = postTest && postTest.questions?.length >= 5 && postTest.questions.every((q: any) => q.options?.some((o: any) => o.isCorrect));

  const requiredFields = [
    courseTitle.trim().length > 0,
    modules.some((m) => m.isPublished),
    postTestValid,
  ];
  const completedCount = requiredFields.filter(Boolean).length;
  const isReady = requiredFields.every(Boolean);

  return (
    <div className="min-h-screen w-full bg-[#F8F9FB] font-['DM_Sans']">
      {/* ─── Sticky Header ──────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white border-b border-[#E4E7EC] shadow-sm">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Left: back + breadcrumb */}
            <div className="flex items-center gap-4 min-w-0 flex-shrink">
              <Link
                href="/admin/courses"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#E4E7EC] bg-white text-[#475467] hover:border-[#0F1C3F]/30 hover:bg-[#F8F9FB] hover:text-[#101828] transition-all active:scale-[0.97]"
              >
                <ArrowLeft size={16} />
              </Link>
              <div className="min-w-0">
                <nav className="flex items-center gap-1.5 text-xs text-[#98A2B3] mb-1 font-semibold">
                  <Link href="/admin" className="hover:text-[#475467] transition-colors">Admin</Link>
                  <ChevronRight size={12} />
                  <Link href="/admin/courses" className="hover:text-[#475467] transition-colors">Kursus</Link>
                  <ChevronRight size={12} />
                  <span className="text-[#E8A020]">Setup</span>
                </nav>
                <h1 className="text-xl font-bold text-[#101828] font-['Lexend_Deca'] truncate max-w-[200px] md:max-w-md">
                  {courseTitle}
                </h1>
              </div>
            </div>

            {/* Center: step progress */}
            <div className="hidden md:flex flex-1 max-w-lg mx-8 flex-col justify-center">
               <div className="flex items-center gap-2">
                {[1, 2, 3, 4].map((step, idx) => {
                  const done = activeStep > step;
                  const active = activeStep === step;
                  return (
                    <div key={step} className="flex-1 flex items-center gap-2">
                      <Link
                        href={`?step=${step}`}
                        className={cn(
                          "flex-1 h-2 rounded-full transition-all duration-300",
                          done ? "bg-[#E8A020]" : active ? "bg-[#0F1C3F]" : "bg-[#E4E7EC] hover:bg-[#CBD2E0]"
                        )}
                        title={STEP_LABELS[step]}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-2 px-1">
                {[1, 2, 3, 4].map((step) => (
                  <span key={step} className={cn("text-[10px] font-bold uppercase tracking-widest", activeStep >= step ? "text-[#101828]" : "text-[#98A2B3]")}>
                    {STEP_LABELS[step]}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: status + preview + publish */}
            <div className="flex items-center gap-3 shrink-0">
              <SemanticBadge variant={isPublished ? "success" : "draft"}>
                {isPublished ? "Aktif" : "Draft"}
              </SemanticBadge>
              <Button variant="outline" size="sm" asChild className="h-10 px-4 rounded-lg border-[#E4E7EC] text-sm font-semibold text-[#475467] hover:bg-[#F8F9FB] hover:text-[#101828] transition-colors">
                <Link href={`/courses/${courseId}`} target="_blank">
                  <Eye size={16} className="mr-2" />
                  Preview
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Page Body ─────────────────────────── */}
      <div className="mx-auto max-w-7xl px-6 py-8 md:py-10">
        {activeStep === 2 && <StepCurriculum courseId={courseId} modules={modules} preTest={preTest} postTest={postTest} />}
        {activeStep === 3 && <StepSettings courseId={courseId} initialData={initialData} categories={categories} />}
        {activeStep === 4 && (
          <StepPublish courseId={courseId} isReady={isReady} completedCount={completedCount} courseTitle={courseTitle} modules={modules} preTest={preTest} postTestValid={!!postTestValid} />
        )}
        {activeStep === 1 && (
          <div className="flex flex-col items-center justify-center py-24 text-center max-w-lg mx-auto">
            <div className="h-16 w-16 rounded-2xl bg-[#E8EDF7] border border-[#CBD2E0] flex items-center justify-center mb-6">
              <BookOpen size={28} className="text-[#0F1C3F]" />
            </div>
            <h2 className="text-2xl font-bold text-[#101828] font-['Lexend_Deca'] mb-3">Identitas Kursus Lengkap</h2>
            <p className="text-base text-[#475467] leading-relaxed mb-8">Kursus ini sudah memiliki informasi dasar. Langkah selanjutnya adalah menyusun materi kurikulum dan tes evaluasi untuk peserta.</p>
            <Button asChild className="h-12 px-8 rounded-lg bg-[#E8A020] hover:bg-[#C4861A] text-white font-semibold text-base shadow-md active:scale-95 transition-all">
              <Link href={`?step=2`}>
                Lanjut ke Kurikulum <ChevronRight size={18} className="ml-2" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Step 2: Kurikulum ────────────────────────────────────── */
function StepCurriculum({
  courseId,
  modules,
  preTest,
  postTest,
}: {
  courseId: string;
  modules: Module[];
  preTest: Test;
  postTest: Test;
}) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const router = useRouter();
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const handleDelete = async (moduleId: string) => {
    try {
      setIsDeleting(moduleId);
      const result = await deleteModule(courseId, moduleId);
      if (result.success) {
        toast.success(result.statusReverted ? "Modul dihapus, kursus ditarik ke draft" : "Modul dihapus");
        router.refresh();
      } else {
        toast.error("Gagal menghapus");
      }
    } catch {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#101828] font-['Lexend_Deca']">Kurikulum & Materi</h2>
          <p className="text-sm text-[#475467] mt-1.5">
            Kelola {modules.length} modul pembelajaran dan tes evaluasi untuk kursus ini.
          </p>
        </div>
        <ModuleFormModal>
          <Button className="h-10 px-5 rounded-lg bg-[#0F1C3F] hover:bg-[#1A2D5A] text-white font-semibold shadow-sm transition-all active:scale-95">
            <Plus size={16} className="mr-2" /> Tambah Modul
          </Button>
        </ModuleFormModal>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Module list */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-sm font-bold text-[#101828] font-['Lexend_Deca'] flex items-center gap-2 mb-4">
            <BookOpen size={16} className="text-[#E8A020]" /> DAFTAR MODUL
          </h3>
          {modules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-xl border border-[#E4E7EC] bg-white border-dashed">
              <div className="h-12 w-12 rounded-xl bg-[#F8F9FB] border border-[#E4E7EC] flex items-center justify-center mb-4">
                <FileVideo size={20} className="text-[#98A2B3]" />
              </div>
              <h3 className="font-semibold text-[#101828] font-['Lexend_Deca'] text-base mb-1.5">Belum ada modul</h3>
              <p className="text-sm text-[#475467] max-w-sm">Tambahkan materi pembelajaran berupa video interaktif atau dokumen PDF untuk peserta.</p>
              <ModuleFormModal>
                <Button className="mt-6 h-10 px-6 rounded-lg bg-[#0F1C3F] hover:bg-[#1A2D5A] text-white font-semibold shadow-sm transition-all active:scale-95">
                  Tambah Modul Pertama
                </Button>
              </ModuleFormModal>
            </div>
          ) : (
            <div className="rounded-xl border border-[#E4E7EC] bg-white overflow-hidden shadow-sm">
              <div className="divide-y divide-[#E4E7EC]">
                {modules.map((mod, idx) => (
                  <ModuleRow
                    key={mod.id}
                    module={mod}
                    index={idx}
                    courseId={courseId}
                    isDeleting={isDeleting === mod.id}
                    onDelete={() => handleDelete(mod.id)}
                    draggedIdx={draggedIdx}
                    setDraggedIdx={setDraggedIdx}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-bold text-[#101828] font-['Lexend_Deca'] flex items-center gap-2 mb-4">
              <LayoutDashboard size={16} className="text-[#E8A020]" /> EVALUASI
            </h3>
            <div className="space-y-4">
              <TestCard
                icon={<LayoutDashboard size={18} />}
                label="Pre-Test"
                desc="Evaluasi awal kompetensi"
                href={`/admin/courses/${courseId}/tests/${preTest?.id ?? "new"}?type=PRE`}
                hasData={!!preTest}
                stats={preTest ? { durasi: preTest.duration, soal: preTest.questions?.length ?? 0, score: preTest.passingScore } : null}
                accent="info"
              />
              <TestCard
                icon={<GraduationCap size={18} />}
                label="Post-Test"
                desc="Ujian akhir kelulusan"
                href={`/admin/courses/${courseId}/tests/${postTest?.id ?? "new"}?type=POST`}
                hasData={!!postTest}
                stats={postTest ? { durasi: postTest.duration, soal: postTest.questions?.length ?? 0, score: postTest.passingScore } : null}
                accent="gold"
              />
            </div>
          </div>
          
          {modules.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-[#101828] font-['Lexend_Deca'] flex items-center gap-2 mb-4 mt-8">
                <BarChart3 size={16} className="text-[#E8A020]" /> RINGKASAN
              </h3>
              <ModuleStats modules={modules} />
            </div>
          )}
        </div>
      </div>

      <NavFooter step={2} />
    </div>
  );
}

/* ─── Step 3: Pengaturan ────────────────────────────────────── */
function StepSettings({
  courseId,
  initialData,
  categories,
}: {
  courseId: string;
  initialData: any;
  categories: { label: string; value: string }[];
}) {
  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold text-[#101828] font-['Lexend_Deca']">Pengaturan & Visibilitas</h2>
        <p className="text-sm text-[#475467] mt-1.5">
          Atur informasi mendetail, kategori, tenggat waktu, serta status visibilitas kursus.
        </p>
      </div>

      <div className="rounded-2xl border border-[#E4E7EC] bg-white shadow-sm overflow-hidden divide-y divide-[#E4E7EC]">
        <CourseTitleForm courseId={courseId} initialData={initialData} />
        <CourseDescriptionForm courseId={courseId} initialData={initialData} />
        <CourseCategoryForm courseId={courseId} initialData={initialData} options={categories} />
        <CourseDurationForm courseId={courseId} initialData={initialData} />
        <CourseVisibilityForm courseId={courseId} initialData={initialData} />
      </div>

      <NavFooter step={3} nextLabel="Lanjut ke Publikasi" />
    </div>
  );
}

/* ─── Step 4: Publish ──────────────────────────────────────── */
function StepPublish({
  courseId,
  isReady,
  completedCount,
  courseTitle,
  modules,
  preTest,
  postTestValid,
}: {
  courseId: string;
  isReady: boolean;
  completedCount: number;
  courseTitle: string;
  modules: Module[];
  preTest: any;
  postTestValid: boolean;
}) {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold text-[#101828] font-['Lexend_Deca']">Review & Publikasi</h2>
        <p className="text-sm text-[#475467] mt-1.5">
          Pastikan seluruh komponen kursus telah terisi dengan benar sebelum ditayangkan ke pengguna.
        </p>
      </div>

      {/* Completion Status */}
      <div className="rounded-2xl border border-[#E4E7EC] bg-white p-6 shadow-sm flex items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-[#E8EDF7] border border-[#CBD2E0] flex items-center justify-center shrink-0">
            <CheckCircle2 size={24} className="text-[#0F1C3F]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#101828] font-['Lexend_Deca']">Kesiapan Publikasi</h3>
            <p className="text-sm text-[#475467] mt-1">Lengkapi {3 - completedCount} persyaratan lagi untuk bisa mempublikasikan kursus.</p>
          </div>
        </div>
        <div className="flex-1 max-w-xs ml-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#101828]">{completedCount} dari 3 Selesai</span>
            <SemanticBadge variant={isReady ? "success" : "warning"}>{isReady ? "Siap" : "Belum Siap"}</SemanticBadge>
          </div>
          <Progress value={(completedCount / 3) * 100} className="h-2 bg-[#F1F3F7]" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Checklist */}
        <div className={cn("lg:col-span-3 rounded-2xl border bg-white shadow-sm overflow-hidden", isReady ? "border-[#6CE9A6]" : "border-[#E4E7EC]")}>
          <div className="px-6 py-5 border-b border-[#E4E7EC] bg-[#F8F9FB] flex items-center gap-3">
            <FileCheck size={18} className="text-[#0F1C3F]" />
            <h3 className="text-base font-bold text-[#101828] font-['Lexend_Deca']">Daftar Persyaratan</h3>
          </div>
          <div className="p-6 space-y-4">
            {[
              { label: "Identitas Kursus", desc: "Judul dan deskripsi harus terisi", done: true },
              { label: "Materi Modul", desc: "Minimal 1 modul dengan status Aktif", done: modules.some((m) => m.isPublished) },
              { label: "Ujian Akhir (Post-Test)", desc: "Minimal berisi 5 soal yang memiliki kunci jawaban", done: postTestValid },
            ].map((item, idx) => (
              <div key={idx} className={cn("flex items-start gap-4 p-4 rounded-xl border transition-colors", item.done ? "bg-[#ECFDF3]/50 border-[#6CE9A6]" : "bg-[#F8F9FB] border-[#E4E7EC]")}>
                <div className={cn("h-8 w-8 rounded-full flex items-center justify-center shrink-0 border", item.done ? "bg-[#12B76A] border-[#12B76A] text-white" : "bg-white border-[#CBD2E0] text-[#98A2B3]")}>
                  <CheckCircle2 size={16} />
                </div>
                <div className="flex-1">
                  <h4 className={cn("text-sm font-bold font-['Lexend_Deca'] mb-1", item.done ? "text-[#027A48]" : "text-[#344054]")}>{item.label}</h4>
                  <p className="text-xs text-[#475467]">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Publish Action Panel */}
        <div className="lg:col-span-2 rounded-2xl border border-[#0F1C3F] bg-[#0F1C3F] shadow-xl overflow-hidden relative flex flex-col">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Rocket size={120} className="text-white" />
          </div>
          <div className="relative p-8 flex flex-col flex-1">
            <div className="h-12 w-12 rounded-xl bg-[#E8A020] flex items-center justify-center mb-6 shadow-md">
              <Rocket size={24} className="text-white" />
            </div>
            <h3 className="text-xl font-bold text-white font-['Lexend_Deca'] mb-2">Terbitkan Kursus</h3>
            <p className="text-sm text-[#94A3B8] leading-relaxed mb-8 flex-1">
              Jadikan kursus ini tersedia untuk seluruh peserta di platform pembelajaran BNI Finance.
            </p>
            
            <div className="space-y-4">
              {!isReady && (
                <div className="p-3 rounded-lg bg-[#FFFAEB] border border-[#FEC84B] flex items-start gap-2.5">
                  <AlertTriangle size={16} className="text-[#B54708] mt-0.5 shrink-0" />
                  <p className="text-[11px] font-semibold text-[#B54708] leading-tight">Tidak dapat mempublikasikan. Harap lengkapi semua persyaratan di samping.</p>
                </div>
              )}
              <PublishButton courseId={courseId} isPublished={false} disabled={!isReady} />
              <Button variant="outline" asChild className="w-full h-11 rounded-lg border-white/20 text-white hover:bg-white/10 hover:text-white transition-colors bg-transparent">
                <Link href={`/courses/${courseId}`} target="_blank">
                  <Eye size={16} className="mr-2" /> Lihat Tampilan Peserta
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Module Row ──────────────────────────────────────────── */
function ModuleRow({
  module,
  index,
  courseId,
  isDeleting,
  onDelete,
  draggedIdx,
  setDraggedIdx,
}: {
  module: Module;
  index: number;
  courseId: string;
  isDeleting: boolean;
  onDelete: () => void;
  draggedIdx: number | null;
  setDraggedIdx: (i: number | null) => void;
}) {
  const isDragging = draggedIdx === index;

  return (
    <div
      draggable
      onDragStart={() => setDraggedIdx(index)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={() => setDraggedIdx(null)}
      className={cn(
        "flex items-center gap-4 p-4 transition-all group bg-white hover:bg-[#F8F9FB]",
        isDragging ? "opacity-40" : ""
      )}
    >
      <GripVertical size={18} className="text-[#CBD2E0] cursor-grab active:cursor-grabbing hover:text-[#475467] transition-colors" />
      <div className="h-10 w-10 rounded-xl bg-[#F8F9FB] border border-[#E4E7EC] flex flex-col items-center justify-center shrink-0 text-[#0F1C3F]">
        <span className="text-[10px] font-bold tracking-wider leading-none text-[#98A2B3] mb-0.5">MOD</span>
        <span className="text-sm font-bold font-['Lexend_Deca'] leading-none">{String(index + 1).padStart(2, "0")}</span>
      </div>
      
      <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border", module.type === "VIDEO" ? "bg-[#FEF3F2] border-[#FDA29B] text-[#F04438]" : "bg-[#EFF8FF] border-[#B2DDFF] text-[#2E90FA]")}>
        {module.type === "VIDEO" ? <FileVideo size={18} /> : <FileText size={18} />}
      </div>

      <div className="flex-1 min-w-0 pr-4">
        <h4 className="text-sm font-bold text-[#101828] font-['Lexend_Deca'] truncate mb-1">{module.title}</h4>
        <div className="flex items-center gap-3">
          <SemanticBadge variant={module.isPublished ? "success" : "draft"}>
            {module.isPublished ? "Aktif" : "Draft"}
          </SemanticBadge>
          <div className="flex items-center gap-1.5 text-xs text-[#475467] font-medium">
            <Clock size={12} className="text-[#98A2B3]" /> {module.duration ?? 0} Menit
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" asChild className="h-9 w-9 rounded-lg text-[#475467] hover:bg-[#E4E7EC] hover:text-[#101828]">
          <Link href={`/courses/${courseId}/modules/${module.id}`} target="_blank">
            <Eye size={16} />
          </Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-[#475467] hover:bg-[#E4E7EC] hover:text-[#101828]">
              <MoreVertical size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg border-[#E4E7EC]">
            <ModuleFormModal initialData={module}>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="rounded-lg text-sm font-medium cursor-pointer py-2 focus:bg-[#F8F9FB]">
                Edit Modul
              </DropdownMenuItem>
            </ModuleFormModal>
            <DropdownMenuSeparator className="bg-[#E4E7EC]" />
            <DropdownMenuItem onClick={onDelete} disabled={isDeleting} className="rounded-lg text-[#F04438] focus:bg-[#FEF3F2] focus:text-[#B42318] font-medium cursor-pointer py-2">
              <Trash size={16} className="mr-2" /> {isDeleting ? "Menghapus..." : "Hapus Modul"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

/* ─── Test Card ─────────────────────────────────────────── */
function TestCard({
  icon,
  label,
  desc,
  href,
  hasData,
  stats,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  desc: string;
  href: string;
  hasData: boolean;
  stats: { durasi: number; soal: number; score: number } | null;
  accent: "gold" | "info";
}) {
  const aStyles = accent === "gold"
    ? { bg: "bg-[#FEF3DC]", border: "border-[#F5C05A]", text: "text-[#C4861A]", fill: "bg-[#E8A020]" }
    : { bg: "bg-[#EFF8FF]", border: "border-[#B2DDFF]", text: "text-[#175CD3]", fill: "bg-[#2E90FA]" };

  return (
    <div className="rounded-xl border border-[#E4E7EC] bg-white shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md hover:-translate-y-0.5 group">
      <div className={cn("h-1.5 w-full", aStyles.fill)} />
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start gap-4 mb-5">
          <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center shrink-0 border", aStyles.bg, aStyles.border, aStyles.text)}>
            {icon}
          </div>
          <div>
            <h3 className="text-base font-bold text-[#101828] font-['Lexend_Deca'] mb-0.5">{label}</h3>
            <p className="text-[11px] text-[#475467] font-medium">{desc}</p>
          </div>
        </div>
        
        {stats ? (
          <div className="grid grid-cols-3 gap-2 mb-5">
            {[
              { l: "Durasi", v: `${stats.durasi}m` },
              { l: "Kelulusan", v: `${stats.score}%` },
              { l: "Total Soal", v: stats.soal },
            ].map((s, i) => (
              <div key={i} className="bg-[#F8F9FB] rounded-lg p-2.5 text-center border border-[#E4E7EC]">
                <p className="text-sm font-bold text-[#101828] font-['Lexend_Deca'] leading-tight mb-0.5">{s.v}</p>
                <p className="text-[9px] font-bold uppercase tracking-wider text-[#98A2B3]">{s.l}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-6 px-4 bg-[#F8F9FB] rounded-lg border border-[#E4E7EC] border-dashed mb-5">
            <p className="text-[11px] font-semibold text-[#98A2B3] text-center">Belum ada {label} yang dikonfigurasi</p>
          </div>
        )}
        
        <Button asChild variant={hasData ? "outline" : "default"} className={cn("w-full h-10 rounded-lg text-sm font-bold mt-auto transition-colors", hasData ? "border-[#E4E7EC] text-[#344054] hover:bg-[#F8F9FB]" : "bg-[#0F1C3F] hover:bg-[#1A2D5A] text-white shadow-sm")}>
          <Link href={href}>
            {hasData ? `Kelola ${label}` : `Buat ${label} Baru`}
          </Link>
        </Button>
      </div>
    </div>
  );
}

/* ─── Module Stats ────────────────────────────────────────────── */
function ModuleStats({ modules }: { modules: Module[] }) {
  const videos = modules.filter((m) => m.type === "VIDEO").length;
  const pdfs = modules.filter((m) => m.type !== "VIDEO").length;
  const totalMin = modules.reduce((s, m) => s + (m.duration ?? 0), 0);
  
  return (
    <div className="rounded-xl border border-[#E4E7EC] bg-white p-5 shadow-sm">
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#F1F3F7]">
          <div className="flex items-center gap-2.5 text-[#475467]">
            <div className="p-1.5 rounded-md bg-[#FEF3F2] text-[#F04438]"><FileVideo size={14} /></div>
            <span className="text-sm font-medium font-['DM_Sans']">Materi Video</span>
          </div>
          <span className="text-sm font-bold text-[#101828] font-['Lexend_Deca']">{videos}</span>
        </div>
        <div className="flex items-center justify-between pb-3 border-b border-[#F1F3F7]">
          <div className="flex items-center gap-2.5 text-[#475467]">
            <div className="p-1.5 rounded-md bg-[#EFF8FF] text-[#2E90FA]"><FileText size={14} /></div>
            <span className="text-sm font-medium font-['DM_Sans']">Materi Dokumen</span>
          </div>
          <span className="text-sm font-bold text-[#101828] font-['Lexend_Deca']">{pdfs}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-[#475467]">
            <div className="p-1.5 rounded-md bg-[#F8F9FB] text-[#475467] border border-[#E4E7EC]"><Clock size={14} /></div>
            <span className="text-sm font-medium font-['DM_Sans']">Estimasi Durasi</span>
          </div>
          <span className="text-sm font-bold text-[#101828] font-['Lexend_Deca']">{totalMin} Menit</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Navigation Footer ───────────────────────────────── */
function NavFooter({ step, nextLabel = "Selanjutnya" }: { step: number; nextLabel?: string }) {
  return (
    <div className="flex items-center justify-between pt-8 border-t border-[#E4E7EC] mt-10">
      <Button variant="outline" asChild className="h-11 px-6 rounded-lg text-[#344054] font-semibold border-[#E4E7EC] hover:bg-[#F8F9FB] hover:text-[#101828] transition-colors">
        <Link href={`?step=${step - 1}`}>
          <ArrowLeft size={16} className="mr-2" /> Kembali
        </Link>
      </Button>
      <Button asChild className="h-11 px-8 rounded-lg bg-[#E8A020] hover:bg-[#C4861A] text-white font-bold shadow-md active:scale-95 transition-all">
        <Link href={`?step=${step + 1}`}>
          {nextLabel} <ChevronRight size={16} className="ml-2" />
        </Link>
      </Button>
    </div>
  );
}
