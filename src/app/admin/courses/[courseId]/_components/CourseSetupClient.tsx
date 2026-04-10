"use client";

import { 
  Course, 
  Module, 
  Test, 
  Question, 
  Option 
} from "@prisma/client";
import { 
  PlusCircle, 
  GripVertical, 
  Pencil, 
  Trash, 
  BookOpen, 
  GraduationCap, 
  Clock, 
  Trophy,
  FileVideo,
  FileText,
  LayoutDashboard,
  MoreVertical
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ModuleFormModal } from "./ModuleFormModal";
import { ConfirmDraftDialog } from "@/components/admin/ConfirmDraftDialog";
import { deleteModule } from "../actions";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

interface CourseSetupClientProps {
  course: Course;
  modules: Module[];
  preTest: (Test & { questions: (Question & { options: Option[] })[] }) | null;
  postTest: (Test & { questions: (Question & { options: Option[] })[] }) | null;
}

export const CourseSetupClient = ({
  course,
  modules,
  preTest,
  postTest
}: CourseSetupClientProps) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showDraftConfirm, setShowDraftConfirm] = useState(false);
  const [moduleToDelete, setModuleToDelete] = useState<string | null>(null);

  const onDeleteModule = async (moduleId: string) => {
    // If course is published, warn before deleting
    if (course.isPublished) {
      setModuleToDelete(moduleId);
      setShowDraftConfirm(true);
      return;
    }
    
    executeDelete(moduleId);
  };

  const executeDelete = async (moduleId: string) => {
    try {
      setIsDeleting(moduleId);
      const result = await deleteModule(course.id, moduleId);
      if (result.success) {
        toast.success(result.statusReverted ? "Kursus ditarik ke Draft & Modul dihapus" : "Modul berhasil dihapus");
        router.refresh();
      } else {
        toast.error("Gagal menghapus modul");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    } finally {
      setIsDeleting(null);
      setShowDraftConfirm(false);
      setModuleToDelete(null);
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-1000">
      
      {/* 1. Module Management Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-emerald-100 rounded-xl text-emerald-700 flex items-center justify-center shadow-inner">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight leading-none">Modul Pembelajaran</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Kurikulum Kursus</p>
            </div>
          </div>
          <ModuleFormModal>
            <Button className="font-bold gap-2 px-6 rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-105">
              <PlusCircle className="h-4 w-4" />
              Tambah Modul
            </Button>
          </ModuleFormModal>
        </div>

        <div className="space-y-4">
          {modules.length > 0 ? (
            modules.map((module: any, index: number) => (
              <Card key={module.id} className="group hover:ring-2 hover:ring-primary/20 transition-all duration-500 border-slate-200 overflow-hidden rounded-2xl bg-white shadow-sm hover:shadow-xl">
                <CardContent className="p-0">
                  <div className="flex items-center p-5 gap-5">
                    <div className="cursor-grab text-slate-300 hover:text-slate-500 transition-colors py-2 shrink-0">
                      <GripVertical className="h-5 w-5" />
                    </div>
                    
                    <div className={cn(
                      "h-12 w-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-500",
                      module.type === "VIDEO" ? "bg-rose-50 text-rose-600" : "bg-sky-50 text-sky-600"
                    )}>
                      {module.type === "VIDEO" ? <FileVideo className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                         <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">Modul {String(index + 1).padStart(2, '0')}</span>
                         {module.isPublished ? (
                           <Badge className="bg-emerald-50 text-emerald-600 border-none text-[8px] h-4 font-black">ACTIVE</Badge>
                         ) : (
                           <Badge className="bg-slate-100 text-slate-400 border-none text-[8px] h-4 font-black">DRAFT</Badge>
                         )}
                      </div>
                      <h3 className="font-black text-slate-800 text-lg truncate group-hover:text-primary transition-colors">{module.title}</h3>
                      <div className="flex items-center gap-3 mt-1 text-slate-400">
                        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
                          <Clock className="h-3 w-3" />
                          {module.duration} Menit
                        </span>
                        <div className="h-1 w-1 rounded-full bg-slate-200" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          {module.type}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 pr-2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 group-hover:transition-all">
                      <ModuleFormModal 
                        initialData={module}
                      >
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </ModuleFormModal>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-slate-800 rounded-xl">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl p-2 border-slate-100 shadow-xl">
                          <DropdownMenuItem 
                            className="text-red-600 font-bold gap-2 cursor-pointer focus:bg-red-50 focus:text-red-700 rounded-lg p-2.5"
                            onClick={() => onDeleteModule(module.id)}
                            disabled={isDeleting === module.id}
                          >
                            <Trash className="h-4 w-4" />
                            Hapus Modul
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) )
          ) : (
            <div className="border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-3xl p-16 text-center group cursor-pointer hover:border-primary/30 transition-colors">
               <div className="h-20 w-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-4 text-slate-300 group-hover:scale-110 group-hover:text-primary/30 transition-all duration-700">
                  <PlusCircle className="h-10 w-10" />
               </div>
               <p className="text-slate-400 font-bold text-lg mb-1">Kurikulum masih kosong</p>
               <p className="text-slate-400/60 font-medium text-sm">Klik tombol "Tambah Modul" untuk memulai menyusun materi.</p>
            </div>
          )}
        </div>
      </section>

      {/* 2. Assessment Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 px-2">
          <div className="h-10 w-10 bg-amber-100 rounded-xl text-amber-700 flex items-center justify-center shadow-inner">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight leading-none">Evaluasi Belajar</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Uji Kompetensi</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Pre-Test Card */}
          <Card className="border-slate-200 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-700 rounded-3xl group bg-white border-b-4 border-b-slate-100 hover:border-b-indigo-500">
            <CardHeader className="p-6 pb-2">
              <div className="flex items-center justify-between mb-2">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
                   <LayoutDashboard className="h-5 w-5" />
                </div>
                <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-indigo-100 text-indigo-600 bg-indigo-50/30 px-2">
                  Required
                </Badge>
              </div>
              <CardTitle className="text-xl font-black text-slate-800">Pre-Test</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-2 space-y-4">
              <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between">
                <div className="text-center">
                  <p className="text-[8px] font-black text-slate-300 uppercase tracking-tighter">Durasi</p>
                  <p className="text-xs font-black text-slate-700">{preTest?.duration || 0}m</p>
                </div>
                <div className="h-6 w-[1px] bg-slate-200" />
                <div className="text-center">
                  <p className="text-[8px] font-black text-slate-300 uppercase tracking-tighter">Min Score</p>
                  <p className="text-xs font-black text-slate-700">{preTest?.passingScore || 0}%</p>
                </div>
                <div className="h-6 w-[1px] bg-slate-200" />
                <div className="text-center">
                  <p className="text-[8px] font-black text-slate-300 uppercase tracking-tighter">Total</p>
                  <p className="text-xs font-black text-slate-700">{preTest?.questions.length || 0} Soal</p>
                </div>
              </div>

              <Button className="w-full h-12 rounded-xl font-black text-sm bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100" asChild>
                  <Link href={`/admin/courses/${course.id}/tests/${preTest?.id || 'new'}?type=PRE`}>
                    {preTest ? 'Edit Pre-Test' : 'Setup Pre-Test'}
                  </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Post-Test Card */}
          <Card className="border-slate-200 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-700 rounded-3xl group bg-white border-b-4 border-b-slate-100 hover:border-b-amber-500">
            <CardHeader className="p-6 pb-2">
              <div className="flex items-center justify-between mb-2">
                <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-sm">
                   <Trophy className="h-5 w-5" />
                </div>
                <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-amber-100 text-amber-600 bg-amber-50/30 px-2">
                  Certification
                </Badge>
              </div>
              <CardTitle className="text-xl font-black text-slate-800">Post-Test</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-2 space-y-4">
              <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between">
                <div className="text-center">
                  <p className="text-[8px] font-black text-slate-300 uppercase tracking-tighter">Durasi</p>
                  <p className="text-xs font-black text-slate-700">{postTest?.duration || 0}m</p>
                </div>
                <div className="h-6 w-[1px] bg-slate-200" />
                <div className="text-center">
                  <p className="text-[8px] font-black text-slate-300 uppercase tracking-tighter">Min Score</p>
                  <p className="text-xs font-black text-slate-700">{postTest?.passingScore || 0}%</p>
                </div>
                <div className="h-6 w-[1px] bg-slate-200" />
                <div className="text-center">
                  <p className="text-[8px] font-black text-slate-300 uppercase tracking-tighter">Total</p>
                  <p className="text-xs font-black text-slate-700">{postTest?.questions.length || 0} Soal</p>
                </div>
              </div>

              <Button className="w-full h-12 rounded-xl font-black text-sm bg-amber-500 hover:bg-amber-600 shadow-xl shadow-amber-100" asChild>
                  <Link href={`/admin/courses/${course.id}/tests/${postTest?.id || 'new'}?type=POST`}>
                    {postTest ? 'Edit Post-Test' : 'Setup Post-Test'}
                  </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
      
      <ConfirmDraftDialog 
        isOpen={showDraftConfirm}
        onClose={() => setShowDraftConfirm(false)}
        onConfirm={() => moduleToDelete && executeDelete(moduleToDelete)}
        warningDetails={[
          "Menghapus modul ini mungkin membuat kurikulum tidak memenuhi syarat publikasi.",
          "Kursus akan ditarik ke Draft untuk menghindari ketidakkonsistenan materi bagi peserta."
        ]}
      />
    </div>
  );
};
