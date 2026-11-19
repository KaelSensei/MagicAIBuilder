/**
 * Sociable tests of the commander-damage tally as the player uses it: the real playtest modal,
 * the real store and engine, a real keyboard and pointer, and the real message catalogues.
 *
 * Rules: CR 903.10a and 704.6c (the loss at 21 from one commander), CR 903.12h (not in Brawl).
 */
import { beforeEach, describe, expect, it } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Deck, DeckCard } from "@/lib/deck/types";
import { usePlaytestStore } from "@/lib/playtest/store";
import { aDeckCard } from "@/test/builders/card";
import { aDeck } from "@/test/builders/deck";
import { renderWithProviders, type TestLocale } from "@/test/render";
import { PlaytestModal } from "./PlaytestModal";

function makeCard(id: string, name: string): DeckCard {
  return aDeckCard({
    id,
    scryfallId: id,
    name,
    category: "creature",
    cmc: 1,
    typeLine: "Creature",
  });
}

function makeDeck(format: Deck["format"] = "commander"): Deck {
  return aDeck({
    name: "Kenrith Voltron",
    format,
    commander: makeCard("kenrith", "Kenrith"),
    cards: Array.from({ length: 40 }, (_, i) => makeCard(`c${i}`, `Card ${i}`)),
  });
}

/** Opens the playtest and deals the opening hand, as the player does first. */
async function startPlaytest(deck: Deck, locale: TestLocale = "en") {
  const user = userEvent.setup();
  renderWithProviders(<PlaytestModal deck={deck} onClose={() => {}} />, {
    locale,
  });
  await user.click(
    screen.getByRole("button", {
      name: /draw opening hand|piocher la main de départ/i,
    })
  );
  return user;
}

const opponent = (number: number) =>
  within(screen.getByRole("group", { name: `Opponent ${number}` }));

describe("CommanderDamageTally", () => {
  beforeEach(() => {
    usePlaytestStore.setState({ engine: null, isActive: false, setup: null });
  });

  it("marks Opponent 1 as lost after three hits of 7 from the commander (CR 903.10a, 704.6c)", async () => {
    const user = await startPlaytest(makeDeck());
    const record = screen.getByRole("button", {
      name: "Record damage from Kenrith to Opponent 1",
    });

    await user.type(screen.getByLabelText("Combat damage"), "7");
    await user.click(record);
    await user.click(record);
    await user.click(record);

    expect(opponent(1).getByText("21 from Kenrith")).toBeVisible();
    expect(
      opponent(1).getByText("Lost to commander damage (CR 903.10a, CR 704.6c)")
    ).toBeVisible();
    expect(opponent(2).getByText("0 from Kenrith")).toBeVisible();
    expect(screen.getByText("40")).toBeVisible();
  });

  it("records from the keyboard alone, and undo restores the previous tally", async () => {
    const user = await startPlaytest(makeDeck());
    const record = screen.getByRole("button", {
      name: "Record damage from Kenrith to Opponent 3",
    });

    await user.type(screen.getByLabelText("Combat damage"), "5");
    record.focus();
    await user.keyboard("{Enter}");
    await user.keyboard(" ");
    expect(opponent(3).getByText("10 from Kenrith")).toBeVisible();

    await user.click(screen.getByRole("button", { name: /undo last action/i }));

    expect(opponent(3).getByText("5 from Kenrith")).toBeVisible();
  });

  it.each(["0", "-3", "2.5"])(
    "refuses an amount of %s: the record buttons stay disabled",
    async (amount) => {
      const user = await startPlaytest(makeDeck());
      const field = screen.getByLabelText("Combat damage");
      const record = screen.getByRole("button", {
        name: "Record damage from Kenrith to Opponent 1",
      });
      await user.type(field, "7");
      expect(record).toBeEnabled();

      await user.clear(field);
      await user.type(field, amount);

      expect(record).toBeDisabled();
      expect(opponent(1).getByText("0 from Kenrith")).toBeVisible();
    }
  );

  it("a Brawl playtest shows no tally (CR 903.12h)", async () => {
    await startPlaytest(makeDeck("brawl"));

    expect(screen.getByText("Life total")).toBeVisible();
    expect(
      screen.queryByRole("heading", { name: "Commander damage" })
    ).toBeNull();
  });

  it("speaks French", async () => {
    await startPlaytest(makeDeck(), "fr");

    expect(
      screen.getByRole("heading", { name: "Blessures de commandant" })
    ).toBeVisible();
    expect(
      screen.getByRole("button", {
        name: "Enregistrer les blessures de Kenrith infligées à l’adversaire 1",
      })
    ).toBeVisible();
  });
});
