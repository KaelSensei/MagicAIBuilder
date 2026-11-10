import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireDeckOwner } from "@/lib/auth/helpers";
import { logger } from "@/lib/logger";
import { checkDeckLegality } from "@/lib/deck/check-deck-legality";
import type { LegalityDeckCard } from "@/lib/deck/legality";

type Params = { params: Promise<{ id: string }> };

/** Answer the verdict, or 502 when Scryfall cannot supply the card data. */
async function verdictResponse(
  deckId: string,
  format: string,
  cards: readonly LegalityDeckCard[]
): Promise<NextResponse> {
  try {
    return NextResponse.json(await checkDeckLegality(format, cards));
  } catch (error) {
    logger.warn(
      error instanceof Error ? error.message : "unknown",
      "GET /api/decks/:id/legality",
      {
        deckId: deckId.slice(0, 50),
      }
    );
    return NextResponse.json(
      { error: "Card legality is unavailable: Scryfall could not be reached" },
      { status: 502 }
    );
  }
}

// GET /api/decks/[id]/legality — the deck's legality in its format, from Scryfall data the server fetches
export async function GET(_req: Request, { params }: Params) {
  const { id: deckId } = await params;
  try {
    const ownership = await requireDeckOwner(deckId);
    if (ownership.error) return ownership.error;

    const deck = await prisma.deck.findUnique({
      where: { id: deckId },
      select: {
        format: true,
        cards: {
          select: { scryfallId: true, name: true, quantity: true, zone: true },
        },
      },
    });
    if (!deck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    return await verdictResponse(deckId, deck.format, deck.cards);
  } catch (error) {
    logger.error(
      error instanceof Error ? error.message : "unknown",
      "GET /api/decks/:id/legality",
      {
        deckId: deckId.slice(0, 50),
      }
    );
    return NextResponse.json(
      { error: "Failed to check deck legality" },
      { status: 500 }
    );
  }
}
