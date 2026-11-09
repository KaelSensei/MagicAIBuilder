import { describe, expect, it } from "vitest";
import { planBulkEdit, resolveBulkEdit } from "./bulk-edit";
import { parseTextDecklist } from "./import";
import type { DeckCard } from "./types";
import type { ScryfallCard } from "@/lib/scryfall/types";
import { buildScryfallNameIndex } from "@/lib/scryfall/name-index";

/** A Scryfall card whose printing id derives from its name. */
function scryfall(
  name: string,
  extra: Partial<ScryfallCard> = {}
): ScryfallCard {
  return {
    id: `${name.toLowerCase().replaceAll(/\W+/g, "-")}-printing`,
    name,
    mana_cost: "",
    cmc: 0,
    type_line: "Legendary Creature",
    oracle_text: "",
    color_identity: [],
    colors: [],
    set: "cmm",
    set_name: "Commander Masters",
    rarity: "rare",
    prices: { usd: null, usd_foil: null, eur: null },
    keywords: [],
    legalities: { commander: "legal" },
    ...extra,
  };
}

/** A deck row; only the fields the planner compares are meaningful. */
function row(
  id: string,
  name: string,
  extra: Partial<DeckCard> = {}
): DeckCard {
  return {
    id,
    name,
    manaCost: "",
    cmc: 0,
    typeLine: "Basic Land — Forest",
    oracleText: "",
    colorIdentity: [],
    isGameChanger: false,
    isBanned: false,
    price: null,
    imageUri: "",
    artCropUri: "",
    category: "land",
    quantity: 1,
    zone: "main",
    ...extra,
  };
}

/** A deck holding these rows and an empty command zone. */
function deckOf(cards: DeckCard[]) {
  return {
    cards,
    maybeboard: [],
    commander: null,
    partner: null,
    companion: null,
  };
}

describe("planBulkEdit", () => {
  it("drops surplus copies from the last printing first, removing rows it empties", () => {
    const cards = [
      row("forest-a", "Forest", { quantity: 4 }),
      row("forest-b", "Forest", { quantity: 3 }),
      row("forest-c", "Forest", { quantity: 2 }),
    ];

    const plan = planBulkEdit(
      deckOf(cards),
      parseTextDecklist("Deck\n6 Forest")
    );

    expect(plan.removedCardIds).toEqual(["forest-c"]);
    expect(plan.quantityChanges).toEqual([{ cardId: "forest-b", quantity: 2 }]);
  });

  it("caps repeated lines of one card at the 99 copies a single line allows", () => {
    const plan = planBulkEdit(
      deckOf([]),
      parseTextDecklist("60 Relentless Rats\n60 Relentless Rats")
    );

    expect(plan.additions).toEqual([
      { name: "Relentless Rats", quantity: 99, zone: "main" },
    ]);
  });
});

describe("resolveBulkEdit — command zone", () => {
  it("keeps the commander's printing and row when only the partner changes", () => {
    const kraum = row("kraum-row", "Kraum, Ludevic's Opus", {
      scryfallId: "kraum-promo-printing",
      category: "commander",
      notes: "the promo",
    });
    const deck = {
      ...deckOf([]),
      commander: kraum,
      partner: row("tymna-row", "Tymna the Weaver"),
    };
    const plan = planBulkEdit(
      deck,
      parseTextDecklist(
        "Commander\n1 Kraum, Ludevic's Opus\n1 Thrasios, Triton Hero"
      )
    );

    const result = resolveBulkEdit(
      plan,
      buildScryfallNameIndex([
        scryfall("Kraum, Ludevic's Opus", { keywords: ["Partner"] }),
        scryfall("Thrasios, Triton Hero", { keywords: ["Partner"] }),
      ])
    );

    expect(plan.removedCardIds).toEqual([]);
    expect(result).toEqual({
      status: "ready",
      edit: expect.objectContaining({
        commandZone: {
          clearedSlots: ["partner", "companion"],
          cards: [
            {
              card: expect.objectContaining({ name: "Thrasios, Triton Hero" }),
              slot: "partner",
            },
          ],
          patch: {
            commanderId: "kraum-promo-printing",
            commanderName: "Kraum, Ludevic's Opus",
            partnerId: "thrasios-triton-hero-printing",
            companionId: null,
            pairingType: "partner",
          },
        },
      }),
    });
  });

  /** Resolves an edited list against an empty deck, every name found. */
  function resolveText(text: string, cards: readonly ScryfallCard[]) {
    const plan = planBulkEdit(deckOf([]), parseTextDecklist(text));
    return resolveBulkEdit(plan, buildScryfallNameIndex(cards));
  }

  it("refuses a partner a Father & son commander cannot pair with", () => {
    const result = resolveText("Commander\n1 Splinter\n1 Sol Ring", [
      scryfall("Splinter", { oracle_text: "Partner—Father & son" }),
      scryfall("Sol Ring"),
    ]);

    expect(result).toEqual({ status: "invalidPartner", name: "Sol Ring" });
  });

  it("refuses the commander's own card as its partner", () => {
    const atraxa = scryfall("Atraxa, Praetors' Voice");

    const result = resolveText(
      "Commander\n1 Atraxa, Praetors' Voice\n1 Atraxa, Praetors' Voice",
      [atraxa]
    );

    expect(result).toEqual({
      status: "invalidPartner",
      name: "Atraxa, Praetors' Voice",
    });
  });

  it("refuses a companion line naming a card without Companion", () => {
    const result = resolveText(
      "Commander\n1 Atraxa, Praetors' Voice\nCompanion\n1 Sol Ring",
      [scryfall("Atraxa, Praetors' Voice"), scryfall("Sol Ring")]
    );

    expect(result).toEqual({ status: "invalidCompanion", name: "Sol Ring" });
  });

  it("refuses Lutri, banned as a Commander companion", () => {
    const result = resolveText(
      "Commander\n1 Atraxa, Praetors' Voice\nCompanion\n1 Lutri, the Spellchaser",
      [
        scryfall("Atraxa, Praetors' Voice"),
        scryfall("Lutri, the Spellchaser", {
          keywords: ["Companion", "Flash"],
        }),
      ]
    );

    expect(result).toEqual({
      status: "invalidCompanion",
      name: "Lutri, the Spellchaser",
    });
  });

  it("refuses a companion when the list names no commander", () => {
    const result = resolveText("Companion\n1 Jegantha, the Wellspring", [
      scryfall("Jegantha, the Wellspring", { keywords: ["Companion"] }),
    ]);

    expect(result).toEqual({
      status: "invalidCompanion",
      name: "Jegantha, the Wellspring",
    });
  });
});
