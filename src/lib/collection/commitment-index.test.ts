import { describe, expect, it } from "vitest";

import { commitmentIndex } from "./commitment-index";

const SOL = "sol-ring";

describe("commitmentIndex", () => {
  it("counts main-deck copies as committed and the rest of the owned printing as free", () => {
    const index = commitmentIndex(
      [
        row("deck-a", "Artifacts", SOL, 2, "main"),
        row("deck-b", "Spells", SOL, 1, "sideboard"),
      ],
      [{ scryfallId: SOL, quantity: 3 }]
    );

    expect(index).toEqual({
      kind: "indexed",
      printings: [
        {
          scryfallId: SOL,
          owned: 3,
          committed: 2,
          free: 1,
          decks: [{ deckId: "deck-a", deckName: "Artifacts", quantity: 2 }],
        },
      ],
    });
  });

  it("commits the command zone and leaves Considering, the sideboard and a companion free", () => {
    const index = commitmentIndex(
      [
        { ...row("deck-a", "Pod", "atraxa", 1, "main"), isCommander: true },
        { ...row("deck-a", "Pod", "thrasios", 1, "main"), isPartner: true },
        { ...row("deck-a", "Pod", "lurrus", 1, "main"), category: "companion" },
        row("deck-a", "Pod", "negate", 2, "sideboard"),
        row("deck-a", "Pod", "ponder", 1, "maybeboard"),
      ],
      []
    );

    expect(index).toEqual({
      kind: "indexed",
      printings: [
        printing("atraxa", 0, 1, [
          { deckId: "deck-a", deckName: "Pod", quantity: 1 },
        ]),
        printing("thrasios", 0, 1, [
          { deckId: "deck-a", deckName: "Pod", quantity: 1 },
        ]),
      ],
    });
  });

  it("leaves one owned copy used by three decks free in none of them", () => {
    const index = commitmentIndex(
      [
        row("deck-c", "C", SOL, 1, "main"),
        row("deck-a", "A", SOL, 1, "main"),
        row("deck-b", "B", SOL, 1, "main"),
      ],
      [
        { scryfallId: SOL, quantity: 1 },
        { scryfallId: SOL, quantity: 0 },
      ]
    );

    expect(index).toEqual({
      kind: "indexed",
      printings: [
        printing("sol-ring", 1, 3, [
          { deckId: "deck-a", deckName: "A", quantity: 1 },
          { deckId: "deck-b", deckName: "B", quantity: 1 },
          { deckId: "deck-c", deckName: "C", quantity: 1 },
        ]),
      ],
    });
  });

  it("adds foil and non-foil rows of one printing into the owned count", () => {
    const index = commitmentIndex(
      [],
      [
        { scryfallId: SOL, quantity: 1 },
        { scryfallId: SOL, quantity: 2 },
      ]
    );

    expect(index).toEqual({
      kind: "indexed",
      printings: [printing(SOL, 3, 0, [])],
    });
  });

  it("rejects a copy count that is negative or not a whole number and reports no zero", () => {
    expect(
      commitmentIndex(
        [row("deck-a", "A", SOL, -1, "main")],
        [{ scryfallId: SOL, quantity: 4 }]
      )
    ).toEqual({ kind: "rejected", reason: "not-a-copy-count" });
    expect(
      commitmentIndex(
        [row("deck-a", "A", SOL, 1, "main")],
        [{ scryfallId: SOL, quantity: 1.5 }]
      )
    ).toEqual({ kind: "rejected", reason: "not-a-copy-count" });
  });

  it("does not change the deck or collection rows it was given", () => {
    const decks = [row("deck-a", "A", SOL, 1, "main")];
    const collection = [{ scryfallId: SOL, quantity: 2 }];
    const decksBefore = [{ ...decks[0] }];
    const collectionBefore = [{ ...collection[0] }];

    const index = commitmentIndex(decks, collection);

    expect(decks).toEqual(decksBefore);
    expect(collection).toEqual(collectionBefore);
    expect(index).toMatchObject({ kind: "indexed" });
  });
});

function row(
  deckId: string,
  deckName: string,
  scryfallId: string,
  quantity: number,
  zone: string
) {
  return {
    deckId,
    deckName,
    scryfallId,
    quantity,
    zone,
    isCommander: false,
    isPartner: false,
    category: "other",
  };
}

function printing(
  scryfallId: string,
  owned: number,
  committed: number,
  decks: readonly { deckId: string; deckName: string; quantity: number }[]
) {
  return {
    scryfallId,
    owned,
    committed,
    free: Math.max(0, owned - committed),
    decks,
  };
}
