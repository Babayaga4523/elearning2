/**
 * rate-limiter.ts
 *
 * PostgreSQL-backed distributed rate limiter for login brute-force protection.
 *
 * Why PostgreSQL (not Redis, not in-memory):
 * - All K8s/AKS pods share the same PostgreSQL instance → state is automatically
 *   centralized across any number of running containers.
 * - No additional infrastructure (Redis service, Upstash subscription) required.
 * - Persistent across restarts — no amnesia on pod recycle.
 * - Sufficient for LMS internal traffic (login is a low-frequency operation).
 *
 * Policy (tunable via constants below):
 *   • 5 failed attempts per EMAIL within 15 minutes  → per-account lockout
 *   • 20 failed attempts per IP within 15 minutes    → password-spray protection
 */

import { db } from "@/lib/db";

// ─── Configuration ─────────────────────────────────────────────────────────
export const EMAIL_MAX_ATTEMPTS  = 5;   // max consecutive failures per email
export const IP_MAX_ATTEMPTS     = 20;  // max failures per IP (catches spray attacks)
export const WINDOW_MINUTES      = 15;  // rolling time window in minutes
const WINDOW_MS           = WINDOW_MINUTES * 60 * 1000;

// ─── Types ─────────────────────────────────────────────────────────────────
export interface RateLimitResult {
  /** true = request is blocked */
  blocked: boolean;
  /** Reason for blocking ("email" | "ip") — undefined when not blocked */
  reason?: "email" | "ip";
  /** How many minutes remain until the window resets */
  retryAfterMinutes?: number;
  /** Current attempt count in this window */
  attempts?: number;
  /** Remaining allowed attempts before lockout */
  remaining?: number;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Returns the UTC Date that marks the start of the current window. */
export function windowStart(): Date {
  return new Date(Date.now() - WINDOW_MS);
}

/**
 * Calculates how many minutes remain until the oldest recorded attempt
 * in this window expires — i.e., how long the user must wait.
 */
function minutesUntilReset(oldestAttemptAt: Date): number {
  const expiresAt = new Date(oldestAttemptAt.getTime() + WINDOW_MS);
  const remaining = Math.ceil((expiresAt.getTime() - Date.now()) / 60000);
  return Math.max(1, remaining); // floor at 1 so UI never shows "0 minutes"
}

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Check whether a login attempt should be blocked.
 *
 * Call this BEFORE running bcrypt or touching the DB for user lookup.
 * Returns a RateLimitResult — if `blocked` is true, abort the login and
 * surface `retryAfterMinutes` to the user.
 */
export async function checkRateLimit(
  email: string,
  ipAddress: string
): Promise<RateLimitResult> {
  const since = windowStart();

  const [emailCount, ipCount, oldestEmailAttempt, oldestIpAttempt] = await Promise.all([
    // Count recent failures for this specific email
    db.loginAttempt.count({
      where: { email, createdAt: { gte: since } },
    }),
    // Count recent failures from this IP (catches spray across multiple accounts)
    db.loginAttempt.count({
      where: { ipAddress, createdAt: { gte: since } },
    }),
    // Find the oldest record for email (used to calculate reset time)
    db.loginAttempt.findFirst({
      where: { email, createdAt: { gte: since } },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    }),
    // Find the oldest record for IP
    db.loginAttempt.findFirst({
      where: { ipAddress, createdAt: { gte: since } },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    }),
  ]);

  // ── Per-email lockout check ──────────────────────────────────────────────
  if (emailCount >= EMAIL_MAX_ATTEMPTS) {
    return {
      blocked: true,
      reason: "email",
      retryAfterMinutes: oldestEmailAttempt ? minutesUntilReset(oldestEmailAttempt.createdAt) : 15,
      attempts: emailCount,
    };
  }

  // ── Per-IP spray detection ───────────────────────────────────────────────
  if (ipCount >= IP_MAX_ATTEMPTS) {
    return {
      blocked: true,
      reason: "ip",
      retryAfterMinutes: oldestIpAttempt ? minutesUntilReset(oldestIpAttempt.createdAt) : 15,
      attempts: ipCount,
    };
  }

  return {
    blocked: false,
    attempts: emailCount,
    remaining: EMAIL_MAX_ATTEMPTS - emailCount, // Remaining attempts before lockout
  };
}

/**
 * Record a single failed login attempt.
 *
 * Call this ONLY when authentication actually fails (wrong password, user not found).
 * Do NOT call this for other errors (network failure, DB error, validation error).
 */
export async function recordFailedAttempt(
  email: string,
  ipAddress: string
): Promise<void> {
  await db.loginAttempt.create({
    data: { email, ipAddress },
  });
}

/**
 * Clear all recorded attempts for an email after a SUCCESSFUL login.
 *
 * This gives users a clean slate — they won't be penalized for old failures
 * once they prove they know the correct password.
 */
export async function clearLoginAttempts(email: string): Promise<void> {
  await db.loginAttempt.deleteMany({
    where: { email },
  });
}

/**
 * Clear all recorded attempts for an IP address.
 *
 * Useful for admin unlocking an IP address that was blocked due to spray attacks.
 */
export async function clearIpLoginAttempts(ipAddress: string): Promise<void> {
  await db.loginAttempt.deleteMany({
    where: { ipAddress },
  });
}

/**
 * Purge all expired attempt records from the table.
 *
 * Call this from the cron job (e.g., nightly cleanup) to keep the table lean.
 * The rate limiter functions above only query within the window, so expired
 * records don't affect correctness — this is purely a housekeeping operation.
 */
export async function purgeExpiredAttempts(): Promise<number> {
  const result = await db.loginAttempt.deleteMany({
    where: { createdAt: { lt: windowStart() } },
  });
  return result.count;
}
