import { afterEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { screen } from "@testing-library/react";
import { renderWithIntl } from "@/test/render-with-intl";
import type { Deck, DeckCard } from "@/lib/deck/types";
import { ExportModal } from "./ExportModal";

// Printed names come from Scryfall; this test is about the dialog's own copy.
vi.mock(import("@/hooks/useLocalizedDeckIndex"), () => ({
  useLocalizedDeckIndex: () => new Map(),
}));

const SOL_RING: DeckCard = {
  id: "card-1",
  name: "Sol Ring",
  manaCost: "{1}",
  cmc: 1,
  typeLine: "Artifact",
  oracleText: "{T}: Add {C}{C}.",
  colorIdentity: [],
  isGameChanger: false,
  isBanned: false,
  price: null,
  imageUri: "",
  artCropUri: "",
  category: "ramp",
  quantity: 1,
  zone: "main",
};

const DECK: Deck = {
  id: "deck-1",
  name: "Proxies",
  commander: null,
  partner: null,
  companion: null,
  pairingType: "none",
  cards: [SOL_RING],
  maybeboard: [],
  format: "commander",
  cardCount: 1,
  targetBracket: 2,
  manualBracket: null,
  budget: null,
  description: "",
  tags: [],
  shareToken: null,
  shareEnabled: false,
  isPublic: false,
  isAIGenerated: false,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ExportModal download names", () => {
  it("keeps an accented letter of the deck name as its base letter (B2)", async () => {
    const user = userEvent.setup();
    const downloads: string[] = [];
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn().mockReturnValue("blob:export-modal"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
      this: HTMLAnchorElement
    ) {
      downloads.push(this.download);
    });
    renderWithIntl(
      <ExportModal
        deck={{ ...DECK, name: "Lim-Dûl the Necromancer" }}
        onClose={vi.fn()}
      />
    );

    await user.click(screen.getByTitle("Download MTGO file"));

    expect(downloads).toEqual(["lim_dul_the_necromancer.dek"]);
  });
});

describe("ExportModal in French", () => {
  it("names the plain-text format with the import dialog's tab label", () => {
    renderWithIntl(<ExportModal deck={DECK} onClose={vi.fn()} />, {
      locale: "fr",
    });

    expect(
      screen.getByRole("button", { name: "Copier pour Texte brut" })
    ).toBeInTheDocument();
    expect(
      screen.getByTitle("Télécharger le fichier Texte brut")
    ).toBeInTheDocument();
  });

  it("offers US Letter paper and explains a blocked print pop-up", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "open").mockReturnValue(null);
    renderWithIntl(<ExportModal deck={DECK} onClose={vi.fn()} />, {
      locale: "fr",
    });

    await user.click(
      screen.getByRole("button", {
        name: "Exporter les planches de proxys (Print / PDF)",
      })
    );
    expect(
      screen.getByRole("button", { name: "Lettre US" })
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Texte seul" }));
    await user.click(
      screen.getByRole("button", { name: "Imprimer / Enregistrer en PDF" })
    );

    expect(
      screen.getByText(
        "Fenêtre pop-up bloquée — autorisez les pop-ups pour ce site"
      )
    ).toBeInTheDocument();
  });
});
