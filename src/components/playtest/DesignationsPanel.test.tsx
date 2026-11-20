/**
 * Sociable tests of the designations panel as the player uses it: the real playtest modal, the
 * real store and engine, a real keyboard and pointer, and the real message catalogues.
 *
 * Rules: CR 104.3d and 704.5c (ten poison counters lose the game), CR 725.3 and 726.3 (the
 * monarch and the initiative), CR 701.54a (the Ring), CR 731.1 (day and night), CR 702.131c
 * (the city's blessing).
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

function makeDeck(): Deck {
  return aDeck({
    name: "Infect",
    format: "modern",
    cards: Array.from({ length: 60 }, (_, i) => makeCard(`c${i}`, `Card ${i}`)),
  });
}

/** Opens the playtest and deals the opening hand, as the player does first. */
async function startPlaytest(locale: TestLocale = "en") {
  const user = userEvent.setup();
  renderWithProviders(<PlaytestModal deck={makeDeck()} onClose={() => {}} />, {
    locale,
  });
  await user.click(
    screen.getByRole("button", {
      name: /draw opening hand|piocher la main de départ/i,
    })
  );
  return user;
}

const panel = () =>
  within(
    screen.getByRole("region", { name: "Player counters and designations" })
  );

describe("DesignationsPanel", () => {
  beforeEach(() => {
    usePlaytestStore.setState({ engine: null, isActive: false, setup: null });
  });

  it("marks the loss at ten poison counters, not at nine (CR 104.3d, 704.5c)", async () => {
    const user = await startPlaytest();
    const addPoison = panel().getByRole("button", {
      name: "Add one poison counter",
    });

    await user.pointer(
      Array.from({ length: 9 }, () => ({
        keys: "[MouseLeft]",
        target: addPoison,
      }))
    );
    expect(panel().getByText("Poison: 9")).toBeVisible();
    expect(panel().queryByText(/Lost to poison/)).toBeNull();

    await user.click(addPoison);

    expect(panel().getByText("Poison: 10")).toBeVisible();
    expect(
      panel().getByText("Lost to poison (CR 104.3d, CR 704.5c)")
    ).toBeVisible();
  });

  it("counts energy up and down from the keyboard, never below zero, and undo restores it", async () => {
    const user = await startPlaytest();
    const remove = panel().getByRole("button", {
      name: "Remove one energy counter",
    });
    expect(remove).toBeDisabled();

    panel().getByRole("button", { name: "Add one energy counter" }).focus();
    await user.keyboard("{Enter}");
    await user.keyboard(" ");
    expect(panel().getByText("Energy: 2")).toBeVisible();

    remove.focus();
    await user.keyboard("{Enter}");
    expect(panel().getByText("Energy: 1")).toBeVisible();

    await user.click(screen.getByRole("button", { name: /undo last action/i }));
    expect(panel().getByText("Energy: 2")).toBeVisible();
  });

  it("writes each designation as words as the player sets it", async () => {
    const user = await startPlaytest();
    expect(panel().getByText("You are not the monarch")).toBeVisible();
    expect(panel().getByText("Neither day nor night")).toBeVisible();

    await user.click(
      panel().getByRole("button", { name: "Become the monarch" })
    );
    await user.click(
      panel().getByRole("button", { name: "Take the initiative" })
    );
    await user.click(
      panel().getByRole("button", { name: "The Ring tempts you" })
    );
    await user.click(
      panel().getByRole("button", { name: "The Ring tempts you" })
    );
    await user.click(panel().getByRole("button", { name: "It becomes day" }));
    await user.click(
      panel().getByRole("button", { name: "Get the city's blessing" })
    );

    expect(panel().getByText("You are the monarch")).toBeVisible();
    expect(panel().getByText("You have the initiative")).toBeVisible();
    expect(panel().getByText("The Ring has tempted you 2 times")).toBeVisible();
    expect(panel().getByText("It is day")).toBeVisible();
    expect(
      panel().getByRole("button", { name: "It becomes day" })
    ).toBeDisabled();
    expect(panel().getByText("You have the city's blessing")).toBeVisible();
    expect(
      panel().getByRole("button", { name: "Get the city's blessing" })
    ).toBeDisabled();

    await user.click(
      panel().getByRole("button", { name: "An opponent becomes the monarch" })
    );
    await user.click(panel().getByRole("button", { name: "It becomes night" }));

    expect(panel().getByText("You are not the monarch")).toBeVisible();
    expect(panel().getByText("It is night")).toBeVisible();
  });

  it("speaks French", async () => {
    const user = await startPlaytest("fr");
    const frenchPanel = within(
      screen.getByRole("region", { name: "Marqueurs et désignations" })
    );

    await user.click(
      frenchPanel.getByRole("button", { name: "Ajouter un marqueur poison" })
    );

    expect(frenchPanel.getByText("Poison : 1")).toBeVisible();
    expect(frenchPanel.getByText("Ni jour ni nuit")).toBeVisible();
    expect(
      frenchPanel.getByRole("button", { name: "Devenir le monarque" })
    ).toBeVisible();
  });
});
