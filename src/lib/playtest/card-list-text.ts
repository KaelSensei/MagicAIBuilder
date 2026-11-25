/**
 * A list of card names as one phrase in the reader's language: "A and B" and "A, B, and C" in
 * English, "A et B" and "A, B et C" in French (#1854).
 *
 * Context: playtest, shared by the UI and the action log. The trial-card picker's "chosen"
 * sentence and the log's card lists both read through it, so the same cards are listed the same
 * way everywhere. Not responsible for the card names themselves, which stay as the card data or
 * the localized printing gives them.
 *
 * @module playtest/card-list-text
 */

/**
 * The names joined as a conjunction, with the separators and the final "and" of `locale`.
 *
 * Uses `Intl.ListFormat`, so every served locale gets its own grammar without a catalog entry.
 * One name is returned as is; no names give an empty string.
 *
 * @param names - the card names, in the order they should be read
 * @param locale - a BCP 47 locale tag, such as next-intl's current locale
 * @returns the names as one phrase
 */
export function cardListText(
  names: readonly string[],
  locale: string
): string {
  return new Intl.ListFormat(locale, {
    style: "long",
    type: "conjunction",
  }).format(names);
}
