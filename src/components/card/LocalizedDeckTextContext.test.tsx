import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import React from "react";
import { CardListItem } from "./CardListItem";
import { LocalizedDeckTextProvider } from "./LocalizedDeckTextContext";
import enCard from "@/messages/en/card.json";
import enBuilder from "@/messages/en/builder.json";
import * as scryfallClient from "@/lib/scryfall/client";
import type { DeckCard } from "@/lib/deck/types";
import type { ScryfallCard } from "@/lib/scryfall/types";

vi.mock("@/lib/scryfall/client");
vi.mock("./CardTooltip", () => ({
  CardTooltip: ({ children }: { readonly children: React.ReactNode }) => <>{children}</>,
}));

function makeDeckCard(name: string): DeckCard {
  return {
    id: name, name, manaCost: "", cmc: 1, typeLine: "Artifact",
    oracleText: "", colorIdentity: [], isGameChanger: false,
    isBanned: false, price: null, imageUri: "", artCropUri: "",
    category: "artifact", quantity: 1, zone: "main", scryfallId: name,
  };
}

const frSolRing: ScryfallCard = {
  id: "fr-1",
  name: "Sol Ring",
  lang: "fr",
  printed_name: "Anneau solaire",
  cmc: 1,
  type_line: "Artefact",
  color_identity: [],
};

function renderRows(locale: string, withProvider: boolean) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const rows = (
    <>
      <CardListItem card={makeDeckCard("Sol Ring")} />
      <CardListItem card={makeDeckCard("Counterspell")} />
    </>
  );
  return render(
    <NextIntlClientProvider locale={locale} messages={{ card: enCard, builder: enBuilder }}>
      <QueryClientProvider client={client}>
        {withProvider ? (
          <LocalizedDeckTextProvider names={["Sol Ring", "Counterspell"]}>{rows}</LocalizedDeckTextProvider>
        ) : (
          rows
        )}
      </QueryClientProvider>
    </NextIntlClientProvider>
  );
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("LocalizedDeckTextProvider", () => {
  it("shows translated names to a French viewer and keeps untranslated cards English", async () => {
    vi.mocked(scryfallClient.fetchLocalizedPrintingsByNames).mockResolvedValueOnce([frSolRing]);
    renderRows("fr", true);

    await waitFor(() => expect(screen.getByText("Anneau solaire")).toBeInTheDocument());
    expect(screen.getByText("Counterspell")).toBeInTheDocument();
    expect(screen.queryByText("Sol Ring")).not.toBeInTheDocument();
  });

  it("renders English with no request when no provider is mounted", () => {
    renderRows("fr", false);
    expect(screen.getByText("Sol Ring")).toBeInTheDocument();
    expect(scryfallClient.fetchLocalizedPrintingsByNames).not.toHaveBeenCalled();
  });
});
