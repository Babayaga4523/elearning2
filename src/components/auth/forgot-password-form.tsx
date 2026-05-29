"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Mail, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ForgotPasswordFormProps {
  className?: string;
}

export function ForgotPasswordForm({ className }: ForgotPasswordFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate email
    if (!email.trim()) {
      setError("Email wajib diisi");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Format email tidak valid");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Terjadi kesalahan. Silakan coba lagi.");
        return;
      }

      // Show success regardless of whether email exists
      setSuccess(true);
    } catch {
      setError("Gagal terhubung ke server. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  // Success state
  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn("text-center py-6", className)}
      >
        <div className="mx-auto w-16 h-16 rounded-full bg-[#ECFDF3] flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-[#027A48]" />
        </div>
        <h3 className="text-lg font-bold text-[#101828] font-['Lexend_Deca'] mb-2">
          Link Reset Terkirim
        </h3>
        <p className="text-sm text-[#475467] font-['DM_Sans'] mb-6 max-w-[280px] mx-auto">
          Jika email tersebut terdaftar di sistem kami, link reset password telah dikirim.
        </p>
        <p className="text-xs text-[#98A2B3] font-['DM_Sans'] mb-6">
          Cek folder spam jika email tidak ditemukan.
        </p>
        <button
          onClick={() => router.push("/auth/login")}
          className={cn(
            "inline-flex items-center gap-2 text-sm font-semibold text-[#0F1C3F] font-['DM_Sans']",
            "hover:text-[#E8A020] transition-colors duration-200"
          )}
        >
          <span>Kembali ke halaman login</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-5", className)}>
      <div className="space-y-1.5">
        <label
          htmlFor="forgot-email"
          className="block text-sm font-medium text-[#344054] font-['DM_Sans']"
        >
          Email Karyawan
        </label>
        <div className="relative group">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#98A2B3] group-focus-within:text-[#E8A020] transition-colors duration-200 pointer-events-none z-10">
            <Mail className="h-4 w-4" />
          </div>
          <input
            id="forgot-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@bnif.co.id"
            autoComplete="email"
            disabled={isLoading}
            className={cn(
              "w-full h-12 pl-10 pr-4 text-sm rounded-xl border font-['DM_Sans']",
              "outline-none transition-all duration-200",
              "text-[#101828] placeholder:text-[#98A2B3]",
              "border-[#E4E7EC] bg-white",
              "focus:ring-[3px] focus:ring-[#E8A020]/[0.12] focus:border-[#E8A020] focus:shadow-[0_0_0_4px_rgba(232,160,32,0.07)]",
              error
                ? "border-[#F04438] bg-[#FEF3F2] focus:ring-[#F04438]/[0.12] focus:border-[#F04438]"
                : "",
              isLoading && "bg-[#F8F9FB] text-[#98A2B3] cursor-wait"
            )}
          />
        </div>

        {/* Error message */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -4, height: 0 }}
              className="flex items-center gap-1.5 text-xs text-[#B42318] font-['DM_Sans'] overflow-hidden"
            >
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className={cn(
          "w-full h-12 text-sm font-semibold rounded-xl transition-all duration-200",
          "flex items-center justify-center gap-2.5 font-['DM_Sans']",
          "active:scale-[0.97]",
          isLoading
            ? "bg-[#1A2D5A] text-white/70 cursor-wait"
            : "bg-[#0F1C3F] hover:bg-[#1A2D5A] text-white shadow-[0_4px_16px_rgba(15,28,63,0.22)] hover:shadow-[0_6px_22px_rgba(15,28,63,0.28)]"
        )}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Mengirim...</span>
          </>
        ) : (
          <>
            <span>Kirim Link Reset</span>
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
    </form>
  );
}