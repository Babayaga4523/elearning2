import { db } from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { 
  LayoutDashboard, 
  ArrowLeft,
  Eye,
  Settings
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CourseTitleForm } from "@/components/admin/course-title-form";
import { CourseDescriptionForm } from "@/components/admin/course-description-form";
import { CourseCategoryForm } from "@/components/admin/course-category-form";
import { CourseDurationForm } from "@/components/admin/course-duration-form";
import { CourseSetupClient } from "./_components/CourseSetupClient";
import { PublishButton } from "./_components/PublishButton";
import { CourseWizard } from "@/components/admin/CourseWizard";
import { Category, Module, Test, Question, Option } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default async function CourseIdPage({
  params,
  searchParams
}: {
  params: { courseId: string };
  searchParams: { step?: string };
}) {
  const activeStep = parseInt(searchParams.step || "2");
  const session = await auth();

  if (!session || session.user?.role !== "ADMIN") {
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

  const preTest = (course.tests as any[]).find(t => t.type === "PRE") || null;
  const postTest = (course.tests as any[]).find(t => t.type === "POST") || null;

  const postTestValid = postTest && postTest.questions.length >= 5 && postTest.questions.every((q: any) => q.options.some((opt: any) => opt.isCorrect));

  const requiredFields = [
    course.title,
    course.description,
    course.categoryId,
    course.modules.some((module: Module) => module.isPublished),
    postTestValid,
  ];

  const totalFields = requiredFields.length;
  const completedFields = requiredFields.filter(Boolean).length;
  const completionText = `(${completedFields}/${totalFields})`;
  const isComplete = requiredFields.every(Boolean);

  return (
    <div className="flex min-h-full w-full min-w-0 flex-col bg-slate-50/50 py-6 md:py-8">
      <div className="mb-8 flex w-full min-w-0 flex-col gap-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500 md:flex-row md:items-center md:justify-between md:p-6">
        <div className="flex min-w-0 items-center gap-4">
           <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-md md:h-14 md:w-14">
              <Settings className="h-6 w-6 md:h-7 md:w-7" />
           </div>
           <div className="min-w-0">
              <Link href="/admin/courses" className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 transition-colors hover:text-primary">
                <ArrowLeft className="h-3 w-3 shrink-0" /> Kembali ke Katalog
              </Link>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Studio Kursus</h1>
           </div>
        </div>

        <div className="w-full min-w-0 max-w-full md:max-w-md md:flex-1 lg:max-w-2xl">
           <CourseWizard activeStep={activeStep} courseId={course.id} />
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 md:gap-3">
           <Button variant="ghost" size="sm" asChild className="h-10 gap-2 rounded-lg px-4 font-semibold text-slate-600 hover:text-primary">
             <Link href={`/courses/${course.id}`} target="_blank">
               <Eye className="h-4 w-4" />
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
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-primary/10 rounded-xl text-primary flex items-center justify-center shadow-inner">
                   <Settings className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800 tracking-tight leading-none">Pengaturan Kursus</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Detail & Deadline</p>
                </div>
              </div>

              <Card className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
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
                    <CourseDurationForm initialData={course as any} courseId={course.id} />
                </CardContent>
              </Card>
              
              <div className="flex justify-between">
                <Button variant="ghost" asChild className="font-bold px-10 h-14 rounded-2xl">
                   <Link href={`?step=2`}>Kembali</Link>
                </Button>
                <Button asChild className="font-black px-10 h-14 rounded-2xl shadow-xl shadow-primary/20">
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
            <div className="flex justify-end mt-12">
                <Button asChild className="font-black px-10 h-14 rounded-2xl shadow-xl shadow-primary/20">
                   <Link href={`?step=3`}>Lanjut ke Pengaturan</Link>
                </Button>
            </div>
          </div>
        )}

        {activeStep === 4 && (
          <div className="w-full min-w-0 max-w-6xl space-y-6 md:space-y-8">
             <div className="mb-8 space-y-2 text-center md:mb-10">
               <h2 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Review & Publikasi</h2>
               <p className="text-sm font-medium text-slate-600 md:text-base">Pastikan semua komponen sudah siap sebelum kursus ditayangkan ke peserta.</p>
             </div>

             <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
                <Card className={cn(
                  "rounded-xl border-2 shadow-sm transition-all",
                  isComplete ? "border-emerald-100 bg-emerald-50/20" : "border-slate-200 bg-white"
                )}>
                   <CardContent className="space-y-5 p-5 md:p-6">
                      <div className="flex items-center justify-between">
                         <h3 className="font-black text-slate-800">Status Kelengkapan</h3>
                         <Badge className={cn("font-black", isComplete ? "bg-emerald-500" : "bg-amber-500")}>
                           {isComplete ? "SIAP PUBLISH" : "BELUM LENGKAP"}
                         </Badge>
                      </div>
                      
                      <div className="space-y-4">
                         {[
                           { label: "Informasi Identitas", ok: !!(course.title && course.description && course.categoryId), link: "?step=3" },
                           { label: "Modul Pembelajaran (Min. 1 Active)", ok: course.modules.some(m => m.isPublished), link: "?step=2" },
                           { label: "Post-Test (Min. 5 Soal & Kunci)", ok: postTestValid, link: postTest ? `/admin/courses/${course.id}/tests/${postTest.id}?type=POST` : "?step=2" },
                         ].map((item, i) => (
                           <div key={i} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                              <div className="flex items-center gap-3">
                                 {item.ok ? <Settings className="h-4 w-4 text-emerald-500" /> : <Settings className="h-4 w-4 text-slate-300" />}
                                 <span className={cn("text-sm font-bold", item.ok ? "text-slate-700" : "text-slate-400")}>{item.label}</span>
                              </div>
                              {!item.ok && (
                                <Link href={item.link} className="text-[10px] font-black uppercase text-primary hover:underline">Perbaiki</Link>
                              )}
                           </div>
                         ))}
                      </div>
                   </CardContent>
                </Card>

                <Card className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900 text-white shadow-sm">
                   <CardContent className="flex h-full flex-col space-y-5 p-5 md:p-6">
                      <div className="p-4 bg-white/10 rounded-2xl">
                         <Settings className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black">Kontrol Publikasi</h3>
                        <p className="text-slate-400 text-sm mt-1">Gunakan tombol ini untuk menayangkan atau menarik kursus dari katalog karyawan.</p>
                      </div>
                      <div className="mt-auto pt-6 border-t border-white/10">
                         <PublishButton 
                           courseId={course.id}
                           isPublished={course.isPublished}
                           disabled={!isComplete}
                         />
                         {!isComplete && (
                           <p className="text-[10px] text-amber-400 font-bold mt-4 italic">
                             * Anda harus melengkapi semua syarat di sebelah kiri untuk mengaktifkan tombol ini.
                           </p>
                         )}
                      </div>
                   </CardContent>
                </Card>
             </div>
             
             <div className="flex justify-start">
                <Button variant="ghost" asChild className="font-bold px-10 h-14 rounded-2xl">
                   <Link href={`?step=3`}>Kembali ke Pengaturan</Link>
                </Button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
