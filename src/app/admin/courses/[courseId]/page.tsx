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
import { CourseSetupClient } from "./_components/CourseSetupClient";
import { CourseWizard } from "@/components/admin/CourseWizard";
import { Category, Module, Test, Question, Option } from "@prisma/client";

export default async function CourseIdPage({
  params
}: {
  params: { courseId: string }
}) {
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
    },
  });

  if (!course) {
    return redirect("/admin/courses");
  }

  const categories = await db.category.findMany({
    orderBy: {
      name: "asc",
    },
  });

  const requiredFields = [
    course.title,
    course.description,
    course.imageUrl,
    course.categoryId,
    course.modules.some((module: Module) => module.isPublished),
  ];

  const totalFields = requiredFields.length;
  const completedFields = requiredFields.filter(Boolean).length;
  const completionText = `(${completedFields}/${totalFields})`;
  const isComplete = requiredFields.every(Boolean);

  const preTest = (course.tests as any[]).find(t => t.type === "PRE") || null;
  const postTest = (course.tests as any[]).find(t => t.type === "POST") || null;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-1000 pb-20">
      
      {/* 1. Unified Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-8 border-b border-slate-100 relative">
        <div className="space-y-1">
          <Link
            href="/admin/courses"
            className="flex items-center text-xs font-black text-slate-400 hover:text-primary transition-all group uppercase tracking-widest"
          >
            <ArrowLeft className="h-3 w-3 mr-2 group-hover:-translate-x-1 transition-transform" />
            Kembali ke Katalog
          </Link>
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg shadow-black/10">
                <Settings className="h-5 w-5" />
             </div>
             <h1 className="text-3xl font-black text-slate-900 tracking-tighter">
               Studio Kursus
             </h1>
          </div>
        </div>

        {/* Central Wizard - Integrated into Header */}
        <div className="flex-1 max-w-2xl px-4">
           <CourseWizard activeStep={2} />
        </div>

        <div className="flex items-center gap-3">
           <Button variant="ghost" size="sm" className="font-bold text-slate-500 hover:text-primary gap-2 h-11 px-5 rounded-xl">
             <Eye className="h-4 w-4" />
             Preview
           </Button>
           <Button 
             disabled={!isComplete}
             size="sm"
             className={cn(
               "font-black h-11 px-8 rounded-xl shadow-xl transition-all active:scale-95",
               course.isPublished ? "bg-rose-500 hover:bg-rose-600 shadow-rose-200" : "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200"
             )}
           >
             {course.isPublished ? "Unpublish" : "Publish Sekarang"}
           </Button>
        </div>
      </div>

      {/* 2. Main Studio Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
        
        {/* LEFT COLUMN: Essential Metadata */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-xl shadow-blue-100">
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <div>
               <h2 className="text-xl font-black text-slate-800 tracking-tight leading-none">Informasi Utama</h2>
               <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest">Detail Katalog Kursus</p>
            </div>
          </div>
          
          <Card className="border-none shadow-2xl shadow-slate-200/40 rounded-[2.5rem] bg-white overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none group-hover:scale-125 transition-transform duration-1000">
               <Settings className="h-40 w-40" />
            </div>
            <CardContent className="p-10 space-y-10 relative z-10">
              <div className="space-y-10 border-slate-100">
                <CourseTitleForm
                  initialData={course}
                  courseId={course.id}
                />
                <div className="h-[1px] w-full bg-slate-50" />
                <CourseDescriptionForm
                  initialData={course}
                  courseId={course.id}
                />
                <div className="h-[1px] w-full bg-slate-50" />
                <CourseCategoryForm
                  initialData={course}
                  courseId={course.id}
                  options={categories.map((category: Category) => ({
                    label: category.name,
                    value: category.id,
                  }))}
                />
              </div>

              {/* Progress Indicator Card Internal */}
              <div className="pt-6">
                 <div className="p-6 bg-slate-50 rounded-3xl border border-white shadow-inner space-y-4">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                       <span className="text-slate-400">Total Progress Metadata</span>
                       <span className="text-primary">{completionText}</span>
                    </div>
                    <div className="h-2 w-full bg-white rounded-full overflow-hidden shadow-sm">
                       <div 
                         className="bg-primary h-full transition-all duration-1000 ease-in-out" 
                         style={{ width: `${(completedFields / totalFields) * 100}%` }}
                       />
                    </div>
                 </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Curriculum & Assessment */}
        <div className="lg:col-span-3">
          <CourseSetupClient
            course={course}
            modules={course.modules}
            preTest={preTest}
            postTest={postTest}
          />
        </div>
      </div>
    </div>
  );
}

import { cn } from "@/lib/utils";

