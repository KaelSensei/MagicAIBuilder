/**
 * Public deck discovery for a commander.
 *
 * GET — every public deck led by the commander whose name slugifies to `slug`,
 * ordered by community vote score. No session required. The read is
 * `findCommanderDecks` in `@/lib/community/commander-decks-lookup`, shared
 * with the commander decks page; this module keeps the HTTP concerns: the
 * status codes and the error log.
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { findCommanderDecks } from "@/lib/community/commander-decks-lookup";
import { logger } from "@/lib/logger";

type Params = { params: Promise<{ slug: string }> };

// GET /api/community/commanders/[slug]/decks
export async function GET(_req: Request, { params }: Params) {
  const { slug } = await params;

  try {
    const session = await auth();
    const listing = await findCommanderDecks(slug, session?.user?.id ?? null);
    return NextResponse.json(listing);
  } catch (error) {
    logger.error(
      "Unexpected error",
      "GET /api/community/commanders/:slug/decks",
      error
    );
    return NextResponse.json(
      { error: "Failed to fetch decks" },
      { status: 500 }
    );
  }
}
