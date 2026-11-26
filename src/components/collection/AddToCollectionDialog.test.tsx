import { useState } from "react";
import { act, cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useCollectionStore } from "@/lib/collection/store";
import type { AddToCollectionInput } from "@/lib/collection/types";
import type { ScryfallCard } from "@/lib/scryfall/types";
import { aScryfallCard } from "@/test/builders/scryfall";
import { setupMsw } from "@/test/msw";
import { renderWithIntl, type TestLocale } from "@/test/render-with-intl";
import { AddToCollectionDialog } from "./AddToCollectionDialog";

// The dialog searches through the shared Scryfall cache the browser reads; each
// add-flow test serves its one card from there, so nothing reaches Scryfall.
const server = setupMsw();

async function openDialog(locale: TestLocale = "en") {
  const user = userEvent.setup();
  renderWithIntl(<AddToCollectionDialog />, { locale });
  const trigger = screen.getByRole("button");
  await user.click(trigger);
  return { user, trigger };
}

describe("AddToCollectionDialog", () => {
  it("opens a modal dialog named by its heading", async () => {
    await openDialog();

    expect(
      screen.getByRole("dialog", { name: "Add to Collection" })
    ).toBeInTheDocument();
    // Modal: the page behind, trigger included, leaves the accessibility tree.
    expect(
      screen.queryByRole("button", { name: "Add Card" })
    ).not.toBeInTheDocument();
  });

  it("is named in the viewer's language", async () => {
    await openDialog("fr");

    expect(
      screen.getByRole("dialog", { name: "Ajouter à la collection" })
    ).toBeInTheDocument();
  });

  // Focus used to stay on the trigger, hidden behind the overlay. It now moves
  // to the dialog's first control, the card search; no `autoFocus` is involved.
  it("moves focus into the dialog when it opens", async () => {
    const { trigger } = await openDialog();

    expect(
      screen.getByRole("textbox", { name: "Search for a card…" })
    ).toHaveFocus();
    expect(trigger).not.toHaveFocus();
  });

  it("closes on Escape and gives focus back to the trigger", async () => {
    const { user, trigger } = await openDialog();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("keeps Tab inside the dialog", async () => {
    const { user } = await openDialog();
    const dialog = screen.getByRole("dialog", { name: "Add to Collection" });

    // Search, Cancel, then the disabled submit is skipped: Tab wraps to search.
    await user.tab();
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
    await user.tab();

    expect(dialog.contains(document.activeElement)).toBe(true);
    expect(
      screen.getByRole("textbox", { name: "Search for a card…" })
    ).toHaveFocus();
  });
});

/*
 * The collection page holds the open state, so its empty state's "Add cards"
 * opens this same dialog (I-13 AC-13-05).
 */
describe("AddToCollectionDialog opened by its page", () => {
  it("opens when the page asks, and tells the page when the player closes it", async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    renderWithIntl(<AddToCollectionDialog open onOpenChange={onOpenChange} />);

    expect(
      screen.getByRole("dialog", { name: "Add to Collection" })
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("asks the page to open it from its own trigger", async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    renderWithIntl(
      <AddToCollectionDialog open={false} onOpenChange={onOpenChange} />
    );

    await user.click(screen.getByRole("button", { name: "Add Card" }));

    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  // The empty state that opened the dialog leaves once a first card is added,
  // while the dialog stays open for the next one. Focus used to fall to
  // <body> on close.
  it("gives focus to its own Add Card when the empty state that opened it has left", async () => {
    const user = userEvent.setup();
    const { rerender } = renderWithIntl(<CollectionPageStandIn empty />);
    await user.click(screen.getByRole("button", { name: "Add cards" }));

    rerender(<CollectionPageStandIn empty={false} />);
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Add Card" })).toHaveFocus()
    );
  });
});

/**
 * The collection page's part in the dialog: it holds the open state, and its
 * empty state's "Add cards" shows until the collection holds a card.
 */
function CollectionPageStandIn({ empty }: { readonly empty: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {empty ? (
        <button type="button" onClick={() => setOpen(true)}>
          Add cards
        </button>
      ) : null}
      <AddToCollectionDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

describe("AddToCollectionDialog add flow", () => {
  // The store's real action posts to /api/collection. The dialog's own job ends
  // at the input it hands over, so that handover is what these tests observe.
  // The promise stays pending until the test settles it inside `act`, as the
  // store would once its POST answered.
  const realAddToCollection = useCollectionStore.getState().addToCollection;
  let settleAdd: () => void = () => {};
  const addToCollection = vi.fn<(input: AddToCollectionInput) => Promise<void>>(
    () =>
      new Promise<void>((resolve) => {
        settleAdd = resolve;
      })
  );

  afterEach(() => {
    addToCollection.mockClear();
    // Unmount before the store changes, or the subscription re-renders the
    // dialog outside act.
    cleanup();
    useCollectionStore.setState({ addToCollection: realAddToCollection });
  });

  function serveSearchHit(card: ScryfallCard) {
    server.use(
      http.get("/api/cache/search", () =>
        HttpResponse.json({
          hit: true,
          data: {
            object: "list",
            total_cards: 1,
            has_more: false,
            data: [card],
          },
        })
      )
    );
  }

  /** Searches, picks the one result, submits; returns the result row as it was listed. */
  async function addThroughTheDialog(usd: string) {
    useCollectionStore.setState({ addToCollection, isSyncing: false });
    serveSearchHit(aScryfallCard({ name: "Lightning Bolt", prices: { usd } }));
    const { user } = await openDialog();

    await user.type(
      screen.getByRole("textbox", { name: "Search for a card…" }),
      "bolt"
    );
    const row = await screen.findByRole("button", { name: /Lightning Bolt/ });
    await user.click(row);
    await user.click(screen.getByRole("button", { name: "Add to Collection" }));
    await act(async () => settleAdd());
    expect(screen.getByRole("button", { name: /Added!/ })).toBeInTheDocument();
    return row;
  }

  it("lists the result with its USD price and adds the card with that price as a number", async () => {
    const row = await addThroughTheDialog("0.25");

    expect(row).toHaveTextContent("$0.25");
    expect(addToCollection).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Lightning Bolt", price: 0.25 })
    );
  });

  it("lists no price and adds the card without one, not NaN, when Scryfall's price string is not a number", async () => {
    const row = await addThroughTheDialog("N/A");

    expect(row).not.toHaveTextContent("NaN");
    expect(addToCollection).toHaveBeenCalledWith(
      expect.objectContaining({ price: null })
    );
  });
});
