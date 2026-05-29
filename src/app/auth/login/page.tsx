"use client";

import * as z from "zod";
import { useForm, useFormContext, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition, Suspense, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
const isRedirectError = (error: unknown) => {
  if (typeof error !== "object" || error === null) return false;
  const digest = (error as Record<string, unknown>).digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
};
import { motion, AnimatePresence } from "framer-motion";

import { login } from "@/actions/login";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { signIn, signOut, useSession } from "next-auth/react";
import { RoleSelectionModal } from "@/components/auth/role-selection-modal";
import {
  Mail, Lock, Eye, EyeOff, Shield, Users, Award,
  ChevronRight, Loader2, AlertTriangle, BookOpen,
  CheckCircle2, XCircle, Zap, ArrowRight, Sparkles,
  Fingerprint, LockKeyhole, LucideIcon
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════
   LOGIN PAGE — World-Class UI/UX Redesign v3.0
   Design Philosophy:
   • Split-screen: Left = immersive brand, Right = premium form
   • Subtle ambient motion, premium micro-interactions
   • WCAG AA compliant, accessible, responsive
══════════════════════════════════════════════════════════════════ */

const LoginSchema = z.object({
  email: z.string().email({ message: "Email wajib diisi dengan format yang benar" }),
  password: z.string().min(1, { message: "Password wajib diisi" }),
});

/* ─── ANIMATION KEYFRAMES (injected via global style) ─── */
// Defined in the <style> tag at bottom of component



/* ─── RIGHT FORM PANEL ─── */

/* Lockout Banner */
function LockoutBanner({ countdown, formatCountdown }: { countdown: number; formatCountdown: (s: number) => string }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0, marginBottom: 0 }}
      animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      className="flex items-start gap-3 rounded-xl border border-[#FDA29B] bg-[#FEF3F2] p-4"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#FDA29B] bg-white">
        <LockKeyhole className="h-5 w-5 text-[#B42318]" />
      </div>
      <div>
        <p className="text-sm font-semibold text-[#B42318]">Akun Dikunci Sementara</p>
        <p className="text-xs text-[#B42318]/70 mt-0.5">Terlalu banyak percobaan masuk. Coba lagi dalam:</p>
        <p className="mt-1.5 text-2xl font-bold font-['Lexend_Deca'] text-[#B42318] tabular-nums tracking-tight">{formatCountdown(countdown)}</p>
      </div>
    </motion.div>
  );
}

/* Attempts Warning Banner */
function AttemptsWarning({ remaining }: { remaining: number }) {
  if (remaining > 3) return null;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-2.5 rounded-xl border border-[#FEC84B] bg-[#FFFAEB] px-4 py-3 mb-5"
    >
      <AlertTriangle className="h-4 w-4 shrink-0 text-[#B54708]" />
      <p className="text-xs text-[#B54708]">
        Sisa <span className="font-semibold">{remaining}</span> percobaan sebelum akun dikunci sementara.
      </p>
    </motion.div>
  );
}

/* Smart Input Field */
function SmartField({
  name,
  label,
  type = "text",
  placeholder,
  icon: Icon,
  autoComplete,
  disabled,
  lockedOut,
  showPassword,
  onTogglePassword,
}: {
  name: "email" | "password";
  label: string;
  type?: string;
  placeholder: string;
  icon: LucideIcon;
  autoComplete?: string;
  disabled?: boolean;
  lockedOut?: boolean;
  showPassword?: boolean;
  onTogglePassword?: () => void;
}) {
  const { register, formState: { errors } } = useFormContext<z.infer<typeof LoginSchema>>();
  const error = errors[name];
  const isPassword = type === "password";

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={name}
        className="block text-sm font-medium text-[#344054] font-['DM_Sans']"
      >
        {label}
      </label>
      <div className="relative group">
        {/* Left icon */}
        <div className={cn(
          "absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 z-10 pointer-events-none",
          error ? "text-[#F04438]" : "text-[#98A2B3]",
          "group-focus-within:text-[#E8A020]"
        )}>
          <Icon className="h-4 w-4" />
        </div>

        {/* Input */}
        <input
          {...register(name)}
          id={name}
          type={isPassword ? (showPassword ? "text" : "password") : type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled || lockedOut}
          className={cn(
            "w-full h-12 pl-10 pr-10 text-sm rounded-xl border font-['DM_Sans']",
            "outline-none transition-all duration-200",
            "text-[#101828] placeholder:text-[#98A2B3]",
            // Normal
            "border-[#E4E7EC] bg-white",
            // Focus — THE KEY INTERACTION
            "focus:ring-[3px] focus:ring-[#E8A020]/[0.12] focus:border-[#E8A020] focus:shadow-[0_0_0_4px_rgba(232,160,32,0.07)]",
            // Error
            error ? "border-[#F04438] bg-[#FEF3F2] focus:ring-[#F04438]/[0.12] focus:border-[#F04438]" : "",
            // Disabled
            (disabled || lockedOut) && "bg-[#F8F9FB] text-[#98A2B3] cursor-not-allowed select-none",
            // Password reveal — extra padding
            !isPassword && "pr-3.5"
          )}
        />

        {/* Right icon — password toggle or validation icon */}
        {isPassword ? (
          <button
            type="button"
            onClick={onTogglePassword}
            disabled={lockedOut || disabled}
            className={cn(
              "absolute right-3.5 top-1/2 -translate-y-1/2 transition-all duration-150 z-10",
              "text-[#98A2B3] hover:text-[#475467] active:scale-90",
              (disabled || lockedOut) && "cursor-not-allowed opacity-50"
            )}
            aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        ) : error ? (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 z-10">
            <XCircle className="h-4 w-4 text-[#F04438]" />
          </div>
        ) : null}
      </div>

      {/* Error message */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            className="text-xs text-[#B42318] font-['DM_Sans'] flex items-center gap-1.5 overflow-hidden"
          >
            <span className="inline-block w-1 h-1 rounded-full bg-[#B42318] shrink-0" />
            {error.message as string}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/* Primary Submit Button */
function PrimaryButton({ isPending, lockedOut, countdown, formatCountdown }: {
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
        "group relative w-full h-12 text-sm font-semibold rounded-xl transition-all duration-200",
        "flex items-center justify-center gap-2.5 font-['DM_Sans']",
        "active:scale-[0.97]",
        lockedOut
          ? "bg-[#E4E7EC] text-[#98A2B3] cursor-not-allowed"
          : isPending
            ? "bg-[#1A2D5A] text-white/70 cursor-wait"
            : "bg-[#0F1C3F] hover:bg-[#1A2D5A] text-white shadow-[0_4px_16px_rgba(15,28,63,0.22)] hover:shadow-[0_6px_22px_rgba(15,28,63,0.28)]"
      )}
    >
      {/* Loading shimmer */}
      {isPending && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.12] to-transparent animate-[shimmer_1.4s_ease-in-out_infinite] bg-[length:200%_100%]" />
      )}

      {isPending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Memproses...</span>
        </>
      ) : lockedOut ? (
        <>
          <LockKeyhole className="h-4 w-4" />
          <span>Dikunci — {formatCountdown(countdown)}</span>
        </>
      ) : (
        <>
          <span>Masuk ke Portal</span>
          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
        </>
      )}
    </button>
  );
}

/* Microsoft SSO Button */
function MicrosoftSSOButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group relative w-full h-10.5 rounded-xl border transition-all duration-200",
        "flex items-center justify-center gap-2.5 font-['DM_Sans'] text-sm font-medium",
        "border-[#E4E7EC] bg-white text-[#344054]",
        "hover:border-[#0078D4] hover:bg-[#EFF8FF] hover:text-[#0078D4]",
        "active:scale-[0.97]",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {/* Subtle shimmer on hover */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 bg-gradient-to-r from-[#0078D4]/[0.04] to-transparent transition-opacity duration-200" />
      <svg viewBox="0 0 23 23" className="w-4 h-4 flex-shrink-0 relative z-10" aria-hidden="true">
        <path fill="#f35325" d="M1 1h10v10H1z" />
        <path fill="#81bc06" d="M12 1h10v10H12z" />
        <path fill="#05a6f0" d="M1 12h10v10H1z" />
        <path fill="#ffba08" d="M12 12h10v10H12z" />
      </svg>
      <span className="relative z-10">Masuk dengan Microsoft</span>
    </button>
  );
}

/* Login Form */
function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [lockedOut, setLockedOut] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "" },
  });

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
        setCountdown(0);
      }
      return;
    }
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          setLockedOut(false);
          localStorage.removeItem("loginLockoutUntil");
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown, lockedOut]);

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
            form.reset({}, { keepValues: false });
            const payload = data as Record<string, unknown>;
            if (payload.lockedOut) {
              const seconds = ((payload.retryAfterMinutes as number) ?? 15) * 60;
              setLockedOut(true);
              setCountdown(seconds);
              setAttemptsRemaining(null);
              localStorage.setItem("loginLockoutUntil", (Date.now() + seconds * 1000).toString());
              toast.error(data.error, { duration: 8000 });
            } else {
              const rem = payload.attemptsRemaining as number | undefined;
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
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <div className="space-y-5">
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

        {/* Email */}
        <SmartField
          name="email"
          label="Email Karyawan"
          type="email"
          icon={Mail}
          placeholder="nama@bnif.co.id"
          autoComplete="email"
          disabled={isPending}
          lockedOut={lockedOut}
        />

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="block text-sm font-medium text-[#344054] font-['DM_Sans']">
              Password
            </label>
            <a
              href="#"
              className="text-xs text-[#C4861A] hover:text-[#B5751A] font-medium font-['DM_Sans'] transition-colors duration-150"
            >
              Lupa password?
            </a>
          </div>
          <div className="relative group">
            <div className={cn(
              "absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200 z-10 pointer-events-none",
              "text-[#98A2B3] group-focus-within:text-[#E8A020]"
            )}>
              <Lock className="h-4 w-4" />
            </div>
            <input
              {...form.register("password")}
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Masukkan password Anda"
              autoComplete="current-password"
              disabled={isPending || lockedOut}
              className={cn(
                "w-full h-12 pl-10 pr-10 text-sm rounded-xl border font-['DM_Sans']",
                "outline-none transition-all duration-200",
                "text-[#101828] placeholder:text-[#98A2B3]",
                "border-[#E4E7EC] bg-white",
                "focus:ring-[3px] focus:ring-[#E8A020]/[0.12] focus:border-[#E8A020] focus:shadow-[0_0_0_4px_rgba(232,160,32,0.07)]",
                form.formState.errors.password
                  ? "border-[#F04438] bg-[#FEF3F2] focus:ring-[#F04438]/[0.12] focus:border-[#F04438]"
                  : "",
                (isPending || lockedOut) && "bg-[#F8F9FB] text-[#98A2B3] cursor-not-allowed select-none"
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={lockedOut || isPending}
              className={cn(
                "absolute right-3.5 top-1/2 -translate-y-1/2 transition-all duration-150 z-10",
                "text-[#98A2B3] hover:text-[#475467] active:scale-90",
                (isPending || lockedOut) && "cursor-not-allowed opacity-50"
              )}
              aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <AnimatePresence mode="wait">
            {form.formState.errors.password && (
              <motion.p
                initial={{ opacity: 0, y: -4, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -4, height: 0 }}
                className="text-xs text-[#B42318] font-['DM_Sans'] flex items-center gap-1.5 overflow-hidden"
              >
                <span className="inline-block w-1 h-1 rounded-full bg-[#B42318] shrink-0" />
                {form.formState.errors.password.message as string}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Submit */}
        <div className="pt-2">
          <PrimaryButton
            isPending={isPending}
            lockedOut={lockedOut}
            countdown={countdown}
            formatCountdown={formatCountdown}
          />
        </div>
      </div>
      </form>
    </FormProvider>
  );
}

/* ─── MAIN LOGIN PAGE CONTENT ─── */
function LoginPageContent() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [showRoleModal, setShowRoleModal] = useState(false);

  const checkRole = searchParams.get("check-role") === "true";

  useEffect(() => {
    if (checkRole && session?.user && session.user.roles) {
      if (session.user.roles.length > 0) {
        setShowRoleModal(true);
      } else {
        const activeRole = (session.user as { activeRole?: string; role?: string }).activeRole
          || (session.user as { activeRole?: string; role?: string }).role
          || "KARYAWAN";
        const redirectPath =
          activeRole === "ADMIN" || activeRole === "SUPER_ADMIN" ? "/admin" : "/dashboard";
        window.location.href = redirectPath;
      }
    }
  }, [checkRole, session]);

  const userForModal = session?.user
    ? {
      name: session.user.name || "User",
      email: session.user.email || "",
      nip: (session.user as { nip?: string | null }).nip || null,
      image: session.user.image || null,
      roles: session.user.roles || [],
    }
    : null;

  const handleMicrosoftSSO = async () => {
    await signIn("microsoft-entra-id", { callbackUrl: "/auth/login?check-role=true" });
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

      {/* Main content layer */}
      <div className="relative z-20 flex min-h-screen bg-[#F8F9FB]">
        {/* Centered Form Panel */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 sm:px-10 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full max-w-[400px]"
          >
            {/* Login Card */}
            <div className="bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.07)] border border-[#E4E7EC]/70 overflow-hidden">
              {/* Top gradient accent bar */}
              <div className="h-1 bg-gradient-to-r from-[#0F1C3F] via-[#243868] to-[#E8A020]" />

              <div className="px-8 py-8 xl:px-10">
                {/* Card header */}
                <div className="mb-7">
                  <div className="flex items-center justify-center mb-6">
                    <Image
                      src="/logo bnifinance.png"
                      alt="BNI Finance"
                      width={160}
                      height={50}
                      className="object-contain"
                    />
                  </div>
                  <h2 className="text-xl font-bold text-[#101828] font-['Lexend_Deca'] leading-tight tracking-tight text-center">
                    Selamat Datang
                  </h2>
                  <p className="text-sm text-[#475467] font-['DM_Sans'] mt-1.5 leading-snug text-center">
                    Masuk ke akun Anda untuk memulai pembelajaran
                  </p>
                </div>

                {/* Form */}
                <LoginForm />

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#F1F3F7]" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-4 text-[#98A2B3] font-semibold font-['DM_Sans'] uppercase tracking-[0.1em]">
                      atau
                    </span>
                  </div>
                </div>

                {/* Microsoft SSO */}
                <MicrosoftSSOButton onClick={handleMicrosoftSSO} />
              </div>
            </div>

            {/* Help link */}
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

            {/* Copyright */}
            <p className="mt-4 text-center text-[10px] text-[#C8D0DC] font-['DM_Sans'] tracking-[0.05em] uppercase">
              © 2026 PT BNI Finance. All rights reserved.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Global CSS for animations */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes orb-float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          40% { transform: translate(25px, -20px) scale(1.05); }
          70% { transform: translate(-15px, 15px) scale(0.97); }
        }
        @keyframes orb-float-2 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-20px, 18px); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </>
  );
}

/* ─── PAGE EXPORT ─── */
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-11 h-11 border-[2.5px] border-[#E4E7EC] border-t-[#0F1C3F] rounded-full animate-spin" />
          <p className="text-xs text-[#98A2B3] font-['DM_Sans'] animate-pulse">Memuat portal...</p>
        </div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
