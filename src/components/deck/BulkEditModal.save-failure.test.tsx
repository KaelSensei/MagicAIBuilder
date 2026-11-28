/**
 * Bulk Edit when the deck API does not save the edited list.
 *
 * The deck API is the shared in-memory fake, served at the HTTP boundary by
 * MSW (`test/fake-deck-client.ts`, ADR 0005); the modal, the deck store and
 * the real deck client run, so the line the alert shows is the one a player
 * would read. The client turns every refusal into `[applyCardChanges] HTTP
 * <status>: …`, diagnostic text that must stay in the log (I-01).
 *
 * The edits only remove a line, so no card lookup is sent to Scryfall.
 */
import { fireEvent, screen, waitFor } from "@testing-library/react";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
} from "vitest";
import { useDeckStore } from "@/lib/deck/store";
import { logger } from "@/lib/logger";
import { aDeckCard } from "@/test/builders/card";
import { aDeck } from "@/test/builders/deck";
import {
  DeckApiRefusal,
  emptyApiDeck,
  installFakeDeckClient,
} from "@/test/fake-deck-client";
import { STALE_DECK_MESSAGE } from "@/test/in-memory-deck-api";
import { renderWithProviders, type TestLocale } from "@/test/render";
import { recordToasts } from "@/test/toast-recorder";
import { BulkEditModal } from "./BulkEditModal";

const api = installFakeDeckClient();
const toastAdd = recordToasts();

/** Anything of the thrown message the player must never read. */
const DIAGNOSTIC_TEXT = /HTTP \d{3}|\[applyCardChanges\]|fetch/i;
/** What the dialog says once a stale save made the store reload the deck. */
const STALE_SENTENCE =
  "Nothing was saved — this deck was changed elsewhere and has been reloaded. Check the list, then make your changes again.";

/** The deck the player has open: two ramp cards and some Forests, no commander. */
function openDeck(): void {
  useDeckStore.setState({
    decks: {
      "deck-1": aDeck({
        version: 7,
        cards: [
          aDeckCard({ id: "sol-ring-row", name: "Sol Ring", category: "ramp" }),
          aDeckCard({
            id: "signet-row",
            name: "Arcane Signet",
            category: "ramp",
          }),
          aDeckCard({
            id: "forest-row",
            name: "Forest",
            typeLine: "Basic Land — Forest",
            category: "land",
            quantity: 10,
          }),
        ],
      }),
    },
    activeDeckId: "deck-1",
    undoStack: [],
  });
}

/** The modal over the deck the store holds, as the builder page renders it. */
function BulkEditOpenDeck() {
  const deck = useDeckStore((state) => state.decks["deck-1"]);
  if (!deck) return null;
  return (
    <BulkEditModal deck={deck}>
      <button type="button">Open bulk edit</button>
    </BulkEditModal>
  );
}

/** Opens the modal, keeps only the Sol Ring line and presses Save. */
function saveWithoutSignet(locale: TestLocale = "en"): HTMLTextAreaElement {
  renderWithProviders(<BulkEditOpenDeck />, { locale });
  fireEvent.click(screen.getByRole("button", { name: "Open bulk edit" }));
  const textarea = screen.getByRole<HTMLTextAreaElement>("textbox");
  fireEvent.change(textarea, { target: { value: "1 Sol Ring" } });
  fireEvent.click(screen.getByRole("button", { name: /^(Save|Enregistrer)$/ }));
  return textarea;
}

describe("BulkEditModal — when the deck API does not save the list", () => {
  let logError: MockInstance<typeof logger.error>;

  beforeEach(() => {
    vi.clearAllMocks();
    logError = vi.spyOn(logger, "error").mockImplementation(() => undefined);
    openDeck();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("says the save failed in French when the server answers 500, with none of the thrown text", async () => {
    api.applyCardChanges.mockRejectedValueOnce(
      new DeckApiRefusal(500, "Failed to save deck changes")
    );

    saveWithoutSignet("fr");

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(
      "Échec de l’enregistrement des modifications."
    );
    expect(alert).not.toHaveTextContent(DIAGNOSTIC_TEXT);
    expect(alert).not.toHaveTextContent("Failed to save deck changes");
  });

  it("logs the thrown error once, for the developer", async () => {
    api.applyCardChanges.mockRejectedValueOnce(new DeckApiRefusal(500));

    saveWithoutSignet();

    await screen.findByRole("alert");
    expect(logError).toHaveBeenCalledOnce();
    expect(logError).toHaveBeenCalledWith(
      "Unexpected error",
      "BulkEditModal.save",
      expect.objectContaining({ status: 500 })
    );
  });

  it("asks the player to sign in again when the session has ended", async () => {
    api.applyCardChanges.mockRejectedValueOnce(
      new DeckApiRefusal(401, "Unauthorized")
    );

    const textarea = saveWithoutSignet();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(
      "Nothing was saved — your session has ended. Sign in again to save your changes."
    );
    expect(alert).not.toHaveTextContent(DIAGNOSTIC_TEXT);
    expect(textarea).toHaveValue("1 Sol Ring");
  });

  it("says the save failed when the network fails, with none of the browser's words", async () => {
    api.applyCardChanges.mockRejectedValueOnce(new Error("offline"));

    const textarea = saveWithoutSignet();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Failed to save changes.");
    expect(alert).not.toHaveTextContent(DIAGNOSTIC_TEXT);
    expect(textarea).toHaveValue("1 Sol Ring");
  });

  describe("when the deck changed elsewhere", () => {
    beforeEach(async () => {
      // Another tab added a card: the server's deck is the one the reload brings.
      api.seedDeck(emptyApiDeck("deck-1", "Test Deck"));
      await api.addCard(
        { deckId: "deck-1" },
        { scryfallId: "swords-printing", name: "Swords to Plowshares" }
      );
    });

    it("says so, reloads the deck into the list and leaves the conflict toast to the store", async () => {
      api.applyCardChanges.mockRejectedValueOnce(
        new DeckApiRefusal(409, STALE_DECK_MESSAGE)
      );

      const textarea = saveWithoutSignet();

      const alert = await screen.findByRole("alert");
      expect(alert).toHaveTextContent(STALE_SENTENCE);
      expect(alert).not.toHaveTextContent(DIAGNOSTIC_TEXT);
      expect(alert).not.toHaveTextContent(STALE_DECK_MESSAGE);
      await waitFor(() => {
        expect(textarea).toHaveDisplayValue(/^1 Swords to Plowshares$/m);
      });
      expect(textarea).not.toHaveDisplayValue(/Sol Ring/);
      expect(toastAdd).toHaveBeenCalledExactlyOnceWith("warning", {
        key: "deck.sync.conflictReloaded",
      });
    });

    it("says the same when the save was dropped behind an earlier write refused as stale", async () => {
      // A quantity change is still on its way when the player saves; the
      // server then refuses it as stale, so the queued save is never sent.
      let refuseQuantity: (refusal: DeckApiRefusal) => void = () => undefined;
      api.updateCardQuantity.mockReturnValueOnce(
        new Promise((_, reject) => {
          refuseQuantity = reject;
        })
      );
      const quantityWrite = useDeckStore
        .getState()
        .updateCardQuantity("forest-row", 1);
      await waitFor(() => {
        expect(api.updateCardQuantity).toHaveBeenCalledOnce();
      });

      saveWithoutSignet();
      refuseQuantity(new DeckApiRefusal(409, STALE_DECK_MESSAGE));
      await quantityWrite;

      const alert = await screen.findByRole("alert");
      expect(alert).toHaveTextContent(STALE_SENTENCE);
      expect(alert).not.toHaveTextContent(/dropped/i);
      expect(api.applyCardChanges).not.toHaveBeenCalled();
    });

    it("puts the reloaded deck in the list once the reload behind a dropped save lands", async () => {
      let refuseQuantity: (refusal: DeckApiRefusal) => void = () => undefined;
      api.updateCardQuantity.mockReturnValueOnce(
        new Promise((_, reject) => {
          refuseQuantity = reject;
        })
      );
      const quantityWrite = useDeckStore
        .getState()
        .updateCardQuantity("forest-row", 1);
      await waitFor(() => {
        expect(api.updateCardQuantity).toHaveBeenCalledOnce();
      });

      const textarea = saveWithoutSignet();
      refuseQuantity(new DeckApiRefusal(409, STALE_DECK_MESSAGE));
      await quantityWrite;

      await waitFor(() => {
        expect(textarea).toHaveDisplayValue(/^1 Swords to Plowshares$/m);
      });
      expect(textarea).not.toHaveDisplayValue(/Sol Ring/);
    });
  });
});
