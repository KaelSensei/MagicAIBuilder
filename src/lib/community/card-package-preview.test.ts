import { describe, expect, it } from "vitest";
import type { DeckCard } from "@/lib/deck/types";
import { aDeckCard } from "@/test/builders/card";
import { packagePreviewContextOf, previewCardPackage } from "./card-package-preview";

/** A deck with no commander whose rows all sit in the main deck. */
function mainDeck(...cards: readonly { readonly name: string; readonly quantity: number }[]) {
  return { commander: null, partner: null, cards: cards.map((card) => ({ ...card, zone: "main" as const })) };
}

const context = {
  format: "commander" as const,
  commanderColorIdentity: ["U", "B"],
  deck: mainDeck({ name: "Counterspell", quantity: 1 }),
};

describe("previewCardPackage", () => {
  it("does not reserve copies for a rejected oversized package row", () => {
    const card = { scryfallId: "oversized", name: "Counterspell", quantity: 5, colorIdentity: ["U"], isBanned: false, isBasicLand: false };
    const preview = previewCardPackage([card, { ...card, scryfallId: "valid-printing", quantity: 1 }], {
      ...context, format: "modern", deck: mainDeck({ name: "Counterspell", quantity: 3 }),
    });
    expect(preview.cards.map((row) => row.status)).toEqual(["blocked", "ready"]);
    expect(preview.readyCount).toBe(1);
  });

  it("does not reserve singleton capacity for a banned printing", () => {
    const card = { scryfallId: "banned", name: "Blue Spell", quantity: 1, colorIdentity: ["U"], isBanned: true, isBasicLand: false };
    const preview = previewCardPackage([card, { ...card, scryfallId: "legal", isBanned: false }], {
      ...context, deck: mainDeck(),
    });
    expect(preview.cards.map((row) => row.status)).toEqual(["blocked", "ready"]);
  });

  it("blocks package quantities above a non-singleton format copy limit", () => {
    const preview = previewCardPackage([
      { scryfallId: "spell", name: "Counterspell", quantity: 5, colorIdentity: ["U"], isBanned: false, isBasicLand: false },
    ], { ...context, format: "modern", deck: mainDeck() });
    expect(preview.cards[0]?.status).toBe("blocked");
    expect(preview.cards[0]?.issues).toContainEqual({ kind: "copyLimit", message: "Counterspell exceeds the 4-copy limit" });
  });

  it("counts existing copies and different package printings against the format limit", () => {
    const card = { scryfallId: "spell", name: "Counterspell", quantity: 2, colorIdentity: ["U"], isBanned: false, isBasicLand: false };
    const preview = previewCardPackage([card, { ...card, scryfallId: "other-printing", quantity: 1 }], {
      ...context, format: "modern", deck: mainDeck({ name: "Counterspell", quantity: 2 }),
    });
    expect(preview.cards[0]?.status).toBe("ready");
    expect(preview.cards[1]?.status).toBe("blocked");
    expect(preview.cards[1]?.issues).toContainEqual({ kind: "copyLimit", message: "Counterspell exceeds the 4-copy limit" });
  });

  it("allows capped multiples up to their existing card-specific limit", () => {
    const preview = previewCardPackage([
      { scryfallId: "dwarves", name: "Seven Dwarves", quantity: 4, colorIdentity: ["R"], isBanned: false, isBasicLand: false },
    ], { ...context, commanderColorIdentity: ["R"], deck: mainDeck({ name: "Seven Dwarves", quantity: 3 }) });
    expect(preview.cards[0]?.status).toBe("ready");
  });

  it("blocks capped multiples once existing and package quantities exceed the cap", () => {
    const card = { scryfallId: "dwarves", name: "Seven Dwarves", quantity: 3, colorIdentity: ["R"], isBanned: false, isBasicLand: false };
    const preview = previewCardPackage([card, { ...card, scryfallId: "other-printing" }], {
      ...context, commanderColorIdentity: ["R"], deck: mainDeck({ name: "Seven Dwarves", quantity: 2 }),
    });
    expect(preview.cards[0]?.status).toBe("ready");
    expect(preview.cards[1]?.issues).toContainEqual({ kind: "copyLimit", message: "Seven Dwarves exceeds the 7-copy limit" });
  });

  it("reports banned, color identity, and singleton violations per card", () => {
    const preview = previewCardPackage(
      [
        { scryfallId: "1", name: "Counterspell", quantity: 1, colorIdentity: ["U"], isBanned: false, isBasicLand: false },
        { scryfallId: "2", name: "Lightning Bolt", quantity: 1, colorIdentity: ["R"], isBanned: false, isBasicLand: false },
        { scryfallId: "3", name: "Banned Spell", quantity: 1, colorIdentity: ["B"], isBanned: true, isBasicLand: false },
      ],
      context
    );

    expect(preview.readyCount).toBe(0);
    expect(preview.blockedCount).toBe(3);
    expect(preview.cards.map((card) => card.issues[0]?.kind)).toEqual([
      "singleton",
      "colorIdentity",
      "banned",
    ]);
  });

  it("allows repeated basic lands in singleton formats", () => {
    const preview = previewCardPackage(
      [{ scryfallId: "4", name: "Island", quantity: 10, colorIdentity: ["U"], isBanned: false, isBasicLand: true }],
      { ...context, deck: mainDeck({ name: "Island", quantity: 12 }) }
    );

    expect(preview.cards[0]?.status).toBe("ready");
  });

  it("blocks multiple copies of a non-basic card within the package", () => {
    const preview = previewCardPackage(
      [{ scryfallId: "5", name: "Brainstorm", quantity: 2, colorIdentity: ["U"], isBanned: false, isBasicLand: false }],
      { ...context, deck: mainDeck() }
    );

    expect(preview.cards[0]?.issues[0]?.kind).toBe("singleton");
  });
});

describe("previewCardPackage under a rulebreaker commander (CR 903.5e)", () => {
  const sigarda = {
    scryfallId: "sigarda", name: "Sigarda, Host of Herons", quantity: 1, colorIdentity: ["G", "W"],
    isBanned: false, isBasicLand: false, typeLine: "Legendary Creature — Angel", manaValue: 5,
  };
  const selumaDeck = { ...context, commanderColorIdentity: ["W", "B"], deck: mainDeck() };

  it("blocks an off-colour Angel when Seluma is in the 99, not the command zone", () => {
    const preview = previewCardPackage([sigarda], { ...selumaDeck, commandZoneNames: ["Talrand, Sky Summoner"] });

    expect(preview.cards[0]?.issues).toContainEqual(expect.objectContaining({ kind: "colorIdentity" }));
  });

  it("still blocks a banned Angel under Seluma: an exception never changes legality (CR 113.6n)", () => {
    const preview = previewCardPackage([{ ...sigarda, isBanned: true }], {
      ...selumaDeck, commandZoneNames: ["Seluma, Light of Aysen"],
    });

    expect(preview.cards[0]?.issues.map((issue) => issue.kind)).toEqual(["banned"]);
  });

  it("lets a Whtz deck take a hundredth Relentless Rats, and still one Sol Ring (CR 903.5b)", () => {
    const whtzDeck = {
      ...context, commanderColorIdentity: ["W", "U"], commandZoneNames: ["Whtz, the Bibliophile"],
      deck: mainDeck({ name: "Relentless Rats", quantity: 99 }, { name: "Sol Ring", quantity: 1 }),
    };
    const preview = previewCardPackage([
      { scryfallId: "rats", name: "Relentless Rats", quantity: 1, colorIdentity: [], isBanned: false, isBasicLand: false,
        oracleText: "A deck can have any number of cards named Relentless Rats." },
      { scryfallId: "ring", name: "Sol Ring", quantity: 1, colorIdentity: [], isBanned: false, isBasicLand: false },
    ], whtzDeck);

    expect(preview.cards.map((row) => row.status)).toEqual(["ready", "blocked"]);
  });
});

// The package adds to the main deck, so its copy limit counts the deck's
// cards as the editor does (`copiesCountedFor`): the main deck, the sideboard
// and the command zone (CR 100.2a, CR 100.4a, CR 903.5b), never Considering.
describe("previewCardPackage counts a stored deck's copies like the editor", () => {
  /** A stored `DeckCard` row: the card and its command-zone flags. */
  const storedRow = ({ isCommander = false, ...card }: Partial<DeckCard> & { readonly isCommander?: boolean }) => ({
    ...aDeckCard(card), isCommander, isPartner: false,
  });
  const commanderRow = storedRow({
    id: "commander", name: "Talrand, Sky Summoner", typeLine: "Legendary Creature — Merfolk Wizard",
    colorIdentity: ["U"], category: "commander", isCommander: true,
  });
  const solRing = {
    scryfallId: "ring", name: "Sol Ring", quantity: 1, colorIdentity: [], isBanned: false, isBasicLand: false,
    typeLine: "Artifact",
  };

  it("lets a Commander deck take a Sol Ring it only holds in Considering", () => {
    const context = packagePreviewContextOf("commander", [
      commanderRow,
      storedRow({ id: "ring", name: "Sol Ring", typeLine: "Artifact", zone: "maybeboard" }),
    ]);

    const preview = previewCardPackage([solRing], context);

    expect(preview.cards[0]).toMatchObject({ status: "ready", issues: [] });
  });

  it.each(["main", "sideboard"] as const)("still blocks a Sol Ring the deck holds in its %s zone", (zone) => {
    const context = packagePreviewContextOf("commander", [
      commanderRow,
      storedRow({ id: "ring", name: "Sol Ring", typeLine: "Artifact", zone }),
    ]);

    const preview = previewCardPackage([solRing], context);

    expect(preview.cards[0]).toMatchObject({
      status: "blocked", issues: [{ kind: "singleton", message: "Sol Ring exceeds the singleton limit" }],
    });
  });

  it("still blocks a package copy of the deck's own commander", () => {
    const context = packagePreviewContextOf("commander", [commanderRow]);

    const preview = previewCardPackage([
      { scryfallId: "talrand", name: "Talrand, Sky Summoner", quantity: 1, colorIdentity: ["U"], isBanned: false,
        isBasicLand: false, typeLine: "Legendary Creature — Merfolk Wizard" },
    ], context);

    expect(preview.cards[0]?.issues.map((issue) => issue.kind)).toEqual(["singleton"]);
  });

  it("lets a 4-copy deck with three Counterspells in Considering take one more", () => {
    const context = packagePreviewContextOf("modern", [
      storedRow({ id: "spell", name: "Counterspell", typeLine: "Instant", zone: "maybeboard", quantity: 3 }),
    ]);

    const preview = previewCardPackage([
      { scryfallId: "spell", name: "Counterspell", quantity: 1, colorIdentity: ["U"], isBanned: false, isBasicLand: false },
    ], context);

    expect(preview.cards[0]?.status).toBe("ready");
  });
});
