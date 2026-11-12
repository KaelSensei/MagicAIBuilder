/** Repairs and rejections of an AI-generated deck, checked against card data. */
import { describe, expect, it } from "vitest";
import type {
  AIDeckResponse,
  DeckCorrection,
  DeckRemovalReason,
} from "@/app/api/ai/build/types";
import { buildScryfallNameIndex } from "@/lib/scryfall/name-index";
import { ALL_GENERATED_DECK_CARDS } from "./fixtures/generated-deck-cards";
import {
  checkGeneratedDeckLegality,
  type GeneratedDeckVerdict,
} from "./generated-deck-legality";

const CARD_DATA = buildScryfallNameIndex(ALL_GENERATED_DECK_CARDS);

type Entry = readonly [name: string, quantity: number];

interface ListSpec {
  readonly commander: string;
  readonly partner?: string;
  readonly basic: string;
  readonly entries?: readonly Entry[];
  /** Copies in the list, the commander excluded. Defaults to a legal 99 (98 beside a partner). */
  readonly size?: number;
}

/** A model reply: the listed entries, then one basic-land stack that brings the list to `size`. */
function reply({
  commander,
  partner,
  basic,
  entries = [],
  size,
}: ListSpec): AIDeckResponse {
  const total = size ?? (partner ? 98 : 99);
  const listed = entries.reduce((sum, [, quantity]) => sum + quantity, 0);
  return {
    commander,
    partner: partner ?? null,
    cards: [
      ...entries.map(([name, quantity]) => ({
        name,
        quantity,
        category: "other",
      })),
      { name: basic, quantity: total - listed, category: "land" },
    ],
  };
}

const TALRAND = {
  commander: "Talrand, Sky Summoner",
  basic: "Island",
} as const;
const TYMNA_AND_THRASIOS = {
  commander: "Tymna the Weaver",
  partner: "Thrasios, Triton Hero",
  basic: "Island",
} as const;

function removed(
  name: string,
  quantity: number,
  reason: DeckRemovalReason
): DeckCorrection {
  return { action: "removed", name, quantity, reason };
}

function added(name: string, quantity: number): DeckCorrection {
  return { action: "added", name, quantity, reason: "fill_to_size" };
}

function acceptedDeck(verdict: GeneratedDeckVerdict): AIDeckResponse {
  if (verdict.status === "rejected") {
    throw new Error(
      `Expected an accepted deck, got: ${verdict.reasons.join(" ")}`
    );
  }
  return verdict.deck;
}

function copies(deck: AIDeckResponse): number {
  return deck.cards.reduce((sum, card) => sum + card.quantity, 0);
}

const REPAIRED_CASES: readonly {
  readonly label: string;
  readonly reply: AIDeckResponse;
  readonly corrections: readonly DeckCorrection[];
}[] = [
  {
    label: "a legal list, unchanged",
    reply: reply({
      ...TALRAND,
      entries: [
        ["Sol Ring", 1],
        ["Counterspell", 1],
      ],
    }),
    corrections: [],
  },
  {
    label: "a card outside the commander's colour identity",
    reply: reply({ ...TALRAND, entries: [["Lightning Bolt", 1]] }),
    corrections: [
      removed("Lightning Bolt", 1, "outside_color_identity"),
      added("Island", 1),
    ],
  },
  {
    label: "a non-basic card listed twice",
    reply: reply({
      ...TALRAND,
      entries: [
        ["Counterspell", 1],
        ["counterspell", 1],
      ],
    }),
    corrections: [
      removed("Counterspell", 1, "extra_copies"),
      added("Island", 1),
    ],
  },
  {
    label: "two copies of a non-basic card in one entry",
    reply: reply({ ...TALRAND, entries: [["Counterspell", 2]] }),
    corrections: [
      removed("Counterspell", 1, "extra_copies"),
      added("Island", 1),
    ],
  },
  {
    label: "any number of a card whose oracle text allows it",
    reply: reply({ ...TALRAND, entries: [["Persistent Petitioners", 30]] }),
    corrections: [],
  },
  {
    label: "copies of a capped card beyond its cap, across entries",
    reply: reply({
      ...TYMNA_AND_THRASIOS,
      entries: [
        ["Nazgûl", 5],
        ["Nazgûl", 5],
      ],
    }),
    corrections: [removed("Nazgûl", 1, "extra_copies"), added("Plains", 1)],
  },
  {
    label: "a card banned in Commander",
    reply: reply({ ...TALRAND, entries: [["Mana Crypt", 1]] }),
    corrections: [removed("Mana Crypt", 1, "banned"), added("Island", 1)],
  },
  {
    label: "a card that is not legal in Commander",
    reply: reply({ ...TALRAND, entries: [["Mox Lotus", 1]] }),
    corrections: [removed("Mox Lotus", 1, "not_legal"), added("Island", 1)],
  },
  {
    label: "a name that matches no card",
    reply: reply({ ...TALRAND, entries: [["Totally Real Card", 1]] }),
    corrections: [
      removed("Totally Real Card", 1, "unknown_card"),
      added("Island", 1),
    ],
  },
  {
    label: "the commander repeated in the list",
    reply: reply({ ...TALRAND, entries: [["Talrand, Sky Summoner", 1]] }),
    corrections: [
      removed("Talrand, Sky Summoner", 1, "commander_in_list"),
      added("Island", 1),
    ],
  },
  {
    label: "a list one card short",
    reply: reply({ ...TALRAND, size: 98 }),
    corrections: [added("Island", 1)],
  },
  {
    label: "a list that counts the commander among its 100 cards",
    reply: reply({ ...TALRAND, entries: [["Sol Ring", 1]], size: 100 }),
    corrections: [removed("Island", 1, "over_size")],
  },
  {
    label: "a list too long, trimmed from its largest basic-land stack",
    reply: reply({
      ...TYMNA_AND_THRASIOS,
      entries: [["Plains", 10]],
      size: 100,
    }),
    corrections: [removed("Island", 2, "over_size")],
  },
  {
    label: "a card inside the partner's colour identity only",
    reply: reply({ ...TYMNA_AND_THRASIOS, entries: [["Counterspell", 1]] }),
    corrections: [],
  },
  {
    label: "a card outside both partners' colour identity",
    reply: reply({ ...TYMNA_AND_THRASIOS, entries: [["Lightning Bolt", 1]] }),
    corrections: [
      removed("Lightning Bolt", 1, "outside_color_identity"),
      added("Plains", 1),
    ],
  },
  {
    label: "a partner repeated in the list",
    reply: reply({
      ...TYMNA_AND_THRASIOS,
      entries: [["Thrasios, Triton Hero", 1]],
    }),
    corrections: [
      removed("Thrasios, Triton Hero", 1, "commander_in_list"),
      added("Plains", 1),
    ],
  },
  {
    label: "a Background beside a commander that chooses one",
    reply: reply({
      commander: "Wilson, Refined Grizzly",
      partner: "Raised by Giants",
      basic: "Forest",
    }),
    corrections: [],
  },
];

const REJECTED_CASES: readonly {
  readonly label: string;
  readonly reply: AIDeckResponse;
  readonly reason: RegExp;
}[] = [
  {
    label: "a commander that matches no card",
    reply: reply({ commander: "Totally Real Commander", basic: "Island" }),
    reason: /Totally Real Commander is not a known card/,
  },
  {
    label: "a commander that cannot lead a deck",
    reply: reply({ commander: "Grizzly Bears", basic: "Forest" }),
    reason: /Grizzly Bears cannot be a commander/,
  },
  {
    label: "a commander banned in Commander",
    reply: reply({ commander: "Leovold, Emissary of Trest", basic: "Island" }),
    reason: /Leovold, Emissary of Trest is banned in Commander/,
  },
  {
    label: "a partner that cannot pair with the commander",
    reply: reply({ ...TALRAND, partner: "Thrasios, Triton Hero" }),
    reason:
      /Thrasios, Triton Hero cannot share the command zone with Talrand, Sky Summoner/,
  },
  {
    label: "a Background beside a commander that does not choose one",
    reply: reply({ ...TALRAND, partner: "Raised by Giants" }),
    reason:
      /Raised by Giants cannot share the command zone with Talrand, Sky Summoner/,
  },
  {
    label:
      "a commander that chooses a Background, beside a commander that is not one",
    reply: reply({ ...TALRAND, partner: "Wilson, Refined Grizzly" }),
    reason:
      /Wilson, Refined Grizzly cannot share the command zone with Talrand, Sky Summoner/,
  },
  {
    label: "a list too long with no basic land to trim",
    reply: {
      ...reply({ ...TALRAND }),
      cards: [
        { name: "Sol Ring", quantity: 1, category: "ramp" },
        { name: "Persistent Petitioners", quantity: 99, category: "creature" },
      ],
    },
    reason: /1 card too many/,
  },
];

describe("checkGeneratedDeckLegality", () => {
  it.each(REPAIRED_CASES)(
    "repairs $label and reports each change",
    ({ reply: modelReply, corrections }) => {
      const verdict = checkGeneratedDeckLegality(modelReply, CARD_DATA);

      expect(verdict).toEqual(
        expect.objectContaining({ status: "accepted", corrections })
      );
      const deck = acceptedDeck(verdict);
      expect(copies(deck)).toBe(modelReply.partner ? 98 : 99);
      // The repaired list passes the same check without a further change.
      expect(checkGeneratedDeckLegality(deck, CARD_DATA)).toEqual({
        status: "accepted",
        deck,
        corrections: [],
      });
    }
  );

  it.each(REJECTED_CASES)("rejects $label", ({ reply: modelReply, reason }) => {
    const verdict = checkGeneratedDeckLegality(modelReply, CARD_DATA);

    expect(verdict).toEqual({
      status: "rejected",
      reasons: [expect.stringMatching(reason)],
    });
  });

  it("drops the removed card from the list and adds the basic to the existing stack", () => {
    const deck = acceptedDeck(
      checkGeneratedDeckLegality(
        reply({
          ...TALRAND,
          entries: [
            ["Lightning Bolt", 1],
            ["Sol Ring", 1],
          ],
        }),
        CARD_DATA
      )
    );

    expect(deck.cards).toEqual([
      { name: "Sol Ring", quantity: 1, category: "other" },
      { name: "Island", quantity: 98, category: "land" },
    ]);
  });

  it("spreads added basics over the command zone's colours in WUBRG order", () => {
    const verdict = checkGeneratedDeckLegality(
      reply({ ...TYMNA_AND_THRASIOS, size: 93 }),
      CARD_DATA
    );

    expect(verdict).toEqual(
      expect.objectContaining({
        corrections: [
          added("Plains", 2),
          added("Island", 1),
          added("Swamp", 1),
          added("Forest", 1),
        ],
      })
    );
  });

  it("fills a colourless commander's list with Wastes", () => {
    const kozilek = {
      id: "kozilek",
      cmc: 10,
      name: "Kozilek, the Great Distortion",
      type_line: "Legendary Creature — Eldrazi",
      color_identity: [],
      legalities: { commander: "legal" },
    };
    const verdict = checkGeneratedDeckLegality(
      {
        commander: kozilek.name,
        partner: null,
        cards: [{ name: "Sol Ring", quantity: 1, category: "ramp" }],
      },
      buildScryfallNameIndex([...ALL_GENERATED_DECK_CARDS, kozilek])
    );

    expect(verdict).toEqual(
      expect.objectContaining({ corrections: [added("Wastes", 98)] })
    );
  });

  describe("with Snow-Covered basics", () => {
    const snowIsland = {
      id: "snow-covered-island",
      cmc: 0,
      name: "Snow-Covered Island",
      type_line: "Basic Snow Land — Island",
      color_identity: ["U"],
      legalities: { commander: "legal" },
    };
    const cardData = buildScryfallNameIndex([
      ...ALL_GENERATED_DECK_CARDS,
      snowIsland,
    ]);

    it("keeps a stack of them as basic lands", () => {
      const modelReply = reply({ ...TALRAND, basic: snowIsland.name });

      expect(checkGeneratedDeckLegality(modelReply, cardData)).toEqual({
        status: "accepted",
        deck: modelReply,
        corrections: [],
      });
    });

    it("trims them when the list is too long", () => {
      const modelReply = reply({
        ...TALRAND,
        basic: snowIsland.name,
        entries: [["Sol Ring", 1]],
        size: 100,
      });

      expect(checkGeneratedDeckLegality(modelReply, cardData)).toEqual(
        expect.objectContaining({
          status: "accepted",
          corrections: [removed(snowIsland.name, 1, "over_size")],
        })
      );
    });
  });
});
