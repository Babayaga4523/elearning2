"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { clearLoginAttempts, clearIpLoginAttempts, windowStart, EMAIL_MAX_ATTEMPTS, IP_MAX_ATTEMPTS } from "@/lib/rate-limiter";
import { requireAdmin } from "@/lib/auth-helpers";

export async function getLockedTargets() {
  try {
    const result = await requireAdmin();
    if (!result || "success" in result) {
      throw new Error(result?.error || "Unauthorized");
    }

    const since = windowStart();

    // Get all login attempts in the window
    const allAttempts = await db.loginAttempt.findMany({
      where: { createdAt: { gte: since } },
      select: {
        email: true,
        ipAddress: true,
        createdAt: true,
      },
    });

    // Group by email manually
    const emailMap = new Map<string, { count: number; lastAttempt: Date }>();
    const ipMap = new Map<string, { count: number; lastAttempt: Date }>();

    for (const attempt of allAttempts) {
      // Count emails
      const emailData = emailMap.get(attempt.email) || { count: 0, lastAttempt: attempt.createdAt };
      emailData.count++;
      if (attempt.createdAt > emailData.lastAttempt) {
        emailData.lastAttempt = attempt.createdAt;
      }
      emailMap.set(attempt.email, emailData);

      // Count IPs
      const ipData = ipMap.get(attempt.ipAddress) || { count: 0, lastAttempt: attempt.createdAt };
      ipData.count++;
      if (attempt.createdAt > ipData.lastAttempt) {
        ipData.lastAttempt = attempt.createdAt;
      }
      ipMap.set(attempt.ipAddress, ipData);
    }

    // Filter locked emails (>= EMAIL_MAX_ATTEMPTS)
    const lockedEmails = Array.from(emailMap.entries())
      .filter(([_, data]) => data.count >= EMAIL_MAX_ATTEMPTS)
      .map(([email, data]) => ({
        email,
        attempts: data.count,
        lastAttemptAt: data.lastAttempt,
      }))
      .sort((a, b) => b.lastAttemptAt.getTime() - a.lastAttemptAt.getTime());

    // Filter locked IPs (>= IP_MAX_ATTEMPTS)
    const lockedIps = Array.from(ipMap.entries())
      .filter(([_, data]) => data.count >= IP_MAX_ATTEMPTS)
      .map(([ipAddress, data]) => ({
        ipAddress,
        attempts: data.count,
        lastAttemptAt: data.lastAttempt,
      }))
      .sort((a, b) => b.lastAttemptAt.getTime() - a.lastAttemptAt.getTime());

    console.log("[GET_LOCKED_TARGETS] Found:", {
      totalAttempts: allAttempts.length,
      lockedEmails: lockedEmails.length,
      lockedIps: lockedIps.length,
    });

    return { lockedEmails, lockedIps };
  } catch (error) {
    console.error("[GET_LOCKED_TARGETS]", error);
    return { lockedEmails: [], lockedIps: [] };
  }
}

export async function unlockEmail(email: string) {
  try {
    const result = await requireAdmin();
    if (!result || "success" in result) {
      return result || { success: false as const, error: "Unauthorized" };
    }

    await clearLoginAttempts(email);
    revalidatePath("/admin/locked-accounts");
    return { success: true as const };
  } catch (error: any) {
    console.error("[UNLOCK_EMAIL]", error);
    return { success: false as const, error: "Gagal membuka kunci email." };
  }
}

export async function unlockIp(ipAddress: string) {
  try {
    const result = await requireAdmin();
    if (!result || "success" in result) {
      return result || { success: false as const, error: "Unauthorized" };
    }

    await clearIpLoginAttempts(ipAddress);
    revalidatePath("/admin/locked-accounts");
    return { success: true as const };
  } catch (error: any) {
    console.error("[UNLOCK_IP]", error);
    return { success: false as const, error: "Gagal membuka kunci IP." };
  }
}
