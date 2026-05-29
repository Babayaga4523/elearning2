/**
 * Validate Token API Route
 *
 * GET /api/auth/validate-token?token=xxx
 *
 * Checks if a password reset token is valid without consuming it.
 * Used to verify token before showing reset form.
 */

import { NextRequest, NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";
import { log } from "@/lib/logger";
import { isTokenExpired, hashToken } from "@/lib/token-generator";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    // Validate token parameter exists
    if (!token) {
      return NextResponse.json(
        { valid: false, error: "Token tidak ditemukan" },
        { status: 400 }
      );
    }

    // Validate token format (should be 64 hex characters)
    if (!/^[a-f0-9]{64}$/i.test(token)) {
      return NextResponse.json(
        { valid: false, error: "Format token tidak valid" },
        { status: 400 }
      );
    }

    const hashedInput = hashToken(token);
    const validToken = await prisma.passwordResetToken.findFirst({
      where: {
        tokenHash: hashedInput,
        expiresAt: { gte: new Date() },
        usedAt: null,
      },
    });

    // Token not found or expired - check why
    if (!validToken) {
      // Check if this token hash exists but is expired
      const expiredToken = await prisma.passwordResetToken.findFirst({
        where: { tokenHash: hashedInput },
        orderBy: { createdAt: "desc" },
      });

      // Determine reason for invalidity
      if (expiredToken && isTokenExpired(expiredToken.expiresAt)) {
        return NextResponse.json(
          {
            valid: false,
            error: "Link sudah expired. Silakan minta link baru.",
            code: "TOKEN_EXPIRED",
          },
          { status: 200 }
        );
      }

      // Check if already used
      if (expiredToken && expiredToken.usedAt) {
        return NextResponse.json(
          {
            valid: false,
            error: "Link sudah digunakan. Silakan minta link baru.",
            code: "TOKEN_USED",
          },
          { status: 200 }
        );
      }

      return NextResponse.json(
        {
          valid: false,
          error: "Link tidak valid. Silakan minta link baru.",
          code: "TOKEN_INVALID",
        },
        { status: 200 }
      );
    }

    // Token is valid - get user info for UI
    const user = await prisma.user.findUnique({
      where: { email: validToken.email },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      return NextResponse.json(
        {
          valid: false,
          error: "Akun tidak ditemukan. Silakan minta link baru.",
          code: "USER_NOT_FOUND",
        },
        { status: 200 }
      );
    }

    log.info("Token validated successfully", {
      userId: user.id,
      email: user.email,
      context: "auth",
    });

    return NextResponse.json({
      valid: true,
      email: user.email,
      userName: user.name,
      expiresAt: validToken.expiresAt,
    });
  } catch (error) {
    log.error("Token validation error", {
      error: error instanceof Error ? error.message : "Unknown error",
      context: "auth",
    });

    return NextResponse.json(
      { valid: false, error: "Terjadi kesalahan validasi" },
      { status: 500 }
    );
  }
}