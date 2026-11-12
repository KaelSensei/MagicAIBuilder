/**
 * The collection page and the search filter it feeds, for a signed-in player.
 *
 * Signed in, because the page's quantity controls and the "Only cards I own"
 * search filter read the client session: without one the filter reports a
 * guest and searches nothing. The collection is one per account, so every row
 * a test adds is booked with `seededCollection` and deleted afterwards.
 *
 * Every control is found by role and accessible name. The card is a real one,
 * so the "Add Card" dialog can find it on Scryfall.
 *
 * @module e2e/collection.authed
 */
import { test, expect } from "./fixtures";
import type { Page } from "@playwright/test";
import { fixtureCards, openDeckInListView, type DeckSeed } from "./helpers";

const OWNED_PRINTING_ID = "00000000-0000-4000-8000-000000000601";

const COLLECTION_DECK: DeckSeed = {
  name: "Collection Search Deck",
  cards: fixtureCards(1),
};

/** The quantity field of a collection row, named after its card. */
function quantityOf(page: Page, name: string) {
  return page.getByRole("spinbutton", { name: `Quantity owned for ${name}` });
}

/** The next PATCH on a collection row: a quantity change. */
function quantitySave(page: Page) {
  return page.waitForResponse(
    (response) =>
      response.request().method() === "PATCH" &&
      response.url().includes("/api/collection/")
  );
}

test.describe("Collection page (signed in)", () => {
  test("adds a card from the dialog, then steps its quantity up and down, and the number stays", async ({
    page,
    seededCollection,
  }) => {
    // Booked before the add, so a failure midway still leaves a clean collection.
    seededCollection.adoptName("Grizzly Bears");

    await page.goto("/collection");
    await expect(
      page.getByRole("heading", { name: "My Collection" })
    ).toBeVisible();

    await page.getByRole("button", { name: "Add Card", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Add to Collection" });
    await dialog
      .getByRole("textbox", { name: "Search for a card…" })
      .fill("Grizzly Bears");
    await dialog
      .getByRole("button", { name: /^Grizzly Bears/ })
      .first()
      .click();
    const added = page.waitForResponse(
      (response) =>
        response.request().method() === "POST" &&
        response.url().endsWith("/api/collection")
    );
    await dialog.getByRole("button", { name: "Add to Collection" }).click();
    expect((await added).ok()).toBe(true);
    await expect(dialog.getByRole("button", { name: "Added!" })).toBeVisible();
    await dialog.getByRole("button", { name: "Cancel" }).click();

    const quantity = quantityOf(page, "Grizzly Bears");
    await expect(quantity).toHaveValue("1");

    // #1348: the saved quantity used to flash and fall back to the old one.
    const increased = quantitySave(page);
    await page
      .getByRole("button", { name: "Increase Grizzly Bears quantity" })
      .click();
    expect((await increased).ok()).toBe(true);
    await expect(quantity).toHaveValue("2");
    await page.reload();
    await expect(quantityOf(page, "Grizzly Bears")).toHaveValue("2");

    const decreased = quantitySave(page);
    await page
      .getByRole("button", { name: "Decrease Grizzly Bears quantity" })
      .click();
    expect((await decreased).ok()).toBe(true);
    await expect(quantityOf(page, "Grizzly Bears")).toHaveValue("1");
  });

  test("removes a row and shows the empty collection", async ({
    page,
    seededCollection,
  }) => {
    await seededCollection.add({
      scryfallId: OWNED_PRINTING_ID,
      name: "Grizzly Bears",
    });

    await page.goto("/collection");
    await expect(quantityOf(page, "Grizzly Bears")).toHaveValue("1");

    const removed = page.waitForResponse(
      (response) =>
        response.request().method() === "DELETE" &&
        response.url().includes("/api/collection/")
    );
    await page.getByRole("button", { name: "Remove from collection" }).click();
    expect((await removed).ok()).toBe(true);
    await expect(quantityOf(page, "Grizzly Bears")).toHaveCount(0);
    await expect(page.getByText("Your collection is empty.")).toBeVisible();
  });

  test("the Collection only search lists owned cards and says when none match", async ({
    page,
    seededCollection,
    seededDeck,
  }) => {
    await seededCollection.add({
      scryfallId: OWNED_PRINTING_ID,
      name: "Grizzly Bears",
    });
    const deckId = await seededDeck.create(COLLECTION_DECK);
    await openDeckInListView(page, deckId);

    await page.getByRole("button", { name: "Show filters" }).click();
    const ownedOnly = page.getByRole("button", { name: "Only cards I own" });
    await ownedOnly.click();
    await expect(ownedOnly).toHaveAttribute("aria-pressed", "true");

    await page.getByTestId("search-input").fill("Grizzly Bears");
    await expect(page.getByText("1 card you own")).toBeVisible();
    await expect(page.getByAltText(/^Grizzly Bears$/i).first()).toBeVisible();

    await page.getByTestId("search-input").fill("Sol Ring");
    await expect(
      page.getByText("None of the cards you own match this search.")
    ).toBeVisible();
  });
});
