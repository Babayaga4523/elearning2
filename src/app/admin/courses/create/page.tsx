"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { BookPlus, ArrowLeft, Sparkles, Info, ChevronRight, Layers } from "lucide-react";

import {
  Form,
  FormControl,
  FormField,
  FormLabel,
  FormMessage,
  FormItem,
} from "@/components/ui/form";
import { createCourse } from "@/actions/course";
import { CourseWizard } from "@/components/admin/CourseWizard";

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
    <div
      className="flex min-h-screen w-full min-w-0 flex-col"
      style={{ background: "#F0F2F7", fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* ── Top accent bar ── */}
      <div
        className="h-1 w-full shrink-0"
        style={{ background: "linear-gradient(90deg, #0F1C3F 0%, #E8A020 100%)" }}
      />

      {/* ── Nav row ── */}
      <div className="px-6 py-4 flex items-center justify-between shrink-0">
        <Link
          href="/admin/courses"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-all group"
          style={{ color: "#7A8599" }}
        >
          <span className="flex items-center justify-center h-8 w-8 rounded-full border border-slate-300 group-hover:border-[#0F1C3F] group-hover:bg-[#0F1C3F] transition-all">
            <ArrowLeft className="h-3.5 w-3.5 group-hover:text-white transition-colors" />
          </span>
          Katalog Kursus
        </Link>

        <div className="flex items-center gap-2">
          <div
            className="h-7 w-7 rounded-lg flex items-center justify-center"
            style={{ background: "#0F1C3F" }}
          >
            <Layers className="h-3.5 w-3.5" style={{ color: "#E8A020" }} />
          </div>
          <span
            className="text-[10px] font-black uppercase tracking-[0.2em] hidden sm:block"
            style={{ color: "#9AAABF" }}
          >
            Admin Panel
          </span>
        </div>
      </div>

      {/* ── Main ── */}
      <div className="flex flex-1 items-start justify-center px-4 py-6 md:px-6 md:py-8">
        <div className="w-full min-w-0 max-w-2xl space-y-6">

          {/* ── Wizard Steps ── */}
          <div
            className="rounded-2xl p-5 flex items-center gap-0"
            style={{
              background: "white",
              border: "1px solid #E2E6F0",
              boxShadow: "0 1px 4px rgba(15,28,63,0.06)",
            }}
          >
            {STEPS.map((step, i) => (
              <div key={step.num} className="flex items-center flex-1 min-w-0">
                {/* Step */}
                <div className="flex flex-col items-center gap-1.5 min-w-0">
                  <div
                    className="h-8 w-8 rounded-xl flex items-center justify-center font-black text-xs transition-all"
                    style={{
                      background: step.num === 1 ? "#0F1C3F" : "#F0F2F7",
                      color: step.num === 1 ? "#E8A020" : "#C5CEDF",
                      boxShadow: step.num === 1 ? "0 2px 8px rgba(15,28,63,0.2)" : "none",
                    }}
                  >
                    {step.num}
                  </div>
                  <p
                    className="text-[9px] font-black uppercase tracking-widest hidden sm:block"
                    style={{ color: step.num === 1 ? "#0F1C3F" : "#C5CEDF" }}
                  >
                    {step.label}
                  </p>
                </div>
                {/* Connector */}
                {i < STEPS.length - 1 && (
                  <div
                    className="flex-1 h-0.5 mx-2"
                    style={{ background: "#F0F2F7" }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* ── Form Card ── */}
          <div
            className="rounded-3xl overflow-hidden shadow-xl"
            style={{
              background: "white",
              border: "1px solid #E2E6F0",
            }}
          >
            {/* Card header — Navy banner */}
            <div
              className="relative px-8 md:px-12 py-10 overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #0F1C3F 0%, #1A2E5A 100%)",
              }}
            >
              {/* Decorative glow */}
              <div
                className="absolute -top-16 -right-16 h-48 w-48 rounded-full pointer-events-none opacity-20"
                style={{ background: "radial-gradient(circle, #E8A020, transparent 70%)" }}
              />
              <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(45deg,#fff 0,transparent 1px,transparent 24px,#fff 25px)",
                  backgroundSize: "35px 35px",
                }}
              />

              <div className="relative z-10 flex items-start gap-5">
                <div
                  className="h-14 w-14 rounded-2xl flex items-center justify-center shrink-0"
                  style={{
                    background: "rgba(232,160,32,0.15)",
                    border: "1px solid rgba(232,160,32,0.3)",
                  }}
                >
                  <BookPlus className="h-7 w-7" style={{ color: "#E8A020" }} />
                </div>
                <div>
                  <p
                    className="text-[10px] font-black uppercase tracking-[0.2em] mb-1.5"
                    style={{ color: "rgba(232,160,32,0.7)" }}
                  >
                    Langkah 1 dari 4: Siapkan Kursus
                  </p>
                  <h1
                    className="text-2xl md:text-3xl font-black text-white leading-tight"
                    style={{ fontFamily: "'Lexend Deca', sans-serif" }}
                  >
                    Identitas Kursus
                  </h1>
                  <p
                    className="text-sm font-medium mt-1.5 leading-relaxed"
                    style={{ color: "rgba(255,255,255,0.45)" }}
                  >
                    Beri nama yang tepat untuk kursus Anda. Bisa diubah kapan saja.
                  </p>
                </div>
              </div>
            </div>

            {/* Form body */}
            <div className="px-8 md:px-12 py-10 space-y-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem className="space-y-4">
                        <div className="flex items-center justify-between">
                          <FormLabel
                            className="text-[10px] font-black uppercase tracking-[0.2em]"
                            style={{ color: "#9AAABF" }}
                          >
                            Judul Kursus
                          </FormLabel>
                          <span
                            className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest"
                            style={{ color: "#E8A020" }}
                          >
                            <Sparkles className="h-3 w-3" />
                            Wajib
                          </span>
                        </div>

                        <FormControl>
                          <div className="relative">
                            <input
                              disabled={isSubmitting}
                              placeholder="Contoh: Pengenalan Budaya BNI Finance"
                              className="w-full h-14 px-5 rounded-2xl text-base font-semibold outline-none transition-all disabled:opacity-50"
                              style={{
                                background: "#F8FAFC",
                                border: `2px solid ${titleValue ? "#0F1C3F" : "#E2E6F0"}`,
                                color: "#0F1C3F",
                              }}
                              {...field}
                              onFocus={(e) => {
                                e.target.style.borderColor = "#0F1C3F";
                                e.target.style.background = "white";
                                e.target.style.boxShadow = "0 0 0 4px rgba(15,28,63,0.06)";
                              }}
                              onBlur={(e) => {
                                e.target.style.borderColor = titleValue ? "#0F1C3F" : "#E2E6F0";
                                e.target.style.background = "#F8FAFC";
                                e.target.style.boxShadow = "none";
                              }}
                            />
                            {/* Character preview */}
                            {titleValue && (
                              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                <div
                                  className="h-5 w-5 rounded-full flex items-center justify-center"
                                  style={{ background: "#F0FDF4" }}
                                >
                                  <span style={{ color: "#10B981", fontSize: "10px" }}>✓</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </FormControl>

                        <FormMessage
                          className="text-xs font-bold"
                          style={{ color: "#EF4444" }}
                        />

                        {/* Tips box */}
                        <div
                          className="rounded-2xl p-4 space-y-2"
                          style={{
                            background: "#F8FAFC",
                            border: "1px solid #E8ECF5",
                          }}
                        >
                          <p
                            className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 mb-3"
                            style={{ color: "#9AAABF" }}
                          >
                            <Info className="h-3.5 w-3.5" />
                            Tips Penamaan
                          </p>
                          {TIPS.map((tip, i) => (
                            <p
                              key={i}
                              className="text-xs font-medium flex items-start gap-2 leading-relaxed"
                              style={{ color: "#7A8599" }}
                            >
                              <span
                                className="shrink-0 h-4 w-4 rounded-md flex items-center justify-center text-[9px] font-black mt-0.5"
                                style={{ background: "#E8ECF5", color: "#9AAABF" }}
                              >
                                {i + 1}
                              </span>
                              {tip}
                            </p>
                          ))}
                        </div>
                      </FormItem>
                    )}
                  />

                  {/* Preview badge */}
                  {titleValue && (
                    <div
                      className="flex items-center gap-3 p-4 rounded-2xl transition-all"
                      style={{
                        background: "linear-gradient(135deg, #F0F4FF, #F8F9FF)",
                        border: "1px solid #C7D2FE",
                      }}
                    >
                      <div
                        className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: "#EEF2FF" }}
                      >
                        <BookPlus className="h-5 w-5" style={{ color: "#6366F1" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-[9px] font-black uppercase tracking-widest mb-0.5"
                          style={{ color: "#9AAABF" }}
                        >
                          Preview Kursus
                        </p>
                        <p
                          className="text-sm font-black truncate"
                          style={{ color: "#0F1C3F" }}
                        >
                          {titleValue}
                        </p>
                      </div>
                      <span
                        className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg shrink-0"
                        style={{ background: "#FFF8E7", color: "#E8A020" }}
                      >
                        Draft
                      </span>
                    </div>
                  )}

                  {/* CTA row */}
                  <div
                    className="flex flex-col sm:flex-row items-center gap-3 pt-6"
                    style={{ borderTop: "1px solid #F0F2F7" }}
                  >
                    <Link href="/admin/courses" className="w-full sm:w-auto">
                      <button
                        type="button"
                        className="w-full h-12 px-6 rounded-xl font-black text-sm uppercase tracking-wider transition-all hover:brightness-95"
                        style={{
                          background: "#F0F2F7",
                          border: "1px solid #D6DBE8",
                          color: "#5A6480",
                        }}
                      >
                        Batal
                      </button>
                    </Link>

                    <button
                      type="submit"
                      disabled={!isValid || isSubmitting}
                      className="flex-1 w-full sm:w-auto h-12 px-8 rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        background:
                          isValid && !isSubmitting
                            ? "linear-gradient(135deg, #0F1C3F, #1A3060)"
                            : "#D6DBE8",
                        color: isValid && !isSubmitting ? "white" : "#9AAABF",
                        boxShadow:
                          isValid && !isSubmitting
                            ? "0 4px 20px rgba(15,28,63,0.25)"
                            : "none",
                      }}
                    >
                      {isSubmitting ? (
                        <>
                          <div
                            className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin"
                          />
                          Membuat Kursus...
                        </>
                      ) : (
                        <>
                          Lanjutkan ke Setup
                          <ChevronRight className="h-4 w-4" style={{ color: isValid ? "#E8A020" : "#9AAABF" }} />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </Form>
            </div>
          </div>

          {/* Bottom label */}
          <p
            className="text-center text-[10px] font-black uppercase tracking-[0.25em]"
            style={{ color: "#C5CEDF" }}
          >
            HCMS E-Learning · BNI Finance
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreatePage;