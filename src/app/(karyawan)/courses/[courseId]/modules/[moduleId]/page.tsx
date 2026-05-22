import { db } from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  PlayCircle,
  FileText,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { ModuleCompletionButton } from "@/components/courses/module-completion-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { SmartVideoPlayer } from "@/components/media/SmartVideoPlayer";
import { PDFViewer } from "@/components/media/PDFViewer";

export default async function ModulePlayerPage({
  params,
}: {
  params: { courseId: string; moduleId: string };
}) {
  const session = await auth();
  if (!session?.user?.id) return redirect("/");

  const userId = session.user.id;
  const isAdmin = (session.user.roles?.includes("ADMIN") || session.user.roles?.includes("SUPER_ADMIN"))
    && (session.user.activeRole === "ADMIN" || session.user.activeRole === "SUPER_ADMIN");

  const course = await db.course.findUnique({
    where: { 
      id: params.courseId,
      ...(isAdmin ? {} : { isPublished: true })
    },
    include: {
      modules: {
        where: isAdmin ? {} : { isPublished: true },
        orderBy: { position: "asc" },
        include: { userProgress: { where: { userId } } },
      },
    },
  });

  if (!course) return redirect("/courses");

  const moduleData = course.modules.find((m) => m.id === params.moduleId);
  if (!moduleData) return redirect(`/courses/${params.courseId}`);

  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId: params.courseId } },
  });

  // Admin can bypass enrollment check for preview
  const isEnrollmentActive = isAdmin || (
    !!enrollment &&
    ["IN_PROGRESS", "FAILED", "COMPLETED"].includes(enrollment.status)
  );

  if (!isAdmin && (!isEnrollmentActive || (course.deadlineDate && course.deadlineDate.getTime() < Date.now()))) {
    return redirect(`/courses/${params.courseId}`);
  }

  const isCompleted = moduleData.userProgress[0]?.isCompleted ?? false;
  const currentIndex = course.modules.findIndex((m) => m.id === params.moduleId);
  const prevModule = currentIndex > 0 ? course.modules[currentIndex - 1] : null;
  const nextModule = currentIndex < course.modules.length - 1 ? course.modules[currentIndex + 1] : null;

  const completedCount = course.modules.filter(
    (m) => m.userProgress[0]?.isCompleted
  ).length;
  const progressPct = Math.round((completedCount / course.modules.length) * 100);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Compact Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm">
        <div className="container flex h-14 items-center justify-between px-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Link href={`/courses/${params.courseId}`}>
              <Button variant="ghost" size="sm" className="gap-1.5 h-8">
                <ArrowLeft className="h-3.5 w-3.5" />
                <span className="text-sm">Kembali</span>
              </Button>
            </Link>
            
            <div className="hidden md:flex items-center gap-2 pl-3 border-l">
              <div className={cn(
                "h-7 w-7 rounded-lg flex items-center justify-center",
                moduleData.type === "VIDEO" ? "bg-blue-100 text-blue-600" : "bg-red-100 text-red-600"
              )}>
                {moduleData.type === "VIDEO" ? (
                  <PlayCircle className="h-3.5 w-3.5" />
                ) : (
                  <FileText className="h-3.5 w-3.5" />
                )}
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-medium">
                  Modul {currentIndex + 1} dari {course.modules.length}
                </p>
                <p className="text-xs font-semibold text-slate-900 max-w-[250px] truncate">
                  {moduleData.title}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {prevModule && (
              <Button asChild variant="outline" size="sm" className="h-8 gap-1.5">
                <Link href={`/courses/${params.courseId}/modules/${prevModule.id}`}>
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline text-xs">Prev</span>
                </Link>
              </Button>
            )}
            
            {nextModule && (
              <Button asChild size="sm" className="h-8 gap-1.5">
                <Link href={`/courses/${params.courseId}/modules/${nextModule.id}`}>
                  <span className="hidden sm:inline text-xs">Next</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - 2/3 width */}
          <div className="lg:col-span-2 space-y-4">
            {/* Video/PDF Player Card */}
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                {moduleData.type === "VIDEO" ? (
                  moduleData.videoUrl || moduleData.url ? (
                    <SmartVideoPlayer
                      moduleId={moduleData.id}
                      videoUrl={moduleData.videoUrl || moduleData.url!}
                    />
                  ) : (
                    <div className="w-full aspect-video flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-slate-900 to-slate-800">
                      <div className="h-16 w-16 rounded-xl bg-blue-500/20 flex items-center justify-center">
                        <PlayCircle className="h-8 w-8 text-blue-400" />
                      </div>
                      <div className="text-center space-y-1">
                        <p className="font-semibold text-white">{moduleData.title}</p>
                        <p className="text-xs text-slate-400">Video URL tidak tersedia</p>
                      </div>
                    </div>
                  )
                ) : (
                  moduleData.pdfUrl || moduleData.url ? (
                    <PDFViewer
                      moduleId={moduleData.id}
                      pdfUrl={`/api/modules/pdf/${moduleData.id}`}
                    />
                  ) : (
                    <div className="w-full aspect-video flex items-center justify-center bg-slate-50">
                      <p className="text-sm text-slate-600">PDF tidak tersedia</p>
                    </div>
                  )
                )}
              </CardContent>
            </Card>

            {/* Module Info Card */}
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="gap-1 text-xs">
                      {moduleData.type === "VIDEO" ? (
                        <><PlayCircle className="h-3 w-3" /> Video</>
                      ) : (
                        <><FileText className="h-3 w-3" /> PDF</>
                      )}
                    </Badge>

                    {isCompleted && (
                      <Badge className="bg-green-500 hover:bg-green-600 gap-1 text-xs">
                        <CheckCircle2 className="h-3 w-3" />
                        Selesai
                      </Badge>
                    )}

                    <Badge variant="outline" className="text-xs">
                      {currentIndex + 1}/{course.modules.length}
                    </Badge>
                  </div>

                  <div>
                    <h1 className="text-xl font-bold text-slate-900 mb-1.5">
                      {moduleData.title}
                    </h1>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {moduleData.description ?? "Tidak ada deskripsi tambahan untuk modul ini."}
                    </p>
                  </div>

                  <div className="pt-3 border-t">
                    <ModuleCompletionButton
                      courseId={params.courseId}
                      moduleId={params.moduleId}
                      isCompleted={isCompleted}
                      nextModuleId={nextModule?.id}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - 1/3 width */}
          <div className="space-y-4">
            {/* Course Progress Card */}
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-sm text-slate-900 mb-0.5 line-clamp-2">
                      {course.title}
                    </h3>
                    <p className="text-xs text-slate-500">Progress Kursus</p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-600">Modul Selesai</span>
                      <span className="font-semibold text-slate-900">
                        {completedCount}/{course.modules.length}
                      </span>
                    </div>
                    <Progress value={progressPct} className="h-1.5" />
                    <p className="text-[10px] text-slate-500 text-right">
                      {progressPct}% Complete
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Module List Card */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm text-slate-900 mb-3">
                  Daftar Modul
                </h3>
                
                <nav className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
                  {course.modules.map((m, i) => {
                    const isActive = m.id === params.moduleId;
                    const isDone = m.userProgress[0]?.isCompleted ?? false;

                    return (
                      <Link
                        key={m.id}
                        href={`/courses/${params.courseId}/modules/${m.id}`}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-lg transition-all text-xs",
                          isActive 
                            ? "bg-blue-500 text-white shadow-sm" 
                            : "hover:bg-slate-50 text-slate-700"
                        )}
                      >
                        <div className={cn(
                          "h-6 w-6 rounded-md flex items-center justify-center shrink-0 text-[10px] font-bold",
                          isDone 
                            ? "bg-green-500 text-white" 
                            : isActive 
                            ? "bg-white/20 text-white" 
                            : "bg-slate-100 text-slate-500"
                        )}>
                          {isDone ? <CheckCircle2 className="h-3 w-3" /> : i + 1}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "font-medium leading-tight truncate",
                            isActive ? "text-white" : "text-slate-900"
                          )}>
                            {m.title}
                          </p>
                          <p className={cn(
                            "text-[10px] mt-0.5",
                            isActive ? "text-blue-100" : "text-slate-500"
                          )}>
                            {m.type === "VIDEO" ? "Video" : "PDF"}
                          </p>
                        </div>

                        {isActive && (
                          <ChevronRight className="h-3.5 w-3.5 text-white shrink-0" />
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>

            {/* Next Module Card */}
            {nextModule && (
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
                <CardContent className="p-4">
                  <p className="text-[10px] font-medium text-blue-100 mb-1">
                    Modul Berikutnya
                  </p>
                  <h4 className="text-sm font-semibold mb-3 line-clamp-2">
                    {nextModule.title}
                  </h4>
                  <Button 
                    asChild 
                    variant="secondary" 
                    size="sm"
                    className="w-full gap-1.5 h-8 bg-white text-blue-600 hover:bg-blue-50"
                  >
                    <Link href={`/courses/${params.courseId}/modules/${nextModule.id}`}>
                      <span className="text-xs">Lanjut ke Modul Ini</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
