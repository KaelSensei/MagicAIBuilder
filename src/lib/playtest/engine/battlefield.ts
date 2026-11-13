/**
 * What the player does to permanents on the battlefield: tap and untap them, put counters on
 * them, and create tokens, emblems and playtest-only copies.
 *
 * Context: playtest, the engine. `BattlefieldZone.tsx` calls these through the store; the
 * store generates the ids of new tokens and copies and passes them in, so the engine stays pure.
 * Rules: tokens (CR 111.1), emblems (CR 114.1), counters (CR 122.1), copies (CR 707.1).
 * Not responsible for: moving a card on or off the battlefield (`zones.ts`), or the untap that
 * starts a turn (`turn.ts`).
 *
 * @module playtest/engine/battlefield
 */

import { pushHistory } from "./history";
import { isChoosingBottom } from "./mulligan";
import { defaultPlaytestDeps, type PlaytestDeps } from "./ports";
import type {
  BattlefieldCard,
  PlaytestEngine,
  PlaytestTokenSpec,
} from "./types";

// ─── Tap / untap ──────────────────────────────────────────────────────────
/**
 * Toggles one permanent between tapped and untapped.
 *
 * Returns the same state while a bottom choice is pending or when `cardId` is not on the
 * battlefield. The log line names the new state ("Tapped X" or "Untapped X").
 *
 * @param deps - only `clock` is read, to stamp the undo entry
 */
export function applyTap(
  state: PlaytestEngine,
  cardId: string,
  deps: PlaytestDeps = defaultPlaytestDeps
): PlaytestEngine {
  if (isChoosingBottom(state)) return state;
  const exists = state.battlefield.some((c) => c.id === cardId);
  if (!exists) return state;

  const updated = state.battlefield.map((c) =>
    c.id === cardId ? { ...c, tapped: !c.tapped } : c
  );

  const permanent = state.battlefield.find((card) => card.id === cardId);
  return pushHistory(
    state,
    deps.clock,
    { battlefield: updated },
    `${permanent?.tapped ? "Untapped" : "Tapped"} ${permanent?.name ?? "card"}`
  );
}

/**
 * Untaps every permanent at once: the untap step (CR 502.3) taken by hand, for a player who
 * skipped it or untaps through an effect.
 *
 * Always an undoable move with a log line, even when nothing was tapped. Returns the same state
 * while a bottom choice is pending.
 *
 * @param deps - only `clock` is read, to stamp the undo entry
 */
export function applyUntapAll(
  state: PlaytestEngine,
  deps: PlaytestDeps = defaultPlaytestDeps
): PlaytestEngine {
  if (isChoosingBottom(state)) return state;
  const untapped = state.battlefield.map((p) => ({ ...p, tapped: false }));
  return pushHistory(
    state,
    deps.clock,
    { battlefield: untapped },
    "Untapped all permanents"
  );
}

// ─── Card copies ─────────────────────────────────────────────────────────
/**
 * Puts a playtest-only copy of a permanent onto the battlefield, untapped and without counters:
 * the shortcut for a "create a token that's a copy" effect (CR 707.1).
 *
 * The copy is marked `isSessionCopy`, so it is not part of the saved deck and ceases to exist
 * when it leaves the battlefield (`applyMoveToZone`). Returns the same state while a bottom
 * choice is pending, when `cardId` is not on the battlefield, or when `copyId` already is.
 *
 * @param copyId - the id the store generated for the copy
 * @param deps - only `clock` is read, to stamp the undo entry
 */
export function applyCreateCardCopy(
  state: PlaytestEngine,
  cardId: string,
  copyId: string,
  deps: PlaytestDeps = defaultPlaytestDeps
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
    deps.clock,
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

/**
 * Creates a token (CR 111.1) or an emblem (CR 114.1) on the battlefield as a playtest-only
 * `BattlefieldCard`, named from the spec ("1/1 Soldier token").
 *
 * Product simplification: an emblem belongs in the command zone (CR 114.1), but the engine
 * puts it on the battlefield, where the player can see it next to the permanents it affects.
 * A token is a creature with the spec's power and toughness; unknown colour names are dropped
 * from its colour identity. Returns the same state while a bottom choice is pending or when
 * `tokenId` is already on the battlefield.
 *
 * @param tokenId - the id the store generated for the token
 * @param deps - only `clock` is read, to stamp the undo entry
 */
export function applyCreateToken(
  state: PlaytestEngine,
  token: PlaytestTokenSpec,
  tokenId: string,
  deps: PlaytestDeps = defaultPlaytestDeps
): PlaytestEngine {
  if (isChoosingBottom(state)) return state;
  if (state.battlefield.some((card) => card.id === tokenId)) return state;

  const name = [
    token.power,
    token.name,
    token.kind === "token" ? "token" : null,
  ]
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

  return pushHistory(
    state,
    deps.clock,
    {
      battlefield: [...state.battlefield, battlefieldToken],
    },
    `Created ${name}`
  );
}

// ─── Counters ─────────────────────────────────────────────────────────────
/**
 * Adds `amount` counters to a permanent, or removes them when `amount` is negative (CR 122.1).
 *
 * The engine keeps one undifferentiated count per permanent, floored at zero. The log line
 * carries `counterDelta` as evidence. Returns the same state while a bottom choice is pending
 * or when `cardId` is not on the battlefield.
 *
 * @param deps - only `clock` is read, to stamp the undo entry
 */
export function applyAddCounter(
  state: PlaytestEngine,
  cardId: string,
  amount: number,
  deps: PlaytestDeps = defaultPlaytestDeps
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
    deps.clock,
    { battlefield: updated },
    `${amount >= 0 ? "Added" : "Removed"} a counter ${amount >= 0 ? "to" : "from"} ${permanent.name}`,
    { kind: "counter", counterDelta: amount }
  );
}
