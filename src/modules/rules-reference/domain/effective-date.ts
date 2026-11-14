/**
 * Effective date of the Comprehensive Rules, as the official text file prints it.
 *
 * The file states it in English on its third line, for example
 * "These rules are effective as of August 7, 2026." (MagicCompRules-20260807.txt).
 * The page shows it in the reader's locale, so it is parsed once into a date
 * here and formatted by the view.
 */

/** Month names in the order the rules file can use them; index = JS month. */
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const MONTH_INDEX: ReadonlyMap<string, number> = new Map(
  MONTH_NAMES.map((name, index) => [name, index])
);

/**
 * ISO date of the Comprehensive Rules edition this repository ships.
 *
 * The file is `MagicCompRules-20260807.txt`. `loadComprehensiveRules` parses
 * the same day out of that file. The data-as-of line shows this constant so
 * a client does not read the file and does not fetch.
 */
export const BUNDLED_RULES_EFFECTIVE_ON = "2026-08-07";

/** "August 7, 2026": a capitalised English month, the day, a comma, the year. */
const RULES_DATE_RE = /^([A-Z][a-z]+) (\d{1,2}), (\d{4})$/;

/**
 * Parses the effective date printed in the Comprehensive Rules file.
 *
 * The result is midnight UTC on that day. Format it with `timeZone: "UTC"`
 * so the server's own time zone cannot move it to the previous day.
 *
 * @param text - The date as written in the file, e.g. "August 7, 2026".
 * @returns The calendar date, or null when the text is not a real date in that form.
 */
export function parseRulesEffectiveDate(text: string): Date | null {
  const match = RULES_DATE_RE.exec(text);
  if (!match) return null;

  const [, monthName, dayText, yearText] = match;
  const month = MONTH_INDEX.get(monthName);
  if (month === undefined) return null;

  const day = Number(dayText);
  const date = new Date(Date.UTC(Number(yearText), month, day));
  // Date.UTC rolls an impossible day over ("February 30" → March 2); reject it.
  return date.getUTCMonth() === month && date.getUTCDate() === day
    ? date
    : null;
}
