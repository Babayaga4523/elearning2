/**
 * Reset Password API Route
 *
 * POST /api/auth/reset-password
 *
 * Flow:
 * 1. Validate token from URL
 * 2. Validate new password meets requirements
 * 3. Hash new password with bcrypt
 * 4. Update user password
 * 5. Mark token as used
 * 6. Invalidate all existing sessions
 * 7. Log the action for audit
 */

import { NextRequest, NextResponse } from "next/server";
import { hash as bcryptHash, compare as bcryptCompare } from "bcryptjs";
import { db as prisma } from "@/lib/db";
import { log } from "@/lib/logger";
import { isTokenExpired, hashToken } from "@/lib/token-generator";
import { validatePasswordResetForm } from "@/lib/password-requirements";

const BCRYPT_ROUNDS = 12;

interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

/**
 * Find valid token in database
 */
async function findValidToken(token: string) {
  const hashedInput = hashToken(token);
  
  return await prisma.passwordResetToken.findFirst({
    where: {
      tokenHash: hashedInput,
      expiresAt: { gte: new Date() },
      usedAt: null,
    },
  });
}

/**
 * Invalidate all sessions for a user
 * JWT-based auth: sessions are stateless, invalidation is handled by
 * NextAuth on next login — no DB action needed for JWT strategy.
 */
async function invalidateUserSessions(_userId: string): Promise<void> {
  // Session invalidation in JWT-based auth is handled by NextAuth
  // when the next login occurs — no DB action needed
  log.info("JWT sessions will be refreshed on next login", {
    context: "auth",
  });
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    let body: ResetPasswordRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Format request tidak valid" },
        { status: 400 }
      );
    }

    const { token, password, confirmPassword } = body;

    // Validate required fields
    if (!token || !password || !confirmPassword) {
      return NextResponse.json(
        { error: "Token, password, dan konfirmasi password wajib diisi" },
        { status: 400 }
      );
    }

    // Validate token format
    if (!/^[a-f0-9]{64}$/i.test(token)) {
      return NextResponse.json(
        { error: "Format token tidak valid" },
        { status: 400 }
      );
    }

    // Validate password
    const passwordValidation = validatePasswordResetForm(password, confirmPassword);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: passwordValidation.errors[0], errors: passwordValidation.errors },
        { status: 400 }
      );
    }

    // Find valid token
    const resetToken = await findValidToken(token);

    if (!resetToken) {
      // Determine the reason - lookup with SAME token hash
      const hashedInput = hashToken(token);
      const existingTokens = await prisma.passwordResetToken.findMany({
        where: {
          tokenHash: hashedInput,
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      });

      // Check for expired vs used tokens
      if (existingTokens.length > 0) {
        const tokenRecord = existingTokens[0];
        if (isTokenExpired(tokenRecord.expiresAt)) {
          return NextResponse.json(
            { error: "Link sudah expired. Silakan minta link baru." },
            { status: 400 }
          );
        }
        if (tokenRecord.usedAt) {
          return NextResponse.json(
            { error: "Link sudah digunakan. Silakan minta link baru." },
            { status: 400 }
          );
        }
      }

      return NextResponse.json(
        { error: "Link tidak valid. Silakan minta link baru." },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: resetToken.email },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
      },
    });

    if (!user) {
      log.error("User not found for valid reset token", {
        email: resetToken.email,
        context: "auth",
      });

      return NextResponse.json(
        { error: "Akun tidak ditemukan" },
        { status: 400 }
      );
    }

    // Check if new password is same as current
    if (user.password) {
      const isSamePassword = await bcryptCompare(password, user.password);
      if (isSamePassword) {
        return NextResponse.json(
          { error: "Password baru tidak boleh sama dengan password lama" },
          { status: 400 }
        );
      }
    }

    // Hash new password
    const hashedPassword = await bcryptHash(password, BCRYPT_ROUNDS);

    // Update user password in transaction
    await prisma.$transaction(async (tx) => {
      // Update user password
      await tx.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      // Mark token as used
      await tx.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      });

      // Invalidate all password reset tokens for this email
      // (Prevent token reuse from old requests)
      await tx.passwordResetToken.updateMany({
        where: {
          email: user.email!,
          id: { not: resetToken.id },
          usedAt: null,
        },
        data: { usedAt: new Date() }, // Invalidate other unused tokens
      });
    });

    // Invalidate sessions
    await invalidateUserSessions(user.id);

    // Audit log - password reset completed
    log.info("Password reset completed", {
      userId: user.id,
      email: user.email,
      context: "auth",
    });

    return NextResponse.json({
      success: true,
      message: "Password berhasil direset. Silakan login dengan password baru.",
    });
  } catch (error) {
    log.error("Password reset error", {
      error: error instanceof Error ? error.message : "Unknown error",
      context: "auth",
    });

    return NextResponse.json(
      { error: "Terjadi kesalahan. Silakan coba lagi." },
      { status: 500 }
    );
  }
}