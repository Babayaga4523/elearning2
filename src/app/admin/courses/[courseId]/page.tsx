import { db } from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { 
  ArrowLeft,
  Eye,
  Settings,
  CheckCircle2,
  BookOpen,
  FileCheck,
  AlertTriangle,
  Rocket,
  BarChart3,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CourseTitleForm } from "@/components/admin/course-title-form";
import { CourseDescriptionForm } from "@/components/admin/course-description-form";
import { CourseCategoryForm } from "@/components/admin/course-category-form";
import { CourseDurationForm } from "@/components/admin/course-duration-form";
import { CourseVisibilityForm } from "@/components/admin/course-visibility-form";
import { CourseSetupClient } from "./_components/CourseSetupClient";
import { PublishButton } from "./_components/PublishButton";
import { CourseWizard } from "@/components/admin/CourseWizard";
import { Category, Module } from "@/generated/client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default async function CourseIdPage({
  params,
  searchParams
}: {
  params: { courseId: string };
  searchParams: { step?: string };
}) {
  const activeStep = Math.max(1, parseInt(searchParams.step || "2") || 2);
  const session = await auth();

  // Admin layout already handles authorization, but double-check
  if (!session || (session.user?.activeRole !== "ADMIN" && session.user?.activeRole !== "SUPER_ADMIN")) {
    return redirect("/");
  }

  const course = await db.course.findUnique({
    where: {
      id: params.courseId,
    },
    include: {
      modules: {
        orderBy: {
          position: "asc",
        },
      },
      tests: {
        include: {
          questions: {
            include: {
              options: true
            }
          },
        }
      }
    }
  });

  if (!course) {
    return redirect("/admin/courses");
  }

  const categories = await db.category.findMany({
    orderBy: {
      name: "asc",
    },
  });

  const preTest = course.tests.find(t => t.type === "PRE") || null;
  const postTest = course.tests.find(t => t.type === "POST") || null;

  const postTestValid = postTest && postTest.questions.length >= 5 && postTest.questions.every((q) => q.options.some((opt) => opt.isCorrect));

  const requiredFields = [
    course.title,
    course.description,
    course.categoryId,
    course.modules.some((module: Module) => module.isPublished),
    postTestValid,
  ];

  const totalFields = requiredFields.length;
  const completedFields = requiredFields.filter(Boolean).length;
  const isComplete = requiredFields.every(Boolean);

  return (
    <div className="flex min-h-full w-full min-w-0 flex-col bg-slate-50/50 py-6 md:py-8">
      {/* ── Top Header Bar ── */}
      <div className="mb-5 flex w-full min-w-0 flex-col gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500 md:flex-row md:items-center md:justify-between md:px-4 md:py-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0F1C3F] shadow-md shadow-[#0F1C3F]/15">
            <BookOpen className="h-5 w-5 text-[#E8A020]" />
          </div>
          <div className="min-w-0">
            <Link href="/admin/courses" className="mb-0.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-[#0F1C3F] transition-colors group">
              <ArrowLeft className="h-3 w-3 shrink-0 group-hover:-translate-x-0.5 transition-transform" />
              Katalog Kursus
            </Link>
            <h1 className="text-base font-bold tracking-tight text-[#0F1C3F] font-lexend leading-tight truncate">{course.title}</h1>
          </div>
        </div>

        <div className="w-full min-w-0 max-w-full md:max-w-md md:flex-1 lg:max-w-2xl">
          <CourseWizard activeStep={activeStep} courseId={course.id} />
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild className="h-8 gap-1.5 rounded-lg px-3 font-bold text-xs text-slate-500 border-slate-200 hover:border-[#0F1C3F] hover:text-[#0F1C3F]">
            <Link href={`/courses/${course.id}`} target="_blank">
              <Eye className="h-3.5 w-3.5" />
              Preview
            </Link>
          </Button>
          {activeStep === 4 && (
            <PublishButton 
              courseId={course.id}
              isPublished={course.isPublished}
              disabled={!isComplete}
            />
          )}
        </div>
      </div>

      <div className="w-full min-w-0 animate-in fade-in zoom-in-95 duration-700">
        {activeStep === 3 && (
           <div className="w-full max-w-3xl space-y-6 md:space-y-8">
              {/* Step 3 Header */}
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-[#0F1C3F]/5 rounded-xl flex items-center justify-center border border-[#0F1C3F]/10">
                   <Settings className="h-5 w-5 text-[#0F1C3F]" />
                </div>
                <div>
                   <h2 className="text-lg font-bold text-[#0F1C3F] font-lexend tracking-tight leading-none">Pengaturan Kursus</h2>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Detail &amp; Deadline</p>
                </div>
              </div>

              <Card className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                <CardContent className="space-y-6 p-5 md:space-y-8 md:p-6">
                   <CourseTitleForm initialData={course} courseId={course.id} />
                   <div className="h-[1px] w-full bg-slate-50" />
                   <CourseDescriptionForm initialData={course} courseId={course.id} />
                   <div className="h-[1px] w-full bg-slate-50" />
                   <CourseCategoryForm
                      initialData={course}
                      courseId={course.id}
                      options={categories.map((category: Category) => ({
                        label: category.name,
                        value: category.id,
                      }))}
                    />
                    <div className="h-[1px] w-full bg-slate-50" />
                    <CourseDurationForm 
                      initialData={{
                        deadlineDuration: course.deadlineDuration,
                        deadlineDate: course.deadlineDate,
                        lockAfterDeadline: (course as any).lockAfterDeadline ?? false,
                        gracePeriodDays: (course as any).gracePeriodDays ?? null,
                      }} 
                      courseId={course.id} 
                    />
                    <div className="h-[1px] w-full bg-slate-50" />
                    <CourseVisibilityForm initialData={course as any} courseId={course.id} />
                </CardContent>
              </Card>
              
              <div className="flex justify-between">
                 <Button variant="ghost" asChild className="font-bold px-8 h-10 rounded-lg">
                    <Link href={`?step=2`}>Kembali</Link>
                 </Button>
                 <Button asChild className="font-bold px-8 h-10 rounded-lg shadow-sm">
                    <Link href={`?step=4`}>
                      Lanjut ke Publikasi
                    </Link>
                 </Button>
              </div>
           </div>
        )}

        {activeStep === 2 && (
          <div className="w-full min-w-0">
            <CourseSetupClient
              course={course}
              modules={course.modules}
              preTest={preTest}
              postTest={postTest}
            />
             <div className="flex justify-end mt-10">
                 <Button asChild className="font-bold px-8 h-10 rounded-lg shadow-sm">
                    <Link href={`?step=3`}>Lanjut ke Pengaturan</Link>
                 </Button>
             </div>
          </div>
        )}

        {activeStep === 4 && (
          <div className="w-full min-w-0 max-w-5xl space-y-6 md:space-y-8">
            {/* Page Title */}
            <div className="space-y-1">
              <h2 className="text-xl font-bold tracking-tight text-[#0F1C3F] font-lexend">Review & Publikasi</h2>
              <p className="text-sm font-medium text-slate-400">Pastikan semua komponen sudah siap sebelum kursus ditayangkan ke peserta.</p>
            </div>

            {/* Completion Progress */}
            <Card className="rounded-2xl border-slate-100 shadow-sm">
              <CardContent className="p-5 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-[#0F1C3F]/5 flex items-center justify-center">
                      <BarChart3 className="h-5 w-5 text-[#0F1C3F]" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#0F1C3F] font-lexend">Status Kelengkapan</p>
                      <p className="text-[10px] font-medium text-slate-400">{completedFields} dari {totalFields} syarat terpenuhi</p>
                    </div>
                  </div>
                  <Badge className={cn(
                    "font-black text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-lg",
                    isComplete
                      ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                      : "bg-amber-100 text-amber-700 border border-amber-200"
                  )}>
                    {isComplete ? "✓ Siap Publish" : `${completedFields}/${totalFields} Selesai`}
                  </Badge>
                </div>

                <Progress
                  value={(completedFields / totalFields) * 100}
                  className="h-2 bg-slate-100"
                />

                {!isComplete && (
                  <Alert className="mt-4 border-amber-100 bg-amber-50 rounded-xl">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <AlertDescription className="text-xs font-medium text-amber-700">
                      Lengkapi semua syarat di bawah sebelum mempublikasikan kursus.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Checklist + Publish Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Checklist */}
              <Card className={cn(
                "rounded-2xl shadow-sm transition-all border-2",
                isComplete ? "border-emerald-100" : "border-slate-100"
              )}>
                <CardHeader className="pb-3 pt-5 px-6 border-b border-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-slate-50 flex items-center justify-center">
                      <FileCheck className="h-4 w-4 text-[#0F1C3F]" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold text-[#0F1C3F] font-lexend">Daftar Persyaratan</CardTitle>
                      <CardDescription className="text-[10px]">Semua wajib terpenuhi sebelum publish</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-5 space-y-3">
                  {[
                    {
                      label: "Informasi Identitas Kursus",
                      sub: "Judul, deskripsi, dan kategori",
                      ok: !!(course.title && course.description && course.categoryId),
                      link: "?step=3",
                      icon: BookOpen,
                    },
                    {
                      label: "Modul Pembelajaran",
                      sub: "Minimal 1 modul aktif (Published)",
                      ok: course.modules.some((m) => m.isPublished),
                      link: "?step=2",
                      icon: BookOpen,
                    },
                    {
                      label: "Post-Test Tersedia",
                      sub: "Min. 5 soal dengan kunci jawaban",
                      ok: !!postTestValid,
                      link: postTest
                        ? `/admin/courses/${course.id}/tests/${postTest.id}?type=POST`
                        : "?step=2",
                      icon: FileCheck,
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-xl border transition-colors",
                        item.ok
                          ? "bg-emerald-50/50 border-emerald-100"
                          : "bg-slate-50 border-slate-100"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn(
                          "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                          item.ok ? "bg-emerald-100" : "bg-slate-100"
                        )}>
                          {item.ok
                            ? <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            : <item.icon className="h-4 w-4 text-slate-300" />
                          }
                        </div>
                        <div className="min-w-0">
                          <p className={cn("text-xs font-bold truncate", item.ok ? "text-[#0F1C3F]" : "text-slate-400")}>
                            {item.label}
                          </p>
                          <p className="text-[10px] font-medium text-slate-300 truncate">{item.sub}</p>
                        </div>
                      </div>
                      {!item.ok && (
                        <Link
                          href={item.link}
                          className="text-[10px] font-black uppercase tracking-widest text-[#E8A020] hover:text-[#0F1C3F] transition-colors shrink-0 ml-3"
                        >
                          Lengkapi →
                        </Link>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Publish Control */}
              <Card className="relative rounded-2xl border-[#0F1C3F] bg-gradient-to-br from-[#0F1C3F] to-[#1A2E5A] text-white shadow-xl shadow-[#0F1C3F]/20 overflow-hidden">
                <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#E8A020_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
                <CardContent className="relative flex flex-col h-full space-y-5 p-6">
                  <div className="h-12 w-12 rounded-2xl bg-[#E8A020]/15 border border-[#E8A020]/30 flex items-center justify-center">
                    <Rocket className="h-6 w-6 text-[#E8A020]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black font-lexend">Kontrol Publikasi</h3>
                    <p className="text-slate-400 text-sm mt-1 leading-relaxed">
                      Tayangkan atau tarik kursus dari katalog karyawan kapan saja. Peserta yang sudah enroll tidak terpengaruh.
                    </p>
                  </div>
                  <div className="pt-4 border-t border-white/10 mt-auto space-y-3">
                    <PublishButton
                      courseId={course.id}
                      isPublished={course.isPublished}
                      disabled={!isComplete}
                    />
                    {!isComplete && (
                      <p className="text-[10px] text-amber-400 font-bold italic flex items-center gap-1.5">
                        <AlertTriangle className="h-3 w-3" />
                        Lengkapi persyaratan di sebelah kiri untuk mengaktifkan tombol ini.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-start">
              <Button variant="ghost" asChild className="font-bold px-6 h-10 rounded-xl text-slate-500">
                <Link href={`?step=3`}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Kembali ke Pengaturan
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
