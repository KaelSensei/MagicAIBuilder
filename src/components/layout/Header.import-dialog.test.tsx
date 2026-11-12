/**
 * The header's import dialog, on a phone and on a desktop.
 *
 * Sociable: `Header`, `HeaderMobileMenu`, the lazy `HeaderDeckActionsSlot` and
 * the real `ImportDialog` render together, through the shared test kit. The
 * deck store is the real one; its two network actions are replaced on the
 * store instance, so nothing of the repository is mocked.
 *
 * jsdom applies no CSS, so the desktop bar and the mobile menu are both in the
 * document once the menu is open. The tests tell them apart by their
 * navigation landmark, as `Header.test.tsx` does.
 *
 * One seam is left, `@/i18n/navigation`, replaced by the shared typed stub:
 * next-intl's ESM build imports `next/navigation` without a file extension,
 * which Node's loader cannot resolve unless Vitest inlines next-intl (see the
 * header of `src/app/[locale]/builder/[deckId]/page.test.tsx`).
 */
import { cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useDeckStore } from "@/lib/deck/store";
import { renderWithProviders } from "@/test/render";
import { Header } from "./Header";

// eslint-disable-next-line no-restricted-syntax -- the one seam left; the header says why and what removes it
vi.mock(
  import("@/i18n/navigation"),
  () => import("@/test/i18n-navigation-stub")
);

const DIALOG = { name: "Import Decklist" };
const NAVIGATION = { name: "My Decks" };

/** The header as a guest sees it, so `UserMenu` has a session to read. */
function renderHeader(deckId?: string) {
  return renderWithProviders(<Header deckId={deckId} />, { session: null });
}

/**
 * Replaces the store's two network actions with ones that succeed at once.
 * The tests check that the header asks for the new deck to be activated; the
 * activation itself is the store's own contract.
 */
function stubDeckCreation(id: string) {
  const createDeck = vi.fn(async (_name: string) => id);
  const setActiveDeck = vi.fn(async (_deckId: string) => {});
  useDeckStore.setState({ createDeck, setActiveDeck });
  return { createDeck, setActiveDeck };
}

/** Opens the mobile menu and returns its navigation landmark. */
async function openMobileMenu(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Open menu" }));
  const [, mobileMenu] = screen.getAllByRole("navigation", NAVIGATION);
  return within(mobileMenu);
}

/** Every navigation landmark, the ones a modal dialog hides from assistive tech included. */
function navigationCount() {
  return screen.getAllByRole("navigation", { ...NAVIGATION, hidden: true })
    .length;
}

afterEach(() => {
  // Vitest runs `afterEach` hooks last-registered first, so Testing Library's
  // own cleanup would come after this one: unmount first, or the reset reaches
  // the mounted header's store subscriptions outside `act`.
  cleanup();
  useDeckStore.setState(useDeckStore.getInitialState(), true);
});

describe("Import from the mobile menu", () => {
  it("keeps the import dialog open after Import closes the menu in the builder", async () => {
    const user = userEvent.setup();
    renderHeader("deck-1");

    const menu = await openMobileMenu(user);
    await user.click(await menu.findByRole("button", { name: "Import" }));

    const dialog = await screen.findByRole("dialog", DIALOG);
    expect(navigationCount()).toBe(1);
    expect(dialog).toBeInTheDocument();

    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("dialog", DIALOG)).not.toBeInTheDocument()
    );
  });

  it("creates one deck and opens exactly one import dialog from home", async () => {
    const user = userEvent.setup();
    const { createDeck, setActiveDeck } = stubDeckCreation("deck-123");
    renderHeader();

    const menu = await openMobileMenu(user);
    await user.click(await menu.findByRole("button", { name: "Import" }));

    await waitFor(() =>
      expect(screen.getAllByRole("dialog", DIALOG)).toHaveLength(1)
    );
    expect(createDeck).toHaveBeenCalledTimes(1);
    expect(setActiveDeck).toHaveBeenCalledWith("deck-123");
    expect(navigationCount()).toBe(1);
  });
});

describe("Import from the desktop bar", () => {
  it("opens the dialog on the current deck in the builder, and gives focus back on close", async () => {
    const user = userEvent.setup();
    renderHeader("deck-1");

    const importButton = await screen.findByRole("button", { name: "Import" });
    await user.click(importButton);

    expect(await screen.findByRole("dialog", DIALOG)).toBeInTheDocument();

    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("dialog", DIALOG)).not.toBeInTheDocument()
    );
    await waitFor(() => expect(importButton).toHaveFocus());
  });

  it("creates one deck and opens exactly one import dialog from home", async () => {
    const user = userEvent.setup();
    const { createDeck, setActiveDeck } = stubDeckCreation("deck-123");
    renderHeader();

    await user.click(await screen.findByRole("button", { name: "Import" }));

    await waitFor(() =>
      expect(screen.getAllByRole("dialog", DIALOG)).toHaveLength(1)
    );
    expect(createDeck).toHaveBeenCalledTimes(1);
    expect(setActiveDeck).toHaveBeenCalledWith("deck-123");
  });
});
