import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Clock, 
  History as HistoryIcon, 
  AlertCircle, 
  ArrowRight,
  Trophy,
  Target,
  Sparkles,
  ChevronRight,
  PlayCircle,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await auth();

  if (!session || !session.user?.id) {
    return redirect("/");
  }

  const isAdmin = session?.user?.role === "ADMIN";
  const userId = session.user.id;

  const enrollments = await db.enrollment.findMany({
    where: { userId },
    include: {
      course: {
        include: {
          modules: {
            where: { isPublished: true }
          },
          category: true,
        },
      },
    },
  });

  // Batch fetch all completed modules for this user in one query
  const completedModuleIds = await db.userProgress.findMany({
    where: {
      userId,
      isCompleted: true,
    },
    select: {
      moduleId: true,
      module: { select: { courseId: true } },
    },
  });

  const passedAttempts = await db.testAttempt.findMany({
    where: { userId, passed: true },
    select: { testId: true }
  });
  const uniquePassedTestsCount = new Set(passedAttempts.map((a: any) => a.testId)).size;

  const exploreCourses = await db.course.findMany({
    where: { 
      isPublished: true,
      enrollments: { none: { userId } }
    },
    take: 4,
    include: {
      category: true,
      _count: { select: { modules: true, enrollments: true } }
    }
  });

  // Build a lookup map: courseId -> count of completed modules
  const completedByCourse: Record<string, number> = {};
  for (const progress of completedModuleIds) {
    const courseId = progress.module.courseId;
    completedByCourse[courseId] = (completedByCourse[courseId] || 0) + 1;
  }

  // Calculate progress for each enrolled course
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

  const totalCompletedModules = completedModuleIds.length;

  return (
    <div className="min-h-full bg-slate-50 relative pb-20 overflow-hidden">
      {/* Decorative Background Glows */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-400/20 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute top-40 right-0 w-[400px] h-[400px] bg-emerald-400/10 rounded-full blur-[100px] translate-x-1/3 pointer-events-none" />

      <div className="relative z-10 p-6 md:p-10 max-w-7xl mx-auto space-y-12 animate-fade-in-up">
        {isAdmin && (
          <div className="bg-amber-50/80 backdrop-blur-md border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm animate-fade-in-up">
            <div className="flex items-center gap-x-4 text-amber-800">
              <div className="p-3 bg-amber-200/50 rounded-xl">
                <AlertCircle className="h-6 w-6 shrink-0" />
              </div>
              <div>
                <p className="font-black text-sm tracking-tight text-amber-900">Administrator Session Active</p>
                <p className="text-xs opacity-80 mt-1 font-medium">You are viewing the employee dashboard layout. Features here behave as a standard user.</p>
              </div>
            </div>
            <Link href="/admin">
              <Button size="sm" className="h-12 px-6 rounded-xl bg-amber-600 hover:bg-amber-700 text-white border-0 text-sm flex items-center gap-2 font-black whitespace-nowrap shadow-md shadow-amber-600/20 transition-all hover:scale-105">
                Switch to Admin Console <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}

        {/* HERO SECTION */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-[2.5rem] p-10 flex flex-col md:flex-row md:items-end justify-between gap-8 shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
             <Target className="w-64 h-64 rotate-12" />
           </div>

           <div className="relative z-10 flex flex-col gap-y-4 max-w-2xl text-white">
             <Badge className="w-fit bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border-none font-bold tracking-widest text-[10px] uppercase py-1">
               <Sparkles className="h-3 w-3 mr-1.5" /> Next-Gen Learning
             </Badge>
             <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300 tracking-tight leading-tight">
               Welcome Back, <br className="hidden md:block" /> {session.user.name}!
             </h1>
             <p className="text-slate-300 font-medium text-lg leading-relaxed mt-2">
               Pick up where you left off. Engage with your modules and track your path to mastery.
             </p>
           </div>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-white/80 backdrop-blur-md p-6 rounded-[2rem] border border-white/50 shadow-sm flex items-center gap-6 group hover:shadow-md transition-all">
              <div className="h-16 w-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                <BookOpen className="h-8 w-8" />
              </div>
              <div className="flex flex-col">
                 <span className="text-4xl font-black text-slate-800 tracking-tighter">{coursesWithProgress.length}</span>
                 <span className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Active Courses</span>
              </div>
           </div>

           <div className="bg-white/80 backdrop-blur-md p-6 rounded-[2rem] border border-white/50 shadow-sm flex items-center gap-6 group hover:shadow-md transition-all">
              <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div className="flex flex-col">
                 <span className="text-4xl font-black text-slate-800 tracking-tighter">{totalCompletedModules}</span>
                 <span className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Modules Done</span>
              </div>
           </div>

           <div className="bg-white/80 backdrop-blur-md p-6 rounded-[2rem] border border-white/50 shadow-sm flex items-center gap-6 group hover:shadow-md transition-all">
              <div className="h-16 w-16 bg-violet-100 text-violet-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                <Trophy className="h-8 w-8" />
              </div>
              <div className="flex flex-col">
                 <span className="text-4xl font-black text-slate-800 tracking-tighter">{uniquePassedTestsCount}</span>
                 <span className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Tests Passed</span>
              </div>
           </div>
        </div>

        {/* MY LEARNING (ENROLLED COURSES) */}
        <div className="space-y-6 pt-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center gap-3">
             <div className="w-1.5 h-8 bg-blue-600 rounded-full" />
             <h2 className="text-2xl font-black text-slate-900 tracking-tight">My Active Learning</h2>
          </div>
          
          {coursesWithProgress.length === 0 ? (
            <div className="bg-slate-100/50 backdrop-blur-sm border-2 border-dashed border-slate-200 rounded-[2rem] p-12 text-center flex flex-col items-center justify-center gap-4 text-slate-400">
               <Target className="h-16 w-16 opacity-20" />
               <p className="font-bold text-lg">You haven't enrolled in any courses yet.</p>
               <p className="text-sm">Explore the catalog below to start your journey.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {coursesWithProgress.map((course: any) => (
                 <Link key={course.id} href={`/courses/${course.id}`} className="group relative">
                   <div className="bg-white rounded-[2rem] border shadow-sm group-hover:shadow-2xl group-hover:-translate-y-2 transition-all duration-300 overflow-hidden h-full flex flex-col">
                      <div className="h-48 relative overflow-hidden bg-slate-100">
                        {course.imageUrl ? (
                          <img src={course.imageUrl} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                        ) : (
                          <div className="flex items-center justify-center h-full bg-slate-200 text-slate-400">
                            <BookOpen className="h-12 w-12 opacity-50" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/0" />
                        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                           <Badge className="bg-white/90 backdrop-blur-md text-slate-800 font-bold border-none shadow-sm capitalize px-3">
                             {course.category?.name || "LMS"}
                           </Badge>
                           {course.progress === 100 && (
                             <Trophy className="h-8 w-8 text-yellow-400 drop-shadow-md" />
                           )}
                        </div>
                      </div>
                      
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-black text-slate-800 line-clamp-2 leading-snug group-hover:text-primary transition-colors mb-2">
                          {course.title}
                        </h3>
                        
                        {course.deadline && (
                          <div className="flex items-center gap-2 mb-4">
                            <Clock className="h-3.5 w-3.5 text-rose-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md">
                              Deadline: {new Date(course.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                            {new Date(course.deadline) > new Date() && (
                              <span className="text-[9px] font-bold text-slate-400">
                                ({Math.ceil((new Date(course.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} Hari Lagi)
                              </span>
                            )}
                          </div>
                        )}
                        
                        <div className="mt-auto space-y-4">
                           <div className="space-y-2">
                             <div className="flex flex-col">
                               <div className="flex justify-between items-baseline mb-2">
                                 <span className="text-2xl font-black text-emerald-600">{course.progress}%</span>
                                 <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">{course.completedModules}/{course.totalModules} Modul</span>
                               </div>
                               <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                 <div 
                                   className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-full rounded-full relative" 
                                   style={{ width: `${course.progress}%` }}
                                 >
                                    <div className="absolute inset-0 bg-white/20 animate-pulse" />
                                 </div>
                               </div>
                             </div>
                           </div>

                           <Button variant="ghost" className="w-full justify-between px-0 hover:bg-transparent group-hover:text-primary font-bold text-slate-500">
                             {course.progress === 100 ? "Review Material" : "Lanjutkan Belajar"}
                             <ChevronRight className="h-5 w-5 bg-slate-100 rounded-full p-0.5 group-hover:bg-primary/10 transition-colors" />
                           </Button>
                        </div>
                      </div>
                   </div>
                 </Link>
               ))}
            </div>
          )}
        </div>

        {/* CROSS-SELLING / EXPLORE COURSES */}
        {exploreCourses.length > 0 && (
           <div className="space-y-6 pt-10 border-t border-slate-200 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-8 bg-amber-500 rounded-full" />
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Explore Courses</h2>
                </div>
                <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50 font-bold hidden sm:flex px-4 py-1">
                  Recomendation For You
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                 {exploreCourses.map((ec: any) => (
                   <Link key={ec.id} href={`/courses/${ec.id}`} className="group">
                      <div className="bg-white rounded-[1.5rem] border border-slate-200 p-4 hover:border-primary/30 hover:shadow-xl transition-all cursor-pointer h-full flex flex-col">
                         <div className="h-32 mb-4 bg-slate-100 rounded-xl overflow-hidden relative">
                           {ec.imageUrl ? (
                             <img src={ec.imageUrl} alt={ec.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                           ) : (
                             <div className="flex items-center justify-center h-full bg-slate-100 text-slate-300">
                               <PlayCircle className="h-8 w-8" />
                             </div>
                           )}
                           <div className="absolute bottom-2 left-2 flex gap-1">
                              <Badge className="text-[9px] font-black uppercase px-2 py-0 border-none bg-white/90 text-slate-800 shadow-sm">
                                {ec.category?.name || "LMS"}
                              </Badge>
                           </div>
                         </div>
                         <h4 className="font-bold text-slate-800 text-sm line-clamp-2 min-h-[40px] group-hover:text-primary transition-colors">
                           {ec.title}
                         </h4>
                         <div className="mt-auto pt-4 flex items-center justify-between text-xs font-bold text-slate-400">
                           <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {ec._count.modules} Modul</span>
                           <span className="flex items-center gap-1"><Target className="h-3 w-3" /> {ec._count.enrollments} Enrolled</span>
                         </div>
                      </div>
                   </Link>
                 ))}
              </div>
           </div>
        )}
      </div>
    </div>
  );
}
