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
  BookOpen,
  ExternalLink,
  LayoutGrid,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ModuleCompletionButton } from "@/components/courses/module-completion-button";

export default async function ModulePlayerPage({
  params,
}: {
  params: { courseId: string; moduleId: string };
}) {
  const session = await auth();
  if (!session?.user?.id) return redirect("/");

  const userId = session.user.id;

  const course = await db.course.findUnique({
    where: { id: params.courseId, isPublished: true },
    include: {
      modules: {
        where: { isPublished: true },
        orderBy: { position: "asc" },
        include: { userProgress: { where: { userId } } },
      },
    },
  });

  if (!course) return redirect("/courses");

  const module = course.modules.find((m) => m.id === params.moduleId);
  if (!module) return redirect(`/courses/${params.courseId}`);

  const isCompleted = module.userProgress[0]?.isCompleted ?? false;
  const currentIndex = course.modules.findIndex((m) => m.id === params.moduleId);
  const prevModule = currentIndex > 0 ? course.modules[currentIndex - 1] : null;
  const nextModule = currentIndex < course.modules.length - 1 ? course.modules[currentIndex + 1] : null;

  const completedCount = course.modules.filter(
    (m) => m.userProgress[0]?.isCompleted
  ).length;
  const progressPct = Math.round((completedCount / course.modules.length) * 100);

  // YouTube embed URL helper
  function getYoutubeEmbed(url: string): string | null {
    const match =
      url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^?]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}?rel=0&modestbranding=1` : null;
  }

  const isYoutube =
    module.type === "VIDEO" &&
    module.url &&
    (module.url.includes("youtube.com") || module.url.includes("youtu.be"));

  const embedUrl = isYoutube && module.url ? getYoutubeEmbed(module.url) : null;

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "#F0F2F7", fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* ══════════════════════════════════════════
          LEFT SIDEBAR
      ══════════════════════════════════════════ */}
      <aside
        className="hidden lg:flex flex-col w-72 xl:w-80 shrink-0 h-full overflow-hidden"
        style={{
          background: "#0F1C3F",
          borderRight: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        {/* Sidebar Header */}
        <div
          className="shrink-0 px-5 pt-6 pb-5 space-y-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <Link
            href={`/courses/${params.courseId}`}
            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all group"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            <span className="flex items-center justify-center h-6 w-6 rounded-lg transition-all group-hover:bg-white/10">
              <ArrowLeft className="h-3.5 w-3.5 group-hover:text-white" />
            </span>
            <span className="group-hover:text-white transition-colors">Kembali ke Kursus</span>
          </Link>

          <div>
            <p
              className="text-[9px] font-black uppercase tracking-[0.2em] mb-1.5"
              style={{ color: "#E8A020" }}
            >
              {course.modules.length} Modul
            </p>
            <h3
              className="font-black text-white leading-tight line-clamp-2 text-sm"
              style={{ fontFamily: "'Lexend Deca', sans-serif" }}
            >
              {course.title}
            </h3>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold" style={{ color: "rgba(255,255,255,0.35)" }}>
                Progres
              </span>
              <span className="text-[10px] font-black" style={{ color: "#E8A020" }}>
                {completedCount}/{course.modules.length}
              </span>
            </div>
            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{ background: "rgba(255,255,255,0.08)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${progressPct}%`,
                  background: "linear-gradient(90deg, #E8A020, #F5C842)",
                }}
              />
            </div>
          </div>
        </div>

        {/* Module List */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {course.modules.map((m, i) => {
            const isActive = m.id === params.moduleId;
            const isDone = m.userProgress[0]?.isCompleted ?? false;

            return (
              <Link
                key={m.id}
                href={`/courses/${params.courseId}/modules/${m.id}`}
                className="flex items-center gap-3 p-3 rounded-2xl transition-all group relative"
                style={{
                  background: isActive ? "rgba(232,160,32,0.12)" : "transparent",
                  border: isActive
                    ? "1px solid rgba(232,160,32,0.25)"
                    : "1px solid transparent",
                }}
              >
                {/* Active indicator */}
                {isActive && (
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-r-full"
                    style={{ background: "#E8A020" }}
                  />
                )}

                {/* Step icon */}
                <div
                  className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-black transition-all"
                  style={{
                    background: isDone
                      ? "rgba(16,185,129,0.15)"
                      : isActive
                      ? "rgba(232,160,32,0.2)"
                      : "rgba(255,255,255,0.06)",
                    color: isDone ? "#34D399" : isActive ? "#E8A020" : "rgba(255,255,255,0.3)",
                    border: isDone
                      ? "1px solid rgba(52,211,153,0.3)"
                      : isActive
                      ? "1px solid rgba(232,160,32,0.3)"
                      : "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                </div>

                {/* Module info */}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-xs font-bold leading-snug truncate transition-colors"
                    style={{
                      color: isActive
                        ? "white"
                        : isDone
                        ? "rgba(255,255,255,0.55)"
                        : "rgba(255,255,255,0.4)",
                    }}
                  >
                    {m.title}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md"
                      style={{
                        background: m.type === "VIDEO"
                          ? "rgba(99,102,241,0.15)"
                          : "rgba(239,68,68,0.15)",
                        color: m.type === "VIDEO"
                          ? "#818CF8"
                          : "#FC8181",
                      }}
                    >
                      {m.type === "VIDEO" ? "Video" : "PDF"}
                    </span>
                    {(m as any).duration > 0 && (
                      <span
                        className="text-[9px] font-bold"
                        style={{ color: "rgba(255,255,255,0.2)" }}
                      >
                        {(m as any).duration}m
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* ══════════════════════════════════════════
          MAIN CONTENT AREA
      ══════════════════════════════════════════ */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ── Top Bar ── */}
        <header
          className="shrink-0 h-14 flex items-center gap-4 px-4 md:px-6"
          style={{
            background: "white",
            borderBottom: "1px solid #E2E6F0",
            boxShadow: "0 1px 4px rgba(15,28,63,0.05)",
          }}
        >
          {/* Mobile back */}
          <Link
            href={`/courses/${params.courseId}`}
            className="lg:hidden flex items-center justify-center h-9 w-9 rounded-xl transition-all hover:opacity-70"
            style={{ background: "#F0F2F7", border: "1px solid #D6DBE8" }}
          >
            <ArrowLeft className="h-4 w-4" style={{ color: "#0F1C3F" }} />
          </Link>

          {/* Module breadcrumb */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div
              className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
              style={{
                background: module.type === "VIDEO" ? "#EEF2FF" : "#FFF0F0",
                color: module.type === "VIDEO" ? "#6366F1" : "#EF4444",
              }}
            >
              {module.type === "VIDEO" ? (
                <PlayCircle className="h-3.5 w-3.5" />
              ) : (
                <FileText className="h-3.5 w-3.5" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-widest leading-none mb-0.5" style={{ color: "#9AAABF" }}>
                Modul {currentIndex + 1} dari {course.modules.length}
              </p>
              <p className="text-sm font-black truncate leading-none" style={{ color: "#0F1C3F" }}>
                {module.title}
              </p>
            </div>
          </div>

          {/* Navigation arrows */}
          <div className="flex items-center gap-2 shrink-0">
            {prevModule ? (
              <Link href={`/courses/${params.courseId}/modules/${prevModule.id}`}>
                <button
                  className="flex items-center gap-1.5 h-9 px-3 rounded-xl font-black text-xs transition-all hover:brightness-95"
                  style={{
                    background: "#F0F2F7",
                    border: "1px solid #D6DBE8",
                    color: "#0F1C3F",
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Sebelumnya</span>
                </button>
              </Link>
            ) : (
              <button
                disabled
                className="flex items-center gap-1.5 h-9 px-3 rounded-xl font-black text-xs opacity-30 cursor-not-allowed"
                style={{ background: "#F0F2F7", border: "1px solid #D6DBE8", color: "#0F1C3F" }}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Sebelumnya</span>
              </button>
            )}

            <ModuleCompletionButton
              courseId={params.courseId}
              moduleId={params.moduleId}
              isCompleted={isCompleted}
              nextModuleId={nextModule?.id}
            />
          </div>
        </header>

        {/* ── Scrollable Body ── */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 pb-16 space-y-5">

            {/* ── Media Player ── */}
            <div
              className="rounded-3xl overflow-hidden shadow-xl relative"
              style={{
                background: module.type === "VIDEO" ? "#000" : "white",
                border: "1px solid #E2E6F0",
                aspectRatio: module.type === "VIDEO" ? "16/9" : undefined,
                minHeight: module.type === "PDF" ? "75vh" : undefined,
              }}
            >
              {module.type === "VIDEO" ? (
                embedUrl ? (
                  <iframe
                    src={embedUrl}
                    className="w-full h-full border-none"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                ) : (
                  /* Non-YouTube video fallback */
                  <div className="w-full h-full flex flex-col items-center justify-center gap-6"
                    style={{ background: "linear-gradient(135deg, #0F1C3F, #1A2E5A)" }}
                  >
                    <div
                      className="h-20 w-20 rounded-3xl flex items-center justify-center"
                      style={{ background: "rgba(232,160,32,0.15)", border: "1px solid rgba(232,160,32,0.3)" }}
                    >
                      <PlayCircle className="h-10 w-10" style={{ color: "#E8A020" }} />
                    </div>
                    <div className="text-center space-y-2">
                      <p className="font-black text-white text-lg">{module.title}</p>
                      <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>
                        Konten video tersedia di tautan eksternal
                      </p>
                    </div>
                    <a
                      href={module.url ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 h-12 px-7 rounded-2xl font-black text-sm transition-all hover:brightness-110 active:scale-[0.97]"
                      style={{
                        background: "linear-gradient(135deg, #E8A020, #F5C842)",
                        color: "#0F1C3F",
                        boxShadow: "0 4px 20px rgba(232,160,32,0.3)",
                      }}
                    >
                      <ExternalLink className="h-4 w-4" />
                      Buka Video
                    </a>
                  </div>
                )
              ) : (
                /* PDF Viewer */
                <div className="relative w-full" style={{ height: "75vh" }}>
                  <iframe
                    src={`/api/modules/pdf/${module.id}#toolbar=0&navpanes=0`}
                    className="w-full h-full border-none rounded-3xl"
                  />
                  {/* Floating open button */}
                  <a
                    href={`/api/modules/pdf/${module.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-5 right-5 flex items-center gap-2 h-10 px-4 rounded-xl font-black text-xs transition-all hover:brightness-110 shadow-lg"
                    style={{
                      background: "#0F1C3F",
                      color: "white",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    <ExternalLink className="h-3.5 w-3.5" style={{ color: "#E8A020" }} />
                    Buka di Tab Baru
                  </a>
                </div>
              )}
            </div>

            {/* ── Module Info Card ── */}
            <div
              className="rounded-3xl p-7 md:p-8"
              style={{
                background: "white",
                border: "1px solid #E2E6F0",
                boxShadow: "0 1px 4px rgba(15,28,63,0.05)",
              }}
            >
              <div className="flex flex-col md:flex-row md:items-start gap-5 justify-between">
                <div className="space-y-3 flex-1">
                  {/* Type badge */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl"
                      style={{
                        background: module.type === "VIDEO" ? "#EEF2FF" : "#FFF0F0",
                        color: module.type === "VIDEO" ? "#6366F1" : "#EF4444",
                      }}
                    >
                      {module.type === "VIDEO" ? (
                        <PlayCircle className="h-3 w-3" />
                      ) : (
                        <FileText className="h-3 w-3" />
                      )}
                      {module.type === "VIDEO" ? "Video" : "Dokumen PDF"}
                    </span>

                    {isCompleted && (
                      <span
                        className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl"
                        style={{ background: "#F0FDF4", color: "#059669", border: "1px solid #BBF7D0" }}
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        Selesai
                      </span>
                    )}

                    <span
                      className="text-[10px] font-bold px-3 py-1.5 rounded-xl"
                      style={{ background: "#F0F2F7", color: "#7A8599" }}
                    >
                      Modul {currentIndex + 1}/{course.modules.length}
                    </span>
                  </div>

                  <h2
                    className="text-xl md:text-2xl font-black leading-tight"
                    style={{ color: "#0F1C3F", fontFamily: "'Lexend Deca', sans-serif" }}
                  >
                    {module.title}
                  </h2>

                  <p className="text-sm font-medium leading-relaxed" style={{ color: "#64748B" }}>
                    {(module as any).description || "Tidak ada deskripsi tambahan untuk modul ini."}
                  </p>
                </div>

                {/* Next module CTA */}
                {nextModule && (
                  <Link
                    href={`/courses/${params.courseId}/modules/${nextModule.id}`}
                    className="shrink-0 group"
                  >
                    <div
                      className="flex items-center gap-4 p-4 rounded-2xl transition-all hover:brightness-95 cursor-pointer min-w-[220px]"
                      style={{
                        background: "#F8FAFC",
                        border: "1px solid #E2E6F0",
                      }}
                    >
                      <div
                        className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{
                          background: nextModule.type === "VIDEO" ? "#EEF2FF" : "#FFF0F0",
                          color: nextModule.type === "VIDEO" ? "#6366F1" : "#EF4444",
                        }}
                      >
                        {nextModule.type === "VIDEO" ? (
                          <PlayCircle className="h-5 w-5" />
                        ) : (
                          <FileText className="h-5 w-5" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: "#9AAABF" }}>
                          Modul Berikutnya
                        </p>
                        <p className="text-xs font-black truncate" style={{ color: "#0F1C3F" }}>
                          {nextModule.title}
                        </p>
                      </div>
                      <ChevronRight
                        className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5"
                        style={{ color: "#9AAABF" }}
                      />
                    </div>
                  </Link>
                )}
              </div>
            </div>

            {/* ── Mobile: Module List (accordion-style) ── */}
            <details className="lg:hidden rounded-3xl overflow-hidden" style={{ background: "white", border: "1px solid #E2E6F0" }}>
              <summary
                className="flex items-center gap-3 p-5 cursor-pointer select-none font-black text-sm"
                style={{ color: "#0F1C3F" }}
              >
                <LayoutGrid className="h-4 w-4" style={{ color: "#E8A020" }} />
                Semua Modul ({completedCount}/{course.modules.length} selesai)
              </summary>
              <div
                className="border-t px-3 py-3 space-y-1"
                style={{ borderColor: "#E2E6F0" }}
              >
                {course.modules.map((m, i) => {
                  const isActive = m.id === params.moduleId;
                  const isDone = m.userProgress[0]?.isCompleted ?? false;
                  return (
                    <Link
                      key={m.id}
                      href={`/courses/${params.courseId}/modules/${m.id}`}
                      className="flex items-center gap-3 p-3 rounded-xl transition-all"
                      style={{
                        background: isActive ? "#F0F2F7" : "transparent",
                        border: isActive ? "1px solid #D6DBE8" : "1px solid transparent",
                      }}
                    >
                      <div
                        className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-black"
                        style={{
                          background: isDone ? "#F0FDF4" : "#F0F2F7",
                          color: isDone ? "#059669" : "#7A8599",
                        }}
                      >
                        {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                      </div>
                      <p className="text-xs font-bold truncate flex-1" style={{ color: isActive ? "#0F1C3F" : "#64748B" }}>
                        {m.title}
                      </p>
                      {isActive && <ChevronRight className="h-3.5 w-3.5 shrink-0" style={{ color: "#E8A020" }} />}
                    </Link>
                  );
                })}
              </div>
            </details>

          </div>
        </div>
      </main>
    </div>
  );
}