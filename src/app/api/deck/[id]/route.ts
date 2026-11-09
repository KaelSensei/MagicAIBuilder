import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/config";
import { logger } from "@/lib/logger";
import type { PublicDeck } from "@/lib/deck/public-deck";
import {
  PUBLIC_DECK_AUTHOR_SELECT,
  PUBLIC_DECK_SELECT,
} from "@/lib/deck/public-deck-select";

type Params = { params: Promise<{ id: string }> };

/** The viewer's own deck, whole except for its share token. */
function findOwnedDeck(id: string, ownerId: string) {
  return prisma.deck.findUnique({
    where: { id, userId: ownerId },
    omit: { shareToken: true },
    include: { cards: true, user: { select: PUBLIC_DECK_AUTHOR_SELECT } },
  });
}

/** A public deck, read through the public allowlist only. */
function findPublicDeck(id: string) {
  return prisma.deck.findUnique({
    where: { id, isPublic: true },
    select: PUBLIC_DECK_SELECT,
  });
}

/**
 * GET /api/deck/[id] — public deck view, no auth required for a public deck.
 *
 * The owner gets their whole deck, public or private. Anyone else gets a
 * public deck read through {@link PUBLIC_DECK_SELECT}, and a private deck 404s.
 */
export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;

  if (!id || id.length > 50) {
    return NextResponse.json({ error: "Invalid deck id" }, { status: 400 });
  }

  try {
    const session = await auth();
    const viewerId = session?.user?.id ?? null;

    // A signed-out viewer owns nothing, so never match a deck whose userId is null.
    const ownedDeck =
      viewerId === null ? null : await findOwnedDeck(id, viewerId);
    if (ownedDeck) {
      return NextResponse.json({ ...ownedDeck, isOwner: true });
    }

    const publicDeck = await findPublicDeck(id);
    if (!publicDeck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    const body: PublicDeck = { ...publicDeck, isOwner: false };
    return NextResponse.json(body);
  } catch (error) {
    logger.error(
      error instanceof Error ? error.message : "unknown",
      "GET /api/deck/:id",
      { id: String(id).slice(0, 50) }
    );
    return NextResponse.json({ error: "Failed to fetch deck" }, { status: 500 });
  }
}
