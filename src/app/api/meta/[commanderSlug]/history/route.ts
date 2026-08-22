/**
 * `GET /api/meta/:commanderSlug/history` — what moved in a commander's EDHRec
 * distribution over the requested window.
 *
 * Reads only what `GET /api/meta/:commanderSlug` already retained, so it makes
 * no upstream request and cannot fail on EDHRec being down. A commander with
 * fewer than two recorded days answers 200 with `report: null` and not 404: no
 * history yet is the normal state of a commander nobody has opened twice, and a
 * 404 would read as "no such commander".
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { computeMetaShifts } from "@/lib/meta/history";
import {
  DEFAULT_WINDOW_DAYS,
  MAX_WINDOW_DAYS,
  readSnapshotHistory,
} from "@/lib/meta/snapshots";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

const RATE_LIMIT = 30;
const RATE_WINDOW = 60_000;

const querySchema = z.object({
  days: z.coerce.number().int().min(1).max(MAX_WINDOW_DAYS).default(DEFAULT_WINDOW_DAYS),
});

type Params = { params: Promise<{ commanderSlug: string }> };

export async function GET(request: Request, { params }: Params) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`meta-history:${ip}`, RATE_LIMIT, RATE_WINDOW);
  if (!rl.allowed) {
    const retrySec = Math.ceil(rl.retryAfterMs / 1000);
    return NextResponse.json(
      { error: `Too many requests. Retry in ${retrySec}s.` },
      { status: 429, headers: { "Retry-After": String(retrySec) } }
    );
  }

  const { commanderSlug } = await params;
  if (!commanderSlug || !/^[a-z0-9-]{1,100}$/.test(commanderSlug)) {
    return NextResponse.json({ error: "Invalid commander slug" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query params" }, { status: 400 });
  }

  const { days } = parsed.data;

  try {
    const snapshots = await readSnapshotHistory(commanderSlug, days);
    const report = computeMetaShifts(snapshots, days);
    return NextResponse.json({
      report,
      // The count is what tells a caller apart from "never recorded" and
      // "recorded once today": both yield a null report for different reasons.
      snapshotCount: snapshots.length,
      windowDays: days,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Meta history read failed";
    logger.error(message, "GET /api/meta/:slug/history", { commanderSlug, days });
    return NextResponse.json({ error: "Meta history read failed" }, { status: 500 });
  }
}
