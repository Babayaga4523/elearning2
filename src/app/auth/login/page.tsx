"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition, Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { isRedirectError } from "next/dist/client/components/redirect";

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
import { Building2, Lock, Mail, ArrowRight, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { login } from "@/actions/login";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { signIn, signOut, useSession } from "next-auth/react";
import { RoleSelectionModal } from "@/components/auth/role-selection-modal";

const LoginSchema = z.object({
  email: z.string().email({
    message: "Email wajib diisi",
  }),
  password: z.string().min(1, {
    message: "Password wajib diisi",
  }),
});

function LoginFormContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [lockedOut, setLockedOut] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);

  // Restore lockout state from localStorage on mount
  useEffect(() => {
    const savedLockout = localStorage.getItem("loginLockoutUntil");
    if (savedLockout) {
      const unlockTime = parseInt(savedLockout, 10);
      const remainingSeconds = Math.ceil((unlockTime - Date.now()) / 1000);
      if (remainingSeconds > 0) {
        setLockedOut(true);
        setCountdown(remainingSeconds);
      } else {
        localStorage.removeItem("loginLockoutUntil");
      }
    }
  }, []);

  // Live countdown ticker
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

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const onSubmit = (values: z.infer<typeof LoginSchema>) => {
    if (lockedOut) return;
    startTransition(() => {
      login(values, callbackUrl)
        .then((data) => {
          if (!data) return;
          if (data.success) {
            toast.success("Login berhasil! Mengalihkan...");
            window.location.assign(data.redirectTo || callbackUrl || "/dashboard");
            return;
          }
          if (data.error) {
            form.reset();
            if ((data as any).lockedOut) {
              const minutes = (data as any).retryAfterMinutes ?? 15;
              const seconds = minutes * 60;
              setLockedOut(true);
              setCountdown(seconds);
              setAttemptsRemaining(null);
              localStorage.setItem("loginLockoutUntil", (Date.now() + seconds * 1000).toString());
              toast.error(data.error, { duration: 8000 });
            } else {
              const rem = (data as any).attemptsRemaining;
              if (rem !== undefined) setAttemptsRemaining(rem);
              toast.error(data.error);
            }
          }
        })
        .catch((error) => {
          if (isRedirectError(error)) {
            toast.success("Login berhasil! Mengalihkan...");
            throw error;
          }
          toast.error("Gagal melakukan login. Silakan coba lagi.");
        });
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

        {/* Lockout Banner */}
        {lockedOut && (
          <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 animate-in slide-in-from-top-2 duration-300">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100">
              <svg className="h-4 w-4 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-rose-700">Akun Dikunci Sementara</p>
              <p className="mt-0.5 text-xs font-medium text-rose-600">Terlalu banyak percobaan gagal. Coba lagi dalam</p>
              <p className="mt-1.5 text-2xl font-black tabular-nums tracking-tight text-rose-700">{formatCountdown(countdown)}</p>
            </div>
          </div>
        )}

        {/* Attempts Warning */}
        {!lockedOut && attemptsRemaining !== null && attemptsRemaining <= 2 && (
          <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 animate-in slide-in-from-top-2 duration-300">
            <svg className="h-4 w-4 shrink-0 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 3h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <p className="text-[11px] font-bold text-amber-700">
              Peringatan: hanya tersisa <span className="font-black">{attemptsRemaining}</span> percobaan sebelum akun dikunci.
            </p>
          </div>
        )}

        <div className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="email-input" className="text-[10px] font-black uppercase tracking-widest text-[#0F1C3F]/60 px-1">Email Karyawan</FormLabel>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0F1C3F]/30 group-focus-within:text-[#E8A020] transition-colors z-10">
                    <Mail className="h-4 w-4" />
                  </div>
                  <FormControl>
                    <Input
                      {...field}
                      id="email-input"
                      disabled={isPending || lockedOut}
                      placeholder="contoh@bnif.co.id"
                      type="email"
                      className="pl-11 h-14 bg-white/50 border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#E8A020]/10 focus:border-[#E8A020] transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </FormControl>
                </div>
                <FormMessage className="text-[10px] font-bold" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex justify-between items-end px-1">
                  <FormLabel htmlFor="password-input" className="text-[10px] font-black uppercase tracking-widest text-[#0F1C3F]/60">Password</FormLabel>
                </div>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0F1C3F]/30 group-focus-within:text-[#E8A020] transition-colors z-10">
                    <Lock className="h-4 w-4" />
                  </div>
                  <FormControl>
                    <Input
                      {...field}
                      id="password-input"
                      disabled={isPending || lockedOut}
                      placeholder="••••••••"
                      type={showPassword ? "text" : "password"}
                      className="pl-11 pr-11 h-14 bg-white/50 border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#E8A020]/10 focus:border-[#E8A020] transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </FormControl>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={lockedOut}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#0F1C3F]/30 hover:text-[#0F1C3F] transition-colors disabled:cursor-not-allowed z-10"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <FormMessage className="text-[10px] font-bold" />
              </FormItem>
            )}
          />
        </div>

        <Button
          disabled={isPending || lockedOut}
          type="submit"
          className={cn(
            "w-full h-14 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all group",
            lockedOut
              ? "bg-slate-400 cursor-not-allowed shadow-none"
              : "bg-[#0F1C3F] hover:bg-[#1a2b5a] shadow-indigo-900/20 hover:scale-[1.02] active:scale-[0.98]"
          )}
        >
          {isPending ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Memproses...</span>
            </div>
          ) : lockedOut ? (
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Dikunci — {formatCountdown(countdown)}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span>Masuk Sekarang</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          )}
        </Button>
      </form>
    </Form>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center">
      <div className="h-8 w-8 border-2 border-slate-200 border-t-[#0F1C3F] rounded-full animate-spin" />
    </div>}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [showRoleModal, setShowRoleModal] = useState(false);

  // Check if we need to show role selection (from redirect after login)
  const checkRole = searchParams.get("check-role") === "true";

  // Show role modal when redirected from login with check-role=true
  useEffect(() => {
    if (checkRole && session?.user && session.user.roles) {
      if (session.user.roles.length >= 1) {
        setShowRoleModal(true);
      } else {
        // Fallback for users with no explicit roles array
        const activeRole = (session.user as any).activeRole || (session.user as any).role || "KARYAWAN";
        const redirectPath = activeRole === "ADMIN" || activeRole === "SUPER_ADMIN" ? "/admin" : "/dashboard";
        window.location.href = redirectPath;
      }
    }
  }, [checkRole, session]);

  // Get user data for role modal
  const userForModal = session?.user ? {
    name: session.user.name || "User",
    email: session.user.email || "",
    nip: (session.user as any).nip || null,
    image: session.user.image || null,
    roles: session.user.roles || [],
  } : null;

  const handleMicrosoftSSO = async () => {
    // For SSO, we'll redirect to Microsoft, then after callback we'll check role
    // For now, just redirect to Microsoft - the callback will handle role selection
    await signIn("microsoft-entra-id", { callbackUrl: "/auth/login?check-role=true" });
  };

  return (
    <>
      {userForModal && <RoleSelectionModal
        user={userForModal}
        open={showRoleModal}
        onClose={() => {
          setShowRoleModal(false);
          // If user closes the modal without selecting a role, sign them out
          if (checkRole && session?.user) {
            signOut({ callbackUrl: "/auth/login" });
          }
        }}
      />}

      <div className="flex min-h-screen bg-white">
      {/* ─── LEFT PANEL (Branding & Visuals) ─── */}
      <div className="hidden lg:flex lg:w-[60%] relative overflow-hidden bg-[#0F1C3F]">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <Image 
            src="/login-bg.png" 
            alt="Corporate Learning" 
            fill 
            priority
            className="object-cover opacity-60 mix-blend-overlay scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#0F1C3F]/80 via-transparent to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-16 w-full">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#E8A020] to-[#FFB732] flex items-center justify-center shadow-2xl">
              <Building2 className="text-[#0F1C3F] h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tighter leading-none uppercase">BNI Finance</h2>
              <p className="text-[10px] font-black text-[#E8A020] tracking-widest uppercase mt-1">LMS Platform</p>
            </div>
          </div>

          <div className="max-w-xl animate-fade-in-up">
            <h1 className="text-6xl font-black text-white tracking-tighter leading-tight mb-6">
              Investasi Terbaik<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E8A020] to-[#FFB732]">Adalah Pengetahuan.</span>
            </h1>
            <p className="text-lg text-slate-300 font-medium leading-relaxed mb-8">
              Selamat datang kembali di pusat pembelajaran digital BNI Finance. Tingkatkan kualitas diri dan kembangkan potensi karir Anda bersama kami.
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <p className="text-3xl font-black text-white">500+</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Materi Kurikulum</p>
              </div>
              <div className="p-4 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <p className="text-3xl font-black text-white">100%</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Sertifikasi Resmi</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-slate-400 text-xs font-bold">
            <ShieldCheck className="h-4 w-4 text-[#E8A020]" />
            <span className="uppercase tracking-widest">Sistem Keamanan Terenkripsi Enterprise BNI Finance</span>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-[#E8A020]/10 blur-3xl animate-pulse" />
        <div className="absolute -top-20 -right-20 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
      </div>

      {/* ─── RIGHT PANEL (Login Form) ─── */}
      <div className="w-full lg:w-[40%] flex flex-col items-center justify-center p-8 md:p-16 relative bg-[#f8fafc] overflow-hidden">
        {/* Decorative Background Blob for Depth */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-60 pointer-events-none">
          <div className="absolute top-[10%] -right-[10%] w-[500px] h-[500px] bg-[#E8A020]/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-[10%] -left-[10%] w-[400px] h-[400px] bg-[#0F1C3F]/5 rounded-full blur-[100px]" />
        </div>

        <div className="w-full max-w-[400px] space-y-10 relative z-10">
          
          {/* Mobile Only Header */}
          <div className="lg:hidden flex flex-col items-center mb-10 text-center animate-fade-in-up">
             <div className="h-16 w-16 rounded-3xl bg-[#0F1C3F] flex items-center justify-center shadow-xl mb-4">
               <Building2 className="text-[#E8A020] h-8 w-8" />
             </div>
             <h1 className="text-3xl font-black text-[#0F1C3F] tracking-tighter">BNI Finance</h1>
             <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">E-Learning Portal</p>
          </div>

          <div className="bg-white p-10 pt-12 rounded-[3.5rem] shadow-[0_32px_96px_-16px_rgba(15,28,63,0.12)] border border-slate-200/60 animate-fade-in-up relative overflow-hidden" style={{ animationDelay: '100ms' }}>
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#0F1C3F] via-[#E8A020] to-[#0F1C3F]" />
            
            <div className="mb-8">
              <h2 className="text-4xl font-black text-[#0F1C3F] tracking-tighter mb-2 leading-none">Selamat Datang</h2>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Pusat Pembelajaran BNI Finance</p>
            </div>

            <Suspense fallback={<div className="h-64 flex flex-col items-center justify-center gap-4 text-slate-400">
              <div className="h-8 w-8 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-widest">Membangun Akses...</p>
            </div>}>
              <LoginFormContent />
            </Suspense>

            {/* ─── SSO SEPARATOR ─── */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-100" />
              </div>
              <div className="relative flex justify-center text-[9px] uppercase font-black tracking-[0.2em]">
                <span className="bg-white px-4 text-slate-400">Atau Akses Cepat</span>
              </div>
            </div>

            {/* ─── MICROSOFT SSO BUTTON ─── */}
            <Button
              type="button"
              variant="outline"
              onClick={handleMicrosoftSSO}
              className="w-full h-14 bg-white border-slate-200 hover:border-[#00a1f1] hover:bg-[#00a1f1]/5 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-3 group shadow-sm hover:shadow-md"
            >
              <div className="relative w-5 h-5 flex items-center justify-center">
                <svg viewBox="0 0 23 23" className="w-5 h-5">
                  <path fill="#f35325" d="M1 1h10v10H1z"/>
                  <path fill="#81bc06" d="M12 1h10v10H12z"/>
                  <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                  <path fill="#ffba08" d="M12 12h10v10H12z"/>
                </svg>
              </div>
              <span className="text-[#0F1C3F] group-hover:text-[#00a1f1] transition-colors">Akun Kerja Microsoft</span>
            </Button>

            <div className="mt-8 pt-6 border-t border-slate-50 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                Butuh bantuan akses? 
                <a href="#" className="ml-1 text-[#E8A020] hover:text-[#0F1C3F] transition-colors underline underline-offset-4">Hubungi Admin L&D</a>
              </p>
            </div>
          </div>
        </div>

        {/* Footer Legal */}
        <div className="mt-20 text-[10px] font-black text-slate-300 uppercase tracking-tighter text-center">
          © 2026 PT BNI FINANCE. ALL RIGHTS RESERVED.
        </div>
      </div>
      </div>
    </>
  );
}
