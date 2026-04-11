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
  const preAttempts =
    enrollment?.testAttempts?.filter(
      (a: any) =>
        a.type === "PRE_TEST" ||
        a.test?.type === "PRE" ||
        a.type === "PRE"
    ) || [];
  const postAttempts =
    enrollment?.testAttempts?.filter(
      (a: any) =>
        a.type === "POST_TEST" ||
        a.test?.type === "POST" ||
        a.type === "POST"
    ) || [];

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
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl">
        <DialogHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50/90 to-white px-6 py-5 md:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{
                  background: "linear-gradient(135deg, #0F1C3F, #1A3060)",
                  boxShadow: "0 2px 10px rgba(15,28,63,0.25)",
                }}
              >
                <Activity className="h-5 w-5" style={{ color: "#E8A020" }} />
              </div>
              <div className="min-w-0">
                <DialogTitle
                  className="text-left text-lg font-black tracking-tight text-slate-900 md:text-xl"
                  style={{ fontFamily: "'Lexend Deca', sans-serif" }}
                >
                  Progress belajar
                </DialogTitle>
                <p className="mt-1 truncate text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {enrollment.courseTitle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm sm:self-center">
              <Layers className="h-4 w-4 text-[#0F1C3F]" />
              <span className="text-[11px] font-black uppercase text-slate-700">
                {enrollment.status}
              </span>
            </div>
          </div>
        </DialogHeader>

        <div className="px-5 py-5 md:px-8 md:py-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-6 grid h-auto w-full grid-cols-1 gap-1 rounded-xl bg-slate-100 p-1 sm:grid-cols-3 sm:h-12">
              <TabsTrigger
                value="modules"
                className="rounded-lg text-[11px] font-black uppercase tracking-wide data-[state=active]:bg-white data-[state=active]:text-[#0F1C3F] data-[state=active]:shadow-sm"
              >
                <Layers className="mr-1.5 h-4 w-4" />
                Modul
              </TabsTrigger>
              <TabsTrigger
                value="pre-test"
                className="rounded-lg text-[11px] font-black uppercase tracking-wide data-[state=active]:bg-white data-[state=active]:text-[#0F1C3F] data-[state=active]:shadow-sm"
              >
                <FileText className="mr-1.5 h-4 w-4" />
                Pre-test
              </TabsTrigger>
              <TabsTrigger
                value="post-test"
                className="rounded-lg text-[11px] font-black uppercase tracking-wide data-[state=active]:bg-white data-[state=active]:text-[#0F1C3F] data-[state=active]:shadow-sm"
              >
                <CheckCircle2 className="mr-1.5 h-4 w-4" />
                Post-test
              </TabsTrigger>
            </TabsList>

            <div className="max-h-[55vh] overflow-y-auto pr-2 custom-scrollbar pb-10">
              {/* TAB 1: MODUL */}
              <TabsContent value="modules" className="space-y-6 mt-0">
                <div className="ml-2 space-y-4 border-l-2 border-slate-200 pl-4">
                  {enrollment.modules.map((m: any, idx: number) => (
                    <div key={m.id} className="relative flex items-center gap-6 group">
                      {/* Dot */}
                      <div className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center shrink-0 z-10 transition-all",
                        m.isCompleted
                          ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/25"
                          : "bg-slate-200 text-slate-500 group-hover:bg-slate-300"
                      )}>
                        {m.isCompleted ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <Clock className="h-4 w-4" />
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className={cn(
                        "flex-1 rounded-xl border p-4 transition-all md:p-5",
                        m.isCompleted
                          ? "border-slate-200 bg-white shadow-sm"
                          : "border-transparent bg-slate-50/80"
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
