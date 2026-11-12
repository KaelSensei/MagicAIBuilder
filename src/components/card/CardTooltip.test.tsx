import { describe, it, expect, vi, afterEach } from "vitest";
import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import React from "react";
import { CardTooltip } from "./CardTooltip";
import { LocalizedDeckTextProvider } from "./LocalizedDeckTextContext";
import * as scryfallClient from "@/lib/scryfall/client";
import type { DeckCard } from "@/lib/deck/types";
import type { ScryfallCard } from "@/lib/scryfall/types";
import { aDeckCard } from "@/test/builders/card";
import { renderWithProviders, type TestLocale } from "@/test/render";

vi.mock(import("@/lib/scryfall/client"));

const card: DeckCard = aDeckCard({
  id: "sol-ring",
  scryfallId: "sol-ring",
  name: "Sol Ring",
  manaCost: "{1}",
  cmc: 1,
  typeLine: "Artifact",
  category: "artifact",
  price: 1.5,
  imageUri: "https://img/en.jpg",
});

const frPrinting: ScryfallCard = {
  id: "fr-1",
  name: "Sol Ring",
  lang: "fr",
  printed_name: "Anneau solaire",
  cmc: 1,
  type_line: "Artefact",
  color_identity: [],
  image_uris: { small: "", normal: "https://img/fr.jpg", large: "", art_crop: "", border_crop: "", png: "" },
};

function renderTooltip(locale: TestLocale, withProvider: boolean) {
  const tooltip = (
    <CardTooltip card={card}>
      <span>row</span>
    </CardTooltip>
  );
  return renderWithProviders(
    withProvider ? (
      <LocalizedDeckTextProvider names={["Sol Ring"]}>
        {tooltip}
      </LocalizedDeckTextProvider>
    ) : (
      tooltip
    ),
    { locale }
  );
}

async function hover() {
  vi.useFakeTimers();
  fireEvent.mouseEnter(screen.getByText("row"), { clientX: 10, clientY: 10 });
  await act(async () => {
    vi.advanceTimersByTime(400);
  });
  vi.useRealTimers();
}

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("CardTooltip", () => {
  it("shows the English image when no localised printing is known", async () => {
    renderTooltip("en", false);
    await hover();
    const img = screen.getByRole("img", { name: "Sol Ring" });
    expect(img).toHaveAttribute("src", "https://img/en.jpg");
    expect(screen.getByText(/USD\s*1\.50/)).toBeInTheDocument();
  });

  it("shows a card stored with Scryfall's JPEG from the WebP grid", async () => {
    const stored: DeckCard = {
      ...card,
      imageUri:
        "https://cards.scryfall.io/normal/front/f/c/fc817e07-c1f3-469f-9cf7-0945dea7400f.jpg?1793021181",
    };
    renderWithProviders(
      <CardTooltip card={stored}>
        <span>row</span>
      </CardTooltip>
    );
    await hover();
    expect(screen.getByRole("img", { name: "Sol Ring" })).toHaveAttribute(
      "src",
      "https://cards.scryfall.io/grid/front/f/c/fc817e07-c1f3-469f-9cf7-0945dea7400f.webp?1793021181"
    );
  });

  it("shows the translated printing's image for a French viewer", async () => {
    vi.mocked(scryfallClient.fetchLocalizedPrintingsByNames).mockResolvedValueOnce([frPrinting]);
    renderTooltip("fr", true);
    await waitFor(() =>
      expect(scryfallClient.fetchLocalizedPrintingsByNames).toHaveBeenCalled()
    );
    await hover();
    await waitFor(() =>
      expect(screen.getByRole("img", { name: "Anneau solaire" })).toHaveAttribute(
        "src",
        "https://img/fr.jpg"
      )
    );
  });

  it("labels the displayed French price as USD instead of implying euros", async () => {
    renderTooltip("fr", false);
    await hover();

    expect(screen.getByText(/1,50\s*USD/)).toBeInTheDocument();
  });
});
