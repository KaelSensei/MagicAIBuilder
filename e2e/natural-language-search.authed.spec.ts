import { test, expect } from "@playwright/test";
import { openBuilder } from "./helpers";

const GENERATED_QUERY = 't:instant o:"draw a card" legal:commander';
const EDITED_QUERY = 't:instant o:"draw two cards"';

const BRAINSTORM = {
  id: "00000000-0000-4000-8000-000000000010",
  name: "Brainstorm",
  mana_cost: "{U}",
  cmc: 1,
  type_line: "Instant",
  oracle_text: "Draw three cards, then put two cards from your hand on top of your library.",
  color_identity: ["U"],
  image_uris: {
    small: "/images/card-back.svg",
    normal: "/images/card-back.svg",
    large: "/images/card-back.svg",
  },
  prices: { usd: "1.00" },
  set: "c21",
  rarity: "common",
};

function readDescription(raw: string | null): string {
  if (!raw) return "";
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return "";
  }
  if (typeof parsed !== "object" || parsed === null || !("description" in parsed)) return "";
  const description = parsed.description;
  return typeof description === "string" ? description : "";
}

/**
 * Scryfall searches the editor issues on its own, before any described search.
 *
 * Game Changers and the Commander banlist load as catalogs. An empty name
 * search is still `legal:commander`, and that string is long enough to fetch.
 * None of these is the query the player accepts.
 */
function isEditorBackgroundSearch(query: string): boolean {
  return (
    query === "legal:commander" ||
    query === "is:gamechanger" ||
    query.startsWith("is:gamechanger ") ||
    query === "banned:commander" ||
    query.startsWith("banned:commander ")
  );
}

test.describe("Verifiable natural-language search", () => {
  test("shows one editable query, then searches that text without changing the deck", async ({ page }) => {
    const scryfallQueries: string[] = [];
    const descriptions: string[] = [];
    const cardPosts: string[] = [];

    await page.route("**/api/search/translate", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({ json: { available: true } });
        return;
      }
      descriptions.push(readDescription(route.request().postData()));
      await route.fulfill({
        json: {
          query: GENERATED_QUERY,
          context: { format: "commander", colorIdentity: [] },
        },
      });
    });
    await page.route("**/api/cache/search**", async (route) => {
      await route.fulfill({ json: { hit: false } });
    });
    await page.route("https://api.scryfall.com/cards/search**", async (route) => {
      const query = new URL(route.request().url()).searchParams.get("q") ?? "";
      if (isEditorBackgroundSearch(query)) {
        await route.continue();
        return;
      }
      scryfallQueries.push(query);
      await route.fulfill({
        json: { object: "list", total_cards: 1, has_more: false, data: [BRAINSTORM] },
      });
    });
    await page.route("**/api/decks/**/cards**", async (route) => {
      if (route.request().method() === "POST") cardPosts.push(route.request().url());
      await route.continue();
    });

    await openBuilder(page);
    await page.getByRole("button", { name: "Describe a card in plain language" }).click();
    await page.getByRole("textbox", { name: "Card description" }).fill("créatures qui font piocher");
    await page.getByRole("button", { name: "Show Scryfall query" }).click();

    const query = page.getByRole("textbox", { name: "Scryfall query" });
    await expect(query).toHaveValue(GENERATED_QUERY);
    expect(scryfallQueries).toEqual([]);
    expect(descriptions).toEqual(["créatures qui font piocher"]);

    await query.fill(EDITED_QUERY);
    await page.getByRole("button", { name: "Search this query" }).click();
    await expect(page.getByRole("button", { name: "Add Brainstorm to deck" })).toBeVisible();
    expect(scryfallQueries).toEqual([EDITED_QUERY]);
    expect(cardPosts).toEqual([]);

    await page.getByRole("button", { name: "Back to syntax search" }).click();
    await expect(page.getByTestId("search-input")).toBeVisible();
    await expect(page.getByRole("button", { name: "Add Brainstorm to deck" })).toBeVisible();
  });
});
