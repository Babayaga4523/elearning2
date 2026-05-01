"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  BookPlus,
  ArrowLeft,
  Sparkles,
  Info,
  ChevronRight,
  Layers,
  Loader2,
  CheckCircle2,
} from "lucide-react";

import {
  Form,
  FormControl,
  FormField,
  FormLabel,
  FormMessage,
  FormItem,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { createCourse } from "@/actions/course";

const formSchema = z.object({
  title: z.string().min(1, { message: "Judul kursus wajib diisi" }),
});

const STEPS = [
  { num: 1, label: "Identitas" },
  { num: 2, label: "Kurikulum" },
  { num: 3, label: "Pengaturan" },
  { num: 4, label: "Publikasi" },
];

const TIPS = [
  "Gunakan judul yang ringkas dan menggambarkan isi materi.",
  "Hindari singkatan yang tidak umum dikenal karyawan.",
  "Judul bisa diubah kembali setelah kursus dibuat.",
];

const CreatePage = () => {
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { title: "" },
  });

  const { isSubmitting, isValid } = form.formState;
  const titleValue = form.watch("title");

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const course = await createCourse(values);
      toast.success("Kursus berhasil dibuat!");
      router.push(`/admin/courses/${course.id}?step=2`);
    } catch {
      toast.error("Terjadi kesalahan saat membuat kursus.");
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-slate-50">
      {/* Top accent bar */}
      <div className="h-1 w-full shrink-0 bg-gradient-to-r from-[#0F1C3F] to-[#E8A020]" />

      {/* Nav row */}
      <div className="px-6 py-4 flex items-center justify-between shrink-0 bg-white border-b border-slate-100">
        <Link
          href="/admin/courses"
          className="inline-flex items-center gap-2.5 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-[#0F1C3F] transition-colors group"
        >
          <span className="flex items-center justify-center h-8 w-8 rounded-full border border-slate-200 group-hover:border-[#0F1C3F] group-hover:bg-[#0F1C3F] transition-all">
            <ArrowLeft className="h-3.5 w-3.5 group-hover:text-white transition-colors" />
          </span>
          Katalog Kursus
        </Link>

        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-[#0F1C3F] flex items-center justify-center">
            <Layers className="h-3.5 w-3.5 text-[#E8A020]" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hidden sm:block">
            Admin Panel
          </span>
        </div>
      </div>

      {/* Main */}
      <div className="flex flex-1 items-start justify-center px-4 py-8 md:px-6 md:py-12">
        <div className="w-full max-w-xl space-y-5">

          {/* Step Indicator */}
          <Card className="rounded-2xl border-slate-100 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-0">
                {STEPS.map((step, i) => (
                  <div key={step.num} className="flex items-center flex-1 min-w-0">
                    <div className="flex flex-col items-center gap-1.5 min-w-0">
                      <div
                        className={`h-8 w-8 rounded-xl flex items-center justify-center font-black text-xs transition-all ${
                          step.num === 1
                            ? "bg-[#0F1C3F] text-[#E8A020] shadow-lg shadow-[#0F1C3F]/20"
                            : "bg-slate-100 text-slate-300"
                        }`}
                      >
                        {step.num}
                      </div>
                      <p
                        className={`text-[9px] font-black uppercase tracking-widest hidden sm:block ${
                          step.num === 1 ? "text-[#0F1C3F]" : "text-slate-300"
                        }`}
                      >
                        {step.label}
                      </p>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className="flex-1 h-0.5 mx-2 bg-slate-100" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Form Card */}
          <Card className="rounded-2xl border-slate-100 shadow-sm overflow-hidden">
            {/* Navy Header */}
            <div className="relative px-6 md:px-8 py-7 bg-gradient-to-br from-[#0F1C3F] to-[#1A2E5A] overflow-hidden">
              {/* Decorative glow */}
              <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full pointer-events-none opacity-20 bg-[radial-gradient(circle,#E8A020,transparent_70%)]" />
              <div className="absolute inset-0 opacity-[0.03] bg-[repeating-linear-gradient(45deg,#fff_0,transparent_1px,transparent_24px,#fff_25px)] [background-size:35px_35px]" />

              <div className="relative z-10 flex items-start gap-4">
                <div className="h-11 w-11 rounded-xl bg-[#E8A020]/15 border border-[#E8A020]/30 flex items-center justify-center shrink-0">
                  <BookPlus className="h-5 w-5 text-[#E8A020]" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#E8A020]/70 mb-1">
                    Langkah 1 dari 4 · Siapkan Kursus
                  </p>
                  <CardTitle className="text-xl font-bold text-white leading-tight">
                    Identitas Kursus
                  </CardTitle>
                  <CardDescription className="text-xs text-white/45 mt-1 leading-relaxed">
                    Beri nama yang tepat untuk kursus Anda. Bisa diubah kapan saja.
                  </CardDescription>
                </div>
              </div>
            </div>

            {/* Form Body */}
            <CardContent className="p-6 md:p-8 space-y-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <div className="flex items-center justify-between">
                          <FormLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                            Judul Kursus
                          </FormLabel>
                          <Badge variant="outline" className="text-[10px] font-bold text-[#E8A020] border-[#E8A020]/30 bg-[#E8A020]/5 gap-1">
                            <Sparkles className="h-2.5 w-2.5" />
                            Wajib
                          </Badge>
                        </div>

                        <FormControl>
                          <div className="relative">
                            <Input
                              disabled={isSubmitting}
                              placeholder="Contoh: Pengenalan Budaya BNI Finance"
                              className="h-11 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-[#0F1C3F]/20 focus-visible:border-[#0F1C3F] font-semibold text-[#0F1C3F] placeholder:text-slate-300 transition-all"
                              {...field}
                            />
                            {titleValue && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                              </div>
                            )}
                          </div>
                        </FormControl>

                        <FormMessage className="text-xs font-bold text-rose-500" />

                        {/* Tips Box */}
                        <Card className="rounded-xl border-slate-100 bg-slate-50/80">
                          <CardContent className="p-4 space-y-3">
                            <p className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 text-slate-400">
                              <Info className="h-3.5 w-3.5" />
                              Tips Penamaan
                            </p>
                            {TIPS.map((tip, i) => (
                              <p
                                key={i}
                                className="text-xs font-medium flex items-start gap-2 leading-relaxed text-slate-500"
                              >
                                <span className="shrink-0 h-4 w-4 rounded-md flex items-center justify-center text-[9px] font-black mt-0.5 bg-slate-200 text-slate-400">
                                  {i + 1}
                                </span>
                                {tip}
                              </p>
                            ))}
                          </CardContent>
                        </Card>
                      </FormItem>
                    )}
                  />

                  {/* Preview Badge */}
                  {titleValue && (
                    <Card className="rounded-xl border-indigo-100 bg-gradient-to-r from-indigo-50 to-slate-50">
                      <CardContent className="p-3 flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                          <BookPlus className="h-4 w-4 text-indigo-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-300 mb-0.5">
                            Preview Kursus
                          </p>
                          <p className="text-sm font-bold text-[#0F1C3F] truncate">{titleValue}</p>
                        </div>
                        <Badge className="bg-[#FFF8E7] text-[#E8A020] hover:bg-[#FFF8E7] border-[#E8A020]/20 text-[9px] font-black shrink-0">
                          Draft
                        </Badge>
                      </CardContent>
                    </Card>
                  )}

                  <Separator className="bg-slate-50" />

                  {/* CTA Row */}
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <Button
                      variant="outline"
                      type="button"
                      asChild
                      className="w-full sm:w-auto h-10 px-6 rounded-xl border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-wider hover:bg-slate-50"
                    >
                      <Link href="/admin/courses">Batal</Link>
                    </Button>

                    <Button
                      type="submit"
                      disabled={!isValid || isSubmitting}
                      className="flex-1 w-full sm:w-auto h-10 px-8 rounded-xl bg-[#0F1C3F] hover:bg-[#1A3060] text-white font-bold text-[11px] uppercase tracking-wider gap-2.5 shadow-lg shadow-[#0F1C3F]/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Membuat Kursus...
                        </>
                      ) : (
                        <>
                          Lanjutkan ke Setup
                          <ChevronRight className="h-4 w-4 text-[#E8A020]" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Footer Label */}
          <p className="text-center text-[10px] font-black uppercase tracking-[0.25em] text-slate-300">
            HCMS E-Learning · BNI Finance
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreatePage;