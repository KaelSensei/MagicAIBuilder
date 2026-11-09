import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger";
import { SHARED_DECK_SELECT } from "@/lib/deck/shared-deck-select";
import type { ApiSharedDeck } from "@/lib/deck/share-types";

type Params = { params: Promise<{ token: string }> };

/**
 * GET /api/share/[token] — read-only deck behind a share link, no auth required.
 *
 * The token opens the deck, public or private, while its owner keeps sharing
 * enabled; an unknown or revoked token 404s. The deck is read through
 * {@link SHARED_DECK_SELECT}, so the link holder receives what the share page
 * renders and nothing else: never the token, the owner or owner-only columns.
 */
export async function GET(_req: Request, { params }: Params) {
  const { token } = await params;

  // Basic token validation
  if (!token || token.length > 64 || !/^[a-zA-Z0-9_-]+$/.test(token)) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  try {
    const deck = await prisma.deck.findUnique({
      where: { shareToken: token, shareEnabled: true },
      select: SHARED_DECK_SELECT,
    });

    if (!deck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    const body: ApiSharedDeck = deck;
    return NextResponse.json(body);
  } catch (error) {
    logger.error(
      error instanceof Error ? error.message : "unknown",
      "GET /api/share/:token"
    );
    return NextResponse.json(
      { error: "Failed to fetch shared deck" },
      { status: 500 }
    );
  }
}
