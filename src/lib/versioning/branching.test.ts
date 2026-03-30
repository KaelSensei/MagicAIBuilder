import { describe, it, expect } from "vitest";
import type { DeckCard } from "@/lib/deck/types";
import {
  createBranch,
  diffBranches,
  mergeBranch,
  detectConflicts,
  revertToVersion,
} from "./branching";
import type { DeckBranch, DeckDiff, Conflict } from "./branching";

// ─── Fixtures ────────────────────────────────────────────────────────────────

function makeCard(overrides: Partial<DeckCard> & { scryfallId: string; name: string }): DeckCard {
  const { scryfallId, name, quantity, ...rest } = overrides;
  return {
    id: scryfallId,
    scryfallId,
    name,
    manaCost: "{1}",
    cmc: 1,
    typeLine: "Creature",
    oracleText: "",
    colorIdentity: [],
    isGameChanger: false,
    isBanned: false,
    price: null,
    imageUri: "",
    artCropUri: "",
    category: "creature",
    quantity: quantity ?? 1,
    zone: "main",
    ...rest,
  };
}

const cardA = makeCard({ scryfallId: "aaa", name: "Lightning Bolt" });
const cardB = makeCard({ scryfallId: "bbb", name: "Counterspell" });
const cardC = makeCard({ scryfallId: "ccc", name: "Sol Ring" });
const cardAChanged = makeCard({ scryfallId: "aaa", name: "Lightning Bolt", quantity: 3 });

const baseDeck = {
  id: "deck-1",
  name: "Test Deck",
  cards: [cardA, cardB],
};

// ─── createBranch ─────────────────────────────────────────────────────────────

describe("createBranch", () => {
  it("creates a branch with correct shape", () => {
    const branch = createBranch(baseDeck, "main", "Initial version");

    expect(branch.deckId).toBe("deck-1");
    expect(branch.branchName).toBe("main");
    expect(branch.isMain).toBe(true);
    expect(branch.cardList).toEqual([cardA, cardB]);
    expect(branch.versions).toHaveLength(1);
    expect(branch.versions[0].message).toBe("Initial version");
    expect(branch.versions[0].branchId).toBe(branch.id);
    expect(typeof branch.id).toBe("string");
    expect(branch.createdAt).toBeInstanceOf(Date);
  });

  it("marks non-main branches correctly", () => {
    const branch = createBranch(baseDeck, "feature/add-lands", "New branch");
    expect(branch.isMain).toBe(false);
  });

  it("creates a unique id each time", () => {
    const b1 = createBranch(baseDeck, "b1", "desc");
    const b2 = createBranch(baseDeck, "b2", "desc");
    expect(b1.id).not.toBe(b2.id);
  });

  it("cardList is a snapshot (not reference)", () => {
    const cards = [cardA, cardB];
    const deck = { id: "d", name: "D", cards };
    const branch = createBranch(deck, "main", "init");
    // modifying original array should not affect branch
    cards.push(cardC);
    expect(branch.cardList).toHaveLength(2);
  });
});

// ─── diffBranches ─────────────────────────────────────────────────────────────

describe("diffBranches", () => {
  const branchA = createBranch(baseDeck, "main", "init");
  const deckB = { id: "deck-1", name: "Test Deck", cards: [cardA, cardC] };
  const branchB = createBranch(deckB, "feature", "feature branch");

  it("detects added cards", () => {
    const diff: DeckDiff = diffBranches(branchA, branchB);
    const addedIds = diff.cardsAdded.map((c) => c.scryfallId);
    expect(addedIds).toContain("ccc");
  });

  it("detects removed cards", () => {
    const diff: DeckDiff = diffBranches(branchA, branchB);
    const removedIds = diff.cardsRemoved.map((c) => c.scryfallId);
    expect(removedIds).toContain("bbb");
  });

  it("detects no changes when branches are identical", () => {
    const diff = diffBranches(branchA, branchA);
    expect(diff.cardsAdded).toHaveLength(0);
    expect(diff.cardsRemoved).toHaveLength(0);
    expect(diff.cardsChanged).toHaveLength(0);
  });

  it("detects changed cards (same scryfallId, different quantity)", () => {
    const deckC = { id: "deck-1", name: "Test Deck", cards: [cardAChanged, cardB] };
    const branchC = createBranch(deckC, "feature-qty", "qty change");
    const diff = diffBranches(branchA, branchC);
    const changedIds = diff.cardsChanged.map((c) => c.scryfallId);
    expect(changedIds).toContain("aaa");
    expect(diff.cardsAdded).toHaveLength(0);
    expect(diff.cardsRemoved).toHaveLength(0);
  });
});

// ─── detectConflicts ──────────────────────────────────────────────────────────

describe("detectConflicts", () => {
  it("returns empty array when no conflicts", () => {
    const branchA = createBranch(baseDeck, "main", "init");
    const deckB = { id: "deck-1", name: "D", cards: [cardA, cardB, cardC] };
    const branchB = createBranch(deckB, "feature", "add sol ring");
    const conflicts: Conflict[] = detectConflicts(branchA, branchB);
    expect(conflicts).toHaveLength(0);
  });

  it("detects conflict when same card changed differently", () => {
    // branchA modifies cardA quantity to 2
    const deckA2 = { id: "deck-1", name: "D", cards: [makeCard({ scryfallId: "aaa", name: "Lightning Bolt", quantity: 2 }), cardB] };
    const branchA2 = createBranch(deckA2, "feature-a", "qty 2");

    // branchB2 modifies cardA quantity to 3
    const deckB2 = { id: "deck-1", name: "D", cards: [makeCard({ scryfallId: "aaa", name: "Lightning Bolt", quantity: 3 }), cardB] };
    const branchB2 = createBranch(deckB2, "feature-b", "qty 3");

    const conflicts = detectConflicts(branchA2, branchB2);
    expect(conflicts.length).toBeGreaterThan(0);
    expect(conflicts[0].scryfallId).toBe("aaa");
    expect(conflicts[0].cardName).toBe("Lightning Bolt");
  });
});

// ─── mergeBranch ──────────────────────────────────────────────────────────────

describe("mergeBranch", () => {
  it("merges source cards into target without conflicts", () => {
    const branchTarget = createBranch(baseDeck, "main", "init");
    const deckSource = { id: "deck-1", name: "D", cards: [cardA, cardB, cardC] };
    const branchSource = createBranch(deckSource, "feature", "add sol ring");

    const { merged, conflicts } = mergeBranch(branchTarget, branchSource);
    expect(conflicts).toHaveLength(0);
    const mergedIds = merged.cardList.map((c) => c.scryfallId);
    expect(mergedIds).toContain("ccc");
  });

  it("returns conflicts when same card changed in both branches", () => {
    const deckTarget = { id: "deck-1", name: "D", cards: [makeCard({ scryfallId: "aaa", name: "Lightning Bolt", quantity: 2 }), cardB] };
    const branchTarget = createBranch(deckTarget, "main", "qty 2");

    const deckSource = { id: "deck-1", name: "D", cards: [makeCard({ scryfallId: "aaa", name: "Lightning Bolt", quantity: 3 }), cardB] };
    const branchSource = createBranch(deckSource, "feature", "qty 3");

    const { merged: _merged, conflicts } = mergeBranch(branchTarget, branchSource);
    expect(conflicts.length).toBeGreaterThan(0);
  });

  it("adds a new version entry after merge", () => {
    const branchTarget = createBranch(baseDeck, "main", "init");
    const deckSource = { id: "deck-1", name: "D", cards: [cardA, cardB, cardC] };
    const branchSource = createBranch(deckSource, "feature", "add sol ring");

    const { merged } = mergeBranch(branchTarget, branchSource);
    expect(merged.versions.length).toBeGreaterThan(branchTarget.versions.length);
  });
});

// ─── revertToVersion ──────────────────────────────────────────────────────────

describe("revertToVersion", () => {
  it("reverts branch to a previous version's cardList", () => {
    const branch = createBranch(baseDeck, "main", "init");
    // Simulate a second version by creating a new branch with updated cards
    const deckV2 = { id: "deck-1", name: "D", cards: [cardA, cardB, cardC] };
    const branchV2 = createBranch(deckV2, "main", "add sol ring");
    // Manually compose a branch with 2 versions
    const twoVersionBranch: DeckBranch = {
      ...branchV2,
      versions: [...branch.versions, ...branchV2.versions],
    };

    const reverted = revertToVersion(twoVersionBranch, 0);
    const revertedIds = reverted.cardList.map((c) => c.scryfallId);
    expect(revertedIds).not.toContain("ccc");
    expect(revertedIds).toContain("aaa");
    expect(revertedIds).toContain("bbb");
  });

  it("returns current state when reverting to last version", () => {
    const branch = createBranch(baseDeck, "main", "init");
    const reverted = revertToVersion(branch, 0);
    expect(reverted.cardList).toEqual(branch.versions[0].cardList);
  });

  it("throws when versionIndex is out of bounds", () => {
    const branch = createBranch(baseDeck, "main", "init");
    expect(() => revertToVersion(branch, 99)).toThrow();
  });
});
