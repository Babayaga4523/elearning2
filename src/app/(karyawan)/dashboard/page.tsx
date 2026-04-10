import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { 
  AlertCircle, 
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// New Modular Components
import { DashboardHero } from "./_components/DashboardHero";
import { KPIGrid } from "./_components/KPIGrid";
import { CourseCard } from "./_components/CourseCard";
import { ExploreCourses, EmptyState } from "./_components/ExploreCourses";

export default async function DashboardPage() {
  const session = await auth();

  if (!session || !session.user?.id) {
    return redirect("/");
  }

  const isAdmin = session?.user?.role === "ADMIN";
  const userId = session.user.id;

  // Data Fetching
  const enrollments = await db.enrollment.findMany({
    where: { userId },
    include: {
      course: {
        include: {
          modules: { where: { isPublished: true } },
          category: true,
        },
      },
    },
  });

  const completedModuleIds = await db.userProgress.findMany({
    where: { userId, isCompleted: true },
    select: { moduleId: true, module: { select: { courseId: true } } },
  });

  const passedAttemptsText = await db.testAttempt.findMany({
    where: { userId, passed: true },
    select: { testId: true }
  });
  const uniquePassedTestsCount = new Set(passedAttemptsText.map((a: any) => a.testId)).size;

  const exploreCourses = await db.course.findMany({
    where: { isPublished: true, enrollments: { none: { userId } } },
    take: 4,
    include: {
      category: true,
      _count: { select: { modules: true, enrollments: true } }
    }
  });

  const completedByCourse: Record<string, number> = {};
  for (const progress of completedModuleIds) {
    const courseId = progress.module.courseId;
    completedByCourse[courseId] = (completedByCourse[courseId] || 0) + 1;
  }

  const coursesWithProgress = enrollments.map((en: any) => {
    const publishedModulesCount = en.course.modules.length;
    const completedModulesCount = completedByCourse[en.course.id] || 0;
    const progressPercentage = publishedModulesCount > 0
      ? Math.round((completedModulesCount / publishedModulesCount) * 100)
      : 0;

    return {
      ...en.course,
      progress: progressPercentage,
      completedModules: completedModulesCount,
      totalModules: publishedModulesCount,
      deadline: en.deadline,
    };
  });

  return (
    <div className="min-h-full bg-slate-50 relative pb-32 overflow-hidden">
      {/* Decorative Background Glows */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-blue-400/10 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-indigo-400/10 rounded-full blur-[120px] translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-emerald-400/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 p-6 md:p-10 max-w-7xl mx-auto space-y-12 animate-fade-in-up">
        
        {/* Admin Warning Section */}
        {isAdmin && (
          <div className="bg-amber-50/90 backdrop-blur-md border border-amber-200 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm ring-1 ring-amber-900/5">
            <div className="flex items-center gap-x-5 text-amber-800">
              <div className="p-4 bg-amber-200/50 rounded-2xl shadow-inner">
                <AlertCircle className="h-7 w-7 shrink-0 text-amber-700" />
              </div>
              <div className="space-y-1">
                <p className="font-black text-base tracking-tight text-amber-900">Administrator Session</p>
                <p className="text-xs opacity-70 font-medium leading-relaxed">Anda sedang melihat tata letak akun karyawan. Beralih ke Admin Console untuk manajemen penuh.</p>
              </div>
            </div>
            <Link href="/admin">
              <Button size="sm" className="h-14 px-8 rounded-xl bg-amber-600 hover:bg-amber-700 text-white border-0 text-sm flex items-center gap-3 font-black whitespace-nowrap shadow-xl shadow-amber-600/30 transition-all hover:scale-105 active:scale-95">
                Admin Console <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        )}

        {/* HERO SECTION */}
        <DashboardHero userName={session.user.name || "Karyawan"} />

        {/* KPI METRICS GRID */}
        <KPIGrid 
          activeCourses={coursesWithProgress.length}
          modulesDone={completedModuleIds.length}
          testsPassed={uniquePassedTestsCount}
        />

        {/* ACTIVE LEARNING SECTION */}
        <section className="space-y-8 pt-4">
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-4">
                <div className="w-2 h-10 bg-blue-600 rounded-full shadow-lg shadow-blue-500/20" />
                <div className="space-y-1">
                   <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Pelajaran Aktif</h2>
                   <p className="text-slate-400 text-sm font-medium">Lanjutkan progres belajar Anda yang tertunda.</p>
                </div>
             </div>
             {coursesWithProgress.length > 0 && (
                <div className="hidden sm:flex items-center gap-2 text-xs font-black text-slate-400 bg-slate-100/80 px-4 py-2 rounded-2xl">
                   <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                   {coursesWithProgress.length} KURSUS SEDANG BERJALAN
                </div>
             )}
          </div>
          
          {coursesWithProgress.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {coursesWithProgress.map((course: any) => (
                 <CourseCard key={course.id} course={course} />
               ))}
            </div>
          )}
        </section>

        {/* EXPLORATION FEED */}
        <ExploreCourses courses={exploreCourses} />
      </div>
    </div>
  );
}
