"use client";
/**
 * The builder's combo lookup: which combos the active deck holds, as one
 * TanStack Query per distinct card list.
 *
 * The browser side of the combos context. It decides when a deck is worth
 * looking up (the ten-card minimum) and which of its cards are sent (command
 * zone and main deck), then calls `fetchCombosForDeck`. The panel reads its
 * `data`, `isLoading`, `isError` and `dataUpdatedAt`; bracket scoring reads
 * `data`. Canonical form, caching and Spellbook limits are the server's job
 * (`application/lookup-deck-combos.ts`).
 *
 * @module combos/client/useCombos
 */
import { useQuery } from "@tanstack/react-query";
import { fetchCombosForDeck } from "@/modules/combos/client/api";
import {
  deckComboQueryKey,
  normalizeDeckComboQuery,
  type DeckComboQuery,
} from "@/modules/combos/domain/deck-query";
import type { Deck } from "@/lib/deck/types";
import { STALE_TIME_1H } from "@/lib/query/stale-times";

/**
 * Names a deck must hold before it is looked up: commander, partner and
 * main-deck rows together.
 *
 * Product choice, not a rule. A list of a few cards rarely holds a combo, and a
 * new deck changes on every click; each distinct list below the threshold
 * would otherwise cost one request and, on a cache miss, one Spellbook call.
 * Rows are counted, not copies: a row of twenty Islands counts once.
 *
 * The builder page gates the panel on its own count, `deck.cards.length`,
 * which includes every zone; the two disagree for a ten-row deck with cards in
 * the maybeboard (pinned in `useCombos.replay.test.tsx`; B2-43 keeps one
 * threshold, OD-07).
 */
const MIN_CARDS = 10;

/**
 * The list the lookup is for: the command zone's commander and partner, then
 * the main-deck rows. Sideboard and maybeboard rows stay out: a combo the
 * player is only considering is not one the deck holds.
 *
 * The companion is left out too. It begins the game outside it and can be put
 * into the hand once (CR 702.139a), so it can take part in a combo; OD-07
 * decided to include it, and B2-43 does. Until then this is pinned current
 * behaviour (`useCombos.replay.test.tsx`, "the companion").
 */
function toDeckComboQuery(deck: Deck | null): DeckComboQuery {
  if (!deck) return { commanders: [], main: [] };
  return {
    commanders: [deck.commander, deck.partner].flatMap((card) =>
      card ? [card.name] : []
    ),
    main: deck.cards
      .filter((card) => card.zone === "main")
      .map((card) => card.name),
  };
}

/**
 * The combos the active deck can assemble, from one lookup per distinct card
 * list.
 *
 * Disabled below `MIN_CARDS` names and for a null deck. The query key is the
 * canonical form of the list, so reordering or re-casing cards reuses the
 * cached answer, kept fresh for an hour in the browser. A failed lookup is an
 * error, not an empty list (`fetchCombosForDeck` rejects), and is not retried:
 * Spellbook asks for sparse use, and the deck's next change is a new key.
 *
 * @param deck - the active deck, or null while none is loaded
 */
export function useCombos(deck: Deck | null) {
  const query = toDeckComboQuery(deck);
  const enabled = query.commanders.length + query.main.length >= MIN_CARDS;

  return useQuery({
    queryKey: [
      "combos",
      "spellbook",
      deckComboQueryKey(normalizeDeckComboQuery(query)),
    ],
    queryFn: () => fetchCombosForDeck(query),
    enabled,
    staleTime: STALE_TIME_1H,
    retry: false,
  });
}
