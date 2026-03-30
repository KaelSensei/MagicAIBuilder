import type { DeckCard } from "@/lib/deck/types";
import { randomAlphanumericId } from "@/lib/crypto-random";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DeckVersion {
  readonly id: string;
  readonly branchId: string;
  readonly cardList: readonly DeckCard[];
  readonly timestamp: Date;
  readonly message: string;
}

export interface DeckBranch {
  readonly id: string;
  readonly deckId: string;
  readonly branchName: string;
  readonly isMain: boolean;
  readonly cardList: readonly DeckCard[];
  readonly createdAt: Date;
  readonly versions: readonly DeckVersion[];
}

export interface DeckDiff {
  readonly cardsAdded: readonly DeckCard[];
  readonly cardsRemoved: readonly DeckCard[];
  readonly cardsChanged: readonly DeckCard[];
}

export interface Conflict {
  readonly scryfallId: string;
  readonly cardName: string;
  readonly targetAction: string;
  readonly sourceAction: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId(): string {
  return `${Date.now()}-${randomAlphanumericId(7)}`;
}

function cardKey(card: DeckCard): string {
  return card.scryfallId ?? card.id;
}

function cardChanged(a: DeckCard, b: DeckCard): boolean {
  return JSON.stringify({ ...a, id: undefined }) !== JSON.stringify({ ...b, id: undefined });
}

// ─── createBranch ─────────────────────────────────────────────────────────────

export function createBranch(
  deck: { id: string; name: string; cards: readonly DeckCard[] },
  branchName: string,
  description: string,
): DeckBranch {
  const branchId = generateId();
  const now = new Date();
  const snapshot: readonly DeckCard[] = [...deck.cards];

  const initialVersion: DeckVersion = {
    id: generateId(),
    branchId,
    cardList: snapshot,
    timestamp: now,
    message: description,
  };

  return {
    id: branchId,
    deckId: deck.id,
    branchName,
    isMain: branchName === "main",
    cardList: snapshot,
    createdAt: now,
    versions: [initialVersion],
  };
}

// ─── diffBranches ─────────────────────────────────────────────────────────────

export function diffBranches(branchA: DeckBranch, branchB: DeckBranch): DeckDiff {
  const mapA = new Map<string, DeckCard>(branchA.cardList.map((c) => [cardKey(c), c]));
  const mapB = new Map<string, DeckCard>(branchB.cardList.map((c) => [cardKey(c), c]));

  const cardsAdded: DeckCard[] = [];
  const cardsRemoved: DeckCard[] = [];
  const cardsChanged: DeckCard[] = [];

  for (const [key, cardInB] of mapB) {
    const cardInA = mapA.get(key);
    if (cardInA === undefined) {
      cardsAdded.push(cardInB);
    } else if (cardChanged(cardInA, cardInB)) {
      cardsChanged.push(cardInB);
    }
  }

  for (const [key, cardInA] of mapA) {
    if (!mapB.has(key)) {
      cardsRemoved.push(cardInA);
    }
  }

  return { cardsAdded, cardsRemoved, cardsChanged };
}

// ─── detectConflicts ──────────────────────────────────────────────────────────

/**
 * Detects conflicts between two branches that diverged from a common ancestor.
 * Since we don't track a common ancestor here, we compare changed cards in both
 * branches: a conflict occurs when the same scryfallId was modified differently
 * in both branches (i.e., both differ from each other but are both non-identical).
 */
export function detectConflicts(branchA: DeckBranch, branchB: DeckBranch): Conflict[] {
  const mapA = new Map<string, DeckCard>(branchA.cardList.map((c) => [cardKey(c), c]));
  const mapB = new Map<string, DeckCard>(branchB.cardList.map((c) => [cardKey(c), c]));

  const conflicts: Conflict[] = [];

  for (const [key, cardInA] of mapA) {
    const cardInB = mapB.get(key);
    if (cardInB !== undefined && cardChanged(cardInA, cardInB)) {
      conflicts.push({
        scryfallId: key,
        cardName: cardInA.name,
        targetAction: `quantity:${cardInA.quantity}`,
        sourceAction: `quantity:${cardInB.quantity}`,
      });
    }
  }

  return conflicts;
}

// ─── mergeBranch ──────────────────────────────────────────────────────────────

export function mergeBranch(
  target: DeckBranch,
  source: DeckBranch,
): { merged: DeckBranch; conflicts: Conflict[] } {
  const conflicts = detectConflicts(target, source);

  const targetMap = new Map<string, DeckCard>(target.cardList.map((c) => [cardKey(c), c]));
  const conflictIds = new Set(conflicts.map((c) => c.scryfallId));

  // Apply source changes: add new cards, update non-conflicting changes
  const mergedMap = new Map<string, DeckCard>(targetMap);
  for (const card of source.cardList) {
    const key = cardKey(card);
    if (!conflictIds.has(key)) {
      mergedMap.set(key, card);
    }
  }

  // Remove cards present in target but absent in source (and not conflicting)
  for (const [key] of targetMap) {
    if (!source.cardList.some((c) => cardKey(c) === key) && !conflictIds.has(key)) {
      mergedMap.delete(key);
    }
  }

  const mergedCardList: readonly DeckCard[] = Array.from(mergedMap.values());

  const mergeVersion: DeckVersion = {
    id: generateId(),
    branchId: target.id,
    cardList: mergedCardList,
    timestamp: new Date(),
    message: `Merge branch '${source.branchName}' into '${target.branchName}'`,
  };

  const merged: DeckBranch = {
    ...target,
    cardList: mergedCardList,
    versions: [...target.versions, mergeVersion],
  };

  return { merged, conflicts };
}

// ─── revertToVersion ──────────────────────────────────────────────────────────

export function revertToVersion(branch: DeckBranch, versionIndex: number): DeckBranch {
  if (versionIndex < 0 || versionIndex >= branch.versions.length) {
    throw new RangeError(
      `versionIndex ${versionIndex} is out of bounds (0–${branch.versions.length - 1})`,
    );
  }

  const targetVersion = branch.versions[versionIndex];

  const revertVersion: DeckVersion = {
    id: generateId(),
    branchId: branch.id,
    cardList: targetVersion.cardList,
    timestamp: new Date(),
    message: `Revert to version ${versionIndex}`,
  };

  return {
    ...branch,
    cardList: targetVersion.cardList,
    versions: [...branch.versions, revertVersion],
  };
}
