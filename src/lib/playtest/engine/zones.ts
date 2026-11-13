/**
 * Moving one card between the six zones of a goldfish game.
 *
 * Context: playtest, the engine. Every drag, "send to graveyard", "cast from the command
 * zone" or "put back on top" in `components/playtest/` is one `applyMoveToZone`. A card
 * entering the battlefield becomes a `BattlefieldCard`; one leaving it drops that state.
 * Rules: only a commander may enter the command zone (CR 903.9).
 * Not responsible for: the draw (`turn.ts`), the mulligan's shuffle (`mulligan.ts`) or what
 * happens to a permanent that stays on the battlefield (`battlefield.ts`).
 *
 * @module playtest/engine/zones
 */

import type { DeckCard } from "@/lib/deck/types";
import { pushHistory } from "./history";
import { isChoosingBottom } from "./mulligan";
import { defaultPlaytestDeps, type PlaytestDeps } from "./ports";
import type {
  BattlefieldCard,
  CardZone,
  PlaytestEngine,
  PlaytestEnginePatch,
} from "./types";

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
): {
  readonly card: DeckCard | BattlefieldCard;
  readonly updates: PlaytestEnginePatch;
} | null {
  switch (zone) {
    case "hand": {
      const taken = takeCard(state.hand, cardId);
      return taken ? { card: taken.card, updates: { hand: taken.rest } } : null;
    }
    case "library": {
      const taken = takeCard(state.library, cardId);
      return taken
        ? { card: taken.card, updates: { library: taken.rest } }
        : null;
    }
    case "battlefield": {
      const taken = takeCard(state.battlefield, cardId);
      return taken
        ? { card: taken.card, updates: { battlefield: taken.rest } }
        : null;
    }
    case "graveyard": {
      const taken = takeCard(state.graveyard, cardId);
      return taken
        ? { card: taken.card, updates: { graveyard: taken.rest } }
        : null;
    }
    case "exile": {
      const taken = takeCard(state.exile, cardId);
      return taken
        ? { card: taken.card, updates: { exile: taken.rest } }
        : null;
    }
    case "command": {
      const taken = takeCard(state.commandZone, cardId);
      return taken
        ? { card: taken.card, updates: { commandZone: taken.rest } }
        : null;
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
  return (
    "isSessionCopy" in card &&
    card.isSessionCopy === true &&
    destination !== "battlefield"
  );
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
  if (from === "command" && to === "battlefield")
    return `Cast ${name} from the command zone`;
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
 * @param deps - only `clock` is read, to stamp the undo entry
 * @returns the next engine state
 */
export function applyMoveToZone(
  state: PlaytestEngine,
  cardId: string,
  from: CardZone,
  to: CardZone,
  deps: PlaytestDeps = defaultPlaytestDeps
): PlaytestEngine {
  if (isChoosingBottom(state)) return state;
  if (to === "command" && !state.commanderIds.includes(cardId)) return state;
  const removed = takeFromZone(state, from, cardId);
  if (!removed) return state;

  const { card, updates } = removed;
  if (isSessionCopyLeavingPlay(card, to)) {
    return pushHistory(
      state,
      deps.clock,
      updates,
      `Removed ${card.name} from the battlefield`
    );
  }

  placeInZone(state, updates, to, card);
  const description = describeMove(card.name, from, to);
  if (from === "library") {
    return pushHistory(state, deps.clock, updates, description, {
      kind: "cardSeen",
    });
  }
  return pushHistory(state, deps.clock, updates, description);
}

// ─── Helpers ──────────────────────────────────────────────────────────────
function toDeckCard(card: DeckCard | BattlefieldCard): DeckCard {
  return card;
}

function toBattlefieldCard(card: DeckCard | BattlefieldCard): BattlefieldCard {
  return { ...card, tapped: false, counters: 0 };
}
