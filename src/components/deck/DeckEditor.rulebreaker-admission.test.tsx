/**
 * The editor list names the rulebreaker commander that admits an off-identity
 * card on that card's line (CR 903.5e; I-03 scope line of 2026-11-16). The
 * note is text, opens a plain-words reason natively from the keyboard, and
 * appears for no card the commander's colours already allow (CR 903.5c), under
 * a commander that is no rulebreaker, or for a rulebreaker in the 99.
 *
 * Sociable: the editor, its list rows, the deck store and the real catalogs.
 * MSW answers the shared Scryfall cache the rows read outside English.
 */
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DndContext } from "@dnd-kit/core";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  RECORDED_RULEBREAKER_CARDS,
  type RecordedRulebreakerCard,
} from "@/modules/format-rules/domain/fixtures/rulebreaker-cards-v1";
import { useDeckStore } from "@/lib/deck/store";
import { EMPTY_SEARCH_RESPONSE } from "@/lib/scryfall/types";
import type { Deck, DeckCard } from "@/lib/deck/types";
import { aDeckCard } from "@/test/builders/card";
import { aDeck } from "@/test/builders/deck";
import { setupMsw } from "@/test/msw";
import { renderWithProviders, type TestLocale } from "@/test/render";
import { DeckEditor } from "./DeckEditor";

const { grizzlegom, seluma } = RECORDED_RULEBREAKER_CARDS;

/** The recorded card as the deck stores its commander. */
function asCommander(card: RecordedRulebreakerCard): DeckCard {
  return aDeckCard({
    id: `commander-${card.oracle_id}`,
    name: card.name,
    cmc: card.cmc,
    typeLine: card.type_line,
    colorIdentity: [...card.color_identity],
    category: "commander",
  });
}

/** A main-deck row; card data follows Scryfall. */
function row(name: string, card: Partial<DeckCard>): DeckCard {
  const slug = name.toLowerCase().replaceAll(/[^a-z]+/g, "-");
  return aDeckCard({
    id: `row-${slug}`,
    scryfallId: `scryfall-${slug}`,
    name,
    ...card,
  });
}

/** Fallen Angel, a mono-black Angel ({3}{B}{B}). */
const FALLEN_ANGEL = row("Fallen Angel", {
  cmc: 5,
  typeLine: "Creature — Angel",
  colorIdentity: ["B"],
  category: "creature",
});
/** Serra Angel, a mono-white Angel: inside Seluma's white identity. */
const SERRA_ANGEL = row("Serra Angel", {
  cmc: 5,
  typeLine: "Creature — Angel",
  colorIdentity: ["W"],
  category: "creature",
});
const SWAMP = row("Swamp", {
  typeLine: "Basic Land — Swamp",
  colorIdentity: ["B"],
  category: "land",
});
const PLAINS = row("Plains", {
  typeLine: "Basic Land — Plains",
  colorIdentity: ["W"],
  category: "land",
});
/** Underground River, a nonbasic land of identity UB. */
const UNDERGROUND_RIVER = row("Underground River", {
  typeLine: "Land",
  colorIdentity: ["U", "B"],
  category: "land",
});
/** Giada, Font of Hope: a white Angel commander that is no rulebreaker. */
const GIADA = aDeckCard({
  id: "giada",
  name: "Giada, Font of Hope",
  typeLine: "Legendary Creature — Angel Vampire",
  colorIdentity: ["W"],
  category: "commander",
});

/** Opens `deck` in the store, in `view`, and renders the editor on it. */
function renderEditor(deck: Deck, view: "list" | "grid", locale: TestLocale) {
  useDeckStore.setState({
    decks: { [deck.id]: deck },
    activeDeckId: deck.id,
    isSyncing: false,
    deckViewMode: view,
  });
  renderWithProviders(
    <DndContext>
      <DeckEditor deck={deck} onRemoveCard={vi.fn()} />
    </DndContext>,
    { locale }
  );
}

/** Renders the editor on `deck` in the list view. */
function renderList(deck: Deck, locale: TestLocale = "en") {
  renderEditor(deck, "list", locale);
}

/** Renders the editor on `deck` in the grid view, in English. */
function renderGrid(deck: Deck) {
  renderEditor(deck, "grid", "en");
}

beforeEach(() => {
  localStorage.clear();
  useDeckStore.setState(useDeckStore.getInitialState(), true);
});

describe("the editor list names the rulebreaker that admits an off-identity card", () => {
  setupMsw(
    http.get("/api/cache/search", () =>
      HttpResponse.json({ hit: true, data: EMPTY_SEARCH_RESPONSE })
    )
  );

  it("shows 'Allowed by Seluma, Light of Aysen' on a mono-black Angel's line, with the rule in plain words", () => {
    renderList(
      aDeck({ commander: asCommander(seluma), cards: [FALLEN_ANGEL] })
    );

    expect(
      screen.getByText("Allowed by Seluma, Light of Aysen")
    ).toHaveAccessibleDescription(
      "Fallen Angel is outside your commander's color identity. As your commander, Seluma, Light of Aysen lets your deck include it in any color (rule 903.5e)."
    );
  });

  it("opens the reason from the note, which the keyboard reaches natively", async () => {
    renderList(
      aDeck({ commander: asCommander(seluma), cards: [FALLEN_ANGEL] })
    );
    const note = screen.getByText("Allowed by Seluma, Light of Aysen");
    const reason = screen.getByRole("note", { hidden: true });

    act(() => note.focus());
    expect(note).toHaveFocus();
    expect(reason).not.toBeVisible();

    await userEvent.click(note);

    expect(reason).toBeVisible();
  });

  it("names Seluma's basic land exception on an off-colour basic land's line", () => {
    renderList(aDeck({ commander: asCommander(seluma), cards: [SWAMP] }));

    expect(
      screen.getByText("Allowed by Seluma, Light of Aysen")
    ).toHaveAccessibleDescription(
      "Swamp is outside your commander's color identity. As your commander, Seluma, Light of Aysen lets your deck include any basic land, whatever its colors (rule 903.5e)."
    );
  });

  it("names Grizzlegom's land exception on an off-colour land's line", () => {
    renderList(
      aDeck({ commander: asCommander(grizzlegom), cards: [UNDERGROUND_RIVER] })
    );

    expect(
      screen.getByText("Allowed by Grizzlegom, Hurloon Hero")
    ).toHaveAccessibleDescription(
      "Underground River is outside your commander's color identity. As your commander, Grizzlegom, Hurloon Hero lets your deck include any land, whatever its colors (rule 903.5e)."
    );
  });

  it("shows no note on a card the commander's colours already allow", () => {
    renderList(
      aDeck({
        commander: asCommander(seluma),
        cards: [FALLEN_ANGEL, SERRA_ANGEL, PLAINS],
      })
    );

    expect(screen.getAllByText(/^Allowed by/)).toHaveLength(1);
  });

  it("shows no note under a commander that is no rulebreaker, even with Seluma in the 99", () => {
    const selumaInThe99 = {
      ...asCommander(seluma),
      id: "seluma-99",
      category: "creature" as const,
    };
    renderList(
      aDeck({ commander: GIADA, cards: [selumaInThe99, FALLEN_ANGEL, SWAMP] })
    );

    expect(
      screen.getByRole("button", { name: "Remove Fallen Angel" })
    ).toBeInTheDocument();
    expect(screen.queryByText(/^Allowed by/)).not.toBeInTheDocument();
  });

  it("writes the note and its reason in French", async () => {
    renderList(
      aDeck({ commander: asCommander(seluma), cards: [FALLEN_ANGEL] }),
      "fr"
    );

    expect(
      await screen.findByText("Autorisée par Seluma, Light of Aysen")
    ).toHaveAccessibleDescription(
      "Fallen Angel est hors de l’identité couleur de votre commandant. En tant que commandant, Seluma, Light of Aysen permet à votre deck de l’inclure quelle que soit sa couleur (règle 903.5e)."
    );
  });
});

describe("the editor grid names the rulebreaker that admits an off-identity card", () => {
  setupMsw(
    http.get("/api/cache/search", () =>
      HttpResponse.json({ hit: true, data: EMPTY_SEARCH_RESPONSE })
    )
  );

  it("shows 'Allowed by Seluma, Light of Aysen' on a mono-black Angel's tile, with the rule in plain words", () => {
    renderGrid(
      aDeck({ commander: asCommander(seluma), cards: [FALLEN_ANGEL] })
    );

    const note = screen.getByText("Allowed by Seluma, Light of Aysen");
    expect(note).toHaveAccessibleName("Allowed by Seluma, Light of Aysen");
    expect(note).toHaveAccessibleDescription(
      "Fallen Angel is outside your commander's color identity. As your commander, Seluma, Light of Aysen lets your deck include it in any color (rule 903.5e)."
    );
  });

  it("opens the reason from the keyboard-reachable note, which sits in no button of the tile", async () => {
    renderGrid(
      aDeck({ commander: asCommander(seluma), cards: [FALLEN_ANGEL] })
    );
    const tile = screen.getByRole("button", {
      name: "Remove Fallen Angel",
    }).parentElement;
    const note = screen.getByText("Allowed by Seluma, Light of Aysen");
    const reason = screen.getByRole("note", { hidden: true });

    expect(tile).toContainElement(note);
    expect(note.closest("button")).toBeNull();
    act(() => note.focus());
    expect(note).toHaveFocus();
    expect(reason).not.toBeVisible();

    await userEvent.click(note);

    expect(reason).toBeVisible();
  });

  it("shows no note on a tile whose card the commander's colours already allow", () => {
    renderGrid(
      aDeck({
        commander: asCommander(seluma),
        cards: [FALLEN_ANGEL, SERRA_ANGEL, PLAINS],
      })
    );

    expect(screen.getAllByText(/^Allowed by/)).toHaveLength(1);
  });

  it("shows no note under a commander that is no rulebreaker, even with Seluma in the 99", () => {
    const selumaInThe99 = {
      ...asCommander(seluma),
      id: "seluma-99",
      category: "creature" as const,
    };
    renderGrid(
      aDeck({ commander: GIADA, cards: [selumaInThe99, FALLEN_ANGEL, SWAMP] })
    );

    expect(
      screen.getByRole("button", { name: "Remove Fallen Angel" })
    ).toBeInTheDocument();
    expect(screen.queryByText(/^Allowed by/)).not.toBeInTheDocument();
  });
});
