import { db } from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  FileText, 
  PlayCircle,
  ExternalLink
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ModuleCompletionButton } from "@/components/courses/module-completion-button";
import { Badge } from "@/components/ui/badge";

export default async function ModuleIdPage({
  params
}: {
  params: { courseId: string; moduleId: string }
}) {
  const session = await auth();

  if (!session || !session.user?.id) {
    return redirect("/");
  }

  const userId = session.user.id;

  // Run both queries in parallel
  const [module, userProgress] = await Promise.all([
    db.module.findUnique({
      where: {
        id: params.moduleId,
        courseId: params.courseId,
      },
      include: {
        course: {
          include: {
            modules: {
              where: { isPublished: true },
              orderBy: { position: "asc" },
              select: { id: true, position: true, title: true },
            },
          },
        },
      },
    }) as any,
    db.userProgress.findUnique({
      where: {
        userId_moduleId: {
          userId,
          moduleId: params.moduleId,
        },
      },
      select: { isCompleted: true },
    }),
  ]);

  if (!module) {
    return redirect(`/courses/${params.courseId}`);
  }

  const nextModule = (module.course.modules as any[]).find((m: any) => m.position > module.position);
  const prevModule = (module.course.modules as any[]).find((m: any) => m.position < module.position);

  const isCompleted = !!userProgress?.isCompleted;

  return (
    <div className="flex flex-col h-full bg-slate-50 animate-fade-in-up">
      <div className="p-4 border-b bg-white flex items-center justify-between shadow-sm sticky top-0 z-30">
        <Link href={`/courses/${params.courseId}`} className="flex items-center text-sm font-medium hover:opacity-75 transition">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Course Syllabus
        </Link>
        <div className="flex items-center gap-x-2">
           <span className="text-xs font-bold text-slate-400">Module {module.position}</span>
           <span className="text-sm font-bold text-slate-700">{module.title}</span>
        </div>
        <div className="flex items-center gap-x-2">
           {isCompleted ? (
             <Badge variant="success">Completed</Badge>
           ) : (
             <Badge variant="secondary">In Progress</Badge>
           )}
        </div>
      </div>

      <div className="flex-1 p-6 md:p-10 max-w-6xl mx-auto w-full space-y-8">
        {/* Content Viewer */}
        <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl relative group">
           {module.type === "VIDEO" && (module.url || module.videoUrl) ? (
             <iframe
               src={module.url || module.videoUrl || ""}
               className="w-full h-full"
               allowFullScreen
             />
           ) : module.type === "PDF" ? (
             <iframe
               src={`/api/modules/pdf/${module.id}`}
               className="w-full h-full border-none"
               title={module.title}
             />
           ) : (
             <div className="flex flex-col items-center justify-center h-full text-white/50 space-y-4">
                <FileText className="h-20 w-20 opacity-20" />
                <p>Materi pembelajaran tidak tersedia atau format tidak didukung.</p>
             </div>
           )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            <h1 className="text-3xl font-extrabold text-slate-800">{module.title}</h1>
            <p className="text-slate-600 leading-relaxed">{module.description || "Tidak ada deskripsi untuk modul ini."}</p>
            
            {module.type === "PDF" && (
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-2 rounded-lg mr-3">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-900">Dokumen Pembelajaran</h4>
                    <p className="text-xs text-blue-700">Unduh atau baca dokumen PDF pendukung.</p>
                  </div>
                </div>
                <Link href={`/api/modules/pdf/${module.id}`} target="_blank">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">Buka PDF</Button>
                </Link>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800">Complete & Next</h3>
              <p className="text-xs text-slate-500">Mark this module as finished to unlock the next one.</p>
              
              <ModuleCompletionButton
                moduleId={module.id}
                courseId={params.courseId}
                isCompleted={isCompleted}
                nextModuleId={nextModule?.id}
              />

              <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                <Link href={prevModule ? `/courses/${module.course.id}/modules/${prevModule.id}` : "#"}>
                   <Button variant="ghost" size="sm" disabled={!prevModule}>
                     <ArrowLeft className="h-4 w-4 mr-2" />
                     Prev
                   </Button>
                </Link>
                <Link href={nextModule ? `/courses/${module.course.id}/modules/${nextModule.id}` : "#"}>
                   <Button variant="ghost" size="sm" disabled={!nextModule}>
                     Next
                     <ArrowRight className="h-4 w-4 ml-2" />
                   </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
