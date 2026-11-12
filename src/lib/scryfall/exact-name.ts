/**
 * Scryfall's exact-name search term, `!"name"`, written so that any card name
 * fits in it.
 *
 * Card catalog context: the query builders that look a card up by its full
 * name (`searchCardPrintings` in `client.ts`, the localised batch in
 * `localized.ts`) build the term here, so no name can end it early.
 *
 * Source: https://scryfall.com/docs/syntax, "Exact Names" (read 2026-11-10).
 * The syntax guide documents no escape for a quote inside a quoted phrase, so
 * the quoting rules below were checked against api.scryfall.com on 2026-11-11.
 *
 * @module scryfall/exact-name
 */

/**
 * The search term that matches one card name exactly, quoted so that spaces
 * and punctuation stay inside it.
 *
 * A backslash does not escape a quote: `!"Henzie \"Toolbox\" Torre"` finds
 * nothing. Scryfall also accepts single quotes, so a name that holds a double
 * quote is wrapped in single quotes instead: `!'Henzie "Toolbox" Torre'` finds
 * its printings. Fourteen names held a double quote on 2026-11-11 (search
 * `name:/"/ include:extras`), among them Henzie "Toolbox" Torre and Kongming,
 * "Sleeping Dragon"; apostrophes are far more common and keep the double quotes.
 *
 * @returns `null` for a name that holds both kinds of quote, which neither
 *   form can carry; no card name did on 2026-11-11
 *   (`name:/".*'|'.*"/ include:extras` matched nothing)
 */
export function exactNameTerm(name: string): string | null {
  if (!name.includes('"')) return `!"${name}"`;
  if (!name.includes("'")) return `!'${name}'`;
  return null;
}
