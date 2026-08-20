import { NextResponse } from "next/server";
import { z } from "zod";
import { importFromUrl } from "@/lib/import/url-import";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

const RATE_LIMIT = 10;        // max requests
const RATE_WINDOW = 60_000;   // per 60 seconds

const bodySchema = z.object({
  url: z.string().min(1).max(500),
});

// POST /api/import/url — proxy import from supported deck sources
// No auth required: importing is a public feature
export async function POST(request: Request) {
  // Rate limiting: 10 imports/min/IP
  const ip = getClientIp(request);
  const rl = checkRateLimit(`import:${ip}`, RATE_LIMIT, RATE_WINDOW);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Too many requests. Please wait ${Math.ceil(rl.retryAfterMs / 1000)}s before retrying.` },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) },
      }
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.issues.map((i) => i.message) },
      { status: 400 }
    );
  }

  try {
    const result = await importFromUrl(parsed.data.url);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Import failed.";
    const isUserError =
      message.includes("not found") ||
      message.includes("private") ||
      message.includes("access denied") ||
      message.includes("not recognised") ||
      message.includes("HTTP 4") ||
      message.includes("No cards") ||
      message.includes("empty");

    // Parser messages in the 422 class are written for the user ("deck is
    // private", "no cards found"). Anything else is an internal failure whose
    // text (upstream hostnames, timeouts, stack fragments) stays in the log.
    if (isUserError) {
      return NextResponse.json({ error: message }, { status: 422 });
    }
    logger.error(message, "POST /api/import/url");
    return NextResponse.json({ error: "Import failed." }, { status: 500 });
  }
}
