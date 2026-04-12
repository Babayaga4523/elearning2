"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";

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
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

const LoginSchema = z.object({
  email: z.string().email({
    message: "Email wajib diisi",
  }),
  password: z.string().min(1, {
    message: "Password wajib diisi",
  }),
});

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (values: z.infer<typeof LoginSchema>) => {
    startTransition(() => {
      login(values, callbackUrl)
        .then((data) => {
          if (data?.error) {
            form.reset();
            toast.error(data.error);
          }
        })
        .catch(() => toast.error("Gagal melakukan login. Silakan coba lagi."));
    });
  };

  return (
    <Form {...form}>
      <form 
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
      >
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-[#0F1C3F]/60 px-1">Email Karyawan</FormLabel>
                <FormControl>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0F1C3F]/30 group-focus-within:text-[#E8A020] transition-colors">
                      <Mail className="h-4 w-4" />
                    </div>
                    <Input
                      {...field}
                      disabled={isPending}
                      placeholder="contoh@bnif.co.id"
                      type="email"
                      className="pl-11 h-14 bg-white/50 border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#E8A020]/10 focus:border-[#E8A020] transition-all font-medium"
                    />
                  </div>
                </FormControl>
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
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-[#0F1C3F]/60">Password</FormLabel>
                </div>
                <FormControl>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0F1C3F]/30 group-focus-within:text-[#E8A020] transition-colors">
                      <Lock className="h-4 w-4" />
                    </div>
                    <Input
                      {...field}
                      disabled={isPending}
                      placeholder="••••••••"
                      type={showPassword ? "text" : "password"}
                      className="pl-11 pr-11 h-14 bg-white/50 border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#E8A020]/10 focus:border-[#E8A020] transition-all font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#0F1C3F]/30 hover:text-[#0F1C3F] transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage className="text-[10px] font-bold" />
              </FormItem>
            )}
          />
        </div>

        <Button
          disabled={isPending}
          type="submit"
          className="w-full h-14 bg-[#0F1C3F] hover:bg-[#1a2b5a] text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-900/20 transition-all hover:scale-[1.02] active:scale-[0.98] group"
        >
          {isPending ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Memproses...</span>
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
              <LoginForm />
            </Suspense>

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
  );
}
