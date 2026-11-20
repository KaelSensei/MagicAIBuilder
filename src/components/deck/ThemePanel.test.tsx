/**
 * The builder's Theme panel, driven as a player would (I-102 slice 3).
 *
 * Sociable: the real matcher (`matchTheme`), the real coverage
 * (`themeCoverage`) and the real English and French catalogs run. Nothing is
 * replaced: the panel makes no request and writes no store, which the guest
 * deck test checks by watching `fetch`.
 */
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createGuestDeck } from "@/lib/deck/guest-deck";
import type { CardCategory, Deck, DeckCard } from "@/lib/deck/types";
import { aDeckCard } from "@/test/builders/card";
import { aDeck } from "@/test/builders/deck";
import { renderWithProviders, type TestLocale } from "@/test/render";
import { ThemePanel } from "./ThemePanel";

/** The disclosure's name in English and in French. */
const PANEL_BUTTON = /^th[eè]me$/i;

const SHIVAN_DRAGON = aDeckCard({
  id: "shivan",
  name: "Shivan Dragon",
  typeLine: "Creature — Dragon",
  oracleText: "Flying\n{R}: Shivan Dragon gets +1/+0 until end of turn.",
  category: "creature",
});

const SOL_RING = aDeckCard({
  id: "sol-ring",
  name: "Sol Ring",
  typeLine: "Artifact",
  oracleText: "{T}: Add {C}{C}.",
  category: "ramp",
});

const BOLT = aDeckCard({
  id: "bolt",
  name: "Lightning Bolt",
  typeLine: "Instant",
  oracleText: "Lightning Bolt deals 3 damage to any target.",
  category: "removal",
});

/** Thirty basic Mountains in one row (CR 205.4c: Basic is a supertype). */
const MOUNTAINS = aDeckCard({
  id: "mountain",
  name: "Mountain",
  typeLine: "Basic Land — Mountain",
  category: "land",
  quantity: 30,
});

/** A legendary Human, filed under a category. */
function legendary(
  id: string,
  name: string,
  category: CardCategory = "creature"
): DeckCard {
  return aDeckCard({
    id,
    name,
    typeLine: "Legendary Creature — Human",
    category,
  });
}

/** Opens the panel on a deck, in a locale. */
async function openPanel(deck: Deck, locale: TestLocale = "en") {
  const user = userEvent.setup();
  const view = renderWithProviders(<ThemePanel deck={deck} />, { locale });
  await user.click(screen.getByRole("button", { name: PANEL_BUTTON }));
  return { user, view };
}

/**
 * Everything the panel reads out for a deck under the handle "creature type
 * Dragon"; the panel is unmounted afterwards.
 */
async function coverageText(deck: Deck): Promise<string> {
  const { user, view } = await openPanel(deck);
  await setFirstHandle(user, "Creature type", "Dragon");
  const text = view.container.textContent ?? "";
  view.unmount();
  return text;
}

/** Names handle 1 by its kind and the value the player types. */
async function setFirstHandle(
  user: ReturnType<typeof userEvent.setup>,
  kind: string,
  value: string
) {
  await user.selectOptions(
    screen.getByRole("combobox", { name: "Kind of handle 1" }),
    kind
  );
  await user.type(
    screen.getByRole("textbox", { name: "Value of handle 1" }),
    value
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ThemePanel", () => {
  it("with the handle creature type Dragon, lists Shivan Dragon on theme by its type line and Sol Ring off theme", async () => {
    const { user } = await openPanel(
      aDeck({ cards: [SOL_RING, SHIVAN_DRAGON] })
    );

    await setFirstHandle(user, "Creature type", "Dragon");

    expect(screen.getByText("1 of 2 cards on theme")).toBeInTheDocument();
    const onTheme = screen.getByRole("region", { name: "On theme" });
    const dragons = within(onTheme).getByRole("list", {
      name: "Creature type: Dragon",
    });
    const [shivan] = within(dragons).getAllByRole("listitem");
    expect(shivan).toHaveTextContent("Shivan Dragon");
    expect(shivan).toHaveTextContent("type line: Creature — Dragon");
    const offTheme = screen.getByRole("region", { name: "Off theme" });
    const ramp = within(offTheme).getByRole("list", { name: "Ramp" });
    const [solRing] = within(ramp).getAllByRole("listitem");
    expect(solRing).toHaveTextContent("Sol Ring");
    expect(solRing).toHaveTextContent("no handle matches");
  });

  it("leaves basic lands out of the count until the player counts them", async () => {
    const deck = aDeck({ cards: [SHIVAN_DRAGON, SOL_RING, MOUNTAINS] });
    const { user } = await openPanel(deck);
    await setFirstHandle(user, "Creature type", "Dragon");

    expect(screen.getByText("1 of 2 cards on theme")).toBeInTheDocument();
    expect(screen.queryByText("Mountain")).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("checkbox", { name: "Count basic lands" })
    );

    expect(screen.getByText("1 of 32 cards on theme")).toBeInTheDocument();
    const lands = within(
      screen.getByRole("region", { name: "Off theme" })
    ).getByRole("list", { name: "Lands" });
    expect(lands).toHaveTextContent("30 ×Mountain");
  });

  it("lists and counts the commander and partner first, and leaves the Sideboard and Considering rows out", async () => {
    const deck = aDeck({
      commander: legendary("tymna", "Tymna the Weaver", "commander"),
      partner: legendary("kraum", "Kraum, Ludevic's Opus", "commander"),
      cards: [
        legendary("adeline", "Adeline, Resplendent Cathar", "creature"),
        { ...legendary("akroma", "Akroma, Angel of Wrath"), zone: "sideboard" },
        {
          ...legendary("aurelia", "Aurelia, the Warleader"),
          zone: "maybeboard",
        },
      ],
    });
    const { user } = await openPanel(deck);

    await setFirstHandle(user, "Card type", "Legendary");

    expect(screen.getByText("3 of 3 cards on theme")).toBeInTheDocument();
    const legends = within(
      screen.getByRole("list", { name: "Card type: Legendary" })
    ).getAllByRole("listitem");
    expect(legends.map((row) => row.textContent)).toEqual([
      "Tymna the Weavercommand zonetype line: Legendary Creature — Human",
      "Kraum, Ludevic's Opuscommand zonetype line: Legendary Creature — Human",
      "Adeline, Resplendent Cathartype line: Legendary Creature — Human",
    ]);
  });

  it("shows the same coverage for the same deck in another order", async () => {
    const cards = [SOL_RING, SHIVAN_DRAGON, BOLT, MOUNTAINS];
    const first = await coverageText(aDeck({ cards }));
    const second = await coverageText(aDeck({ cards: cards.toReversed() }));

    expect(second).toBe(first);
  });

  it("counts a card that meets any handle, or only one that meets every handle once the player switches to all", async () => {
    const { user } = await openPanel(
      aDeck({ cards: [SHIVAN_DRAGON, SOL_RING, BOLT] })
    );
    await setFirstHandle(user, "Creature type", "Dragon");
    await user.click(screen.getByRole("button", { name: "Add a handle" }));
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Kind of handle 2" }),
      "First letter"
    );
    await user.type(
      screen.getByRole("textbox", { name: "Value of handle 2" }),
      "S"
    );

    expect(screen.getByText("2 of 3 cards on theme")).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "every handle" }));

    expect(screen.getByText("1 of 3 cards on theme")).toBeInTheDocument();
    const offTheme = screen.getByRole("region", { name: "Off theme" });
    expect(
      within(offTheme).getByRole("list", { name: "Ramp" })
    ).toHaveTextContent("Sol Ringmatches 1 of 2 handles");
  });

  it("reads the first letter after a leading The once the player ticks the switch", async () => {
    const urDragon = aDeckCard({
      id: "ur-dragon",
      name: "The Ur-Dragon",
      typeLine: "Legendary Creature — Dragon Avatar",
      category: "creature",
    });
    const { user } = await openPanel(aDeck({ cards: [urDragon, SOL_RING] }));
    await setFirstHandle(user, "First letter", "U");

    expect(screen.getByText("0 of 2 cards on theme")).toBeInTheDocument();

    await user.click(
      screen.getByRole("checkbox", { name: "Ignore a leading “The”" })
    );

    expect(screen.getByText("1 of 2 cards on theme")).toBeInTheDocument();
    expect(
      screen.getByRole("list", {
        name: "First letter: U, ignoring a leading “The”",
      })
    ).toHaveTextContent("The Ur-Dragonname: The Ur-Dragon");
  });

  it("shows artist, plane or set, watermark and flavor text greyed, with the card details they need", async () => {
    await openPanel(aDeck({ cards: [SHIVAN_DRAGON] }));
    const kinds = screen.getByRole("combobox", { name: "Kind of handle 1" });

    for (const kind of [
      "Artist",
      "Plane or set",
      "Watermark",
      "Word in flavor text",
    ]) {
      expect(
        within(kinds).getByRole("option", {
          name: `${kind}: needs card details not stored yet`,
        })
      ).toBeDisabled();
    }
    expect(screen.queryByText(/0 of/)).not.toBeInTheDocument();
  });

  it("asks for a handle before counting, and holds at most three handles", async () => {
    const { user } = await openPanel(aDeck({ cards: [SHIVAN_DRAGON] }));

    expect(
      screen.getByText("Name a handle to count the cards that match it.")
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Add a handle" }));
    await user.click(screen.getByRole("button", { name: "Add a handle" }));

    expect(screen.getAllByRole("combobox")).toHaveLength(3);
    expect(
      screen.queryByRole("button", { name: "Add a handle" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("A theme holds up to three handles.")
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Remove handle 2" }));

    expect(screen.getAllByRole("combobox")).toHaveLength(2);
    expect(
      screen.getByRole("button", { name: "Add a handle" })
    ).toBeInTheDocument();
  });

  it("says in French that the theme is not saved, and counts in French", async () => {
    const { user } = await openPanel(
      aDeck({ cards: [SHIVAN_DRAGON, SOL_RING] }),
      "fr"
    );

    expect(
      screen.getByText(
        "Ce thème n’est pas encore enregistré avec le deck. Il reste tant que l’éditeur est ouvert."
      )
    ).toBeInTheDocument();

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Type du critère 1" }),
      "Type de créature"
    );
    await user.type(
      screen.getByRole("textbox", { name: "Valeur du critère 1" }),
      "Dragon"
    );

    expect(
      screen.getByText("1 sur 2 cartes dans le thème")
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("region", { name: "Dans le thème" })).getByRole(
        "list",
        { name: "Type de créature : Dragon" }
      )
    ).toHaveTextContent("ligne de type : Creature — Dragon");
    expect(
      within(screen.getByRole("region", { name: "Hors thème" })).getByRole(
        "list",
        { name: "Ramp" }
      )
    ).toHaveTextContent("aucun critère ne correspond");
  });

  it("works on a guest deck without sending anything", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const guestDeck = {
      ...createGuestDeck(),
      cards: [SHIVAN_DRAGON, SOL_RING],
    };
    const { user } = await openPanel(guestDeck);

    await setFirstHandle(user, "Creature type", "Dragon");

    expect(
      screen.getByText(
        "This theme is not saved with the deck yet. It stays while the builder is open."
      )
    ).toBeInTheDocument();
    expect(screen.getByText("1 of 2 cards on theme")).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("opens and fills from the keyboard alone", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ThemePanel deck={aDeck({ cards: [SHIVAN_DRAGON] })} />
    );

    await user.tab();
    expect(screen.getByRole("button", { name: "Theme" })).toHaveFocus();
    await user.keyboard("{Enter}");
    await user.tab();
    expect(
      screen.getByRole("combobox", { name: "Kind of handle 1" })
    ).toHaveFocus();
    await user.tab();
    await user.keyboard("Dragon");

    expect(screen.getByText("1 of 1 card on theme")).toBeInTheDocument();
  });

  it("tells on theme from off theme by a word and an icon, not by colour alone", async () => {
    const { user } = await openPanel(
      aDeck({ cards: [SHIVAN_DRAGON, SOL_RING] })
    );
    await setFirstHandle(user, "Creature type", "Dragon");

    for (const name of ["On theme", "Off theme"]) {
      const heading = screen.getByRole("heading", { name });
      expect(heading.querySelector("svg[aria-hidden='true']")).not.toBeNull();
    }
  });
});
