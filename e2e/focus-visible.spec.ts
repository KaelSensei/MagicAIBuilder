/**
 * Keyboard focus shows one indicator everywhere, in both themes: a 2px solid
 * outline in `--focus-ring` (design audit S1, I-04; WCAG 2.2 SC 2.4.7 and
 * 1.4.11, https://www.w3.org/TR/WCAG22/#focus-visible, read 2026-11-26).
 *
 * jsdom does not compute the stylesheet, so this is where the outline is
 * measured. `src/styles/contrast.test.ts` holds the token to 3:1 on every
 * surface; `src/styles/focus-ring-policy.test.ts` keeps the old accent rings
 * out of the source.
 *
 * The theme follows the emulated colour scheme because each test stores the
 * "system" preference before the page loads; the app's default is dark.
 *
 * @module e2e/focus-visible
 */
import { expect, test, type Locator, type Page } from "@playwright/test";
import { suppressOnboarding, waitForBuilder } from "./helpers";

/** `--focus-ring` of each theme, as the browser computes an outline colour. */
const FOCUS_RING = {
  dark: "rgb(196, 181, 253)",
  light: "rgb(109, 40, 217)",
} as const;

type Scheme = keyof typeof FOCUS_RING;

const SCHEMES: readonly Scheme[] = ["dark", "light"];

/** How many keyboard stops each pass checks. */
const STOPS = 10;

/** localStorage key and v1 persist shape of the theme store (`src/hooks/useTheme.ts`). */
const THEME_STORAGE_KEY = "magic-ai-builder-theme";
const FOLLOW_SYSTEM_THEME = JSON.stringify({
  state: { theme: "dark", preference: "system" },
  version: 1,
});

/** The outline the focused control shows, and a name to report it by. */
interface FocusOutline {
  readonly control: string;
  readonly style: string;
  readonly width: string;
  readonly color: string;
}

/** Stores the "system" theme preference, so `colorScheme` picks the theme. */
async function followSystemTheme(page: Page): Promise<void> {
  await page.addInitScript(
    ([key, value]) => {
      window.localStorage.setItem(key, value);
    },
    [THEME_STORAGE_KEY, FOLLOW_SYSTEM_THEME]
  );
}

/**
 * Reads the outline of the focused control. A text field inside a pill shell
 * (the card search) hides its own outline and lets the shell draw it around
 * both, so the shell is read when the field draws none.
 */
async function focusedOutline(page: Page): Promise<FocusOutline> {
  return page.evaluate(() => {
    const active = document.activeElement;
    if (!(active instanceof HTMLElement) || active === document.body) {
      return {
        control: "nothing focused",
        style: "none",
        width: "0px",
        color: "",
      };
    }
    const own = getComputedStyle(active);
    const shell = active.parentElement;
    const drawn =
      own.outlineStyle === "none" && shell !== null
        ? getComputedStyle(shell)
        : own;
    const name =
      active.getAttribute("aria-label") ??
      active.textContent?.trim().slice(0, 40) ??
      "";
    return {
      control: `${active.tagName.toLowerCase()} "${name}"`,
      style: drawn.outlineStyle,
      width: drawn.outlineWidth,
      color: drawn.outlineColor,
    };
  });
}

/** Presses Tab `remaining` times and reads the outline at every stop. */
async function tabStops(
  page: Page,
  remaining: number,
  seen: readonly FocusOutline[] = []
): Promise<readonly FocusOutline[]> {
  if (remaining === 0) return seen;
  await page.keyboard.press("Tab");
  const stop = await focusedOutline(page);
  return tabStops(page, remaining - 1, [...seen, stop]);
}

/** The stops that do not show a 2px solid outline in the theme's `--focus-ring`. */
function withoutTheRing(
  stops: readonly FocusOutline[],
  scheme: Scheme
): readonly FocusOutline[] {
  return stops.filter(
    (stop) =>
      stop.style !== "solid" ||
      stop.width !== "2px" ||
      stop.color !== FOCUS_RING[scheme]
  );
}

/** Opens My Decks for a visitor and waits until the header has hydrated. */
async function openDecks(page: Page): Promise<void> {
  await suppressOnboarding(page);
  await page.goto("/decks");
  await expect(page.getByRole("heading", { name: "My Decks" })).toBeVisible();
  await expect(
    page
      .getByRole("banner")
      .getByRole("button", { name: "New Deck", exact: true })
  ).toBeEnabled();
  await page.waitForLoadState("networkidle");
}

/** Opens the guest builder and waits until its title bar is interactive. */
async function openGuestBuilder(page: Page): Promise<void> {
  await suppressOnboarding(page);
  await page.goto("/builder/guest");
  await waitForBuilder(page);
  await page.waitForLoadState("networkidle");
}

/** The view switch of My Decks: a plain button with no focus class of its own. */
function gridViewButton(page: Page): Locator {
  return page.getByRole("button", { name: "Grid", exact: true });
}

for (const scheme of SCHEMES) {
  test.describe(`keyboard focus in the ${scheme} theme`, () => {
    test.use({ colorScheme: scheme });

    test.beforeEach(async ({ page }) => {
      await followSystemTheme(page);
    });

    test(`draws the ${scheme} --focus-ring outline on the first ${STOPS} stops of My Decks`, async ({
      page,
    }) => {
      await openDecks(page);
      await expect(page.locator("html")).toHaveAttribute("data-theme", scheme);

      const stops = await tabStops(page, STOPS);

      expect(stops).toHaveLength(STOPS);
      expect(withoutTheRing(stops, scheme)).toEqual([]);
    });

    // The header is the same component as on My Decks, so this pass starts at
    // the builder's title bar: its pills and the deck name had no focus style.
    test(`draws the ${scheme} --focus-ring outline on ${STOPS} stops from the guest builder's title bar`, async ({
      page,
    }) => {
      await openGuestBuilder(page);
      await expect(page.locator("html")).toHaveAttribute("data-theme", scheme);
      await page.getByRole("link", { name: "Back to my decks" }).focus();

      const stops = await tabStops(page, STOPS);

      expect(stops).toHaveLength(STOPS);
      expect(withoutTheRing(stops, scheme)).toEqual([]);
    });
  });
}

test("draws no outline when a mouse click focuses a button", async ({
  page,
}) => {
  await openDecks(page);
  const grid = gridViewButton(page);

  await grid.click();

  await expect(grid).toBeFocused();
  expect(
    await grid.evaluate((button) => getComputedStyle(button).outlineStyle)
  ).toBe("none");
});

test("draws the outline around the card search when a mouse click focuses it", async ({
  page,
}) => {
  await openGuestBuilder(page);

  await page.getByTestId("search-input").click();

  expect(await focusedOutline(page)).toMatchObject({
    style: "solid",
    width: "2px",
    color: FOCUS_RING.dark,
  });
});

test("keeps the outline on a keyboard-focused button in forced-colors mode", async ({
  page,
}) => {
  await page.emulateMedia({ forcedColors: "active" });
  await openDecks(page);
  const grid = gridViewButton(page);

  // Reach the button by keyboard, so that it matches :focus-visible.
  await grid.focus();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Shift+Tab");

  await expect(grid).toBeFocused();
  expect(await focusedOutline(page)).toMatchObject({
    style: "solid",
    width: "2px",
  });
});
