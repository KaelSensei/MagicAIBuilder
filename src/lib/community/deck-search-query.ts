/**
 * The deck search query: every filter, the sort and the cursor of a search over
 * public decks, read from and written back to one canonical URL.
 *
 * Community context, I-75 slice 0 (`docs/product/specs/i75-finding-public-decks.md`,
 * requirement 2). The browse page, the commander page as a preset, saved searches
 * and the search route all read this one contract, so one search has one URL and
 * one CDN cache key. Pure: no I/O, safe in the browser and on the server.
 * Not responsible for: resolving card names (requirement 3.1), running the search
 * or deciding which decks are listed (slices 1 and 2).
 *
 * @module community/deck-search-query
 */
import { isCommanderSlug } from "@/lib/community/commander-slug";
import { BRACKET_LEVELS, type BracketLevel } from "@/lib/constants/brackets";
import { FIVE_COLORS } from "@/lib/mana/colors";
import { isUsername } from "@/lib/social/public-profile";
import { compareCodeUnits } from "@/lib/text/code-unit-order";

/**
 * The limits of one search (I-75 requirement 2.3, after Archidekt's, read
 * 2026-11-10): card names per list. The page size, page count and displayed
 * total join this object with the search route (slice 2).
 */
export const DECK_SEARCH_LIMITS = {
  cardsPerList: 10,
} as const;

/**
 * How the results can be ordered (I-75 requirement 4). Recently updated comes
 * first: it is the neutral default (4.1), so the URL never writes it.
 */
export const DECK_SEARCH_SORTS = [
  "updated",
  "listed",
  "votes",
  "price-asc",
  "price-desc",
  "copied",
] as const;

/** How the results are ordered. */
export type DeckSearchSort = (typeof DECK_SEARCH_SORTS)[number];

const DEFAULT_SORT: DeckSearchSort = "updated";

/** One of the five colours (CR 105.1). */
export type DeckSearchColor = (typeof FIVE_COLORS)[number];

/**
 * How a deck's colour identity is compared with the colours searched for
 * (I-75 3): the same colours, a subset of them, or a superset of them.
 * Exactly is the default, so the URL never writes it.
 */
export const COLOR_MATCHES = ["exactly", "within", "including"] as const;

/** How a deck's colour identity is compared with the colours searched for. */
export type ColorMatch = (typeof COLOR_MATCHES)[number];

const DEFAULT_COLOR_MATCH: ColorMatch = "exactly";

/**
 * A colour identity filter. An empty `colors` list means colourless: a
 * colourless commander's deck has no colour in its identity (CR 903.4).
 */
export interface ColorIdentityFilter {
  readonly match: ColorMatch;
  /** In WUBRG order. */
  readonly colors: readonly DeckSearchColor[];
}

/** The update windows a search offers, in days (I-75 3). */
export const UPDATE_WINDOWS_DAYS = [30, 90, 180, 365] as const;

/** An update window, in days. */
export type UpdateWindowDays = (typeof UPDATE_WINDOWS_DAYS)[number];

/**
 * A deck price range in whole US dollars, either bound optional, `min` never
 * above `max`. The price is the sum of stored card prices, never the owner's
 * private budget (I-75 3, 3.2).
 */
export interface PriceRangeUsd {
  readonly min?: number;
  readonly max?: number;
}

/** Card names a deck must hold all of, any of, or none of (I-75 slice 5). */
export interface DeckSearchCardFilters {
  readonly all: readonly string[];
  readonly any: readonly string[];
  readonly none: readonly string[];
}

/** One search over public decks, as its canonical URL states it. */
export interface DeckSearchQuery {
  /** Text the deck name contains. */
  readonly nameContains?: string;
  /** A commander slug (`commanderToSlug`), as the commander page names it. */
  readonly commander?: string;
  /** The other commander of a pair; set only with `commander`, and after it in name order. */
  readonly partner?: string;
  readonly colorIdentity?: ColorIdentityFilter;
  /** The author's username. */
  readonly author?: string;
  /** Decks updated within this many days. */
  readonly updatedWithinDays?: UpdateWindowDays;
  /** Decks listed in search on or after this UTC day, as `YYYY-MM-DD`. */
  readonly listedSince?: string;
  readonly cards: DeckSearchCardFilters;
  readonly priceUsd?: PriceRangeUsd;
  /** The author's `targetBracket`, never the private `manualBracket` (I-75 3.3). */
  readonly declaredBrackets: readonly BracketLevel[];
  /** "100 cards, no banned card", on unless the player turns it off (I-75 3.4). */
  readonly qualityDefaults: boolean;
  readonly hasPrimer: boolean;
  readonly seekingFeedback: boolean;
  readonly originalsOnly: boolean;
  readonly excludeAiBuilt: boolean;
  readonly sort: DeckSearchSort;
  /**
   * Where the next page starts. Opaque here: the search route writes and reads
   * it (slice 2), so only its shape is checked.
   */
  readonly cursor?: string;
}

/**
 * Reads a deck search from a URL's query string.
 *
 * @param params - the query string as the page or the route received it, unchecked
 * @returns the search it states
 */
export function parseDeckSearchQuery(params: URLSearchParams): DeckSearchQuery {
  return {
    nameContains: readText(params.get("q") ?? ""),
    ...parseCommanders(params),
    colorIdentity: parseColorIdentity(params),
    author: readMatching(params.get("author"), isUsername),
    updatedWithinDays: UPDATE_WINDOWS_DAYS.find((days) => String(days) === params.get("updated")),
    listedSince: readMatching(params.get("listed-since"), isCalendarDay),
    cards: {
      all: parseCardNames(params.getAll("card")),
      any: parseCardNames(params.getAll("any-card")),
      none: parseCardNames(params.getAll("no-card")),
    },
    priceUsd: parsePriceRange(params),
    declaredBrackets: parseDeclaredBrackets(params.getAll("bracket")),
    qualityDefaults: params.get("quality") !== QUALITY_OFF,
    hasPrimer: isSwitchOn(params, "primer"),
    seekingFeedback: isSwitchOn(params, "feedback"),
    originalsOnly: isSwitchOn(params, "original"),
    excludeAiBuilt: isSwitchOn(params, "no-ai"),
    sort: parseSort(params.get("sort")),
    cursor: readMatching(params.get("cursor"), (value) => CURSOR_PATTERN.test(value)),
  };
}

/** A cursor is base64url text of at most 200 characters. */
const CURSOR_PATTERN = /^[A-Za-z0-9_-]{1,200}$/;

/**
 * The card names of one list, as typed: each trimmed with its inner spaces
 * collapsed, blanks dropped, once each, in code-unit order so the URL does
 * not depend on the runtime's locale. Names are resolved to cards later
 * (I-75 3.1), so the spelling is kept. Past the list limit, the names typed
 * last are dropped.
 */
function parseCardNames(values: readonly string[]): readonly string[] {
  const names = new Set<string>();
  for (const value of values) {
    if (names.size === DECK_SEARCH_LIMITS.cardsPerList) break;
    const name = readText(value);
    if (name !== undefined) names.add(name);
  }
  return [...names].sort(compareCodeUnits);
}

/**
 * The longest text a search field keeps: the deck name limit
 * (`src/lib/validation/deck.ts`). The longest printed card name has 141
 * characters, so a longer card name names nothing.
 */
const MAX_TEXT_LENGTH = 200;

/** Typed text, trimmed with its inner spaces collapsed; undefined when blank or too long. */
function readText(value: string): string | undefined {
  const text = value.trim().replaceAll(/\s+/g, " ");
  if (text.length === 0 || text.length > MAX_TEXT_LENGTH) return undefined;
  return text;
}

/**
 * The commander, or the commander pair, the URL names. A pair has no order in
 * the command zone, so it is kept in name order; a partner without a valid
 * commander, or equal to it, is dropped.
 */
function parseCommanders(
  params: URLSearchParams
): Pick<DeckSearchQuery, "commander" | "partner"> {
  const commander = readMatching(params.get("commander"), isCommanderSlug);
  if (commander === undefined) return {};
  const partner = readMatching(params.get("partner"), isCommanderSlug);
  if (partner === undefined || partner === commander) return { commander };
  const [first, second] = [commander, partner].sort(compareCodeUnits);
  return { commander: first, partner: second };
}

/** The URL's letter for a colourless identity: the colourless mana symbol (CR 107.4c). */
const COLORLESS_LETTER = "c";

const COLOR_LETTERS: ReadonlySet<string> = new Set(FIVE_COLORS);

/** The colour identity filter the URL names, with its match mode; a mode alone is dropped. */
function parseColorIdentity(params: URLSearchParams): ColorIdentityFilter | undefined {
  const colors = parseColors(params.get("colors"));
  if (colors === undefined) return undefined;
  const requested = params.get("match");
  const match = COLOR_MATCHES.find((mode) => mode === requested) ?? DEFAULT_COLOR_MATCH;
  return equivalentColorFilter(match, colors);
}

/**
 * The colours the URL names, in WUBRG order: colour letters in any order and
 * case, or `c` alone for colourless. Any other letter drops the filter.
 */
function parseColors(value: string | null): readonly DeckSearchColor[] | undefined {
  if (value === null || value.length === 0) return undefined;
  const letters = value.toUpperCase();
  if (letters === COLORLESS_LETTER.toUpperCase()) return [];
  if (![...letters].every((letter) => COLOR_LETTERS.has(letter))) return undefined;
  return FIVE_COLORS.filter((color) => letters.includes(color));
}

/**
 * The one way the URL states a colour search, so that two searches matching
 * the same decks share one URL. Every identity is within the five colours and
 * includes no colour, so those searches filter nothing. Only a colourless
 * identity is within no colour, and only a five-colour identity includes all
 * five, so those searches are exact.
 */
function equivalentColorFilter(
  match: ColorMatch,
  colors: readonly DeckSearchColor[]
): ColorIdentityFilter | undefined {
  const isColorless = colors.length === 0;
  const isAllColors = colors.length === FIVE_COLORS.length;
  switch (match) {
    case "exactly":
      return { match, colors };
    case "within":
      if (isAllColors) return undefined;
      return { match: isColorless ? "exactly" : match, colors };
    case "including":
      if (isColorless) return undefined;
      return { match: isAllColors ? "exactly" : match, colors };
  }
  const unknownMatch: never = match;
  return unknownMatch;
}

const CALENDAR_DAY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Whether the value is a `YYYY-MM-DD` day that exists in the calendar. */
function isCalendarDay(value: string): boolean {
  const parts = CALENDAR_DAY_PATTERN.exec(value);
  if (parts === null) return false;
  const [year, month, day] = parts.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

/** The value as given when the rule accepts it; undefined otherwise. */
function readMatching(
  value: string | null,
  accepts: (candidate: string) => boolean
): string | undefined {
  return value !== null && accepts(value) ? value : undefined;
}

/** Whole dollars, up to six digits: no sign, no decimals, no exponent. */
const WHOLE_DOLLARS_PATTERN = /^\d{1,6}$/;

/** The price range the URL names, its bounds swapped when given high first. */
function parsePriceRange(params: URLSearchParams): PriceRangeUsd | undefined {
  const min = readWholeDollars(params.get("price-min"));
  const max = readWholeDollars(params.get("price-max"));
  if (min === undefined && max === undefined) return undefined;
  if (min === undefined) return { max };
  if (max === undefined) return { min };
  return { min: Math.min(min, max), max: Math.max(min, max) };
}

function readWholeDollars(value: string | null): number | undefined {
  const dollars = readMatching(value, (candidate) => WHOLE_DOLLARS_PATTERN.test(candidate));
  return dollars === undefined ? undefined : Number(dollars);
}

/** The official brackets the URL names, once each, in ascending order. */
function parseDeclaredBrackets(values: readonly string[]): readonly BracketLevel[] {
  const named = new Set(values);
  return BRACKET_LEVELS.filter((level) => named.has(String(level)));
}

/** A switch filter is on only as `key=1`; any other value is dropped. */
const SWITCH_ON = "1";

/** The quality defaults are on; only `quality=off` turns them off (I-75 3.4). */
const QUALITY_OFF = "off";

function isSwitchOn(params: URLSearchParams, key: string): boolean {
  return params.get(key) === SWITCH_ON;
}

function parseSort(value: string | null): DeckSearchSort {
  return DECK_SEARCH_SORTS.find((sort) => sort === value) ?? DEFAULT_SORT;
}

/**
 * Writes a deck search as its canonical query string, without the leading `?`.
 *
 * @param query - a search, usually from `parseDeckSearchQuery`
 * @returns the query string; "" for the unfiltered browse page
 */
export function serializeDeckSearchQuery(query: DeckSearchQuery): string {
  const params = new URLSearchParams();
  appendDefined(params, "q", query.nameContains);
  appendDefined(params, "commander", query.commander);
  appendDefined(params, "partner", query.partner);
  if (query.colorIdentity !== undefined) {
    params.append("colors", colorLetters(query.colorIdentity.colors));
    if (query.colorIdentity.match !== DEFAULT_COLOR_MATCH) {
      params.append("match", query.colorIdentity.match);
    }
  }
  appendDefined(params, "author", query.author);
  appendDefined(params, "updated", query.updatedWithinDays?.toString());
  appendDefined(params, "listed-since", query.listedSince);
  appendAll(params, "card", query.cards.all);
  appendAll(params, "any-card", query.cards.any);
  appendAll(params, "no-card", query.cards.none);
  appendDefined(params, "price-min", query.priceUsd?.min?.toString());
  appendDefined(params, "price-max", query.priceUsd?.max?.toString());
  for (const level of query.declaredBrackets) params.append("bracket", String(level));
  if (!query.qualityDefaults) params.append("quality", QUALITY_OFF);
  appendSwitch(params, "primer", query.hasPrimer);
  appendSwitch(params, "feedback", query.seekingFeedback);
  appendSwitch(params, "original", query.originalsOnly);
  appendSwitch(params, "no-ai", query.excludeAiBuilt);
  if (query.sort !== DEFAULT_SORT) params.append("sort", query.sort);
  appendDefined(params, "cursor", query.cursor);
  return params.toString();
}

function colorLetters(colors: readonly DeckSearchColor[]): string {
  return colors.length === 0 ? COLORLESS_LETTER : colors.join("").toLowerCase();
}

function appendDefined(params: URLSearchParams, key: string, value: string | undefined): void {
  if (value !== undefined) params.append(key, value);
}

function appendAll(params: URLSearchParams, key: string, values: readonly string[]): void {
  for (const value of values) params.append(key, value);
}

function appendSwitch(params: URLSearchParams, key: string, on: boolean): void {
  if (on) params.append(key, SWITCH_ON);
}
