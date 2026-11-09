/**
 * Deck versions: which saved snapshot, if any, holds the deck as it is now.
 *
 * A recorded playtest is filed under a deck snapshot so the before/after
 * comparison can group runs by the version they were played on. Two card lists
 * are the same version when they hold the same cards in the same quantities and
 * zones, with the same commander and partner. Printing, category, notes and
 * price are presentation: changing them does not change how the deck plays, so
 * it does not start a new version.
 *
 * @module deck/deck-version
 */

import type { Prisma } from "@prisma/client";

import { toJsonPayload } from "@/lib/api/json-payload";
import { restoredDeckCards } from "./snapshot-restore";

/** The card columns that decide whether two deck lists play the same. */
export interface DeckVersionCard {
  readonly name: string;
  readonly quantity: number;
  readonly zone: string;
  readonly isCommander: boolean;
  readonly isPartner: boolean;
}

/** A stored snapshot, reduced to what version matching reads. */
export interface VersionedSnapshot {
  readonly id: string;
  readonly cardList: unknown;
}

/** A deck as snapshot capture reads it: its saved card rows and commander id. */
export interface CapturableDeck {
  readonly commanderId: string | null;
  readonly cards: readonly DeckVersionCard[];
}

/** The columns of a new `DeckSnapshot` that describe its card list. */
export interface SnapshotContent {
  readonly cardList: Prisma.InputJsonValue;
  readonly commander: string | null;
  readonly cardCount: number;
}

/**
 * Totals copies per card identity. Rows of the same card in the same zone and
 * role are added together, so two printings of one basic land count as one card.
 *
 * @param cards - Card rows of one deck list.
 * @returns Copies per `[zone, isCommander, isPartner, name]` key.
 */
function versionEntries(
  cards: readonly DeckVersionCard[]
): ReadonlyMap<string, number> {
  const entries = new Map<string, number>();
  for (const card of cards) {
    const key = JSON.stringify([
      card.zone,
      card.isCommander,
      card.isPartner,
      card.name,
    ]);
    entries.set(key, (entries.get(key) ?? 0) + card.quantity);
  }
  return entries;
}

/**
 * @param left - Copies per card of one list.
 * @param right - Copies per card of the other list.
 * @returns Whether both lists hold exactly the same copies.
 */
function sameEntries(
  left: ReadonlyMap<string, number>,
  right: ReadonlyMap<string, number>
): boolean {
  if (left.size !== right.size) return false;
  for (const [key, copies] of left) {
    if (right.get(key) !== copies) return false;
  }
  return true;
}

/**
 * Reads a stored snapshot list the way restore does, so a legacy snapshot
 * without zones compares as a main-deck list.
 *
 * @param deckId - Deck that owns the snapshot.
 * @param cardList - `DeckSnapshot.cardList` JSON.
 * @returns Copies per card, or null when the list cannot be read; an unreadable
 *   snapshot cannot be shown to hold any deck, so it never matches.
 */
function snapshotEntries(
  deckId: string,
  cardList: unknown
): ReadonlyMap<string, number> | null {
  try {
    return versionEntries(restoredDeckCards(deckId, cardList));
  } catch {
    return null;
  }
}

/**
 * Finds the snapshot that holds the same deck version as `cards`.
 *
 * @param deckId - Deck that owns the snapshots.
 * @param cards - The deck's current card rows.
 * @param snapshots - Candidate snapshots, newest first.
 * @returns The id of the newest matching snapshot, or null when none matches.
 */
export function findSnapshotOfVersion(
  deckId: string,
  cards: readonly DeckVersionCard[],
  snapshots: readonly VersionedSnapshot[]
): string | null {
  const current = versionEntries(cards);
  for (const snapshot of snapshots) {
    const stored = snapshotEntries(deckId, snapshot.cardList);
    if (stored && sameEntries(current, stored)) return snapshot.id;
  }
  return null;
}

/**
 * Copies a deck's saved cards into new snapshot columns.
 *
 * The whole card row is stored, not only the version fields, so a restore can
 * rebuild printings, categories and notes: pass the full `DeckCard` rows.
 *
 * @param deck - The deck with its saved card rows.
 * @returns The card list, commander label and row count for `deckSnapshot.create`.
 */
export function snapshotContent(deck: CapturableDeck): SnapshotContent {
  const commanderCard = deck.cards.find((card) => card.isCommander);
  const partnerCard = deck.cards.find((card) => card.isPartner);
  return {
    cardList: toJsonPayload(deck.cards),
    commander:
      commanderCard?.name ?? partnerCard?.name ?? deck.commanderId ?? null,
    cardCount: deck.cards.length,
  };
}
