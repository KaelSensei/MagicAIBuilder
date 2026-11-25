/**
 * The shape of one goldfish game: the state record the engine's transitions read and return.
 *
 * Context: playtest, the engine. Every transition is a pure function from one readonly
 * `PlaytestEngine` to the next; the types here are the vocabulary they share, and the only
 * thing the UI (`components/playtest/`) needs to render a game. `PlaytestEnginePatch` is the
 * writable patch a transition hands to `history.ts`; it stays inside `engine/`.
 * Rules: the turn structure the step list flattens (CR 500.1), the table size (CR 800.1),
 * commanders in the command zone (CR 903.6), commander damage (CR 903.10a), player counters
 * (CR 122.1) and the designations a player or the game can have (CR 725, 726, 731).
 * Not responsible for: the ports (`ports.ts`) or any transition.
 *
 * @module playtest/engine/types
 */

import type { DeckCard } from "@/lib/deck/types";

// ─── Constants ─────────────────────────────────────────────────────────────
// The opening hand size and the starting life total are game rules shared with deck analysis:
// they live in `lib/deck/game-constants.ts`.

/**
 * The steps a playtest turn walks through, in order.
 *
 * A product simplification of CR 500.1: the beginning phase's three steps are listed on their
 * own, the combat and ending phases as one step each, so the player presses "next" seven times
 * per turn. The engine draws when a turn starts (`turn.ts`), not when "Draw" is reached.
 */
export const PHASES = [
  "Untap",
  "Upkeep",
  "Draw",
  "Main1",
  "Combat",
  "Main2",
  "End",
] as const;

/** One step of a playtest turn; see `PHASES` for the order. */
export type Phase = (typeof PHASES)[number];

/** Library / hand / battlefield / GY / exile / command zone id (playtest engine). */
export type CardZone =
  "hand" | "library" | "battlefield" | "graveyard" | "exile" | "command";

/**
 * What the player asks for when creating a token or an emblem (`applyCreateToken`).
 *
 * `power` is the printed "P/T" text, such as `"1/1"`, or null for a token with no power and
 * toughness; `colors` are colour names (`"white"`, `"blue"`, …), case-insensitive.
 */
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

/**
 * The combat damage one commander has dealt to one imagined opponent over the game
 * (CR 903.10a). `opponent` is a seat from 1 to `commanderDamageOpponents`.
 */
export interface CommanderDamageTally {
  readonly opponent: number;
  readonly commanderId: string;
  readonly damage: number;
}

/** The counters a player can have that the playtest tracks (CR 122.1, 107.14). */
export type PlayerCounterKind = "poison" | "energy" | "experience";

/** The designations a player either has or not, and an imagined opponent can take away. */
export type ToggledDesignation = "monarch" | "initiative";

/** The game's day/night designation; it starts as neither (CR 731.1). */
export type DayNight = "neither" | "day" | "night";

/** What the game can become once play starts: day or night, never back to neither (CR 731.1). */
export type DayOrNight = Exclude<DayNight, "neither">;

/**
 * The designations and player counters the player sets by hand; the engine never infers them
 * from Oracle text. `ringTemptations` counts the times the Ring has tempted the player
 * (CR 701.54a).
 */
export interface PlayerDesignations extends Readonly<
  Record<PlayerCounterKind, number>
> {
  readonly ringTemptations: number;
  readonly monarch: boolean;
  readonly initiative: boolean;
  readonly dayNight: DayNight;
  readonly citysBlessing: boolean;
}

/** One die roll the player made; `result` is in `[1, sides]`. */
export interface DiceRoll {
  readonly sides: number;
  readonly result: number;
}

// The parameter shapes are type aliases, not interfaces, so each one is assignable to
// `LogMessageValues` (`action-log-text.ts`) and is rendered without a per-key cast.

/** A log line that names one card, by the name its card data gives (never translated). */
type CardLogParams = { readonly card: string };

/** A log line that names several cards, in the order the move took them. */
type CardsLogParams = { readonly cards: readonly string[] };

/** A log line about one amount: life lost or gained, or mana produced. */
type AmountLogParams = { readonly amount: number };

/**
 * What one log line says, as data: a message key and its parameters, never a sentence.
 *
 * The engine writes the key; the UI renders it through next-intl from the `playtest.log.entries`
 * catalog of the player's locale (`action-log-text.ts`), so the same game reads in every
 * language (#1853). Parameters are numbers, card names as the card data gives them, and
 * identifiers (zones, steps, counter kinds, day or night) the catalog spells out. A `note` is the
 * player's own text, shown as typed.
 */
export type PlaytestLogMessage =
  | { readonly key: "note"; readonly params: { readonly text: string } }
  | { readonly key: "startedWithChosenCards"; readonly params: CardsLogParams }
  | { readonly key: "freeMulligan" }
  | { readonly key: "mulligan"; readonly params: { readonly toBottom: number } }
  | { readonly key: "bottomed"; readonly params: CardsLogParams }
  | {
      readonly key:
        | "drewCard"
        | "drewFirstTurnCard"
        | "untappedAll"
        | "libraryShuffled"
        | "gotCitysBlessing"
        | "becameMonarch"
        | "opponentBecameMonarch"
        | "tookInitiative"
        | "opponentTookInitiative";
    }
  | {
      readonly key: "startedTurn" | "startedTurnAndDrew";
      readonly params: { readonly turn: number };
    }
  | {
      readonly key: "advancedToPhase";
      readonly params: { readonly phase: Phase };
    }
  | {
      readonly key:
        | "tapped"
        | "untapped"
        | "createdCopy"
        | "created"
        | "counterAdded"
        | "counterRemoved"
        | "removedCopy"
        | "castFromCommandZone"
        | "returnedToCommandZone";
      readonly params: CardLogParams;
    }
  | {
      readonly key: "moved";
      readonly params: CardLogParams & {
        readonly from: CardZone;
        readonly to: CardZone;
      };
    }
  | {
      readonly key: "rolledDie";
      readonly params: { readonly sides: number; readonly result: number };
    }
  | {
      readonly key: "lostLife" | "gainedLife" | "producedMana";
      readonly params: AmountLogParams;
    }
  | {
      readonly key: "lostLifeTo";
      readonly params: AmountLogParams & { readonly cause: string };
    }
  | {
      readonly key: "commanderDamage";
      readonly params: CardLogParams &
        AmountLogParams & { readonly opponent: number; readonly total: number };
    }
  | {
      readonly key: "playerCountersGained" | "playerCountersLost";
      readonly params: {
        readonly counter: PlayerCounterKind;
        readonly count: number;
        readonly total: number;
      };
    }
  | {
      readonly key: "dayNightBegan" | "dayNightSwapped";
      readonly params: { readonly to: DayOrNight };
    }
  | {
      readonly key: "ringTempted";
      readonly params: { readonly total: number };
    };

/**
 * One line of the action log, the record of the game the player can read, edit and export.
 *
 * `id` is unique within a game and never reused, so an edit or a removal names a line safely.
 * `kind` and the amounts are the evidence `draw-progress-evidence.ts` and the AI context read
 * from the log; an edited line loses them (`applyEditActionLogEntry`), a free-text note never
 * has them.
 */
export interface PlaytestActionLogEntry {
  readonly id: number;
  readonly turn: number;
  readonly phase: Phase;
  readonly message: PlaytestLogMessage;
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
  /**
   * True when the game began with more than two players (CR 800.1). Then the starting player
   * draws on turn 1 (CR 103.8c); in a two-player game they skip that draw (CR 103.8a).
   */
  readonly multiplayer: boolean;

  /** Mulligans taken for the opening hand. */
  readonly mulliganCount: number;
  /** True when the first mulligan does not count toward cards bottomed (CR 103.5c). */
  readonly firstMulliganFree: boolean;
  /** Cards the player must still put on the bottom; 0 when no choice is pending. */
  readonly cardsToBottom: number;

  // Life
  readonly lifeTotal: number;
  readonly lifeHistory: readonly LifeHistoryEntry[];

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
  /**
   * How many imagined opponents the commander-damage tally offers: 0 when the format does not
   * use the rule (CR 903.12h for Brawl), else 1 in a duel and 3 at a multiplayer table.
   */
  readonly commanderDamageOpponents: number;
  /** The tally, one entry per opponent and commander that has dealt damage (CR 903.10a). */
  readonly commanderDamage: readonly CommanderDamageTally[];
  /** The player's counters and designations, as the player set them (`designations.ts`). */
  readonly designations: PlayerDesignations;
  readonly diceRolls: readonly DiceRoll[];
  readonly actionLog: readonly PlaytestActionLogEntry[];
  readonly nextActionId: number;

  // Undo
  readonly history: readonly UndoHistoryEntry[];
}

/**
 * Writable patch for immutable engine updates (undo stack).
 *
 * Internal to `engine/`: a transition builds one and `pushHistory` applies it. The barrel does
 * not export it, so no importer can patch a state without an undo entry.
 */
export type PlaytestEnginePatch = {
  -readonly [K in keyof PlaytestEngine]?: PlaytestEngine[K];
};
