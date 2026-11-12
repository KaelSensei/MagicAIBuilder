/**
 * How long a TanStack Query answer stays fresh before a refetch: one constant
 * per caching policy, shared by every hook that caches a provider's answer.
 *
 * Shared kernel. Three policies cover the app: reference lists that change
 * with set releases and banlist announcements (the Game Changers list, a
 * banlist, a card's printings, localized card text) stay fresh for a day; the
 * combos a deck can assemble stay fresh for an hour, since Commander Spellbook
 * asks for sparse use; a card search page stays fresh for five minutes, which
 * is also the QueryClient default. Hooks pass the same value as `gcTime` when
 * the cached answer should outlive the screen that filled it.
 *
 * @module lib/query/stale-times
 */

/** Five minutes, in milliseconds: a card search page and the QueryClient default. */
export const STALE_TIME_5MIN = 5 * 60 * 1000;

/** One hour, in milliseconds: the combos a deck can assemble. */
export const STALE_TIME_1H = 60 * 60 * 1000;

/** One day, in milliseconds: reference lists and localized card text. */
export const STALE_TIME_24H = 24 * 60 * 60 * 1000;
