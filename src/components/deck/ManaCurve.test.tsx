/**
 * Sociable tests of the mana curve in the statistics column: the permanents and spells of each
 * bar, the median and total in its header, and the list of a mana value's cards (I-37 10.2, 10.3).
 * They render the real chart with the real catalogs, the real breakdown module and the curve
 * `computeDeckStats` builds, so a bar's figure is the one the app shows.
 */
import { describe, expect, it } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/render";
import { aDeck } from "@/test/builders/deck";
import { aDeckCard } from "@/test/builders/card";
import { computeDeckStats } from "@/lib/deck/stats";
import type { DeckCard } from "@/lib/deck/types";
import { ManaCurve } from "./ManaCurve";

const creature = (id: string, cmc: number): DeckCard =>
  aDeckCard({
    id,
    name: id,
    cmc,
    typeLine: "Creature — Elf",
    category: "creature",
  });

const instant = (id: string, cmc: number): DeckCard =>
  aDeckCard({ id, name: id, cmc, typeLine: "Instant", category: "removal" });

const forests = (quantity: number): DeckCard =>
  aDeckCard({
    id: "forest",
    name: "Forest",
    typeLine: "Basic Land — Forest",
    category: "land",
    quantity,
  });

/** Eternal Witness, Phyrexian Arena, Kolaghan's Command and Coalition Relic at 3; a sideboard card at 3. */
const threeDrops: readonly DeckCard[] = [
  aDeckCard({
    id: "witness",
    name: "Eternal Witness",
    cmc: 3,
    manaCost: "{1}{G}{G}",
    typeLine: "Creature — Human Shaman",
    category: "creature",
  }),
  aDeckCard({
    id: "arena",
    name: "Phyrexian Arena",
    cmc: 3,
    manaCost: "{1}{B}{B}",
    typeLine: "Enchantment",
    category: "draw",
  }),
  aDeckCard({
    id: "command",
    name: "Kolaghan's Command",
    cmc: 3,
    manaCost: "{1}{B}{R}",
    typeLine: "Instant",
    category: "removal",
  }),
  aDeckCard({
    id: "relic",
    name: "Coalition Relic",
    cmc: 3,
    manaCost: "{3}",
    typeLine: "Artifact",
    category: "ramp",
    quantity: 2,
  }),
  aDeckCard({
    id: "anger",
    name: "Anger of the Gods",
    cmc: 3,
    manaCost: "{1}{R}{R}",
    typeLine: "Sorcery",
    category: "boardWipe",
    zone: "sideboard",
  }),
  aDeckCard({
    id: "signet",
    name: "Arcane Signet",
    cmc: 2,
    manaCost: "{2}",
    typeLine: "Artifact",
    category: "ramp",
  }),
];

/** Renders the chart as the statistics column does: the stats' curve, and the deck's cards. */
function renderCurve(cards: readonly DeckCard[]) {
  const curve = computeDeckStats(aDeck({ cards: [...cards] })).manaCurve;
  renderWithProviders(<ManaCurve curve={curve} cards={cards} />);
  return { curve, user: userEvent.setup() };
}

describe("ManaCurve", () => {
  it("names the 3 bar of a deck with two creatures and one instant at 3 by both parts", () => {
    const cards = [
      creature("Elf A", 3),
      creature("Elf B", 3),
      instant("Bolt", 3),
    ];

    renderWithProviders(<ManaCurve curve={{ 3: 3 }} cards={cards} />);

    expect(
      screen.getByRole("button", {
        name: "Mana value 3: 2 permanents, 1 spell",
      })
    ).toBeInTheDocument();
  });

  it("names both parts in words in a legend", () => {
    renderCurve([creature("Elf", 2)]);

    const legend = screen.getByRole("list", { name: "Bar parts" });
    expect(within(legend).getByText("Permanents")).toBeInTheDocument();
    expect(within(legend).getByText("Spells")).toBeInTheDocument();
  });

  it("shows the median without and with lands, and the total mana value, in its header", () => {
    renderCurve([
      creature("Bear", 2),
      instant("Opt", 3),
      creature("Wurm", 4),
      forests(2),
    ]);

    expect(screen.getByText("Median 3, or 2 with lands")).toBeInTheDocument();
    expect(screen.getByText("Total mana value 9")).toBeInTheDocument();
  });

  it("shows an even count's median with one decimal, in the reader's locale", () => {
    const cards = [creature("Bear", 2), instant("Opt", 3)];
    const curve = computeDeckStats(aDeck({ cards })).manaCurve;

    renderWithProviders(<ManaCurve curve={curve} cards={cards} />, {
      locale: "fr",
    });

    expect(
      screen.getByText("Médiane 2,5, ou 2,5 avec les terrains")
    ).toBeInTheDocument();
  });

  it("shows no median and a total of 0 for a deck with no nonland card", () => {
    renderCurve([forests(36)]);

    expect(screen.getByText("Median —, or — with lands")).toBeInTheDocument();
    expect(screen.getByText("Total mana value 0")).toBeInTheDocument();
  });

  it("lists a mana value's cards when its bar is activated, as many as the bar's figure", async () => {
    const { curve, user } = renderCurve(threeDrops);

    await user.click(
      screen.getByRole("button", {
        name: "Mana value 3: 4 permanents, 1 spell",
      })
    );

    const region = screen.getByRole("region", {
      name: `Mana value 3 · ${curve[3]} cards`,
    });
    expect(curve[3]).toBe(5);
    const rows = within(region).getAllByRole("listitem");
    expect(rows.map((row) => row.textContent)).toEqual([
      "2×Coalition RelicArtifact",
      "1×Eternal WitnessCreature — Human Shaman",
      "1×Kolaghan's CommandInstant",
      "1×Phyrexian ArenaEnchantment",
      // WUBRG, then colourless; Kolaghan's Command counts in black and in red.
      "Black: 2",
      "Red: 1",
      "Green: 1",
      "Colorless: 2",
    ]);
    expect(
      within(region).getByText("4 permanents · 1 spell")
    ).toBeInTheDocument();
  });

  it("marks the open bar as pressed, and switches to another bar when that one is activated", async () => {
    const { user } = renderCurve(threeDrops);
    const three = screen.getByRole("button", { name: /^Mana value 3:/ });
    const two = screen.getByRole("button", { name: /^Mana value 2:/ });

    await user.click(three);
    expect(three).toHaveAttribute("aria-pressed", "true");

    await user.click(two);
    expect(three).toHaveAttribute("aria-pressed", "false");
    expect(two).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("region", { name: "Mana value 2 · 1 card" })
    ).toBeInTheDocument();
  });

  it("closes the list when the open bar is activated again", async () => {
    const { user } = renderCurve(threeDrops);
    const three = screen.getByRole("button", { name: /^Mana value 3:/ });

    await user.click(three);
    await user.click(three);

    expect(screen.queryByRole("region")).not.toBeInTheDocument();
    expect(three).toHaveAttribute("aria-pressed", "false");
  });

  it("opens a bar with Enter and closes its list with Escape", async () => {
    const { user } = renderCurve(threeDrops);
    screen.getByRole("button", { name: /^Mana value 3:/ }).focus();

    await user.keyboard("{Enter}");
    expect(
      screen.getByRole("region", { name: /^Mana value 3/ })
    ).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });

  it("cannot open an empty bar", () => {
    renderCurve(threeDrops);

    expect(
      screen.getByRole("button", {
        name: "Mana value 5: 0 permanents, 0 spells",
      })
    ).toBeDisabled();
  });

  it("closes the list when a deck edit empties the open bar", async () => {
    const user = userEvent.setup();
    const before = [creature("Elf", 3), creature("Bear", 2)];
    const after = [creature("Bear", 2)];
    const { rerender } = renderWithProviders(
      <ManaCurve curve={{ 2: 1, 3: 1 }} cards={before} />
    );
    await user.click(screen.getByRole("button", { name: /^Mana value 3:/ }));

    rerender(<ManaCurve curve={{ 2: 1 }} cards={after} />);

    expect(screen.queryByRole("region")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^Mana value 3:/ })
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("lists every card at 7 or more under the 7+ bar, with each card's mana value", async () => {
    const { user } = renderCurve([
      creature("Craterhoof Behemoth", 8),
      creature("Emrakul, the Aeons Torn", 15),
      instant("Expropriate", 9),
    ]);

    await user.click(
      screen.getByRole("button", {
        name: "Mana value 7+: 2 permanents, 1 spell",
      })
    );

    const region = screen.getByRole("region", {
      name: "Mana value 7+ · 3 cards",
    });
    expect(within(region).getByText("MV 8")).toBeInTheDocument();
    expect(within(region).getByText("MV 15")).toBeInTheDocument();
    expect(within(region).getByText("MV 9")).toBeInTheDocument();
  });

  it("draws plain bars that open nothing when it is given no cards", () => {
    renderWithProviders(<ManaCurve curve={{ 3: 2 }} />);

    const bar = screen.getByRole("button", { name: "2 cards at CMC 3" });
    expect(bar).not.toHaveAttribute("aria-pressed");
    expect(
      screen.queryByRole("list", { name: "Bar parts" })
    ).not.toBeInTheDocument();
  });
});
