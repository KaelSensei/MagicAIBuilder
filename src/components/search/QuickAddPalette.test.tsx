import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { renderWithIntl } from "@/test/render-with-intl";
import type { DeckZone } from "@/lib/deck/types";
import type {
  QuickAddReading,
  QuickAddScope,
} from "@/lib/search/quick-add-query";
import type { ScryfallCard } from "@/lib/scryfall/types";
import { aScryfallCard } from "@/test/builders/scryfall";
import { QuickAddPalette, type QuickAddPhase } from "./QuickAddPalette";

const SIMIC: QuickAddScope = {
  legality: "commander",
  identityClause: "id<=UG",
};

function card(id: string, name: string): ScryfallCard {
  return {
    id,
    name,
    mana_cost: "{1}",
    cmc: 1,
    type_line: "Artifact",
    color_identity: [],
    prices: { usd: "1.50", usd_foil: null, eur: null },
  };
}

function Harness(props: {
  readonly cards: readonly ScryfallCard[];
  readonly phase: QuickAddPhase;
  readonly onAdd: (card: ScryfallCard, zone: DeckZone) => void;
  readonly initialReading?: QuickAddReading;
}) {
  const [text, setText] = useState("sol");
  const [reading, setReading] = useState<QuickAddReading>(
    props.initialReading ?? "name"
  );
  const [open, setOpen] = useState(true);
  return (
    <QuickAddPalette
      open={open}
      onOpenChange={setOpen}
      text={text}
      onTextChange={setText}
      reading={reading}
      onReadingChange={setReading}
      scope={SIMIC}
      cards={props.cards}
      phase={props.phase}
      onAdd={props.onAdd}
    />
  );
}

describe("QuickAddPalette", () => {
  it("shows the query and adds the highlighted card to the main deck without closing", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    const solRing = card("sol", "Sol Ring");
    renderWithIntl(<Harness cards={[solRing]} phase="results" onAdd={onAdd} />);

    expect(
      screen.getByText("Query: name:/sol/ legal:commander id<=UG")
    ).toBeTruthy();
    await user.click(screen.getByRole("combobox", { name: "Quick add" }));
    await user.keyboard("{Enter}");

    expect(onAdd).toHaveBeenCalledWith(solRing, "main");
    expect(screen.getByRole("dialog", { name: "Quick add" })).toBeTruthy();
    expect(screen.getByRole("status").textContent).toBe(
      "Added Sol Ring to Main."
    );
  });

  it("adds to the sideboard with Shift+Enter and to considering with Alt+Enter", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    const solRing = card("sol", "Sol Ring");
    renderWithIntl(<Harness cards={[solRing]} phase="results" onAdd={onAdd} />);
    const box = screen.getByRole("combobox", { name: "Quick add" });

    await user.click(box);
    await user.keyboard("{Shift>}{Enter}{/Shift}");
    expect(onAdd).toHaveBeenLastCalledWith(solRing, "sideboard");

    await user.keyboard("{Alt>}{Enter}{/Alt}");
    expect(onAdd).toHaveBeenLastCalledWith(solRing, "maybeboard");
  });

  it("moves to the next result with the arrow keys before adding it", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    const solRing = card("sol", "Sol Ring");
    const arcane = card("signet", "Arcane Signet");
    renderWithIntl(
      <Harness cards={[solRing, arcane]} phase="results" onAdd={onAdd} />
    );

    await user.click(screen.getByRole("combobox", { name: "Quick add" }));
    await user.keyboard("{ArrowDown}{Enter}");

    expect(onAdd).toHaveBeenCalledWith(arcane, "main");
  });

  it("does not add when the line is too short or the search found nothing", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    renderWithIntl(<Harness cards={[]} phase="idle" onAdd={onAdd} />);

    await user.click(screen.getByRole("combobox", { name: "Quick add" }));
    await user.keyboard("{Enter}");

    expect(onAdd).not.toHaveBeenCalled();
    expect(screen.getByText("Type at least two letters.")).toBeTruthy();
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    renderWithIntl(<Harness cards={[]} phase="empty" onAdd={vi.fn()} />);

    await user.click(screen.getByRole("combobox", { name: "Quick add" }));
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("switches a sentence to rules text and shows that query", async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <Harness cards={[]} phase="idle" onAdd={vi.fn()} initialReading="name" />
    );
    const box = screen.getByRole("combobox", { name: "Quick add" });
    await user.click(box);
    await user.clear(box);
    await user.type(box, "destroy artifacts");
    await user.keyboard("{Alt>}r{/Alt}");

    expect(
      screen.getByText('Query: o:"destroy artifacts" legal:commander id<=UG')
    ).toBeTruthy();
  });

  it("uses the French catalogue", () => {
    renderWithIntl(
      <Harness
        cards={[card("sol", "Sol Ring")]}
        phase="results"
        onAdd={vi.fn()}
      />,
      {
        locale: "fr",
      }
    );

    expect(screen.getByRole("dialog", { name: "Ajout rapide" })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Texte de règles" })
    ).toBeTruthy();
    expect(
      screen.getByText("Requête : name:/sol/ legal:commander id<=UG")
    ).toBeTruthy();
  });
});

// Characterization before the split of the palette into a hook and small parts
// (refactor-quick-add-palette): these pin today's behaviour so the structural
// change can prove it moved nothing.
describe("QuickAddPalette, pinned before the split", () => {
  const solRing = aScryfallCard({ id: "sol", name: "Sol Ring" });
  const arcaneSignet = aScryfallCard({ id: "signet", name: "Arcane Signet" });

  it("adds a clicked result to the main deck and stays open", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    renderWithIntl(
      <Harness cards={[solRing, arcaneSignet]} phase="results" onAdd={onAdd} />
    );

    await user.click(screen.getByRole("button", { name: /Arcane Signet/ }));

    expect(onAdd).toHaveBeenCalledWith(arcaneSignet, "main");
    expect(screen.getByRole("status").textContent).toBe(
      "Added Arcane Signet to Main."
    );
    expect(screen.getByRole("dialog", { name: "Quick add" })).toBeTruthy();
  });

  it("keeps the highlight on the first result above the list and on the last below it", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    renderWithIntl(
      <Harness cards={[solRing, arcaneSignet]} phase="results" onAdd={onAdd} />
    );
    const box = screen.getByRole("combobox", { name: "Quick add" });

    await user.click(box);
    await user.keyboard("{ArrowUp}{Enter}");
    expect(onAdd).toHaveBeenLastCalledWith(solRing, "main");

    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}{Enter}");
    expect(onAdd).toHaveBeenLastCalledWith(arcaneSignet, "main");
    expect(box.getAttribute("aria-activedescendant")).toBe(
      "quick-add-option-signet"
    );
  });

  it("goes back to the first result and clears the added line when the text changes", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    renderWithIntl(
      <Harness cards={[solRing, arcaneSignet]} phase="results" onAdd={onAdd} />
    );
    const box = screen.getByRole("combobox", { name: "Quick add" });

    await user.click(box);
    await user.keyboard("{ArrowDown}{Enter}");
    expect(screen.getByRole("status").textContent).toBe(
      "Added Arcane Signet to Main."
    );

    await user.type(box, "x");
    expect(screen.queryByRole("status")).toBeNull();
    await user.keyboard("{Enter}");
    expect(onAdd).toHaveBeenLastCalledWith(solRing, "main");
  });

  it("switches between the name and the rules text with its buttons", async () => {
    const user = userEvent.setup();
    renderWithIntl(<Harness cards={[]} phase="idle" onAdd={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Rules text" }));
    expect(
      screen
        .getByRole("button", { name: "Rules text" })
        .getAttribute("aria-pressed")
    ).toBe("true");
    expect(
      screen.getByText('Query: o:"sol" legal:commander id<=UG')
    ).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Name" }));
    expect(
      screen.getByRole("button", { name: "Name" }).getAttribute("aria-pressed")
    ).toBe("true");
    expect(
      screen.getByText("Query: name:/sol/ legal:commander id<=UG")
    ).toBeTruthy();
  });

  it("leaves Alt+R alone when another modifier is held", async () => {
    const user = userEvent.setup();
    renderWithIntl(<Harness cards={[]} phase="idle" onAdd={vi.fn()} />);

    await user.click(screen.getByRole("combobox", { name: "Quick add" }));
    await user.keyboard("{Control>}{Alt>}r{/Alt}{/Control}");

    expect(
      screen.getByRole("button", { name: "Name" }).getAttribute("aria-pressed")
    ).toBe("true");
  });

  it("says it is searching while the search runs", () => {
    renderWithIntl(<Harness cards={[]} phase="loading" onAdd={vi.fn()} />);

    expect(screen.getByText("Searching…")).toBeTruthy();
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("says when no card matches the query", () => {
    renderWithIntl(<Harness cards={[]} phase="empty" onAdd={vi.fn()} />);

    expect(screen.getByText("No cards for this query.")).toBeTruthy();
  });

  it("says when the search failed, as an alert", () => {
    renderWithIntl(<Harness cards={[]} phase="error" onAdd={vi.fn()} />);

    expect(screen.getByRole("alert").textContent).toBe(
      "The search could not be completed."
    );
  });
});
