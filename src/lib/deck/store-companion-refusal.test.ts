/**
 * The companions the deck store refuses today, pinned before the rule moves to
 * `format-rules` (master plan FR-06: `companionRejection(card, deck)`).
 *
 * Deck-building context. `setCompanion` checks three things, in this order,
 * before it saves anything: the deck has a commander, the card has Companion
 * (CR 702.139a), and the card is not Lutri, the Spellchaser, which the
 * Commander banned list bans as a companion only. Each refusal raises one
 * warning toast, sends no request and leaves the companion slot as it was.
 * The browser keeps these checks as player feedback (decisions D3 amendment);
 * the server does not repeat them yet (B2-31).
 *
 * Sociable: the real store and deck client run; the fake deck API
 * (`src/test/fake-deck-client.ts`) answers the requests in memory.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { useDeckStore } from "@/lib/deck/store";
import type { Deck, DeckCard } from "@/lib/deck/types";
import { aDeckCard } from "@/test/builders/card";
import { aDeck } from "@/test/builders/deck";
import { aScryfallCard } from "@/test/builders/scryfall";
import { installFakeDeckClient } from "@/test/fake-deck-client";
import { recordToasts } from "@/test/toast-recorder";

const deckApi = installFakeDeckClient();
const toastAdd = recordToasts();

const DECK_ID = "deck-1";

const KENRITH: DeckCard = aDeckCard({
  id: "row-kenrith",
  name: "Kenrith, the Returned King",
  typeLine: "Legendary Creature — Human Noble",
  category: "commander",
  colorIdentity: ["W", "U", "B", "R", "G"],
});

const LURRUS_ROW: DeckCard = aDeckCard({
  id: "row-lurrus",
  name: "Lurrus of the Dream-Den",
  typeLine: "Legendary Creature — Cat Nightmare",
  category: "companion",
  colorIdentity: ["W", "B"],
});

const JEGANTHA = aScryfallCard({
  name: "Jegantha, the Wellspring",
  type_line: "Legendary Creature — Elemental Elk",
  oracle_text:
    "Companion — No card in your starting deck has more than one of the same mana symbol in its mana cost.\n{T}: Add {W}{U}{B}{R}{G}. This mana can't be spent to pay generic mana costs.",
  keywords: ["Companion"],
  color_identity: ["R"],
});

const SOL_RING = aScryfallCard({
  name: "Sol Ring",
  type_line: "Artifact",
  oracle_text: "{T}: Add {C}{C}.",
});

const LUTRI = aScryfallCard({
  name: "Lutri, the Spellchaser",
  type_line: "Legendary Creature — Otter",
  oracle_text:
    "Companion — Each nonland card in your starting deck has a different name.\nFlash\nWhen Lutri, the Spellchaser enters, if you cast it, copy target instant or sorcery spell you control. You may choose new targets for the copy.",
  keywords: ["Companion", "Flash"],
  color_identity: ["U", "R"],
});

/** Opens a Commander deck with this command zone as the active deck. */
function openDeck(commandZone: Pick<Deck, "commander" | "companion">): void {
  useDeckStore.setState({
    decks: { [DECK_ID]: aDeck({ id: DECK_ID, ...commandZone }) },
    activeDeckId: DECK_ID,
    isSyncing: false,
    gameChangerNames: new Set(),
    bannedNames: new Set(),
  });
}

function companionName(): string | undefined {
  return useDeckStore.getState().decks[DECK_ID]?.companion?.name;
}

beforeEach(() => {
  toastAdd.mockClear();
});

describe("setCompanion — the companions the store refuses today", () => {
  it("refuses a companion before the deck has a commander, and says so", async () => {
    openDeck({ commander: null, companion: null });

    await useDeckStore.getState().setCompanion(JEGANTHA);

    expect(companionName()).toBeUndefined();
    expect(deckApi.changeCommandZone).not.toHaveBeenCalled();
    expect(toastAdd.mock.calls).toEqual([
      ["warning", "Choose a commander before setting a companion."],
    ]);
  });

  // CR 702.139a: only a card with the Companion keyword can be revealed as one.
  it("refuses a card without Companion and keeps the companion already chosen", async () => {
    openDeck({ commander: KENRITH, companion: LURRUS_ROW });

    await useDeckStore.getState().setCompanion(SOL_RING);

    expect(companionName()).toBe("Lurrus of the Dream-Den");
    expect(deckApi.changeCommandZone).not.toHaveBeenCalled();
    expect(toastAdd.mock.calls).toEqual([
      ["warning", "That card does not have Companion."],
    ]);
  });

  // The Commander banned list bans Lutri as a companion; the CR has no such rule.
  it("refuses Lutri, the Spellchaser, banned as a Commander companion", async () => {
    openDeck({ commander: KENRITH, companion: null });

    await useDeckStore.getState().setCompanion(LUTRI);

    expect(companionName()).toBeUndefined();
    expect(deckApi.changeCommandZone).not.toHaveBeenCalled();
    expect(toastAdd.mock.calls).toEqual([
      ["warning", "Lutri cannot be your companion in Commander."],
    ]);
  });

  it("checks the commander first: Lutri without a commander asks for a commander", async () => {
    openDeck({ commander: null, companion: null });

    await useDeckStore.getState().setCompanion(LUTRI);

    expect(deckApi.changeCommandZone).not.toHaveBeenCalled();
    expect(toastAdd.mock.calls).toEqual([
      ["warning", "Choose a commander before setting a companion."],
    ]);
  });
});
