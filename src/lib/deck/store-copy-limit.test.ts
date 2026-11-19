/**
 * The copy limit the deck store applies, by the active deck's format.
 *
 * Deck-building context. A constructed deck (Standard, Modern, Pioneer, Legacy,
 * Vintage, Pauper) holds up to four copies of a card (CR 100.2a); a singleton
 * deck (Commander, Brawl, Oathbreaker) holds one (CR 903.5b). Basic lands and
 * cards whose own text allows more are exempt in every format (CR 100.2a,
 * CR 903.5b, CR 101.1). Every store entry point that adds a copy applies the
 * same limit: `addCard`, `addDeckCard` and `updateCardQuantity`, including
 * the first add of a card, which clamps the quantity it is given.
 *
 * Sociable: the real store and deck client run; the fake deck API
 * (`src/test/fake-deck-client.ts`) answers the requests in memory.
 */
import { beforeEach, describe, expect, it } from "vitest";
import type { DeckFormat } from "@/lib/deck/formats";
import { useDeckStore } from "@/lib/deck/store";
import type { DeckCard } from "@/lib/deck/types";
import type { ScryfallCard } from "@/lib/scryfall/types";
import { aDeckCard } from "@/test/builders/card";
import { aDeck } from "@/test/builders/deck";
import { aScryfallCard } from "@/test/builders/scryfall";
import { installFakeDeckClient } from "@/test/fake-deck-client";
import { recordToasts } from "@/test/toast-recorder";

const deckApi = installFakeDeckClient();
recordToasts();

const DECK_ID = "deck-1";

const BOLT_TEXT = "Lightning Bolt deals 3 damage to any target.";
const RATS_TEXT =
  "Relentless Rats gets +1/+1 for each other creature you control named Relentless Rats.\nA deck can have any number of cards named Relentless Rats.";
const DWARVES_TEXT =
  "Seven Dwarves gets +1/+1 for each other creature named Seven Dwarves you control.\nA deck can have up to seven cards named Seven Dwarves.";

/** A deck row of `name`, at `quantity` copies, with the card text the limit reads. */
function row(
  name: string,
  quantity: number,
  text: Pick<DeckCard, "typeLine" | "oracleText">
): DeckCard {
  return aDeckCard({ id: `row-${name}`, name, quantity, ...text });
}

const bolt = (quantity: number): DeckCard =>
  row("Lightning Bolt", quantity, {
    typeLine: "Instant",
    oracleText: BOLT_TEXT,
  });
const solRing = (quantity: number): DeckCard =>
  row("Sol Ring", quantity, {
    typeLine: "Artifact",
    oracleText: "{T}: Add {C}{C}.",
  });
const mountain = (quantity: number): DeckCard =>
  row("Mountain", quantity, {
    typeLine: "Basic Land — Mountain",
    oracleText: "({T}: Add {R}.)",
  });
const rats = (quantity: number): DeckCard =>
  row("Relentless Rats", quantity, {
    typeLine: "Creature — Rat",
    oracleText: RATS_TEXT,
  });
const dwarves = (quantity: number): DeckCard =>
  row("Seven Dwarves", quantity, {
    typeLine: "Creature — Dwarf",
    oracleText: DWARVES_TEXT,
  });

/** The same card as the search results hand `addCard`. */
function searchResult(card: DeckCard): ScryfallCard {
  return aScryfallCard({
    name: card.name,
    type_line: card.typeLine,
    oracle_text: card.oracleText,
  });
}

/** Opens a deck of `format` holding these rows as the active deck. */
function openDeck(format: DeckFormat, ...cards: DeckCard[]): void {
  useDeckStore.setState({
    decks: { [DECK_ID]: aDeck({ id: DECK_ID, format, cards }) },
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

describe("adding a card from the search results (addCard)", () => {
  // CR 100.2a: a constructed deck may hold up to four cards with the same name.
  it("lets a Modern deck take a second, third and fourth Lightning Bolt and refuses a fifth", async () => {
    openDeck("modern", bolt(1));
    const { addCard } = useDeckStore.getState();

    await addCard(searchResult(bolt(1)));
    await addCard(searchResult(bolt(1)));
    await addCard(searchResult(bolt(1)));
    expect(copiesOf("Lightning Bolt")).toBe(4);

    await addCard(searchResult(bolt(1)));
    expect(copiesOf("Lightning Bolt")).toBe(4);
    expect(deckApi.updateCardQuantity).toHaveBeenCalledTimes(3);
    expect(deckApi.updateCardQuantity).toHaveBeenLastCalledWith(
      { deckId: DECK_ID },
      "row-Lightning Bolt",
      4
    );
  });

  // CR 903.5b: a Commander deck holds one card of each name but basic lands.
  it("lets a Commander deck refuse a second Sol Ring", async () => {
    openDeck("commander", solRing(1));

    await useDeckStore.getState().addCard(searchResult(solRing(1)));

    expect(copiesOf("Sol Ring")).toBe(1);
    expect(deckApi.updateCardQuantity).not.toHaveBeenCalled();
    expect(deckApi.addCard).not.toHaveBeenCalled();
  });

  // CR 101.1: a card's own text wins over the format's limit, in every format.
  it("lets a Commander deck take a second Relentless Rats", async () => {
    openDeck("commander", rats(1));

    await useDeckStore.getState().addCard(searchResult(rats(1)));

    expect(copiesOf("Relentless Rats")).toBe(2);
  });
});

describe("adding a deck card (addDeckCard)", () => {
  it("lets a Modern deck take a fourth Lightning Bolt and refuses a fifth", async () => {
    openDeck("modern", bolt(3));
    const { addDeckCard } = useDeckStore.getState();

    await addDeckCard(bolt(1));
    expect(copiesOf("Lightning Bolt")).toBe(4);

    await addDeckCard(bolt(1));
    expect(copiesOf("Lightning Bolt")).toBe(4);
    expect(deckApi.updateCardQuantity).toHaveBeenCalledTimes(1);
  });

  it("lets a Commander deck refuse a second Sol Ring", async () => {
    openDeck("commander", solRing(1));

    await useDeckStore.getState().addDeckCard(solRing(1));

    expect(copiesOf("Sol Ring")).toBe(1);
    expect(deckApi.updateCardQuantity).not.toHaveBeenCalled();
  });

  // CR 100.2a and CR 903.5b: basic lands are exempt from the limit in every format.
  it("lets a Modern deck take a fifth basic Mountain", async () => {
    openDeck("modern", mountain(4));

    await useDeckStore.getState().addDeckCard(mountain(1));

    expect(copiesOf("Mountain")).toBe(5);
  });
});

describe("stepping a card's quantity (updateCardQuantity)", () => {
  it("lets a Modern deck step Lightning Bolt from three to four copies and no further", async () => {
    openDeck("modern", bolt(3));
    const { updateCardQuantity } = useDeckStore.getState();

    await updateCardQuantity("row-Lightning Bolt", 1);
    expect(copiesOf("Lightning Bolt")).toBe(4);

    await updateCardQuantity("row-Lightning Bolt", 1);
    expect(copiesOf("Lightning Bolt")).toBe(4);
    expect(deckApi.updateCardQuantity).toHaveBeenCalledTimes(1);
  });

  it("keeps Sol Ring at one copy in a Commander deck", async () => {
    openDeck("commander", solRing(1));

    await useDeckStore.getState().updateCardQuantity("row-Sol Ring", 1);

    expect(copiesOf("Sol Ring")).toBe(1);
    expect(deckApi.updateCardQuantity).not.toHaveBeenCalled();
  });

  it("lets a Modern deck step a basic Mountain past four copies", async () => {
    openDeck("modern", mountain(4));

    await useDeckStore.getState().updateCardQuantity("row-Mountain", 1);

    expect(copiesOf("Mountain")).toBe(5);
  });

  // Seven Dwarves: "A deck can have up to seven cards named Seven Dwarves."
  it("stops a Modern deck at the seven Seven Dwarves the card itself allows", async () => {
    openDeck("modern", dwarves(6));
    const { updateCardQuantity } = useDeckStore.getState();

    await updateCardQuantity("row-Seven Dwarves", 1);
    expect(copiesOf("Seven Dwarves")).toBe(7);

    await updateCardQuantity("row-Seven Dwarves", 1);
    expect(copiesOf("Seven Dwarves")).toBe(7);
  });

  it("keeps a one-copy row at one when stepped down, and sends nothing", async () => {
    openDeck("commander", solRing(1));

    await useDeckStore.getState().updateCardQuantity("row-Sol Ring", -1);

    expect(copiesOf("Sol Ring")).toBe(1);
    expect(deckApi.updateCardQuantity).not.toHaveBeenCalled();
  });
});

// The first add of a card clamps the copies it asks for to the same limit an
// edit clamps to, silently, as `updateCardQuantity` does.
describe("the first add of a card", () => {
  /** The copies the add sent to the deck API. */
  function sentQuantity(): number | undefined {
    const [, payload] = deckApi.addCard.mock.lastCall ?? [];
    return payload?.quantity;
  }

  // CR 903.5b: a Commander deck holds one Sol Ring, however many one add asks for.
  it("adding 3 Sol Ring to a Commander deck in one add keeps 1", async () => {
    openDeck("commander");

    await useDeckStore
      .getState()
      .addCard(searchResult(solRing(1)), { quantity: 3 });

    expect(copiesOf("Sol Ring")).toBe(1);
    expect(sentQuantity()).toBe(1);
  });

  it("adding a row of 3 Sol Ring to a Commander deck keeps 1", async () => {
    openDeck("commander");

    await useDeckStore.getState().addDeckCard(solRing(3));

    expect(copiesOf("Sol Ring")).toBe(1);
    expect(sentQuantity()).toBe(1);
  });

  // CR 100.2a: a constructed deck holds up to four cards with the same name.
  it("adding 6 Lightning Bolt to a Modern deck in one add keeps 4", async () => {
    openDeck("modern");

    await useDeckStore
      .getState()
      .addCard(searchResult(bolt(1)), { quantity: 6 });

    expect(copiesOf("Lightning Bolt")).toBe(4);
    expect(sentQuantity()).toBe(4);
  });

  // Seven Dwarves: "A deck can have up to seven cards named Seven Dwarves."
  it("adding a row of 9 Seven Dwarves to a Modern deck keeps the 7 the card allows", async () => {
    openDeck("modern");

    await useDeckStore.getState().addDeckCard(dwarves(9));

    expect(copiesOf("Seven Dwarves")).toBe(7);
  });

  // CR 903.5b: basic lands are exempt from the singleton rule.
  it("adding 30 basic Mountains to a Commander deck in one add keeps 30", async () => {
    openDeck("commander");

    await useDeckStore
      .getState()
      .addCard(searchResult(mountain(1)), { quantity: 30 });

    expect(copiesOf("Mountain")).toBe(30);
  });

  // CR 101.1: Relentless Rats's own text allows any number of copies.
  it("adding a row of 20 Relentless Rats to a Commander deck keeps 20", async () => {
    openDeck("commander");

    await useDeckStore.getState().addDeckCard(rats(20));

    expect(copiesOf("Relentless Rats")).toBe(20);
  });

  it("adds one copy when the add names no quantity", async () => {
    openDeck("modern");

    await useDeckStore.getState().addCard(searchResult(bolt(1)));

    expect(copiesOf("Lightning Bolt")).toBe(1);
    expect(sentQuantity()).toBe(1);
  });
});

// Today's clamps that the copy-limit module (master plan FR-03) must keep or
// consciously change. Each test below says whether it pins a rule or a gap.
describe("the quantity clamps the store applies today", () => {
  it("currently ignores a search result for a basic land the deck already holds (pinned)", async () => {
    // The store skips it: the caller passes the wanted count on the first add.
    openDeck("commander", mountain(10));

    await useDeckStore.getState().addCard(searchResult(mountain(1)));

    expect(copiesOf("Mountain")).toBe(10);
    expect(deckApi.updateCardQuantity).not.toHaveBeenCalled();
    expect(deckApi.addCard).not.toHaveBeenCalled();
  });

  it("counts copies per zone: a Commander deck takes a Sol Ring in the sideboard beside the main-deck one", async () => {
    // CR 903.5b limits the deck; the sideboard row is matched separately.
    openDeck("commander", solRing(1));

    await useDeckStore
      .getState()
      .addCard(searchResult(solRing(1)), { zone: "sideboard" });

    const rows = useDeckStore
      .getState()
      .decks[DECK_ID]?.cards.filter((card) => card.name === "Sol Ring")
      .map((card) => [card.zone, card.quantity]);
    expect(rows).toEqual([
      ["main", 1],
      ["sideboard", 1],
    ]);
  });
});
