/**
 * The text import when Scryfall or the deck API fails.
 *
 * Scryfall and the deck API are replaced at the HTTP boundary by MSW (ADR
 * 0005): the deck API by the shared in-memory fake (`test/fake-deck-client.ts`),
 * Scryfall by a collection handler. The dialog, the deck store, the lookup
 * helper and both clients are the real ones, so what the dialog shows is what
 * a player would read, and none of it is an exception's text (I-01).
 */
import { fireEvent, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { useDeckStore } from "@/lib/deck/store";
import { logger } from "@/lib/logger";
import { __resetRateLimiter } from "@/lib/scryfall/client";
import { SCRYFALL_API } from "@/lib/scryfall/constants";
import { aDeck } from "@/test/builders/deck";
import { aScryfallCard } from "@/test/builders/scryfall";
import { deckApiHandlers } from "@/test/fake-deck-client";
import {
  createInMemoryDeckApi,
  DeckApiRefusal,
} from "@/test/in-memory-deck-api";
import { setupMsw } from "@/test/msw";
import { renderWithProviders } from "@/test/render";
import { recordToasts } from "@/test/toast-recorder";
import { ImportDialog } from "./ImportDialog";

const COLLECTION_URL = `${SCRYFALL_API}/cards/collection`;
/** Anything of a thrown message the player must never read. */
const DIAGNOSTIC_TEXT =
  /HTTP \d{3}|\[addCard\]|Scryfall API error|maintenance|fetch/i;

const CollectionBody = z.object({
  identifiers: z.array(z.object({ name: z.string() })),
});

const api = createInMemoryDeckApi();
const server = setupMsw(
  ...deckApiHandlers(api),
  http.post(COLLECTION_URL, async ({ request }) => {
    const { identifiers } = CollectionBody.parse(await request.json());
    return HttpResponse.json({
      object: "list",
      not_found: [],
      data: identifiers.map(({ name }) =>
        aScryfallCard({ id: `${name}-printing`, name })
      ),
    });
  })
);
const toastAdd = recordToasts();

/** Pastes one line and asks for the preview. */
function previewSolRing(): void {
  renderWithProviders(<ImportDialog open onOpenChange={vi.fn()} />);
  fireEvent.change(screen.getByPlaceholderText(/Atraxa, Praetors' Voice/), {
    target: { value: "1 Sol Ring" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Preview decklist" }));
}

describe("ImportDialog — when Scryfall or the deck API fails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.reset();
    vi.spyOn(logger, "error").mockImplementation(() => undefined);
    useDeckStore.setState({
      decks: { "deck-1": aDeck({ version: 3 }) },
      activeDeckId: "deck-1",
      undoStack: [],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    __resetRateLimiter();
  });

  it("says the card lookup did not answer when Scryfall answers 503", async () => {
    server.use(
      http.post(COLLECTION_URL, () =>
        HttpResponse.json(
          {
            object: "error",
            code: "service_unavailable",
            status: 503,
            details: "Scryfall is down for maintenance.",
          },
          { status: 503 }
        )
      )
    );

    previewSolRing();

    expect(
      await screen.findByText(
        "The card lookup did not answer. Nothing was imported; try again."
      )
    ).toBeInTheDocument();
    expect(screen.queryByText(DIAGNOSTIC_TEXT)).not.toBeInTheDocument();
    expect(api.addCard).not.toHaveBeenCalled();
  });

  it("leaves a card the server refuses to the store's own toast, and shows none of the thrown text", async () => {
    api.addCard.mockRejectedValueOnce(new DeckApiRefusal(500, "boom"));
    previewSolRing();

    fireEvent.click(
      await screen.findByRole("button", { name: "Import this preview" })
    );

    await vi.waitFor(() => {
      expect(toastAdd).toHaveBeenCalledWith(
        "error",
        "Could not add card. Please retry."
      );
    });
    // The import settles as finished, not as failed: the confirm button,
    // which an error leaves in place, is gone. The store never rethrows.
    await vi.waitFor(() => {
      expect(
        screen.queryByRole("button", { name: "Import this preview" })
      ).not.toBeInTheDocument();
    });
    expect(screen.queryByText(DIAGNOSTIC_TEXT)).not.toBeInTheDocument();
    expect(screen.queryByText(/boom/)).not.toBeInTheDocument();
  });
});
