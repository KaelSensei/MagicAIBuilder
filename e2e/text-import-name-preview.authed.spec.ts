import { expect, test } from "@playwright/test";
import { openBuilder } from "./helpers";

test("pasted-list preview warns about unknown cards before import", async ({ page, request }) => {
  await openBuilder(page);
  const deckId = page.url().split("/").at(-1);
  if (!deckId) throw new Error("Builder did not open a deck");

  await page.route("https://api.scryfall.com/cards/collection", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        object: "list",
        data: [{
          id: "00000000-0000-4000-8000-000000000201",
          name: "Sol Ring",
          cmc: 1,
          type_line: "Artifact",
          color_identity: [],
        }],
        not_found: [{ name: "Definitely Not A Card" }],
      }),
    });
  });

  try {
    await page.getByRole("banner").getByRole("button", { name: "Import" }).click();
    const dialog = page.getByRole("dialog", { name: "Import Decklist" });
    await dialog.getByRole("textbox").fill("1 Sol Ring\n1 Definitely Not A Card");
    await dialog.getByRole("button", { name: "Preview decklist" }).click();

    await expect(dialog.getByRole("alert")).toContainText("Definitely Not A Card");
    const before = await request.get(`/api/decks/${deckId}`);
    expect(before.ok()).toBe(true);
    const beforeDeck: { cards: readonly unknown[] } = await before.json();
    expect(beforeDeck.cards).toHaveLength(0);

    const added = page.waitForResponse((response) =>
      response.request().method() === "POST" &&
      response.url().includes(`/api/decks/${deckId}/cards`)
    );
    await dialog.getByRole("button", { name: "Import this preview" }).click();
    expect((await added).ok()).toBe(true);
    const after = await request.get(`/api/decks/${deckId}`);
    expect(after.ok()).toBe(true);
    const afterDeck: { cards: readonly { name: string }[] } = await after.json();
    expect(afterDeck.cards.map((card) => card.name)).toEqual(["Sol Ring"]);
  } finally {
    await request.delete(`/api/decks/${deckId}`);
  }
});
