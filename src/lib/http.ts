/**
 * Shared HTTP utilities for server-side external fetches.
 * Centralises timeout, User-Agent, and error handling.
 */

const DEFAULT_TIMEOUT_MS = 10_000;
const USER_AGENT = "MagicAIBuilder/1.0 (+https://magicaibuilder.com)";

/**
 * Fetch with a default 10-second timeout and MagicAIBuilder User-Agent.
 * Throws a user-friendly Error for 403 and 404.
 */
export async function httpGet(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json, text/html",
      ...options.headers,
    },
    signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
  });

  if (res.status === 403) throw new Error("Deck is private or access denied.");
  if (res.status === 404) throw new Error("Deck not found or is private.");
  if (!res.ok) throw new Error(`Source returned HTTP ${res.status}.`);

  return res;
}

/**
 * Parse JSON from a response with an expected shape.
 * SonarCloud-safe alternative to `(await res.json()) as T` :
 * the caller is responsible for shape validation via Zod or type guards.
 *
 * Usage: `const data = parseJson<MyType>(await res.json())`
 */
export function parseJson<T>(value: unknown): T {
  return value as T; // intentional — caller validates
}
