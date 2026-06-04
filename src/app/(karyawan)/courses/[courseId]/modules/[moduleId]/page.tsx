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
  List,
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

// Next.js 15: params are now Promises
interface PageProps {
  params: Promise<{ courseId: string; moduleId: string }>;
}

export default async function ModulePlayerPage({ params }: PageProps) {
  const { courseId, moduleId } = await params;
  const session = await auth();
  if (!session?.user?.id) return redirect("/");

  const userId = session.user.id;
  const isAdmin =
    (session.user.roles?.includes("ADMIN") ||
      session.user.roles?.includes("SUPER_ADMIN")) &&
    (session.user.activeRole === "ADMIN" ||
      session.user.activeRole === "SUPER_ADMIN");

  const course = await db.course.findUnique({
    where: {
      id: courseId,
      ...(isAdmin ? {} : { isPublished: true }),
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

  const moduleData = course.modules.find((m) => m.id === moduleId);
  if (!moduleData) return redirect(`/courses/${courseId}`);

  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId: courseId } },
  });

  const isEnrollmentActive =
    isAdmin ||
    (!!enrollment &&
      ["IN_PROGRESS", "FAILED", "COMPLETED"].includes(enrollment.status));

  if (
    !isAdmin &&
    (!isEnrollmentActive ||
      (course.deadlineDate && course.deadlineDate.getTime() < Date.now()))
  ) {
    return redirect(`/courses/${courseId}`);
  }

  const isCompleted = moduleData.userProgress[0]?.isCompleted ?? false;
  const currentIndex = course.modules.findIndex(
    (m) => m.id === moduleId
  );
  const prevModule = currentIndex > 0 ? course.modules[currentIndex - 1] : null;
  const nextModule =
    currentIndex < course.modules.length - 1
      ? course.modules[currentIndex + 1]
      : null;

  const completedCount = course.modules.filter(
    (m) => m.userProgress[0]?.isCompleted
  ).length;
  const progressPct = Math.round(
    (completedCount / course.modules.length) * 100
  );

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      {/* ═══ Sticky Header ═══════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 w-full border-b border-[#E4E7EC] bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Left: Back button + Module info */}
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href={`/courses/${courseId}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[#475467] hover:text-[#0F1C3F] hover:bg-[#F8F9FB] transition-colors font-medium text-sm shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Kembali</span>
            </Link>

            <div className="hidden md:flex items-center gap-3 pl-3 border-l border-[#E4E7EC]">
              {/* Module type icon */}
              <div
                className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                  moduleData.type === "VIDEO"
                    ? "bg-[#E8A020]/10 text-[#E8A020]"
                    : "bg-[#FEF3DC] text-[#C4861A]"
                )}
              >
                {moduleData.type === "VIDEO" ? (
                  <PlayCircle className="h-4 w-4" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
              </div>

              {/* Module title */}
              <div className="min-w-0">
                <p className="text-[10px] text-[#98A2B3] font-semibold uppercase tracking-wider">
                  Modul {currentIndex + 1} dari {course.modules.length}
                </p>
                <p className="text-sm font-semibold text-[#101828] truncate max-w-[200px]">
                  {moduleData.title}
                </p>
              </div>
            </div>
          </div>

          {/* Right: Navigation buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {prevModule ? (
              <Link href={`/courses/${courseId}/modules/${prevModule.id}`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1.5 border-[#E4E7EC] text-[#475467] hover:text-[#0F1C3F] hover:border-[#0F1C3F]/30 hover:bg-[#F8F9FB] transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Sebelumnya</span>
                </Button>
              </Link>
            ) : (
              <div className="w-[88px]" />
            )}

            {nextModule ? (
              <Link href={`/courses/${courseId}/modules/${nextModule.id}`}>
                <Button
                  size="sm"
                  className="h-9 gap-1.5 bg-[#0F1C3F] hover:bg-[#1A2D5A] text-white border-0 transition-colors font-semibold"
                >
                  <span className="hidden sm:inline">Selanjutnya</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <div className="w-[88px]" />
            )}
          </div>
        </div>
      </header>

      {/* ═══ Main Content ═══════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ─── Left: Video/PDF Player + Info ─────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">
            {/* Video/PDF Player Card */}
            <Card className="overflow-hidden border-[#E4E7EC] shadow-sm rounded-xl">
              <CardContent className="p-0">
                {moduleData.type === "VIDEO" ? (
                  moduleData.videoUrl || moduleData.url ? (
                    <SmartVideoPlayer
                      moduleId={moduleData.id}
                      videoUrl={moduleData.videoUrl || moduleData.url!}
                    />
                  ) : (
                    <div className="w-full aspect-video flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-[#0F1C3F] to-[#1A2D5A]">
                      <div className="h-16 w-16 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
                        <PlayCircle className="h-8 w-8 text-[#E8A020]" />
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-white">
                          {moduleData.title}
                        </p>
                        <p className="text-sm text-white/60 mt-1">
                          Video tidak tersedia
                        </p>
                      </div>
                    </div>
                  )
                ) : moduleData.pdfUrl || moduleData.url ? (
                  <PDFViewer
                    moduleId={moduleData.id}
                    pdfUrl={`/api/modules/pdf/${moduleData.id}`}
                  />
                ) : (
                  <div className="w-full aspect-video flex items-center justify-center bg-[#F8F9FB] border border-[#E4E7EC]">
                    <div className="text-center">
                      <FileText className="h-12 w-12 text-[#98A2B3] mx-auto mb-3" />
                      <p className="text-sm text-[#475467] font-medium">
                        Dokumen PDF tidak tersedia
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Module Info Card */}
            <Card className="border-[#E4E7EC] shadow-sm rounded-xl">
<CardContent className="p-5">
<div className="flex flex-wrap items-center gap-2 mb-4">
                  {/* Type badge */}
                  <Badge
                    className={cn(
                      "gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg border",
                      moduleData.type === "VIDEO"
                        ? "bg-[#E8A020]/10 text-[#C4861A] border-[#E8A020]/20"
                        : "bg-[#FEF3DC] text-[#C4861A] border-[#F5C05A]/30"
                    )}
                  >
                    {moduleData.type === "VIDEO" ? (
                      <>
                        <PlayCircle className="h-3.5 w-3.5" />
                        Video
                      </>
                    ) : (
                      <>
                        <FileText className="h-3.5 w-3.5" />
                        Dokumen PDF
                      </>
                    )}
                  </Badge>

                  {/* Completed badge */}
                  {isCompleted && (
                    <Badge className="gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-[#ECFDF3] text-[#027A48] border border-[#6CE9A6]">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Selesai
                    </Badge>
                  )}

                  {/* Position badge */}
                  <Badge
                    variant="outline"
                    className="text-[11px] font-medium px-2.5 py-1 rounded-lg text-[#475467] border-[#E4E7EC]"
                  >
                    Modul {currentIndex + 1} dari {course.modules.length}
                  </Badge>
                </div>

                {/* Title */}
                <h1 className="text-xl font-bold text-[#101828] mb-3 font-['Lexend_Deca']">
                  {moduleData.title}
                </h1>

                {/* Description */}
                {moduleData.description && (
                  <p className="text-sm text-[#475467] leading-relaxed mb-5">
                    {moduleData.description}
                  </p>
                )}

                {/* Completion button */}
                <div className="pt-4 border-t border-[#E4E7EC]">
                  <ModuleCompletionButton
                    courseId={courseId}
                    moduleId={moduleId}
                    isCompleted={isCompleted}
                    nextModuleId={nextModule?.id}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ─── Right: Sidebar ─────────────────────────────────────────── */}
          <div className="space-y-4">
            {/* Course Progress Card */}
            <Card className="border-[#E4E7EC] shadow-sm rounded-xl">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold text-[#101828] mb-1 font-['Lexend_Deca']">
                  {course.title}
                </h3>
                <p className="text-[11px] text-[#98A2B3] font-medium uppercase tracking-wider mb-4">
                  Progress Kursus
                </p>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[#475467]">Modul Selesai</span>
                    <span className="font-semibold text-[#101828]">
                      {completedCount} dari {course.modules.length}
                    </span>
                  </div>
                  <Progress value={progressPct} className="h-2 bg-[#F1F3F7]" />
                  <p className="text-xs font-semibold text-[#475467] text-right">
                    {progressPct}% SELESAI
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Module List Card */}
            <Card className="border-[#E4E7EC] shadow-sm rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <List className="h-4 w-4 text-[#475467]" />
                  <h3 className="text-sm font-semibold text-[#101828] font-['Lexend_Deca']">
                    Daftar Modul
                  </h3>
                </div>

                <nav className="space-y-2 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin">
                  {course.modules.map((m, i) => {
                    const isActive = m.id === moduleId;
                    const isDone = m.userProgress[0]?.isCompleted ?? false;

                    return (
                      <Link
                        key={m.id}
                        href={`/courses/${courseId}/modules/${m.id}`}
                        className={cn(
                          "group flex items-center gap-3 p-3 rounded-lg transition-all duration-200 text-sm",
                          isActive
                            ? "bg-[#E8EDF7] text-[#0F1C3F] border-l-4 border-l-[#E8A020] border border-[#E8A020]/20"
                            : "bg-white border border-[#E4E7EC] hover:border-[#0F1C3F]/30 hover:bg-[#F8F9FB]"
                        )}
                      >
                        {/* Number circle */}
                        <div
                          className={cn(
                            "h-7 w-7 rounded-lg flex items-center justify-center shrink-0 text-[11px] font-bold",
                            isDone
                              ? "bg-[#12B76A] text-white"
                              : isActive
                              ? "bg-[#0F1C3F] text-white"
                              : "bg-[#F1F3F7] text-[#475467] group-hover:bg-[#E4E7EC]"
                          )}
                        >
                          {isDone ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : (
                            i + 1
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p
                            className={cn(
                              "font-medium text-sm leading-tight truncate",
                              isActive ? "text-[#0F1C3F]" : "text-[#344054]"
                            )}
                          >
                            {m.title}
                          </p>
                          <p className="text-[11px] text-[#98A2B3] mt-0.5">
                            {m.type === "VIDEO" ? "Video" : "PDF"}
                          </p>
                        </div>

                        {/* Active indicator */}
                        {isActive && (
                          <ChevronRight className="h-4 w-4 text-[#E8A020] shrink-0" />
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>

            {/* Next Module Card */}
            {nextModule && (
              <Card className="bg-gradient-to-br from-[#0F1C3F] to-[#1A2D5A] text-white border-0 shadow-md rounded-xl overflow-hidden">
                <CardContent className="p-4">
                  <p className="text-[10px] font-semibold text-[#E8A020] uppercase tracking-wider mb-1">
                    Modul Berikutnya
                  </p>
                  <h4 className="text-sm font-semibold mb-4 line-clamp-2">
                    {nextModule.title}
                  </h4>
                  <Link
                    href={`/courses/${courseId}/modules/${nextModule.id}`}
                  >
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full gap-1.5 h-9 bg-[#E8A020] hover:bg-[#C4861A] text-white border-0 font-semibold"
                    >
                      Lanjut ke Modul Ini
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
