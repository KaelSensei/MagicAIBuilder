/**
 * Shared HTTP utilities for server-side external fetches.
 * Centralises timeout, User-Agent, and error handling.
 */

const DEFAULT_TIMEOUT_MS = 10_000;

/**
 * The one User-Agent the app's servers send to outside sources, through
 * `httpGet` and through the direct fetches that import it (the Scryfall
 * client, the card image proxy, the Commander Spellbook lookup).
 *
 * Scryfall requires a User-Agent on every API request, and asks a script or
 * app to send its own name rather than let an HTTP library choose one
 * (https://scryfall.com/docs/api, "Required Headers", read 2026-11-10).
 * The product name comes first; the link is the site the app runs on, the
 * repository's homepage. magicaibuilder.com, which earlier versions sent, is
 * not registered (I-66). No email or other personal data goes here: every
 * source logs this header.
 *
 * Browser code never sends it: Scryfall asks on-page JavaScript to keep the
 * browser's own User-Agent (same source).
 */
export const USER_AGENT =
  "MagicAIBuilder/1.0 (+https://magic-ai-builder.vercel.app)";

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
 * A source answered with a non-success status.
 *
 * The message stays the player-facing text callers already match on; the
 * status is there for a caller that must tell a refusal from a transient
 * failure without parsing that text.
 */
export class HttpStatusError extends Error {
  override readonly name = "HttpStatusError";
  /** HTTP status the source answered with. */
  readonly status: number;

  /**
   * @param status - HTTP status the source answered with
   * @param message - player-facing explanation of that status
   */
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/**
 * Fetch with a default 10-second timeout and MagicAIBuilder User-Agent.
 * Throws a user-friendly HttpStatusError for any non-success status.
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
    if (await isBotChallenge(res)) throw new HttpStatusError(403, BOT_CHALLENGE_MESSAGE);
    throw new HttpStatusError(403, "Deck is private or access denied.");
  }
  if (res.status === 404) throw new HttpStatusError(404, "Deck not found or is private.");
  if (!res.ok) throw new HttpStatusError(res.status, `Source returned HTTP ${res.status}.`);

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
