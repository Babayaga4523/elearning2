"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { upsertTest } from "../actions";
import {
  ArrowLeft,
  Plus,
  Trash,
  Hash,
  Shuffle,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ConfirmDraftDialog } from "@/components/admin/ConfirmDraftDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";

const OPTION_LABELS = ["A", "B", "C", "D", "E", "F"];

const questionSchema = z.object({
  text: z.string().min(10, "Pertanyaan minimal 10 karakter"),
  options: z
    .array(
      z.object({
        text: z.string().min(1, "Opsi wajib diisi"),
        isCorrect: z.boolean(),
      })
    )
    .min(2, "Minimal 2 opsi")
    .refine(
      (opts) => opts.filter((o) => o.isCorrect).length === 1,
      { message: "Setiap soal harus memiliki tepat 1 jawaban benar" }
    ),
});

const formSchema = z.object({
  type: z.enum(["PRE", "POST"]),
  duration: z.coerce.number().min(1, "Durasi minimal 1 menit"),
  passingScore: z.coerce.number().min(0).max(100),
  maxAttempts: z.coerce.number().int().min(0),
  randomizeQuestions: z.boolean(),
  randomizeOptions: z.boolean(),
  questions: z.array(questionSchema).min(1, "Minimal harus ada 1 soal"),
});

type TestFormProps = {
  courseId: string;
  initialData?: any;
  type: "PRE_TEST" | "POST_TEST";
  isCoursePublished?: boolean;
};

export function TestForm({
  courseId,
  initialData,
  type,
  isCoursePublished,
}: TestFormProps) {
  const router = useRouter();
  const [showDraftConfirm, setShowDraftConfirm] = useState(false);
  const [pendingValues, setPendingValues] = useState<z.infer<typeof formSchema> | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Record<number, boolean>>({});

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues:
      initialData?.questions?.length > 0
        ? {
            type: initialData.type,
            duration: initialData.duration,
            passingScore: initialData.passingScore,
            maxAttempts: initialData.maxAttempts ?? 0,
            randomizeQuestions: initialData.randomizeQuestions ?? false,
            randomizeOptions: initialData.randomizeOptions ?? false,
            questions: initialData.questions.map((q: any) => ({
              text: q.text,
              options: q.options.map((o: any) => ({
                text: o.text,
                isCorrect: o.isCorrect,
              })),
            })),
          }
        : {
            type: type === "POST_TEST" ? "POST" : "PRE",
            duration: 60,
            passingScore: 70,
            maxAttempts: 0,
            randomizeQuestions: false,
            randomizeOptions: false,
            questions: [
              {
                text: "",
                options: [
                  { text: "", isCorrect: true },
                  { text: "", isCorrect: false },
                  { text: "", isCorrect: false },
                  { text: "", isCorrect: false },
                ],
              },
            ],
          },
  });

  const { isDirty, isSubmitting } = form.formState;

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const onNavigateWithCheck = (url: string | "back") => {
    if (isDirty) {
      setPendingUrl(url);
      setShowConfirmDialog(true);
    } else {
      if (url === "back") router.back();
      else router.push(url);
    }
  };

  const handleConfirmExit = () => {
    setShowConfirmDialog(false);
    if (pendingUrl === "back") router.back();
    else if (pendingUrl) router.push(pendingUrl);
  };

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "questions",
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (isCoursePublished && type === "POST_TEST") {
      if (values.questions.length < 5) {
        setPendingValues(values);
        setShowDraftConfirm(true);
        return;
      }
    }
    try {
      const result = await upsertTest(courseId, values);
      if (result.success) {
        toast.success(
          result.statusReverted
            ? "Kursus ditarik ke Draft & Tes disimpan"
            : "Tes berhasil disimpan"
        );
        router.push(`/admin/courses/${courseId}`);
        router.refresh();
      } else {
        toast.error("Gagal menyimpan tes");
      }
    } catch {
      toast.error("Terjadi kesalahan");
    }
  };

  const onConfirmSaveAsDraft = async () => {
    if (!pendingValues) return;
    setShowDraftConfirm(false);
    try {
      const result = await upsertTest(courseId, pendingValues);
      if (result.success) {
        toast.info("Kursus ditarik ke Draft agar data tetap valid");
        router.push(`/admin/courses/${courseId}`);
        router.refresh();
      }
    } catch {
      toast.error("Terjadi kesalahan");
    }
  };

  const toggleQuestion = (index: number) => {
    setExpandedQuestions((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const inputCls =
    "h-10 w-full rounded-xl border-[#E4E7EC] bg-white text-sm text-[#101828] placeholder:text-[#98A2B3] focus:border-[#0F1C3F] focus:ring-2 focus:ring-[#0F1C3F]/10 focus:outline-none transition-all";
  const labelCls = "text-sm font-medium text-[#344054]";
  const hintCls = "text-xs text-[#98A2B3] mt-1";

  return (
    <>
      <ConfirmDraftDialog
        isOpen={showDraftConfirm}
        onClose={() => setShowDraftConfirm(false)}
        onConfirm={onConfirmSaveAsDraft}
        warningDetails={[
          "Post-Test minimal harus memiliki 5 soal untuk tetap Published.",
          "Perubahan ini akan menarik kursus dari katalog publik.",
        ]}
      />
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleConfirmExit}
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

          {/* Section 1: Pengaturan Tes */}
          <div className="rounded-xl border border-[#E4E7EC] bg-white shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 bg-[#F8F9FB] border-b border-[#E4E7EC]">
              <div className="h-9 w-9 rounded-xl bg-[#0F1C3F] flex items-center justify-center">
                <Hash size={16} className="text-[#E8A020]" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#0F1C3F] font-['Lexend_Deca']">
                  Pengaturan Tes
                </h2>
                <p className="text-[11px] text-[#98A2B3] mt-0.5">
                  Durasi, skor minimum, dan batas percobaan
                </p>
              </div>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelCls}>Durasi (menit)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" placeholder="60" disabled={isSubmitting} className={inputCls} />
                      </FormControl>
                      <p className={hintCls}>Waktu pengerjaan tes</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="passingScore"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelCls}>Passing Score (%)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" placeholder="70" disabled={isSubmitting} className={inputCls} />
                      </FormControl>
                      <p className={hintCls}>Nilai minimum untuk lulus (0–100)</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="maxAttempts"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={labelCls}>Batas Percobaan</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" placeholder="0 = tidak terbatas" disabled={isSubmitting} className={inputCls} />
                      </FormControl>
                      <p className={hintCls}>0 = unlimited</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Keamanan & Pengacakan */}
          <div className="rounded-xl border border-[#E4E7EC] bg-white shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 bg-[#F8F9FB] border-b border-[#E4E7EC]">
              <div className="h-9 w-9 rounded-xl bg-[#FEF3DC] flex items-center justify-center">
                <Shuffle size={16} className="text-[#E8A020]" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#0F1C3F] font-['Lexend_Deca']">
                  Keamanan &amp; Pengacakan
                </h2>
                <p className="text-[11px] text-[#98A2B3] mt-0.5">
                  Acak urutan soal dan pilihan jawaban
                </p>
              </div>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="randomizeQuestions"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between gap-3 rounded-xl border border-[#E4E7EC] p-4 bg-[#F8F9FB]">
                    <div>
                      <FormLabel className="text-sm font-medium text-[#101828] cursor-pointer">
                        Acak Urutan Soal
                      </FormLabel>
                      <p className="text-xs text-[#98A2B3] mt-0.5">
                        Urutan soal berbeda untuk setiap peserta
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSubmitting}
                        className="data-[state=checked]:bg-[#0F1C3F] shrink-0"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="randomizeOptions"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between gap-3 rounded-xl border border-[#E4E7EC] p-4 bg-[#F8F9FB]">
                    <div>
                      <FormLabel className="text-sm font-medium text-[#101828] cursor-pointer">
                        Acak Pilihan Jawaban
                      </FormLabel>
                      <p className="text-xs text-[#98A2B3] mt-0.5">
                        Posisi opsi A/B/C/D berbeda per soal
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSubmitting}
                        className="data-[state=checked]:bg-[#0F1C3F] shrink-0"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Section 3: Daftar Pertanyaan */}
          <div className="rounded-xl border border-[#E4E7EC] bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 bg-[#F8F9FB] border-b border-[#E4E7EC]">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-[#E8EDF7] flex items-center justify-center">
                  <span className="text-[10px] font-bold text-[#0F1C3F]">Q</span>
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#0F1C3F] font-['Lexend_Deca']">
                    Daftar Pertanyaan
                  </h2>
                  <p className="text-[11px] text-[#98A2B3] mt-0.5">
                    {fields.length} soal · Pastikan 1 kunci benar per soal
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#FEF3DC] text-[#C4861A] border border-[#F5C05A]">
                {fields.length} soal
              </span>
            </div>

            <div className="p-5 space-y-4">

              {/* Question cards */}
              {fields.map((field, index) => (
                <QuestionCard
                  key={field.id}
                  index={index}
                  form={form}
                  isSubmitting={isSubmitting}
                  canDelete={fields.length > 1}
                  onRemove={() => remove(index)}
                  isExpanded={expandedQuestions[index] !== false}
                  onToggle={() => toggleQuestion(index)}
                />
              ))}

              {/* Add question button */}
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() =>
                  append({
                    text: "",
                    options: [
                      { text: "", isCorrect: true },
                      { text: "", isCorrect: false },
                      { text: "", isCorrect: false },
                      { text: "", isCorrect: false },
                    ],
                  })
                }
                className="flex w-full items-center gap-3 rounded-xl border-2 border-dashed border-[#E4E7EC] bg-[#F8F9FB] p-4 text-[#475467] transition-all hover:border-[#0F1C3F]/30 hover:bg-white hover:text-[#0F1C3F] group"
              >
                <div className="h-10 w-10 rounded-xl border border-[#E4E7EC] bg-white flex items-center justify-center shrink-0">
                  <Plus size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold">Tambah Pertanyaan</p>
                  <p className="text-xs text-[#98A2B3] mt-0.5">Tambah satu butir soal di akhir daftar</p>
                </div>
              </button>

              {/* Sticky Footer */}
              <div className="sticky bottom-0 z-10 flex items-center justify-between gap-3 rounded-xl border border-[#E4E7EC] bg-white p-4 shadow-lg">
                <Link
                  href={`/admin/courses/${courseId}?step=2`}
                  onClick={(e) => {
                    if (isDirty) {
                      e.preventDefault();
                      onNavigateWithCheck(`/admin/courses/${courseId}?step=2`);
                    }
                  }}
                  className="flex items-center gap-2 h-10 px-4 rounded-xl border border-[#E4E7EC] bg-white text-sm font-semibold text-[#475467] hover:border-[#0F1C3F]/30 hover:bg-[#F8F9FB] transition-all"
                >
                  <ArrowLeft size={14} />
                  Kembali
                </Link>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#98A2B3]">
                    {fields.length} soal · 1 kunci/soal
                  </span>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-10 px-5 rounded-xl bg-[#E8A020] hover:bg-[#C4861A] text-white font-semibold text-sm shadow-sm transition-all active:scale-[0.97] flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        Menyimpan…
                      </>
                    ) : (
                      <>
                        Simpan Tes
                        <Sparkles size={14} />
                      </>
                    )}
                  </Button>
                </div>
              </div>

            </div>
          </div>

        </form>
      </Form>
    </>
  );
}

/* ─────────────────────────────────────────────
   QuestionCard sub-component
───────────────────────────────────────────── */

function QuestionCard({
  index,
  form,
  isSubmitting,
  canDelete,
  onRemove,
  isExpanded,
  onToggle,
}: {
  index: number;
  form: any;
  isSubmitting: boolean;
  canDelete: boolean;
  onRemove: () => void;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const options = form.watch(`questions.${index}.options`) as { text: string; isCorrect: boolean }[];
  const hasCorrectAnswer = options?.some((o) => o.isCorrect);

  const setCorrect = (optIndex: number) => {
    const updated = options.map((opt, i) => ({ ...opt, isCorrect: i === optIndex }));
    form.setValue(`questions.${index}.options`, updated);
  };

  const removeOption = (optIndex: number) => {
    const updated = options.filter((_, i) => i !== optIndex);
    if (options[optIndex].isCorrect && updated.length > 0) updated[0].isCorrect = true;
    form.setValue(`questions.${index}.options`, updated);
  };

  const addOption = () => {
    form.setValue(`questions.${index}.options`, [
      ...options,
      { text: "", isCorrect: false },
    ]);
  };

  return (
    <div
      className={cn(
        "rounded-xl border overflow-hidden transition-all",
        hasCorrectAnswer
          ? "border-[#E4E7EC] bg-white shadow-sm"
          : "border-red-200 bg-red-50/30"
      )}
    >
      {/* Top accent stripe */}
      <div className={cn("h-1 w-full", hasCorrectAnswer ? "bg-[#0F1C3F]" : "bg-red-400")} />

      <div className="p-4 space-y-3">
        {/* Card header row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0F1C3F] text-xs font-bold text-[#E8A020]">
              {index + 1}
            </div>
            <span className="text-xs font-semibold text-[#98A2B3]">Pertanyaan</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onToggle}
              className="flex items-center gap-1 h-7 px-2.5 rounded-lg text-[10px] font-semibold text-[#475467] bg-[#F1F3F7] hover:bg-[#E4E7EC] transition-colors"
            >
              {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {isExpanded ? "Sembunyikan" : "Edit"}
            </button>
            <button
              type="button"
              disabled={isSubmitting || !canDelete}
              onClick={onRemove}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#E4E7EC] text-[#98A2B3] hover:border-red-300 hover:bg-red-50 hover:text-red-500 transition-all disabled:cursor-not-allowed disabled:opacity-30"
            >
              <Trash size={12} />
            </button>
          </div>
        </div>

        {/* Question text — always visible */}
        <FormField
          control={form.control}
          name={`questions.${index}.text`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <textarea
                  {...field}
                  disabled={isSubmitting}
                  placeholder="Tulis pertanyaan di sini… (min. 10 karakter)"
                  className={cn(
                    "min-h-[3.5rem] w-full resize-y rounded-xl border bg-white px-4 py-3 text-sm text-[#101828] placeholder:text-[#98A2B3] focus:border-[#0F1C3F] focus:ring-2 focus:ring-[#0F1C3F]/10 focus:outline-none transition-all",
                    !hasCorrectAnswer ? "border-red-300" : "border-[#E4E7EC]"
                  )}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Options — collapsible */}
        {isExpanded && (
          <div className="space-y-2 pt-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#98A2B3]">
              Pilihan Jawaban
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {options.map((opt, optIndex) => (
                <div key={optIndex} className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setCorrect(optIndex)}
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 text-sm font-bold transition-all",
                      opt.isCorrect
                        ? "border-[#E8A020] bg-[#0F1C3F] text-[#E8A020] shadow-sm"
                        : "border-[#E4E7EC] bg-white text-[#98A2B3] hover:border-[#0F1C3F]/40"
                    )}
                  >
                    {opt.isCorrect ? (
                      <CheckCircle2 size={14} />
                    ) : (
                      OPTION_LABELS[optIndex]
                    )}
                  </button>
                  <div className="group/opt relative flex-1">
                    <FormField
                      control={form.control}
                      name={`questions.${index}.options.${optIndex}.text`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input
                              {...field}
                              disabled={isSubmitting}
                              placeholder={`Opsi ${OPTION_LABELS[optIndex]}`}
                              className={cn(
                                "h-9 rounded-xl border text-sm transition-all",
                                opt.isCorrect
                                  ? "border-[#E8A020] bg-[#FEF3DC] focus:ring-[#E8A020]/20"
                                  : "border-[#E4E7EC] bg-white"
                              )}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(optIndex)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[#98A2B3] opacity-0 transition-all hover:text-red-500 group-hover/opt:opacity-100"
                      >
                        <Trash size={11} />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {options.length < 6 && (
                <button
                  type="button"
                  onClick={addOption}
                  className="flex h-9 items-center gap-1.5 rounded-xl border border-dashed border-[#E4E7EC] px-3 text-xs font-medium text-[#98A2B3] hover:border-[#0F1C3F]/40 hover:text-[#475467] transition-all"
                >
                  <Plus size={12} />
                  Tambah opsi
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
