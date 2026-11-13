"use client";
/**
 * The two Scryfall lists of the Game Changers and banlist page, and the one
 * the visitor is reading.
 *
 * Rules reference context, `client/`: browser state, no JSX. Both lists load
 * as soon as the page opens, so switching tab shows the other list at once;
 * the page reads the active one and shows each tab's count once its list is
 * known. The lists themselves come from the format-rules hooks
 * (`useGameChangers`, `useBanlist`), which this context does not own.
 *
 * @module rules-reference/client/useReferenceLists
 */
import { useMemo } from "react";
import { useLocalizedBanlistQuery } from "@/hooks/useBanlist";
import { useLocalizedGameChangersList } from "@/hooks/useGameChangers";
import type { ScryfallCard } from "@/lib/scryfall/types";

/** The two lists the page shows: WotC's Game Changers and the Commander banlist. */
export type ReferenceList = "game-changers" | "banlist";

/** The active list with its load state, and both lists' counts for the tabs. */
export interface ReferenceLists {
  /** The active list's cards; empty until it has loaded or when it failed. */
  readonly cards: readonly ScryfallCard[];
  /** Whether the active list is still loading. */
  readonly isLoading: boolean;
  /** Whether the active list failed to load. */
  readonly isError: boolean;
  /** The Game Changers count, or `undefined` until that list has loaded. */
  readonly gameChangersCount: number | undefined;
  /** The banlist count, or `undefined` until that list has loaded. */
  readonly banlistCount: number | undefined;
}

const NO_CARDS: readonly ScryfallCard[] = [];

/**
 * Loads both lists and exposes the `active` one.
 *
 * `cards` keeps its identity between renders while the active list does not
 * change, so a list hook downstream can depend on it without re-running.
 */
export function useReferenceLists(active: ReferenceList): ReferenceLists {
  const gameChangers = useLocalizedGameChangersList();
  const banlist = useLocalizedBanlistQuery();
  const query = active === "game-changers" ? gameChangers : banlist;
  const data = query.data;
  const cards = useMemo(() => data ?? NO_CARDS, [data]);

  return {
    cards,
    isLoading: query.isLoading,
    isError: query.isError,
    gameChangersCount: gameChangers.data?.length,
    banlistCount: banlist.data?.length,
  };
}
