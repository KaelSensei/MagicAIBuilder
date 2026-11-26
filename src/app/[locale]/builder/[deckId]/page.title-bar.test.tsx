/**
 * The builder's title bar for keyboard and screen-reader players (design audit S10, I-04): the
 * button that confirms a new deck name, the deck-name button and its pencil, the back link and
 * the "AI" badge.
 *
 * Sociable: the page, the real deck store and the real deck client, answered by the in-memory
 * deck API through `deckApiHandlers`. MSW serves the page's other routes with empty answers, and
 * Next's app-router contexts carry the route params and the router, so the real
 * `@/i18n/navigation` runs. No module is mocked. The deck comes from the in-memory API's own
 * `emptyApiDeck`: the page reads the deck API's shape, which `aDeck` (the store's `Deck`) is not.
 *
 * jsdom loads no stylesheet and computes no layout, so sizes and focus styles are read from the
 * Tailwind classes; `e2e/focus-visible.spec.ts` measures the outline in a browser.
 */
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import type { Session } from "next-auth";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { PathParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { beforeEach, describe, expect, it, onTestFinished, vi } from "vitest";
import { focusRingClassName } from "@/components/ui/focus";
import { useDeckStore } from "@/lib/deck/store";
import { EMPTY_SEARCH_RESPONSE } from "@/lib/scryfall/types";
import { useUIStore } from "@/lib/ui/store";
import { deckApiHandlers } from "@/test/fake-deck-client";
import { HIDES_FOCUS_OUTLINE } from "@/test/focus-outline";
import { createInMemoryDeckApi, emptyApiDeck } from "@/test/in-memory-deck-api";
import { setupMsw } from "@/test/msw";
import { renderWithProviders } from "@/test/render";
import BuilderPage from "./page";

const DECK_ID = "atraxa";
const DECK_NAME = "Atraxa Superfriends";

/**
 * A colour from Tailwind's built-in palette, such as `text-purple-400`: one hue in both themes,
 * which no contrast test checks. Theme tokens (`--accent-text`, …) are held by
 * `src/styles/contrast.test.ts`.
 */
const RAW_PALETTE_HUE = /\b(?:text|bg|border)-[a-z]+-\d{2,3}\b/;

/** A signed-in player who owns the deck under test. */
const PLAYER: Session = {
  user: { id: "player-1", name: "Kael" },
  expires: "2099-01-01T00:00:00.000Z",
};

const api = createInMemoryDeckApi();

setupMsw(
  ...deckApiHandlers(api),
  // Game Changers, banlist and the search panel read the shared Scryfall cache; empty lists will do.
  http.get("/api/cache/search", () =>
    HttpResponse.json({ hit: true, data: EMPTY_SEARCH_RESPONSE })
  ),
  http.get("/api/search/translate", () =>
    HttpResponse.json({ available: false })
  ),
  http.get("/api/meta/:slug/history", () =>
    HttpResponse.json({ report: null, snapshotCount: 0, windowDays: 90 })
  )
);

/**
 * Opens Atraxa Superfriends at `/en/builder/atraxa` and waits for its title bar.
 *
 * @returns the deck's name heading, inside the button that starts a rename
 */
async function openAtraxa(): Promise<HTMLElement> {
  const router = {
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  };
  renderWithProviders(
    <AppRouterContext.Provider value={router}>
      <PathParamsContext.Provider value={{ locale: "en", deckId: DECK_ID }}>
        <BuilderPage />
      </PathParamsContext.Provider>
    </AppRouterContext.Provider>,
    { session: PLAYER }
  );
  return screen.findByRole("heading", { level: 1, name: DECK_NAME });
}

beforeEach(() => {
  api.reset();
  api.seedDeck(emptyApiDeck(DECK_ID, DECK_NAME));
  localStorage.clear();
  useDeckStore.setState(useDeckStore.getInitialState(), true);
  useUIStore.setState(useUIStore.getInitialState(), true);
  // jsdom does not implement scrollTo; framer-motion calls it while measuring the panels' entry.
  vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
  onTestFinished(() => {
    vi.restoreAllMocks();
  });
});

describe("builder page: the title bar for keyboard and screen-reader players", () => {
  describe("renaming the deck", () => {
    it("names the button that confirms the new name", async () => {
      const user = userEvent.setup();
      await user.click(await openAtraxa());

      expect(
        screen.getByRole("button", { name: "Save the name" })
      ).toBeInTheDocument();
    });

    // Pressing the button moves focus off the field first, and the field's blur is what saves:
    // the button's own click lands once the row is gone. One save either way.
    it("saves the typed name once when the player presses that button", async () => {
      const user = userEvent.setup();
      await user.click(await openAtraxa());
      await user.clear(
        screen.getByRole("textbox", { name: "Click to rename" })
      );
      await user.paste("Atraxa Tempo");

      await user.click(screen.getByRole("button", { name: "Save the name" }));

      expect(
        await screen.findByRole("heading", { level: 1, name: "Atraxa Tempo" })
      ).toBeInTheDocument();
      await waitFor(() =>
        expect(api.savedDeck(DECK_ID)?.name).toBe("Atraxa Tempo")
      );
      expect(api.updateDeck).toHaveBeenCalledTimes(1);
    });

    it("keeps the saved name when the player presses Escape", async () => {
      const user = userEvent.setup();
      await user.click(await openAtraxa());
      await user.clear(
        screen.getByRole("textbox", { name: "Click to rename" })
      );
      await user.paste("Atraxa Tempo");

      await user.keyboard("{Escape}");

      expect(
        await screen.findByRole("heading", { level: 1, name: DECK_NAME })
      ).toBeInTheDocument();
      expect(api.updateDeck).not.toHaveBeenCalled();
    });
  });

  describe("the back link", () => {
    it("is named, offers a 24 by 24 px target and keeps the shared focus outline", async () => {
      await openAtraxa();

      const back = screen.getByRole("link", { name: "Back to my decks" });

      // `size-6` is 1.5rem, 24 px at the root font size: the minimum target of WCAG 2.2 SC 2.5.8
      // (https://www.w3.org/TR/WCAG22/#target-size-minimum, read 2026-11-26).
      expect(back).toHaveClass("size-6");
      expect(back).toHaveClass(...focusRingClassName.split(" "));
      expect(back.className).not.toMatch(HIDES_FOCUS_OUTLINE);
    });
  });

  describe("the deck-name button", () => {
    // The name is the visible deck name, so speech input can say what it sees (WCAG 2.2
    // SC 2.5.3), and the title tells a screen reader what pressing it does.
    it("is named after the deck and described as renaming it", async () => {
      await openAtraxa();

      expect(
        screen.getByRole("button", {
          name: DECK_NAME,
          description: "Click to rename",
        })
      ).toBeInTheDocument();
    });

    it("shows its pencil on keyboard focus as well as on hover", async () => {
      const heading = await openAtraxa();

      // The pencil is decorative (lucide marks it aria-hidden), so it has no role to query by.
      const pencil = heading.parentElement?.querySelector("svg");

      expect(pencil).toHaveClass(
        "opacity-0",
        "group-hover:opacity-100",
        "group-focus-visible:opacity-100"
      );
    });
  });

  describe("the deck-name field", () => {
    // The field shows only while it has focus, so its underline is a focus style. `--accent`
    // measured 2.76:1 on the dark surface (design audit S1); `--focus-ring` is held to 3:1 by
    // `src/styles/contrast.test.ts`.
    it("underlines the name in --focus-ring, never --accent, and keeps the shared outline", async () => {
      const user = userEvent.setup();
      await user.click(await openAtraxa());

      const field = screen.getByRole("textbox", { name: "Click to rename" });

      expect(field).toHaveClass("focus-visible:border-[var(--focus-ring)]");
      expect(field.className).not.toContain("var(--accent)");
      expect(field.className).not.toMatch(HIDES_FOCUS_OUTLINE);
    });
  });

  describe("the badge of an AI-generated deck", () => {
    it("is coloured with theme tokens, no raw palette hue, and hides its sparkle from screen readers", async () => {
      api.seedDeck({
        ...emptyApiDeck(DECK_ID, DECK_NAME),
        isAIGenerated: true,
      });
      await openAtraxa();

      const badge = screen.getByText(
        (_, element) => element?.textContent === "✨ AI"
      );

      expect(badge.className).not.toMatch(RAW_PALETTE_HUE);
      expect(badge).toHaveClass(
        "bg-[var(--accent-soft)]",
        "text-[var(--accent-text)]"
      );
      expect(screen.getByText("✨")).toHaveAttribute("aria-hidden", "true");
    });
  });
});
