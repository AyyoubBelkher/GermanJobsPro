import { NextRequest, NextResponse } from "next/server";

export interface RateLimitConfig {
  action: string;
  limit: number;
  windowMs: number;
  message?: string;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetInSeconds: number;
}

/**
 * Standard pre-configured rate limits for authentication endpoints
 */
export const AUTH_RATE_LIMITS = {
  LOGIN: {
    action: "auth:login",
    limit: 10,
    windowMs: 10 * 60 * 1000, // 10 minutes
    message: "تم تجاوز الحد المسموح من محاولات تسجيل الدخول. يرجى المحاولة بعد 10 دقائق / Too many login attempts. Please try again later.",
  },
  ADMIN_LOGIN: {
    action: "admin:login",
    limit: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: "تم تجاوز الحد المسموح لمحاولات دخول لوحة التحكم. يرجى المحاولة لاحقاً / Too many admin login attempts. Please try again later.",
  },
  SIGNUP: {
    action: "auth:signup",
    limit: 5,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: "تم تجاوز الحد الأقصى لإنشاء الحسابات. يرجى المحاولة لاحقاً / Too many signup attempts. Please try again later.",
  },
  RESEND_CODE: {
    action: "auth:resend-code",
    limit: 5,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: "تم تجاوز الحد المسموح لإعادة إرسال الرمز. يرجى المحاولة لاحقاً / Too many resend requests. Please try again later.",
  },
  FORGOT_PASSWORD: {
    action: "auth:forgot-password",
    limit: 5,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: "تم تجاوز الحد المسموح لطلبات استعادة كلمة المرور. يرجى المحاولة لاحقاً / Too many password reset requests. Please try again later.",
  },
  COMMENTS: {
    action: "content:comments",
    limit: 10,
    windowMs: 5 * 60 * 1000, // 5 minutes
    message: "تم تجاوز الحد المسموح لإضافة التعليقات. يرجى الانتظار قليلاً قبل إضافة تعليق جديد / Too many comment submissions. Please wait a few minutes.",
  },
  AI_API: {
    action: "ai:request",
    limit: 20,
    windowMs: 60 * 1000, // 1 minute (20 requests/min per IP)
    message: "تم تجاوز معدل الطلبات المسموح للذكاء الاصطناعي. يرجى الانتظار بضع ثوانٍ / Too many AI requests. Please slow down.",
  },
  SUPPORT: {
    action: "support:contact",
    limit: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes (max 5 tickets per IP per 15 min)
    message: "تم تجاوز الحد المسموح لإرسال رسائل الدعم الفني. يرجى المحاولة لاحقاً / Too many support requests. Please try again later.",
  },
  CONTACT: {
    action: "support:contact",
    limit: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: "تم تجاوز الحد المسموح لإرسال رسائل الدعم الفني. يرجى المحاولة لاحقاً / Too many support requests. Please try again later.",
  },
  NEWSLETTER: {
    action: "newsletter:subscribe",
    limit: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes (max 5 subscriptions per IP per 15 min)
    message: "تم تجاوز الحد المسموح للاشتراك في النشرة البريدية. يرجى المحاولة لاحقاً / Too many newsletter subscription attempts. Please try again later.",
  },
} as const;

/**
 * Extracts client IP from standard reverse proxy and direct connection headers.
 */
export function getClientIp(request: NextRequest | Request): string {
  const headers = request.headers;

  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0].trim();
    if (firstIp) return firstIp;
  }

  const realIp = headers.get("x-real-ip");
  if (realIp && realIp.trim()) {
    return realIp.trim();
  }

  const cfConnectingIp = headers.get("cf-connecting-ip");
  if (cfConnectingIp && cfConnectingIp.trim()) {
    return cfConnectingIp.trim();
  }

  if ("ip" in request && typeof request.ip === "string" && request.ip.trim()) {
    return request.ip.trim();
  }

  return "127.0.0.1";
}

/**
 * In-memory sliding window rate limiter.
 * Tracks timestamps for each (action:ip) key and enforces sliding window limits.
 */
export class SlidingWindowRateLimiter {
  private store: Map<string, number[]> = new Map();
  private lastCleanupTime = Date.now();
  private readonly cleanupIntervalMs = 5 * 60 * 1000; // 5 minutes

  /**
   * Evaluates if a request is within the sliding window limits.
   */
  public check(key: string, limit: number, windowMs: number): RateLimitResult {
    const now = Date.now();
    const windowStart = now - windowMs;

    this.lazyCleanup(now);

    const timestamps = this.store.get(key) || [];
    const validTimestamps = timestamps.filter((ts) => ts > windowStart);

    if (validTimestamps.length >= limit) {
      const oldestTimestamp = validTimestamps[0];
      const resetInSeconds = Math.max(1, Math.ceil((oldestTimestamp + windowMs - now) / 1000));

      this.store.set(key, validTimestamps);

      return {
        success: false,
        limit,
        remaining: 0,
        resetInSeconds,
      };
    }

    validTimestamps.push(now);
    this.store.set(key, validTimestamps);

    const resetInSeconds = Math.ceil(windowMs / 1000);

    return {
      success: true,
      limit,
      remaining: Math.max(0, limit - validTimestamps.length),
      resetInSeconds,
    };
  }

  /**
   * Resets rate limit for a specific key (useful for tests or manual unblocking).
   */
  public reset(key: string): void {
    this.store.delete(key);
  }

  /**
   * Cleans up expired entries periodically to prevent memory leaks.
   */
  private lazyCleanup(now: number): void {
    if (now - this.lastCleanupTime < this.cleanupIntervalMs && this.store.size < 10000) {
      return;
    }

    this.lastCleanupTime = now;
    const maxWindowStart = now - 24 * 60 * 60 * 1000;

    for (const [key, timestamps] of this.store.entries()) {
      const valid = timestamps.filter((ts) => ts > maxWindowStart);
      if (valid.length === 0) {
        this.store.delete(key);
      } else {
        this.store.set(key, valid);
      }
    }
  }
}

// Global instance (persisted across HMR in dev mode)
const globalForRateLimiter = globalThis as unknown as {
  rateLimiterInstance: SlidingWindowRateLimiter | undefined;
};

export const rateLimiter = globalForRateLimiter.rateLimiterInstance ?? new SlidingWindowRateLimiter();

if (process.env.NODE_ENV !== "production") {
  globalForRateLimiter.rateLimiterInstance = rateLimiter;
}

/**
 * Route handler helper: checks rate limit for the incoming NextRequest.
 * Returns a 429 NextResponse if rate limit is exceeded, or null if allowed.
 */
export function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig
): NextResponse | null {
  const ip = getClientIp(request);
  const key = `${config.action}:${ip}`;
  const result = rateLimiter.check(key, config.limit, config.windowMs);

  if (!result.success) {
    const defaultMsg = "تم تجاوز الحد المسموح من الطلبات. يرجى المحاولة لاحقاً / Too many requests. Please try again later.";
    const errorMessage = config.message || defaultMsg;

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        retryAfter: result.resetInSeconds,
      },
      {
        status: 429,
        headers: {
          "Retry-After": result.resetInSeconds.toString(),
          "X-RateLimit-Limit": result.limit.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": result.resetInSeconds.toString(),
        },
      }
    );
  }

  return null;
}
