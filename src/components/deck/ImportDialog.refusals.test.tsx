/**
 * The text import when the deck refuses some of the cards it is asked to add (I-01).
 *
 * The deck store's `addCard` refuses a card at its copy limit or a basic land its zone already
 * holds, and the command-zone setters refuse a partner or a companion the commander does not
 * allow. The import counts only the cards the deck took and names the ones it refused, with the
 * reason, in the player's language.
 *
 * Scryfall and the deck API are replaced at the HTTP boundary by MSW (ADR 0005): the deck API by
 * the shared in-memory fake (`test/fake-deck-client.ts`), Scryfall by a collection handler. The
 * dialog, the deck store and the lookup helper are the real ones.
 */
import { fireEvent, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { useDeckStore } from "@/lib/deck/store";
import { __resetRateLimiter } from "@/lib/scryfall/client";
import { SCRYFALL_API } from "@/lib/scryfall/constants";
import type { ScryfallCard } from "@/lib/scryfall/types";
import { aDeckCard } from "@/test/builders/card";
import { aDeck } from "@/test/builders/deck";
import { aScryfallCard } from "@/test/builders/scryfall";
import { deckApiHandlers } from "@/test/fake-deck-client";
import { createInMemoryDeckApi } from "@/test/in-memory-deck-api";
import type { TestLocale } from "@/test/intl-catalogs";
import { setupMsw } from "@/test/msw";
import { renderWithProviders } from "@/test/render";
import { recordToasts } from "@/test/toast-recorder";
import { ImportDialog } from "./ImportDialog";

const COLLECTION_URL = `${SCRYFALL_API}/cards/collection`;
/** A name Scryfall does not know, so the preview lists it as not found. */
const UNKNOWN_NAME = "Definitely Not A Card";
/** What Scryfall says about the cards whose type or text the store reads. */
const CARD_DETAILS = new Map<string, Partial<ScryfallCard>>([
  ["Island", { type_line: "Basic Land — Island" }],
  [
    "Thrasios, Triton Hero",
    {
      type_line: "Legendary Creature — Merfolk Wizard",
      oracle_text: "Partner",
    },
  ],
]);
/** The dialog's two buttons on the way to an import, in each test locale. */
const BUTTONS: Readonly<
  Record<TestLocale, { preview: string; confirm: string }>
> = {
  en: { preview: "Preview decklist", confirm: "Import this preview" },
  fr: { preview: "Prévisualiser la liste", confirm: "Importer cet aperçu" },
};

const CollectionBody = z.object({
  identifiers: z.array(z.object({ name: z.string() })),
});

const api = createInMemoryDeckApi();
setupMsw(
  ...deckApiHandlers(api),
  http.post(COLLECTION_URL, async ({ request }) => {
    const { identifiers } = CollectionBody.parse(await request.json());
    const known = identifiers.filter(({ name }) => name !== UNKNOWN_NAME);
    return HttpResponse.json({
      object: "list",
      not_found: identifiers.filter(({ name }) => name === UNKNOWN_NAME),
      data: known.map(({ name }) =>
        aScryfallCard({
          id: `${name}-printing`,
          name,
          ...CARD_DETAILS.get(name),
        })
      ),
    });
  })
);
const toastAdd = recordToasts();

/** Pastes `decklist`, previews it and confirms the import, in `locale`. */
async function importDecklist(
  decklist: string,
  locale: TestLocale = "en"
): Promise<void> {
  renderWithProviders(<ImportDialog open onOpenChange={vi.fn()} />, { locale });
  fireEvent.change(screen.getByRole("textbox"), {
    target: { value: decklist },
  });
  fireEvent.click(
    screen.getByRole("button", { name: BUTTONS[locale].preview })
  );
  fireEvent.click(
    await screen.findByRole("button", { name: BUTTONS[locale].confirm })
  );
}

/** Opens a Commander deck holding `cards`. */
function openCommanderDeck(...cards: ReturnType<typeof aDeckCard>[]): void {
  useDeckStore.setState({
    decks: { "deck-1": aDeck({ cards, cardRowCount: cards.length }) },
    activeDeckId: "deck-1",
    undoStack: [],
  });
}

describe("ImportDialog — cards the deck refuses", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.reset();
    openCommanderDeck();
  });

  afterEach(() => {
    __resetRateLimiter();
  });

  // CR 903.5b: a Commander deck holds one copy of each card but basic lands, so the second
  // Sol Ring line adds nothing.
  it("counts only the cards the deck took and names a second Sol Ring as at its copy limit, in French", async () => {
    await importDecklist(
      "Commander\n1 Atraxa, Praetors' Voice\n\nDeck\n1 Sol Ring\n1 Arcane Signet\n1 Sol Ring",
      "fr"
    );

    expect(
      await screen.findByText("3 cartes importées avec succès.")
    ).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Cartes refusées par le deck (1) :"
    );
    expect(
      screen.getByText("Sol Ring : déjà à sa limite d’exemplaires en Commander")
    ).toBeInTheDocument();
  });

  it("keeps the success sentence, counting lines rather than copies, when the deck takes every card", async () => {
    await importDecklist(
      "Commander\n1 Atraxa, Praetors' Voice\n\nDeck\n1 Sol Ring\n8 Island"
    );

    const success = await screen.findByText("Successfully imported 3 cards.");
    expect(success).toHaveClass("text-green-400");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows the warning state and names a card the deck already holds", async () => {
    openCommanderDeck(aDeckCard({ id: "sol-ring-row", name: "Sol Ring" }));

    await importDecklist("Deck\n1 Sol Ring\n1 Arcane Signet\n1 Command Tower");

    const partial = await screen.findByText("Successfully imported 2 cards.");
    expect(partial).toHaveClass("text-amber-400");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Cards the deck refused (1):"
    );
    expect(
      screen.getByText("Sol Ring: already at its copy limit for Commander")
    ).toBeInTheDocument();
  });

  it("names a card once when the deck refuses several of its lines", async () => {
    await importDecklist(
      "Deck\n1 Sol Ring\n1 Arcane Signet\n1 Sol Ring\n1 Sol Ring"
    );

    expect(
      await screen.findByText("Successfully imported 2 cards.")
    ).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Cards the deck refused (1):"
    );
    expect(
      screen.getAllByText("Sol Ring: already at its copy limit for Commander")
    ).toHaveLength(1);
  });

  it("says nothing was added, with no success sentence, when the deck refuses every card", async () => {
    openCommanderDeck(aDeckCard({ id: "sol-ring-row", name: "Sol Ring" }));

    await importDecklist("Deck\n1 Sol Ring");

    expect(
      await screen.findByText("No card was added to the deck.")
    ).toHaveClass("text-amber-400");
    expect(screen.queryByText(/Successfully imported/)).not.toBeInTheDocument();
    expect(
      screen.getByText("Sol Ring: already at its copy limit for Commander")
    ).toBeInTheDocument();
  });

  // CR 903.5b exempts basic lands from the singleton rule, but an add never raises the quantity
  // of a basic land its zone already holds: the player sets it on the first add.
  it("names a basic land its zone already holds, and says its quantity was left as it was", async () => {
    openCommanderDeck(
      aDeckCard({
        id: "island-row",
        name: "Island",
        typeLine: "Basic Land — Island",
        quantity: 8,
      })
    );

    await importDecklist("Deck\n10 Island\n1 Sol Ring\n1 Arcane Signet");

    expect(
      await screen.findByText("Successfully imported 2 cards.")
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Island: this basic land is already in that zone, so its quantity was left as it was"
      )
    ).toBeInTheDocument();
  });

  // CR 702.124a: a second commander joins only through a partner ability both cards allow.
  it("leaves out of the count a partner the commander cannot pair with, and names it", async () => {
    await importDecklist(
      "Commander\n1 Atraxa, Praetors' Voice\n1 Thrasios, Triton Hero\n\nDeck\n1 Sol Ring\n1 Arcane Signet"
    );

    expect(
      await screen.findByText("Successfully imported 3 cards.")
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Thrasios, Triton Hero: could not take its place in the command zone"
      )
    ).toBeInTheDocument();
    expect(toastAdd).toHaveBeenCalledWith(
      "warning",
      "Thrasios, Triton Hero cannot share the command zone with Atraxa, Praetors' Voice."
    );
  });

  it("lists the names Scryfall did not find beside the cards the deck refused", async () => {
    openCommanderDeck(aDeckCard({ id: "sol-ring-row", name: "Sol Ring" }));

    await importDecklist(
      `Deck\n1 Sol Ring\n1 Arcane Signet\n1 Command Tower\n1 ${UNKNOWN_NAME}`
    );

    expect(
      await screen.findByText("Successfully imported 2 cards.")
    ).toBeInTheDocument();
    const [notFound, refused] = screen.getAllByRole("alert");
    expect(notFound).toHaveTextContent(
      `Cards not found in Scryfall (1):${UNKNOWN_NAME}`
    );
    expect(refused).toHaveTextContent(
      "Cards the deck refused (1):Sol Ring: already at its copy limit for Commander"
    );
  });

  it("says no deck is selected, not a success, when the open deck is gone", async () => {
    useDeckStore.setState({ decks: {}, activeDeckId: "deck-1" });

    await importDecklist("Deck\n1 Sol Ring\n1 Arcane Signet");

    expect(
      await screen.findByText("No deck selected. Create or open a deck first.")
    ).toBeInTheDocument();
    expect(screen.queryByText(/Successfully imported/)).not.toBeInTheDocument();
  });
});
