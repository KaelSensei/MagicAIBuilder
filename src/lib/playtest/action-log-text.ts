/**
 * The text of one action-log line in the player's language: the engine records each line as a
 * message key and its parameters (`PlaytestLogMessage`), and this module turns it into the
 * sentence the `playtest.log.entries` catalog of the locale spells out (#1853).
 *
 * Context: playtest, between the engine and the UI. `useLogMessageText` hands it next-intl's
 * translator; the rows, the copy and both exports read the same text through it.
 * Not responsible for: the wording, which lives in `src/messages/<locale>/playtest.json`, or the
 * card names, which stay as the card data gives them.
 *
 * @module playtest/action-log-text
 */

import { cardListText } from "./card-list-text";
import type { PlaytestLogMessage } from "./engine";

/** The values a catalog message receives: numbers, names and identifiers. */
export type LogMessageValues = Readonly<Record<string, string | number>>;

/**
 * Renders one key of the `playtest.log.entries` catalog with its values; next-intl's `t` scoped
 * to that namespace fits.
 */
export type LogMessageTranslator = (
  key: string,
  values: LogMessageValues
) => string;

/** A parameter as the engine records it; a list of card names is joined for the catalog. */
type LogParamValue = string | number | readonly string[];

/**
 * The sentence one log line says.
 *
 * A note is the player's own text and is returned as typed; every other message goes through
 * `translate` with its parameters, a list of card names read as one phrase of `locale`
 * ("A and B", "A et B") by `cardListText`, as the trial-card picker lists them (#1854).
 *
 * @param message - the line as the engine recorded it
 * @param translate - renders a `playtest.log.entries` key in the player's locale
 * @param locale - the player's locale, the one `translate` renders in
 * @returns the line's text
 */
export function logMessageText(
  message: PlaytestLogMessage,
  translate: LogMessageTranslator,
  locale: string
): string {
  if (message.key === "note") return message.params.text;
  const params: Readonly<Record<string, LogParamValue>> =
    "params" in message ? message.params : {};
  return translate(message.key, toCatalogValues(params, locale));
}

/** The parameters as catalog values: a list of names becomes one phrase of `locale`. */
function toCatalogValues(
  params: Readonly<Record<string, LogParamValue>>,
  locale: string
): LogMessageValues {
  return Object.fromEntries(
    Object.entries(params).map(([name, value]) => [
      name,
      typeof value === "string" || typeof value === "number"
        ? value
        : cardListText(value, locale),
    ])
  );
}
