"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import {
  ArrowLeft,
  AlertTriangle,
  Loader2,
  Clock,
  KeyRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

type TokenStatus = "loading" | "valid" | "expired" | "used" | "invalid";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [tokenStatus, setTokenStatus] = useState<TokenStatus>("loading");
  const [tokenData, setTokenData] = useState<{
    email?: string;
    userName?: string;
    expiresAt?: Date;
  } | null>(null);

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setTokenStatus("invalid");
      return;
    }

    // Validate token format (should be 64 hex characters)
    if (!/^[a-f0-9]{64}$/i.test(token)) {
      setTokenStatus("invalid");
      return;
    }

    const validateToken = async () => {
      try {
        const response = await fetch(
          `/api/auth/validate-token?token=${encodeURIComponent(token)}`
        );
        const data = await response.json();

        if (data.valid) {
          setTokenStatus("valid");
          setTokenData({
            email: data.email,
            userName: data.userName,
            expiresAt: new Date(data.expiresAt),
          });
        } else {
          if (data.code === "TOKEN_EXPIRED") {
            setTokenStatus("expired");
          } else if (data.code === "TOKEN_USED") {
            setTokenStatus("used");
          } else {
            setTokenStatus("invalid");
          }
        }
      } catch {
        setTokenStatus("invalid");
      }
    };

    validateToken();
  }, [token]);

  // Token Status States
  const renderStatus = () => {
    switch (tokenStatus) {
      case "loading":
        return (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-[#0F1C3F] mb-4" />
            <p className="text-sm text-[#475467] font-['DM_Sans']">
              Memvalidasi link...
            </p>
          </div>
        );

      case "valid":
        return (
          <div className="space-y-6">
            <ResetPasswordForm token={token!} />
          </div>
        );

      case "expired":
        return (
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 rounded-full bg-[#FFFAEB] flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-[#B54708]" />
            </div>
            <h3 className="text-lg font-bold text-[#101828] font-['Lexend_Deca'] mb-2">
              Link Sudah Expired
            </h3>
            <p className="text-sm text-[#475467] font-['DM_Sans'] mb-6 max-w-[280px] mx-auto">
              Link reset password hanya berlaku 2 jam. Silakan minta link baru.
            </p>
            <Link
              href="/auth/forgot-password"
              className={cn(
                "inline-flex items-center gap-2 px-6 h-12 text-sm font-semibold",
                "bg-[#0F1C3F] hover:bg-[#1A2D5A] text-white",
                "rounded-xl transition-all duration-200 font-['DM_Sans']",
                "active:scale-[0.97] shadow-[0_4px_16px_rgba(15,28,63,0.22)]"
              )}
            >
              <span>Minta Link Baru</span>
            </Link>
          </div>
        );

      case "used":
        return (
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 rounded-full bg-[#FEF3F2] flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-[#B42318]" />
            </div>
            <h3 className="text-lg font-bold text-[#101828] font-['Lexend_Deca'] mb-2">
              Link Sudah Digunakan
            </h3>
            <p className="text-sm text-[#475467] font-['DM_Sans'] mb-6 max-w-[280px] mx-auto">
              Link ini sudah digunakan untuk reset password. Silakan minta link baru jika masih perlu.
            </p>
            <Link
              href="/auth/forgot-password"
              className={cn(
                "inline-flex items-center gap-2 px-6 h-12 text-sm font-semibold",
                "bg-[#0F1C3F] hover:bg-[#1A2D5A] text-white",
                "rounded-xl transition-all duration-200 font-['DM_Sans']",
                "active:scale-[0.97] shadow-[0_4px_16px_rgba(15,28,63,0.22)]"
              )}
            >
              <span>Minta Link Baru</span>
            </Link>
          </div>
        );

      case "invalid":
      default:
        return (
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 rounded-full bg-[#FEF3F2] flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-[#B42318]" />
            </div>
            <h3 className="text-lg font-bold text-[#101828] font-['Lexend_Deca'] mb-2">
              Link Tidak Valid
            </h3>
            <p className="text-sm text-[#475467] font-['DM_Sans'] mb-6 max-w-[280px] mx-auto">
              Link reset password tidak valid atau sudah kadaluarsa. Silakan minta link baru.
            </p>
            <Link
              href="/auth/forgot-password"
              className={cn(
                "inline-flex items-center gap-2 px-6 h-12 text-sm font-semibold",
                "bg-[#0F1C3F] hover:bg-[#1A2D5A] text-white",
                "rounded-xl transition-all duration-200 font-['DM_Sans']",
                "active:scale-[0.97] shadow-[0_4px_16px_rgba(15,28,63,0.22)]"
              )}
            >
              <span>Minta Link Baru</span>
            </Link>
          </div>
        );
    }
  };

  return (
    <div className="relative z-20 flex min-h-screen bg-[#F8F9FB]">
      <div className="flex-1 flex flex-col items-center justify-center px-6 sm:px-10 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-[400px]"
        >
          {/* Card */}
          <div className="bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.07)] border border-[#E4E7EC]/70 overflow-hidden">
            {/* Top gradient accent bar */}
            <div className="h-1 bg-gradient-to-r from-[#0F1C3F] via-[#243868] to-[#E8A020]" />

            <div className="px-8 py-8 xl:px-10">
              {/* Back link */}
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 text-sm text-[#98A2B3] hover:text-[#475467] font-['DM_Sans'] transition-colors duration-200 mb-6"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali ke login</span>
              </Link>

              {/* Header */}
              {tokenStatus !== "loading" && tokenStatus !== "valid" && (
                <div className="mb-6 text-center">
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-12 h-12 rounded-xl bg-[#0F1C3F]/5 flex items-center justify-center">
                      <KeyRound className="w-6 h-6 text-[#0F1C3F]" />
                    </div>
                  </div>
                  <h2 className="text-xl font-bold text-[#101828] font-['Lexend_Deca'] leading-tight tracking-tight">
                    Reset Password
                  </h2>
                </div>
              )}

              {/* Content */}
              {renderStatus()}
            </div>
          </div>

          {/* Copyright */}
          <p className="mt-6 text-center text-[10px] text-[#C8D0DC] font-['DM_Sans'] tracking-[0.05em] uppercase">
            © 2026 PT BNI Finance. All rights reserved.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-11 h-11 animate-spin text-[#0F1C3F]" />
            <p className="text-xs text-[#98A2B3] font-['DM_Sans'] animate-pulse">
              Memuat...
            </p>
          </div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}