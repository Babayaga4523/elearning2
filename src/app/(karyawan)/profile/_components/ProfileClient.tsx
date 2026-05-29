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
  FileText,
  BookMarked,
  TrendingUp,
  User,
  Shield,
  Sparkles,
  KeyRound,
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

/* ════════════════════════════════════════════════════════════════════════
   DESIGN TOKENS
═══════════════════════════════════════════════════════════════════════ */
const t = {
  navy: "#0F1C3F",
  gold: "#E8A020",
  surface: "#F8F9FB",
  border: "#E4E7EC",
  text: "#101828",
  textSecondary: "#475467",
  textTertiary: "#98A2B3",
  success: { bg: "#ECFDF3", text: "#027A48", border: "#6CE9A6" },
  warning: { bg: "#FFFAEB", text: "#B54708", border: "#FEC84B" },
  danger: { bg: "#FEF3F2", text: "#B42318", border: "#FDA29B" },
  info: { bg: "#EFF8FF", text: "#175CD3", border: "#B2DDFF" },
};

/* ─── Status Config ──────────────────────────────────────────────────── */
const STATUS_CONFIG: Record<string, {
  bg: string; border: string; badge: string; icon: React.ElementType;
  text: string; label: string;
}> = {
  COMPLETED: {
    bg: "bg-[#ECFDF3]",
    border: "border-[#6CE9A6]",
    badge: "bg-[#ECFDF3] text-[#027A48] border-[#6CE9A6]",
    icon: CheckCircle2,
    text: "text-[#027A48]",
    label: "Selesai",
  },
  IN_PROGRESS: {
    bg: "bg-[#EFF8FF]",
    border: "border-[#B2DDFF]",
    badge: "bg-[#EFF8FF] text-[#175CD3] border-[#B2DDFF]",
    icon: Clock,
    text: "text-[#175CD3]",
    label: "Berlangsung",
  },
  FAILED: {
    bg: "bg-[#FEF3F2]",
    border: "border-[#FDA29B]",
    badge: "bg-[#FEF3F2] text-[#B42318] border-[#FDA29B]",
    icon: XCircle,
    text: "text-[#B42318]",
    label: "Gagal",
  },
};

/* ─── Profile Avatar Card ────────────────────────────────────────────── */
function ProfileCard({ user }: { user: any }) {
  const initials = (user.name || "?")
    .split(" ")
    .slice(0, 2)
    .map((n: string) => n[0])
    .join("")
    .toUpperCase();

  const roleLabels: Record<string, string> = {
    ADMIN: "Administrator",
    SUPER_ADMIN: "Super Admin",
    KARYAWAN: "Karyawan",
  };

  return (
    <div
      className="bg-white rounded-2xl border border-[#E4E7EC] overflow-hidden"
    >
      {/* Top accent bar */}
      <div className="h-1.5 bg-gradient-to-r from-[#0F1C3F] via-[#243868] to-[#E8A020]" />

      <CardContent className="pt-8 pb-7 px-6">
        {/* Avatar */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative mb-4">
            <Avatar className="h-22 w-22 ring-4 ring-[#F8F9FB] shadow-lg" style={{ width: 88, height: 88 }}>
              <AvatarImage
                src={user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || "?")}&background=0f1c3f&color=fff&bold=true&size=256`}
                alt={user.name || "User avatar"}
              />
              <AvatarFallback
                className="bg-[#0F1C3F] text-white text-2xl font-bold font-['Lexend_Deca']"
              >
                {initials}
              </AvatarFallback>
            </Avatar>
            {/* Online badge */}
            <div className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#12B76A] text-white shadow-lg ring-2 ring-white">
              <CheckCircle2 size={12} />
            </div>
          </div>

          {/* Name + email */}
          <h2 className="text-lg font-bold text-[#101828] font-['Lexend_Deca'] leading-tight">
            {user.name || "Nama Tidak Tersedia"}
          </h2>
          <p className="text-sm text-[#475467] font-['DM_Sans'] mt-0.5">
            {user.email}
          </p>

          {/* Role badges */}
          <div className="flex flex-wrap gap-2 justify-center mt-3">
            {(user.roles || []).map((role: string) => (
              <Badge
                key={role}
                className="bg-[#EFF8FF] text-[#175CD3] border-[#B2DDFF] text-xs font-semibold font-['DM_Sans']"
              >
                {roleLabels[role] || role}
              </Badge>
            ))}
          </div>
        </div>

        {/* Quick info chips */}
        <div className="grid grid-cols-3 gap-3 p-4 bg-[#F8F9FB] rounded-xl">
          {[
            { label: "NIP", value: user.nip || "—" },
            { label: "Departemen", value: user.department || "—" },
            { label: "Lokasi", value: user.lokasi || "—" },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <p className="text-[10px] text-[#98A2B3] uppercase tracking-wider font-['DM_Sans'] mb-0.5">
                {item.label}
              </p>
              <p className="text-xs font-semibold text-[#101828] font-['DM_Sans'] leading-tight line-clamp-1">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </div>
  );
}

/* ─── Stats Card ────────────────────────────────────────────────────── */
function StatsCard({
  stats,
}: {
  stats: { total: number; completed: number; inProgress: number; failed: number };
}) {
  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  const items = [
    {
      label: "Total Kursus",
      value: stats.total,
      icon: BookOpen,
      color: "text-[#175CD3]",
      bg: "bg-[#EFF8FF]",
    },
    {
      label: "Selesai",
      value: stats.completed,
      icon: CheckCircle2,
      color: "text-[#027A48]",
      bg: "bg-[#ECFDF3]",
    },
    {
      label: "Berlangsung",
      value: stats.inProgress,
      icon: Clock,
      color: "text-[#B54708]",
      bg: "bg-[#FFFAEB]",
    },
    {
      label: "Gagal",
      value: stats.failed,
      icon: XCircle,
      color: "text-[#B42318]",
      bg: "bg-[#FEF3F2]",
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-[#E4E7EC] overflow-hidden">
      <div className="px-5 py-4 border-b border-[#E4E7EC] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#EFF8FF] flex items-center justify-center">
            <TrendingUp size={14} className="text-[#175CD3]" />
          </div>
          <h3 className="text-sm font-semibold text-[#101828] font-['Lexend_Deca']">
            Statistik Pembelajaran
          </h3>
        </div>
      </div>

      <CardContent className="p-5 space-y-4">
        {/* 2x2 grid */}
        <div className="grid grid-cols-2 gap-3">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className={cn(
                  "flex items-center gap-3 rounded-xl border border-[#E4E7EC] p-3.5",
                  "hover:shadow-sm transition-all duration-150"
                )}
              >
                <div
                  className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                    item.bg
                  )}
                >
                  <Icon size={16} className={item.color} />
                </div>
                <div>
                  <p className="text-xl font-bold text-[#101828] font-['Lexend_Deca'] leading-none">
                    {item.value}
                  </p>
                  <p className="text-xs text-[#475467] font-['DM_Sans'] mt-0.5">
                    {item.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Completion rate */}
        <div className="pt-4 border-t border-[#F1F3F7]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[#344054] font-['DM_Sans']">
              Tingkat Penyelesaian
            </span>
            <span className="text-sm font-bold text-[#101828] font-['DM_Sans']">
              {completionRate}%
            </span>
          </div>
          <div className="h-2 bg-[#F1F3F7] rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                completionRate === 100
                  ? "bg-gradient-to-r from-[#12B76A] to-[#027A48]"
                  : "bg-gradient-to-r from-[#E8A020] to-[#F5C05A]"
              )}
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
      </CardContent>
    </div>
  );
}

/* ─── Course List Item ──────────────────────────────────────────────── */
function CourseListItem({
  enrollment,
  onOpenProgress,
}: {
  enrollment: any;
  onOpenProgress: (courseId: string, courseTitle: string) => void;
}) {
  const config =
    STATUS_CONFIG[enrollment.status] || STATUS_CONFIG.IN_PROGRESS;
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-xl border p-4 transition-all duration-150 hover:shadow-sm",
        config.bg,
        config.border
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "w-11 h-11 rounded-xl flex items-center justify-center shrink-0",
          enrollment.status === "COMPLETED"
            ? "bg-[#ECFDF3]"
            : enrollment.status === "IN_PROGRESS"
            ? "bg-[#EFF8FF]"
            : "bg-[#FEF3F2]"
        )}
      >
        <Icon size={18} className={config.text} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#101828] font-['DM_Sans'] truncate pr-3 leading-tight">
          {enrollment.course.title}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {enrollment.course.category && (
            <span className="text-[10px] font-semibold text-[#475467] font-['DM_Sans']">
              {enrollment.course.category.name}
            </span>
          )}
          <Badge className={cn("text-[10px] font-semibold", config.badge)}>
            {config.label}
          </Badge>
        </div>
      </div>

      {/* Action */}
      <button
        onClick={() =>
          onOpenProgress(enrollment.courseId, enrollment.course.title)
        }
        className={cn(
          "shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
          "text-[#475467] hover:bg-[#F1F3F7] transition-colors duration-150"
        )}
        title="Lihat progres"
      >
        <Eye size={15} />
      </button>
    </div>
  );
}

/* ─── Password Form ──────────────────────────────────────────────────── */
function PasswordForm({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [current, setCurrent] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confirm) {
      toast.error("Password baru dan konfirmasi tidak cocok");
      return;
    }
    if (newPw.length < 8) {
      toast.error("Password minimal 8 karakter");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await updatePassword(current, newPw);
      if (result.success) {
        toast.success("Password berhasil diubah");
        setCurrent("");
        setNewPw("");
        setConfirm("");
        onClose();
      } else {
        toast.error(result.error || "Gagal mengubah password");
      }
    } catch {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="bg-white rounded-2xl border border-[#E4E7EC] overflow-hidden">
      <div className="px-5 py-4 border-b border-[#E4E7EC] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#EFF8FF] flex items-center justify-center">
            <KeyRound size={14} className="text-[#175CD3]" />
          </div>
          <h3 className="text-sm font-semibold text-[#101828] font-['Lexend_Deca']">
            Ubah Password
          </h3>
        </div>
        <button
          onClick={onClose}
          className="text-[#98A2B3] hover:text-[#475467] transition-colors"
        >
          <XCircle size={16} />
        </button>
      </div>

      <CardContent className="p-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            {
              id: "current",
              label: "Password Saat Ini",
              value: current,
              onChange: setCurrent,
              show: showCurrent,
              toggle: () => setShowCurrent(!showCurrent),
            },
            {
              id: "new",
              label: "Password Baru",
              value: newPw,
              onChange: setNewPw,
              show: showNew,
              toggle: () => setShowNew(!showNew),
            },
            {
              id: "confirm",
              label: "Konfirmasi Password Baru",
              value: confirm,
              onChange: setConfirm,
              show: showConfirm,
              toggle: () => setShowConfirm(!showConfirm),
            },
          ].map((field) => (
            <div key={field.id}>
              <Label
                htmlFor={field.id}
                className="text-xs font-semibold text-[#344054] font-['DM_Sans'] mb-1.5 block"
              >
                {field.label}
              </Label>
              <div className="relative">
                <Input
                  id={field.id}
                  type={field.show ? "text" : "password"}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  required
                  minLength={8}
                  className="pr-10 font-['DM_Sans'] text-sm"
                />
                <button
                  type="button"
                  onClick={field.toggle}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#98A2B3] hover:text-[#475467] transition-colors"
                >
                  {field.show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          ))}

          <p className="text-[11px] text-[#98A2B3] font-['DM_Sans']">
            Minimal 8 karakter, kombinasi huruf besar, huruf kecil, dan angka
          </p>

          <div className="flex gap-3 pt-1">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-[#E8A020] hover:bg-[#C4861A] active:scale-[0.97] text-white font-semibold rounded-xl font-['DM_Sans'] transition-all shadow-[0_4px_12px_rgba(232,160,32,0.25)]"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-none px-4 rounded-xl font-['DM_Sans']"
            >
              Batal
            </Button>
          </div>
        </form>
      </CardContent>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   PROFILE CLIENT
═══════════════════════════════════════════════════════════════════════ */
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

export function ProfileClient({ user, stats, enrolledCourses }: ProfileClientProps) {
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<{
    courseId: string;
    courseTitle: string;
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenProgress = (courseId: string, courseTitle: string) => {
    setSelectedCourse({ courseId, courseTitle });
    setIsModalOpen(true);
  };

  return (
    <div
      className="min-h-screen bg-[#F8F9FB]"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ═══ Page Header ════════════════════════════════════════════════ */}
        <div className="flex items-start justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#E4E7EC] text-[10px] font-semibold uppercase tracking-widest text-[#98A2B3] mb-3">
              <User size={10} />
              Profil Saya
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#101828] font-['Lexend_Deca'] leading-tight tracking-tight">
              Profil Karyawan
            </h1>
            <p className="text-sm text-[#475467] font-['DM_Sans'] mt-1">
              Kelola informasi akun dan lihat aktivitas pembelajaran Anda
            </p>
          </div>

          {/* Change password trigger */}
          {!isPasswordOpen && (
            <button
              onClick={() => setIsPasswordOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#E4E7EC] rounded-xl text-sm font-semibold text-[#344054] hover:bg-[#F8F9FB] transition-colors font-['DM_Sans'] shrink-0"
            >
              <KeyRound size={14} />
              Ubah Password
            </button>
          )}
        </div>

        {/* ═══ Grid Layout ════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ─── Left Column ────────────────────────────────────────── */}
          <div className="lg:col-span-1 space-y-5">
            <ProfileCard user={user} />
            <StatsCard stats={stats} />
          </div>

          {/* ─── Right Column ───────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">
            {/* Password form (collapsible) */}
            <PasswordForm
              isOpen={isPasswordOpen}
              onClose={() => setIsPasswordOpen(false)}
            />

            {/* My Courses */}
            <div className="bg-white rounded-2xl border border-[#E4E7EC] overflow-hidden">
              <div className="px-5 py-4 border-b border-[#E4E7EC] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#EFF8FF] flex items-center justify-center">
                    <BookMarked size={14} className="text-[#175CD3]" />
                  </div>
                  <h3 className="text-sm font-semibold text-[#101828] font-['Lexend_Deca']">
                    Kursus Saya
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-[#F1F3F7] text-[10px] font-bold text-[#475467]">
                    {enrolledCourses.length}
                  </span>
                </div>
                <Link
                  href="/courses"
                  className="text-xs text-[#C4861A] font-semibold font-['DM_Sans'] hover:text-[#B5751A] flex items-center gap-1 transition-colors"
                >
                  Lihat Semua
                  <ChevronRight size={12} />
                </Link>
              </div>

              <CardContent className="p-5">
                {enrolledCourses.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-[#F8F9FB] flex items-center justify-center mx-auto mb-4">
                      <BookOpen size={26} className="text-[#98A2B3]" />
                    </div>
                    <p className="text-sm font-semibold text-[#101828] font-['DM_Sans'] mb-1">
                      Belum ada kursus
                    </p>
                    <p className="text-xs text-[#475467] font-['DM_Sans'] mb-5">
                      Enroll kursus untuk mulai belajar
                    </p>
                    <Link href="/courses">
                      <Button className="bg-[#E8A020] hover:bg-[#C4861A] text-white text-sm font-semibold rounded-xl font-['DM_Sans'] shadow-[0_4px_12px_rgba(232,160,32,0.25)]">
                        Jelajahi Kursus
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {enrolledCourses.slice(0, 5).map((enrollment) => (
                      <CourseListItem
                        key={enrollment.id}
                        enrollment={enrollment}
                        onOpenProgress={handleOpenProgress}
                      />
                    ))}

                    {enrolledCourses.length > 5 && (
                      <Link
                        href="/courses"
                        className="block w-full py-2.5 border border-[#E4E7EC] rounded-xl text-sm font-semibold text-center text-[#475467] hover:bg-[#F8F9FB] transition-colors font-['DM_Sans']"
                      >
                        + {enrolledCourses.length - 5} kursus lainnya
                      </Link>
                    )}
                  </div>
                )}
              </CardContent>
            </div>

            {/* Info Note */}
            <div className="rounded-xl border border-[#B2DDFF] bg-[#EFF8FF] p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#B2DDFF] flex items-center justify-center shrink-0 mt-0.5">
                <Shield size={14} className="text-[#175CD3]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#175CD3] font-['DM_Sans'] mb-0.5">
                  Catatan Keamanan
                </p>
                <p className="text-xs text-[#175CD3]/70 font-['DM_Sans'] leading-relaxed">
                  Untuk mengubah informasi personal seperti nama, email, atau departemen,
                  silakan hubungi administrator HRD.
                </p>
                <p className="text-xs text-[#98A2B3] font-['DM_Sans'] mt-2">
                  Bergabung sejak: {formatDate(user.createdAt, "long")}
                </p>
              </div>
            </div>
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