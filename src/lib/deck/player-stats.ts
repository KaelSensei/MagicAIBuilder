/**
 * Player statistics: counts across one player's own decks over a window.
 *
 * Deck analysis, I-60 slice 1 (`docs/product/specs/i60-player-stats-and-year-in-review.md`).
 * Every figure carries the deck ids behind it, so the page can show its
 * denominator and link to the decks that make it up (requirements 1.2, 2.3).
 * Not responsible for: reading decks from the database or computing a
 * bracket (slice 2 builds the rows), dated prices (slice 3), games (slice 10).
 * No AI client is reachable from here (requirement 1.1).
 *
 * @module deck/player-stats
 */

import { BRACKET_LEVELS, type BracketLevel } from "@/lib/constants/brackets";
import { isBasicLand } from "@/lib/scryfall/type-line";
import { ALL_FORMATS, FORMAT_CONFIG, type DeckFormat } from "./formats";

/** The five colours of Magic in the order cards print them (WUBRG). */
const IDENTITY_COLORS = ["W", "U", "B", "R", "G"] as const;

/** How many of the cards used most the stats page lists (requirement 2.2). */
const CARDS_USED_MOST_LISTED = 10;

/** How many of the most shared cards the stats page lists (requirement 2.2). */
const MOST_SHARED_LISTED = 5;

/** Joins a partner pair's names into one key; no Oracle name contains it. */
const PAIR_KEY_SEPARATOR = "\n";

/** One of the five colours of Magic, as a colour identity prints it. */
export type IdentityColor = (typeof IDENTITY_COLORS)[number];

/** A main-deck card as the counting reads it: its Oracle name and its type line. */
export interface PlayerStatsCard {
  readonly name: string;
  readonly typeLine: string;
}

/** One existing deck of the player, as the counting reads it. */
export interface PlayerStatsDeck {
  readonly deckId: string;
  readonly format: DeckFormat;
  /** Oracle names of the commander and its partner, if any */
  readonly commanders: readonly string[];
  /** The deck's colour identity; empty for a colourless deck */
  readonly colorIdentity: readonly IdentityColor[];
  /** The bracket `scoreBracket` computed, or null where none applies */
  readonly computedBracket: BracketLevel | null;
  /** The bracket the player aims for, or null */
  readonly targetBracket: BracketLevel | null;
  /** Main-deck cards; a name may repeat */
  readonly mainCards: readonly PlayerStatsCard[];
  readonly createdAt: Date;
  /** The last save; it keeps only the latest change */
  readonly updatedAt: Date;
  /** When each snapshot of the deck was taken */
  readonly snapshotDates: readonly Date[];
}

/** The period counted: from `start` included to `end`, the cut-off, excluded. */
export interface StatsWindow {
  readonly start: Date;
  readonly end: Date;
}

/** A player's statistics over a window. */
export interface PlayerStats {
  /** The active decks (requirement 3.1): the denominator of the recap */
  readonly activeDeckIds: readonly string[];
  /** Decks created in the window; "added" until `Deck.origin` exists (requirement 3.4) */
  readonly addedDeckIds: readonly string[];
  /** Decks changed in the window, "at least" this many (requirement 3.5) */
  readonly changedDeckIds: readonly string[];
  /** Active decks per format with at least one, in the order formats are listed */
  readonly formats: readonly FormatCount[];
  /** Active decks in a Commander-family format: the denominator of every commander statistic (requirement 3.2) */
  readonly commanderDeckIds: readonly string[];
  /** For each colour, in WUBRG order, the Commander-family decks that include it */
  readonly colors: readonly ColorCount[];
  /** Commander-family decks per colour identity, the most decks first */
  readonly colorIdentities: readonly ColorIdentityCount[];
  /** Commander-family decks per commander or partner pair, the most decks first */
  readonly commanders: readonly CommanderCount[];
  /** The non-basic cards in the most Commander-family decks, ties broken by name */
  readonly cardsUsedMost: readonly CardCount[];
  /** The cards in two or more Commander-family decks */
  readonly sharedCards: SharedCards;
  /** For each bracket, lowest first, the Commander-family decks computed at it and aimed at it */
  readonly brackets: readonly BracketCount[];
}

/** The Commander-family decks at one bracket. */
export interface BracketCount {
  readonly bracket: BracketLevel;
  /** Decks `scoreBracket` placed at this bracket */
  readonly computedDeckIds: readonly string[];
  /** Decks whose player aims for this bracket */
  readonly targetDeckIds: readonly string[];
}

/** The cards found in two or more of the player's Commander-family decks. */
export interface SharedCards {
  /** How many distinct non-basic cards sit in two or more decks */
  readonly count: number;
  /** The five most shared, ties broken by name */
  readonly mostShared: readonly CardCount[];
}

/** The Commander-family decks led by one commander or one partner pair. */
export interface CommanderCount {
  /** Oracle names, sorted, so a pair is the same whichever slot each partner sits in */
  readonly names: readonly string[];
  readonly deckIds: readonly string[];
  /** True when no deck created before the window was led by it */
  readonly isNew: boolean;
}

/** The Commander-family decks that play one card. */
export interface CardCount {
  /** Oracle name */
  readonly name: string;
  readonly deckIds: readonly string[];
}

/** The Commander-family decks of one colour identity. */
export interface ColorIdentityCount {
  /** In WUBRG order; empty for colourless */
  readonly identity: readonly IdentityColor[];
  readonly deckIds: readonly string[];
}

/** The Commander-family decks whose colour identity includes one colour. */
export interface ColorCount {
  readonly color: IdentityColor;
  readonly deckIds: readonly string[];
}

/** The active decks of one format. */
export interface FormatCount {
  readonly format: DeckFormat;
  readonly deckIds: readonly string[];
}

/**
 * Counts a player's statistics over a window.
 *
 * @param decks - every deck the player has today; a deleted deck is simply absent (requirement 3.7)
 * @param window - the period counted
 * @returns the counts, each with the ids of the decks behind it
 */
export function countPlayerStats(
  decks: readonly PlayerStatsDeck[],
  window: StatsWindow
): PlayerStats {
  const addedDecks = decks.filter((deck) => isAddedIn(deck, window));
  const changedDecks = decks.filter((deck) => isChangedIn(deck, window));
  const activeDecks = decks.filter((deck) => isActiveIn(deck, window));
  const commanderDecks = decks.filter((deck) => countsDeckCards(deck, window));
  const cards = countCards(commanderDecks);
  const shared = cards.filter((card) => card.deckIds.length >= 2);
  return {
    activeDeckIds: idsOf(activeDecks),
    addedDeckIds: idsOf(addedDecks),
    changedDeckIds: idsOf(changedDecks),
    formats: countFormats(activeDecks),
    commanderDeckIds: idsOf(commanderDecks),
    colors: IDENTITY_COLORS.map((color) => ({
      color,
      deckIds: idsOf(commanderDecks.filter((deck) => deck.colorIdentity.includes(color))),
    })),
    colorIdentities: countColorIdentities(commanderDecks),
    commanders: countCommanders(commanderDecks, decks, window),
    cardsUsedMost: cards.slice(0, CARDS_USED_MOST_LISTED),
    sharedCards: { count: shared.length, mostShared: shared.slice(0, MOST_SHARED_LISTED) },
    brackets: BRACKET_LEVELS.map((bracket) => ({
      bracket,
      computedDeckIds: idsOf(commanderDecks.filter((deck) => deck.computedBracket === bracket)),
      targetDeckIds: idsOf(commanderDecks.filter((deck) => deck.targetBracket === bracket)),
    })),
  };
}

/** What says whether a deck's cards are counted: its format and its dates, no card. */
export type StatsDeckActivity = Pick<PlayerStatsDeck, "format" | "createdAt" | "updatedAt" | "snapshotDates">;

/**
 * Whether the counting reads the deck's cards over the window: only for an
 * active deck in a Commander-family format (requirement 3.2). Every card
 * figure (colours, colour identities, commanders, cards used most, shared
 * cards, brackets) counts these decks alone. The deck figures (active, added,
 * changed, formats) need no card.
 *
 * One exception lies outside this rule: whether a commander is new reads the
 * commanders of every deck created before the window, so a deck this rejects
 * still needs its commander rows.
 *
 * @param deck - the deck's format and dates
 * @param window - the period counted
 * @returns true when a card figure counts the deck
 */
export function countsDeckCards(deck: StatsDeckActivity, window: StatsWindow): boolean {
  return FORMAT_CONFIG[deck.format].hasCommander && isActiveIn(deck, window);
}

/** Whether the deck was added or changed in the window (requirement 3.1). */
function isActiveIn(deck: StatsDeckActivity, window: StatsWindow): boolean {
  return isAddedIn(deck, window) || isChangedIn(deck, window);
}

/** Whether the deck was created in the window (requirement 3.4). */
function isAddedIn(deck: StatsDeckActivity, window: StatsWindow): boolean {
  return isInWindow(deck.createdAt, window);
}

/**
 * Whether the deck changed in the window: a snapshot taken in it, or a save
 * in it after the deck's creation. `updatedAt` keeps only the last save, so
 * this is a floor, never an exact count (requirement 3.5).
 */
function isChangedIn(deck: StatsDeckActivity, window: StatsWindow): boolean {
  const savedSinceCreation = deck.updatedAt.getTime() > deck.createdAt.getTime();
  return (
    (savedSinceCreation && isInWindow(deck.updatedAt, window)) ||
    deck.snapshotDates.some((taken) => isInWindow(taken, window))
  );
}

/** Whether a moment falls in the window: from its start, before its cut-off. */
function isInWindow(moment: Date, window: StatsWindow): boolean {
  const time = moment.getTime();
  return time >= window.start.getTime() && time < window.end.getTime();
}

/** The ids of the decks, in their order. */
function idsOf(decks: readonly PlayerStatsDeck[]): readonly string[] {
  return decks.map((deck) => deck.deckId);
}

/** Active decks per format, leaving out formats with none, in the order formats are listed. */
function countFormats(decks: readonly PlayerStatsDeck[]): readonly FormatCount[] {
  return ALL_FORMATS.flatMap((format) => {
    const deckIds = idsOf(decks.filter((deck) => deck.format === format));
    return deckIds.length > 0 ? [{ format, deckIds }] : [];
  });
}

/** A value decks share, keyed by a string, with the decks that have it. */
interface DeckGroup<V> {
  readonly key: string;
  readonly value: V;
  readonly deckIds: readonly string[];
}

/**
 * Groups decks by the values they hold, each deck counted once per value
 * (requirement 1.3), the most decks first, ties broken by key.
 */
function groupDecks<V>(
  decks: readonly PlayerStatsDeck[],
  valuesOf: (deck: PlayerStatsDeck) => readonly (readonly [key: string, value: V])[]
): readonly DeckGroup<V>[] {
  const byKey = new Map<string, { key: string; value: V; deckIds: string[] }>();
  for (const deck of decks) {
    for (const [key, value] of valuesOf(deck)) {
      const group = byKey.get(key) ?? { key, value, deckIds: [] };
      if (group.deckIds.at(-1) !== deck.deckId) group.deckIds.push(deck.deckId);
      byKey.set(key, group);
    }
  }
  return [...byKey.values()].sort(
    (a, b) => b.deckIds.length - a.deckIds.length || a.key.localeCompare(b.key)
  );
}

/** Commander-family decks per colour identity, written in WUBRG order. */
function countColorIdentities(decks: readonly PlayerStatsDeck[]): readonly ColorIdentityCount[] {
  return groupDecks(decks, (deck) => {
    const identity = IDENTITY_COLORS.filter((color) => deck.colorIdentity.includes(color));
    return [[identity.join(""), identity]];
  }).map(({ value, deckIds }) => ({ identity: value, deckIds }));
}

/**
 * Commander-family decks per main-deck card, by Oracle name. A card counts
 * once per deck whatever its copies; basic lands (CR 205.4c) are left out
 * (requirement 3.3).
 */
function countCards(decks: readonly PlayerStatsDeck[]): readonly CardCount[] {
  return groupDecks(decks, (deck) =>
    deck.mainCards
      .filter((card) => !isBasicLand(card.typeLine))
      .map((card): readonly [string, string] => [card.name, card.name])
  ).map(({ value, deckIds }) => ({ name: value, deckIds }));
}

/** A deck's commander names, sorted, and the key that names the commander or the pair. */
function commanderOf(deck: PlayerStatsDeck): readonly [key: string, names: readonly string[]] {
  const names = [...deck.commanders].sort((a, b) => a.localeCompare(b));
  return [names.join(PAIR_KEY_SEPARATOR), names];
}

/**
 * Commander-family decks per commander; a partner pair is one entry. A
 * commander is new when no deck the player still has, created before the
 * window, was led by it (requirement 2.2).
 */
function countCommanders(
  activeDecks: readonly PlayerStatsDeck[],
  allDecks: readonly PlayerStatsDeck[],
  window: StatsWindow
): readonly CommanderCount[] {
  const earlierKeys = new Set(
    allDecks
      .filter((deck) => deck.createdAt.getTime() < window.start.getTime())
      .map((deck) => commanderOf(deck)[0])
  );
  return groupDecks(activeDecks, (deck) => [commanderOf(deck)]).map(({ key, value, deckIds }) => ({
    names: value,
    deckIds,
    isNew: !earlierKeys.has(key),
  }));
}
