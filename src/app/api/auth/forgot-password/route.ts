/**
 * Forgot Password API Route
 *
 * POST /api/auth/forgot-password
 *
 * Flow:
 * 1. Validate email format
 * 2. Check rate limit (3 requests per email per 24 hours)
 * 3. Check if user exists + is MANUAL auth (not SSO)
 * 4. If MANUAL auth:
 *    - Generate token
 *    - Store hashed token in DB
 *    - Send reset email
 * 5. If SSO/Microsoft auth:
 *    - Return message directing to IT
 * 6. Always return same message to prevent email enumeration
 */

import { NextRequest, NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { log } from "@/lib/logger";
import {
  generatePasswordResetToken,
  getTokenExpiry,
  getConfiguredExpiryHours,
} from "@/lib/token-generator";
import { generateForgotPasswordEmail } from "@/lib/email-templates";
import { sendEmailWithRetry } from "@/lib/email";

// Rate limiting constants
const MAX_REQUESTS_PER_EMAIL = 3;
const RATE_LIMIT_WINDOW_HOURS = 24;

interface ForgotPasswordRequest {
  email: string;
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check rate limit for email
 */
async function checkRateLimit(email: string, ipAddress: string): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt?: Date;
}> {
  const windowStart = new Date();
  windowStart.setHours(windowStart.getHours() - RATE_LIMIT_WINDOW_HOURS);

  // Check request count for this email
  const requestCount = await prisma.passwordResetToken.count({
    where: {
      email: email.toLowerCase(),
      createdAt: { gte: windowStart },
    },
  });

  if (requestCount >= MAX_REQUESTS_PER_EMAIL) {
    // Find when the oldest token expires
    const oldestToken = await prisma.passwordResetToken.findFirst({
      where: {
        email: email.toLowerCase(),
        createdAt: { gte: windowStart },
      },
      orderBy: { expiresAt: "asc" },
    });

    return {
      allowed: false,
      remaining: 0,
      resetAt: oldestToken?.expiresAt || new Date(),
    };
  }

  return {
    allowed: true,
    remaining: MAX_REQUESTS_PER_EMAIL - requestCount - 1,
  };
}

/**
 * Send password reset email
 */
async function sendResetEmail(
  email: string,
  recipientName: string,
  rawToken: string
): Promise<{ success: boolean; error?: string }> {
  const expiryHours = getConfiguredExpiryHours();
  const resetLink = `${env.APP_URL}/auth/reset-password?token=${rawToken}`;
  const requestTime = new Date();

  const { subject, html, text } = generateForgotPasswordEmail({
    recipientName,
    resetLink,
    expiryHours,
    requestTime,
  });

  const result = await sendEmailWithRetry({
    to: email,
    subject,
    html,
    text,
  });

  return {
    success: result.success,
    error: result.error,
  };
}

export async function POST(request: NextRequest) {
  try {
    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    // Parse request body
    let body: ForgotPasswordRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Format request tidak valid" },
        { status: 400 }
      );
    }

    const { email } = body;

    // Validate email format
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email wajib diisi" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (!isValidEmail(normalizedEmail)) {
      return NextResponse.json(
        { error: "Format email tidak valid" },
        { status: 400 }
      );
    }

    // Check rate limit
    const rateLimitCheck = await checkRateLimit(normalizedEmail, ipAddress);

    if (!rateLimitCheck.allowed) {
      log.warn("Forgot password rate limited", {
        email: normalizedEmail,
        ipAddress,
        context: "auth",
      });

      return NextResponse.json(
        {
          error: `Terlalu banyak permintaan. Silakan coba lagi setelah ${rateLimitCheck.resetAt?.toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}.`,
        },
        { status: 429 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        name: true,
        authMethod: true,
      },
    });

    // Check if this is an SSO/Microsoft account
    if (user && user.authMethod === "MICROSOFT") {
      // SSO users should contact IT - but still log the attempt
      log.info("Forgot password attempted on SSO account", {
        email: normalizedEmail,
        userId: user.id,
        ipAddress,
        context: "auth",
      });

      return NextResponse.json(
        {
          message:
            "Jika email tersebut terdaftar dan menggunakan login Microsoft, Anda perlu menghubungi tim IT untuk reset password.",
        },
        { status: 200 }
      );
    }

    // If user doesn't exist - return generic success to prevent enumeration
    if (!user) {
      // Log the attempt for security monitoring but don't reveal existence
      log.info("Forgot password for non-existent email", {
        email: normalizedEmail,
        ipAddress,
        context: "auth",
      });

      // Still return success to prevent email enumeration
      return NextResponse.json(
        {
          message:
            "Jika email tersebut terdaftar di sistem kami, link reset password telah dikirim.",
        },
        { status: 200 }
      );
    }

    // Generate reset token
    const { token, hashedToken } = generatePasswordResetToken();
    const expiryHours = getConfiguredExpiryHours();
    const expiresAt = getTokenExpiry(expiryHours);

    // Store token in database
    await prisma.passwordResetToken.create({
      data: {
        email: normalizedEmail,
        tokenHash: hashedToken,
        expiresAt,
      },
    });

    // Send reset email
    const emailResult = await sendResetEmail(
      normalizedEmail,
      user.name || "Pengguna",
      token
    );

    if (!emailResult.success) {
      log.error("Failed to send password reset email", {
        email: normalizedEmail,
        userId: user.id,
        error: emailResult.error,
        context: "email",
      });

      // Still return success to user - email will be retried
      // or they can request again
    }

    // Log successful request
    log.info("Password reset requested", {
      email: normalizedEmail,
      userId: user.id,
      ipAddress,
      context: "auth",
    });

    return NextResponse.json(
      {
        message:
          "Jika email tersebut terdaftar di sistem kami, link reset password telah dikirim.",
      },
      { status: 200 }
    );
  } catch (error) {
    log.error("Forgot password error", {
      error: error instanceof Error ? error.message : "Unknown error",
      context: "auth",
    });

    return NextResponse.json(
      { error: "Terjadi kesalahan. Silakan coba lagi." },
      { status: 500 }
    );
  }
}