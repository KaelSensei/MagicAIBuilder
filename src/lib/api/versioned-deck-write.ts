/**
 * The HTTP edge of a versioned deck write: reads the optimistic-lock
 * precondition of a card DELETE, and turns a `DeckWriteResult` into the
 * route's answer.
 *
 * The answers, shared by the card routes under `/api/decks/[id]/cards`:
 * - `saved`: the route's own success body, with the deck's new `version`;
 * - `stale`: 409 `{ error }`, the text the bulk edit already answers for a
 *   stale change set, so a client handles both the same way;
 * - `not-found`: 404 `{ error: "Deck not found" }`, as `requireDeckOwner`
 *   answers (the deck was deleted after the owner check).
 *
 * @module api/versioned-deck-write
 */
import { NextResponse } from "next/server";
import { z } from "zod";

import type {
  DeckWriteResult,
  SavedDeckWrite,
} from "@/lib/deck/deck-repository-port";
import { cardDeleteQuerySchema } from "@/lib/validation/card";

/** The `error` of a 409 for a deck write made from an outdated copy. */
export const STALE_DECK_ERROR =
  "The deck changed since it was opened — reload it and try again";

/** @returns 409 `{ error }`: the deck changed since the writer read it */
export function staleDeckResponse(): NextResponse {
  return NextResponse.json({ error: STALE_DECK_ERROR }, { status: 409 });
}

/**
 * Answers a versioned deck write.
 *
 * @param onSaved - Builds the success answer; it should carry
 *   `saved.version`, which the client sends back as `expectedVersion`. It may
 *   be async when the answer needs a read after the write, as the bulk edit's
 *   does; the route then returns the promise.
 */
export function deckWriteResponse<
  Value,
  Answer extends NextResponse | Promise<NextResponse>,
>(
  result: DeckWriteResult<Value>,
  onSaved: (saved: SavedDeckWrite<Value>) => Answer
): Answer | NextResponse {
  switch (result.kind) {
    case "saved":
      return onSaved(result);
    case "stale":
      return staleDeckResponse();
    case "not-found":
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    default: {
      const unhandled: never = result;
      return unhandled;
    }
  }
}

/** The parsed `?expectedVersion`, or the 400 to return unchanged. */
export type ExpectedVersionQuery =
  | { readonly ok: true; readonly expectedVersion: number | undefined }
  | { readonly ok: false; readonly response: NextResponse };

/**
 * Reads the optional `?expectedVersion=<n>` of a card DELETE.
 *
 * @returns `ok: false` with a 400 `{ error, details: flattenError }`, the
 *   shape the card routes use for a bad body, when the value is not a
 *   non-negative whole number.
 */
export function readExpectedVersionQuery(
  request: Request
): ExpectedVersionQuery {
  const query = Object.fromEntries(new URL(request.url).searchParams);
  const parsed = cardDeleteQuerySchema.safeParse(query);
  if (!parsed.success) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "Invalid request query",
          details: z.flattenError(parsed.error),
        },
        { status: 400 }
      ),
    };
  }
  return { ok: true, expectedVersion: parsed.data.expectedVersion };
}
