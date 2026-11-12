import { describe, expect, it } from "vitest";
import { deckImagePath, deckImageVersion } from "./deck-image";

/** A public deck as the deck page receives it, reduced to what the image prints. */
const DECK = {
  name: "Atraxa Superfriends",
  user: { name: "Kael", username: "kael" },
  cards: [
    {
      name: "Atraxa, Praetors' Voice",
      quantity: 1,
      colorIdentity: ["G", "W", "U", "B"],
      isCommander: true,
      isPartner: false,
    },
    {
      name: "Forest",
      quantity: 99,
      colorIdentity: [],
      isCommander: false,
      isPartner: false,
    },
  ],
};

describe("deckImageVersion", () => {
  it("is the same for the same printed content", () => {
    expect(deckImageVersion(DECK)).toBe(
      deckImageVersion(structuredClone(DECK))
    );
  });

  it("changes when the deck is renamed", () => {
    expect(deckImageVersion({ ...DECK, name: "Atraxa Infect" })).not.toBe(
      deckImageVersion(DECK)
    );
  });

  it("changes when the commander changes", () => {
    const [commander, ...rest] = DECK.cards;
    const swapped = {
      ...DECK,
      cards: [{ ...commander, name: "Tymna the Weaver" }, ...rest],
    };

    expect(deckImageVersion(swapped)).not.toBe(deckImageVersion(DECK));
  });

  it("changes when the card count changes", () => {
    const [commander, forest] = DECK.cards;
    const smaller = {
      ...DECK,
      cards: [commander, { ...forest, quantity: 98 }],
    };

    expect(deckImageVersion(smaller)).not.toBe(deckImageVersion(DECK));
  });

  it("changes when the author's display name changes", () => {
    const renamed = { ...DECK, user: { name: "Kael S.", username: "kael" } };

    expect(deckImageVersion(renamed)).not.toBe(deckImageVersion(DECK));
  });

  it("keeps the token of an unchanged deck from release to release (pinned)", () => {
    // A chat app caches the preview by URL: a new token for the same deck
    // makes every shared link fetch its image again.
    expect(deckImageVersion(DECK)).toBe("8g218s");
  });

  it("ignores the order the commander's colour identity is stored in", () => {
    const [commander, forest] = DECK.cards;
    const reordered = {
      ...DECK,
      cards: [{ ...commander, colorIdentity: ["U", "B", "W", "G"] }, forest],
    };

    expect(deckImageVersion(reordered)).toBe(deckImageVersion(DECK));
  });

  it("falls back to the username when the display name is blank", () => {
    const blank = { ...DECK, user: { name: "  ", username: "kael" } };
    const unnamed = { ...DECK, user: { name: null, username: "kael" } };

    expect(deckImageVersion(blank)).toBe(deckImageVersion(unnamed));
    expect(deckImageVersion(blank)).not.toBe(
      deckImageVersion({ ...DECK, user: null })
    );
  });

  it("ignores a non-commander swap the image does not print", () => {
    const [commander, forest] = DECK.cards;
    const swapped = {
      ...DECK,
      cards: [commander, { ...forest, name: "Island" }],
    };

    expect(deckImageVersion(swapped)).toBe(deckImageVersion(DECK));
  });
});

describe("deckImagePath", () => {
  it("puts the version in the query string of the deck's image path", () => {
    expect(deckImagePath("deck 1", "abc123")).toBe(
      "/og/deck/deck%201?v=abc123"
    );
  });
});
