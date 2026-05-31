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
    <div className="min-h-screen bg-[#F8FAFC] font-sans">
      {/* Compact Header */}
      <header className="sticky top-0 z-50 w-full border-b border-[#E4E7EC]/80 bg-white/80 backdrop-blur-md shadow-2xs">
        <div className="container flex h-14 items-center justify-between px-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Link href={`/courses/${params.courseId}`}>
              <Button 
                variant="ghost" 
                size="sm" 
                className="group gap-1.5 h-8.5 text-slate-600 hover:text-[#0F1C3F] hover:bg-slate-100/80 active:scale-95 transition-transform font-semibold rounded-lg"
              >
                <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform duration-200" />
                <span className="text-xs">Kembali</span>
              </Button>
            </Link>
            
            <div className="hidden md:flex items-center gap-2.5 pl-3 border-l border-slate-200">
              <div className={cn(
                "h-7 w-7 rounded-lg flex items-center justify-center border",
                moduleData.type === "VIDEO" 
                  ? "bg-[#E8A020]/10 text-[#E8A020] border-[#E8A020]/20" 
                  : "bg-rose-50 text-rose-600 border-rose-100"
              )}>
                {moduleData.type === "VIDEO" ? (
                  <PlayCircle className="h-3.5 w-3.5" />
                ) : (
                  <FileText className="h-3.5 w-3.5" />
                )}
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Materi {currentIndex + 1} dari {course.modules.length}
                </p>
                <p className="text-xs font-extrabold text-[#0F1C3F] max-w-[250px] truncate leading-tight mt-0.5">
                  {moduleData.title}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {prevModule && (
              <Button asChild variant="outline" size="sm" className="h-8.5 gap-1.5 rounded-lg border-slate-200 text-slate-600 hover:text-slate-900 active:scale-95 transition-all text-xs font-semibold">
                <Link href={`/courses/${params.courseId}/modules/${prevModule.id}`}>
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Sebelumnya</span>
                </Link>
              </Button>
            )}
            
            {nextModule && (
              <Button asChild size="sm" className="h-8.5 gap-1.5 bg-[#0F1C3F] hover:bg-[#15254F] text-white rounded-lg active:scale-95 transition-all text-xs font-bold border-0 shadow-xs">
                <Link href={`/courses/${params.courseId}/modules/${nextModule.id}`}>
                  <span className="hidden sm:inline">Selanjutnya</span>
                  <ChevronRight className="h-3.5 w-3.5 text-white" />
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
            <Card className="overflow-hidden border-slate-100 shadow-sm rounded-2xl bg-white">
              <CardContent className="p-0">
                {moduleData.type === "VIDEO" ? (
                  moduleData.videoUrl || moduleData.url ? (
                    <SmartVideoPlayer
                      moduleId={moduleData.id}
                      videoUrl={moduleData.videoUrl || moduleData.url!}
                    />
                  ) : (
                    <div className="w-full aspect-video flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-[#0F1C3F] to-[#15254F]">
                      <div className="h-16 w-16 rounded-xl bg-white/10 flex items-center justify-center border border-white/5 shadow-lg">
                        <PlayCircle className="h-8 w-8 text-[#E8A020]" />
                      </div>
                      <div className="text-center space-y-1">
                        <p className="font-bold text-white tracking-wide">{moduleData.title}</p>
                        <p className="text-xs text-slate-300">Video URL tidak tersedia</p>
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
                    <div className="w-full aspect-video flex items-center justify-center bg-slate-50 border border-slate-100 rounded-xl">
                      <p className="text-sm text-slate-500 font-medium">Dokumen PDF tidak tersedia</p>
                    </div>
                  )
                )}
              </CardContent>
            </Card>

            {/* Module Info Card */}
            <Card className="border-slate-100 shadow-xs rounded-2xl bg-white">
              <CardContent className="p-5">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className={cn(
                      "gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-md border border-slate-150 shadow-3xs uppercase tracking-wider",
                      moduleData.type === "VIDEO" 
                        ? "bg-[#E8A020]/10 text-[#E8A020]" 
                        : "bg-rose-50 text-rose-600 border-rose-100"
                    )}>
                      {moduleData.type === "VIDEO" ? (
                        <><PlayCircle className="h-3 w-3" /> Video</>
                      ) : (
                        <><FileText className="h-3 w-3" /> Dokumen PDF</>
                      )}
                    </Badge>

                    {isCompleted && (
                      <Badge className="bg-emerald-500 hover:bg-emerald-600 gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-3xs border-0 text-white uppercase tracking-wider">
                        <CheckCircle2 className="h-3 w-3 text-white" />
                        Selesai Dibaca
                      </Badge>
                    )}

                    <Badge variant="outline" className="text-[10px] font-semibold px-2 py-0.5 rounded-md text-slate-500 border-slate-200">
                      Materi {currentIndex + 1} dari {course.modules.length}
                    </Badge>
                  </div>

                  <div>
                    <h1 className="text-xl font-extrabold text-[#0F1C3F] tracking-tight leading-tight mb-2">
                      {moduleData.title}
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                      {moduleData.description ?? "Tidak ada deskripsi tambahan untuk materi modul ini."}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100/80 mt-2">
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
            <Card className="border-slate-100 shadow-xs rounded-2xl bg-white">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-bold text-sm text-[#0F1C3F] mb-0.5 line-clamp-2 leading-snug">
                      {course.title}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Progress Kursus</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">Modul Selesai</span>
                      <span className="font-bold text-[#0F1C3F]">
                        {completedCount} dari {course.modules.length}
                      </span>
                    </div>
                    <Progress value={progressPct} className="h-2 bg-slate-100" />
                    <p className="text-[10px] text-slate-500 font-bold text-right tracking-tight">
                      {progressPct}% SELESAI
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Module List Card */}
            <Card className="border-slate-100 shadow-xs rounded-2xl bg-white">
              <CardContent className="p-4">
                <h3 className="font-bold text-[10px] text-[#0F1C3F] uppercase tracking-wider mb-3">
                  Daftar Modul
                </h3>
                
                <nav className="space-y-2 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
                  {course.modules.map((m, i) => {
                    const isActive = m.id === params.moduleId;
                    const isDone = m.userProgress[0]?.isCompleted ?? false;

                    return (
                      <Link
                        key={m.id}
                        href={`/courses/${params.courseId}/modules/${m.id}`}
                        className={cn(
                          "group flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-xs active:scale-[0.98] border border-transparent",
                          isActive 
                            ? "bg-[#E8EDF7]/50 text-[#0F1C3F] border-l-4 border-l-[#E8A020] pl-2 font-semibold shadow-2xs" 
                            : "hover:bg-slate-50 text-slate-700 bg-white border border-slate-100"
                        )}
                      >
                        <div className={cn(
                          "h-6 w-6 rounded-md flex items-center justify-center shrink-0 text-[10px] font-bold transition-all duration-200",
                          isDone 
                            ? "bg-[#12B76A] text-white" 
                            : isActive 
                            ? "bg-[#0F1C3F] text-white" 
                            : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
                        )}>
                          {isDone ? <CheckCircle2 className="h-3 w-3" /> : i + 1}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "font-bold leading-tight truncate transition-colors duration-200",
                            isActive ? "text-[#0F1C3F]" : "text-slate-800 group-hover:text-[#0F1C3F]"
                          )}>
                            {m.title}
                          </p>
                          <p className={cn(
                            "text-[10px] mt-0.5 font-medium transition-colors duration-200",
                            isActive ? "text-[#0F1C3F]/75" : "text-slate-400 group-hover:text-slate-500"
                          )}>
                            {m.type === "VIDEO" ? "Materi Video" : "Dokumen PDF"}
                          </p>
                        </div>

                        {isActive && (
                          <ChevronRight className="h-3.5 w-3.5 text-[#0F1C3F] shrink-0 animate-pulse" />
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>

            {/* Next Module Card */}
            {nextModule && (
              <Card className="bg-gradient-to-br from-[#0F1C3F] via-[#12224A] to-[#15254F] text-white border-0 shadow-md relative overflow-hidden group rounded-2xl">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#E8A020]/10 to-transparent rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />
                <CardContent className="p-4 relative z-10">
                  <p className="text-[10px] font-bold text-[#E8A020] mb-1 tracking-wider uppercase">
                    Modul Berikutnya
                  </p>
                  <h4 className="text-sm font-bold mb-4 line-clamp-2 text-white/95 leading-snug">
                    {nextModule.title}
                  </h4>
                  <Button 
                    asChild 
                    variant="secondary" 
                    size="sm"
                    className="w-full gap-1.5 h-8.5 bg-[#E8A020] hover:bg-[#d08f1b] text-white border-0 transition-transform duration-200 active:scale-[0.98] font-bold text-xs"
                  >
                    <Link href={`/courses/${params.courseId}/modules/${nextModule.id}`}>
                      <span className="text-xs">Lanjut ke Modul Ini</span>
                      <ChevronRight className="h-4 w-4" />
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
