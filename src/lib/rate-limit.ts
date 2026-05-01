/**
 * Rate Limiting Implementation
 * Protects API endpoints from brute force attacks and DDoS
 * Uses in-memory LRU cache (suitable for single-instance deployments)
 * For multi-instance deployments, consider Redis-based rate limiting
 */

import { NextRequest, NextResponse } from "next/server";

interface RateLimitConfig {
  interval: number; // Time window in milliseconds
  uniqueTokenPerInterval: number; // Max requests per interval
}

interface RateLimitStore {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting
// For production with multiple instances, use Redis instead
const rateLimitStore = new Map<string, RateLimitStore>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Array.from(rateLimitStore.entries()).forEach(([key, value]) => {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  });
}, 5 * 60 * 1000);

/**
 * Get client identifier from request
 * Uses IP address or fallback to user-agent
 */
function getClientIdentifier(request: NextRequest): string {
  // Try to get real IP from headers (for proxies/load balancers)
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cfConnectingIp = request.headers.get("cf-connecting-ip"); // Cloudflare
  
  const ip = cfConnectingIp || realIp || forwardedFor?.split(",")[0] || "unknown";
  
  // For authenticated requests, also include user info if available
  // This prevents one user from exhausting the IP-based limit
  const userAgent = request.headers.get("user-agent") || "unknown";
  
  return `${ip}:${userAgent.substring(0, 50)}`;
}

/**
 * Rate limit middleware
 * Returns true if request should be allowed, false if rate limited
 */
export async function rateLimit(
  request: NextRequest,
  config: RateLimitConfig = {
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 10, // 10 requests per minute
  }
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  const identifier = getClientIdentifier(request);
  const now = Date.now();
  
  let store = rateLimitStore.get(identifier);
  
  if (!store || now > store.resetTime) {
    // Create new rate limit window
    store = {
      count: 0,
      resetTime: now + config.interval,
    };
    rateLimitStore.set(identifier, store);
  }
  
  store.count++;
  
  const success = store.count <= config.uniqueTokenPerInterval;
  const remaining = Math.max(0, config.uniqueTokenPerInterval - store.count);
  const reset = Math.ceil(store.resetTime / 1000); // Unix timestamp in seconds
  
  return {
    success,
    limit: config.uniqueTokenPerInterval,
    remaining,
    reset,
  };
}

/**
 * Rate limit response helper
 * Returns a 429 Too Many Requests response with rate limit headers
 */
export function rateLimitResponse(result: {
  limit: number;
  remaining: number;
  reset: number;
}): NextResponse {
  return NextResponse.json(
    {
      error: "Too Many Requests",
      message: "You have exceeded the rate limit. Please try again later.",
      retryAfter: result.reset,
    },
    {
      status: 429,
      headers: {
        "X-RateLimit-Limit": result.limit.toString(),
        "X-RateLimit-Remaining": result.remaining.toString(),
        "X-RateLimit-Reset": result.reset.toString(),
        "Retry-After": result.reset.toString(),
      },
    }
  );
}

/**
 * Preset rate limit configurations for different endpoint types
 */
export const RateLimitPresets = {
  // Strict rate limit for authentication endpoints (prevent brute force)
  AUTH: {
    interval: 15 * 60 * 1000, // 15 minutes
    uniqueTokenPerInterval: 5, // 5 attempts per 15 minutes
  },
  
  // Moderate rate limit for API endpoints
  API: {
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 30, // 30 requests per minute
  },
  
  // Lenient rate limit for public endpoints
  PUBLIC: {
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 60, // 60 requests per minute
  },
  
  // Very strict for sensitive operations (password reset, etc.)
  SENSITIVE: {
    interval: 60 * 60 * 1000, // 1 hour
    uniqueTokenPerInterval: 3, // 3 attempts per hour
  },
  
  // For file uploads
  UPLOAD: {
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 5, // 5 uploads per minute
  },
} as const;

/**
 * Middleware wrapper for easy rate limiting in API routes
 * 
 * Usage:
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   const rateLimitResult = await rateLimit(request, RateLimitPresets.AUTH);
 *   if (!rateLimitResult.success) {
 *     return rateLimitResponse(rateLimitResult);
 *   }
 *   
 *   // Your API logic here
 * }
 * ```
 */
export async function withRateLimit(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>,
  config?: RateLimitConfig
): Promise<NextResponse> {
  const result = await rateLimit(request, config);
  
  if (!result.success) {
    return rateLimitResponse(result);
  }
  
  const response = await handler(request);
  
  // Add rate limit headers to successful responses
  response.headers.set("X-RateLimit-Limit", result.limit.toString());
  response.headers.set("X-RateLimit-Remaining", result.remaining.toString());
  response.headers.set("X-RateLimit-Reset", result.reset.toString());
  
  return response;
}
