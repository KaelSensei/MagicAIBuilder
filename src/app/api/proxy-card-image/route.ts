/**
 * GET /api/proxy-card-image: same-origin copies of Scryfall card images for
 * the printable proxy sheet.
 *
 * Card catalog context. `ProxyExportModal` calls it once per image, because a
 * browser `fetch()` to cards.scryfall.io is blocked by CORS. Public: no
 * session needed, so each client IP has a request budget (`RATE_LIMIT`). The
 * route fetches only https URLs on cards.scryfall.io and never follows a
 * redirect, so it cannot be turned into a fetcher of other hosts (SSRF). It
 * answers images only, at most 5 MB each.
 *
 * @module api/proxy-card-image
 */

import { NextResponse } from "next/server";
import { USER_AGENT } from "@/lib/http";
import { logger } from "@/lib/logger";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { rateLimitResponse } from "@/lib/api/route-kit";

const ALLOWED_HOST = "cards.scryfall.io";
const MAX_PARAM_LEN = 700;
const UPSTREAM_TIMEOUT_MS = 15_000;
/** Scryfall's largest PNG is ~1.5 MB; 5 MB leaves room without buffering anything absurd. */
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/**
 * Requests one client may make per window, the app's own budget: Scryfall
 * sets none on `*.scryfall.io` (https://scryfall.com/docs/api/rate-limits,
 * read 2026-11-11).
 *
 * `ProxyExportModal` asks at once for the front image of every distinct
 * main-deck card, at most 100 for a Commander deck (`buildProxySlots`). 300 a
 * minute covers a full sheet, a retry and a second deck, and stops one client
 * from pulling the image CDN through this server in bulk.
 */
const RATE_LIMIT = 300;
const RATE_WINDOW_MS = 60_000;

/**
 * True when `raw` is an https URL on the Scryfall card image CDN only (SSRF-safe).
 *
 * @param raw Full image URL from deck state (expected `https://cards.scryfall.io/...`)
 */
function isAllowedScryfallImageUrl(raw: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:") return false;
  if (parsed.hostname !== ALLOWED_HOST) return false;
  if (parsed.username !== "" || parsed.password !== "") return false;
  if (parsed.pathname.length < 2) return false;
  return true;
}

/**
 * GET /api/proxy-card-image?url=<encoded https://cards.scryfall.io/...>
 *
 * Proxies Scryfall card art server-side so the client can `fetch()` same-origin
 * and build data URLs for print/PDF (browser `fetch` to the CDN is blocked by CORS).
 */
export async function GET(request: Request) {
  const startedAt = performance.now();
  let status = 500;
  try {
    const response = await proxyCardImage(request);
    status = response.status;
    return response;
  } finally {
    logger.info("Card image proxy request completed", "GET /api/proxy-card-image", {
      status,
      durationMs: Math.round(performance.now() - startedAt),
    });
  }
}

/**
 * Validates the requested Scryfall image URL and streams the upstream image back.
 *
 * Answers 429 with `Retry-After` (seconds) once the client's budget is spent,
 * before any other check, so a throttled request never reaches Scryfall.
 *
 * @param request Incoming proxy request carrying the `url` query parameter.
 * @returns The image response, or a JSON error with the matching status.
 */
async function proxyCardImage(request: Request): Promise<NextResponse> {
  const rl = checkRateLimit(
    `proxy-card-image:${getClientIp(request)}`,
    RATE_LIMIT,
    RATE_WINDOW_MS
  );
  if (!rl.allowed) {
    return rateLimitResponse(rl, "Too many requests");
  }

  const urlParam = new URL(request.url).searchParams.get("url");
  if (!urlParam || urlParam.length > MAX_PARAM_LEN) {
    return NextResponse.json({ error: "Invalid or missing url" }, { status: 400 });
  }

  if (!isAllowedScryfallImageUrl(urlParam)) {
    return NextResponse.json({ error: "URL not allowed" }, { status: 403 });
  }

  try {
    const upstream = await fetch(urlParam, {
      headers: {
        Accept: "image/*",
        "User-Agent": USER_AGENT,
      },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      // The allowlist checked only this URL: following a redirect would let any
      // host be fetched. OWASP: "Disable the support for the following of the
      // redirection" (https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html,
      // read 2026-11-10). cards.scryfall.io serves every image size without a
      // redirect (checked 2026-11-10), and Node returns a 3xx as `ok === false`,
      // so the check below answers 502.
      redirect: "manual",
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream HTTP ${upstream.status}` },
        { status: 502 }
      );
    }

    const contentType = upstream.headers.get("content-type") ?? "image/jpeg";
    if (!contentType.startsWith("image/")) {
      return NextResponse.json({ error: "Response is not an image" }, { status: 502 });
    }

    // Bound the bytes before buffering: the declared length catches the honest
    // case, the post-read check catches a missing or lying header.
    const declared = Number(upstream.headers.get("content-length") ?? "0");
    if (declared > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "Image too large" }, { status: 502 });
    }
    const buffer = await upstream.arrayBuffer();
    if (buffer.byteLength > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "Image too large" }, { status: 502 });
    }
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "Upstream fetch failed" }, { status: 502 });
  }
}
