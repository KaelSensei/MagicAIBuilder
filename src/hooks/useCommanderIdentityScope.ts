/**
 * Whether the builder's name search stays inside the commander's colour
 * identity, and the player's one choice to widen it.
 *
 * Search context, builder page (I-01, AC-01-160 to AC-01-162). Once a commander
 * is set, the name search adds the deck's identity clause by default
 * (CR 903.5c: the deck cannot hold a card outside it). The player may widen the
 * search to every colour; that choice belongs to the open deck for this
 * session. It is not stored, and opening another deck scopes the search again.
 *
 * @module hooks/useCommanderIdentityScope
 */
import { useCallback, useMemo, useState } from "react";
import {
  deckIdentityScopeClause,
  type DeckIdentityScope,
} from "@/lib/search/deck-identity-scope";

/** What the chip above the results shows: nothing, the scoped search, or the widened one. */
export type CommanderIdentityChipState = "hidden" | "scoped" | "widened";

/** What `useCommanderIdentityScope` reads of the builder page. */
export interface CommanderIdentityScopeInput {
  /** The open deck's id; a widened search belongs to this deck only. */
  readonly deckId: string;
  readonly deck: DeckIdentityScope;
  /** False while a slot picker or another search mode runs its own query. */
  readonly nameSearchAllowed: boolean;
  /** True while a confirmed described query runs instead of the name search. */
  readonly describedQueryRuns: boolean;
}

/** The identity clause the name search adds now, and the chip that changes it. */
export interface CommanderIdentityScope {
  /** `id<=WB` and the like while scoped; "" when widened or when the deck has no identity. */
  readonly clause: string;
  readonly chip: CommanderIdentityChipState;
  /** Widens a scoped search, or scopes a widened one again. */
  readonly toggle: () => void;
}

/**
 * The name search's identity scope for the open deck.
 *
 * @param input - The open deck and the search panel's state
 * @returns The clause to add to the name search, the chip state and its toggle
 */
export function useCommanderIdentityScope(
  input: CommanderIdentityScopeInput
): CommanderIdentityScope {
  const { deckId, deck, nameSearchAllowed, describedQueryRuns } = input;
  const [widenedDeckId, setWidenedDeckId] = useState<string | null>(null);
  const deckClause = useMemo(() => deckIdentityScopeClause(deck), [deck]);
  const widened = widenedDeckId === deckId;
  const toggle = useCallback(() => {
    setWidenedDeckId(widened ? null : deckId);
  }, [deckId, widened]);
  return {
    clause: widened ? "" : deckClause,
    chip: chipState({
      hasScope: deckClause.length > 0,
      shown: nameSearchAllowed && !describedQueryRuns,
      widened,
    }),
    toggle,
  };
}

function chipState(input: {
  readonly hasScope: boolean;
  readonly shown: boolean;
  readonly widened: boolean;
}): CommanderIdentityChipState {
  if (!input.hasScope || !input.shown) return "hidden";
  return input.widened ? "widened" : "scoped";
}
