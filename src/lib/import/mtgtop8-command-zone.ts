/**
 * Tells whether an MTGTop8 export's `Sideboard` section is a Commander deck's command zone.
 *
 * MTGTop8's export follows MTGO's deck format, which has no commander section: a Commander deck
 * lists its commander, and its partner, after the `Sideboard` heading (recorded in
 * `fixtures/mtgtop8-mtgo-export-v1.ts`). The importer cannot tell that apart from a real
 * sideboard by the text alone, so this policy decides from the deck URL's format parameter when
 * it has one, and from the deck's shape otherwise. When the sideboard cannot be a command zone,
 * the policy says no and the cards stay in the sideboard: the importer does not guess.
 *
 * @module import/mtgtop8-command-zone
 */

/** What the policy reads of an exported card line. */
export interface ExportedCardCount {
  readonly quantity: number;
  readonly zone: "main" | "sideboard" | "maybeboard";
}

/**
 * MTGTop8's format codes (`f=` in a deck URL) for formats played with a commander.
 *
 * `EDH` is Duel Commander: the recorded deck 913975 is a Duel Commander list at
 * `event?e=94029&d=913975&f=EDH`. `cEDH` is the code of MTGTop8's cEDH archetype select
 * (`archetype_sel[cEDH]` in `meta-insights/infrastructure/fixtures/mtgtop8-search-form-v1.ts`,
 * recorded 2026-11-12). No recording shows a code for multiplayer Commander, so such a deck is
 * recognised by its shape.
 */
const COMMANDER_FORMAT_CODES: ReadonlySet<string> = new Set(["EDH", "cEDH"]);

/** CR 903.5a: a Commander deck holds exactly 100 cards, its commander included. */
const COMMANDER_DECK_SIZE = 100;

/** CR 702.124a: partner lets a deck have two commanders, never more. */
const MAX_COMMANDERS = 2;

/**
 * Reads the format code from an MTGTop8 deck URL.
 *
 * @param url - a detected MTGTop8 deck URL, with or without its scheme
 * @returns the `f=` value, or null when the URL has none or an empty one
 */
export function mtgTop8FormatCode(url: string): string | null {
  const candidate = /^https?:\/\//.test(url) ? url : `https://${url}`;
  const format = new URL(candidate).searchParams.get("f");
  return format === "" ? null : format;
}

/**
 * Whether the sideboard lines could be commanders together: one or two single cards.
 *
 * @param sideboard - the export's sideboard lines
 */
function couldBeCommanders(sideboard: readonly ExportedCardCount[]): boolean {
  return (
    sideboard.length > 0 &&
    sideboard.length <= MAX_COMMANDERS &&
    sideboard.every((card) => card.quantity === 1)
  );
}

/**
 * Whether an MTGTop8 export's sideboard is the deck's command zone.
 *
 * The rule: the sideboard holds one or two single cards, and either the URL's format code is a
 * commander format, or, when the URL has no format code, the main deck and the sideboard sum to
 * exactly 100 cards. A format code that is not a commander format always keeps the sideboard.
 *
 * @param cards - the export's card lines, main deck and sideboard
 * @param formatCode - the deck URL's `f=` value, or null when it has none
 * @returns true when the sideboard cards are the commander, then the partner
 */
export function isMtgTop8CommandZone(
  cards: readonly ExportedCardCount[],
  formatCode: string | null
): boolean {
  if (!couldBeCommanders(cards.filter((card) => card.zone === "sideboard")))
    return false;
  if (formatCode !== null) return COMMANDER_FORMAT_CODES.has(formatCode);
  return (
    cards.reduce((total, card) => total + card.quantity, 0) ===
    COMMANDER_DECK_SIZE
  );
}
