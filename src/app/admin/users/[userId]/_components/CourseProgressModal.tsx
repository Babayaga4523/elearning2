"use client";

import { useState } from "react";
import { 
  CheckCircle2, 
  Clock, 
  History,
  Activity,
  Layers,
  FileText,
  Calendar
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { TestAttemptReview } from "./TestAttemptReview";

interface CourseProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  enrollment: any | null;
}

export function CourseProgressModal({ isOpen, onClose, enrollment }: CourseProgressModalProps) {
  const [activeTab, setActiveTab] = useState("modules");
  
  // Separation by test type
  const preAttempts = enrollment?.testAttempts?.filter((a: any) => a.test?.type === "PRE" || a.type === "PRE") || [];
  const postAttempts = enrollment?.testAttempts?.filter((a: any) => a.test?.type === "POST" || a.type === "POST") || [];

  const [selectedPreId, setSelectedPreId] = useState<string | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  // Auto-select latest attempt if not selected
  if (preAttempts.length > 0 && !selectedPreId) {
    setSelectedPreId(preAttempts[preAttempts.length - 1].id);
  }
  if (postAttempts.length > 0 && !selectedPostId) {
    setSelectedPostId(postAttempts[postAttempts.length - 1].id);
  }

  if (!enrollment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl bg-white">
        <DialogHeader className="px-10 py-8 border-b border-slate-50 bg-slate-50/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
                  Progress Belajar
                </DialogTitle>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                  {enrollment.courseTitle}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
               <Layers className="h-4 w-4 text-primary" />
               <span className="text-xs font-black text-slate-700 uppercase">{enrollment.status}</span>
            </div>
          </div>
        </DialogHeader>

        <div className="px-10 py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-14 bg-slate-100/50 p-1.5 rounded-2xl mb-8">
              <TabsTrigger value="modules" className="rounded-xl font-black text-[11px] uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Layers className="h-4 w-4 mr-2" />
                Daftar Modul
              </TabsTrigger>
              <TabsTrigger value="pre-test" className="rounded-xl font-black text-[11px] uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <FileText className="h-4 w-4 mr-2" />
                Pre-Test Results
              </TabsTrigger>
              <TabsTrigger value="post-test" className="rounded-xl font-black text-[11px] uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Post-Test Results
              </TabsTrigger>
            </TabsList>

            <div className="max-h-[55vh] overflow-y-auto pr-2 custom-scrollbar pb-10">
              {/* TAB 1: MODUL */}
              <TabsContent value="modules" className="space-y-6 mt-0">
                <div className="space-y-4 pl-4 border-l-2 border-slate-100 ml-3">
                  {enrollment.modules.map((m: any, idx: number) => (
                    <div key={m.id} className="relative flex items-center gap-6 group">
                      {/* Dot */}
                      <div className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center shrink-0 z-10 transition-all",
                        m.isCompleted ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-slate-200 text-slate-400 group-hover:bg-slate-300"
                      )}>
                        {m.isCompleted ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <Clock className="h-4 w-4" />
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className={cn(
                        "flex-1 p-5 rounded-[1.5rem] border transition-all",
                        m.isCompleted ? "bg-white border-slate-100 shadow-sm" : "bg-slate-50/50 border-transparent"
                      )}>
                        <div className="flex items-center justify-between">
                          <p className={cn(
                            "text-sm font-black transition-colors",
                            m.isCompleted ? "text-slate-800" : "text-slate-400"
                          )}>
                            {m.title}
                          </p>
                          {m.isCompleted && m.completedAt && (
                            <span className="text-[10px] font-black text-emerald-600 uppercase bg-emerald-50 px-3 py-1 rounded-full">
                              Selesai
                            </span>
                          )}
                        </div>
                        {m.isCompleted && m.completedAt && (
                          <div className="flex items-center gap-1.5 mt-1.5 opacity-60">
                             <Calendar className="h-3 w-3 text-slate-400" />
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                {new Date(m.completedAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                             </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* TAB 2: PRE-TEST */}
              <TabsContent value="pre-test" className="space-y-6 mt-0">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Riwayat Percobaan Pre-Test
                  </h3>
                  
                  {preAttempts.length > 0 && (
                    <Select value={selectedPreId || ""} onValueChange={setSelectedPreId}>
                      <SelectTrigger className="w-[200px] h-10 bg-slate-50 border-none rounded-xl text-xs font-black shadow-sm">
                        <SelectValue placeholder="Pilih Percobaan" />
                      </SelectTrigger>
                      <SelectContent>
                        {preAttempts.map((a: any, i: number) => (
                          <SelectItem key={a.id} value={a.id} className="text-xs font-bold">
                            Percobaan {i + 1} ({a.score})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <TestAttemptReview attemptId={selectedPreId} />
              </TabsContent>

              {/* TAB 3: POST-TEST */}
              <TabsContent value="post-test" className="space-y-6 mt-0">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Riwayat Percobaan Post-Test
                  </h3>
                  
                  {postAttempts.length > 0 && (
                    <Select value={selectedPostId || ""} onValueChange={setSelectedPostId}>
                      <SelectTrigger className="w-[200px] h-10 bg-slate-50 border-none rounded-xl text-xs font-black shadow-sm">
                        <SelectValue placeholder="Pilih Percobaan" />
                      </SelectTrigger>
                      <SelectContent>
                        {postAttempts.map((a: any, i: number) => (
                          <SelectItem key={a.id} value={a.id} className="text-xs font-bold">
                            Percobaan {i + 1} ({a.score})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <TestAttemptReview attemptId={selectedPostId} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
