import { describe, it, expect, vi, afterEach } from "vitest";
import { screen } from "@testing-library/react";
import React from "react";
import { CardListItem } from "./CardListItem";
import { LocalizedDeckTextProvider } from "./LocalizedDeckTextContext";
import { BattlefieldZone } from "@/components/playtest/BattlefieldZone";
import * as scryfallClient from "@/lib/scryfall/client";
import type { DeckCard } from "@/lib/deck/types";
import type { ScryfallCard } from "@/lib/scryfall/types";
import { aDeckCard } from "@/test/builders/card";
import { renderWithProviders, type TestLocale } from "@/test/render";

vi.mock(import("@/lib/scryfall/client"));
vi.mock(import("./CardTooltip"), () => ({
  CardTooltip: ({ children }: { readonly children: React.ReactNode }) => <>{children}</>,
}));

function makeDeckCard(name: string): DeckCard {
  return aDeckCard({
    id: name,
    scryfallId: name,
    name,
    cmc: 1,
    typeLine: "Artifact",
    category: "artifact",
  });
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

function renderRows(locale: TestLocale, withProvider: boolean) {
  const rows = (
    <>
      <CardListItem card={makeDeckCard("Sol Ring")} />
      <CardListItem card={makeDeckCard("Counterspell")} />
    </>
  );
  return renderWithProviders(
    withProvider ? (
      <LocalizedDeckTextProvider names={["Sol Ring", "Counterspell"]}>
        {rows}
      </LocalizedDeckTextProvider>
    ) : (
      rows
    ),
    { locale }
  );
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("LocalizedDeckTextProvider", () => {
  it("shows translated names to a French viewer and keeps untranslated cards English", async () => {
    vi.mocked(scryfallClient.fetchLocalizedPrintingsByNames).mockResolvedValueOnce([frSolRing]);
    renderRows("fr", true);

    expect(await screen.findByText("Anneau solaire")).toBeInTheDocument();
    expect(screen.getByText("Counterspell")).toBeInTheDocument();
    expect(screen.queryByText("Sol Ring")).not.toBeInTheDocument();
  });

  it("localises a zone that maps over its cards, via useLocalizeDeckCard", async () => {
    vi.mocked(scryfallClient.fetchLocalizedPrintingsByNames).mockResolvedValueOnce([frSolRing]);
    renderWithProviders(
      <LocalizedDeckTextProvider names={["Sol Ring"]}>
        <BattlefieldZone
          battlefield={[
            { ...makeDeckCard("Sol Ring"), tapped: false, counters: 0 },
          ]}
          onTap={vi.fn()}
          onAddCounter={vi.fn()}
          onCreateCopy={vi.fn()}
          requiredTokens={[]}
          onCreateToken={vi.fn()}
          onRemove={vi.fn()}
        />
      </LocalizedDeckTextProvider>,
      { locale: "fr" }
    );
    expect(await screen.findByText("Anneau solaire")).toBeInTheDocument();
  });

  it("renders English with no request when no provider is mounted", () => {
    renderRows("fr", false);
    expect(screen.getByText("Sol Ring")).toBeInTheDocument();
    expect(scryfallClient.fetchLocalizedPrintingsByNames).not.toHaveBeenCalled();
  });
});
