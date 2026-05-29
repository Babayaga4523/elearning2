"use server";

import * as z from "zod";
import { AuthError } from "next-auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
const isRedirectError = (error: unknown) => {
  if (typeof error !== "object" || error === null) return false;
  const digest = (error as Record<string, unknown>).digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
};


import { signIn } from "@/auth";
import { db } from "@/lib/db";
import {
  checkRateLimit,
  recordFailedAttempt,
  clearLoginAttempts,
} from "@/lib/rate-limiter";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/**
 * Extracts the real client IP from the request headers.
 * Respects X-Forwarded-For set by AKS Ingress / Azure Load Balancer.
 * Falls back to a placeholder if header is unavailable (e.g. in tests).
 */
function getClientIp(): string {
  const headerStore = headers();
  const forwarded = headerStore.get("x-forwarded-for");
  if (forwarded) {
    // x-forwarded-for can be a comma-separated list; the first is the real client
    return forwarded.split(",")[0].trim();
  }
  return headerStore.get("x-real-ip") ?? "unknown";
}

export const login = async (
  values: z.infer<typeof LoginSchema>,
  callbackUrl?: string | null
): Promise<{ 
  success?: boolean; 
  redirectTo?: string; 
  error?: string; 
  lockedOut?: boolean; 
  retryAfterMinutes?: number; 
  attemptsRemaining?: number;
} | undefined> => {
  const validatedFields = LoginSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Data tidak valid. Periksa kembali email dan password Anda." };
  }

  const { email, password } = validatedFields.data;
  const ip = getClientIp();

  // ── 1. Check Rate Limit BEFORE touching the DB for auth ─────────────────
  // This prevents enumeration attacks from consuming DB resources.
  const rateLimit = await checkRateLimit(email, ip);

  if (rateLimit.blocked) {
    if (rateLimit.reason === "email") {
      return {
        error: `Akun dikunci sementara karena terlalu banyak percobaan gagal. Coba lagi dalam ${rateLimit.retryAfterMinutes} menit.`,
        lockedOut: true,
        retryAfterMinutes: rateLimit.retryAfterMinutes,
      };
    }
    if (rateLimit.reason === "ip") {
      return {
        error: `Terlalu banyak percobaan login dari perangkat ini. Coba lagi dalam ${rateLimit.retryAfterMinutes} menit.`,
        lockedOut: true,
        retryAfterMinutes: rateLimit.retryAfterMinutes,
      };
    }
  }

  // ── 2. Check user role for post-login redirect ──────────────────────────
  const user = await db.user.findUnique({
    where: { email },
    select: { role: true, roles: true, activeRole: true },
  });

  // Always redirect to role selection page for role check
  const redirectPath = "/auth/login?check-role=true";

  // ── 3. Attempt Authentication ────────────────────────────────────────────
  try {
    const result = await signIn("credentials", {
      email,
      password,
      redirectTo: redirectPath,
    });

    // If we reach here, login was successful — clear failed attempt history
    await clearLoginAttempts(email);

    // Return success with redirect path
    return { success: true, redirectTo: redirectPath };

  } catch (error) {
    if (isRedirectError(error)) {
      // Login succeeded, clear failed attempt history
      await clearLoginAttempts(email);
      // Return success object so the client can perform a hard redirect (window.location.href)
      // This ensures the session is properly loaded on the next page view
      return { success: true, redirectTo: "/auth/login?check-role=true" };
    }

    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin": {
          // Record the failure for rate limiting
          await recordFailedAttempt(email, ip);

          // Re-check to see if user is now locked out
          const check = await checkRateLimit(email, ip);
          
          if (check.blocked) {
            return {
              error: `Akun dikunci sementara karena terlalu banyak percobaan gagal. Coba lagi dalam ${check.retryAfterMinutes ?? 15} menit.`,
              lockedOut: true,
              retryAfterMinutes: check.retryAfterMinutes,
            };
          }

          const remaining = check.remaining ?? 0;

          return {
            error: `Email atau password salah. ${remaining} percobaan tersisa sebelum akun dikunci.`,
            attemptsRemaining: remaining,
          };
        }
        default:
          return { error: "Terjadi kesalahan. Silakan coba lagi." };
      }
    }

    // Re-throw redirect or other non-auth errors (next/navigation throws)
    throw error;
  }
};
