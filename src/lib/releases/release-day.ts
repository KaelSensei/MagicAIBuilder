/**
 * The calendar day a release comparison uses: one convention for every release rule.
 *
 * Release coordination, pure. Scryfall writes a set's release date as a bare "YYYY-MM-DD" with no
 * time zone (https://scryfall.com/docs/api/cards, `released_at`, read 2026-11-15) and compares
 * `date>` against the same form. Reading "today" as its UTC day keeps the answer the same on the
 * server and in every browser, whatever the machine's time zone.
 *
 * @module releases/release-day
 */

/**
 * The UTC calendar day of an instant, as "YYYY-MM-DD", the form of Scryfall's `released_at`.
 * Two such strings compare by date with `<` and `>`.
 *
 * @param now - any valid date
 * @returns the day, for example "2026-11-15"
 */
export function releaseDayOf(now: Date): string {
  return now.toISOString().slice(0, 10);
}
