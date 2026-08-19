/**
 * Localised card text.
 *
 * A translated interface wrapped around English card text is only half a
 * product, so Scryfall printings are read in the viewer's language where one
 * exists. Scryfall models this by keeping `name` / `type_line` / `oracle_text`
 * as the **oracle** (English) values on every printing, and adding
 * `printed_name` / `printed_type_line` / `printed_text` carrying what is
 * actually printed on that physical card.
 *
 * Two properties of those fields drive the whole module:
 *
 * 1. **They are filled independently.** A printing can carry a printed name
 *    with no printed text. Falling back as a unit would blank a card's rules
 *    the moment one field was missing, so the fallback is per field.
 * 2. **They are not proof of translation.** Scryfall emits them on some English
 *    printings too, where they are simply the English text again. `isLocalized`
 *    therefore keys off `lang`, not off the presence of the fields.
 *
 * Card *names* stay searchable in English elsewhere in the app — this module
 * governs display only.
 *
 * @module scryfall/localized
 */

import type { ScryfallCard, ScryfallCardFace } from "./types";

/** Card text as it should be shown to the viewer. */
export interface LocalizedCardText {
  readonly name: string;
  readonly typeLine: string;
  /** Empty string rather than undefined, so callers can render it directly */
  readonly oracleText: string;
  /** True only when this is a genuine non-English printing */
  readonly isLocalized: boolean;
}

/**
 * App locale to the language code Scryfall prints under.
 *
 * Most codes are shared. The two that are not would silently return no
 * printings if passed through unchanged, which reads as "no translation
 * exists" rather than as the bug it is.
 */
const SCRYFALL_LANG_BY_LOCALE: ReadonlyMap<string, string> = new Map([
  ["en", "en"],
  ["fr", "fr"],
  ["de", "de"],
  ["it", "it"],
  ["es", "es"],
  ["ja", "ja"],
  ["ko", "ko"],
  ["ru", "ru"],
  ["pt", "pt"],
  // Scryfall prints Simplified Chinese as "zhs"; plain "zh" matches nothing.
  ["zh", "zhs"],
]);

/**
 * Maps an app locale to a Scryfall language code.
 *
 * @param locale - the app locale, e.g. `"fr"`
 * @returns the Scryfall code, falling back to `"en"` for anything unprinted
 */
export function toScryfallLang(locale: string): string {
  return SCRYFALL_LANG_BY_LOCALE.get(locale) ?? "en";
}

/**
 * Returns the first non-empty candidate.
 *
 * An empty string is treated as absent: a printing carrying `printed_text: ""`
 * should show the English rules, not nothing at all.
 *
 * @param candidates - values in order of preference
 * @returns the first usable value, or an empty string
 */
function firstFilled(...candidates: readonly (string | undefined)[]): string {
  return candidates.find((value) => value !== undefined && value !== "") ?? "";
}

/**
 * Resolves the text to display for a printing.
 *
 * Preference runs **every translated candidate before any English one**:
 * printed-face → printed-card → English face → English card. Ordering by level
 * instead (face before card) would show an English face name in place of a
 * translated card name, which is the wrong trade — a viewer reading French
 * would rather have the combined "A // B" French name than an English face.
 *
 * The face is preferred within each tier so a double-faced card shows its front
 * rather than the combined form when both exist.
 *
 * @param card - the printing, as returned by Scryfall
 * @returns the text to render, plus whether it is genuinely translated
 */
/**
 * Substitutes localised printings into an English card list.
 *
 * A `lang:`-filtered Scryfall search only returns cards that were actually
 * printed in that language, so it cannot be used as the list itself — cards
 * with no translated printing would silently vanish. The English list stays
 * the source of truth for membership, order and count; a localised printing
 * merely replaces the object rendered for a card it covers.
 *
 * Matching is by `name`, which Scryfall keeps as the oracle (English) name on
 * every printing regardless of language.
 *
 * @param english - the full English list, defining membership and order
 * @param localized - printings in the viewer's language, any subset, any order
 * @returns the English list with localised printings substituted in place
 */
export function mergeLocalizedPrintings(
  english: readonly ScryfallCard[],
  localized: readonly ScryfallCard[]
): ScryfallCard[] {
  const byName = new Map(localized.map((card) => [card.name, card]));
  return english.map((card) => byName.get(card.name) ?? card);
}

export function resolveLocalizedText(card: ScryfallCard): LocalizedCardText {
  const face: ScryfallCardFace | undefined = card.card_faces?.[0];

  return {
    name: firstFilled(face?.printed_name, card.printed_name, face?.name, card.name),
    typeLine: firstFilled(
      face?.printed_type_line,
      card.printed_type_line,
      face?.type_line,
      card.type_line
    ),
    oracleText: firstFilled(
      face?.printed_text,
      card.printed_text,
      face?.oracle_text,
      card.oracle_text
    ),
    // Keyed off the printing's language, not the printed_* fields: Scryfall
    // emits those on English printings too, where they are not a translation.
    isLocalized: card.lang !== undefined && card.lang !== "en",
  };
}
