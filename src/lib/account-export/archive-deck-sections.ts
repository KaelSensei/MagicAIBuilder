/**
 * The deckbuilding sections of the account archive: decks with their cards,
 * snapshots and plain text, folders, and card packages (I-38 requirement 7.1
 * and 7.2).
 *
 * Identity context, pure. Every field is copied by name, never spread from a
 * row, so the archive holds exactly what `archive-schema.ts` publishes.
 *
 * @module account-export/archive-deck-sections
 */
import type { AccountArchive } from "./archive-schema";
import type { AccountRows, RowOf } from "./account-row-selects";
import { deckPlainText } from "./deck-plain-text";

/** @returns the rows grouped by the id of the row that owns them */
function groupBy<Item>(
  items: readonly Item[],
  keyOf: (item: Item) => string
): ReadonlyMap<string, readonly Item[]> {
  const groups = new Map<string, Item[]>();
  for (const item of items) {
    const key = keyOf(item);
    const group = groups.get(key);
    if (group) group.push(item);
    else groups.set(key, [item]);
  }
  return groups;
}

/**
 * @param rows - The account's rows; reads its decks, their cards and snapshots.
 * @returns Each deck with its cards, snapshots and plain-text list.
 */
export function decksOf(rows: AccountRows): AccountArchive["decks"] {
  const cardsByDeck = groupBy(rows.deckCards, (card) => card.deckId);
  const snapshotsByDeck = groupBy(rows.snapshots, (shot) => shot.deckId);
  return rows.decks.map((deck) => {
    const cards = cardsByDeck.get(deck.id) ?? [];
    return {
      id: deck.id,
      name: deck.name,
      description: deck.description,
      tags: [...deck.tags],
      format: deck.format,
      targetBracket: deck.targetBracket,
      manualBracket: deck.manualBracket,
      budget: deck.budget,
      pairingType: deck.pairingType,
      isPublic: deck.isPublic,
      shareEnabled: deck.shareEnabled,
      seekingFeedback: deck.seekingFeedback,
      feedbackQuestion: deck.feedbackQuestion,
      isAIGenerated: deck.isAIGenerated,
      forkedFromDeckId: deck.forkedFromDeckId,
      forkedFromDeckName: deck.forkedFromDeckName,
      forkedFromUserName: deck.forkedFromUserName,
      folderId: deck.folderId,
      createdAt: deck.createdAt.toISOString(),
      updatedAt: deck.updatedAt.toISOString(),
      cards: cards.map(deckCardOf),
      snapshots: (snapshotsByDeck.get(deck.id) ?? []).map(snapshotOf),
      plainText: deckPlainText(cards),
    };
  });
}

function deckCardOf(
  card: RowOf<"deckCards">
): AccountArchive["decks"][number]["cards"][number] {
  return {
    scryfallId: card.scryfallId,
    name: card.name,
    quantity: card.quantity,
    zone: card.zone,
    category: card.category,
    isCommander: card.isCommander,
    isPartner: card.isPartner,
    notes: card.notes,
  };
}

function snapshotOf(
  snapshot: RowOf<"snapshots">
): AccountArchive["decks"][number]["snapshots"][number] {
  return {
    id: snapshot.id,
    name: snapshot.name,
    commander: snapshot.commander,
    cardCount: snapshot.cardCount,
    cardList: snapshot.cardList,
    createdAt: snapshot.createdAt.toISOString(),
  };
}

/** @returns a deck folder or a public deck folder, which share their columns */
export function folderOf(
  folder: RowOf<"deckFolders">
): AccountArchive["deckFolders"][number] {
  return {
    id: folder.id,
    name: folder.name,
    createdAt: folder.createdAt.toISOString(),
    updatedAt: folder.updatedAt.toISOString(),
  };
}

/**
 * @param rows - The account's rows; reads its packages and their cards.
 * @returns Each card package the account authored, with its cards.
 */
export function cardPackagesOf(
  rows: AccountRows
): AccountArchive["cardPackages"] {
  const cardsByPackage = groupBy(rows.packageCards, (card) => card.packageId);
  return rows.cardPackages.map((cardPackage) => ({
    id: cardPackage.id,
    name: cardPackage.name,
    description: cardPackage.description,
    category: cardPackage.category,
    isPublic: cardPackage.isPublic,
    createdAt: cardPackage.createdAt.toISOString(),
    updatedAt: cardPackage.updatedAt.toISOString(),
    cards: (cardsByPackage.get(cardPackage.id) ?? []).map((card) => ({
      scryfallId: card.scryfallId,
      name: card.name,
      quantity: card.quantity,
    })),
  }));
}
