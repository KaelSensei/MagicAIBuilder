import { describe, expect, it } from "vitest";
import { ownedPool } from "./owned-pool";

describe("ownedPool (I-76 slice 4)", () => {
  it("offers an owned card with its owned count, owned but maybe in another deck", () => {
    const pool = ownedPool({
      collection: [{ name: "Sol Ring", quantity: 2 }],
      deck: [],
    });

    expect(pool).toEqual([
      {
        cardKey: "sol ring",
        name: "Sol Ring",
        owned: 2,
        availability: "ownedMayBeInAnotherDeck",
      },
    ]);
  });

  it("counts every printing and finish of one card once, under its Oracle name", () => {
    const pool = ownedPool({
      collection: [
        { name: "Sol Ring", quantity: 1 },
        { name: "sol ring", quantity: 2 },
        { name: "Esika, God of the Tree // The Prismatic Bridge", quantity: 1 },
        { name: "Esika, God of the Tree", quantity: 1 },
      ],
      deck: [],
    });

    expect(pool.map(({ cardKey, owned }) => ({ cardKey, owned }))).toEqual([
      { cardKey: "esika, god of the tree", owned: 2 },
      { cardKey: "sol ring", owned: 3 },
    ]);
  });

  it("gives the same pool whatever order the collection rows arrive in", () => {
    const rows = [
      { name: "Esika, God of the Tree", quantity: 1 },
      { name: "Esika, God of the Tree // The Prismatic Bridge", quantity: 1 },
      { name: "sol ring", quantity: 1 },
      { name: "Sol Ring", quantity: 1 },
    ];

    const forward = ownedPool({ collection: rows, deck: [] });
    const backward = ownedPool({ collection: [...rows].reverse(), deck: [] });

    expect(backward).toEqual(forward);
    expect(forward.map(({ name }) => name)).toEqual([
      "Esika, God of the Tree // The Prismatic Bridge",
      "Sol Ring",
    ]);
  });

  it("marks an owned card the deck holds in Considering, the player's own shortlist", () => {
    const pool = ownedPool({
      collection: [
        { name: "Rhystic Study", quantity: 1 },
        { name: "Sol Ring", quantity: 1 },
      ],
      deck: [{ name: "Rhystic Study", zone: "maybeboard" }],
    });

    expect(
      pool.map(({ name, availability }) => ({ name, availability }))
    ).toEqual([
      { name: "Rhystic Study", availability: "considering" },
      { name: "Sol Ring", availability: "ownedMayBeInAnotherDeck" },
    ]);
  });

  it("keeps a Considering card the player does not own out of the owned-only pool", () => {
    const pool = ownedPool({
      collection: [],
      deck: [{ name: "Rhystic Study", zone: "maybeboard" }],
    });

    expect(pool).toEqual([]);
  });

  it("does not mark a card the deck holds in the main deck or the sideboard", () => {
    const pool = ownedPool({
      collection: [
        { name: "Sol Ring", quantity: 1 },
        { name: "Pyroblast", quantity: 1 },
      ],
      deck: [
        { name: "Sol Ring", zone: "main" },
        { name: "Pyroblast", zone: "sideboard" },
      ],
    });

    expect(pool.map(({ availability }) => availability)).toEqual([
      "ownedMayBeInAnotherDeck",
      "ownedMayBeInAnotherDeck",
    ]);
  });

  it("leaves out a collection row that holds no copy", () => {
    const pool = ownedPool({
      collection: [{ name: "Sol Ring", quantity: 0 }],
      deck: [],
    });

    expect(pool).toEqual([]);
  });
});
