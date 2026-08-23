/**
 * Simple in-memory rate limiter for server-side API routes.
 * Uses a sliding window per IP.
 *
 * Note: this is per-instance (not distributed). For a single-instance
 * deployment (Vercel, single Node process) it's sufficient.
 */

interface WindowEntry {
  count: number;
  windowStart: number;
  /**
   * The window this entry was opened with.
   *
   * Callers do not agree on a window: signup and login budget over 15 minutes,
   * every other endpoint over 60 seconds, and they all share this one store.
   * Pruning against the *calling* window therefore let a 60-second caller
   * evict a 15-minute entry — one import or meta request was enough to reset
   * someone else's login attempt counter, which is the opposite of what a
   * brute-force limit is for. Each entry now expires on its own terms.
   */
  windowMs: number;
}

const store = new Map<string, WindowEntry>();

/** Prune entries older than 2× their own window to prevent unbounded growth */
function prune(now: number): void {
  for (const [key, entry] of store) {
    if (now - entry.windowStart >= entry.windowMs * 2) store.delete(key);
  }
}

/**
 * Check whether the given key has exceeded the rate limit.
 * @returns `{ allowed: true }` or `{ allowed: false, retryAfterMs: number }`
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: true } | { allowed: false; retryAfterMs: number } {
  const now = Date.now();
  prune(now);

  const entry = store.get(key);

  if (!entry || now - entry.windowStart >= windowMs) {
    // New window
    store.set(key, { count: 1, windowStart: now, windowMs });
    return { allowed: true };
  }

  if (entry.count < limit) {
    entry.count++;
    return { allowed: true };
  }

  const retryAfterMs = windowMs - (now - entry.windowStart);
  return { allowed: false, retryAfterMs };
}

/**
 * Extract client IP from a Next.js Request.
 * Prefers x-real-ip (set by the trusted proxy, e.g. Vercel) over
 * x-forwarded-for, whose first entry is client-spoofable.
 */
export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}
