import { describe, it, expect, vi, afterEach } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import React from "react";
import { CardTooltip } from "./CardTooltip";
import { LocalizedDeckTextProvider } from "./LocalizedDeckTextContext";
import * as scryfallClient from "@/lib/scryfall/client";
import type { DeckCard } from "@/lib/deck/types";
import type { ScryfallCard } from "@/lib/scryfall/types";

vi.mock("@/lib/scryfall/client");

const card: DeckCard = {
  id: "sol-ring", name: "Sol Ring", manaCost: "{1}", cmc: 1, typeLine: "Artifact",
  oracleText: "", colorIdentity: [], isGameChanger: false, isBanned: false,
  price: 1.5, imageUri: "https://img/en.jpg", artCropUri: "",
  category: "artifact", quantity: 1, zone: "main", scryfallId: "sol-ring",
};

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

function renderTooltip(locale: string, withProvider: boolean) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const tooltip = (
    <CardTooltip card={card}>
      <span>row</span>
    </CardTooltip>
  );
  return render(
    <NextIntlClientProvider locale={locale} messages={{}}>
      <QueryClientProvider client={client}>
        {withProvider ? (
          <LocalizedDeckTextProvider names={["Sol Ring"]}>{tooltip}</LocalizedDeckTextProvider>
        ) : (
          tooltip
        )}
      </QueryClientProvider>
    </NextIntlClientProvider>
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
    expect(screen.getByText("$1.50")).toBeInTheDocument();
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
});
