/**
 * The card catalog's search vocabulary: the filters a player sets in the advanced search and the
 * modes each filter can take.
 *
 * Context: Card catalog. The query builders in `search.ts` turn these values into Scryfall
 * query-language fragments; `components/search/SearchFilters.tsx` edits them and the builder
 * page holds them. They used to live in `lib/deck/types.ts`, which made the catalog import the
 * deck-building context; `lib/deck/types.ts` keeps a deprecated re-export until the card-catalog
 * series closes (master plan CC-14).
 */

/**
 * How the selected colours constrain a card (see `buildColorQuery`):
 * - `or`: within those colours, by colour identity (`id<=`);
 * - `and`: has every selected colour, and maybe more (`c>=`);
 * - `exact`: has exactly the selected colours (`c=`).
 */
export type ColorMode = "or" | "and" | "exact";

/**
 * Which mana value bounds apply: both `cmcMin` and `cmcMax` (`range`), only `cmcExact`
 * (`exact`), only `cmcMin` (`min`) or only `cmcMax` (`max`).
 */
export type CmcMode = "range" | "exact" | "min" | "max";

/** A kind of interaction the search can look for in Oracle text (see `buildInteractionQuery`). */
export type InteractionType =
  "removal" | "counterspell" | "wipe" | "tutor" | "draw" | "ramp";

/**
 * Every filter of the advanced card search. A `null` bound or an empty string or list means
 * "no filter"; the query builders skip it.
 */
export interface SearchFilters {
  colors: string[];
  colorMode?: ColorMode;
  colorlessFilter?: boolean;
  landFilter?: boolean;
  types: string[];
  cmcMin: number | null;
  cmcMax: number | null;
  cmcMode?: CmcMode;
  cmcExact: number | null;
  priceMin: number | null;
  priceMax: number | null;
  powerMin: number | null;
  powerMax: number | null;
  toughnessMin: number | null;
  toughnessMax: number | null;
  subtype: string;
  keyword: string;
  interactionType: InteractionType | null;
  /**
   * List only cards whose Oracle card the player owns, in any printing. Applied in the browser
   * by `useCardSearchResults`; it adds nothing to the Scryfall query.
   */
  collectionOnly?: boolean;
}
