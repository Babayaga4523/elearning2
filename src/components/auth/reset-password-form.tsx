"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Eye, EyeOff, AlertCircle, CheckCircle2, LockKeyhole } from "lucide-react";
import { cn } from "@/lib/utils";
import { validatePassword } from "@/lib/password-requirements";

interface ResetPasswordFormProps {
  token: string;
  onTokenInvalid?: () => void;
}

export function ResetPasswordForm({ token, onTokenInvalid }: ResetPasswordFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [validation, setValidation] = useState<
    | ReturnType<typeof validatePassword>
    | null
  >(null);

  // Real-time password validation
  useEffect(() => {
    if (password) {
      setValidation(validatePassword(password));
    } else {
      setValidation(null);
    }
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (!password || !confirmPassword) {
      setError("Password dan konfirmasi password wajib diisi");
      return;
    }

    if (password !== confirmPassword) {
      setError("Password dan konfirmasi password tidak cocok");
      return;
    }

    if (validation && !validation.isValid) {
      setError(validation.errors[0]);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Terjadi kesalahan. Silakan coba lagi.");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Gagal terhubung ke server. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const passwordRequirements = [
    { key: "length", label: "Minimal 8 karakter" },
    { key: "uppercase", label: "Mengandung huruf besar" },
    { key: "lowercase", label: "Mengandung huruf kecil" },
    { key: "number", label: "Mengandung angka" },
  ];

  // Success state
  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-6"
      >
        <div className="mx-auto w-16 h-16 rounded-full bg-[#ECFDF3] flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-[#027A48]" />
        </div>
        <h3 className="text-lg font-bold text-[#101828] font-['Lexend_Deca'] mb-2">
          Password Berhasil Direset
        </h3>
        <p className="text-sm text-[#475467] font-['DM_Sans'] mb-6 max-w-[280px] mx-auto">
          Password Anda telah berhasil diubah. Silakan login dengan password baru.
        </p>
        <button
          onClick={() => router.push("/auth/login?reset=success")}
          className={cn(
            "inline-flex items-center gap-2 px-6 h-12 text-sm font-semibold",
            "bg-[#0F1C3F] hover:bg-[#1A2D5A] text-white",
            "rounded-xl transition-all duration-200 font-['DM_Sans']",
            "active:scale-[0.97] shadow-[0_4px_16px_rgba(15,28,63,0.22)]"
          )}
        >
          <span>Masuk ke Portal</span>
        </button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-4">
        {/* New Password */}
        <div className="space-y-1.5">
          <label
            htmlFor="new-password"
            className="block text-sm font-medium text-[#344054] font-['DM_Sans']"
          >
            Password Baru
          </label>
          <div className="relative group">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#98A2B3] group-focus-within:text-[#E8A020] transition-colors duration-200 pointer-events-none z-10">
              <LockKeyhole className="h-4 w-4" />
            </div>
            <input
              id="new-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 8 karakter"
              autoComplete="new-password"
              disabled={isLoading}
              className={cn(
                "w-full h-12 pl-10 pr-10 text-sm rounded-xl border font-['DM_Sans']",
                "outline-none transition-all duration-200",
                "text-[#101828] placeholder:text-[#98A2B3]",
                "border-[#E4E7EC] bg-white",
                "focus:ring-[3px] focus:ring-[#E8A020]/[0.12] focus:border-[#E8A020] focus:shadow-[0_0_0_4px_rgba(232,160,32,0.07)]",
                error
                  ? "border-[#F04438] bg-[#FEF3F2]"
                  : "",
                isLoading && "bg-[#F8F9FB] text-[#98A2B3] cursor-wait"
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#98A2B3] hover:text-[#475467] active:scale-90 transition-all duration-150 z-10"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <label
            htmlFor="confirm-password"
            className="block text-sm font-medium text-[#344054] font-['DM_Sans']"
          >
            Konfirmasi Password
          </label>
          <div className="relative group">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#98A2B3] group-focus-within:text-[#E8A020] transition-colors duration-200 pointer-events-none z-10">
              <LockKeyhole className="h-4 w-4" />
            </div>
            <input
              id="confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Masukkan ulang password"
              autoComplete="new-password"
              disabled={isLoading}
              className={cn(
                "w-full h-12 pl-10 pr-10 text-sm rounded-xl border font-['DM_Sans']",
                "outline-none transition-all duration-200",
                "text-[#101828] placeholder:text-[#98A2B3]",
                "border-[#E4E7EC] bg-white",
                "focus:ring-[3px] focus:ring-[#E8A020]/[0.12] focus:border-[#E8A020] focus:shadow-[0_0_0_4px_rgba(232,160,32,0.07)]",
                error
                  ? "border-[#F04438] bg-[#FEF3F2]"
                  : "",
                isLoading && "bg-[#F8F9FB] text-[#98A2B3] cursor-wait"
              )}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={isLoading}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#98A2B3] hover:text-[#475467] active:scale-90 transition-all duration-150 z-10"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Password Requirements Checklist */}
        {password && (
          <div className="space-y-1.5 p-3 rounded-xl bg-[#F8F9FB] border border-[#E4E7EC]">
            <p className="text-xs font-semibold text-[#475467] font-['DM_Sans'] mb-2">
              Persyaratan Password:
            </p>
            {passwordRequirements.map((req) => {
              const isMet = validation?.requirements[req.key as keyof typeof validation.requirements]?.met ?? false;
              return (
                <div
                  key={req.key}
                  className={cn(
                    "flex items-center gap-2 text-xs font-['DM_Sans'] transition-all duration-200",
                    isMet ? "text-[#027A48]" : "text-[#98A2B3]"
                  )}
                >
                  <div
                    className={cn(
                      "w-4 h-4 rounded-full flex items-center justify-center transition-all duration-200",
                      isMet ? "bg-[#ECFDF3]" : "bg-[#E4E7EC]"
                    )}
                  >
                    {isMet && (
                      <CheckCircle2 className="w-3 h-3" />
                    )}
                  </div>
                  <span>{req.label}</span>
                </div>
              );
            })}
          </div>
        )}

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
            : "bg-[#E8A020] hover:bg-[#D4921A] text-white shadow-[0_4px_16px_rgba(232,160,32,0.3)] hover:shadow-[0_6px_22px_rgba(232,160,32,0.4)]"
        )}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Mereset Password...</span>
          </>
        ) : (
          <span>Reset Password</span>
        )}
      </button>
    </form>
  );
}