/**
 * `GET /api/decks/search?card=…&no-card=…`: the signed-in player's own decks
 * that run every `card` and no `no-card`, in the library's listing shape
 * (I-01, the library filter line of
 * `docs/product/specs/i01-deck-editor-workflow.md`).
 *
 * Deck-building context. Session only (`requireAuth`): the decks read are the
 * caller's, private ones included. The query string follows I-75's deck
 * search contract (`lib/community/deck-search-query.ts`): the same keys, the
 * same name length and the same `DECK_SEARCH_LIMITS.cardsPerList`; other
 * keys of that contract are ignored here. Answers at most 50 decks and says
 * whether more passed.
 *
 * @module api/decks/search
 */
import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/helpers";
import {
  jsonError,
  logRouteFailure,
  withRequestLog,
} from "@/lib/api/route-kit";
import { parseDeckSearchQuery } from "@/lib/community/deck-search-query";
import { cardFilterNames } from "@/lib/deck/deck-card-filter";
import { searchOwnedDecksByCard } from "@/lib/deck/deck-library-card-search";

const CONTEXT = "GET /api/decks/search";

/** GET /api/decks/search — the caller's decks that pass a card filter. */
export async function GET(request: NextRequest) {
  return withRequestLog(
    { message: "Deck card search completed", context: CONTEXT },
    () => answerSearch(request)
  );
}

async function answerSearch(request: NextRequest): Promise<NextResponse> {
  const result = await requireAuth();
  if (result.error) return result.error;

  const { cards } = parseDeckSearchQuery(request.nextUrl.searchParams);
  const filter = { all: cards.all, none: cards.none };
  if (cardFilterNames(filter).length === 0) {
    return jsonError(400, "Name at least one card");
  }

  try {
    const found = await searchOwnedDecksByCard({
      userId: result.session.user.id,
      filter,
    });
    return NextResponse.json(found, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    logRouteFailure(error, CONTEXT);
    return jsonError(500, "Failed to search decks");
  }
}
