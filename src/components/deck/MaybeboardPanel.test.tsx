import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";

import { MaybeboardPanel } from "./MaybeboardPanel";
import deckMessages from "@/messages/en/deck.json";
import builderMessages from "@/messages/en/builder.json";
import type { DeckCard } from "@/lib/deck/types";

function makeCard(overrides: Partial<DeckCard> = {}): DeckCard {
  return {
    id: "card-1",
    name: "Sol Ring",
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
    category: "ramp",
    quantity: 1,
    zone: "maybeboard",
    ...overrides,
  };
}

function renderPanel(cards: readonly DeckCard[]) {
  render(
    <NextIntlClientProvider
      locale="en"
      messages={{ deck: deckMessages, builder: builderMessages }}
    >
      <MaybeboardPanel
        cards={cards}
        onMoveToDecks={vi.fn()}
        onRemove={vi.fn()}
      />
    </NextIntlClientProvider>
  );
}

describe("MaybeboardPanel", () => {
  it("calls the zone what the tab calls it", () => {
    // The panel said "Maybeboard" while the zone tab said "Considering", so
    // the same zone had two names depending on where you looked. Both now read
    // the one key in the builder catalog.
    renderPanel([]);
    expect(screen.getAllByText(builderMessages.zones.considering).length).toBeGreaterThan(0);
    expect(screen.queryByText("Maybeboard")).toBeNull();
  });

  it("says the zone is empty rather than showing nothing", () => {
    renderPanel([]);
    expect(screen.getByText("No cards here yet")).toBeDefined();
  });

  it("spells out that these cards are outside the deck count", () => {
    renderPanel([]);
    expect(screen.getByText("Not counted in the 99")).toBeDefined();
  });

  it("lists the cards it holds", () => {
    renderPanel([makeCard()]);
    expect(screen.getByText("Sol Ring")).toBeDefined();
  });
});
