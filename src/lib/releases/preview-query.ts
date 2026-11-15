/**
 * The "Include previews" search: one rewrite of a Scryfall query that lets cards released after
 * today through its format filter (I-73 requirement 3.3).
 *
 * Release coordination, pure. Builder search and the set browser scope every query with
 * `legal:<format>` (`scryfall/search.ts`), and Scryfall marks a new card `not_legal` until a few
 * days before release, so a preview card never appears. Widening the filter to
 * `(legal:<format> or date>YYYY-MM-DD)` finds it. The date branch would also let in cards printed
 * only for digital play, which `legal:<format>` used to keep out, so `game:paper` is added. The
 * query stays the visible text the player can read and edit (I-14).
 *
 * Not responsible for: the switch itself, the preview wording (I-73 slice 2) or whether a card is
 * a preview (`release-status.ts`).
 *
 * @module releases/preview-query
 */
import { releaseDayOf } from "./release-day";

/** A positive format filter as the query builders write it; `-legal:` excludes and is kept. */
const FORMAT_FILTER = /(?<![\w-])legal:(\w+)/g;

/** A paper-only filter the query already holds, so it is not added twice. */
const PAPER_FILTER = /(?<![\w-])game:paper(?!\w)/;

/**
 * The query with every positive `legal:<format>` widened to
 * `(legal:<format> or date>YYYY-MM-DD)` for `today`, and `game:paper` appended when missing.
 *
 * Every other part keeps its text and position. A query with no positive format filter already
 * includes previews and comes back unchanged, so nothing is added to a query the player typed
 * without one.
 *
 * @param query - a Scryfall search query, as built or as the player typed it
 * @param today - now; read as its UTC calendar day (`releaseDayOf`)
 * @returns the query that also finds the cards released after today
 */
export function previewQuery(query: string, today: Date): string {
  const widened = query.replaceAll(
    FORMAT_FILTER,
    `(legal:$1 or date>${releaseDayOf(today)})`
  );
  if (widened === query) return query;
  return PAPER_FILTER.test(widened) ? widened : `${widened} game:paper`;
}
