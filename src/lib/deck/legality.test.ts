import { describe, expect, it } from "vitest";
import { judgeDeckLegality, type LegalityDeckCard } from "@/lib/deck/legality";
import type { ScryfallCard } from "@/lib/scryfall/types";

const FETCHED_AT = new Date("2026-11-09T10:00:00.000Z");

function scryfallCard(
  id: string,
  name: string,
  legalities: Record<string, string>
): ScryfallCard {
  return {
    id,
    name,
    cmc: 1,
    type_line: "Artifact",
    color_identity: [],
    legalities,
  };
}

function row(scryfallId: string, name: string, quantity = 1): LegalityDeckCard {
  return { scryfallId, name, quantity, zone: "main" };
}

describe("judgeDeckLegality", () => {
  it("reports a card Scryfall bans in the deck's format, whatever the deck row claims", () => {
    const verdict = judgeDeckLegality({
      format: "commander",
      cards: [row("sol-ring", "Sol Ring"), row("mana-crypt", "Mana Crypt")],
      scryfallCards: [
        scryfallCard("sol-ring", "Sol Ring", { commander: "legal" }),
        scryfallCard("mana-crypt", "Mana Crypt", { commander: "banned" }),
      ],
      fetchedAt: FETCHED_AT,
    });

    expect(verdict.legal).toBe(false);
    expect(verdict.violations).toEqual([
      { name: "Mana Crypt", reason: "banned" },
    ]);
    expect(verdict.cards).toEqual([
      { scryfallId: "sol-ring", name: "Sol Ring", status: "legal" },
      { scryfallId: "mana-crypt", name: "Mana Crypt", status: "banned" },
    ]);
  });

  it("reads the legality key of the deck's format, not Commander's", () => {
    const verdict = judgeDeckLegality({
      format: "modern",
      cards: [row("ponder", "Ponder", 4)],
      scryfallCards: [
        scryfallCard("ponder", "Ponder", {
          commander: "legal",
          modern: "not_legal",
        }),
      ],
      fetchedAt: FETCHED_AT,
    });

    expect(verdict.violations).toEqual([
      { name: "Ponder", reason: "not_legal" },
    ]);
  });

  it("allows one copy of a restricted card and rejects a second one in the sideboard", () => {
    const oneCopy = judgeDeckLegality({
      format: "vintage",
      cards: [row("lotus", "Black Lotus")],
      scryfallCards: [
        scryfallCard("lotus", "Black Lotus", { vintage: "restricted" }),
      ],
      fetchedAt: FETCHED_AT,
    });
    const twoCopies = judgeDeckLegality({
      format: "vintage",
      cards: [
        row("lotus", "Black Lotus"),
        { ...row("lotus-2", "Black Lotus"), zone: "sideboard" },
      ],
      scryfallCards: [
        scryfallCard("lotus", "Black Lotus", { vintage: "restricted" }),
        scryfallCard("lotus-2", "Black Lotus", { vintage: "restricted" }),
      ],
      fetchedAt: FETCHED_AT,
    });

    expect(oneCopy.legal).toBe(true);
    expect(twoCopies.violations).toEqual([
      { name: "Black Lotus", reason: "restricted_over_limit" },
    ]);
  });

  it("ignores the maybeboard, which is not part of the deck", () => {
    const verdict = judgeDeckLegality({
      format: "commander",
      cards: [{ ...row("mana-crypt", "Mana Crypt"), zone: "maybeboard" }],
      scryfallCards: [
        scryfallCard("mana-crypt", "Mana Crypt", { commander: "banned" }),
      ],
      fetchedAt: FETCHED_AT,
    });

    expect(verdict.legal).toBe(true);
    expect(verdict.cards).toEqual([]);
  });

  it("does not call a deck legal when Scryfall did not return one of its cards", () => {
    const verdict = judgeDeckLegality({
      format: "commander",
      cards: [row("missing", "Homebrew Card")],
      scryfallCards: [],
      fetchedAt: FETCHED_AT,
    });

    expect(verdict.legal).toBe(false);
    expect(verdict.violations).toEqual([
      { name: "Homebrew Card", reason: "unverified" },
    ]);
  });

  it("names Scryfall, the legality key read and the fetch time as its source", () => {
    const verdict = judgeDeckLegality({
      format: "pauper",
      cards: [],
      scryfallCards: [],
      fetchedAt: FETCHED_AT,
    });

    expect(verdict).toMatchObject({
      kind: "checked",
      format: "pauper",
      legal: true,
      source: {
        provider: "scryfall",
        legalityKey: "pauper",
        fetchedAt: "2026-11-09T10:00:00.000Z",
      },
    });
  });
});
