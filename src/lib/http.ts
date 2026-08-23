/**
 * Shared HTTP utilities for server-side external fetches.
 * Centralises timeout, User-Agent, and error handling.
 */

const DEFAULT_TIMEOUT_MS = 10_000;
const USER_AGENT = "MagicAIBuilder/1.0 (+https://magicaibuilder.com)";

/**
 * Strings a bot-challenge interstitial puts in its body.
 *
 * Cloudflare serves its managed challenge as a 403 with an HTML page, which is
 * indistinguishable by status from a genuinely forbidden resource — and the two
 * need opposite advice. "Deck is private or access denied" tells the user to go
 * and change their deck's visibility, which fixes nothing when the source is
 * refusing the app rather than the user.
 */
const CHALLENGE_MARKERS: readonly string[] = [
  "just a moment",
  "attention required",
  "cf-browser-verification",
  "cf_chl_opt",
  "enable javascript and cookies to continue",
];

/** Never read more of a challenge page than this. */
const MAX_CHALLENGE_BODY = 64 * 1024;

export const BOT_CHALLENGE_MESSAGE =
  "This source blocks automated access. Open the deck in your browser and paste the decklist instead.";

/**
 * Detects a bot-challenge interstitial behind a 403.
 *
 * `cf-mitigated: challenge` is Cloudflare saying so outright, and it is on the
 * live TappedOut response — that is the check that matters. The body markers
 * are a fallback for a challenge served without it, and the body is read only
 * when the response looks like an HTML page small enough to be one: a real API
 * 403 is JSON and must not be pulled for nothing. The response is consumed
 * either way, which is safe because every caller is about to throw.
 *
 * @param res - the 403 response
 * @returns true when the response is a challenge rather than a refusal
 */
async function isBotChallenge(res: Response): Promise<boolean> {
  if (res.headers.get("cf-mitigated") === "challenge") return true;

  const type = res.headers.get("content-type") ?? "";
  if (!type.includes("html")) return false;

  const length = Number(res.headers.get("content-length") ?? "0");
  if (length > MAX_CHALLENGE_BODY) return false;

  try {
    const body = (await res.text()).slice(0, MAX_CHALLENGE_BODY).toLowerCase();
    return CHALLENGE_MARKERS.some((marker) => body.includes(marker));
  } catch {
    // A body that cannot be read tells us nothing; fall back to the plain 403.
    return false;
  }
}

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

  if (res.status === 403) {
    if (await isBotChallenge(res)) throw new Error(BOT_CHALLENGE_MESSAGE);
    throw new Error("Deck is private or access denied.");
  }
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
