import { afterEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Session } from "next-auth";
import { renderWithProviders, type TestLocale } from "@/test/render";
import { aDeck } from "@/test/builders/deck";
import { aDeckCard } from "@/test/builders/card";
import type { Deck, DeckCard } from "@/lib/deck/types";
import { DrawOddsPanel } from "./DrawOddsPanel";

/** One row of basic Forests, the deck's lands. */
function forests(quantity: number): DeckCard {
  return aDeckCard({
    id: "forest",
    name: "Forest",
    category: "land",
    typeLine: "Basic Land — Forest",
    quantity,
  });
}

/** Distinct one-copy creatures, the non-land part of a singleton deck. */
function spells(count: number): DeckCard[] {
  return Array.from({ length: count }, (_, index) =>
    aDeckCard({
      id: `spell-${index}`,
      name: `Spell ${index}`,
      category: "creature",
      typeLine: "Creature — Elf",
    })
  );
}

/**
 * A Commander deck whose library is 99 cards with 36 lands: I-97's definition
 * of done. The commander sits in the command zone, outside `cards` (CR 903.6).
 */
function commanderDeck(extra: readonly DeckCard[] = []): Deck {
  return aDeck({
    commander: aDeckCard({ id: "commander", name: "Omnath, Locus of Mana" }),
    cards: [forests(36), ...spells(63), ...extra],
  });
}

/**
 * Mounts the panel. Without a `session`, no Auth.js provider is mounted, so a
 * panel that read the session would throw: that is how a guest render proves
 * the panel reads none.
 */
function renderPanel(
  deck: Deck,
  locale: TestLocale = "en",
  session?: Session | null
) {
  return renderWithProviders(<DrawOddsPanel deck={deck} />, {
    locale,
    session,
  });
}

/** The panel, found by its accessible name. */
function panel(name = "Draw Odds"): HTMLElement {
  return screen.getByRole("region", { name });
}

/** The value shown beside an input of the formula, by the input's label. */
function inputValue(label: string): string | null {
  return within(panel())
    .getByText(label, { selector: "dt" })
    .nextElementSibling?.textContent ?? null;
}

/** The answer the panel announces. */
function answer(): HTMLElement {
  return within(panel()).getByRole("status");
}

/** The "At least" field. */
function minimumField(): HTMLElement {
  return within(panel()).getByRole("spinbutton", { name: "At least" });
}

/** Replaces the "At least" field's text with what the player types. */
async function typeMinimum(
  user: ReturnType<typeof userEvent.setup>,
  text: string
): Promise<void> {
  await user.clear(minimumField());
  await user.type(minimumField(), text);
}

/**
 * The answer is a sentence, not a figure: no percentage, and nothing a broken
 * computation prints in place of one.
 */
function expectNoFigure(): void {
  for (const leak of ["%", "NaN", "Infinity", "Error"]) {
    expect(answer()).not.toHaveTextContent(leak);
  }
}

/** A deck with main-deck cards but no land: 60 distinct creatures. */
function landlessDeck(): Deck {
  return aDeck({ format: "modern", cards: spells(60) });
}

describe("DrawOddsPanel", () => {
  it("shows the chance of three or more lands in the opening seven of a 99-card library with 36 lands, with its inputs", () => {
    renderPanel(commanderDeck());

    // 26,736,733 / 53,358,536 ≈ 0.50108 (I-97's committed fraction).
    expect(within(panel()).getByRole("status")).toHaveTextContent("50.1%");
    expect(inputValue("Cards in the library")).toBe("99");
    expect(inputValue("Matching cards")).toBe("36");
    expect(inputValue("Cards drawn")).toBe("7");
    expect(inputValue("At least")).toBe("3");
    expect(
      within(panel()).getByText(
        "This is a count of equally likely hands, not a recorded game."
      )
    ).toBeVisible();
  });

  it("recounts the chance when the player asks for at least four lands", async () => {
    const user = userEvent.setup();
    renderPanel(commanderDeck());

    const minimum = within(panel()).getByRole("spinbutton", {
      name: "At least",
    });
    await user.clear(minimum);
    await user.type(minimum, "4");

    // 1,044,803 / 4,850,776 ≈ 0.21539
    expect(within(panel()).getByRole("status")).toHaveTextContent("21.5%");
    expect(inputValue("At least")).toBe("4");
  });

  it("counts a chosen card's copies in the library and asks for at least one", async () => {
    const user = userEvent.setup();
    renderPanel(
      aDeck({
        commander: aDeckCard({ id: "commander", name: "Omnath, Locus of Mana" }),
        cards: [forests(36), ...spells(62), aDeckCard({ id: "sol", name: "Sol Ring" })],
      })
    );

    await user.selectOptions(
      within(panel()).getByRole("combobox", { name: "Looking for" }),
      "Sol Ring"
    );

    // One copy among 99 cards, seven drawn: 7 / 99 ≈ 0.07071
    expect(within(panel()).getByRole("status")).toHaveTextContent("7.1%");
    expect(inputValue("Cards in the library")).toBe("99");
    expect(inputValue("Matching cards")).toBe("1");
    expect(inputValue("At least")).toBe("1");
  });

  it("counts the opening seven and one draw per turn, turn 1 included, by turn 3 at a Commander table", async () => {
    const user = userEvent.setup();
    renderPanel(commanderDeck());

    await user.selectOptions(
      within(panel()).getByRole("combobox", { name: "When" }),
      "Turn 3"
    );

    // Ten cards drawn (CR 103.8c): 327,687,835 / 419,847,428 ≈ 0.78049
    expect(within(panel()).getByRole("status")).toHaveTextContent("78.0%");
    expect(inputValue("Cards drawn")).toBe("10");
    expect(
      within(panel()).getByText(
        "Each turn adds one draw, turn 1 included, as at a multiplayer table."
      )
    ).toBeVisible();
  });

  it("skips the turn-1 draw by turn 3 for a Modern deck, played two-player, and says so", async () => {
    const user = userEvent.setup();
    renderPanel(
      aDeck({
        format: "modern",
        cards: [forests(24), ...spells(36)],
      })
    );

    await user.selectOptions(
      within(panel()).getByRole("combobox", { name: "When" }),
      "Turn 3"
    );

    // Nine cards drawn (CR 103.8a): 52,994,507 / 67,196,103 ≈ 0.78865
    expect(within(panel()).getByRole("status")).toHaveTextContent("78.9%");
    expect(inputValue("Cards in the library")).toBe("60");
    expect(inputValue("Cards drawn")).toBe("9");
    expect(
      within(panel()).getByText(
        "Each turn after the first adds one draw, as for the player who starts a two-player game."
      )
    ).toBeVisible();
  });

  it("says the main deck needs cards, instead of showing a zero, when the library is empty", () => {
    renderPanel(
      aDeck({
        commander: aDeckCard({ id: "commander", name: "Omnath, Locus of Mana" }),
        cards: [{ ...forests(36), zone: "maybeboard" }],
      })
    );

    const status = within(panel()).getByRole("status");
    expect(status).toHaveTextContent(
      "Add cards to the main deck to see the odds."
    );
    expect(status).not.toHaveTextContent("%");
  });

  it("asks for a whole number, instead of showing a zero, when the minimum is left blank", async () => {
    const user = userEvent.setup();
    renderPanel(commanderDeck());

    await user.clear(
      within(panel()).getByRole("spinbutton", { name: "At least" })
    );

    const status = within(panel()).getByRole("status");
    expect(status).toHaveTextContent(
      "Enter a whole number of cards, 0 or more."
    );
    expect(status).not.toHaveTextContent("%");
    expect(inputValue("At least")).toBe("not set");
  });

  it("says the library is too short, instead of showing a figure, when a turn draws more cards than it holds", async () => {
    const user = userEvent.setup();
    renderPanel(aDeck({ cards: [forests(4), ...spells(5)] }));

    await user.selectOptions(
      within(panel()).getByRole("combobox", { name: "When" }),
      "Turn 3"
    );

    const status = within(panel()).getByRole("status");
    expect(status).toHaveTextContent(
      "The library holds fewer cards than this draw."
    );
    expect(status).not.toHaveTextContent("%");
    expect(inputValue("Cards in the library")).toBe("9");
    expect(inputValue("Cards drawn")).toBe("10");
  });

  it("goes back to the lands when the chosen card leaves the library", async () => {
    const user = userEvent.setup();
    const solRing = aDeckCard({ id: "sol", name: "Sol Ring" });
    const { rerender } = renderPanel(commanderDeck([solRing]));
    const target = within(panel()).getByRole("combobox", {
      name: "Looking for",
    });
    await user.selectOptions(target, "Sol Ring");

    rerender(
      <DrawOddsPanel deck={commanderDeck([{ ...solRing, zone: "maybeboard" }])} />
    );

    expect(target).toHaveDisplayValue("Lands");
    expect(inputValue("Matching cards")).toBe("36");
  });

  it("shows the same digits when the same deck is opened again", () => {
    const first = renderPanel(commanderDeck());
    const firstFigure = within(panel()).getByRole("status").textContent;
    first.unmount();

    renderPanel(commanderDeck());

    expect(within(panel()).getByRole("status").textContent).toBe(firstFigure);
  });

  it("speaks French, with a French percentage, in the French locale", () => {
    renderPanel(commanderDeck(), "fr");

    const french = panel("Probabilités de pioche");
    // Intl writes the French percent sign after a narrow no-break space.
    expect(within(french).getByRole("status").textContent).toMatch(
      /^50,1\s%$/u
    );
    expect(
      within(french).getByRole("combobox", { name: "Chercher" })
    ).toHaveDisplayValue("Terrains");
    expect(
      within(french).getByRole("combobox", { name: "Quand" })
    ).toHaveDisplayValue("Main de départ");
    expect(
      within(french).getByRole("spinbutton", { name: "Au moins" })
    ).toHaveValue(3);
    expect(
      within(french).getByText(
        "C’est un dénombrement de mains également probables, pas une partie enregistrée."
      )
    ).toBeVisible();
  });
});

describe("DrawOddsPanel, when the question cannot be answered (AC-97-04)", () => {
  it("says the minimum is more than the cards drawn, instead of 0.0%, when it is above the library size", async () => {
    const user = userEvent.setup();
    renderPanel(commanderDeck());

    await typeMinimum(user, "100");

    expect(answer()).toHaveTextContent(
      "At least 100 is more than the 7 cards drawn."
    );
    expectNoFigure();
    expect(inputValue("At least")).toBe("100");
  });

  it("says the minimum is more than the cards drawn, instead of 0.0%, when the library holds enough but the hand does not", async () => {
    const user = userEvent.setup();
    renderPanel(commanderDeck());

    await typeMinimum(user, "8");

    expect(answer()).toHaveTextContent(
      "At least 8 is more than the 7 cards drawn."
    );
    expectNoFigure();
  });

  it("counts a minimum of 0 as certain, a known 100.0%, since every hand holds at least zero", async () => {
    const user = userEvent.setup();
    renderPanel(commanderDeck());

    await typeMinimum(user, "0");

    expect(answer()).toHaveTextContent("100.0%");
    expect(inputValue("At least")).toBe("0");
  });

  it.each([
    { typed: "2.5", what: "a fraction" },
    { typed: "-1", what: "a negative count" },
  ])(
    "asks for a whole number, instead of a figure, when the minimum is $what",
    async ({ typed }) => {
      const user = userEvent.setup();
      renderPanel(commanderDeck());

      await typeMinimum(user, typed);

      expect(answer()).toHaveTextContent(
        "Enter a whole number of cards, 0 or more."
      );
      expectNoFigure();
    }
  );

  it("asks for a whole number, and shows no NaN, when the player types letters into the minimum", async () => {
    const user = userEvent.setup();
    renderPanel(commanderDeck());

    await typeMinimum(user, "abc");

    expect(answer()).toHaveTextContent(
      "Enter a whole number of cards, 0 or more."
    );
    expectNoFigure();
    expect(inputValue("At least")).toBe("not set");
  });

  it("brings the chance back when the player corrects the minimum", async () => {
    const user = userEvent.setup();
    renderPanel(commanderDeck());
    await typeMinimum(user, "100");

    await typeMinimum(user, "3");

    expect(answer()).toHaveTextContent("50.1%");
  });

  it("brings the chance back when the player picks a draw the library can cover after one it cannot", async () => {
    const user = userEvent.setup();
    renderPanel(aDeck({ cards: [forests(4), ...spells(5)] }));
    const when = within(panel()).getByRole("combobox", { name: "When" });
    await user.selectOptions(when, "Turn 3");

    await user.selectOptions(when, "Opening hand");

    // Three or more of 4 lands in 7 of 9 cards:
    // (C(4,3)·C(5,4) + C(4,4)·C(5,3)) / C(9,7) = (20 + 10) / 36 ≈ 0.83333
    expect(answer()).toHaveTextContent("83.3%");
  });

  it("keeps the minimum field's name and focus while the answer turns into a sentence and back", async () => {
    const user = userEvent.setup();
    renderPanel(commanderDeck());

    await typeMinimum(user, "100");
    expect(minimumField()).toHaveFocus();

    await typeMinimum(user, "3");
    expect(minimumField()).toHaveFocus();
    expect(minimumField()).toHaveAccessibleName("At least");
  });

  it("says the minimum is more than the cards drawn in French", async () => {
    const user = userEvent.setup();
    renderPanel(commanderDeck(), "fr");
    const french = panel("Probabilités de pioche");
    const minimum = within(french).getByRole("spinbutton", {
      name: "Au moins",
    });

    await user.clear(minimum);
    await user.type(minimum, "8");

    expect(within(french).getByRole("status")).toHaveTextContent(
      "Au moins 8, c’est plus que les 7 cartes piochées."
    );
  });
});

describe("DrawOddsPanel, when the deck holds nothing to count (AC-97-05)", () => {
  it("says the main deck needs cards, instead of 0%, for a deck with no card at all", () => {
    renderPanel(aDeck({ cards: [] }));

    expect(answer()).toHaveTextContent(
      "Add cards to the main deck to see the odds."
    );
    expectNoFigure();
  });

  it("says the main deck needs cards when its only cards sit in the Sideboard and Considering, which are not in the library", () => {
    renderPanel(
      aDeck({
        cards: [
          { ...forests(10), zone: "sideboard" },
          aDeckCard({ id: "sol", name: "Sol Ring", zone: "maybeboard" }),
        ],
      })
    );

    expect(answer()).toHaveTextContent(
      "Add cards to the main deck to see the odds."
    );
    expectNoFigure();
    expect(inputValue("Cards in the library")).toBe("0");
  });

  it("says no land is counted, instead of claiming 0.0%, when the lands question meets a deck without lands", () => {
    renderPanel(landlessDeck());

    expect(answer()).toHaveTextContent("No land is counted in the main deck.");
    expectNoFigure();
    expect(inputValue("Matching cards")).toBe("0");
  });

  it("still answers a chosen card's question in a deck without lands", async () => {
    const user = userEvent.setup();
    renderPanel(landlessDeck());

    await user.selectOptions(
      within(panel()).getByRole("combobox", { name: "Looking for" }),
      "Spell 0"
    );

    // One copy among 60 cards, seven drawn: 7 / 60 ≈ 0.11667
    expect(answer()).toHaveTextContent("11.7%");
  });

  it("says no land is counted in French", () => {
    renderPanel(landlessDeck(), "fr");

    expect(
      within(panel("Probabilités de pioche")).getByRole("status")
    ).toHaveTextContent("Aucun terrain n’est compté dans le deck principal.");
  });
});

describe("DrawOddsPanel, for a guest and a signed-in player (AC-97-06)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  /** The answer and the four inputs of the formula, as the player reads them. */
  function shownOdds(): readonly (string | null)[] {
    return [
      answer().textContent,
      inputValue("Cards in the library"),
      inputValue("Matching cards"),
      inputValue("Cards drawn"),
      inputValue("At least"),
    ];
  }

  it("shows a guest deck the same digits as a signed-in deck with the same cards, without a request or a session", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    // No session: no Auth.js provider is mounted, so reading one would throw.
    const guest = renderPanel({ ...commanderDeck(), id: "guest" });
    const guestOdds = shownOdds();
    guest.unmount();

    renderPanel(commanderDeck(), "en", {
      user: { id: "player-1", name: "Kael" },
      expires: "2099-01-01T00:00:00.000Z",
    });

    expect(shownOdds()).toEqual(guestOdds);
    expect(guestOdds).toEqual(["50.1%", "99", "36", "7", "3"]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
