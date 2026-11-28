import { describe, expect, it, vi } from "vitest";
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { renderWithIntl } from "@/test/render-with-intl";
import { renderWithProviders } from "@/test/render";
import { aScryfallCard } from "@/test/builders/scryfall";
import { SearchZoneMenu } from "./SearchZoneMenu";
import type { DeckZone } from "@/lib/deck/types";
import type { ScryfallCard } from "@/lib/scryfall/types";

function card(name: string): ScryfallCard {
  return {
    id: "sol-ring",
    name,
    mana_cost: "{1}",
    cmc: 1,
    type_line: "Artifact",
    oracle_text: "",
    color_identity: [],
    colors: [],
    set: "c16",
    set_name: "Commander 2016",
    rarity: "uncommon",
    prices: { usd: null, usd_foil: null, eur: null },
    image_uris: { small: "", normal: "", large: "", art_crop: "", border_crop: "", png: "" },
    keywords: [],
    legalities: { commander: "legal" },
  };
}

const COUNTS: Readonly<Record<DeckZone, number>> = {
  main: 12,
  sideboard: 2,
  maybeboard: 0,
};

function renderMenu(
  onAddToZone: (card: ScryfallCard, zone: DeckZone) => void,
  options?: { readonly locale?: "en" | "fr"; readonly withCounts?: boolean }
) {
  return renderWithIntl(
    <div style={{ overflow: "hidden", height: 40 }}>
      <SearchZoneMenu
        card={card("Sol Ring")}
        onAddToZone={onAddToZone}
        zoneCounts={options?.withCounts ? COUNTS : undefined}
      />
    </div>,
    { locale: options?.locale }
  );
}

describe("SearchZoneMenu", () => {
  it("adds the card to the main deck from the primary action", async () => {
    const user = userEvent.setup();
    const onAddToZone = vi.fn();
    const solRing = card("Sol Ring");
    renderWithIntl(<SearchZoneMenu card={solRing} onAddToZone={onAddToZone} />);

    await user.click(screen.getByRole("button", { name: "Add Sol Ring to the main deck" }));

    expect(onAddToZone).toHaveBeenCalledTimes(1);
    expect(onAddToZone).toHaveBeenCalledWith(solRing, "main");
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("adds the card to the sideboard from the zone menu", async () => {
    const user = userEvent.setup();
    const onAddToZone = vi.fn();
    const solRing = card("Sol Ring");
    renderWithIntl(<SearchZoneMenu card={solRing} onAddToZone={onAddToZone} />);

    await user.click(screen.getByRole("button", { name: "More zones for Sol Ring" }));
    await user.click(screen.getByRole("menuitem", { name: "Add Sol Ring to the sideboard" }));

    expect(onAddToZone).toHaveBeenCalledWith(solRing, "sideboard");
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("adds the card to considering from the zone menu", async () => {
    const user = userEvent.setup();
    const onAddToZone = vi.fn();
    const solRing = card("Sol Ring");
    renderWithIntl(<SearchZoneMenu card={solRing} onAddToZone={onAddToZone} />);

    await user.click(screen.getByRole("button", { name: "More zones for Sol Ring" }));
    await user.click(
      screen.getByRole("menuitem", { name: "Add Sol Ring to considering" })
    );

    expect(onAddToZone).toHaveBeenCalledWith(solRing, "maybeboard");
  });

  it("moves through the zones with the arrow keys and adds the focused one with Enter", async () => {
    const user = userEvent.setup();
    const onAddToZone = vi.fn();
    const solRing = card("Sol Ring");
    renderWithIntl(<SearchZoneMenu card={solRing} onAddToZone={onAddToZone} />);

    screen.getByRole("button", { name: "More zones for Sol Ring" }).focus();
    await user.keyboard("{ArrowDown}");

    expect(screen.getByRole("menuitem", { name: "Add Sol Ring to the main deck" })).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "Add Sol Ring to the sideboard" })).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "Add Sol Ring to considering" })).toHaveFocus();

    await user.keyboard("{ArrowUp}");
    expect(screen.getByRole("menuitem", { name: "Add Sol Ring to the sideboard" })).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(onAddToZone).toHaveBeenCalledWith(solRing, "sideboard");
  });

  it("opens on the first zone from a click, jumps to the ends with Home and End, and wraps with the arrows", async () => {
    const user = userEvent.setup();
    renderMenu(vi.fn());
    const main = () => screen.getByRole("menuitem", { name: "Add Sol Ring to the main deck" });
    const considering = () => screen.getByRole("menuitem", { name: "Add Sol Ring to considering" });

    await user.click(screen.getByRole("button", { name: "More zones for Sol Ring" }));
    expect(main()).toHaveFocus();

    await user.keyboard("{End}");
    expect(considering()).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    expect(main()).toHaveFocus();

    await user.keyboard("{ArrowUp}");
    expect(considering()).toHaveFocus();

    await user.keyboard("{Home}");
    expect(main()).toHaveFocus();
  });

  it("opens on the last zone from ArrowUp on the zone button", async () => {
    const user = userEvent.setup();
    renderMenu(vi.fn());

    screen.getByRole("button", { name: "More zones for Sol Ring" }).focus();
    await user.keyboard("{ArrowUp}");

    expect(screen.getByRole("menuitem", { name: "Add Sol Ring to considering" })).toHaveFocus();
  });

  it("keeps the keyboard in the menu after a press on its edge, so ArrowDown reaches the first zone", async () => {
    const user = userEvent.setup();
    renderMenu(vi.fn());
    await user.click(screen.getByRole("button", { name: "More zones for Sol Ring" }));

    await user.click(screen.getByRole("menu"));
    await user.keyboard("{ArrowDown}");

    expect(screen.getByRole("menu")).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: "Add Sol Ring to the main deck" })).toHaveFocus();
  });

  it("keeps the keyboard in the menu after a press on its edge, so ArrowUp reaches the last zone", async () => {
    const user = userEvent.setup();
    renderMenu(vi.fn());
    await user.click(screen.getByRole("button", { name: "More zones for Sol Ring" }));

    await user.click(screen.getByRole("menu"));
    await user.keyboard("{ArrowUp}");

    expect(screen.getByRole("menuitem", { name: "Add Sol Ring to considering" })).toHaveFocus();
  });

  it("closes on Escape without adding, and returns focus to the zone button", async () => {
    const user = userEvent.setup();
    const onAddToZone = vi.fn();
    renderMenu(onAddToZone);

    const more = screen.getByRole("button", { name: "More zones for Sol Ring" });
    await user.click(more);
    expect(screen.getByRole("menu", { name: "Zones for Sol Ring" })).toBeTruthy();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("menu")).toBeNull();
    expect(onAddToZone).not.toHaveBeenCalled();
    expect(more).toHaveFocus();
  });

  it("closes when the pointer presses outside the menu", async () => {
    const user = userEvent.setup();
    renderMenu(vi.fn());

    await user.click(screen.getByRole("button", { name: "More zones for Sol Ring" }));
    expect(screen.getByRole("menu")).toBeTruthy();

    await user.click(document.body);

    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("draws the menu on the document so a clipped tile cannot hide it", async () => {
    const user = userEvent.setup();
    renderMenu(vi.fn());

    await user.click(screen.getByRole("button", { name: "More zones for Sol Ring" }));

    expect(screen.getByRole("menu").parentElement).toBe(document.body);
  });

  it("names each zone with the copies already in it", async () => {
    const user = userEvent.setup();
    renderMenu(vi.fn(), { withCounts: true });

    await user.click(screen.getByRole("button", { name: "More zones for Sol Ring" }));

    expect(screen.getByRole("menuitem", { name: "Add Sol Ring to Main. 12 cards already in this zone" })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: "Add Sol Ring to Sideboard. 2 cards already in this zone" })).toBeTruthy();
    expect(
      screen.getByRole("menuitem", { name: "Add Sol Ring to Considering. 0 cards already in this zone" })
    ).toBeTruthy();
    expect(screen.getByText("Sideboard (2)")).toBeTruthy();
  });

  it("uses the French catalogue for the action and the zones", async () => {
    const user = userEvent.setup();
    renderMenu(vi.fn(), { locale: "fr", withCounts: true });

    expect(screen.getByRole("button", { name: "Ajouter Sol Ring au principal" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Autres zones pour Sol Ring" }));

    expect(screen.getByRole("menu", { name: "Zones pour Sol Ring" })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: "Ajouter Sol Ring à Réserve. 2 cartes déjà dans cette zone" })).toBeTruthy();
    expect(screen.getByText("À considérer (0)")).toBeTruthy();
  });

  it("leaves the card clear until a pointer can hover, and marks an add", async () => {
    const user = userEvent.setup();
    const onAddToZone = vi.fn();
    renderWithIntl(<SearchZoneMenu card={card("Sol Ring")} onAddToZone={onAddToZone} />);

    expect(screen.getByTestId("zone-tile-chrome").querySelector("[class*='opacity-0']")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Add Sol Ring to the main deck" }));

    expect(screen.getByRole("status").textContent).toBe("Added Sol Ring");
  });

  it("closes the menu when the results scroll", async () => {
    const user = userEvent.setup();
    renderMenu(vi.fn());
    await user.click(screen.getByRole("button", { name: "More zones for Sol Ring" }));
    expect(screen.getByRole("menu")).toBeTruthy();

    await act(async () => {
      document.dispatchEvent(new Event("scroll"));
    });

    expect(screen.queryByRole("menu")).toBeNull();
  });
});

/**
 * Tab leaves a menu: the items are reached with the arrow keys, and Tab or Shift+Tab moves focus
 * out of the menu and closes it (WAI-ARIA APG, menu and menubar pattern, "Keyboard Interaction",
 * https://www.w3.org/WAI/ARIA/apg/patterns/menubar/, read 2026-11-25).
 */
describe("SearchZoneMenu, Tab leaves the zone menu", () => {
  /** A result after another tab stop and before `after`, as on a grid of results. */
  function renderResultBefore(after: ReactNode) {
    return renderWithProviders(
      <>
        <button type="button">Previous result</button>
        <SearchZoneMenu
          card={aScryfallCard({ name: "Sol Ring" })}
          onAddToZone={vi.fn()}
        />
        {after}
      </>
    );
  }

  function renderBetweenTabStops() {
    return renderResultBefore(<button type="button">Next result</button>);
  }

  async function openFromTheKeyboard(user: ReturnType<typeof userEvent.setup>) {
    screen.getByRole("button", { name: "More zones for Sol Ring" }).focus();
    await user.keyboard("{ArrowDown}");
  }

  it("closes the menu on Tab and moves on to the tab stop after the zone button", async () => {
    const user = userEvent.setup();
    renderBetweenTabStops();
    await openFromTheKeyboard(user);
    expect(
      screen.getByRole("menuitem", { name: "Add Sol Ring to the main deck" })
    ).toHaveFocus();

    await user.tab();

    expect(screen.queryByRole("menu")).toBeNull();
    expect(screen.getByRole("button", { name: "Next result" })).toHaveFocus();
  });

  it("closes the menu on Shift+Tab and moves back to the zone button, the tab stop before the menu", async () => {
    const user = userEvent.setup();
    renderBetweenTabStops();
    await openFromTheKeyboard(user);

    await user.tab({ shift: true });

    expect(screen.queryByRole("menu")).toBeNull();
    expect(
      screen.getByRole("button", { name: "More zones for Sol Ring" })
    ).toHaveFocus();
  });

  it("keeps every zone out of the tab order, so only the arrow keys move between them", async () => {
    const user = userEvent.setup();
    renderBetweenTabStops();
    await openFromTheKeyboard(user);

    const zones = screen.getAllByRole("menuitem");

    expect(zones.map((zone) => zone.tabIndex)).toEqual([-1, -1, -1]);
  });

  it("leaves the menu on Tab after a press on its edge took focus", async () => {
    const user = userEvent.setup();
    renderBetweenTabStops();
    await user.click(
      screen.getByRole("button", { name: "More zones for Sol Ring" })
    );
    await user.click(screen.getByRole("menu"));

    await user.tab();

    expect(screen.queryByRole("menu")).toBeNull();
    expect(screen.getByRole("button", { name: "Next result" })).toHaveFocus();
  });

  it("skips a disabled control after the zone button, as the browser's Tab does", async () => {
    const user = userEvent.setup();
    renderResultBefore(
      <>
        <button type="button" disabled>
          Unavailable
        </button>
        <button type="button">Next result</button>
      </>
    );
    await openFromTheKeyboard(user);

    await user.tab();

    expect(screen.getByRole("button", { name: "Next result" })).toHaveFocus();
  });

  it("closes the menu on Tab and stays on the zone button when nothing after it takes focus", async () => {
    const user = userEvent.setup();
    renderResultBefore(null);
    await openFromTheKeyboard(user);

    await user.tab();

    expect(screen.queryByRole("menu")).toBeNull();
    expect(
      screen.getByRole("button", { name: "More zones for Sol Ring" })
    ).toHaveFocus();
  });
});
