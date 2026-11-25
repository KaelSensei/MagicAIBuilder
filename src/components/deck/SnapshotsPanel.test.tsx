/**
 * The deck History panel, `SnapshotsPanel.tsx`: how a player who cannot see the chevron opens and
 * closes the snapshot list, how each snapshot's card count reads against the deck as it is now,
 * and what the player reads when loading, saving, deleting or restoring a snapshot fails.
 * The panel reads the list over `fetch` when it opens; MSW serves it, and any other request fails
 * the test.
 */
import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
} from "vitest";
import { SnapshotsPanel } from "./SnapshotsPanel";
import { useToastStore } from "@/hooks/useToast";
import { logger } from "@/lib/logger";
import { setupMsw } from "@/test/msw";
import { renderWithIntl } from "@/test/render-with-intl";
import { renderWithProviders } from "@/test/render";
import { aDeck } from "@/test/builders/deck";
import { aDeckCard } from "@/test/builders/card";

const DECK_ID = "deck-with-history";

/**
 * A 100-card Commander deck held in 70 rows plus its commander: Atraxa, 30 Forests in one row and
 * 69 other single cards. Its title bar reads 100.
 */
const HUNDRED_CARD_DECK = aDeck({
  commander: aDeckCard({ id: "atraxa", name: "Atraxa, Praetors' Voice" }),
  cards: [
    aDeckCard({ id: "forest", name: "Forest", quantity: 30 }),
    ...Array.from({ length: 69 }, (_, index) =>
      aDeckCard({ id: `spell-${index + 1}`, name: `Spell ${index + 1}` })
    ),
  ],
});

/** @returns one snapshot of the deck as the list route answers it, holding `cardCount` cards */
function snapshotHolding(cardCount: number) {
  return {
    id: "snapshot-1",
    name: "Before the cuts",
    commander: "Atraxa, Praetors' Voice",
    cardCount,
    createdAt: "2026-11-09T12:00:00.000Z",
  };
}

const server = setupMsw(
  http.get(`/api/decks/${DECK_ID}/snapshots`, () => HttpResponse.json([]))
);

/** Serves one snapshot holding `cardCount` cards for the rest of the test. */
function serveSnapshotHolding(cardCount: number): void {
  server.use(
    http.get(`/api/decks/${DECK_ID}/snapshots`, () =>
      HttpResponse.json([snapshotHolding(cardCount)])
    )
  );
}

describe("SnapshotsPanel", () => {
  it("opens and closes the snapshot list from a named disclosure button that reports whether the list is open", async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <SnapshotsPanel deckId={DECK_ID} currentDeck={HUNDRED_CARD_DECK} />
    );

    const disclosure = screen.getByRole("button", { name: "Snapshot list" });
    expect(disclosure.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByText("No snapshots yet. Save one above!")).toBeNull();

    await user.click(disclosure);
    expect(disclosure.getAttribute("aria-expanded")).toBe("true");
    expect(
      await screen.findByText("No snapshots yet. Save one above!")
    ).toBeDefined();

    await user.click(disclosure);
    expect(disclosure.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByText("No snapshots yet. Save one above!")).toBeNull();
  });

  it("names the disclosure button in the player's language", () => {
    renderWithIntl(<SnapshotsPanel deckId={DECK_ID} currentDeck={aDeck()} />, {
      locale: "fr",
    });

    expect(
      screen.getByRole("button", { name: "Liste des snapshots" })
    ).toBeDefined();
  });

  it("reads a snapshot of the deck as 100 cards and shows no difference against the unchanged deck", async () => {
    serveSnapshotHolding(100);
    const user = userEvent.setup();
    renderWithProviders(
      <SnapshotsPanel deckId={DECK_ID} currentDeck={HUNDRED_CARD_DECK} />
    );

    await user.click(screen.getByRole("button", { name: "Snapshot list" }));

    expect(await screen.findByText("100 cards")).toBeDefined();
    expect(screen.queryByText(/^[+-]\d+ cards?$/)).toBeNull();
  });

  it.each([
    [98, "+2 cards"],
    [99, "+1 card"],
    [101, "-1 card"],
  ])(
    "shows what the deck gained or lost since a snapshot of %i cards: %s",
    async (snapshotCount, badge) => {
      serveSnapshotHolding(snapshotCount);
      const user = userEvent.setup();
      renderWithProviders(
        <SnapshotsPanel deckId={DECK_ID} currentDeck={HUNDRED_CARD_DECK} />
      );

      await user.click(screen.getByRole("button", { name: "Snapshot list" }));

      expect(await screen.findByText(badge)).toBeDefined();
    }
  );

  it("writes the card count and the difference in the player's language", async () => {
    serveSnapshotHolding(99);
    const user = userEvent.setup();
    renderWithProviders(
      <SnapshotsPanel deckId={DECK_ID} currentDeck={HUNDRED_CARD_DECK} />,
      { locale: "fr" }
    );

    await user.click(
      screen.getByRole("button", { name: "Liste des snapshots" })
    );

    expect(await screen.findByText("99 cartes")).toBeDefined();
    expect(screen.getByText("+1 carte")).toBeDefined();
  });
});

/** The text of every toast on screen, in order. */
function toastTexts(): readonly string[] {
  return useToastStore
    .getState()
    .toasts.map((toast) =>
      typeof toast.message === "string" ? toast.message : toast.message.key
    );
}

/**
 * Runs `action` and returns the promise rejections that nothing handled while
 * it ran. Vitest's own listener is taken off `process` for the duration, since
 * it would fail the run on the very rejection the test asserts, and is put
 * back afterwards. Node reports an unhandled rejection after the microtask
 * queue drains, so the helper yields one macrotask before collecting.
 */
async function escapedRejectionsDuring(
  action: () => Promise<void>
): Promise<readonly unknown[]> {
  const suspended = process.listeners("unhandledRejection");
  for (const listener of suspended) process.off("unhandledRejection", listener);
  const escaped: unknown[] = [];
  const collect = (reason: unknown): void => {
    escaped.push(reason);
  };
  process.on("unhandledRejection", collect);
  try {
    await action();
    await act(() => new Promise<void>((resolve) => setTimeout(resolve, 0)));
    return escaped;
  } finally {
    process.off("unhandledRejection", collect);
    for (const listener of suspended)
      process.on("unhandledRejection", listener);
  }
}

/*
 * Each action of the History panel used to fail badly: a failed list read as an
 * empty history, a failed save showed the route's English diagnostic text, and
 * a failed delete or restore closed its confirmation with no word and left an
 * unhandled rejection. The player now reads a sentence in their language; the
 * raw error stays in the log (I-01).
 */
describe("a History panel action that fails", () => {
  let logError: MockInstance<typeof logger.error>;

  beforeEach(() => {
    useToastStore.setState({ toasts: [] });
    serveSnapshotHolding(100);
    logError = vi.spyOn(logger, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    logError.mockRestore();
  });

  it("says in French that the deck was not restored, and does not reload the deck", async () => {
    server.use(
      http.post(`/api/decks/${DECK_ID}/snapshots/snapshot-1/restore`, () =>
        HttpResponse.json(
          { error: "Failed to restore snapshot" },
          { status: 500 }
        )
      )
    );
    const onRestore = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <SnapshotsPanel
        deckId={DECK_ID}
        currentDeck={HUNDRED_CARD_DECK}
        onRestore={onRestore}
      />,
      { locale: "fr" }
    );
    await user.click(
      screen.getByRole("button", { name: "Liste des snapshots" })
    );
    await user.click(await screen.findByTitle("Restaurer ce snapshot"));

    const escaped = await escapedRejectionsDuring(async () => {
      await user.click(screen.getByRole("button", { name: "Confirmer" }));
      await waitFor(() =>
        expect(toastTexts()).toEqual([
          "Le deck n’a pas été restauré. Réessayez.",
        ])
      );
    });

    expect(escaped).toEqual([]);
    expect(onRestore).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Confirmer" })).toBeNull();
  });

  it("keeps the row and says the snapshot was not deleted", async () => {
    server.use(
      http.delete(`/api/decks/${DECK_ID}/snapshots/snapshot-1`, () =>
        HttpResponse.json(
          { error: "Failed to delete snapshot" },
          { status: 500 }
        )
      )
    );
    const user = userEvent.setup();
    renderWithProviders(
      <SnapshotsPanel deckId={DECK_ID} currentDeck={HUNDRED_CARD_DECK} />
    );
    await user.click(screen.getByRole("button", { name: "Snapshot list" }));
    await user.click(await screen.findByTitle("Delete snapshot"));

    const escaped = await escapedRejectionsDuring(async () => {
      await user.click(screen.getByRole("button", { name: "Delete?" }));
      await waitFor(() =>
        expect(toastTexts()).toEqual([
          "The snapshot was not deleted. Please try again.",
        ])
      );
    });

    expect(escaped).toEqual([]);
    expect(screen.getByText("Before the cuts")).toBeDefined();
    expect(screen.queryByRole("button", { name: "Delete?" })).toBeNull();
    expect(screen.getByTitle("Delete snapshot")).toBeEnabled();
  });

  it("says the history could not load instead of calling it empty, and loads it on retry", async () => {
    server.use(
      http.get(`/api/decks/${DECK_ID}/snapshots`, () =>
        HttpResponse.json(
          { error: "Failed to fetch snapshots" },
          { status: 500 }
        )
      )
    );
    const user = userEvent.setup();
    renderWithProviders(
      <SnapshotsPanel deckId={DECK_ID} currentDeck={HUNDRED_CARD_DECK} />,
      { locale: "fr" }
    );

    await user.click(
      screen.getByRole("button", { name: "Liste des snapshots" })
    );

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Impossible de charger l’historique. Réessayez."
    );
    expect(screen.queryByText(/Aucun snapshot/)).toBeNull();

    serveSnapshotHolding(100);
    await user.click(screen.getByRole("button", { name: "Réessayer" }));

    expect(await screen.findByText("Before the cuts")).toBeDefined();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it.each([
    [
      "the server fails",
      () =>
        HttpResponse.json(
          { error: "Failed to create snapshot" },
          { status: 500 }
        ),
      "Failed to create snapshot",
    ],
    ["the network fails", () => HttpResponse.error(), "Failed to fetch"],
  ])(
    "says in French that the snapshot was not saved, with no raw text, when %s",
    async (_case, answer, rawText) => {
      server.use(http.post(`/api/decks/${DECK_ID}/snapshots`, answer));
      const user = userEvent.setup();
      renderWithProviders(
        <SnapshotsPanel deckId={DECK_ID} currentDeck={HUNDRED_CARD_DECK} />,
        { locale: "fr" }
      );

      await user.click(screen.getByRole("button", { name: "Sauvegarder" }));
      await user.type(screen.getByRole("textbox"), "v1{Enter}");

      const alert = await screen.findByRole("alert");
      expect(alert.textContent).toBe(
        "Impossible de sauvegarder le snapshot. Réessayez."
      );
      expect(screen.queryByText(new RegExp(rawText))).toBeNull();
    }
  );

  it("asks the player to sign in again when saving answers that the session ended", async () => {
    server.use(
      http.post(`/api/decks/${DECK_ID}/snapshots`, () =>
        HttpResponse.json({ error: "Unauthorized" }, { status: 401 })
      )
    );
    const user = userEvent.setup();
    renderWithProviders(
      <SnapshotsPanel deckId={DECK_ID} currentDeck={HUNDRED_CARD_DECK} />
    );

    await user.click(screen.getByRole("button", { name: "Save" }));
    await user.type(screen.getByRole("textbox"), "v1{Enter}");

    expect((await screen.findByRole("alert")).textContent).toBe(
      "Your session has ended. Sign in again to use the history."
    );
  });

  it("logs the raw error once for diagnostics", async () => {
    server.use(
      http.post(`/api/decks/${DECK_ID}/snapshots`, () =>
        HttpResponse.json(
          { error: "Failed to create snapshot" },
          { status: 500 }
        )
      )
    );
    const user = userEvent.setup();
    renderWithProviders(
      <SnapshotsPanel deckId={DECK_ID} currentDeck={HUNDRED_CARD_DECK} />
    );

    await user.click(screen.getByRole("button", { name: "Save" }));
    await user.type(screen.getByRole("textbox"), "v1{Enter}");
    await screen.findByRole("alert");

    expect(logError).toHaveBeenCalledTimes(1);
    expect(logError).toHaveBeenCalledWith(
      "Snapshot action failed",
      "SnapshotsPanel.createSnapshot",
      expect.objectContaining({
        message: "[createSnapshot] HTTP 500: Failed to create snapshot",
      })
    );
  });
});

describe("a snapshot restore that succeeds", () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] });
    serveSnapshotHolding(100);
  });

  it("asks the builder to reload the deck once, and raises no toast", async () => {
    server.use(
      http.post(`/api/decks/${DECK_ID}/snapshots/snapshot-1/restore`, () =>
        HttpResponse.json({ success: true })
      )
    );
    const onRestore = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <SnapshotsPanel
        deckId={DECK_ID}
        currentDeck={HUNDRED_CARD_DECK}
        onRestore={onRestore}
      />
    );
    await user.click(screen.getByRole("button", { name: "Snapshot list" }));
    await user.click(await screen.findByTitle("Restore to this snapshot"));

    await user.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() => expect(onRestore).toHaveBeenCalledTimes(1));
    expect(toastTexts()).toEqual([]);
    expect(screen.queryByRole("button", { name: "Confirm" })).toBeNull();
  });
});
