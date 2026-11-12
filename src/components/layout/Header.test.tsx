import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { NextIntlClientProvider } from "next-intl";
import enCommon from "@/messages/en/common.json";
import frCommon from "@/messages/fr/common.json";
import { useToastStore } from "@/hooks/useToast";

let createDeckImpl: (name: string) => Promise<string> = async (_name: string) =>
  "deck-0";
let setActiveDeckImpl: (id: string) => void = (_id: string) => {};

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

vi.mock(import("@/i18n/navigation"), async () => ({
  ...(await import("@/test/i18n-navigation-stub")),
  useRouter: () => router,
}));

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

function renderWithIntl(ui: React.ReactElement, locale = "en") {
  const messages = locale === "fr" ? frCommon : enCommon;

  return render(
    <NextIntlClientProvider locale={locale} timeZone="UTC" messages={{ common: messages }}>
      {ui}
    </NextIntlClientProvider>
  );
}

describe("Header", () => {
  it("groups desktop destinations in a named primary navigation landmark", async () => {
    const { Header } = await import("./Header");

    renderWithIntl(React.createElement(Header));

    expect(
      screen.getByRole("navigation", { name: "My Decks" })
    ).toHaveTextContent("Collection");
  });

  it("creates a deck and activates it when clicking Import on home", async () => {
    const createDeck = vi.fn(async (_name: string) => "deck-123");
    const setActiveDeck = vi.fn((_id: string) => {});
    createDeckImpl = (name: string) => createDeck(name);
    setActiveDeckImpl = (id: string) => setActiveDeck(id);

    const { Header } = await import("./Header");

    renderWithIntl(React.createElement(Header));
    await userEvent.click(screen.getByRole("button", { name: /import/i }));

    await waitFor(() => expect(createDeck).toHaveBeenCalledTimes(1));
    expect(setActiveDeck).toHaveBeenCalledWith("deck-123");
  });

  it("uses the active locale for the imported deck name", async () => {
    const createDeck = vi.fn(async (_name: string) => "deck-123");
    createDeckImpl = (name: string) => createDeck(name);

    const { Header } = await import("./Header");

    renderWithIntl(React.createElement(Header), "fr");
    await userEvent.click(screen.getByRole("button", { name: /importer/i }));

    expect(createDeck).toHaveBeenCalledWith(expect.stringMatching(/^Deck importé — /));
  });

  // The blank deck was always stored as "New Deck", whatever the creator's locale.
  it("names a new deck in the creator's locale", async () => {
    const createDeck = vi.fn(async (_name: string) => "deck-123");
    createDeckImpl = (name: string) => createDeck(name);

    const { Header } = await import("./Header");

    renderWithIntl(React.createElement(Header), "fr");
    await userEvent.click(screen.getByRole("button", { name: "Nouveau deck" }));

    expect(createDeck).toHaveBeenCalledWith("Nouveau deck");
  });
});

/*
 * Characterization for P1-52, which turns the header's deck actions into a
 * lazy slot (audit_architecture 1.10): what "New Deck" does from any page,
 * and what the mobile menu holds. The menu button's state and the missing
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
    await userEvent.click(screen.getByRole("button", { name: "New Deck" }));

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
    const newDeck = screen.getByRole("button", { name: "New Deck" });
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
    expect(menu.getByRole("button", { name: "Import" })).toBeInTheDocument();
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
      within(mobileMenu).getByRole("button", { name: "New Deck" })
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
 * A failed creation used to reject unhandled: the button spun, then came back,
 * and the player saw nothing. The header now reports it in a toast.
 */
describe("Header deck creation failures", () => {
  beforeEach(() => {
    router.push.mockReset();
    useToastStore.setState({ toasts: [] });
  });

  it("tells the player why New Deck failed and lets them try again", async () => {
    createDeckImpl = async () => {
      throw new Error("HTTP 500");
    };
    const { Header } = await import("./Header");

    renderWithIntl(React.createElement(Header));
    const newDeck = screen.getByRole("button", { name: "New Deck" });
    await userEvent.click(newDeck);

    await waitFor(() =>
      expect(useToastStore.getState().toasts).toEqual([
        expect.objectContaining({
          type: "error",
          message: "Could not create the deck — HTTP 500",
        }),
      ])
    );
    expect(newDeck).toBeEnabled();
    expect(router.push).not.toHaveBeenCalled();
  });

  it("tells the player why Import failed, without activating a deck", async () => {
    createDeckImpl = async () => {
      throw new Error("HTTP 503");
    };
    const setActiveDeck = vi.fn((_id: string) => {});
    setActiveDeckImpl = (id: string) => setActiveDeck(id);
    const { Header } = await import("./Header");

    renderWithIntl(React.createElement(Header));
    const importButton = screen.getByRole("button", { name: "Import" });
    await userEvent.click(importButton);

    await waitFor(() =>
      expect(useToastStore.getState().toasts).toEqual([
        expect.objectContaining({
          type: "error",
          message: "Could not create the deck — HTTP 503",
        }),
      ])
    );
    expect(importButton).toBeEnabled();
    expect(setActiveDeck).not.toHaveBeenCalled();
  });
});
