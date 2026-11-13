/**
 * The data the meta panel shows for a commander: EDHREC's popular cards and
 * MTGTop8's recent tournament decks.
 *
 * Meta-insights context. `fetch.ts` produces these shapes from the two
 * providers, the meta route serves them (cached in `MetaCache`), `snapshots.ts`
 * stores the EDHREC half for `history.ts` to difference, and the panel reads
 * them through `useMetaAnalysis`. They live apart from the fetchers so the
 * MTGTop8 parser can type its output without importing the module that calls it.
 *
 * @module meta/types
 */

/**
 * One card EDHREC lists as popular for a commander, ranked by inclusion.
 *
 * The EDHREC fetcher keeps the top 20 by inclusion across all of the page's
 * card lists, which is why a card absent from a list is "below the cut-off",
 * not "at zero" (see `history.ts`).
 */
export interface MetaCard {
  /** Card name as EDHREC prints it; the panel's add button and in-deck check key on it. */
  readonly name: string;
  /** Fraction of eligible decks running the card, 0–1 (0.78 = 78%); 0 when EDHREC gave no usable number. */
  readonly inclusion: number;
  /**
   * The counts behind `inclusion`, when EDHREC gave both; the panel shows them
   * as "n of m decks". Absent when EDHREC gave only a ratio.
   */
  readonly sample?: {
    /** Decks that run the card. */
    readonly decksWithCard: number;
    /** Decks that could run it (same commander). Always above zero. */
    readonly eligibleDecks: number;
  };
  /** Declared for a card image, but no producer sets it today (see the MI series follow-ups). */
  readonly imageUri?: string;
}

/**
 * One recent tournament deck led by, or containing, the commander, as the
 * MTGTop8 search results list it. The panel links to it with its event context.
 */
export interface TournamentDeck {
  /** Deck name as the source prints it. */
  readonly name: string;
  /** Pilot, when the source lists one. */
  readonly player?: string;
  /** Event name, when the source lists one. */
  readonly event?: string;
  /** Event date as ISO `yyyy-mm-dd`; the panel only reads dates in that exact form. */
  readonly date?: string;
  /** Finishing position as the source prints it: "1", "8", "3-4". */
  readonly placement?: string;
  /** The source's format label; on MTGTop8 this is mostly "Duel Commander" (1v1), which the panel shows as a caveat. */
  readonly format?: string;
  /** Event size, 1 (local) to 4 (major), as MTGTop8 rates it; the panel renders it as stars. */
  readonly eventLevel?: number;
  /** Absolute link to the deck page on the source site. */
  readonly url: string;
  /** Which site the deck came from; only "mtgtop8" is produced today, "mtgdecks" is reserved. */
  readonly source: "mtgtop8" | "mtgdecks";
}

/** The EDHREC half of the meta data: the popular cards, top 20 by inclusion. */
export interface EdhrecData {
  readonly cards: readonly MetaCard[];
}

/** The MTGTop8 half of the meta data: at most 5 decks, in the order the search page lists them. */
export interface TournamentData {
  readonly decks: readonly TournamentDeck[];
}
