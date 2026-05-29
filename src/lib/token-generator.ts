/**
 * Password Reset Token Generator
 *
 * Security Notes:
 * - Uses SHA-256 for token hashing (fast lookup, not bcrypt)
 * - Raw token sent via email (user-facing)
 * - Hashed token stored in database
 * - Tokens are single-use (marked as used after reset)
 */

import { createHash, randomBytes, timingSafeEqual } from "crypto";

// Token configuration
const TOKEN_BYTE_LENGTH = 32; // 32 bytes = 64 hex characters
const DEFAULT_EXPIRY_HOURS = 2; // 2 hours is enterprise-appropriate

/**
 * Generate a secure random token for password reset
 * @returns { token: string, hashedToken: string }
 */
export function generatePasswordResetToken(): {
  token: string;
  hashedToken: string;
} {
  // Generate 32 random bytes and convert to hex string
  const rawToken = randomBytes(TOKEN_BYTE_LENGTH).toString("hex");

  // Hash the token with SHA-256 for storage
  const hashedToken = hashToken(rawToken);

  return {
    token: rawToken,
    hashedToken,
  };
}

/**
 * Hash a token using SHA-256
 * @param token - The raw token to hash
 * @returns SHA-256 hash of the token
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Verify a token against a stored hash using constant-time comparison
 * @param rawToken - The token from URL
 * @param storedHash - The hash stored in database
 * @returns true if token matches
 */
export function verifyToken(rawToken: string, storedHash: string): boolean {
  // First, check length to prevent timing attacks on length
  if (!rawToken || rawToken.length !== TOKEN_BYTE_LENGTH * 2) {
    return false;
  }

  // Hash the provided token
  const hashedInput = hashToken(rawToken);

  // Use constant-time comparison to prevent timing attacks
  try {
    const storedBuffer = Buffer.from(storedHash, "hex");
    const inputBuffer = Buffer.from(hashedInput, "hex");

    // Ensure buffers are same length
    if (storedBuffer.length !== inputBuffer.length) {
      return false;
    }

    return timingSafeEqual(storedBuffer, inputBuffer);
  } catch {
    return false;
  }
}

/**
 * Calculate expiry date for a token
 * @param hours - Number of hours until expiry (default: 2)
 * @returns Date object for token expiry
 */
export function getTokenExpiry(hours: number = DEFAULT_EXPIRY_HOURS): Date {
  const expiryDate = new Date();
  expiryDate.setHours(expiryDate.getHours() + hours);
  return expiryDate;
}

/**
 * Check if a token has expired
 * @param expiresAt - The expiry date of the token
 * @returns true if token is expired
 */
export function isTokenExpired(expiresAt: Date): boolean {
  return new Date() > new Date(expiresAt);
}

/**
 * Get expiry hours from environment variable
 * Falls back to default if not set or invalid
 */
export function getConfiguredExpiryHours(): number {
  const envValue = process.env.PASSWORD_RESET_EXPIRY_HOURS;

  if (!envValue) {
    return DEFAULT_EXPIRY_HOURS;
  }

  const parsed = parseInt(envValue, 10);

  // Validate: must be between 1 and 24 hours
  if (isNaN(parsed) || parsed < 1 || parsed > 24) {
    console.warn(
      `Invalid PASSWORD_RESET_EXPIRY_HOURS value: "${envValue}". ` +
      `Using default: ${DEFAULT_EXPIRY_HOURS} hours.`
    );
    return DEFAULT_EXPIRY_HOURS;
  }

  return parsed;
}