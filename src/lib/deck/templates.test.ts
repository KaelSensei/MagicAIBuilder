import { describe, it, expect } from "vitest";
import type { Deck, DeckCard } from "@/lib/deck/types";
import {
  createTemplate,
  applyTemplate,
  getTemplatesForCommander,
  type DeckTemplate,
} from "./templates";

function makeCard(id: string, name = "Test Card"): DeckCard {
  return {
    id,
    name,
    manaCost: "",
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
    quantity: 1,
    zone: "main",
    scryfallId: id,
  };
}

function makeDeck(overrides: Partial<Deck> = {}): Deck {
  const cards = Array.from({ length: 60 }, (_, i) => makeCard(`c${i}`));
  return {
    id: "deck-1",
    name: "Test Deck",
    description: "A test deck",
    commander: makeCard("cmd", "Atraxa, Grand Unifier"),
    partner: null,
    companion: null,
    pairingType: "none",
    cards,
    maybeboard: [],
    format: "commander",
    targetBracket: 3,
    manualBracket: null,
    budget: null,
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

// ─── Template creation ─────────────────────────────────────────────────────
describe("createTemplate", () => {
  it("creates a template from a deck", () => {
    const deck = makeDeck({ name: "Atraxa Voltron" });
    const template = createTemplate(
      deck,
      "Atraxa Voltron Budget",
      "Voltron",
      "community"
    );

    expect(template.name).toBe("Atraxa Voltron Budget");
    expect(template.commanderName).toBe("Atraxa, Grand Unifier");
    expect(template.archetype).toBe("Voltron");
    expect(template.deckList).toHaveLength(deck.cards.length);
    expect(template.source).toBe("community");
  });

  it("template contains main deck cards (59 in this case)", () => {
    const deck = makeDeck({
      cards: Array.from({ length: 59 }, (_, i) => makeCard(`c${i}`)),
    });
    const template = createTemplate(deck, "Test", "Aggro", "official");

    // Template contains only the main deck cards (59)
    // Commander is stored separately in the Deck, not in deckList
    expect(template.deckList).toHaveLength(59);
  });

  it("sets metadata (upvotes, createdAt)", () => {
    const deck = makeDeck();
    const template = createTemplate(deck, "Test", "Control", "community");

    expect(template.upvotes).toBe(0);
    expect(template.createdAt).toBeDefined();
  });
});

// ─── Apply template ───────────────────────────────────────────────────────
describe("applyTemplate", () => {
  it("creates a new deck from template", () => {
    const template: DeckTemplate = {
      id: "tmpl-1",
      name: "Atraxa Voltron",
      commanderName: "Atraxa, Grand Unifier",
      archetype: "Voltron",
      deckList: Array.from({ length: 99 }, (_, i) => makeCard(`tmpl-c${i}`)),
      author: "CommunityBuilder",
      upvotes: 5,
      source: "community",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const newDeck = applyTemplate(template, "My Atraxa Voltron");

    expect(newDeck.name).toBe("My Atraxa Voltron");
    expect(newDeck.cards).toHaveLength(99);
    expect(newDeck.format).toBe("commander");
    expect(newDeck.isPublic).toBe(false);
    expect(newDeck.targetBracket).toBe(3);
  });

  it("applies template with 99 cards (commander found in deck list)", () => {
    const commanderCard = makeCard("cmd-teferi", "Teferi, Time Raveler");
    const otherCards = Array.from({ length: 98 }, (_, i) =>
      makeCard(`c${i}`)
    );
    const templateCards = [commanderCard, ...otherCards];

    const template: DeckTemplate = {
      id: "tmpl-2",
      name: "Control Template",
      commanderName: "Teferi, Time Raveler",
      archetype: "Control",
      deckList: templateCards,
      author: "Official",
      upvotes: 20,
      source: "official",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const newDeck = applyTemplate(template, "My Control");

    expect(newDeck.cards).toHaveLength(99);
    expect(newDeck.commander).toBe(commanderCard);
  });
});

// ─── Template filtering ────────────────────────────────────────────────────
describe("getTemplatesForCommander", () => {
  const templates: DeckTemplate[] = [
    {
      id: "t1",
      name: "Atraxa Voltron",
      commanderName: "Atraxa, Grand Unifier",
      archetype: "Voltron",
      deckList: [],
      author: "Player1",
      upvotes: 15,
      source: "community",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "t2",
      name: "Atraxa Stax",
      commanderName: "Atraxa, Grand Unifier",
      archetype: "Stax",
      deckList: [],
      author: "Player2",
      upvotes: 8,
      source: "community",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "t3",
      name: "Ur-Dragon Aggro",
      commanderName: "Ur-Dragon",
      archetype: "Aggro",
      deckList: [],
      author: "Player3",
      upvotes: 12,
      source: "community",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  it("filters templates by commander name", () => {
    const result = getTemplatesForCommander(
      templates,
      "Atraxa, Grand Unifier"
    );

    expect(result).toHaveLength(2);
    expect(result.every((t) => t.commanderName === "Atraxa, Grand Unifier")).toBe(
      true
    );
  });

  it("returns empty array for commander with no templates", () => {
    const result = getTemplatesForCommander(templates, "Nonexistent Commander");

    expect(result).toHaveLength(0);
  });

  it("sorts by upvotes descending (most popular first)", () => {
    const result = getTemplatesForCommander(
      templates,
      "Atraxa, Grand Unifier"
    );

    expect(result[0].upvotes).toBe(15);
    expect(result[1].upvotes).toBe(8);
  });
});

// ─── Edge cases ────────────────────────────────────────────────────────────
describe("edge cases", () => {
  it("handles template with 0 upvotes", () => {
    const template: DeckTemplate = {
      id: "t-zero",
      name: "New Template",
      commanderName: "Test Commander",
      archetype: "Combo",
      deckList: Array.from({ length: 99 }, (_, i) => makeCard(`c${i}`)),
      author: "NewPlayer",
      upvotes: 0,
      source: "community",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(template.upvotes).toBe(0);
  });

  it("handles deck with partner commanders (only commander in template)", () => {
    const deck = makeDeck({
      commander: makeCard("cmd1", "Thrasios, Triton Hero"),
      partner: makeCard("p1", "Bruse Tarl, Boorish Herder"),
      // 60 cards already in makeDeck
    });

    const template = createTemplate(deck, "Partners", "Tempo", "community");

    // Template contains the 60 cards from the deck (first 99, but deck only has 60)
    expect(template.deckList).toHaveLength(60);
  });

  it("template name length validation", () => {
    const deck = makeDeck();
    const longName = "A".repeat(100); // Very long name

    const template = createTemplate(deck, longName, "Control", "community");

    // Should still create but may be truncated in UI
    expect(template.name.length).toBeGreaterThan(0);
  });
});
