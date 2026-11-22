/**
 * Solitary tests of the shared deck's curve rows: the builder's deck analysis cards, read from
 * the share link's rows.
 */
import { describe, expect, it } from "vitest";
import { aDeck } from "@/test/builders/deck";
import { aDeckCard } from "@/test/builders/card";
import { sharedDeckOf } from "./fixtures/rule-divergence-deck";
import type { ApiCard } from "./share-types";
import { sharedDeckCurveCards } from "./shared-deck-curve-cards";

describe("sharedDeckCurveCards", () => {
  it("keeps the commander, the partner and every zone's rows, and leaves the companion out (CR 702.139a)", () => {
    const deck = aDeck({
      commander: aDeckCard({ id: "tymna", name: "Tymna the Weaver" }),
      partner: aDeckCard({ id: "kraum", name: "Kraum, Ludevic's Opus" }),
      companion: aDeckCard({
        id: "lurrus",
        name: "Lurrus of the Dream-Den",
        category: "companion",
      }),
      cards: [
        aDeckCard({ id: "sol-ring", name: "Sol Ring" }),
        aDeckCard({ id: "negate", name: "Negate", zone: "sideboard" }),
        aDeckCard({ id: "opt", name: "Opt", zone: "maybeboard" }),
      ],
    });

    const rows = sharedDeckCurveCards(sharedDeckOf(deck).cards);

    expect(rows.map(({ name, zone }) => `${name} (${zone})`)).toEqual([
      "Tymna the Weaver (main)",
      "Kraum, Ludevic's Opus (main)",
      "Sol Ring (main)",
      "Negate (sideboard)",
      "Opt (maybeboard)",
    ]);
  });

  it("carries what the curve reads: mana value, type line, mana cost, colour identity, category and quantity", () => {
    const deck = aDeck({
      cards: [
        aDeckCard({
          id: "delver",
          name: "Delver of Secrets // Insectile Aberration",
          manaCost: "{U}",
          cmc: 1,
          typeLine: "Creature — Human Wizard // Creature — Human Insect",
          colorIdentity: ["U"],
          category: "creature",
          quantity: 4,
        }),
      ],
    });

    const [delver] = sharedDeckCurveCards(sharedDeckOf(deck).cards);

    expect(delver).toMatchObject({
      manaCost: "{U}",
      cmc: 1,
      typeLine: "Creature — Human Wizard // Creature — Human Insect",
      colorIdentity: ["U"],
      category: "creature",
      quantity: 4,
    });
  });

  it("reads a category or zone this build does not know as the column default", () => {
    const row: ApiCard = {
      id: "row-1",
      name: "Future Card",
      manaCost: "",
      cmc: 2,
      typeLine: "Artifact",
      colorIdentity: [],
      imageUri: "",
      artCropUri: "",
      category: "someFutureCategory",
      quantity: 1,
      isCommander: false,
      isPartner: false,
      isGameChanger: false,
      zone: "someFutureZone",
    };

    const [card] = sharedDeckCurveCards([row]);

    expect(card).toMatchObject({ category: "other", zone: "main" });
  });
});
