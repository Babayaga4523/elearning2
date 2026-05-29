"use client";

import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { ArrowLeft } from "lucide-react";

function ForgotPasswordContent() {
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
                  Lupa Password
                </h2>
                <p className="text-sm text-[#475467] font-['DM_Sans'] mt-1.5 leading-snug text-center">
                  Masukkan email Anda dan kami akan mengirim link untuk mereset password.
                </p>
              </div>

              {/* Form */}
              <ForgotPasswordForm />

              {/* SSO notice */}
              <div className="mt-6 p-4 rounded-xl bg-[#EFF8FF] border border-[#B3D9F7]">
                <p className="text-xs text-[#0078D4] font-['DM_Sans'] text-center">
                  <strong>Akun Microsoft:</strong> Jika Anda login menggunakan akun Microsoft,
                  silakan hubungi tim IT untuk reset password.
                </p>
              </div>
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

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-11 h-11 border-[2.5px] border-[#E4E7EC] border-t-[#0F1C3F] rounded-full animate-spin" />
          <p className="text-xs text-[#98A2B3] font-['DM_Sans'] animate-pulse">Memuat...</p>
        </div>
      </div>
    }>
      <ForgotPasswordContent />
    </Suspense>
  );
}