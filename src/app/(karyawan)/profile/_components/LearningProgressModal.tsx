"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle2,
  Clock,
  XCircle,
  BookOpen,
  Calendar,
  Trophy,
  Target,
  TrendingUp,
  AlertCircle,
  Loader2,
  ChevronRight,
  PlayCircle,
  FileText,
  Star,
  Award,
  Layers
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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Enrollment {
  id: string;
  courseId: string;
  courseTitle: string;
  status: string;
  deadline: string | null;
  completedAt: string | null;
  modules: {
    id: string;
    title: string;
    type: string;
    isCompleted: boolean;
    completedAt: string | null;
    completionRate: number;
  }[];
  preTest: {
    id: string;
    title: string;
    score: number | null;
    passed: boolean | null;
    attemptCount: number;
    maxAttempts: number;
    passedKKM: boolean;
  } | null;
  postTest: {
    id: string;
    title: string;
    score: number | null;
    passed: boolean | null;
    attemptCount: number;
    maxAttempts: number;
    passedKKM: boolean;
  } | null;
  enrolledAt: string;
}

interface CourseProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  courseTitle: string;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "COMPLETED":
      return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 gap-1">
        <CheckCircle2 className="h-3 w-3" /> Selesai
      </Badge>;
    case "IN_PROGRESS":
      return <Badge className="bg-blue-100 text-blue-700 border-blue-200 gap-1">
        <Clock className="h-3 w-3" /> Berlangsung
      </Badge>;
    case "FAILED":
      return <Badge className="bg-red-100 text-red-700 border-red-200 gap-1">
        <XCircle className="h-3 w-3" /> Gagal
      </Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function formatDate(date: string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function formatDeadline(date: string | null): { text: string; isPast: boolean; isNear: boolean } {
  if (!date) return { text: "Tanpa batas", isPast: false, isNear: false };

  const deadline = new Date(date);
  const now = new Date();
  const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { text: "Berakhir", isPast: true, isNear: false };
  if (diffDays === 0) return { text: "Hari ini", isPast: false, isNear: true };
  if (diffDays <= 3) return { text: `${diffDays} hari lagi`, isPast: false, isNear: true };
  return { text: `${diffDays} hari lagi`, isPast: false, isNear: false };
}

export function LearningProgressModal({ isOpen, onClose, courseId, courseTitle }: CourseProgressModalProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEnrollment() {
      if (!courseId) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/profile/enrollment/${courseId}`);
        if (res.ok) {
          const data = await res.json();
          setEnrollment(data);
        }
      } catch (error) {
        console.error("Failed to fetch enrollment", error);
      } finally {
        setLoading(false);
      }
    }

    if (isOpen) {
      fetchEnrollment();
    }
  }, [isOpen, courseId]);

  // Calculate progress
  const totalModules = enrollment?.modules?.length || 0;
  const completedModules = enrollment?.modules?.filter(m => m.isCompleted).length || 0;
  const progressPercent = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-hidden rounded-2xl border-slate-200 bg-white p-0 shadow-2xl">
        {/* Header */}
        <DialogHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0F1C3F] to-[#1A3060] shadow-lg shadow-[#0F1C3F]/20">
                <BookOpen className="h-5 w-5 text-[#E8A020]" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-lg font-bold text-slate-900 sm:text-xl">
                  Progress Belajar
                </DialogTitle>
                <p className="mt-0.5 truncate text-sm font-medium text-slate-500">
                  {courseTitle}
                </p>
              </div>
            </div>

            {enrollment && (
              <div className="flex items-center gap-2">
                {getStatusBadge(enrollment.status)}
              </div>
            )}
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-[#0F1C3F]" />
          </div>
        ) : enrollment ? (
          <div className="overflow-y-auto custom-scrollbar" style={{ maxHeight: "calc(90vh - 100px)" }}>
            <div className="p-5 sm:p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-6 grid h-12 w-full grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
                  <TabsTrigger
                    value="overview"
                    className="rounded-lg text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-[#0F1C3F] data-[state=active]:shadow-sm"
                  >
                    <Layers className="mr-2 h-4 w-4" />
                    Ringkasan
                  </TabsTrigger>
                  <TabsTrigger
                    value="modules"
                    className="rounded-lg text-sm font-semibold data-[state=active]:bg-white data-[state=active]:text-[#0F1C3F] data-[state=active]:shadow-sm"
                  >
                    <BookOpen className="mr-2 h-4 w-4" />
                    Modul ({completedModules}/{totalModules})
                  </TabsTrigger>
                </TabsList>

                {/* TAB: Overview */}
                <TabsContent value="overview" className="mt-0 space-y-5">
                  {/* Progress Card */}
                  <Card className="border-slate-100 shadow-sm">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-slate-700">Progress Keseluruhan</h3>
                        <span className="text-lg font-bold text-[#0F1C3F]">{progressPercent}%</span>
                      </div>
                      <Progress
                        value={progressPercent}
                        className="h-3 rounded-full"
                        indicatorClassName={cn(
                          "rounded-full",
                          progressPercent === 100 ? "bg-emerald-500" : progressPercent >= 50 ? "bg-blue-500" : "bg-[#0F1C3F]"
                        )}
                      />
                      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                        <span>{completedModules} dari {totalModules} modul selesai</span>
                        {enrollment.status === "COMPLETED" && (
                          <span className="flex items-center gap-1 text-emerald-600">
                            <CheckCircle2 className="h-3 w-3" /> Kursus selesai
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {/* Pre-Test Score */}
                    <Card className={cn(
                      "border-slate-100 shadow-sm transition-all hover:shadow-md",
                      enrollment.preTest?.passedKKM && "ring-2 ring-emerald-200 bg-emerald-50/50",
                      enrollment.preTest && !enrollment.preTest.passedKKM && "ring-2 ring-amber-200 bg-amber-50/50"
                    )}>
                      <CardContent className="p-4 text-center">
                        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#0F1C3F]/10">
                          <Target className="h-5 w-5 text-[#0F1C3F]" />
                        </div>
                        <p className="text-xs font-medium text-slate-500 mb-1">Nilai Pre-Test</p>
                        <p className={cn(
                          "text-xl font-bold",
                          enrollment.preTest?.passedKKM ? "text-emerald-600" : "text-slate-700"
                        )}>
                          {enrollment.preTest?.score ?? "—"}
                        </p>
                        {enrollment.preTest && (
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {enrollment.preTest.passedKKM ? "Lulus KKM" : `${enrollment.preTest.attemptCount}/${enrollment.preTest.maxAttempts === 0 ? "∞" : enrollment.preTest.maxAttempts} percobaan`}
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Post-Test Score */}
                    <Card className={cn(
                      "border-slate-100 shadow-sm transition-all hover:shadow-md",
                      enrollment.postTest?.passedKKM && "ring-2 ring-emerald-200 bg-emerald-50/50",
                      enrollment.postTest && !enrollment.postTest.passedKKM && "ring-2 ring-amber-200 bg-amber-50/50"
                    )}>
                      <CardContent className="p-4 text-center">
                        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
                          <Award className="h-5 w-5 text-emerald-600" />
                        </div>
                        <p className="text-xs font-medium text-slate-500 mb-1">Nilai Post-Test</p>
                        <p className={cn(
                          "text-xl font-bold",
                          enrollment.postTest?.passedKKM ? "text-emerald-600" : "text-slate-700"
                        )}>
                          {enrollment.postTest?.score ?? "—"}
                        </p>
                        {enrollment.postTest && (
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {enrollment.postTest.passedKKM ? "Lulus KKM" : `${enrollment.postTest.attemptCount}/${enrollment.postTest.maxAttempts === 0 ? "∞" : enrollment.postTest.maxAttempts} percobaan`}
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Modules Done */}
                    <Card className="border-slate-100 shadow-sm transition-all hover:shadow-md">
                      <CardContent className="p-4 text-center">
                        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
                          <Layers className="h-5 w-5 text-blue-600" />
                        </div>
                        <p className="text-xs font-medium text-slate-500 mb-1">Modul Selesai</p>
                        <p className="text-xl font-bold text-blue-600">
                          {completedModules}/{totalModules}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          dari {totalModules} total
                        </p>
                      </CardContent>
                    </Card>

                    {/* Deadline */}
                    <Card className={cn(
                      "border-slate-100 shadow-sm transition-all hover:shadow-md",
                      formatDeadline(enrollment.deadline).isPast && "ring-2 ring-red-200 bg-red-50/50",
                      formatDeadline(enrollment.deadline).isNear && "ring-2 ring-amber-200 bg-amber-50/50"
                    )}>
                      <CardContent className="p-4 text-center">
                        <div className={cn(
                          "mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full",
                          formatDeadline(enrollment.deadline).isPast ? "bg-red-500/10" : "bg-amber-500/10"
                        )}>
                          <Calendar className={cn(
                            "h-5 w-5",
                            formatDeadline(enrollment.deadline).isPast ? "text-red-600" : "text-amber-600"
                          )} />
                        </div>
                        <p className="text-xs font-medium text-slate-500 mb-1">Deadline</p>
                        <p className={cn(
                          "text-xl font-bold",
                          formatDeadline(enrollment.deadline).isPast ? "text-red-600" : "text-slate-700"
                        )}>
                          {formatDeadline(enrollment.deadline).text}
                        </p>
                        {enrollment.deadline && (
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {formatDate(enrollment.deadline)}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Action Card */}
                  {enrollment.status !== "COMPLETED" && (
                    <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-white shadow-sm">
                      <CardContent className="p-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                              <TrendingUp className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">Lanjutkan Pembelajaran</p>
                              <p className="text-xs text-slate-500">
                                {completedModules < totalModules
                                  ? `Selesaikan ${totalModules - completedModules} modul剩下 untuk menyelesaikan kursus`
                                  : "Ambil Post-Test untuk menyelesaikan kursus"}
                              </p>
                            </div>
                          </div>
                          <Button asChild className="bg-blue-600 hover:bg-blue-700">
                            <Link href={`/courses/${courseId}`}>
                              Buka Kursus
                              <ChevronRight className="ml-1 h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Completion Celebration */}
                  {enrollment.status === "COMPLETED" && enrollment.completedAt && (
                    <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50 to-white shadow-sm">
                      <CardContent className="p-5">
                        <div className="flex flex-col items-center text-center">
                          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 shadow-lg shadow-emerald-500/20">
                            <Trophy className="h-8 w-8 text-emerald-600" />
                          </div>
                          <h3 className="text-lg font-bold text-emerald-700">Selamat!</h3>
                          <p className="mt-1 text-sm text-slate-600">
                            Anda telah menyelesaikan kursus ini pada<br />
                            <span className="font-semibold text-slate-900">{formatDate(enrollment.completedAt)}</span>
                          </p>
                          <Button asChild variant="outline" className="mt-4 border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                            <Link href={`/courses/${courseId}`}>
                              <Star className="mr-2 h-4 w-4" />
                              Lihat Sertifikat
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* TAB: Modules */}
                <TabsContent value="modules" className="mt-0">
                  <div className="space-y-3">
                    {enrollment.modules.map((module, idx) => (
                      <Card
                        key={module.id}
                        className={cn(
                          "border-slate-100 shadow-sm transition-all hover:shadow-md",
                          module.isCompleted && "border-l-4 border-l-emerald-400"
                        )}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            {/* Module Number */}
                            <div className={cn(
                              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold transition-all",
                              module.isCompleted
                                ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/25"
                                : "bg-slate-100 text-slate-500"
                            )}>
                              {module.isCompleted ? (
                                <CheckCircle2 className="h-5 w-5" />
                              ) : (
                                idx + 1
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className={cn(
                                    "text-sm font-semibold",
                                    module.isCompleted ? "text-slate-900" : "text-slate-700"
                                  )}>
                                    {module.title}
                                  </p>

                                  {/* Type Badge & Progress */}
                                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                                    <Badge
                                      variant="secondary"
                                      className={cn(
                                        "text-[10px] gap-1",
                                        module.type === "VIDEO" ? "bg-blue-50 text-blue-600" : "bg-rose-50 text-rose-600"
                                      )}
                                    >
                                      {module.type === "VIDEO" ? (
                                        <PlayCircle className="h-3 w-3" />
                                      ) : (
                                        <FileText className="h-3 w-3" />
                                      )}
                                      {module.type === "VIDEO" ? "Video" : "Dokumen"}
                                    </Badge>

                                    {!module.isCompleted && module.completionRate > 0 && (
                                      <span className="text-[10px] text-slate-500">
                                        {module.completionRate}% selesai
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Status Badge */}
                                <div className="shrink-0">
                                  {module.isCompleted ? (
                                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 gap-1 text-xs">
                                      <CheckCircle2 className="h-3 w-3" />
                                      Selesai
                                    </Badge>
                                  ) : (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      asChild
                                      className="h-7 text-[10px]"
                                    >
                                      <Link href={`/courses/${courseId}/modules/${module.id}`}>
                                        Mulai
                                        <ChevronRight className="ml-1 h-3 w-3" />
                                      </Link>
                                    </Button>
                                  )}
                                </div>
                              </div>

                              {/* Progress Bar (if not completed) */}
                              {!module.isCompleted && module.completionRate > 0 && (
                                <div className="mt-3">
                                  <Progress
                                    value={module.completionRate}
                                    className="h-1.5 rounded-full"
                                  />
                                </div>
                              )}

                              {/* Completed Date */}
                              {module.isCompleted && module.completedAt && (
                                <div className="mt-2 flex items-center gap-1.5">
                                  <Calendar className="h-3 w-3 text-emerald-500" />
                                  <p className="text-[10px] text-slate-400">
                                    Selesai pada {formatDate(module.completedAt)}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <AlertCircle className="mb-2 h-10 w-10 opacity-30" />
            <p className="text-sm font-medium">Data enrollment tidak ditemukan</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}