import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { useToastStore } from "@/hooks/useToast";
import { DeckApiError } from "@/lib/db/deck-api-answer";
import { HIDES_FOCUS_OUTLINE } from "@/test/focus-outline";
import {
  hydrateWithIntl,
  renderToStringWithIntl,
} from "@/test/hydrate-with-intl";
import { renderWithIntl } from "@/test/render-with-intl";
import {
  IDLE_HEADER_DECK_ACTIONS,
  type HeaderDeckActionsUiState,
} from "./header-deck-actions-state";
import type { HeaderDeckActionsLayout } from "./HeaderDeckActions";

let createDeckImpl: (name: string) => Promise<string> = async (_name: string) =>
  "deck-0";
let setActiveDeckImpl: (id: string) => void = (_id: string) => {};
/** How late a slow deck creation resolves: after the click, well within `waitFor`'s wait. */
const SLOW_CREATE_MS = 30;

// One router for the whole file, so a test can see where the header navigates.
const router = vi.hoisted(() => ({
  bfcacheId: "test",
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
}));

// The page the header renders on, locale-free as next-intl reports it; the home page unless a test moves it.
const page = vi.hoisted(() => ({ pathname: "/" }));

vi.mock(import("@/i18n/navigation"), async () => ({
  ...(await import("@/test/i18n-navigation-stub")),
  useRouter: () => router,
  usePathname: () => page.pathname,
}));

// Every test starts on the home page, so a pathname one test sets never leaks into the next.
beforeEach(() => {
  page.pathname = "/";
});

vi.mock(import("@/hooks/useTheme"), () => ({
  useTheme: () => ({
    theme: "dark",
    preference: "dark",
    toggleTheme: vi.fn(),
    setTheme: vi.fn(),
    setPreference: vi.fn(),
  }),
}));

// The two stand-ins print a marker, so a test can see which bar holds them.
vi.mock(import("@/components/auth/UserMenu"), () => ({
  UserMenu: () => <span>user menu</span>,
}));

vi.mock(import("@/components/layout/LocaleSwitcher"), () => ({
  LocaleSwitcher: () => <span>language switch</span>,
}));

vi.mock(import("@/components/deck/ImportDialog"), () => ({
  ImportDialog: ({ children }: { children?: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
}));

vi.mock("@/lib/deck/store", () => ({
  useDeckStore: (
    selector: (s: {
      createDeck: (name: string) => Promise<string>;
      setActiveDeck: (id: string) => void;
    }) => unknown
  ) =>
    selector({
      createDeck: (name: string) => createDeckImpl(name),
      setActiveDeck: (id: string) => setActiveDeckImpl(id),
    }),
}));

// The deck buttons arrive through a lazy slot (`HeaderDeckActionsSlot`). The first test that
// waited for them paid for loading that chunk inside `findByRole`'s one-second wait, about half
// a second on an idle machine, so a loaded full run timed out. Loading it once here, under the
// hook's own timeout, leaves each wait with only React's render to cover.
beforeAll(async () => {
  await import("./HeaderDeckActions");
});

describe("Header", () => {
  it("groups desktop destinations in a named primary navigation landmark", async () => {
    const { Header } = await import("./Header");

    renderWithIntl(React.createElement(Header));

    expect(
      screen.getByRole("navigation", { name: "My Decks" })
    ).toHaveTextContent("Collection");
  });

  it("creates a deck and activates it when clicking Import on home", async () => {
    // The deck is created a little after the click, as it is under a loaded run.
    const createDeck = vi.fn(
      (_name: string) =>
        new Promise<string>((resolve) => {
          setTimeout(() => resolve("deck-123"), SLOW_CREATE_MS);
        })
    );
    const setActiveDeck = vi.fn((_id: string) => {});
    createDeckImpl = (name: string) => createDeck(name);
    setActiveDeckImpl = (id: string) => setActiveDeck(id);

    const { Header } = await import("./Header");

    renderWithIntl(React.createElement(Header));
    await userEvent.click(
      await screen.findByRole("button", { name: /import/i })
    );

    await waitFor(() => expect(setActiveDeck).toHaveBeenCalledWith("deck-123"));
    expect(createDeck).toHaveBeenCalledTimes(1);
  });

  it("uses the active locale for the imported deck name", async () => {
    const createDeck = vi.fn(async (_name: string) => "deck-123");
    createDeckImpl = (name: string) => createDeck(name);

    const { Header } = await import("./Header");

    renderWithIntl(React.createElement(Header), { locale: "fr" });
    await userEvent.click(
      await screen.findByRole("button", { name: /importer/i })
    );

    expect(createDeck).toHaveBeenCalledWith(expect.stringMatching(/^Deck importé — /));
  });

  // The blank deck was always stored as "New Deck", whatever the creator's locale.
  it("names a new deck in the creator's locale", async () => {
    const createDeck = vi.fn(async (_name: string) => "deck-123");
    createDeckImpl = (name: string) => createDeck(name);

    const { Header } = await import("./Header");

    renderWithIntl(React.createElement(Header), { locale: "fr" });
    await userEvent.click(
      await screen.findByRole("button", { name: "Nouveau deck" })
    );

    expect(createDeck).toHaveBeenCalledWith("Nouveau deck");
  });
});

/*
 * Characterization written for P1-52, which turned the header's deck actions
 * into a lazy slot (audit_architecture 1.10): what "New Deck" does from any
 * page, and what the mobile menu holds. The deck buttons arrive with the
 * slot's chunk, so the tests wait for them with `findByRole`. The menu button's state and the missing
 * language switch are pinned as they are; B2-19 changes them.
 */
describe("Header deck actions and mobile menu (characterization)", () => {
  beforeEach(() => {
    router.push.mockReset();
  });

  /** Resolves `createDeck` with `id` after `release` is called. */
  function deferredDeck(id: string) {
    let release = () => {};
    const created = new Promise<string>((resolve) => {
      release = () => resolve(id);
    });
    return { created, release: () => release() };
  }

  it("opens a new deck in the builder once it is created", async () => {
    const createDeck = vi.fn(async (_name: string) => "deck-123");
    createDeckImpl = (name: string) => createDeck(name);
    const { Header } = await import("./Header");

    renderWithIntl(React.createElement(Header));
    await userEvent.click(
      await screen.findByRole("button", { name: "New Deck" })
    );

    await waitFor(() =>
      expect(router.push).toHaveBeenCalledWith("/builder/deck-123")
    );
    expect(createDeck).toHaveBeenCalledWith("New Deck");
  });

  it("disables New Deck while a deck is being created, so a second click creates nothing", async () => {
    const pending = deferredDeck("deck-123");
    const createDeck = vi.fn((_name: string) => pending.created);
    createDeckImpl = (name: string) => createDeck(name);
    const { Header } = await import("./Header");

    renderWithIntl(React.createElement(Header));
    const newDeck = await screen.findByRole("button", { name: "New Deck" });
    await userEvent.click(newDeck);
    await waitFor(() => expect(newDeck).toBeDisabled());
    await userEvent.click(newDeck);
    pending.release();

    await waitFor(() => expect(newDeck).toBeEnabled());
    expect(createDeck).toHaveBeenCalledTimes(1);
    expect(router.push).toHaveBeenCalledTimes(1);
  });

  it("opens a mobile menu holding the same links, Import, New Deck and the user menu", async () => {
    const { Header } = await import("./Header");

    renderWithIntl(React.createElement(Header));
    await userEvent.click(screen.getByRole("button", { name: "Open menu" }));

    const [, mobileMenu] = screen.getAllByRole("navigation", {
      name: "My Decks",
    });
    const menu = within(mobileMenu);
    expect(
      menu
        .getAllByRole("link")
        .map((link) => [link.textContent, link.getAttribute("href")])
    ).toEqual([
      ["My Decks", "/decks"],
      ["Collection", "/collection"],
      ["Rules", "/rules/game-changers"],
    ]);
    expect(
      await menu.findByRole("button", { name: "Import" })
    ).toBeInTheDocument();
    expect(menu.getByRole("button", { name: "New Deck" })).toBeInTheDocument();
    expect(menu.getByText("user menu")).toBeInTheDocument();
  });

  it("currently leaves the language switch out of the mobile menu (pinned; see B2-19)", async () => {
    const { Header } = await import("./Header");

    renderWithIntl(React.createElement(Header));
    await userEvent.click(screen.getByRole("button", { name: "Open menu" }));

    const [, mobileMenu] = screen.getAllByRole("navigation", {
      name: "My Decks",
    });
    expect(within(mobileMenu).queryByText("language switch")).toBeNull();
    expect(screen.getAllByText("language switch")).toHaveLength(1);
  });

  it("currently keeps the menu button named Open menu, with no expanded state, while the menu is open (pinned; see B2-19)", async () => {
    const { Header } = await import("./Header");

    renderWithIntl(React.createElement(Header));
    const toggle = screen.getByRole("button", { name: "Open menu" });
    await userEvent.click(toggle);

    expect(
      screen.getAllByRole("navigation", { name: "My Decks" })
    ).toHaveLength(2);
    expect(toggle).toHaveAccessibleName("Open menu");
    expect(toggle).not.toHaveAttribute("aria-expanded");
  });

  it("closes the mobile menu when the player follows one of its links", async () => {
    // jsdom cannot navigate; the click still reaches the link's own handler.
    const stayOnPage = (event: MouseEvent) => event.preventDefault();
    document.addEventListener("click", stayOnPage, true);
    const { Header } = await import("./Header");

    renderWithIntl(React.createElement(Header));
    await userEvent.click(screen.getByRole("button", { name: "Open menu" }));
    const [, mobileMenu] = screen.getAllByRole("navigation", {
      name: "My Decks",
    });
    await userEvent.click(
      within(mobileMenu).getByRole("link", { name: "Collection" })
    );
    document.removeEventListener("click", stayOnPage, true);

    expect(
      screen.getAllByRole("navigation", { name: "My Decks" })
    ).toHaveLength(1);
  });

  it("closes the mobile menu and opens a new deck from its New Deck button", async () => {
    const createDeck = vi.fn(async (_name: string) => "deck-456");
    createDeckImpl = (name: string) => createDeck(name);
    const { Header } = await import("./Header");

    renderWithIntl(React.createElement(Header));
    await userEvent.click(screen.getByRole("button", { name: "Open menu" }));
    const [, mobileMenu] = screen.getAllByRole("navigation", {
      name: "My Decks",
    });
    await userEvent.click(
      await within(mobileMenu).findByRole("button", { name: "New Deck" })
    );

    await waitFor(() =>
      expect(router.push).toHaveBeenCalledWith("/builder/deck-456")
    );
    expect(
      screen.getAllByRole("navigation", { name: "My Decks" })
    ).toHaveLength(1);
  });
});

/*
 * Every navigation link looked the same, so a player could not see which page
 * they were on, and a screen reader never said "current page" (design audit
 * S9, 2026-11-25). jsdom applies no CSS: the marker's look is checked through
 * its classes here and its contrast in `src/styles/contrast.test.ts`.
 */
describe("Header current page", () => {
  /**
   * The non-colour mark: a 2 px underline in `--accent-text`, applied only
   * while the link carries `aria-current="page"`.
   */
  const CURRENT_PAGE_UNDERLINE = [
    "aria-[current=page]:underline",
    "aria-[current=page]:decoration-2",
    "aria-[current=page]:decoration-[var(--accent-text)]",
    // The current link's fill would otherwise hide the hover feedback every link has.
    "aria-[current=page]:hover:bg-[var(--accent-soft)]",
  ];

  /** Each link of a navigation landmark, with its `aria-current` value. */
  function ariaCurrentByLink(navigation: HTMLElement) {
    return within(navigation)
      .getAllByRole("link")
      .map((link) => [link.textContent, link.getAttribute("aria-current")]);
  }

  it("marks My Decks as the current page on the decks page, and no other link", async () => {
    page.pathname = "/decks";
    const { Header } = await import("./Header");

    renderWithIntl(React.createElement(Header));

    expect(
      ariaCurrentByLink(screen.getByRole("navigation", { name: "My Decks" }))
    ).toEqual([
      ["My Decks", "page"],
      ["Collection", null],
      ["Rules", null],
    ]);
  });

  it("marks the same link in the mobile menu", async () => {
    page.pathname = "/decks";
    const { Header } = await import("./Header");

    renderWithIntl(React.createElement(Header));
    await userEvent.click(screen.getByRole("button", { name: "Open menu" }));

    const [, mobileMenu] = screen.getAllByRole("navigation", {
      name: "My Decks",
    });
    expect(ariaCurrentByLink(mobileMenu)).toEqual([
      ["My Decks", "page"],
      ["Collection", null],
      ["Rules", null],
    ]);
  });

  it("marks Rules on a rules page its link does not open", async () => {
    page.pathname = "/rules/comprehensive";
    const { Header } = await import("./Header");

    renderWithIntl(React.createElement(Header));

    expect(
      ariaCurrentByLink(screen.getByRole("navigation", { name: "My Decks" }))
    ).toEqual([
      ["My Decks", null],
      ["Collection", null],
      ["Rules", "page"],
    ]);
  });

  it("marks no link in either bar on a page no link points to, such as the builder", async () => {
    page.pathname = "/builder/deck-1";
    const { Header } = await import("./Header");

    renderWithIntl(React.createElement(Header));
    await userEvent.click(screen.getByRole("button", { name: "Open menu" }));

    const navigations = screen.getAllByRole("navigation", { name: "My Decks" });
    expect(navigations).toHaveLength(2);
    for (const navigation of navigations) {
      expect(
        within(navigation)
          .getAllByRole("link")
          .filter((link) => link.hasAttribute("aria-current"))
      ).toEqual([]);
    }
  });

  it("marks the current page in French", async () => {
    page.pathname = "/decks";
    const { Header } = await import("./Header");

    renderWithIntl(React.createElement(Header), { locale: "fr" });

    expect(
      ariaCurrentByLink(screen.getByRole("navigation", { name: "Mes Decks" }))
    ).toEqual([
      ["Mes Decks", "page"],
      ["Collection", null],
      ["Règles", null],
    ]);
  });

  it("puts the mark in the server HTML, so it shows before hydration", async () => {
    page.pathname = "/collection";
    const { Header } = await import("./Header");

    const html = renderToStringWithIntl(React.createElement(Header));
    const parsed = document.createElement("div");
    parsed.innerHTML = html;

    expect(ariaCurrentByLink(within(parsed).getByRole("navigation"))).toEqual([
      ["My Decks", null],
      ["Collection", "page"],
      ["Rules", null],
    ]);
  });

  it("underlines the current link in both bars, a mark that does not rely on colour", async () => {
    page.pathname = "/decks";
    const { Header } = await import("./Header");

    renderWithIntl(React.createElement(Header));
    await userEvent.click(screen.getByRole("button", { name: "Open menu" }));

    const currentLinks = screen
      .getAllByRole("link", { name: "My Decks" })
      .filter((link) => link.getAttribute("aria-current") === "page");
    expect(currentLinks).toHaveLength(2);
    for (const link of currentLinks) {
      expect(link.className.split(/\s+/)).toEqual(
        expect.arrayContaining(CURRENT_PAGE_UNDERLINE)
      );
    }
  });

  it("keeps the shared focus outline on every navigation link in both bars", async () => {
    page.pathname = "/decks";
    const { Header } = await import("./Header");

    renderWithIntl(React.createElement(Header));
    await userEvent.click(screen.getByRole("button", { name: "Open menu" }));

    const links = screen
      .getAllByRole("navigation", { name: "My Decks" })
      .flatMap((navigation) => within(navigation).getAllByRole("link"));
    expect(links).toHaveLength(6);
    for (const link of links) {
      expect(link.className).not.toMatch(HIDES_FOCUS_OUTLINE);
    }
  });
});

/*
 * A failed creation used to reject unhandled: the button spun, then came back,
 * and the player saw nothing. The header then reported it in a toast that
 * carried the client's diagnostic text ("— [createDeck] HTTP 500: …"); it now
 * says so in the player's language, as the decks page does (I-01).
 */
describe("Header deck creation failures", () => {
  beforeEach(() => {
    router.push.mockReset();
    useToastStore.setState({ toasts: [] });
  });

  it("says New Deck failed in French, with no HTTP status, and lets them try again", async () => {
    createDeckImpl = async () => {
      throw new DeckApiError("createDeck", 500, "Failed to create deck");
    };
    const { Header } = await import("./Header");

    renderWithIntl(React.createElement(Header), { locale: "fr" });
    const newDeck = await screen.findByRole("button", { name: "Nouveau deck" });
    await userEvent.click(newDeck);

    await waitFor(() =>
      expect(useToastStore.getState().toasts).toEqual([
        expect.objectContaining({
          type: "error",
          message: "Impossible de créer le deck. Réessayez.",
        }),
      ])
    );
    expect(newDeck).toBeEnabled();
    expect(router.push).not.toHaveBeenCalled();
  });

  it("asks the player to sign in again when New Deck meets an ended session", async () => {
    createDeckImpl = async () => {
      throw new DeckApiError("createDeck", 401, "Unauthorized");
    };
    const { Header } = await import("./Header");

    renderWithIntl(React.createElement(Header));
    await userEvent.click(
      await screen.findByRole("button", { name: "New Deck" })
    );

    await waitFor(() =>
      expect(useToastStore.getState().toasts).toEqual([
        expect.objectContaining({
          type: "error",
          message: "Your session has ended. Sign in again to create a deck.",
        }),
      ])
    );
  });

  it("says Import failed, without activating a deck", async () => {
    createDeckImpl = async () => {
      throw new Error("HTTP 503");
    };
    const setActiveDeck = vi.fn((_id: string) => {});
    setActiveDeckImpl = (id: string) => setActiveDeck(id);
    const { Header } = await import("./Header");

    renderWithIntl(React.createElement(Header));
    const importButton = await screen.findByRole("button", { name: "Import" });
    await userEvent.click(importButton);

    await waitFor(() =>
      expect(useToastStore.getState().toasts).toEqual([
        expect.objectContaining({
          type: "error",
          message: "Could not create the deck. Please try again.",
        }),
      ])
    );
    expect(importButton).toBeEnabled();
    expect(setActiveDeck).not.toHaveBeenCalled();
  });
});

/*
 * The server HTML held both deck buttons enabled, but their click handlers only
 * exist once the lazy chunk has loaded and hydrated. A press in that window did
 * nothing: no request, no spinner, no message (I-01; the `openBuilder` E2E
 * flake of 2026-11-12 and 2026-11-25). The buttons now stay disabled until the
 * code that answers them is there.
 */
describe("Header deck actions before hydration", () => {
  const LAYOUTS: readonly HeaderDeckActionsLayout[] = ["desktop", "mobile"];

  /** The two deck buttons, by their accessible names, inside `container`. */
  function deckButtons(container: HTMLElement) {
    const scope = within(container);
    return {
      newDeck: scope.getByRole("button", { name: "New Deck" }),
      importButton: scope.getByRole("button", { name: "Import" }),
    };
  }

  /** The actions as `Header` mounts them, with a fixed UI state. */
  async function deckActions(
    layout: HeaderDeckActionsLayout,
    uiState: HeaderDeckActionsUiState = IDLE_HEADER_DECK_ACTIONS
  ) {
    const { HeaderDeckActions } = await import("./HeaderDeckActions");
    return (
      <HeaderDeckActions
        layout={layout}
        uiState={uiState}
        onUiStateChange={vi.fn()}
      />
    );
  }

  /** Server HTML parsed into a detached element, as the browser receives it. */
  function parsed(html: string): HTMLElement {
    const container = document.createElement("div");
    container.innerHTML = html;
    return container;
  }

  it.each(LAYOUTS)(
    "server-renders New Deck and Import disabled in the %s layout, so an early press is not lost",
    async (layout) => {
      const html = renderToStringWithIntl(await deckActions(layout));

      const { newDeck, importButton } = deckButtons(parsed(html));
      expect(newDeck).toBeDisabled();
      expect(importButton).toBeDisabled();
    }
  );

  it.each(LAYOUTS)(
    "enables both once the %s layout has hydrated, with no hydration mismatch",
    async (layout) => {
      const ui = await deckActions(layout);
      const html = renderToStringWithIntl(ui);

      const hydrated = await hydrateWithIntl(html, ui);

      expect(hydrated.mismatches).toEqual([]);
      const { newDeck, importButton } = deckButtons(hydrated.container);
      expect(newDeck).toBeEnabled();
      expect(importButton).toBeEnabled();
      hydrated.unmount();
    }
  );

  it("enables both at once in a render that is not a hydration", async () => {
    const { container } = renderWithIntl(await deckActions("desktop"));

    const { newDeck, importButton } = deckButtons(container);
    expect(newDeck).toBeEnabled();
    expect(importButton).toBeEnabled();
  });

  it("still disables only New Deck while a deck is being created", async () => {
    const { container } = renderWithIntl(
      await deckActions("desktop", {
        ...IDLE_HEADER_DECK_ACTIONS,
        isCreatingDeck: true,
      })
    );

    const { newDeck, importButton } = deckButtons(container);
    expect(newDeck).toBeDisabled();
    expect(importButton).toBeEnabled();
  });

  it("still disables only Import while it creates the deck to import into", async () => {
    const { container } = renderWithIntl(
      await deckActions("desktop", {
        ...IDLE_HEADER_DECK_ACTIONS,
        isCreatingImportDeck: true,
      })
    );

    const { newDeck, importButton } = deckButtons(container);
    expect(newDeck).toBeEnabled();
    expect(importButton).toBeDisabled();
  });
});
