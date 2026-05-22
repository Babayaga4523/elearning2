"use client";

import { useState } from "react";
import {
  Award,
  BookOpen,
  Clock,
  XCircle,
  Lock,
  Eye,
  EyeOff,
  ChevronRight,
  CheckCircle2,
  PlayCircle,
  FileText,
  BookMarked,
  TrendingUp
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { formatDate } from "@/lib/utils/date-formatter";
import { toast } from "sonner";
import { updatePassword } from "@/app/(karyawan)/profile/actions";
import { LearningProgressModal } from "./LearningProgressModal";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface ProfileClientProps {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    department: string | null;
    lokasi: string | null;
    nip: string | null;
    image: string | null;
    roles: string[];
    activeRole: string | null;
    createdAt: Date;
  };
  stats: {
    total: number;
    completed: number;
    inProgress: number;
    failed: number;
  };
  enrolledCourses: {
    id: string;
    courseId: string;
    status: string;
    createdAt: Date;
    course: {
      title: string;
      category: { name: string } | null;
    };
    _count: { testAttempts: number };
  }[];
}

function getStatusConfig(status: string) {
  switch (status) {
    case "COMPLETED":
      return {
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
        icon: CheckCircle2,
        text: "text-emerald-600",
        label: "Selesai"
      };
    case "IN_PROGRESS":
      return {
        bg: "bg-blue-50",
        border: "border-blue-200",
        badge: "bg-blue-100 text-blue-700 border-blue-200",
        icon: Clock,
        text: "text-blue-600",
        label: "Berlangsung"
      };
    case "FAILED":
      return {
        bg: "bg-red-50",
        border: "border-red-200",
        badge: "bg-red-100 text-red-700 border-red-200",
        icon: XCircle,
        text: "text-red-600",
        label: "Gagal"
      };
    default:
      return {
        bg: "bg-slate-50",
        border: "border-slate-200",
        badge: "bg-slate-100 text-slate-700 border-slate-200",
        icon: Clock,
        text: "text-slate-600",
        label: status
      };
  }
}

export function ProfileClient({ user, stats, enrolledCourses }: ProfileClientProps) {
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal state
  const [selectedCourse, setSelectedCourse] = useState<{
    courseId: string;
    courseTitle: string;
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Password baru dan konfirmasi password tidak cocok");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password minimal 8 karakter");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await updatePassword(currentPassword, newPassword);

      if (result.success) {
        toast.success("Password berhasil diubah");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setIsChangingPassword(false);
      } else {
        toast.error(result.error || "Gagal mengubah password");
      }
    } catch {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenProgress = (courseId: string, courseTitle: string) => {
    setSelectedCourse({ courseId, courseTitle });
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Profil Saya</h1>
          <p className="text-slate-600 mt-1">Kelola informasi profil dan aktivitas pembelajaran</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <Card className="overflow-hidden">
              <CardContent className="pt-6 pb-5 px-5">
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-4">
                    <Avatar className="h-24 w-24 ring-4 ring-white shadow-lg">
                      <AvatarImage
                        src={user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || '?')}&background=0f1c3f&color=fff&bold=true&size=256`}
                        alt={user.name || "User avatar"}
                      />
                      <AvatarFallback className="bg-primary text-white text-2xl font-bold">
                        {user.name?.charAt(0)?.toUpperCase() ?? "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">{user.name || "Nama Tidak Tersedia"}</h2>
                  <p className="text-sm text-slate-600 mt-1">{user.email}</p>
                  <div className="mt-3 flex flex-wrap gap-2 justify-center">
                    {user.roles && user.roles.length > 0 ? (
                      user.roles.map((role: string) => (
                        <Badge key={role} variant="secondary" className="text-xs">
                          {role === "ADMIN" ? "Administrator" : role === "SUPER_ADMIN" ? "Super Admin" : "Karyawan"}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="secondary">Karyawan</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  Statistik Pembelajaran
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-slate-600">Total Kursus</span>
                  </div>
                  <span className="text-lg font-bold text-slate-900">{stats.total}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm text-slate-600">Selesai</span>
                  </div>
                  <span className="text-lg font-bold text-emerald-600">{stats.completed}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <span className="text-sm text-slate-600">Berlangsung</span>
                  </div>
                  <span className="text-lg font-bold text-amber-600">{stats.inProgress}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-rose-600" />
                    <span className="text-sm text-slate-600">Gagal</span>
                  </div>
                  <span className="text-lg font-bold text-rose-600">{stats.failed}</span>
                </div>
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">Tingkat Penyelesaian</span>
                    <span className="text-sm font-bold text-primary">{completionRate}%</span>
                  </div>
                  <Progress
                    value={completionRate}
                    className="h-2.5 rounded-full"
                    indicatorClassName={cn(
                      "rounded-full",
                      completionRate === 100 ? "bg-emerald-500" : completionRate >= 50 ? "bg-blue-500" : "bg-primary"
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Details & Courses & Password */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Informasi Personal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-slate-500 uppercase tracking-wider">Nama Lengkap</Label>
                    <p className="text-sm font-medium text-slate-900 mt-1">{user.name || "—"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500 uppercase tracking-wider">Email</Label>
                    <p className="text-sm font-medium text-slate-900 mt-1">{user.email || "—"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500 uppercase tracking-wider">NIP</Label>
                    <p className="text-sm font-medium text-slate-900 mt-1">{user.nip || "—"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500 uppercase tracking-wider">Departemen</Label>
                    <p className="text-sm font-medium text-slate-900 mt-1">{user.department || "—"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500 uppercase tracking-wider">Lokasi Tugas</Label>
                    <p className="text-sm font-medium text-slate-900 mt-1">{user.lokasi || "—"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500 uppercase tracking-wider">Bergabung Sejak</Label>
                    <p className="text-sm font-medium text-slate-900 mt-1">{formatDate(user.createdAt, 'long')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* My Courses */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BookMarked className="h-4 w-4 text-blue-600" />
                    Kursus Saya
                  </CardTitle>
                  <Link href="/courses">
                    <Button variant="ghost" size="sm" className="text-xs h-7">
                      Lihat Semua
                      <ChevronRight className="ml-1 h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {enrolledCourses.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <BookOpen className="h-12 w-12 text-slate-200 mb-3" />
                    <p className="text-sm font-medium text-slate-600">Belum ada kursus</p>
                    <p className="text-xs text-slate-400 mt-1">Enroll kursus untuk mulai belajar</p>
                    <Button asChild className="mt-4 bg-blue-600 hover:bg-blue-700">
                      <Link href="/courses">Jelajahi Kursus</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {enrolledCourses.slice(0, 4).map((enrollment) => {
                      const config = getStatusConfig(enrollment.status);
                      const Icon = config.icon;

                      return (
                        <div
                          key={enrollment.id}
                          className={cn(
                            "flex items-center gap-4 rounded-xl border p-4 transition-all hover:shadow-md hover:border-slate-300",
                            config.bg,
                            config.border
                          )}
                        >
                          {/* Icon */}
                          <div className={cn(
                            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
                            config.text,
                            enrollment.status === "COMPLETED" ? "bg-emerald-500/10" :
                            enrollment.status === "IN_PROGRESS" ? "bg-blue-500/10" : "bg-red-500/10"
                          )}>
                            <Icon className="h-5 w-5" />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate pr-4">
                              {enrollment.course.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {enrollment.course.category && (
                                <Badge variant="secondary" className="text-[10px]">
                                  {enrollment.course.category.name}
                                </Badge>
                              )}
                              <Badge className={cn("text-[10px]", config.badge)}>
                                {config.label}
                              </Badge>
                            </div>
                          </div>

                          {/* Action */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="shrink-0 h-8 w-8 p-0"
                            onClick={() => handleOpenProgress(enrollment.courseId, enrollment.course.title)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}

                    {enrolledCourses.length > 4 && (
                      <Link href="/courses">
                        <Button variant="outline" className="w-full h-10 text-sm">
                          + {enrolledCourses.length - 4} kursus lainnya
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Change Password */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Lock className="h-4 w-4 text-slate-600" />
                    Keamanan Akun
                  </CardTitle>
                  {!isChangingPassword && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsChangingPassword(true)}
                      className="h-8 text-xs"
                    >
                      Ubah Password
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!isChangingPassword ? (
                  <div className="text-sm text-slate-600">
                    <p>Password terakhir diubah: <span className="font-medium">—</span></p>
                    <p className="mt-2 text-xs text-slate-500">
                      Untuk keamanan akun Anda, disarankan untuk mengubah password secara berkala.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                      <Label htmlFor="currentPassword" className="text-sm">Password Saat Ini</Label>
                      <div className="relative mt-1">
                        <Input
                          id="currentPassword"
                          type={showCurrentPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          required
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="newPassword" className="text-sm">Password Baru</Label>
                      <div className="relative mt-1">
                        <Input
                          id="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          minLength={8}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Minimal 8 karakter</p>
                    </div>

                    <div>
                      <Label htmlFor="confirmPassword" className="text-sm">Konfirmasi Password Baru</Label>
                      <div className="relative mt-1">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          minLength={8}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button type="submit" disabled={isSubmitting} size="sm">
                        {isSubmitting ? "Menyimpan..." : "Simpan"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsChangingPassword(false);
                          setCurrentPassword("");
                          setNewPassword("");
                          setConfirmPassword("");
                        }}
                        disabled={isSubmitting}
                      >
                        Batal
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>

            {/* Info Note */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-5 pb-5">
                <p className="text-sm text-blue-800">
                  <strong>Catatan:</strong> Untuk mengubah informasi personal seperti nama, email, atau departemen,
                  silakan hubungi administrator.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Progress Modal */}
      <LearningProgressModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        courseId={selectedCourse?.courseId || ""}
        courseTitle={selectedCourse?.courseTitle || ""}
      />
    </div>
  );
}