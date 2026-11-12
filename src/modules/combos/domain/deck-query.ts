/**
 * The card list one combo lookup is for: its bounds, its validation and its
 * canonical form.
 *
 * Domain of the combos context, shared by the route (validation), the use case
 * (canonical form) and the browser hook (query key). The canonical form is
 * what makes two spellings of one deck share a cache entry and a Spellbook
 * call. Pure data and functions only (ADR 0003); the Zod schema here is a
 * known gap, the target keeps parsing at the route (see the README).
 *
 * @module combos/domain/deck-query
 */
import { z } from "zod";

/** Commander plus partner or background; Spellbook itself accepts up to 12. */
export const MAX_COMMANDERS = 2;

/** Far above a 99-card Commander main deck, so an oversized list in progress still fits. */
export const MAX_MAIN_CARDS = 250;

/** The longest printed card name is 141 characters; Spellbook accepts 256. */
export const MAX_CARD_NAME_LENGTH = 200;

/**
 * Largest request body the route reads.
 *
 * It sits above the largest list the schema accepts (252 names of 200 characters,
 * at most 4 UTF-8 bytes each, is about 200 KB), so it never refuses a valid list
 * and only stops an absurd body before it is parsed.
 */
export const MAX_QUERY_BODY_BYTES = 256 * 1024;

/** The card names one combo lookup is for. */
export interface DeckComboQuery {
  /** Cards in the command zone; some combos need a card there. */
  readonly commanders: readonly string[];
  /** Cards in the main deck. */
  readonly main: readonly string[];
}

const cardNameSchema = z.string().trim().min(1).max(MAX_CARD_NAME_LENGTH);

/** Validates the body of `POST /api/combos`. */
export const deckComboQuerySchema = z.object({
  commanders: z.array(cardNameSchema).max(MAX_COMMANDERS),
  main: z.array(cardNameSchema).max(MAX_MAIN_CARDS),
}) satisfies z.ZodType<DeckComboQuery>;

/** Spellbook matches card names without regard to case, so lower case is a safe canonical form. */
function canonicalName(name: string): string {
  return name.normalize("NFC").trim().replaceAll(/\s+/g, " ").toLowerCase();
}

function canonicalSet(
  names: readonly string[],
  exclude: ReadonlySet<string>
): string[] {
  const unique = new Set<string>();
  for (const name of names) {
    const canonical = canonicalName(name);
    if (canonical.length > 0 && !exclude.has(canonical)) unique.add(canonical);
  }
  return [...unique].toSorted((a, b) => a.localeCompare(b, "en"));
}

/**
 * Puts a card list in canonical form: names trimmed, spacing collapsed, lower
 * case, deduplicated and sorted, with a commander never repeated in the main deck.
 * Two lists that differ only in order, case or spacing come out identical.
 *
 * @param query - the list as a client sent it
 * @returns the same cards in canonical form
 */
export function normalizeDeckComboQuery(query: DeckComboQuery): DeckComboQuery {
  const commanders = canonicalSet(query.commanders, new Set());
  return { commanders, main: canonicalSet(query.main, new Set(commanders)) };
}

/**
 * A stable string for a canonical card list, used as the cache and query key.
 *
 * @param query - a list already passed through `normalizeDeckComboQuery`
 * @returns the same string for every list with the same cards in the same roles
 */
export function deckComboQueryKey(query: DeckComboQuery): string {
  return JSON.stringify([query.commanders, query.main]);
}
