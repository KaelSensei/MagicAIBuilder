/**
 * The editor says in words, not by a red ring alone, that a card's colour
 * identity leaves the commander's (CR 903.5c; WCAG 1.4.1, use of colour).
 * The words appear on that card's list row and grid tile, on no card the
 * commander's colours allow, and on no card a rulebreaker commander admits
 * (CR 903.5e), which carries its own note instead.
 *
 * Sociable: the editor, its rows and tiles, the deck store and the real
 * catalogs. MSW answers the shared Scryfall cache the rows read outside English.
 */
import { screen } from "@testing-library/react";
import { DndContext } from "@dnd-kit/core";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RECORDED_RULEBREAKER_CARDS } from "@/modules/format-rules/domain/fixtures/rulebreaker-cards-v1";
import { useDeckStore } from "@/lib/deck/store";
import { EMPTY_SEARCH_RESPONSE } from "@/lib/scryfall/types";
import type { Deck } from "@/lib/deck/types";
import { aDeckCard } from "@/test/builders/card";
import { aDeck } from "@/test/builders/deck";
import { setupMsw } from "@/test/msw";
import { renderWithProviders, type TestLocale } from "@/test/render";
import { DeckEditor } from "./DeckEditor";

/** Giada, Font of Hope: a mono-white commander that is no rulebreaker. */
const GIADA = aDeckCard({
  id: "giada",
  name: "Giada, Font of Hope",
  typeLine: "Legendary Creature — Angel Vampire",
  colorIdentity: ["W"],
  category: "commander",
});
/** Seluma, Light of Aysen: a white rulebreaker that admits any Angel. */
const SELUMA = aDeckCard({
  id: "seluma",
  name: RECORDED_RULEBREAKER_CARDS.seluma.name,
  cmc: RECORDED_RULEBREAKER_CARDS.seluma.cmc,
  typeLine: RECORDED_RULEBREAKER_CARDS.seluma.type_line,
  colorIdentity: [...RECORDED_RULEBREAKER_CARDS.seluma.color_identity],
  category: "commander",
});
/** Fallen Angel, a mono-black Angel: outside a white identity. */
const FALLEN_ANGEL = aDeckCard({
  id: "row-fallen-angel",
  scryfallId: "scryfall-fallen-angel",
  name: "Fallen Angel",
  cmc: 5,
  typeLine: "Creature — Angel",
  colorIdentity: ["B"],
  category: "creature",
});
/** Serra Angel, a mono-white Angel: inside a white identity. */
const SERRA_ANGEL = aDeckCard({
  id: "row-serra-angel",
  scryfallId: "scryfall-serra-angel",
  name: "Serra Angel",
  cmc: 5,
  typeLine: "Creature — Angel",
  colorIdentity: ["W"],
  category: "creature",
});

const LABEL = "Outside commander color identity";

/** Opens `deck` in the store, in `view`, and renders the editor on it. */
function renderEditor(
  deck: Deck,
  view: "list" | "grid",
  locale: TestLocale = "en"
) {
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

beforeEach(() => {
  localStorage.clear();
  useDeckStore.setState(useDeckStore.getInitialState(), true);
});

describe("the editor names an identity violation in words", () => {
  setupMsw(
    http.get("/api/cache/search", () =>
      HttpResponse.json({ hit: true, data: EMPTY_SEARCH_RESPONSE })
    )
  );

  it.each(["list", "grid"] as const)(
    "labels the off-colour card only, in the %s view",
    (view) => {
      renderEditor(
        aDeck({ commander: GIADA, cards: [FALLEN_ANGEL, SERRA_ANGEL] }),
        view
      );

      expect(screen.getAllByText(LABEL)).toHaveLength(1);
    }
  );

  it("puts the label beside the card it is about, outside every button", () => {
    renderEditor(aDeck({ commander: GIADA, cards: [FALLEN_ANGEL] }), "grid");
    const tile = screen.getByRole("button", {
      name: "Remove Fallen Angel",
    }).parentElement;
    const label = screen.getByText(LABEL);

    expect(tile).toContainElement(label);
    expect(label.closest("button")).toBeNull();
  });

  it("labels no card a rulebreaker commander admits", () => {
    renderEditor(aDeck({ commander: SELUMA, cards: [FALLEN_ANGEL] }), "list");

    expect(
      screen.getByText("Allowed by Seluma, Light of Aysen")
    ).toBeInTheDocument();
    expect(screen.queryByText(LABEL)).not.toBeInTheDocument();
  });

  it("writes the label in French", async () => {
    renderEditor(
      aDeck({ commander: GIADA, cards: [FALLEN_ANGEL] }),
      "list",
      "fr"
    );

    expect(
      await screen.findByText("Hors identité couleur du commandant")
    ).toBeInTheDocument();
  });
});
