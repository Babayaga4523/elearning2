import { db } from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { 
  ArrowLeft, 
  CheckCircle2, 
  ChevronRight, 
  PlayCircle, 
  FileText,
  Clock,
  Layout
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ModuleCompletionButton } from "@/components/courses/module-completion-button";

export default async function ModulePlayerPage({
  params
}: {
  params: { courseId: string; moduleId: string }
}) {
  const session = await auth();
  if (!session || !session.user?.id) {
    return redirect("/");
  }

  const userId = session.user.id;

  const course = await db.course.findUnique({
    where: { id: params.courseId, isPublished: true },
    include: {
      modules: {
        where: { isPublished: true },
        orderBy: { position: "asc" },
        include: {
          userProgress: {
            where: { userId }
          }
        }
      }
    }
  });

  if (!course) return redirect("/courses");

  const module = course.modules.find(m => m.id === params.moduleId);
  if (!module) return redirect(`/courses/${params.courseId}`);

  const isCompleted = module.userProgress[0]?.isCompleted || false;
  
  // Find next module
  const nextModule = course.modules.find(m => m.position === module.position + 1);

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      
      {/* 1. Sidebar (Module List) */}
      <div className="w-80 border-r border-slate-100 flex flex-col bg-slate-50/50">
        <div className="p-6 border-b border-slate-100 bg-white">
          <Link href={`/courses/${params.courseId}`} className="flex items-center gap-2 text-xs font-black text-slate-400 hover:text-primary tracking-widest uppercase mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Link>
          <h3 className="font-black text-slate-900 line-clamp-2 leading-tight">
            {course.title}
          </h3>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {course.modules.map((m, i) => (
            <Link key={m.id} href={`/courses/${params.courseId}/modules/${m.id}`}>
              <div className={cn(
                "p-4 rounded-2xl flex items-center gap-3 transition-all group",
                m.id === params.moduleId 
                  ? "bg-white shadow-md border-l-4 border-primary" 
                  : "hover:bg-white/80 border-l-4 border-transparent"
              )}>
                <div className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                  m.userProgress[0]?.isCompleted ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"
                )}>
                  {m.userProgress[0]?.isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <span className="text-xs font-bold">{i + 1}</span>}
                </div>
                <div className="min-w-0">
                  <p className={cn(
                    "text-sm font-bold truncate",
                    m.id === params.moduleId ? "text-slate-900" : "text-slate-500"
                  )}>
                    {m.title}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Badge variant="secondary" className="px-1.5 py-0 text-[8px] font-black uppercase tracking-tighter bg-white border-slate-100">{m.type}</Badge>
                    {m.duration > 0 && <span className="text-[10px] text-slate-400 font-medium">{m.duration}m</span>}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* 2. Main Player Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top bar */}
        <div className="h-16 border-b border-slate-100 px-8 flex items-center justify-between bg-white shrink-0">
           <div className="flex items-center gap-3 text-slate-400 overflow-hidden pr-4">
              <Layout className="h-4 w-4 shrink-0" />
              <span className="text-sm font-bold truncate">{module.title}</span>
           </div>
           
           <ModuleCompletionButton
              courseId={params.courseId}
              moduleId={params.moduleId}
              isCompleted={isCompleted}
              nextModuleId={nextModule?.id}
           />
        </div>

        {/* Content Viewer */}
        <div className="flex-1 overflow-y-auto bg-slate-100/30 p-8 flex flex-col items-center">
            <div className="max-w-5xl w-full space-y-8">
               
               {/* Media Block */}
                <div className="aspect-video bg-white rounded-[2rem] overflow-hidden shadow-2xl relative group border border-slate-100">
                   {module.type === "VIDEO" ? (
                     module.url?.includes("youtube.com") || module.url?.includes("youtu.be") ? (
                       <iframe
                         src={`https://www.youtube.com/embed/${module.url.split('v=')[1] || module.url.split('/').pop()}`}
                         className="w-full h-full border-none"
                         allowFullScreen
                       />
                     ) : (
                       <div className="flex flex-col items-center justify-center h-full bg-black text-white space-y-4">
                         <PlayCircle className="h-20 w-20 opacity-20 group-hover:opacity-40 transition-opacity" />
                         <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Video Content Ready</p>
                         <Button variant="outline" className="text-white border-white/20 hover:bg-white/10" asChild>
                            <a href={module.url || ""} target="_blank">Buka Link Video</a>
                         </Button>
                       </div>
                     )
                   ) : (
                     <div className="w-full h-full relative">
                        <iframe
                          src={`/api/modules/pdf/${module.id}#toolbar=0`}
                          className="w-full h-full border-none"
                        />
                        <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                           <Button className="bg-rose-500 hover:bg-rose-600 font-black px-6 h-10 rounded-xl shadow-lg" asChild>
                              <a href={`/api/modules/pdf/${module.id}`} target="_blank">Buka di Tab Baru</a>
                           </Button>
                        </div>
                     </div>
                   )}
                </div>

               {/* Description Block */}
               <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-200/50 bg-white">
                  <CardContent className="p-10 space-y-6">
                     <div className="flex items-center justify-between">
                        <div>
                           <Badge variant="outline" className="border-slate-100 text-slate-400 font-bold uppercase tracking-widest mb-2 px-3">Detail Modul</Badge>
                           <h2 className="text-3xl font-black text-slate-900">{module.title}</h2>
                        </div>
                        {nextModule && (
                           <Button variant="ghost" className="font-bold text-primary gap-2 h-12 px-6 rounded-2xl bg-slate-50 hover:bg-slate-100" asChild>
                              <Link href={`/courses/${params.courseId}/modules/${nextModule.id}`}>
                                 Berikutnya <ChevronRight className="h-4 w-4" />
                              </Link>
                           </Button>
                        )}
                     </div>
                     <p className="text-slate-600 text-lg leading-relaxed font-medium">
                        {module.description || "Tidak ada deskripsi tambahan untuk modul ini."}
                     </p>
                  </CardContent>
               </Card>

            </div>
        </div>
      </div>

    </div>
  );
}
