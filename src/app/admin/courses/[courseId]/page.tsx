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
    <div className="p-6 md:p-12 min-h-full bg-slate-50/50">
      
      {/* 1. Dashboard Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="flex items-center gap-5">
           <div className="bg-slate-900 h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3 hover:rotate-0 transition-transform duration-500">
              <Settings className="h-7 w-7 text-white" />
           </div>
           <div>
              <Link href="/admin/courses" className="text-xs font-black text-slate-400 hover:text-primary transition-colors flex items-center gap-1 uppercase tracking-widest mb-1">
                <ArrowLeft className="h-3 w-3" /> Kembali ke Katalog
              </Link>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Studio Kursus</h1>
           </div>
        </div>

        {/* Central Wizard - Integrated into Header */}
        <div className="flex-1 max-w-2xl px-4">
           <CourseWizard activeStep={activeStep} courseId={course.id} />
        </div>

        <div className="flex items-center gap-3">
           <Button variant="ghost" size="sm" asChild className="font-bold text-slate-500 hover:text-primary gap-2 h-11 px-5 rounded-xl">
             <Link href={`/courses/${course.id}`} target="_blank">
               <Eye className="h-4 w-4" />
               Preview
             </Link>
           </Button>
           {activeStep === 3 && (
             <PublishButton 
               courseId={course.id}
               isPublished={course.isPublished}
               disabled={!isComplete}
             />
           )}
        </div>
      </div>

      {/* 2. Main Studio Workspace */}
      <div className="animate-in fade-in zoom-in-95 duration-700">
        {activeStep === 1 && (
           <div className="max-w-3xl mx-auto space-y-8">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-primary/10 rounded-xl text-primary flex items-center justify-center shadow-inner">
                   <LayoutDashboard className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800 tracking-tight leading-none">Informasi Utama</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Detail Katalog Kursus</p>
                </div>
              </div>

              <Card className="border-slate-100 rounded-[2.5rem] shadow-2xl shadow-slate-200/40 overflow-hidden bg-white">
                <CardContent className="p-8 space-y-8">
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
              
              <div className="flex justify-end">
                <Button asChild className="font-black px-10 h-14 rounded-2xl shadow-xl shadow-primary/20">
                   <Link href={`?step=2`}>
                     Lanjut ke Kurikulum
                   </Link>
                </Button>
              </div>
           </div>
        )}

        {activeStep === 2 && (
          <div className="max-w-5xl mx-auto">
            <CourseSetupClient
              course={course}
              modules={course.modules}
              preTest={preTest}
              postTest={postTest}
            />
            <div className="flex justify-between mt-12">
                <Button variant="ghost" asChild className="font-bold px-10 h-14 rounded-2xl">
                   <Link href={`?step=1`}>Kembali</Link>
                </Button>
                <Button asChild className="font-black px-10 h-14 rounded-2xl shadow-xl shadow-primary/20">
                   <Link href={`?step=3`}>Lihat Review & Publikasi</Link>
                </Button>
            </div>
          </div>
        )}

        {activeStep === 3 && (
          <div className="max-w-4xl mx-auto space-y-8">
             <div className="text-center space-y-4 mb-12">
               <h2 className="text-4xl font-black text-slate-900 tracking-tight">Review & Publikasi</h2>
               <p className="text-slate-500 font-medium">Pastikan semua komponen sudah siap sebelum kursus ditayangkan ke peserta.</p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className={cn(
                  "rounded-[2rem] border-2 shadow-xl transition-all",
                  isComplete ? "border-emerald-100 bg-emerald-50/20" : "border-slate-100 bg-white"
                )}>
                   <CardContent className="p-8 space-y-6">
                      <div className="flex items-center justify-between">
                         <h3 className="font-black text-slate-800">Status Kelengkapan</h3>
                         <Badge className={cn("font-black", isComplete ? "bg-emerald-500" : "bg-amber-500")}>
                           {isComplete ? "SIAP PUBLISH" : "BELUM LENGKAP"}
                         </Badge>
                      </div>
                      
                      <div className="space-y-4">
                         {[
                           { label: "Informasi Identitas", ok: !!(course.title && course.description && course.categoryId), link: "?step=1" },
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

                <Card className="rounded-[2rem] border border-slate-100 shadow-xl bg-slate-900 text-white overflow-hidden">
                   <CardContent className="p-8 space-y-6 flex flex-col h-full">
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
                   <Link href={`?step=2`}>Kembali ke Kurikulum</Link>
                </Button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
