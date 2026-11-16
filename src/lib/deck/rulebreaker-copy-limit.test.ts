/**
 * The copy limit the deck store applies under Whtz, the Bibliophile, whose
 * Oracle text reads "Rulebreaker — A deck with this commander has no maximum
 * deck size." (recorded in `modules/format-rules/domain/fixtures`).
 *
 * Rules (Comprehensive Rules, `docs/rules/magic-comp-rules-20260227.txt`;
 * CR 903.5e from the 2026-11-06 edition):
 * - CR 903.5b: "Other than basic lands, each card in a Commander deck must
 *   have a different English name." Whtz does not lift it: a second Sol Ring
 *   is still refused.
 * - CR 101.1: a card's own text wins ("any number of cards named Relentless
 *   Rats", "up to seven cards named Seven Dwarves").
 * - The 99 copies the app allowed a basic land or an "any number" card is no
 *   copy rule: it is the room a 100-card deck leaves beside its commander
 *   (CR 903.5a). Under Whtz the deck has no maximum size (CR 903.5e), so that
 *   room, and the cap, go.
 *
 * Sociable: the real store and deck client run; the fake deck API answers in
 * memory.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { useDeckStore } from "@/lib/deck/store";
import type { DeckCard } from "@/lib/deck/types";
import { aDeckCard } from "@/test/builders/card";
import { aDeck } from "@/test/builders/deck";
import { installFakeDeckClient } from "@/test/fake-deck-client";
import { recordToasts } from "@/test/toast-recorder";

installFakeDeckClient();
recordToasts();

const DECK_ID = "deck-1";

const WHTZ = aDeckCard({
  id: "row-whtz",
  name: "Whtz, the Bibliophile",
  typeLine: "Legendary Creature — Homunculus",
  colorIdentity: ["U", "W"],
});

const island = (quantity: number): DeckCard =>
  aDeckCard({
    id: "row-Island",
    name: "Island",
    quantity,
    typeLine: "Basic Land — Island",
    oracleText: "({T}: Add {U}.)",
  });

const TALRAND = aDeckCard({
  id: "row-talrand",
  name: "Talrand, Sky Summoner",
  typeLine: "Legendary Creature — Merfolk Wizard",
  colorIdentity: ["U"],
});

const rats = (quantity: number): DeckCard =>
  aDeckCard({
    id: "row-Relentless Rats",
    name: "Relentless Rats",
    quantity,
    typeLine: "Creature — Rat",
    oracleText:
      "Relentless Rats gets +1/+1 for each other creature you control named Relentless Rats.\nA deck can have any number of cards named Relentless Rats.",
  });

const solRing = (quantity: number): DeckCard =>
  aDeckCard({
    id: "row-Sol Ring",
    name: "Sol Ring",
    quantity,
    typeLine: "Artifact",
    oracleText: "{T}: Add {C}{C}.",
  });

const dwarves = (quantity: number): DeckCard =>
  aDeckCard({
    id: "row-Seven Dwarves",
    name: "Seven Dwarves",
    quantity,
    typeLine: "Creature — Dwarf",
    oracleText:
      "Seven Dwarves gets +1/+1 for each other creature named Seven Dwarves you control.\nA deck can have up to seven cards named Seven Dwarves.",
  });

/** Opens a Commander deck led by `commander`, holding `cards`, as the active deck. */
function openDeck(commander: DeckCard | null, ...cards: DeckCard[]): void {
  useDeckStore.setState({
    decks: { [DECK_ID]: aDeck({ id: DECK_ID, commander, cards }) },
    activeDeckId: DECK_ID,
    isSyncing: false,
    gameChangerNames: new Set(),
    bannedNames: new Set(),
    undoStack: [],
  });
}

function copiesOf(name: string): number | undefined {
  return useDeckStore
    .getState()
    .decks[DECK_ID]?.cards.find((card) => card.name === name)?.quantity;
}

beforeEach(() => {
  useDeckStore.setState({ decks: {}, activeDeckId: null });
});

describe("the copy limit under Whtz, the Bibliophile (CR 903.5e)", () => {
  it("lets a Whtz deck step a basic Island past 99 copies: the deck has no maximum size", async () => {
    openDeck(WHTZ, island(99));

    await useDeckStore.getState().updateCardQuantity("row-Island", 1);

    expect(copiesOf("Island")).toBe(100);
  });

  it("lets a Whtz deck take a hundredth Relentless Rats: its text allows any number", async () => {
    openDeck(WHTZ, rats(99));

    await useDeckStore.getState().addDeckCard(rats(1));

    expect(copiesOf("Relentless Rats")).toBe(100);
  });

  it("still refuses a second Sol Ring under Whtz: the singleton rule is a copy rule (CR 903.5b)", async () => {
    openDeck(WHTZ, solRing(1));

    await useDeckStore.getState().updateCardQuantity("row-Sol Ring", 1);

    expect(copiesOf("Sol Ring")).toBe(1);
  });

  it("still holds Seven Dwarves to seven under Whtz: its text says up to seven (CR 101.1)", async () => {
    openDeck(WHTZ, dwarves(7));

    await useDeckStore.getState().updateCardQuantity("row-Seven Dwarves", 1);

    expect(copiesOf("Seven Dwarves")).toBe(7);
  });

  it("keeps the 99-copy cap when Whtz is in the 99, not the command zone", async () => {
    openDeck(TALRAND, { ...WHTZ, id: "row-whtz-in-99" }, island(99));

    await useDeckStore.getState().updateCardQuantity("row-Island", 1);

    expect(copiesOf("Island")).toBe(99);
  });

  it("keeps the 99-copy cap under a commander that is no rulebreaker", async () => {
    openDeck(TALRAND, island(99));

    await useDeckStore.getState().updateCardQuantity("row-Island", 1);

    expect(copiesOf("Island")).toBe(99);
  });
});
