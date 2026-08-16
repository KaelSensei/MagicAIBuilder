import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";

import { PrintingSelectorModal } from "./PrintingSelectorModal";
import cardMessages from "@/messages/en/card.json";
import type { ScryfallCard } from "@/lib/scryfall/types";

const printingsResult = vi.hoisted(() => ({
  current: { data: undefined as { data: ScryfallCard[] } | undefined, isLoading: false },
}));

vi.mock("@/hooks/useCardPrintings", () => ({
  useCardPrintings: () => printingsResult.current,
}));

// Renders a next/image; irrelevant to the text assertions here.
vi.mock("next/image", () => ({ default: () => null }));

function makeCard(overrides: Partial<ScryfallCard> = {}): ScryfallCard {
  return {
    id: "en-1",
    name: "Lightning Bolt",
    cmc: 1,
    type_line: "Instant",
    oracle_text: "Lightning Bolt deals 3 damage to any target.",
    color_identity: ["R"],
    lang: "en",
    ...overrides,
  };
}

const FRENCH_PRINTING = makeCard({
  id: "fr-1",
  lang: "fr",
  printed_name: "Foudre",
  printed_type_line: "Éphémère",
  printed_text: "Foudre inflige 3 blessures à n'importe quelle cible.",
});

function renderModal(card: ScryfallCard) {
  return render(
    <NextIntlClientProvider locale="en" messages={{ card: cardMessages }}>
      <PrintingSelectorModal card={card} onSelect={() => {}} onClose={() => {}} />
    </NextIntlClientProvider>
  );
}

beforeEach(() => {
  printingsResult.current = { data: undefined, isLoading: false };
});

describe("PrintingSelectorModal", () => {
  it("shows the English text of an English printing", () => {
    renderModal(makeCard());
    expect(screen.getByText("Instant")).toBeDefined();
    expect(
      screen.getByText("Lightning Bolt deals 3 damage to any target.")
    ).toBeDefined();
  });

  it("shows the printed text when the previewed printing is localised", () => {
    printingsResult.current = { data: { data: [FRENCH_PRINTING] }, isLoading: false };
    renderModal(FRENCH_PRINTING);
    expect(screen.getByText("Foudre")).toBeDefined();
    expect(screen.getByText("Éphémère")).toBeDefined();
    expect(
      screen.getByText("Foudre inflige 3 blessures à n'importe quelle cible.")
    ).toBeDefined();
  });

  it("reads the previewed printing rather than the card it was opened with", () => {
    // The modal opens on the English card but the list resolves to the French
    // printing; the text panel must follow the list, not the opening card.
    printingsResult.current = { data: { data: [FRENCH_PRINTING] }, isLoading: false };
    renderModal(makeCard({ id: "missing-from-list" }));
    // Scoped to the heading: the English oracle name still appears in the
    // printings list, which is correct — it is what the card is searchable by.
    expect(screen.getByRole("heading").textContent).toBe("Foudre");
  });

  it("falls back to the English fields when a printing carries no printed text", () => {
    const partial = makeCard({ id: "fr-2", lang: "fr", printed_name: "Foudre" });
    printingsResult.current = { data: { data: [partial] }, isLoading: false };
    renderModal(partial);
    expect(screen.getByText("Foudre")).toBeDefined();
    expect(screen.getByText("Instant")).toBeDefined();
  });

  it("labels an empty rules box instead of hardcoding English", () => {
    printingsResult.current = { data: undefined, isLoading: false };
    renderModal(makeCard({ oracle_text: undefined }));
    expect(screen.getByText("No text")).toBeDefined();
  });
});
