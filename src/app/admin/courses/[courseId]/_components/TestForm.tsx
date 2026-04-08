"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { upsertTest } from "../actions";
import { ArrowLeft, Plus, Trash, CheckCircle2, Circle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  type: z.enum(["PRE", "POST"]),
  duration: z.coerce.number().min(1, "Durasi minimal 1 menit"),
  passingScore: z.coerce.number().min(0).max(100),
  questions: z.array(z.object({
    text: z.string().min(10, "Pertanyaan minimal 10 karakter"),
    options: z.array(z.object({
      text: z.string().min(1, "Opsi wajib diisi"),
      isCorrect: z.boolean(),
    })).min(2, "Minimal 2 opsi"),
  })),
});

interface TestFormProps {
  courseId: string;
  initialData?: any;
  type: "PRE_TEST" | "POST_TEST";
}

export const TestForm = ({ courseId, initialData, type }: TestFormProps) => {
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData && initialData.questions && initialData.questions.length > 0 ? {
      type: initialData.type,
      duration: initialData.duration,
      passingScore: initialData.passingScore,
      questions: initialData.questions.map((q: any) => ({
        text: q.text,
        options: q.options.map((o: any) => ({
          text: o.text,
          isCorrect: o.isCorrect,
        })),
      })),
    } : {
      type: type === "POST_TEST" ? "POST" : "PRE",
      duration: 0,
      passingScore: 0,
      questions: [{ 
        text: "", 
        options: [
          { text: "", isCorrect: true }, 
          { text: "", isCorrect: false }, 
          { text: "", isCorrect: false }, 
          { text: "", isCorrect: false }
        ] 
      }],
    },
  });

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);

  const { isDirty } = form.formState;

  // Browser-level protection (refresh/tab close)
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

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const result = await upsertTest(courseId, values);
      if (result.success) {
        toast.success("Tes berhasil disimpan");
        router.push(`/admin/courses/${courseId}`);
        router.refresh();
      } else {
        toast.error("Gagal menyimpan tes");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    }
  };

  return (
    <>
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleConfirmExit}
      />

      <div className="mb-8">
        <button
          type="button"
          onClick={() => onNavigateWithCheck(`/admin/courses/${courseId}`)}
          className="flex items-center text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Kembali ke Course Setup
        </button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold text-slate-700">Durasi Tes (Menit)</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" disabled={isSubmitting} className="font-medium" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="passingScore"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold text-slate-700">Passing Score (%)</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" disabled={isSubmitting} className="font-medium" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Daftar Pertanyaan</h3>
                <p className="text-sm text-slate-500 font-medium">Klik centang pada opsi untuk menentukan jawaban yang benar.</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isSubmitting}
                className="font-bold border-slate-300 hover:bg-slate-50"
                onClick={() => append({
                  text: "",
                  options: [
                    { text: "", isCorrect: true },
                    { text: "", isCorrect: false },
                    { text: "", isCorrect: false },
                    { text: "", isCorrect: false }
                  ]
                })}
              >
                <Plus className="h-4 w-4 mr-2" />
                Tambah Pertanyaan
              </Button>
            </div>

            {fields.map((field, index) => (
              <Card key={field.id} className="border-slate-200 overflow-hidden shadow-sm">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <FormField
                        control={form.control}
                        name={`questions.${index}.text`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Pertanyaan #{index + 1}</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                disabled={isSubmitting}
                                placeholder="Masukkan teks pertanyaan di sini..."
                                className="font-bold border-none bg-slate-50 text-lg focus-visible:ring-2 focus-visible:ring-primary/20 px-4 py-6"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={isSubmitting}
                      onClick={() => remove(index)}
                      className="text-slate-300 hover:text-red-500 hover:bg-red-50 mt-6"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 relative">
                    {form.watch(`questions.${index}.options`).map((_, optIndex) => (
                      <div key={optIndex} className="flex items-center gap-3 group animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: `${optIndex * 50}ms` }}>
                        <div className="relative shrink-0">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={isSubmitting}
                            className={cn(
                              "h-11 w-11 rounded-xl transition-all duration-300 border-2",
                              form.getValues(`questions.${index}.options.${optIndex}.isCorrect`)
                                ? "text-white bg-emerald-500 border-emerald-500 shadow-lg shadow-emerald-200"
                                : "text-slate-400 bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50"
                            )}
                            onClick={() => {
                              const options = form.getValues(`questions.${index}.options`).map((opt, i) => ({
                                ...opt,
                                isCorrect: i === optIndex
                              }));
                              form.setValue(`questions.${index}.options`, options);
                            }}
                          >
                            <span className="text-sm font-black">{["A", "B", "C", "D", "E", "F"][optIndex]}</span>
                          </Button>
                          {form.getValues(`questions.${index}.options.${optIndex}.isCorrect`) && (
                            <div className="absolute -top-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 border-2 border-white">
                              <CheckCircle2 className="h-3 w-3" />
                            </div>
                          )}
                        </div>

                        <FormField
                          control={form.control}
                          name={`questions.${index}.options.${optIndex}.text`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <div className="relative group/input">
                                  <Input
                                    {...field}
                                    disabled={isSubmitting}
                                    placeholder={`Tuliskan opsi jawaban ${["A", "B", "C", "D", "E", "F"][optIndex]}...`}
                                    className={cn(
                                      "h-12 border-2 transition-all font-semibold rounded-xl pr-10",
                                      form.getValues(`questions.${index}.options.${optIndex}.isCorrect`)
                                        ? "bg-emerald-50/50 border-emerald-500/30 text-emerald-900"
                                        : "bg-slate-50/50 border-slate-100 focus:border-primary/30 text-slate-700"
                                    )}
                                  />
                                  {form.watch(`questions.${index}.options`).length > 2 && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const currentOptions = form.getValues(`questions.${index}.options`);
                                        const wasCorrect = currentOptions[optIndex].isCorrect;
                                        const newOptions = currentOptions.filter((_, i) => i !== optIndex);
                                        if (wasCorrect && newOptions.length > 0) {
                                          newOptions[0].isCorrect = true;
                                        }
                                        form.setValue(`questions.${index}.options`, newOptions);
                                      }}
                                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-red-500 opacity-0 group-hover/input:opacity-100 transition-opacity"
                                    >
                                      <Trash className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    ))}

                    {form.watch(`questions.${index}.options`).length < 6 && (
                      <button
                        type="button"
                        onClick={() => {
                          const currentOptions = form.getValues(`questions.${index}.options`);
                          form.setValue(`questions.${index}.options`, [
                            ...currentOptions,
                            { text: "", isCorrect: false }
                          ]);
                        }}
                        className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:border-primary/30 hover:text-primary transition-all text-sm font-bold"
                      >
                        <Plus className="h-4 w-4" /> Opsi Lainnya
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-end gap-4 pt-10 border-t items-center mt-12">
            <Button
              variant="ghost"
              type="button"
              disabled={isSubmitting}
              onClick={() => onNavigateWithCheck("back")}
              className="font-bold text-slate-500"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="font-black px-10 bg-primary shadow-lg shadow-primary/20 hover:shadow-xl transition-all"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Seluruh Tes"}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
};
