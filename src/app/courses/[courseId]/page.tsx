import { db } from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { CheckCircle, Lock, PlayCircle, FileText, ExternalLink, ChevronRight, ArrowLeft, GraduationCap, Clock } from "lucide-react";
import Link from "next/link";
import { EnrollButton } from "@/components/courses/enroll-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default async function CoursePage({
  params
}: {
  params: { courseId: string }
}) {
  const session = await auth();

  if (!session || !session.user?.id) {
    return redirect("/");
  }

  const userId = session.user.id;

  const rawCourse = await db.course.findUnique({
    where: {
      id: params.courseId,
    },
    include: {
      modules: {
        where: {
          isPublished: true,
        },
        orderBy: {
          position: "asc",
        },
      },
      enrollments: {
        where: {
          userId,
        },
      },
      tests: {
        include: {
          attempts: {
            where: {
              userId,
            },
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      },
    },
  });

  if (!rawCourse) {
    return redirect("/dashboard");
  }

  const course = rawCourse as any;
  const isEnrolled = course.enrollments.length > 0;

  // Fetch userProgress in parallel with the course (only when enrolled)
  const userProgress = isEnrolled
    ? await db.userProgress.findMany({
        where: {
          userId,
          module: {
            courseId: params.courseId,
          },
        },
        select: { moduleId: true, isCompleted: true },
      })
    : [];

  const completedModules = userProgress.filter((p: any) => p.isCompleted).map((p: any) => p.moduleId);

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in-up">
      <Link href="/dashboard" className="flex items-center text-sm mb-8 hover:text-primary transition group">
        <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition" />
        Back to My Dashboard
      </Link>

      {!isEnrolled && (
        <div className="bg-blue-600 rounded-3xl p-8 md:p-12 text-white mb-12 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 space-y-4 max-w-2xl">
            <Badge className="bg-white/20 text-white hover:bg-white/30 border-0">New Course</Badge>
            <h2 className="text-3xl md:text-5xl font-black">{course.title}</h2>
            <p className="text-blue-100 text-lg leading-relaxed">
              Unlock your potential with this comprehensive course. Enroll now to start your learning journey and track your progress.
            </p>
            <div className="pt-4">
              <EnrollButton courseId={course.id} />
            </div>
          </div>
          <div className="absolute top-0 right-0 -mr-20 -mt-20 h-80 w-80 bg-white/10 rounded-full blur-3xl opacity-50" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <div>
            <div className="flex items-center gap-x-3 mb-4">
               <h1 className="text-4xl font-extrabold text-slate-800">{course.title}</h1>
               {isEnrolled && <Badge variant="default" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0">Enrolled</Badge>}
            </div>
            <Badge variant="outline" className="mb-4">{course.categoryId || "E-Learning"}</Badge>
            <p className="text-slate-600 leading-relaxed">{course.description || "No description provided for this course."}</p>
          </div>

          <div className={cn(
            "space-y-4",
            !isEnrolled && "opacity-50 grayscale pointer-events-none select-none"
          )}>
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-800">Learning Journey</h2>
              {!isEnrolled && <Badge variant="secondary">Enroll to see content</Badge>}
            </div>
            <div className="space-y-4 border rounded-xl overflow-hidden shadow-sm bg-white">
               {/* Pre-test if any */}
               {course.tests.filter((t: any) => t.type === "PRE").map((test: any) => {
                 const attempt = test.attempts?.[0];
                 
                 return (
                   <div key={test.id} className="flex items-center p-4 border-b bg-slate-50">
                      <div className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center mr-4",
                        attempt?.passed ? "bg-emerald-100 text-emerald-600" : "bg-orange-100 text-orange-600"
                      )}>
                        {attempt?.passed ? <CheckCircle className="h-5 w-5" /> : <GraduationCap className="h-5 w-5" />}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-700">{test.title} (Pre-Test)</h3>
                        <p className="text-xs text-slate-500">
                          {attempt ? `Score: ${attempt.score}% - ${attempt.passed ? "Passed" : "Need improvement"}` : "Assess your initial knowledge."}
                        </p>
                      </div>
                      <Link href={`/courses/${params.courseId}/tests/${test.id}`}>
                        <Button size="sm" variant={attempt ? "secondary" : "outline"} className="ml-4 font-bold">
                          {attempt ? "Review" : "Start Test"}
                        </Button>
                      </Link>
                   </div>
                 );
               })}

               {/* Modules */}
               {course.modules.length === 0 && (
                 <div className="p-8 text-center text-slate-400">Belum ada modul untuk kursus ini.</div>
               )}
               {course.modules.map((module: any, index: number) => {
                 const isCompleted = completedModules.includes(module.id);
                 const isLocked = index > 0 && !completedModules.includes(course.modules[index - 1].id);
                 
                 return (
                   <div 
                    key={module.id} 
                    className={cn(
                      "flex items-center p-6 border-b transition",
                      isLocked ? "opacity-50 grayscale pointer-events-none" : "hover:bg-slate-50"
                    )}
                   >
                     <div className={cn(
                       "h-12 w-12 rounded-full flex items-center justify-center mr-6",
                       isCompleted ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600 shadow-sm"
                     )}>
                        {isCompleted ? (
                          <CheckCircle className="h-6 w-6" />
                        ) : (
                          (module.type === "VIDEO" || module.videoUrl) ? <PlayCircle className="h-6 w-6" /> : <FileText className="h-6 w-6" />
                        )}
                     </div>
                     <div className="flex-1">
                        <div className="flex items-center gap-x-2">
                           <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Modul {index + 1}</span>
                           {isLocked && <Lock className="h-3 w-3 text-slate-400" />}
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">{module.title}</h3>
                        <div className="flex items-center gap-x-2 mt-1">
                           <Badge variant="outline" className="text-[10px] font-bold py-0 h-4 border-slate-200">
                             {module.type || (module.videoUrl ? "VIDEO" : "PDF")}
                           </Badge>
                           {module.duration > 0 && (
                             <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                               <Clock className="h-3 w-3" /> {module.duration} Menit
                             </span>
                           )}
                        </div>
                     </div>
                     {!isLocked && (
                       <Link href={`/courses/${course.id}/modules/${module.id}`}>
                         <Button variant="outline" className="flex items-center font-bold">
                           {isCompleted ? "Review" : "Lanjutkan"}
                           <ChevronRight className="h-4 w-4 ml-2" />
                         </Button>
                       </Link>
                     )}
                   </div>
                 );
               })}

               {/* Post-test if any */}
               {course.tests.filter((t: any) => t.type === "POST").map((test: any) => {
                 const allModulesCompleted = course.modules.every((m: any) => completedModules.includes(m.id));
                 const attempt = test.attempts?.[0];
                 
                 return (
                   <div 
                    key={test.id} 
                    className={cn(
                      "flex items-center p-6 bg-slate-50 border-t-2 border-primary/10",
                      !allModulesCompleted ? "opacity-50 grayscale pointer-events-none" : ""
                    )}
                    >
                      <div className={cn(
                        "h-12 w-12 rounded-full flex items-center justify-center mr-6",
                        attempt?.passed ? "bg-emerald-100 text-emerald-600" : "bg-primary/10 text-primary"
                      )}>
                        {attempt?.passed ? <CheckCircle className="h-6 w-6" /> : <GraduationCap className="h-6 w-6" />}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-800">{test.title} (Post-Test)</h3>
                        <p className="text-sm text-slate-500">
                          {attempt 
                            ? `Terakhir mencoba: ${attempt.score}% - ${attempt.passed ? "LULUS" : "GAGAL"}` 
                            : "Selesaikan semua modul untuk membuka ujian akhir."
                          }
                        </p>
                      </div>
                      <Link href={`/courses/${params.courseId}/tests/${test.id}`}>
                        <Button 
                          variant={attempt?.passed ? "secondary" : "default"} 
                          className={cn(
                            "font-bold",
                            !attempt?.passed && "bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20"
                          )} 
                          disabled={!allModulesCompleted}
                        >
                          {attempt ? (attempt.passed ? "Lihat Hasil" : "Coba Lagi") : "Mulai Ujian Akhir"}
                        </Button>
                      </Link>
                   </div>
                 );
               })}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="glass-morphism bg-white shadow-xl border-slate-200">
            <CardHeader>
               <CardTitle className="text-xl">Course Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Progress</span>
                <span className="text-slate-800 font-bold">{Math.round((completedModules.length / course.modules.length) * 100) || 0}%</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-primary h-full transition-all duration-700" 
                  style={{ width: `${(completedModules.length / course.modules.length) * 100 || 0}%` }} 
                />
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4">
                 <div className="p-3 bg-slate-50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-slate-800">{course.modules.length}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Modules</div>
                 </div>
                 <div className="p-3 bg-slate-50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-slate-800">{course.tests.length}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Tests</div>
                 </div>
              </div>
              <div className="pt-6">
                 {/* Sharepoint / External Resources */}
                 <div className="flex items-center text-sm font-bold text-slate-800 mb-3">
                   <ExternalLink className="h-4 w-4 mr-2 text-primary" />
                   Resources
                 </div>
                 <p className="text-xs text-slate-500">Additional materials can be found within specific modules.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
