import { NextResponse } from "next/server";

const ALLOWED_HOST = "cards.scryfall.io";
const MAX_PARAM_LEN = 700;
const UPSTREAM_TIMEOUT_MS = 15_000;
/** Scryfall's largest PNG is ~1.5 MB; 5 MB leaves room without buffering anything absurd. */
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

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
        "User-Agent": "MagicAIBuilder/1.0 (image proxy for print export)",
      },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      redirect: "follow",
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
