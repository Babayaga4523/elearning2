"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition, Suspense, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { isRedirectError } from "next/dist/client/components/redirect";
import { motion, AnimatePresence } from "framer-motion";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Lock, Eye, EyeOff, Shield, Users, Award, ChevronRight, Loader2, AlertTriangle, BookOpen } from "lucide-react";
import { login } from "@/actions/login";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { signIn, signOut, useSession } from "next-auth/react";
import { RoleSelectionModal } from "@/components/auth/role-selection-modal";

/* ═══════════════════════════════════════════════════════════════════
   LOGIN PAGE — World-Class UI/UX Redesign
   Design Philosophy:
   • LEFT PANEL: Immersive brand experience with gradient + visual depth
   • RIGHT PANEL: Clean, focused form with premium micro-interactions
   • BOTH: Subtle ambient motion, world-class typography hierarchy
══════════════════════════════════════════════════════════════════ */

const LoginSchema = z.object({
  email: z.string().email({ message: "Email wajib diisi dengan format yang benar" }),
  password: z.string().min(1, { message: "Password wajib diisi" }),
});

/* ─── ANIMATED BACKGROUND PARTICLES ─── */
function GradientOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Primary gold orb */}
      <div className="absolute -top-24 -right-24 w-[420px] h-[420px] rounded-full bg-[#E8A020]/[0.08] blur-[80px] animate-[float-slow_20s_ease-in-out_infinite]" />
      {/* Secondary navy orb */}
      <div className="absolute -bottom-24 -left-24 w-[360px] h-[360px] rounded-full bg-[#0F1C3F]/[0.06] blur-[80px] animate-[float-slow-reverse_25s_ease-in-out_infinite]" />
      {/* Tertiary glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#E8A020]/[0.03] blur-[120px]" />
    </div>
  );
}

/* ─── ANIMATED GRADIENT BAR ─── */
function GradientBar({ className }: { className?: string }) {
  return (
    <div className={cn("h-1 w-full", className)}>
      <div className="h-full w-full bg-gradient-to-r from-[#0F1C3F] via-[#243868] to-[#E8A020] animate-[gradient-shift_4s_ease-in-out_infinite] bg-[length:200%_100%]" />
    </div>
  );
}

/* ─── BRAND FEATURES LIST ─── */
const brandFeatures = [
  { icon: Users, label: "Belajar Sesuai Waktu", desc: "Akses kursus kapan saja, di mana saja" },
  { icon: Award, label: " Sertifikat & Progress", desc: "Lacak pencapaian dan raih sertifikasi" },
  { icon: Shield, label: "Keamanan Data Enterprise", desc: "Dilindungi dengan enkripsi tingkat bank" },
];

/* ─── LOCKOUT BANNER ─── */
function LockoutBanner({ countdown, formatCountdown }: { countdown: number; formatCountdown: (s: number) => string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 rounded-xl border border-[#FDA29B] bg-[#FEF3F2] p-4 mb-6"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#FEF3F2] border border-[#FDA29B]">
        <AlertTriangle className="h-5 w-5 text-[#B42318]" />
      </div>
      <div>
        <p className="text-sm font-semibold text-[#B42318]">Akun Dikunci Sementara</p>
        <p className="text-xs text-[#B42318]/70 mt-0.5">Terlalu banyak percobaan gagal. Coba lagi dalam:</p>
        <p className="mt-2 text-2xl font-bold font-['Lexend_Deca'] text-[#B42318] tabular-nums">{formatCountdown(countdown)}</p>
      </div>
    </motion.div>
  );
}

/* ─── ATTEMPTS WARNING ─── */
function AttemptsWarning({ remaining }: { remaining: number }) {
  if (remaining > 2) return null;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-2 rounded-lg border border-[#FEC84B] bg-[#FFFAEB] px-3 py-2.5 mb-4"
    >
      <AlertTriangle className="h-4 w-4 shrink-0 text-[#B54708]" />
      <p className="text-xs text-[#B54708]">
        Hanya tersisa <span className="font-semibold">{remaining}</span> percobaan sebelum akun dikunci.
      </p>
    </motion.div>
  );
}

/* ─── FLOATING LABEL INPUT ─── */
function FloatingInput({
  field,
  id,
  label,
  icon: Icon,
  type,
  showPassword,
  onTogglePassword,
  disabled,
  lockedOut,
  placeholder,
}: {
  field: any;
  id: string;
  label: string;
  icon: any;
  type: string;
  showPassword?: boolean;
  onTogglePassword?: () => void;
  disabled?: boolean;
  lockedOut?: boolean;
  placeholder: string;
}) {
  const isPassword = type === "password";
  return (
    <div className="relative group">
      {/* Icon */}
      <div className={cn(
        "absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 z-10",
        "text-[#98A2B3] group-focus-within:text-[#E8A020]"
      )}>
        <Icon className="h-4 w-4" />
      </div>

      {/* Input */}
      <input
        {...field}
        id={id}
        disabled={disabled || lockedOut}
        type={isPassword ? (showPassword ? "text" : "password") : type}
        placeholder={placeholder}
        className={cn(
          "w-full pl-10 pr-10 h-12 text-sm rounded-xl border font-['DM_Sans']",
          "outline-none transition-all duration-200",
          "text-[#101828] placeholder:text-[#98A2B3]",
          // Normal
          "border-[#E4E7EC] bg-white",
          // Focus
          "focus:ring-2 focus:ring-[#E8A020]/20 focus:border-[#E8A020] focus:shadow-[0_0_0_4px_rgba(232,160,32,0.08)]",
          // Error (handled by FormMessage)
          field.state?.invalid ? "border-[#F04438] bg-[#FEF3F2] focus:ring-[#F04438]/20" : "",
          // Disabled
          (disabled || lockedOut) && "bg-[#F8F9FB] text-[#98A2B3] cursor-not-allowed",
          // Password reveal button area
          !isPassword && "pr-3.5"
        )}
      />

      {/* Password toggle */}
      {isPassword && onTogglePassword && (
        <button
          type="button"
          onClick={onTogglePassword}
          disabled={lockedOut}
          className={cn(
            "absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors duration-150 z-10",
            "text-[#98A2B3] hover:text-[#475467] active:scale-95",
            (disabled || lockedOut) && "cursor-not-allowed opacity-50"
          )}
          aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      )}
    </div>
  );
}

/* ─── SUBMIT BUTTON ─── */
function SubmitButton({ isPending, lockedOut, countdown, formatCountdown }: {
  isPending: boolean;
  lockedOut: boolean;
  countdown: number;
  formatCountdown: (s: number) => string;
}) {
  return (
    <button
      type="submit"
      disabled={isPending || lockedOut}
      className={cn(
        "w-full h-12 text-sm font-semibold rounded-xl transition-all duration-200",
        "flex items-center justify-center gap-2.5 font-['DM_Sans']",
        "active:scale-[0.97] relative overflow-hidden",
        // State-based styling
        lockedOut
          ? "bg-[#E4E7EC] text-[#98A2B3] cursor-not-allowed"
          : isPending
            ? "bg-[#1A2D5A] text-white/80 cursor-wait"
            : "bg-[#0F1C3F] hover:bg-[#1A2D5A] text-white shadow-[0_4px_14px_rgba(15,28,63,0.25)] hover:shadow-[0_6px_20px_rgba(15,28,63,0.3)]"
      )}
    >
      {/* Loading shimmer overlay */}
      {isPending && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.15] to-transparent animate-[shimmer_1.2s_ease-in-out_infinite] bg-[length:200%_100%]" />
      )}

      {isPending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Memproses...</span>
        </>
      ) : lockedOut ? (
        <>
          <Lock className="h-4 w-4" />
          <span>Dikunci — {formatCountdown(countdown)}</span>
        </>
      ) : (
        <>
          <span>Masuk ke Portal</span>
          <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-150" />
        </>
      )}
    </button>
  );
}

/* ─── SSO BUTTON ─── */
function MicrosoftSSOButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full h-10 rounded-xl border transition-all duration-200",
        "flex items-center justify-center gap-2.5 font-['DM_Sans'] text-sm font-medium",
        "border-[#E4E7EC] bg-white text-[#344054]",
        "hover:border-[#0078D4] hover:bg-[#EFF8FF] hover:text-[#0078D4]",
        "active:scale-[0.97]",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <svg viewBox="0 0 23 23" className="w-4 h-4 flex-shrink-0">
        <path fill="#f35325" d="M1 1h10v10H1z" />
        <path fill="#81bc06" d="M12 1h10v10H12z" />
        <path fill="#05a6f0" d="M1 12h10v10H1z" />
        <path fill="#ffba08" d="M12 12h10v10H12z" />
      glPath>
      <span className="transition-colors duration-150">Masuk dengan Microsoft</span>
    </button>
  );
}

/* ─── LOGIN FORM ─── */
function LoginFormContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [lockedOut, setLockedOut] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);

  // Restore lockout from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("loginLockoutUntil");
    if (saved) {
      const unlockAt = parseInt(saved, 10);
      const remaining = Math.ceil((unlockAt - Date.now()) / 1000);
      if (remaining > 0) {
        setLockedOut(true);
        setCountdown(remaining);
      } else {
        localStorage.removeItem("loginLockoutUntil");
      }
    }
  }, []);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) {
      if (lockedOut) {
        setLockedOut(false);
        localStorage.removeItem("loginLockoutUntil");
      }
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, lockedOut]);

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "" },
  });

  const formatCountdown = useCallback((secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }, []);

  const onSubmit = (values: z.infer<typeof LoginSchema>) => {
    if (lockedOut) return;
    startTransition(() => {
      login(values, callbackUrl)
        .then((data) => {
          if (!data) return;
          if (data.success) {
            toast.success("Login berhasil! Mengalihkan...", { duration: 3000 });
            window.location.assign(data.redirectTo || callbackUrl || "/dashboard");
            return;
          }
          if (data.error) {
            form.reset();
            if ((data as any).lockedOut) {
              const seconds = ((data as any).retryAfterMinutes ?? 15) * 60;
              setLockedOut(true);
              setCountdown(seconds);
              setAttemptsRemaining(null);
              localStorage.setItem("loginLockoutUntil", (Date.now() + seconds * 1000).toString());
              toast.error(data.error, { duration: 8000 });
            } else {
              const rem = (data as any).attemptsRemaining;
              if (rem !== undefined) setAttemptsRemaining(rem);
              toast.error(data.error, { duration: 5000 });
            }
          }
        })
        .catch((error) => {
          if (isRedirectError(error)) {
            toast.success("Login berhasil! Mengalihkan...", { duration: 3000 });
            throw error;
          }
          toast.error("Gagal melakukan login. Silakan coba lagi.", { duration: 5000 });
        });
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {/* Lockout Banner */}
      <AnimatePresence mode="wait">
        {lockedOut && (
          <LockoutBanner countdown={countdown} formatCountdown={formatCountdown} />
        )}
      </AnimatePresence>

      {/* Attempts Warning */}
      {!lockedOut && attemptsRemaining !== null && (
        <AttemptsWarning remaining={attemptsRemaining} />
      )}

      {/* Email Field */}
      <div className="space-y-1.5">
        <label htmlFor="email-input" className="block text-sm font-medium text-[#344054] font-['DM_Sans']">
          Email Karyawan
        </label>
        <FloatingInput
          field={form.register("email")}
          id="email-input"
          label="Email"
          icon={Mail}
          type="email"
          disabled={isPending}
          lockedOut={lockedOut}
          placeholder="nama@bnif.co.id"
        />
        {form.formState.errors.email && (
          <p className="text-xs text-[#B42318] font-['DM_Sans'] flex items-center gap-1 mt-1">
            <span className="inline-block w-1 h-1 rounded-full bg-[#B42318] mr-1" />
            {form.formState.errors.email.message}
          </p>
        )}
      </div>

      {/* Password Field */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="password-input" className="block text-sm font-medium text-[#344054] font-['DM_Sans']">
            Password
          </label>
          <a
            href="#"
            className="text-xs text-[#C4861A] hover:text-[#B5751A] font-medium font-['DM_Sans'] transition-colors duration-150"
          >
            Lupa password?
          </a>
        </div>
        <FloatingInput
          field={form.register("password")}
          id="password-input"
          label="Password"
          icon={Lock}
          type="password"
          showPassword={showPassword}
          onTogglePassword={() => setShowPassword(!showPassword)}
          disabled={isPending}
          lockedOut={lockedOut}
          placeholder="Masukkan password Anda"
        />
        {form.formState.errors.password && (
          <p className="text-xs text-[#B42318] font-['DM_Sans'] flex items-center gap-1 mt-1">
            <span className="inline-block w-1 h-1 rounded-full bg-[#B42312] mr-1" />
            {form.formState.errors.password.message}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <div className="pt-1">
        <SubmitButton
          isPending={isPending}
          lockedOut={lockedOut}
          countdown={countdown}
          formatCountdown={formatCountdown}
        />
      </div>
    </form>
  );
}

/* ─── LOGIN PAGE CONTENT ─── */
function LoginPageContent() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [showRoleModal, setShowRoleModal] = useState(false);

  const checkRole = searchParams.get("check-role") === "true";

  useEffect(() => {
    if (checkRole && session?.user && session.user.roles) {
      if (session.user.roles.length > 1) {
        setShowRoleModal(true);
      } else {
        const activeRole = (session.user as any).activeRole || (session.user as any).role || "KARYAWAN";
        const redirectPath = activeRole === "ADMIN" || activeRole === "SUPER_ADMIN" ? "/admin" : "/dashboard";
        window.location.href = redirectPath;
      }
    }
  }, [checkRole, session]);

  const userForModal = session?.user ? {
    name: session.user.name || "User",
    email: session.user.email || "",
    nip: (session.user as any).nip || null,
    image: session.user.image || null,
    roles: session.user.roles || [],
  } : null;

  const handleMicrosoftSSO = async () => {
    await signIn("microsoft-entra-id", { callbackUrl: "/auth/login?check-role=true" });
  };

  // Animation variants for page sections
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } },
  };

  return (
    <>
      {userForModal && (
        <RoleSelectionModal
          user={userForModal}
          open={showRoleModal}
          onClose={() => {
            setShowRoleModal(false);
            if (checkRole && session?.user) {
              signOut({ callbackUrl: "/auth/login" });
            }
          }}
        />
      )}

      <div className="flex min-h-screen bg-[#F8F9FB]">
        {/* ═══════════════════════════════════════════════════════════
            LEFT PANEL — Immersive Brand Experience
            • Full-height navy gradient background
            • Animated decorative elements
            • Brand messaging + feature highlights
        ═══════════════════════════════════════════════════════════ */}
        <div className="hidden lg:flex lg:w-[46%] bg-[#0F1C3F] relative overflow-hidden flex-shrink-0">
          {/* Layered background depth */}
          <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#0F1C3F] via-[#162444] to-[#0F1C3F]" />

          {/* Subtle grid overlay */}
          <div
            className="absolute inset-0 z-[1] opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
              backgroundSize: "48px 48px",
            }}
          />

          {/* Background image with gradient overlay */}
          <div className="absolute inset-0 z-[2]">
            <Image
              src="/login-bg.png"
              alt="Corporate Learning Environment"
              fill
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-[#0F1C3F]/92 via-[#0F1C3F]/75 to-[#0F1C3F]/60" />
          </div>

          {/* Animated decorative glows */}
          <div className="absolute -top-32 -right-32 w-[420px] h-[420px] rounded-full bg-[#E8A020]/[0.07] blur-[100px] z-[3] animate-[pulse-glow_8s_ease-in-out_infinite]" />
          <div className="absolute -bottom-32 -left-32 w-[360px] h-[360px] rounded-full bg-[#243868]/[0.4] blur-[100px] z-[3]" />
          <div className="absolute top-1/3 -right-16 w-[200px] h-[200px] rounded-full bg-[#E8A020]/[0.04] blur-[60px] z-[3]" />

          {/* Content container */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="relative z-10 flex flex-col justify-between p-10 xl:p-14 w-full"
          >
            {/* ── Top: Logo ── */}
            <motion.div variants={itemVariants} className="flex items-center">
              <Image
                src="/logo bnifinance.png"
                alt="BNI Finance Logo"
                width={145}
                height={46}
                className="object-contain"
              />
            </motion.div>

            {/* ── Center: Hero Message ── */}
            <motion.div variants={itemVariants} className="max-w-sm xl:max-w-md">
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#E8A020]/30 bg-[#E8A020]/[0.08] mb-6">
                <div className="w-1.5 h-1.5 rounded-full bg-[#E8A020] animate-pulse" />
                <span className="text-[10px] font-semibold text-[#E8A020] uppercase tracking-widest font-['DM_Sans']">
                  E-Learning Portal
                </span>
              </div>

              {/* Headline */}
              <h1 className="text-[28px] xl:text-[32px] font-bold text-white leading-[1.2] tracking-tight font-['Lexend_Deca'] mb-4">
                Investasi Terbaik
                <br />
                <span className="text-[#E8A020]">Adalah Pengetahuan.</span>
              </h1>

              {/* Subheadline */}
              <p className="text-sm text-[#94A3B8] leading-relaxed font-['DM_Sans'] mb-8">
                Selamat datang di pusat pembelajaran digital BNI Finance. Tingkatkan kualitas diri dan kembangkan potensi karir Anda melalui kurikulum yang terstruktur dan terkini.
              </p>

              {/* Feature Cards */}
              <div className="space-y-3">
                {brandFeatures.map((feature, i) => (
                  <motion.div
                    key={i}
                    variants={itemVariants}
                    className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.06] transition-colors duration-200"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E8A020]/[0.12] border border-[#E8A020]/[0.15]">
                      <feature.icon className="h-4 w-4 text-[#E8A020]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white font-['DM_Sans'] leading-tight">{feature.label}</p>
                      <p className="text-xs text-[#64748B] font-['DM_Sans'] leading-tight mt-0.5">{feature.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* ── Bottom: Security Badge ── */}
            <motion.div
              variants={itemVariants}
              className="flex items-center gap-2 pt-4 border-t border-white/[0.08]"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#E8A020]/[0.1] border border-[#E8A020]/[0.2]">
                <Shield className="h-4 w-4 text-[#E8A020]" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white font-['DM_Sans']">Keamanan Terenkripsi</p>
                <p className="text-[10px] text-[#64748B] font-['DM_Sans']">Standar keamanan enterprise level bank</p>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            RIGHT PANEL — Clean Form Area
            • Centered card with frosted glass effect
            • Subtle animated background orbs
            • Premium micro-interactions
        ═══════════════════════════════════════════════════════════ */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 sm:px-8 lg:px-12 relative overflow-hidden">
          <GradientOrbs />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="w-full relative z-10"
          >
            {/* Mobile Logo (only visible on mobile/tablet) */}
            <div className="lg:hidden flex flex-col items-center mb-8">
              <Image
                src="/logo bnifinance.png"
                alt="BNI Finance Logo"
                width={140}
                height={44}
                className="object-contain mb-3"
              />
              <div className="h-px w-12 bg-gradient-to-r from-transparent via-[#E4E7EC] to-transparent" />
            </div>

            {/* Login Card */}
            <div className="w-full max-w-[400px] mx-auto">
              {/* Card container with subtle shadow */}
              <div className="bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] border border-[#E4E7EC]/60 overflow-hidden">
                {/* Top gradient accent bar */}
                <GradientBar className="bg-gradient-to-r from-[#E8A020] via-[#F5C05A] to-[#C4861A]" />

                <div className="px-8 py-8 xl:px-10">
                  {/* Card Header */}
                  <div className="mb-7">
                    <h2 className="text-xl font-bold text-[#101828] font-['Lexend_Deca'] leading-tight tracking-tight">
                      Selamat Datang
                    </h2>
                    <p className="text-sm text-[#475467] font-['DM_Sans'] mt-1.5">
                      Masuk ke akun Anda untuk memulai pembelajaran
                    </p>
                  </div>

                  {/* Form */}
                  <Suspense fallback={null}>
                    <LoginFormContent />
                  </Suspense>

                  {/* Divider */}
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-[#F1F3F7]" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-white px-4 text-[11px] font-semibold text-[#98A2B3] uppercase tracking-widest font-['DM_Sans']">
                        atau
                      </span>
                    </div>
                  </div>

                  {/* Microsoft SSO */}
                  <MicrosoftSSOButton onClick={handleMicrosoftSSO} />
                </div>
              </div>

              {/* Help Link */}
              <div className="mt-6 text-center">
                <p className="text-xs text-[#98A2B3] font-['DM_Sans']">
                  Butuh bantuan?&nbsp;
                  <a
                    href="#"
                    className="text-[#C4861A] hover:text-[#B5751A] font-medium transition-colors duration-150 underline underline-offset-2"
                  >
                    Hubungi Admin L&D
                  </a>
                </p>
              </div>

              {/* Footer */}
              <p className="mt-4 text-center text-[10px] text-[#C8D0DC] font-['DM_Sans'] tracking-wide">
                © 2026 PT BNI FINANCE. ALL RIGHTS RESERVED.
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Global CSS injected via inline style for animation keyframes */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.08); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translate(0, 0); }
          33% { transform: translate(20px, -15px); }
          66% { transform: translate(-10px, 10px); }
        }
        @keyframes float-slow-reverse {
          0%, 100% { transform: translate(0, 0); }
          33% { transform: translate(-18px, 12px); }
          66% { transform: translate(12px, -8px); }
        }
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </>
  );
}

/* ─── PAGE EXPORT WITH SUSPENSE WRAPPER ─── */
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
        {/* Loading skeleton */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-[2.5px] border-[#E4E7EC] border-t-[#0F1C3F] rounded-full animate-spin" />
          <p className="text-xs text-[#98A2B3] font-['DM_Sans'] animate-pulse">Memuat...</p>
        </div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
