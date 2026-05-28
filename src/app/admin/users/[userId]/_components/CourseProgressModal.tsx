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
  DialogDescription,
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
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-hidden rounded-xl border border-[#E4E7EC] bg-white p-0 shadow-xl font-sans">
        <DialogHeader className="border-b border-[#E4E7EC] bg-[#F8F9FB] px-6 py-5 md:px-8">
          <DialogDescription className="sr-only">
            Detail progress kursus dan aktivitas pembelajaran karyawan
          </DialogDescription>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#0F1C3F] shadow-sm">
                <Activity className="h-6 w-6 text-[#E8A020]" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-left text-xl font-bold tracking-tight text-[#101828] md:text-2xl font-lexend">
                  Progress Belajar
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Detail progress belajar karyawan pada kursus {enrollment.courseTitle}
                </DialogDescription>
                <p className="mt-1 truncate text-[13px] font-medium text-[#475467]">
                  {enrollment.courseTitle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start rounded-lg border border-[#E4E7EC] bg-white px-3 py-1.5 shadow-sm sm:self-center">
              <Layers className="h-3.5 w-3.5 text-[#0F1C3F]" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#475467]">
                {enrollment.status}
              </span>
            </div>
          </div>
        </DialogHeader>

        <div className="px-5 py-5 md:px-8 md:py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-6 grid h-auto w-full grid-cols-1 gap-1 rounded-xl bg-[#F8F9FB] border border-[#E4E7EC] p-1 sm:grid-cols-3 sm:h-12">
              <TabsTrigger
                value="modules"
                className="rounded-lg text-[11px] font-bold uppercase tracking-wider text-[#475467] data-[state=active]:bg-white data-[state=active]:text-[#0F1C3F] data-[state=active]:shadow-sm transition-all"
              >
                <Layers className="mr-2 h-4 w-4" />
                Modul
              </TabsTrigger>
              <TabsTrigger
                value="pre-test"
                className="rounded-lg text-[11px] font-bold uppercase tracking-wider text-[#475467] data-[state=active]:bg-white data-[state=active]:text-[#0F1C3F] data-[state=active]:shadow-sm transition-all"
              >
                <FileText className="mr-2 h-4 w-4" />
                Pre-test
              </TabsTrigger>
              <TabsTrigger
                value="post-test"
                className="rounded-lg text-[11px] font-bold uppercase tracking-wider text-[#475467] data-[state=active]:bg-white data-[state=active]:text-[#0F1C3F] data-[state=active]:shadow-sm transition-all"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Post-test
              </TabsTrigger>
            </TabsList>

            <div className="max-h-[55vh] overflow-y-auto pr-2 custom-scrollbar pb-10">
              {/* TAB 1: MODUL */}
              <TabsContent value="modules" className="space-y-6 mt-0">
                <div className="relative ml-2 space-y-4">
                  <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-[#E4E7EC] z-0" />
                  {enrollment.modules.map((m: any, idx: number) => (
                    <div key={m.id} className="relative flex items-center gap-4 group z-10">
                      {/* Dot */}
                      <div className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center shrink-0 z-10 transition-all",
                        m.isCompleted
                          ? "bg-[#12B76A] text-white shadow-sm"
                          : "bg-[#F8F9FB] border border-[#E4E7EC] text-[#98A2B3] group-hover:bg-[#F0F2F7]"
                      )}>
                        {m.isCompleted ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <Clock className="h-4 w-4" />
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className={cn(
                        "flex-1 rounded-xl border p-4 transition-all md:p-5 w-full",
                        m.isCompleted
                          ? "border-[#E4E7EC] bg-white shadow-sm"
                          : "border-transparent bg-[#F8F9FB]"
                      )}>
                        <div className="flex items-center justify-between">
                          <p className={cn(
                            "text-sm font-bold font-lexend transition-colors",
                            m.isCompleted ? "text-[#101828]" : "text-[#475467]"
                          )}>
                            {m.title}
                          </p>
                          {m.isCompleted && m.completedAt && (
                            <span className="text-[10px] font-bold text-[#027A48] uppercase bg-[#ECFDF3] px-3 py-1 rounded-full">
                              Selesai
                            </span>
                          )}
                        </div>
                        {m.isCompleted && m.completedAt && (
                          <div className="flex items-center gap-1.5 mt-2">
                             <Calendar className="h-3.5 w-3.5 text-[#98A2B3]" />
                             <p className="text-[11px] font-bold text-[#475467] uppercase tracking-wider">
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
                  <h3 className="text-[11px] font-bold uppercase text-[#475467] tracking-wider flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Riwayat Percobaan Pre-Test
                  </h3>
                  
                  {preAttempts.length > 0 && (
                    <Select value={selectedPreId || ""} onValueChange={setSelectedPreId}>
                      <SelectTrigger className="w-[200px] h-10 bg-white border border-[#E4E7EC] rounded-lg text-sm font-bold text-[#101828] shadow-sm focus:ring-[#0F1C3F] focus:border-[#0F1C3F]">
                        <SelectValue placeholder="Pilih Percobaan" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-[#E4E7EC] shadow-md rounded-lg">
                        {preAttempts.map((a: any, i: number) => (
                          <SelectItem key={a.id} value={a.id} className="text-sm font-bold text-[#101828] focus:bg-[#F8F9FB] focus:text-[#0F1C3F]">
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
                  <h3 className="text-[11px] font-bold uppercase text-[#475467] tracking-wider flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Riwayat Percobaan Post-Test
                  </h3>
                  
                  {postAttempts.length > 0 && (
                    <Select value={selectedPostId || ""} onValueChange={setSelectedPostId}>
                      <SelectTrigger className="w-[200px] h-10 bg-white border border-[#E4E7EC] rounded-lg text-sm font-bold text-[#101828] shadow-sm focus:ring-[#0F1C3F] focus:border-[#0F1C3F]">
                        <SelectValue placeholder="Pilih Percobaan" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-[#E4E7EC] shadow-md rounded-lg">
                        {postAttempts.map((a: any, i: number) => (
                          <SelectItem key={a.id} value={a.id} className="text-sm font-bold text-[#101828] focus:bg-[#F8F9FB] focus:text-[#0F1C3F]">
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
