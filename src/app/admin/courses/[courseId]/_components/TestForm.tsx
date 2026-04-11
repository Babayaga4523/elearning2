"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { upsertTest } from "../actions";
import { ArrowLeft, Plus, Trash, Hash, Shuffle, CheckCircle2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConfirmDraftDialog } from "@/components/admin/ConfirmDraftDialog";

const OPTION_LABELS = ["A", "B", "C", "D", "E", "F"];

const formSchema = z.object({
  type: z.enum(["PRE", "POST"]),
  duration: z.coerce.number().min(1, "Durasi minimal 1 menit"),
  passingScore: z.coerce.number().min(0).max(100),
  maxAttempts: z.coerce.number().int().min(0),
  randomizeQuestions: z.boolean(),
  randomizeOptions: z.boolean(),
  questions: z.array(
    z.object({
      text: z.string().min(10, "Pertanyaan minimal 10 karakter"),
      options: z
        .array(
          z.object({
            text: z.string().min(1, "Opsi wajib diisi"),
            isCorrect: z.boolean(),
          })
        )
        .min(2, "Minimal 2 opsi"),
    })
  ),
});

interface TestFormProps {
  courseId: string;
  initialData?: any;
  type: "PRE_TEST" | "POST_TEST";
  isCoursePublished?: boolean;
}

export const TestForm = ({
  courseId,
  initialData,
  type,
  isCoursePublished,
}: TestFormProps) => {
  const router = useRouter();
  const [showDraftConfirm, setShowDraftConfirm] = useState(false);
  const [pendingValues, setPendingValues] =
    useState<z.infer<typeof formSchema> | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);

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

      <div className="w-full min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/50 px-3 py-2.5 md:px-4">
          <button
            type="button"
            onClick={() => onNavigateWithCheck(`/admin/courses/${courseId}`)}
            className="group inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Kembali ke detail kursus
          </button>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-5 px-3 py-5 md:space-y-6 md:px-4 md:py-6"
          >
          <section className="space-y-4">
          <SectionHeader step={1} title="Langkah 1: Pengaturan tes" badge="Umum & keamanan" />

          <ConfigCard accentColor="navy">
            <CardHeading icon={<Hash className="h-4 w-4 text-[#0F1C3F]" />} label="Aturan penilaian" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-4">
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FieldLabel>Durasi pengerjaan</FieldLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        placeholder="60"
                        disabled={isSubmitting}
                        className={inputCls}
                      />
                    </FormControl>
                    <FormDescription className={hintCls}>Dalam satuan menit</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="passingScore"
                render={({ field }) => (
                  <FormItem>
                    <FieldLabel>Passing score (%)</FieldLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        placeholder="70"
                        disabled={isSubmitting}
                        className={inputCls}
                      />
                    </FormControl>
                    <FormDescription className={hintCls}>Nilai minimum 0–100</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maxAttempts"
                render={({ field }) => (
                  <FormItem>
                    <FieldLabel>Batas percobaan</FieldLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        disabled={isSubmitting}
                        className={inputCls}
                      />
                    </FormControl>
                    <FormDescription className={hintCls}>0 = tidak terbatas</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </ConfigCard>

          {/* Keamanan */}
          <ConfigCard accentColor="amber">
            <CardHeading icon={<Shuffle className="h-4 w-4 text-[#E8A020]" />} label="Kecurangan & keamanan" />
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <FormField
                control={form.control}
                name="randomizeQuestions"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/80 p-3">
                    <div className="min-w-0 pr-2">
                      <FormLabel className="text-sm font-medium text-slate-900 cursor-pointer">
                        Acak urutan soal
                      </FormLabel>
                      <FormDescription className={hintCls}>
                        Urutan butir berbeda tiap peserta
                      </FormDescription>
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
                  <FormItem className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/80 p-3">
                    <div className="min-w-0 pr-2">
                      <FormLabel className="text-sm font-medium text-slate-900 cursor-pointer">
                        Acak pilihan jawaban
                      </FormLabel>
                      <FormDescription className={hintCls}>
                        Posisi opsi A/B/C/D diacak per soal
                      </FormDescription>
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
          </ConfigCard>
          </section>

          <section className="space-y-4 border-t border-slate-100 pt-6 md:pt-8">
            <SectionHeader
              step={2}
              title="Langkah 2: Daftar pertanyaan"
              badge={`${fields.length} soal`}
              badgeVariant="amber"
            />

          <div className="space-y-3">
            {fields.map((field, index) => (
              <QuestionCard
                key={field.id}
                index={index}
                form={form}
                isSubmitting={isSubmitting}
                canDelete={fields.length > 1}
                onRemove={() => remove(index)}
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
              className="group flex w-full items-center justify-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50/50 py-3.5 text-slate-500 transition-colors hover:border-slate-400 hover:bg-slate-100 hover:text-slate-800"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white">
                <Plus className="h-4 w-4" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">Tambah pertanyaan</p>
                <p className="text-xs text-slate-500">Tambah satu butir soal di akhir daftar</p>
              </div>
            </button>
          </div>
          </section>

          <div className="sticky bottom-2 z-20 mt-6 flex flex-col gap-3 rounded-lg border border-slate-700 bg-[#0F1C3F] p-3 shadow-md sm:bottom-3 sm:flex-row sm:items-center sm:justify-between sm:p-4 md:mt-8 border-l-4 border-l-[#E8A020]">
            <div className="min-w-0 text-sm text-slate-200">
              <span className="font-medium text-white">{fields.length} pertanyaan</span>
              <span className="text-slate-400"> · </span>
              <span className="text-slate-300">Pastikan satu kunci benar per soal</span>
            </div>
            <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:justify-end sm:gap-2">
              <Button
                variant="ghost"
                type="button"
                disabled={isSubmitting}
                onClick={() => onNavigateWithCheck("back")}
                className="h-9 rounded-md px-3 text-sm text-slate-300 hover:bg-white/10 hover:text-white"
              >
                Batalkan
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex h-9 items-center justify-center gap-1.5 rounded-md bg-[#E8A020] px-4 text-sm font-medium text-[#0F1C3F] hover:bg-[#d4921c]"
              >
                {isSubmitting ? (
                  "Menyimpan…"
                ) : (
                  <>
                    Simpan
                    <Sparkles className="h-3.5 w-3.5 opacity-90" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
    </>
  );
};

/* ─────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────── */

function SectionHeader({
  step,
  title,
  badge,
  badgeVariant = "ghost",
}: {
  step: number;
  title: string;
  badge: string;
  badgeVariant?: "ghost" | "amber";
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg bg-[#0F1C3F] px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:py-2">
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-[#E8A020] text-xs font-semibold text-[#0F1C3F]">
          {step}
        </div>
        <span className="text-sm font-medium text-white">{title}</span>
      </div>
      <span
        className={cn(
          "w-fit shrink-0 rounded px-2 py-0.5 text-xs font-medium sm:ml-auto",
          badgeVariant === "amber"
            ? "bg-[#E8A020] text-[#0F1C3F]"
            : "bg-white/15 text-white/80"
        )}
      >
        {badge}
      </span>
    </div>
  );
}

function ConfigCard({
  children,
  accentColor,
}: {
  children: React.ReactNode;
  accentColor: "navy" | "amber";
}) {
  return (
    <div
      className={cn(
        "space-y-3 rounded-lg border border-slate-200 bg-white p-4",
        accentColor === "navy" ? "border-l-[3px] border-l-[#0F1C3F]" : "border-l-[3px] border-l-[#E8A020]"
      )}
    >
      {children}
    </div>
  );
}

function CardHeading({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-slate-50">
        {icon}
      </div>
      <span className="text-sm font-semibold text-slate-900">{label}</span>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <FormLabel className="text-sm font-medium text-slate-700">{children}</FormLabel>
  );
}

function QuestionCard({
  index,
  form,
  isSubmitting,
  canDelete,
  onRemove,
}: {
  index: number;
  form: any;
  isSubmitting: boolean;
  canDelete: boolean;
  onRemove: () => void;
}) {
  const options = form.watch(`questions.${index}.options`) as {
    text: string;
    isCorrect: boolean;
  }[];

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
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="h-0.5 bg-[#0F1C3F]" />

      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-[#0F1C3F] text-xs font-semibold text-[#E8A020]">
              {index + 1}
            </div>
            <span className="text-xs text-slate-500">Pertanyaan</span>
          </div>
          <button
            type="button"
            disabled={isSubmitting || !canDelete}
            onClick={onRemove}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-400 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Trash className="h-4 w-4" />
          </button>
        </div>

        <FormField
          control={form.control}
          name={`questions.${index}.text`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <textarea
                  {...field}
                  disabled={isSubmitting}
                  placeholder="Tulis pertanyaan (min. 10 karakter)"
                  className="min-h-[4.5rem] w-full resize-y rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-[#0F1C3F] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0F1C3F]/20"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 md:gap-2">
          {options.map((opt, optIndex) => (
            <div key={optIndex} className="flex items-center gap-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setCorrect(optIndex)}
                title={opt.isCorrect ? "Jawaban benar" : "Set sebagai kunci"}
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-md border text-sm font-medium transition-colors",
                  opt.isCorrect
                    ? "border-[#E8A020] bg-[#0F1C3F] text-[#E8A020]"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                )}
              >
                {opt.isCorrect ? (
                  <CheckCircle2 className="h-4 w-4" aria-hidden />
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
                            "h-9 rounded-md border pr-8 text-sm",
                            opt.isCorrect
                              ? "border-slate-300 bg-slate-50 focus-visible:ring-[#0F1C3F]/15"
                              : "border-slate-200 bg-white"
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
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 opacity-0 transition-opacity hover:text-rose-500 group-hover/opt:opacity-100"
                  >
                    <Trash className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {options.length < 6 && (
            <button
              type="button"
              onClick={addOption}
              className="flex h-9 items-center justify-center gap-1 rounded-md border border-dashed border-slate-300 text-xs font-medium text-slate-500 transition-colors hover:border-slate-400 hover:bg-slate-50 hover:text-slate-800"
            >
              <Plus className="h-3.5 w-3.5" /> Tambah opsi
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Shared style constants ── */
const inputCls =
  "h-9 rounded-md border-slate-200 bg-white text-sm focus-visible:border-[#0F1C3F] focus-visible:ring-1 focus-visible:ring-[#0F1C3F]/20";
const hintCls = "text-xs text-slate-500";