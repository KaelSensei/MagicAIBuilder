/**
 * Deleting the open deck from the builder's title bar: the button, its confirmation dialog, the
 * trip back to the library and the message that says the deck is gone.
 *
 * Sociable: the real deck store, the real deck API client served by the in-memory deck API
 * (`installFakeDeckClient`), the real `Modal` and the English and French catalogues. Only Next's
 * app router is replaced, under next-intl's own router, so the test reads the localized path the
 * player is sent to.
 */
import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GUEST_DECK_ID } from "@/lib/deck/guest-deck";
import { useDeckStore, type DeckAction } from "@/lib/deck/store";
import { aDeckCard } from "@/test/builders/card";
import { aDeck } from "@/test/builders/deck";
import {
  DeckApiRefusal,
  emptyApiDeck,
  installFakeDeckClient,
} from "@/test/fake-deck-client";
import { renderWithProviders } from "@/test/render";
import { recordToasts } from "@/test/toast-recorder";
import { DeleteDeckButton } from "./DeleteDeckButton";

const { push, prefetch } = vi.hoisted(() => ({
  push: vi.fn(),
  prefetch: vi.fn(),
}));

// next-intl's router builds on these exports; only the router itself is replaced.
vi.mock(import("next/navigation"), async (importOriginal) => ({
  ...(await importOriginal()),
  useRouter: () => ({
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    push,
    replace: vi.fn(),
    prefetch,
  }),
}));

const api = installFakeDeckClient();
const toasts = recordToasts();

const ATRAXA_ID = "atraxa";
const ATRAXA_NAME = "Atraxa Superfriends";

/** The card the player added last, still on the deck's undo history. */
const LAST_ADDITION: DeckAction = {
  type: "ADD_CARD",
  deckId: ATRAXA_ID,
  card: aDeckCard({ id: "doubling-season", name: "Doubling Season" }),
};

/** Opens Atraxa Superfriends in the store, as the builder holds it, and saves it in the API. */
function openAtraxa(): void {
  api.seedDeck(emptyApiDeck(ATRAXA_ID, ATRAXA_NAME));
  useDeckStore.setState({
    decks: { [ATRAXA_ID]: aDeck({ id: ATRAXA_ID, name: ATRAXA_NAME }) },
    activeDeckId: ATRAXA_ID,
    undoStack: [LAST_ADDITION],
    isSyncing: false,
  });
}

/** Presses the title bar's button and returns the dialog it opens. */
async function openDialog(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Delete deck" }));
  return screen.findByRole("dialog", { name: `Delete ${ATRAXA_NAME}?` });
}

describe("DeleteDeckButton", () => {
  beforeEach(() => {
    push.mockReset();
    prefetch.mockReset();
    toasts.mockClear();
    openAtraxa();
  });

  it("confirming deletes Atraxa Superfriends and opens /decks", async () => {
    const user = userEvent.setup();
    renderWithProviders(<DeleteDeckButton deckId={ATRAXA_ID} />);

    const dialog = await openDialog(user);
    // Presence, not visibility: the dialog fades in, and jsdom reads its opacity mid-animation.
    expect(
      within(dialog).getByText("This cannot be undone.")
    ).toBeInTheDocument();
    await user.click(
      within(dialog).getByRole("button", { name: "Delete deck" })
    );

    await waitFor(() => expect(push).toHaveBeenCalledWith("/decks"));
    expect(api.deleteDeck).toHaveBeenCalledWith(ATRAXA_ID);
    expect(api.savedDeck(ATRAXA_ID)).toBeUndefined();
    expect(useDeckStore.getState().decks[ATRAXA_ID]).toBeUndefined();
    expect(toasts).toHaveBeenCalledWith(
      "success",
      `${ATRAXA_NAME} was deleted`
    );
  });

  it("Cancel deletes nothing and returns focus", async () => {
    const user = userEvent.setup();
    renderWithProviders(<DeleteDeckButton deckId={ATRAXA_ID} />);

    const dialog = await openDialog(user);
    // The delete cannot be undone, so the dialog opens on the safe choice.
    const cancel = within(dialog).getByRole("button", { name: "Cancel" });
    expect(cancel).toHaveFocus();
    await user.click(cancel);

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(screen.getByRole("button", { name: "Delete deck" })).toHaveFocus();
    expect(api.deleteDeck).not.toHaveBeenCalled();
    expect(useDeckStore.getState().decks[ATRAXA_ID]?.name).toBe(ATRAXA_NAME);
    expect(push).not.toHaveBeenCalled();
  });

  it("Escape closes the dialog and deletes nothing", async () => {
    const user = userEvent.setup();
    renderWithProviders(<DeleteDeckButton deckId={ATRAXA_ID} />);

    await openDialog(user);
    await user.keyboard("{Escape}");

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(screen.getByRole("button", { name: "Delete deck" })).toHaveFocus();
    expect(api.deleteDeck).not.toHaveBeenCalled();
  });

  it("a refused delete keeps the dialog open with the message and the deck in the store", async () => {
    api.deleteDeck.mockRejectedValueOnce(new DeckApiRefusal(403, "Forbidden"));
    const user = userEvent.setup();
    renderWithProviders(<DeleteDeckButton deckId={ATRAXA_ID} />);

    const dialog = await openDialog(user);
    await user.click(
      within(dialog).getByRole("button", { name: "Delete deck" })
    );

    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "The deck could not be deleted. Try again."
    );
    expect(dialog).toBeInTheDocument();
    expect(useDeckStore.getState().decks[ATRAXA_ID]?.name).toBe(ATRAXA_NAME);
    expect(useDeckStore.getState().undoStack).toEqual([LAST_ADDITION]);
    expect(push).not.toHaveBeenCalled();
    expect(toasts).not.toHaveBeenCalled();
  });

  it("the guest deck shows no button", () => {
    // The guest deck lives in this browser only; it has its own flow (GuestDeckNotice).
    useDeckStore.setState({
      decks: {
        [GUEST_DECK_ID]: aDeck({ id: GUEST_DECK_ID, name: "My first deck" }),
      },
      activeDeckId: GUEST_DECK_ID,
    });
    renderWithProviders(<DeleteDeckButton deckId={GUEST_DECK_ID} />);

    expect(screen.queryByRole("button")).toBeNull();
  });

  it("while saving, Delete waits", async () => {
    // A card the player added a moment ago is still on its way to the server.
    useDeckStore.setState({ isSyncing: true });
    const user = userEvent.setup();
    renderWithProviders(<DeleteDeckButton deckId={ATRAXA_ID} />);

    const dialog = await openDialog(user);
    const waiting = within(dialog).getByRole("button", {
      name: "Saving your changes…",
    });
    expect(waiting).toBeDisabled();
    await user.click(waiting);
    expect(api.deleteDeck).not.toHaveBeenCalled();

    act(() => useDeckStore.setState({ isSyncing: false }));

    expect(
      within(dialog).getByRole("button", { name: "Delete deck" })
    ).toBeEnabled();
  });

  it("a second press while the delete runs sends one delete", async () => {
    const answer = Promise.withResolvers<void>();
    api.deleteDeck.mockReturnValueOnce(answer.promise);
    const user = userEvent.setup();
    renderWithProviders(<DeleteDeckButton deckId={ATRAXA_ID} />);

    const dialog = await openDialog(user);
    await user.click(
      within(dialog).getByRole("button", { name: "Delete deck" })
    );
    const deleting = await within(dialog).findByRole("button", {
      name: "Deleting…",
    });
    expect(deleting).toBeDisabled();
    await user.click(deleting);
    answer.resolve();

    await waitFor(() => expect(push).toHaveBeenCalledWith("/decks"));
    expect(api.deleteDeck).toHaveBeenCalledTimes(1);
  });

  it("opening the dialog loads the library ahead, so the trip back is quick", async () => {
    const user = userEvent.setup();
    renderWithProviders(<DeleteDeckButton deckId={ATRAXA_ID} />);

    await openDialog(user);

    expect(prefetch).toHaveBeenCalledWith("/decks");
  });

  it("a French player confirms in French and lands on /fr/decks", async () => {
    const user = userEvent.setup();
    renderWithProviders(<DeleteDeckButton deckId={ATRAXA_ID} />, {
      locale: "fr",
    });

    await user.click(screen.getByRole("button", { name: "Supprimer le deck" }));
    const dialog = await screen.findByRole("dialog", {
      name: `Supprimer ${ATRAXA_NAME} ?`,
    });
    expect(
      within(dialog).getByText("Cette action est irréversible.")
    ).toBeInTheDocument();
    await user.click(
      within(dialog).getByRole("button", { name: "Supprimer le deck" })
    );

    await waitFor(() => expect(push).toHaveBeenCalledWith("/fr/decks"));
    expect(toasts).toHaveBeenCalledWith(
      "success",
      `${ATRAXA_NAME} a été supprimé`
    );
  });
});
