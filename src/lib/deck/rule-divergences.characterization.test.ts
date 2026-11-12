/**
 * Characterization suite: where today's deck rules and analysis disagree with
 * themselves.
 *
 * One question gets different answers depending on which module asks it: how
 * many Game Changers a deck has, which zones the colour identity rule checks,
 * what counts as a land, and what the deck costs. Each test pins every answer
 * side by side on one deck, odd parts included, and names the plan row that
 * will unify it (the owner's analysis decision OD-07 says how). Structural
 * moves (FR-02 to FR-04, DA-01, DA-02) must leave these tests green; only the
 * named `fix/` pull request changes them. The shared deck page's own numbers
 * are pinned in `components/deck/ShareDeckView.test.tsx` ("ShareDeckView
 * against computeDeckStats").
 *
 * Already unified since the audit, so not pinned here:
 * - Game Changer limits per bracket: the badge and the bracket floor read
 *   `BRACKET_DEFINITIONS` (#1343); the add-card toast still writes "3" by
 *   hand, which matches Bracket 3 today.
 * - The basic-land test: every copy-limit check calls `isBasicLand` (#1349).
 * - The commander pairing rule: the store, bulk edit and the AI path call
 *   `pairCommanders` / `canPairCommanders` (#1352).
 *
 * @module deck/rule-divergences.characterization.test
 */
import type { QueryClient } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDeckPrice } from "@/hooks/useDeckPrice";
import { useGameChangers } from "@/hooks/useGameChangers";
import { useToastStore, type ToastMessage } from "@/hooks/useToast";
import { previewCardPackage } from "@/lib/community/card-package-preview";
import {
  analyzeOpeningHandLands,
  isOpeningHandLand,
} from "@/lib/playtest/opening-hand-evidence";
import type { ScryfallCard } from "@/lib/scryfall/types";
import { aTestQueryClient, renderHookWithProviders } from "@/test/render";
import {
  getColorIdentityViolations,
  isCardOutsideColorIdentity,
} from "./color-identity";
import {
  divergenceCard,
  RULE_DIVERGENCE_DECK,
} from "./fixtures/rule-divergence-deck";
import { computeDeckStats } from "./stats";
import { useDeckStore } from "./store";
import type { Deck, DeckCard } from "./types";

// ---------------------------------------------------------------------------
// Harness
// ---------------------------------------------------------------------------

/** A query cache that already holds an empty Game Changers list, so the hook fetches nothing. */
function withGameChangersList(): QueryClient {
  const client = aTestQueryClient();
  client.setQueryData(["scryfall", "game-changers"], []);
  return client;
}

/** Stands in for the deck API: every write succeeds, a new row gets an id. */
async function deckApiAnswer(
  _input: string | URL | Request,
  init: RequestInit = {}
): Promise<Response> {
  const body: unknown =
    typeof init.body === "string" ? JSON.parse(init.body) : {};
  const answer =
    init.method === "POST" && typeof body === "object" && body !== null
      ? { ...body, id: "row-saved" }
      : {};
  return new Response(JSON.stringify(answer), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function openInStore(deck: Deck, gameChangerNames: readonly string[]): void {
  useDeckStore.setState({
    decks: { [deck.id]: deck },
    activeDeckId: deck.id,
    gameChangerNames: new Set(gameChangerNames),
  });
}

function storedDeck(deck: Deck): Deck {
  const stored = useDeckStore.getState().decks[deck.id];
  if (!stored) throw new Error(`deck ${deck.id} left the store`);
  return stored;
}

function warningToasts(): readonly ToastMessage[] {
  return useToastStore
    .getState()
    .toasts.filter((toast) => toast.type === "warning")
    .map((toast) => toast.message);
}

beforeEach(() => {
  vi.stubGlobal("fetch", deckApiAnswer);
  useToastStore.setState({ toasts: [] });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ---------------------------------------------------------------------------
// Decks
// ---------------------------------------------------------------------------

const DECK = RULE_DIVERGENCE_DECK;

const CYCLONIC_RIFT: ScryfallCard = {
  id: "scry-cyclonic-rift",
  name: "Cyclonic Rift",
  mana_cost: "{1}{U}",
  cmc: 2,
  type_line: "Instant",
  oracle_text:
    "Return target nonland permanent you don't control to its owner's hand.\nOverload {6}{U}",
  color_identity: ["U"],
  prices: { usd: "35.00" },
  keywords: ["Overload"],
};

/** The Game Changers the store's list knows for these tests. */
const GAME_CHANGER_NAMES = ["Cyclonic Rift", "Rhystic Study", "The One Ring"];

/** A deck whose one Game Changer row holds two copies, which the server accepts (see B2-31). */
const TWO_COPY_DECK: Deck = {
  ...DECK,
  companion: null,
  cards: [
    divergenceCard({
      name: "Rhystic Study",
      manaCost: "{2}{U}",
      cmc: 3,
      typeLine: "Enchantment",
      colorIdentity: ["U"],
      isGameChanger: true,
      category: "draw",
      quantity: 2,
    }),
  ],
  maybeboard: [],
};

function offColourCard(
  name: string,
  colorIdentity: readonly string[],
  zone: DeckCard["zone"]
): DeckCard {
  return divergenceCard({
    name,
    colorIdentity: [...colorIdentity],
    zone,
    isMaybeboard: zone === "maybeboard",
  });
}

const SWORDS_TO_PLOWSHARES = offColourCard(
  "Swords to Plowshares",
  ["W"],
  "maybeboard"
);

/** Tatyova (green-blue) with a card outside her identity in each zone. */
const OFF_COLOUR_DECK: Deck = {
  ...DECK,
  companion: null,
  cards: [
    offColourCard("Lightning Bolt", ["R"], "main"),
    offColourCard("Path to Exile", ["W"], "sideboard"),
    SWORDS_TO_PLOWSHARES,
  ],
  maybeboard: [SWORDS_TO_PLOWSHARES],
};

/**
 * A colourless card whose colour identity was stored as "C". Scryfall never
 * sends "C", but the add-card and card-package schemas accept it (B2-60).
 * CR 105.2c: a colourless object has no colour.
 */
const MIND_STONE_STORED_AS_C = offColourCard("Mind Stone", ["C"], "main");

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Game Changer count", () => {
  it("computeDeckStats currently counts copies in the command zone and the main deck only: 1 for the divergence deck (pinned; see B2-38)", () => {
    const stats = computeDeckStats(DECK);

    expect(stats.gameChangersCount).toBe(1);
    expect(stats.gameChangersList).toEqual(["Rhystic Study"]);
  });

  it("useGameChangers currently counts rows in every zone, Considering included: 2 (pinned; no production caller; see B2-38)", () => {
    const { result } = renderHookWithProviders(() => useGameChangers(DECK), {
      queryClient: withGameChangersList(),
    });

    expect(result.current.count).toBe(2);
    expect(result.current.names).toEqual(["Rhystic Study", "The One Ring"]);
  });

  it("the add-card toast currently counts rows in every zone plus the commander: adding Cyclonic Rift announces 3/3 while computeDeckStats then counts 2 (pinned; see B2-38)", async () => {
    openInStore(DECK, GAME_CHANGER_NAMES);

    await useDeckStore.getState().addCard(CYCLONIC_RIFT);

    expect(warningToasts()).toEqual([
      "⚡ Cyclonic Rift is a Game Changer (3/3). Bracket 3 minimum applies.",
    ]);
    expect(computeDeckStats(storedDeck(DECK)).gameChangersCount).toBe(2);
  });

  it("the add-card toast currently fires for a Game Changer put in Considering, which computeDeckStats leaves out (pinned; see B2-38)", async () => {
    openInStore(DECK, GAME_CHANGER_NAMES);

    await useDeckStore
      .getState()
      .addCard(CYCLONIC_RIFT, undefined, "maybeboard");

    expect(warningToasts()).toEqual([
      "⚡ Cyclonic Rift is a Game Changer (3/3). Bracket 3 minimum applies.",
    ]);
    expect(computeDeckStats(storedDeck(DECK)).gameChangersCount).toBe(1);
  });

  it("currently counts a two-copy row as 2 in computeDeckStats but as 1 in useGameChangers (pinned; see B2-38)", () => {
    const { result } = renderHookWithProviders(
      () => useGameChangers(TWO_COPY_DECK),
      { queryClient: withGameChangersList() }
    );

    expect(computeDeckStats(TWO_COPY_DECK).gameChangersCount).toBe(2);
    expect(result.current.count).toBe(1);
  });
});

describe("colour identity", () => {
  // CR 903.5c: every colour in a card's identity must be in the commander's.
  it("getColorIdentityViolations, behind the stats and the deck editor, currently checks the main deck only: the off-colour Sideboard and Considering rows pass (pinned; FR-04 makes the scope explicit)", () => {
    const flagged = getColorIdentityViolations(OFF_COLOUR_DECK).map(
      (violation) => violation.cardName
    );

    expect(flagged).toEqual(["Lightning Bolt"]);
    expect(computeDeckStats(OFF_COLOUR_DECK).colorIdentityViolations).toEqual([
      "Lightning Bolt",
    ]);
  });

  it('currently treats an identity stored as "C" as a colour outside the commander\'s in getColorIdentityViolations and isCardOutsideColorIdentity, but not in the card-package preview (pinned; see B2-60, FR-04)', () => {
    const deckWithMindStone: Deck = {
      ...OFF_COLOUR_DECK,
      cards: [MIND_STONE_STORED_AS_C],
      maybeboard: [],
    };
    const packagePreview = previewCardPackage(
      [
        {
          scryfallId: "scry-mind-stone",
          name: "Mind Stone",
          quantity: 1,
          colorIdentity: ["C"],
          isBanned: false,
          isBasicLand: false,
        },
      ],
      {
        format: "commander",
        commanderColorIdentity: ["G", "U"],
        existingCards: [],
      }
    );

    expect(
      getColorIdentityViolations(deckWithMindStone).map(
        (violation) => violation.cardName
      )
    ).toEqual(["Mind Stone"]);
    expect(
      isCardOutsideColorIdentity(new Set(["G", "U"]), { colorIdentity: ["C"] })
    ).toBe(true);
    expect(packagePreview.cards.map((card) => card.status)).toEqual(["ready"]);
  });
});

describe("land count", () => {
  it("computeDeckStats currently counts lands by deck category, so a land filed as ramp leaves the land count and joins the curve, while the playtest reads the type line (pinned; see B2-39)", () => {
    const stats = computeDeckStats(DECK);
    const evolvingWilds = DECK.cards.find(
      (card) => card.name === "Evolving Wilds"
    );
    const openingHand = DECK.cards.filter((card) =>
      ["Evolving Wilds", "Forest", "Island", "Rhystic Study"].includes(
        card.name
      )
    );

    expect(stats.lands).toBe(19);
    expect(stats.ramp).toBe(3);
    expect(stats.manaCurve).toEqual({ 0: 1, 3: 3, 5: 1 });
    expect(evolvingWilds && isOpeningHandLand(evolvingWilds)).toBe(true);
    expect(analyzeOpeningHandLands(openingHand).landCount).toBe(3);
  });
});

describe("deck price", () => {
  it("computeDeckStats currently prices the commander and the main deck, while useDeckPrice adds Considering; neither counts the companion (pinned; see B2-40)", () => {
    openInStore(DECK, GAME_CHANGER_NAMES);

    const { result } = renderHook(() => useDeckPrice());

    expect(computeDeckStats(DECK).totalPrice).toBe(33.25);
    expect(result.current.totalPrice).toBe(83.25);
  });
});
