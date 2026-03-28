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
}

const store = new Map<string, WindowEntry>();

/** Prune entries older than 2× the window to prevent unbounded growth */
function prune(windowMs: number): void {
  const cutoff = Date.now() - windowMs * 2;
  for (const [key, entry] of store) {
    if (entry.windowStart < cutoff) store.delete(key);
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
  prune(windowMs);

  const entry = store.get(key);

  if (!entry || now - entry.windowStart >= windowMs) {
    // New window
    store.set(key, { count: 1, windowStart: now });
    return { allowed: true };
  }

  if (entry.count < limit) {
    entry.count++;
    return { allowed: true };
  }

  const retryAfterMs = windowMs - (now - entry.windowStart);
  return { allowed: false, retryAfterMs };
}

/** Extract client IP from a Next.js Request */
export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}
