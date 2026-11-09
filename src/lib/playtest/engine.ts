/**
 * Playtest Engine — Pure functions for game state management
 * Zero framework dependencies. All state transitions are immutable and reversible.
 */

import type { DeckCard } from "@/lib/deck/types";
import { randomIntBelow } from "@/lib/crypto-random";

// ─── Constants ─────────────────────────────────────────────────────────────
/** Commander default; per-format totals live in FORMAT_CONFIG.startingLife. */
export const STARTING_LIFE = 40;

/** Opening hand size; every London mulligan draws this many again (CR 103.5). */
export const OPENING_HAND_SIZE = 7;

/** Smallest opening hand the playtest lets a player mulligan down to. */
const MIN_KEPT_HAND_SIZE = 1;

export const PHASES = [
  "Untap",
  "Upkeep",
  "Draw",
  "Main1",
  "Combat",
  "Main2",
  "End",
] as const;

export type Phase = (typeof PHASES)[number];

/** Library / hand / battlefield / GY / exile / command zone id (playtest engine). */
export type CardZone = "hand" | "library" | "battlefield" | "graveyard" | "exile" | "command";

export interface PlaytestTokenSpec {
  readonly name: string;
  readonly power: string | null;
  readonly colors: readonly string[];
  readonly kind: "token" | "emblem";
}

// ─── Types ────────────────────────────────────────────────────────────────
/**
 * A card on the battlefield with state (tapped, counters).
 */
export interface BattlefieldCard extends DeckCard {
  readonly tapped: boolean;
  readonly counters: number;
  /** True for a playtest-only copy that is not part of the saved deck. */
  readonly isSessionCopy?: boolean;
}

/**
 * A damage event for the life history log.
 */
export interface LifeHistoryEntry {
  readonly turn: number;
  readonly phase: Phase;
  readonly timestamp: number;
  readonly delta: number; // +/- amount
  readonly description: string; // e.g., "3 damage (attack)", "-5 (heal)"
}

export interface DiceRoll {
  readonly sides: number;
  readonly result: number;
}

export interface PlaytestActionLogEntry {
  readonly id: number;
  readonly turn: number;
  readonly phase: Phase;
  readonly description: string;
  readonly kind?: "draw" | "cardSeen" | "mana" | "life" | "counter";
  readonly amount?: number;
  readonly lifeDelta?: number;
  readonly counterDelta?: number;
}

/**
 * An action for undo/redo.
 */
export interface UndoHistoryEntry {
  readonly timestamp: number;
  readonly state: PlaytestEngine;
}

/**
 * Complete playtest game state.
 */
export interface PlaytestEngine {
  // Turn & phase
  readonly turn: number;
  readonly phase: Phase;

  /** Mulligans taken for the opening hand. */
  readonly mulliganCount: number;
  /** True when the first mulligan does not count toward cards bottomed (CR 103.5c). */
  readonly firstMulliganFree: boolean;
  /** Cards the player must still put on the bottom; 0 when no choice is pending. */
  readonly cardsToBottom: number;

  // Life
  readonly lifeTotal: number;
  readonly lifeHistory: readonly LifeHistoryEntry[];
  readonly isGameOver: boolean;

  // Zones
  readonly hand: readonly DeckCard[];
  readonly library: readonly DeckCard[];
  readonly battlefield: readonly BattlefieldCard[];
  readonly graveyard: readonly DeckCard[];
  readonly exile: readonly DeckCard[];
  /** Commanders waiting to be cast; they start here, never in the library (CR 903.6). */
  readonly commandZone: readonly DeckCard[];
  /** Ids of this game's commanders, the only cards the command zone accepts. */
  readonly commanderIds: readonly string[];
  readonly diceRolls: readonly DiceRoll[];
  readonly actionLog: readonly PlaytestActionLogEntry[];
  readonly nextActionId: number;

  // Undo
  readonly history: readonly UndoHistoryEntry[];
}

/** Writable patch for immutable engine updates (undo stack). */
type PlaytestEnginePatch = {
  -readonly [K in keyof PlaytestEngine]?: PlaytestEngine[K];
};

// ─── Initial State ────────────────────────────────────────────────────────
/**
 * Create a fresh playtest state: shuffle deck, draw 7 cards.
 *
 * `deckCards` holds one entry per physical library card. The commanders go in
 * `overrides.commandZone`, never in `deckCards`; they become `commanderIds`.
 */
export function createPlaytestState(
  deckCards: readonly DeckCard[],
  overrides: Partial<PlaytestEngine> = {}
): PlaytestEngine {
  // Fisher-Yates shuffle
  const shuffled = shuffleCards([...deckCards]);

  // Draw 7, rest to library
  const hand = shuffled.slice(0, OPENING_HAND_SIZE);
  const library = shuffled.slice(OPENING_HAND_SIZE);

  return {
    turn: 1,
    phase: "Draw" as const,
    mulliganCount: 0,
    // Commander default, like STARTING_LIFE; per-format values live in
    // FORMAT_CONFIG.firstMulliganFree.
    firstMulliganFree: true,
    cardsToBottom: 0,
    lifeTotal: overrides.lifeTotal ?? STARTING_LIFE,
    lifeHistory: [],
    isGameOver: false,
    hand,
    library,
    battlefield: [],
    graveyard: [],
    exile: [],
    commandZone: [],
    // The cards dealt into the command zone are the game's commanders.
    commanderIds: (overrides.commandZone ?? []).map((card) => card.id),
    diceRolls: [],
    actionLog: [],
    nextActionId: 1,
    history: [],
    ...overrides,
  };
}

// ─── Shuffle ──────────────────────────────────────────────────────────────
function shuffleCards<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomIntBelow(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Draw card ────────────────────────────────────────────────────────────
export function applyDrawCard(state: PlaytestEngine): PlaytestEngine {
  if (isChoosingBottom(state)) return state;
  if (state.library.length === 0) return state;

  const [drawn, ...rest] = state.library;
  return pushHistory(state, {
    hand: [...state.hand, drawn],
    library: rest,
  }, "Drew a card", { kind: "draw" });
}

// ─── Mulligan ─────────────────────────────────────────────────────────────
/**
 * True while a mulligan waits for the player to choose the cards to bottom.
 * Taking the mulligan is not finished until then (CR 103.5), so every other
 * game action waits; only that choice and undo apply.
 *
 * @param state - current engine state
 * @returns whether a bottom choice is pending
 */
export function isChoosingBottom(state: PlaytestEngine): boolean {
  return state.cardsToBottom > 0;
}

/** The mulligan facts that decide how many cards go to the bottom. */
export type MulliganTally = Pick<PlaytestEngine, "mulliganCount" | "firstMulliganFree">;

/**
 * Cards a London mulligan puts on the bottom: one per mulligan taken, except
 * that a free first mulligan does not count (CR 103.5, 103.5c).
 *
 * @param tally - mulligans taken and whether the first one is free
 * @returns how many cards go to the bottom, never below zero
 */
export function mulliganBottomCount(tally: MulliganTally): number {
  const counted = tally.firstMulliganFree ? tally.mulliganCount - 1 : tally.mulliganCount;
  return Math.max(0, counted);
}

/**
 * Size of the opening hand once the mulligans taken are settled.
 *
 * @param tally - mulligans taken and whether the first one is free
 * @returns seven minus the cards bottomed, never below zero
 */
export function keptOpeningHandSize(tally: MulliganTally): number {
  return Math.max(0, OPENING_HAND_SIZE - mulliganBottomCount(tally));
}

/**
 * The most mulligans the playtest allows: enough to keep at least one card.
 * A free first mulligan does not count toward the mulligans a player may take
 * either (CR 103.5c), so a multiplayer game allows one more than a duel.
 *
 * @param rule - whether the first mulligan is free
 * @returns the mulligan limit
 */
export function maxMulligans(rule: Pick<PlaytestEngine, "firstMulliganFree">): number {
  const countedMulligans = OPENING_HAND_SIZE - MIN_KEPT_HAND_SIZE;
  return rule.firstMulliganFree ? countedMulligans + 1 : countedMulligans;
}

/**
 * Describes a mulligan for the action log.
 *
 * @param cardsToBottom - cards the player must now put on the bottom
 * @returns the log line
 */
function describeMulligan(cardsToBottom: number): string {
  if (cardsToBottom === 0) return "Free mulligan: drew a new seven";
  const cards = cardsToBottom === 1 ? "1 card" : `${cardsToBottom} cards`;
  return `Mulligan: drew a new seven, ${cards} to put on the bottom`;
}

/**
 * Takes a London mulligan (CR 103.5): the hand is shuffled back into the
 * library and a new hand of seven is drawn. The player then chooses which
 * cards to put on the bottom — one per mulligan taken — through
 * `applyBottomCards`. The choice is the point of London: the player keeps the
 * cards that fit the hand, so it is not the same as dealing `7 - N` at random.
 *
 * In a multiplayer game and in Brawl the first mulligan does not count
 * (CR 103.5c): it deals a fresh seven with nothing to bottom.
 *
 * @param state - current game state
 * @returns the state with a new seven and, unless the mulligan was free, a
 * pending bottom choice
 */
export function applyMulligan(state: PlaytestEngine): PlaytestEngine {
  if (isChoosingBottom(state)) return state;
  if (state.mulliganCount >= maxMulligans(state)) return state;

  const mulliganCount = state.mulliganCount + 1;
  const shuffled = shuffleCards([...state.hand, ...state.library]);
  const cardsToBottom = mulliganBottomCount({
    mulliganCount,
    firstMulliganFree: state.firstMulliganFree,
  });

  return pushHistory(state, {
    mulliganCount,
    cardsToBottom,
    hand: shuffled.slice(0, OPENING_HAND_SIZE),
    library: shuffled.slice(OPENING_HAND_SIZE),
  }, describeMulligan(cardsToBottom));
}

/**
 * Resolves a bottom choice against the hand.
 *
 * @param hand - the hand the cards must come from
 * @param cardIds - the chosen card ids, in the order chosen
 * @param count - how many cards the pending choice needs
 * @returns the chosen cards in order, or null unless they are exactly `count`
 * distinct hand cards
 */
function pickBottomCards(
  hand: readonly DeckCard[],
  cardIds: readonly string[],
  count: number
): readonly DeckCard[] | null {
  if (count === 0 || cardIds.length !== count) return null;
  if (new Set(cardIds).size !== cardIds.length) return null;

  const handById = new Map(hand.map((card) => [card.id, card]));
  const chosen: DeckCard[] = [];
  for (const id of cardIds) {
    const card = handById.get(id);
    if (card === undefined) return null;
    chosen.push(card);
  }
  return chosen;
}

/**
 * Completes a London mulligan: the chosen hand cards go to the bottom of the
 * library in the order chosen, so the last one chosen ends up bottom-most.
 *
 * @param state - a state whose bottom choice is pending
 * @param cardIds - exactly `cardsToBottom` distinct hand cards, in the order chosen
 * @returns the state with the opening hand settled, or the same state when the
 * choice is not valid
 */
export function applyBottomCards(
  state: PlaytestEngine,
  cardIds: readonly string[]
): PlaytestEngine {
  const chosen = pickBottomCards(state.hand, cardIds, state.cardsToBottom);
  if (chosen === null) return state;

  const chosenIds = new Set(cardIds);
  return pushHistory(state, {
    cardsToBottom: 0,
    hand: state.hand.filter((card) => !chosenIds.has(card.id)),
    library: [...state.library, ...chosen],
  }, `Put ${chosen.map((card) => card.name).join(", ")} on the bottom of the library`);
}

// ─── Phase progression ────────────────────────────────────────────────────
export function applyNextPhase(state: PlaytestEngine): PlaytestEngine {
  if (isChoosingBottom(state)) return state;
  const currentIndex = PHASES.indexOf(state.phase);
  const isLastPhase = currentIndex === PHASES.length - 1;

  if (isLastPhase) {
    // End → Untap of next turn (+ untap all permanents)
    const untappedBattlefield = state.battlefield.map((p) => ({
      ...p,
      tapped: false,
    }));

    return pushHistory(state, {
      turn: state.turn + 1,
      phase: "Untap" as const,
      battlefield: untappedBattlefield,
    }, `Started turn ${state.turn + 1}`, { turn: state.turn + 1, phase: "Untap" });
  }

  // Advance to next phase
  const nextPhase = PHASES[currentIndex + 1];
  if (nextPhase === undefined) return state;
  return pushHistory(state, { phase: nextPhase }, `Advanced to ${nextPhase}`);
}

// ─── Next turn ────────────────────────────────────────────────────────────
export function applyNextTurn(state: PlaytestEngine): PlaytestEngine {
  if (isChoosingBottom(state)) return state;
  // Untap all permanents
  const untappedBattlefield = state.battlefield.map((p) => ({
    ...p,
    tapped: false,
  }));

  // Draw a card if library not empty
  let newHand = state.hand;
  let newLibrary = state.library;

  if (state.library.length > 0) {
    const [drawn, ...rest] = state.library;
    newHand = [...state.hand, drawn];
    newLibrary = rest;
  }

  return pushHistory(state, {
    turn: state.turn + 1,
    phase: "Draw" as const,
    hand: newHand,
    library: newLibrary,
    battlefield: untappedBattlefield,
  }, state.library.length > 0
    ? `Started turn ${state.turn + 1} and drew a card`
    : `Started turn ${state.turn + 1}`, {
    turn: state.turn + 1,
    phase: "Draw",
    ...(state.library.length > 0 ? { kind: "draw" as const } : {}),
  });
}

// ─── Damage / heal ────────────────────────────────────────────────────────
export function applyDamage(
  state: PlaytestEngine,
  amount: number,
  description = "damage"
): PlaytestEngine {
  if (isChoosingBottom(state)) return state;
  const newLife = state.lifeTotal - amount;
  const entry: LifeHistoryEntry = {
    turn: state.turn,
    phase: state.phase,
    timestamp: Date.now(),
    delta: -amount,
    description,
  };
  const newHistory = [...state.lifeHistory, entry];

  return pushHistory(state, {
    lifeTotal: newLife,
    lifeHistory: newHistory,
    isGameOver: newLife <= 0,
  }, `Lost ${amount} life: ${description}`, { kind: "life", lifeDelta: -amount });
}

export function applyHeal(
  state: PlaytestEngine,
  amount: number
): PlaytestEngine {
  if (isChoosingBottom(state)) return state;
  const newLife = state.lifeTotal + amount;
  const entry: LifeHistoryEntry = {
    turn: state.turn,
    phase: state.phase,
    timestamp: Date.now(),
    delta: amount,
    description: "heal",
  };
  const newHistory = [...state.lifeHistory, entry];

  return pushHistory(state, {
    lifeTotal: newLife,
    lifeHistory: newHistory,
  }, `Gained ${amount} life`, { kind: "life", lifeDelta: amount });
}

// ─── Tap / untap ──────────────────────────────────────────────────────────
export function applyTap(state: PlaytestEngine, cardId: string): PlaytestEngine {
  if (isChoosingBottom(state)) return state;
  const exists = state.battlefield.some((c) => c.id === cardId);
  if (!exists) return state;

  const updated = state.battlefield.map((c) =>
    c.id === cardId ? { ...c, tapped: !c.tapped } : c
  );

  const permanent = state.battlefield.find((card) => card.id === cardId);
  return pushHistory(
    state,
    { battlefield: updated },
    `${permanent?.tapped ? "Untapped" : "Tapped"} ${permanent?.name ?? "card"}`
  );
}

export function applyUntapAll(state: PlaytestEngine): PlaytestEngine {
  if (isChoosingBottom(state)) return state;
  const untapped = state.battlefield.map((p) => ({ ...p, tapped: false }));
  return pushHistory(state, { battlefield: untapped }, "Untapped all permanents");
}

// ─── Move to zone ─────────────────────────────────────────────────────────

/**
 * Pulls one card out of a zone list.
 *
 * @param cards - zone contents
 * @param cardId - card to remove
 * @returns the card and the list without it, or null when it is absent
 */
function takeCard<T extends { readonly id: string }>(
  cards: readonly T[],
  cardId: string
): { readonly card: T; readonly rest: readonly T[] } | null {
  const cardIndex = cards.findIndex((entry) => entry.id === cardId);
  if (cardIndex === -1) return null;
  const card = cards[cardIndex];
  if (card === undefined) return null;
  return { card, rest: cards.filter((_, index) => index !== cardIndex) };
}

/**
 * Removes a card from one playtest zone.
 *
 * @param state - current engine state
 * @param zone - zone the card leaves
 * @param cardId - card to remove
 * @returns the card and a patch of that zone, or null when it is absent
 */
function takeFromZone(
  state: PlaytestEngine,
  zone: CardZone,
  cardId: string
): { readonly card: DeckCard | BattlefieldCard; readonly updates: PlaytestEnginePatch } | null {
  switch (zone) {
    case "hand": {
      const taken = takeCard(state.hand, cardId);
      return taken ? { card: taken.card, updates: { hand: taken.rest } } : null;
    }
    case "library": {
      const taken = takeCard(state.library, cardId);
      return taken ? { card: taken.card, updates: { library: taken.rest } } : null;
    }
    case "battlefield": {
      const taken = takeCard(state.battlefield, cardId);
      return taken ? { card: taken.card, updates: { battlefield: taken.rest } } : null;
    }
    case "graveyard": {
      const taken = takeCard(state.graveyard, cardId);
      return taken ? { card: taken.card, updates: { graveyard: taken.rest } } : null;
    }
    case "exile": {
      const taken = takeCard(state.exile, cardId);
      return taken ? { card: taken.card, updates: { exile: taken.rest } } : null;
    }
    case "command": {
      const taken = takeCard(state.commandZone, cardId);
      return taken ? { card: taken.card, updates: { commandZone: taken.rest } } : null;
    }
    default: {
      const _exhaustive: never = zone;
      return _exhaustive;
    }
  }
}

/**
 * True when a playtest-only copy is leaving the battlefield, where it ceases to exist.
 *
 * @param card - card being moved
 * @param destination - zone it would enter
 * @returns whether the copy should be removed instead of moved
 */
function isSessionCopyLeavingPlay(
  card: DeckCard | BattlefieldCard,
  destination: CardZone
): boolean {
  return "isSessionCopy" in card && card.isSessionCopy === true && destination !== "battlefield";
}

/**
 * Appends a card to a destination zone on the patch.
 *
 * The destination is read from the original state, matching a move that
 * replaces the source list and then appends to the destination list.
 *
 * @param state - state before the move
 * @param updates - patch already holding the source-zone removal
 * @param zone - zone the card enters
 * @param card - card to append
 */
function placeInZone(
  state: PlaytestEngine,
  updates: PlaytestEnginePatch,
  zone: CardZone,
  card: DeckCard | BattlefieldCard
): void {
  switch (zone) {
    case "hand":
      updates.hand = [...state.hand, toDeckCard(card)];
      return;
    case "library":
      updates.library = [...state.library, toDeckCard(card)];
      return;
    case "battlefield":
      updates.battlefield = [...state.battlefield, toBattlefieldCard(card)];
      return;
    case "graveyard":
      updates.graveyard = [...state.graveyard, toDeckCard(card)];
      return;
    case "exile":
      updates.exile = [...state.exile, toDeckCard(card)];
      return;
    case "command":
      updates.commandZone = [...state.commandZone, toDeckCard(card)];
      return;
    default: {
      const _exhaustive: never = zone;
      updates.hand = _exhaustive;
    }
  }
}

/**
 * Describes a move for the action log.
 *
 * @param name - name of the card moved
 * @param from - zone the card left
 * @param to - zone the card entered
 * @returns the log line
 */
function describeMove(name: string, from: CardZone, to: CardZone): string {
  if (from === "command" && to === "battlefield") return `Cast ${name} from the command zone`;
  if (to === "command") return `Returned ${name} to the command zone`;
  return `Moved ${name} from ${from} to ${to}`;
}

/**
 * Moves one card between playtest zones.
 *
 * A session copy that leaves the battlefield is removed instead of relocated.
 * A card taken from the library is recorded as seen. Only a commander may
 * enter the command zone (CR 903.9).
 *
 * @param state - current engine state
 * @param cardId - card to move
 * @param from - zone the card leaves
 * @param to - zone the card enters
 * @returns the next engine state
 */
export function applyMoveToZone(
  state: PlaytestEngine,
  cardId: string,
  from: CardZone,
  to: CardZone
): PlaytestEngine {
  if (isChoosingBottom(state)) return state;
  if (to === "command" && !state.commanderIds.includes(cardId)) return state;
  const removed = takeFromZone(state, from, cardId);
  if (!removed) return state;

  const { card, updates } = removed;
  if (isSessionCopyLeavingPlay(card, to)) {
    return pushHistory(state, updates, `Removed ${card.name} from the battlefield`);
  }

  placeInZone(state, updates, to, card);
  const description = describeMove(card.name, from, to);
  if (from === "library") {
    return pushHistory(state, updates, description, { kind: "cardSeen" });
  }
  return pushHistory(state, updates, description);
}

// ─── Card copies ─────────────────────────────────────────────────────────
export function applyCreateCardCopy(
  state: PlaytestEngine,
  cardId: string,
  copyId: string
): PlaytestEngine {
  if (isChoosingBottom(state)) return state;
  if (state.battlefield.some((card) => card.id === copyId)) return state;

  const source = state.battlefield.find((card) => card.id === cardId);
  if (!source) return state;

  const copy: BattlefieldCard = {
    ...source,
    id: copyId,
    quantity: 1,
    tapped: false,
    counters: 0,
    isSessionCopy: true,
  };

  return pushHistory(
    state,
    { battlefield: [...state.battlefield, copy] },
    `Created a copy of ${source.name}`
  );
}

const TOKEN_COLOR_IDENTITIES: Readonly<Record<string, string>> = {
  white: "W",
  blue: "U",
  black: "B",
  red: "R",
  green: "G",
};

export function applyCreateToken(
  state: PlaytestEngine,
  token: PlaytestTokenSpec,
  tokenId: string
): PlaytestEngine {
  if (isChoosingBottom(state)) return state;
  if (state.battlefield.some((card) => card.id === tokenId)) return state;

  const name = [token.power, token.name, token.kind === "token" ? "token" : null]
    .filter(Boolean)
    .join(" ");
  const battlefieldToken: BattlefieldCard = {
    id: tokenId,
    scryfallId: tokenId,
    name,
    manaCost: "",
    cmc: 0,
    typeLine:
      token.kind === "emblem" ? "Emblem" : `Token Creature — ${token.name}`,
    oracleText: "",
    colorIdentity: token.colors
      .map((color) => TOKEN_COLOR_IDENTITIES[color.toLowerCase()])
      .filter((color): color is string => color !== undefined),
    isGameChanger: false,
    isBanned: false,
    price: null,
    imageUri: "",
    artCropUri: "",
    category: token.kind === "token" ? "creature" : "other",
    power: token.power?.split("/")[0] ?? null,
    toughness: token.power?.split("/")[1] ?? null,
    quantity: 1,
    zone: "main",
    tapped: false,
    counters: 0,
    isSessionCopy: true,
  };

  return pushHistory(state, {
    battlefield: [...state.battlefield, battlefieldToken],
  }, `Created ${name}`);
}

// ─── Dice ────────────────────────────────────────────────────────────────
export function applyRollDie(
  state: PlaytestEngine,
  sides: number,
  result: number
): PlaytestEngine {
  if (isChoosingBottom(state)) return state;
  if (!Number.isInteger(sides) || sides < 2) return state;
  if (!Number.isInteger(result) || result < 1 || result > sides) return state;

  return pushHistory(state, {
    diceRolls: [...state.diceRolls, { sides, result }].slice(-10),
  }, `Rolled d${sides}: ${result}`);
}

// ─── Editable action log ─────────────────────────────────────────────────
export function applyAddActionLogEntry(
  state: PlaytestEngine,
  description: string
): PlaytestEngine {
  if (isChoosingBottom(state)) return state;
  const normalized = description.trim();
  if (normalized === "") return state;
  return pushHistory(state, {}, normalized);
}

export function applyRecordMana(state: PlaytestEngine, amount: number): PlaytestEngine {
  if (isChoosingBottom(state)) return state;
  if (!Number.isInteger(amount) || amount < 1 || amount > 100) return state;
  return pushHistory(state, {}, `Produced ${amount} mana`, { kind: "mana", amount });
}

export function applyEditActionLogEntry(
  state: PlaytestEngine,
  entryId: number,
  description: string
): PlaytestEngine {
  if (isChoosingBottom(state)) return state;
  const normalized = description.trim();
  const exists = state.actionLog.some((entry) => entry.id === entryId);
  if (!exists || normalized === "") return state;
  return pushHistory(state, {
    actionLog: state.actionLog.map((entry) => {
      if (entry.id !== entryId) return entry;
      return {
        ...entry,
        description: normalized,
        kind: undefined,
        amount: undefined,
        lifeDelta: undefined,
        counterDelta: undefined,
      };
    }),
  });
}

export function applyRemoveActionLogEntry(
  state: PlaytestEngine,
  entryId: number
): PlaytestEngine {
  if (isChoosingBottom(state)) return state;
  if (!state.actionLog.some((entry) => entry.id === entryId)) return state;
  return pushHistory(state, {
    actionLog: state.actionLog.filter((entry) => entry.id !== entryId),
  });
}

// ─── Counters ─────────────────────────────────────────────────────────────
export function applyAddCounter(
  state: PlaytestEngine,
  cardId: string,
  amount: number
): PlaytestEngine {
  if (isChoosingBottom(state)) return state;
  const permanent = state.battlefield.find((c) => c.id === cardId);
  if (!permanent) return state;

  const newCounters = Math.max(0, permanent.counters + amount);
  const updated = state.battlefield.map((c) =>
    c.id === cardId ? { ...c, counters: newCounters } : c
  );

  return pushHistory(
    state,
    { battlefield: updated },
    `${amount >= 0 ? "Added" : "Removed"} a counter ${amount >= 0 ? "to" : "from"} ${permanent.name}`,
    { kind: "counter", counterDelta: amount }
  );
}

// ─── Undo ────────────────────────────────────────────────────────────────
export function applyUndo(state: PlaytestEngine): PlaytestEngine {
  if (state.history.length === 0) return state;

  const [previous] = state.history;
  return previous.state;
}

// ─── Helpers ──────────────────────────────────────────────────────────────
function toDeckCard(card: DeckCard | BattlefieldCard): DeckCard {
  return card;
}

function toBattlefieldCard(card: DeckCard | BattlefieldCard): BattlefieldCard {
  return { ...card, tapped: false, counters: 0 };
}

/**
 * Create a new state with updates, push old state to undo history (max 10 entries).
 */
function pushHistory(
  state: PlaytestEngine,
  updates: PlaytestEnginePatch,
  actionDescription?: string,
  evidence?: Partial<
    Pick<
      PlaytestActionLogEntry,
      "kind" | "amount" | "lifeDelta" | "counterDelta" | "turn" | "phase"
    >
  >
): PlaytestEngine {
  const actionLog = actionDescription
    ? [
        ...state.actionLog,
        {
          id: state.nextActionId,
          turn: evidence?.turn ?? state.turn,
          phase: evidence?.phase ?? state.phase,
          description: actionDescription,
          ...(evidence?.kind ? { kind: evidence.kind } : {}),
          ...(evidence?.amount ? { amount: evidence.amount } : {}),
          ...(evidence?.lifeDelta !== undefined ? { lifeDelta: evidence.lifeDelta } : {}),
          ...(evidence?.counterDelta !== undefined ? { counterDelta: evidence.counterDelta } : {}),
        },
      ]
    : updates.actionLog;
  const newState: PlaytestEngine = {
    ...state,
    ...updates,
    ...(actionLog ? { actionLog } : {}),
    nextActionId: actionDescription ? state.nextActionId + 1 : state.nextActionId,
  };

  // Push to undo history, limit to 10
  const historyEntry: UndoHistoryEntry = { timestamp: Date.now(), state };
  const newHistory = [historyEntry, ...state.history].slice(0, 10);

  return {
    ...newState,
    history: newHistory,
  };
}
