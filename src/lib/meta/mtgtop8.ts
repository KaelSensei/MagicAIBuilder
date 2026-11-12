/**
 * MTGTop8 tournament search — parsing only, no I/O.
 *
 * MTGTop8's EDH section is organised by **commander archetype**: every
 * commander has a numeric id listed in the search form's
 * `archetype_sel[EDH]` select. Searching by that id returns decks *led* by
 * the commander; the `cards=` field instead returns every deck that merely
 * *contains* the card, which for a popular commander is mostly other
 * people's 99. The id is therefore preferred, with `cards=` as the fallback
 * for a commander MTGTop8 has not given an archetype yet. The site ignores a
 * `cards=` name it does not know and answers with every EDH deck; the form it
 * echoes above the results says whether the filter was applied — see
 * `readCardFilterEcho`.
 *
 * Result rows carry the context the meta panel wants to show: player, event,
 * date, placement, and the event's size as one to four stars. MTGTop8's "EDH"
 * is overwhelmingly **Duel Commander** (1v1), so the format label is kept and
 * shown rather than assumed.
 *
 * The site serves ISO-8859-1, not UTF-8 — see `decodeLatin1`.
 *
 * @module meta/mtgtop8
 */

import { commanderToSlug } from "./commander-slug";
import type { TournamentDeck } from "./types";

export const MTGTOP8_SEARCH_URL = "https://www.mtgtop8.com/search";

/** Decodes a response body MTGTop8 serves as ISO-8859-1. */
export function decodeLatin1(buffer: ArrayBuffer): string {
  return new TextDecoder("iso-8859-1").decode(buffer);
}

/** Strips tags and collapses whitespace in a cell's inner HTML. */
function cellText(html: string): string {
  return html
    // `[^<>]*` rather than `[^>]+`: bounding the run on both delimiters keeps
    // the match linear on malformed markup instead of backtracking through it.
    .replaceAll(/<[^<>]*>/g, "")
    .replaceAll(/\s+/g, " ")
    .trim();
}

/**
 * "Æ" → "Ae", "œ" → "oe". Unicode NFD leaves these ligatures whole, so the slug
 * drops them, while Oracle text spells them out ("Aether Vial" on
 * https://api.scryfall.com/cards/named, read 2026-11-11). Spelling them out
 * before slugging lets a site option written with the ligature meet the slug
 * of the Oracle name.
 */
const LIGATURES: ReadonlyMap<string, string> = new Map([
  ["æ", "ae"],
  ["Æ", "Ae"],
  ["œ", "oe"],
  ["Œ", "Oe"],
]);

function spellOutLigatures(name: string): string {
  return name.replaceAll(
    /[æÆœŒ]/g,
    (ligature) => LIGATURES.get(ligature) ?? ligature
  );
}

/**
 * The key two spellings of one commander share: the words of the commander
 * slug. Folding through {@link commanderToSlug} keeps this rule and the slug's
 * one rule, so "Éomer, Marshal of Rohan" and the slug-derived "eomer marshal
 * of rohan" both key as "eomer marshal of rohan".
 */
function archetypeKey(name: string): string {
  return commanderToSlug(spellOutLigatures(name))
    .split("-")
    .filter(Boolean)
    .join(" ");
}

/**
 * Reads the commander → archetype id map from the search form.
 *
 * @param html - the GET /search page
 * @returns ids keyed by lower-cased commander name; empty when the EDH
 *   select is missing, which reads as "no archetype" downstream
 */
export function parseArchetypeOptions(html: string): ReadonlyMap<string, number> {
  const select = /name=archetype_sel\[EDH\]>([\s\S]*?)<\/select>/.exec(html);
  const options = new Map<string, number>();
  if (!select) return options;
  const optionRe = /<option value=(\d+)\s*>([^<]+)<\/option>/g;
  let match: RegExpExecArray | null;
  while ((match = optionRe.exec(select[1])) !== null) {
    options.set(match[2].trim().toLowerCase(), Number(match[1]));
  }
  return options;
}

/**
 * Finds a commander's archetype id, tolerating the accent and punctuation loss
 * of a slug round-trip ("eomer marshal of rohan" → Éomer, Marshal of Rohan).
 *
 * @param options - from {@link parseArchetypeOptions}
 * @param commanderName - display name or slug-derived words
 * @returns the id, or null when MTGTop8 lists no such commander
 */
export function findArchetypeId(
  options: ReadonlyMap<string, number>,
  commanderName: string
): number | null {
  const exact = options.get(commanderName.toLowerCase());
  if (exact !== undefined) return exact;
  const wanted = archetypeKey(commanderName);
  for (const [name, id] of options) {
    if (archetypeKey(name) === wanted) return id;
  }
  return null;
}

/**
 * Converts MTGTop8's `dd/mm/yy` into an ISO date.
 *
 * @returns `yyyy-mm-dd`, or undefined when the cell is not a date
 */
export function parseTop8Date(raw: string): string | undefined {
  const m = /^(\d{2})\/(\d{2})\/(\d{2})$/.exec(raw.trim());
  if (!m) return undefined;
  return `20${m[3]}-${m[2]}-${m[1]}`;
}

const ROW_RE = /<tr class=hover_tr>([\s\S]*?)<\/tr>/g;
const CELL_RE = /<td[^>]*>([\s\S]*?)<\/td>/g;
const DECK_LINK_RE = /href=(event\?e=\d+&d=\d+&f=EDH)>([^<]+)</;

/**
 * Parses the result rows of a POST /search response.
 *
 * Cells are positional: checkbox, deck, player, format, event, stars,
 * placement, date. A changed row or unrecognizable page is rejected rather
 * than mistaken for a valid empty feed.
 *
 * @param html - the search response body, already decoded
 * @returns decks in page order
 */
export function parseSearchResults(html: string): TournamentDeck[] {
  const decks: TournamentDeck[] = [];
  let row: RegExpExecArray | null;
  while ((row = ROW_RE.exec(html)) !== null) {
    const cells = [...row[1].matchAll(CELL_RE)].map((c) => c[1]);
    if (cells.length < 8) throw new Error("Invalid MTGTop8 response: result row malformed");
    const link = DECK_LINK_RE.exec(cells[1]);
    if (!link) throw new Error("Invalid MTGTop8 response: deck link malformed");
    decks.push({
      name: link[2].trim(),
      player: cellText(cells[2]) || undefined,
      format: cellText(cells[3]) || undefined,
      event: cellText(cells[4]) || undefined,
      eventLevel: (cells[5].match(/star\.png/g) ?? []).length || undefined,
      placement: cellText(cells[6]) || undefined,
      date: parseTop8Date(cellText(cells[7])),
      url: `https://www.mtgtop8.com/${link[1]}`,
      source: "mtgtop8",
    });
  }
  if (decks.length === 0 && !/<table\b[^>]*>\s*<\/table>/i.test(html)) {
    throw new Error("Invalid MTGTop8 response: no recognizable results");
  }
  return decks;
}

const CARD_FILTER_ECHO_RE = /<textarea name=cards\b[^>]*>([^<]*)<\/textarea>/;

/**
 * Reads the card filter MTGTop8 applied, as echoed in the search form it
 * prints above the results of POST /search.
 *
 * The site drops a `cards=` value it does not know: it prints "No match for
 * …", leaves the `cards` textarea empty and answers with the whole EDH section
 * ("44269 decks matching" on 2026-11-12). A card it knows is echoed back in the
 * textarea and the rows are the decks that contain it. On a card search the
 * echo is therefore what tells "no deck for this card" from "every deck". Both
 * pages are recorded in `fixtures/mtgtop8-card-search-v1.ts`.
 *
 * @param html - the search response body, already decoded
 * @returns the echoed filter as the site prints it, trimmed (the site appends a
 *   carriage return), or null when MTGTop8 applied no card filter
 * @throws when the page has no `cards` field: a changed form is rejected rather
 *   than read as an ignored filter, as {@link parseSearchResults} rejects
 *   changed rows
 */
export function readCardFilterEcho(html: string): string | null {
  const echo = CARD_FILTER_ECHO_RE.exec(html);
  if (!echo)
    throw new Error("Invalid MTGTop8 response: card filter echo missing");
  const cards = echo[1].trim();
  return cards === "" ? null : cards;
}

export interface SearchBodyInput {
  readonly archetypeId: number | null;
  readonly commanderName: string;
}

/**
 * Builds the form body for POST /search.
 *
 * @param input - the archetype id when known, else the name for a content search
 */
export function buildSearchBody({ archetypeId, commanderName }: SearchBodyInput): URLSearchParams {
  const body = new URLSearchParams({ format: "EDH", current_page: "" });
  if (archetypeId === null) body.set("cards", commanderName);
  else body.set("archetype_sel[EDH]", String(archetypeId));
  return body;
}
