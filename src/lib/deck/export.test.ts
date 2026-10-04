import { describe, it, expect } from "vitest";
import {
  exportPlainText,
  exportMoxfield,
  exportArena,
  exportMTGO,
  exportTappedOut,
  exportArchidekt,
  exportGoldfish,
  exportEdhrec,
} from "@/lib/deck/export";
import type { Deck, DeckCard } from "@/lib/deck/types";
import { parseTextDecklist } from "@/lib/deck/import";

function makeCard(name: string, qty = 1, overrides: Partial<DeckCard> = {}): DeckCard {
  return {
    id: "c-" + name,
    name,
    manaCost: "{1}",
    cmc: 1,
    typeLine: "Artifact",
    oracleText: "",
    colorIdentity: [],
    isGameChanger: false,
    isBanned: false,
    price: null,
    imageUri: "",
    artCropUri: "",
    category: "other" as const,
    quantity: qty,
    zone: "main" as const,
    ...overrides,
  };
}

function makeDeck(overrides: Partial<Deck> = {}): Deck {
  return {
    id: "deck-1",
    name: "Test Deck",
    commander: null,
    partner: null,
    companion: null,
    pairingType: "none",
    cards: [],
    maybeboard: [],
    format: "commander",
    cardCount: 0,
    targetBracket: 2 as 1 | 2 | 3 | 4,
    manualBracket: null as 1 | 2 | 3 | 4 | null,
    budget: null,
    description: "",
    tags: [],
    shareToken: null,
    shareEnabled: false,
    isPublic: false,
    isAIGenerated: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("exportPlainText", () => {
  it("keeps every note line commented without introducing cards or zones", () => {
    const deck = makeDeck({
      cards: [
        makeCard("Sol Ring", 1, { notes: "Core ramp\r\nSideboard\n2 Negate\rCommander" }),
        makeCard("Forest", 5),
      ],
    });

    const text = exportPlainText(deck);
    expect(text).toContain("// Note: Core ramp\n// Note: Sideboard\n// Note: 2 Negate\n// Note: Commander");
    expect(parseTextDecklist(text)).toMatchObject({
      commander: null,
      cards: [
        { name: "Sol Ring", quantity: 1 },
        { name: "Forest", quantity: 5 },
      ],
      errors: [],
    });
  });

  it("exports a deck with commander", () => {
    const deck = makeDeck({
      commander: makeCard("Atraxa, Praetor's Voice"),
      cards: [makeCard("Sol Ring"), makeCard("Command Tower")],
    });
    const text = exportPlainText(deck);
    expect(text).toContain("Commander");
    expect(text).toContain("1 Atraxa, Praetor's Voice");
    expect(text).toContain("Deck");
    expect(text).toContain("1 Sol Ring");
    expect(text).toContain("1 Command Tower");
  });

  it("exports a deck without commander", () => {
    const deck = makeDeck({ cards: [makeCard("Sol Ring")] });
    const text = exportPlainText(deck);
    expect(text).not.toContain("Commander");
    expect(text).toContain("Deck");
    expect(text).toContain("1 Sol Ring");
  });

  it("includes partner section", () => {
    const deck = makeDeck({
      commander: makeCard("Sidar Kondo of Jamuraa"),
      partner: makeCard("Vial Smasher the Fierce"),
      cards: [],
    });
    const text = exportPlainText(deck);
    expect(text).toContain("Partner");
    expect(text).toContain("1 Vial Smasher the Fierce");
  });

  it("includes // note lines when card has notes", () => {
    const deck = makeDeck({
      cards: [makeCard("Sol Ring", 1, { notes: "Core ramp piece" })],
    });
    const text = exportPlainText(deck);
    expect(text).toContain("// Note: Core ramp piece");
  });

  it("respects quantity", () => {
    const deck = makeDeck({ cards: [makeCard("Forest", 10)] });
    const text = exportPlainText(deck);
    expect(text).toContain("10 Forest");
  });

  it("exports the companion and secondary zones with their quantities", () => {
    const deck = makeDeck({
      companion: makeCard("Lurrus of the Dream-Den"),
      cards: [
        makeCard("Sol Ring"),
        makeCard("Negate", 3, { zone: "sideboard" }),
        makeCard("Counterspell", 2, { zone: "maybeboard" }),
      ],
    });
    const text = exportPlainText(deck);
    expect(text).toContain("Companion\n1 Lurrus of the Dream-Den");
    expect(text).toContain("Deck\n1 Sol Ring");
    expect(text).toContain("Sideboard\n3 Negate");
    expect(text).toContain("Considering\n2 Counterspell");
  });
});

describe("exportMoxfield", () => {
  it("preserves companion and secondary zones on text reimport", () => {
    const deck = makeDeck({
      commander: makeCard("Sidar Kondo of Jamuraa"),
      partner: makeCard("Vial Smasher the Fierce"),
      companion: makeCard("Umori, the Collector"),
      cards: [
        makeCard("Sol Ring"),
        makeCard("Negate", 3, { zone: "sideboard" }),
        makeCard("Counterspell", 2, { zone: "maybeboard" }),
      ],
    });

    const text = exportMoxfield(deck);
    expect(text).toContain("// Companion\n1 Umori, the Collector");
    expect(text).toContain("// Sideboard\n3 Negate");
    expect(text).toContain("// Considering\n2 Counterspell");
    expect(parseTextDecklist(text)).toMatchObject({
      commander: "Sidar Kondo of Jamuraa",
      partner: "Vial Smasher the Fierce",
      companion: "Umori, the Collector",
      cards: [
        { name: "Sol Ring", quantity: 1 },
        { name: "Negate", quantity: 3, zone: "sideboard" },
        { name: "Counterspell", quantity: 2, zone: "maybeboard" },
      ],
      errors: [],
    });
  });

  it("exports with // Commander section header", () => {
    const deck = makeDeck({
      commander: makeCard("Atraxa, Praetor's Voice"),
      cards: [makeCard("Sol Ring")],
    });
    const text = exportMoxfield(deck);
    expect(text).toContain("// Commander");
    expect(text).toContain("1 Atraxa, Praetor's Voice");
    expect(text).toContain("// Deck");
    expect(text).toContain("1 Sol Ring");
  });

  it("exports without commander section when no commander", () => {
    const deck = makeDeck({ cards: [makeCard("Sol Ring")] });
    const text = exportMoxfield(deck);
    expect(text).not.toContain("// Commander");
    expect(text).toContain("// Deck");
  });
});

describe("exportArena", () => {
  it("exports with Commander and Deck sections", () => {
    const deck = makeDeck({
      commander: makeCard("Atraxa, Praetor's Voice"),
      cards: [makeCard("Sol Ring")],
    });
    const text = exportArena(deck);
    expect(text).toContain("Commander");
    expect(text).toContain("1 Atraxa, Praetor's Voice");
    expect(text).toContain("Deck");
    expect(text).toContain("1 Sol Ring");
  });

  it("does not emit Commander section when no commander or partner", () => {
    const deck = makeDeck({ cards: [makeCard("Sol Ring")] });
    const text = exportArena(deck);
    expect(text).not.toMatch(/^Commander$/m);
  });
});

describe("exportMTGO", () => {
  it("keeps sideboard quantities separate from the playable deck", () => {
    const deck = makeDeck({
      cards: [
        makeCard("Sol Ring"),
        makeCard("Negate", 3, { zone: "sideboard" }),
        makeCard("Counterspell", 2, { zone: "maybeboard" }),
      ],
    });
    const xml = exportMTGO(deck);
    expect(xml).toContain('Quantity="1" Sideboard="false" Name="Sol Ring"');
    expect(xml).toContain('Quantity="3" Sideboard="true" Name="Negate"');
    expect(xml).not.toContain('Name="Counterspell"');
  });

  it("exports valid XML", () => {
    const deck = makeDeck({
      commander: makeCard("Atraxa, Praetor's Voice"),
      cards: [makeCard("Sol Ring")],
    });
    const xml = exportMTGO(deck);
    expect(xml).toContain('<?xml version="1.0"');
    expect(xml).toContain('<Deck');
    expect(xml).toContain('Name="Atraxa, Praetor\'s Voice"');
    expect(xml).toContain('Name="Sol Ring"');
  });

  it("escapes double quotes in card names", () => {
    const deck = makeDeck({
      cards: [makeCard('Kongming, "Sleeping Dragon"')],
    });
    const xml = exportMTGO(deck);
    expect(xml).toContain("&quot;");
  });

  it("exports XML-special card names without changing the name", () => {
    const name = 'A & B <C> "D"';
    const xml = exportMTGO(makeDeck({ cards: [makeCard(name)] }));
    const document = new DOMParser().parseFromString(xml, "application/xml");

    expect(document.querySelector("parsererror")).toBeNull();
    expect(document.querySelector("Cards")?.getAttribute("Name")).toBe(name);
  });
});

describe("exportTappedOut", () => {
  it("marks commanders with *CMDR*", () => {
    const deck = makeDeck({
      commander: makeCard("Atraxa, Praetor's Voice"),
      cards: [makeCard("Sol Ring")],
    });
    const text = exportTappedOut(deck);
    expect(text).toContain("1x Atraxa, Praetor's Voice *CMDR*");
    expect(text).toContain("1x Sol Ring");
  });

  it("marks partner with *CMDR*", () => {
    const deck = makeDeck({
      commander: makeCard("Sidar Kondo of Jamuraa"),
      partner: makeCard("Vial Smasher the Fierce"),
      cards: [],
    });
    const text = exportTappedOut(deck);
    expect(text).toContain("1x Vial Smasher the Fierce *CMDR*");
  });
});

describe("exportArchidekt", () => {
  it("does not count or export secondary zones as mainboard cards", () => {
    const deck = makeDeck({
      cards: [
        makeCard("Sol Ring"),
        makeCard("Forest", 5),
        makeCard("Negate", 2, { zone: "sideboard" }),
        makeCard("Counterspell", 3, { zone: "maybeboard" }),
      ],
    });

    expect(exportArchidekt(deck)).toBe(
      "Mainboard (6)\n1x Sol Ring [Other]\n5x Forest [Other]",
    );
  });

  it("exports with Commander section count", () => {
    const deck = makeDeck({
      commander: makeCard("Atraxa, Praetor's Voice"),
      cards: [makeCard("Sol Ring"), makeCard("Forest", 5)],
    });
    const text = exportArchidekt(deck);
    expect(text).toContain("Commander (1)");
    expect(text).toContain("Mainboard (6)"); // 1 Sol Ring + 5 Forest
  });

  it("exports with two commanders", () => {
    const deck = makeDeck({
      commander: makeCard("Sidar Kondo of Jamuraa"),
      partner: makeCard("Vial Smasher the Fierce"),
      cards: [],
    });
    const text = exportArchidekt(deck);
    expect(text).toContain("Commander (2)");
  });

  it("does not include Commander section when no commander", () => {
    const deck = makeDeck({ cards: [makeCard("Sol Ring")] });
    const text = exportArchidekt(deck);
    expect(text).not.toContain("Commander");
    expect(text).toContain("Mainboard (1)");
  });

  it("tags each card with its category in Archidekt's bracket syntax", () => {
    const deck = makeDeck({
      commander: makeCard("Atraxa, Praetor's Voice", 1, { category: "commander" }),
      cards: [
        makeCard("Sol Ring", 1, { category: "ramp" }),
        makeCard("Forest", 5, { category: "land" }),
      ],
    });
    const text = exportArchidekt(deck);
    // {top} pins the premier category so Archidekt shows the commander first.
    expect(text).toContain("1x Atraxa, Praetor's Voice [Commander{top}]");
    expect(text).toContain("1x Sol Ring [Ramp]");
    expect(text).toContain("5x Forest [Land]");
  });
});

describe("exportGoldfish", () => {
  it("does not turn sideboard or considering cards into main-deck cards", () => {
    const deck = makeDeck({
      commander: makeCard("Atraxa"),
      cards: [
        makeCard("Sol Ring"),
        makeCard("Negate", 2, { zone: "sideboard" }),
        makeCard("Counterspell", 3, { zone: "maybeboard" }),
      ],
    });

    expect(exportGoldfish(deck)).toBe("1 Sol Ring\n\n1 Atraxa");
  });

  it("lists the main deck, then the commander in the sideboard slot", () => {
    // MTGGoldfish's text import uses the MTGO convention: the commander is the
    // one-card sideboard after a blank line.
    const deck = makeDeck({
      commander: makeCard("Atraxa, Praetor's Voice"),
      cards: [makeCard("Sol Ring"), makeCard("Forest", 5)],
    });
    const text = exportGoldfish(deck);
    const [main, side, ...rest] = text.split("\n\n");
    expect(rest).toEqual([]);
    expect(main.split("\n")).toEqual(["1 Sol Ring", "5 Forest"]);
    expect(side.split("\n")).toEqual(["1 Atraxa, Praetor's Voice"]);
  });

  it("puts both partners in the sideboard slot", () => {
    const deck = makeDeck({
      commander: makeCard("Sidar Kondo of Jamuraa"),
      partner: makeCard("Vial Smasher the Fierce"),
      cards: [makeCard("Sol Ring")],
    });
    const [, side] = exportGoldfish(deck).split("\n\n");
    expect(side.split("\n")).toEqual([
      "1 Sidar Kondo of Jamuraa",
      "1 Vial Smasher the Fierce",
    ]);
  });

  it("emits no sideboard block without a commander", () => {
    const deck = makeDeck({ cards: [makeCard("Sol Ring")] });
    expect(exportGoldfish(deck)).toBe("1 Sol Ring");
  });
});

describe("exportEdhrec", () => {
  it("omits secondary zones from the plain deck-check list", () => {
    const deck = makeDeck({
      commander: makeCard("Atraxa"),
      cards: [
        makeCard("Sol Ring"),
        makeCard("Negate", 2, { zone: "sideboard" }),
        makeCard("Counterspell", 3, { zone: "maybeboard" }),
      ],
    });

    expect(exportEdhrec(deck)).toBe("1 Atraxa\n1 Sol Ring");
  });

  it("puts the commander first as a plain line", () => {
    // EDHRec's deck check takes a plain list and reads the first legal
    // commander as the deck's commander — no marker syntax exists.
    const deck = makeDeck({
      commander: makeCard("Atraxa, Praetor's Voice"),
      cards: [makeCard("Sol Ring")],
    });
    expect(exportEdhrec(deck).split("\n")).toEqual([
      "1 Atraxa, Praetor's Voice",
      "1 Sol Ring",
    ]);
  });

  it("keeps quantities and lists partners before the deck", () => {
    const deck = makeDeck({
      commander: makeCard("Sidar Kondo of Jamuraa"),
      partner: makeCard("Vial Smasher the Fierce"),
      cards: [makeCard("Forest", 5)],
    });
    expect(exportEdhrec(deck).split("\n")).toEqual([
      "1 Sidar Kondo of Jamuraa",
      "1 Vial Smasher the Fierce",
      "5 Forest",
    ]);
  });
});
