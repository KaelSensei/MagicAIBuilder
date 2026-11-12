/**
 * Characterization of the builder's search filters panel, `SearchFilters.tsx` (P1-21, audit
 * catalog A2). The panel is a controlled component: it renders the filters it is given and reports
 * every change through `onChange`. These tests pin what it shows and what it reports today, so the
 * planned split into section components and a preset hook (audit catalog SF) cannot change either
 * unnoticed (ADR 0005, rule 6). `SearchFilters.query.test.tsx` pins the Scryfall query the same
 * clicks produce.
 *
 * The panel runs as the builder page mounts it: inside a parent that keeps the filters in state,
 * starting from the page's defaults. Tests named "currently … (pinned)" record odd behaviour on
 * purpose; a `fix/` pull request that changes it flips the test with its own Red.
 */
import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SearchFilters } from "./SearchFilters";
import { testMessages } from "@/test/intl-catalogs";
import { renderWithIntl } from "@/test/render-with-intl";
import type { SearchFilters as SearchFiltersValue } from "@/lib/deck/types";

const FILTERS: SearchFiltersValue = {
  colors: [],
  types: [],
  cmcMin: null,
  cmcMax: null,
  cmcExact: null,
  priceMin: null,
  priceMax: null,
  powerMin: null,
  powerMax: null,
  toughnessMin: null,
  toughnessMax: null,
  subtype: "",
  keyword: "",
  interactionType: null,
};

/** The filters the builder page starts from (`DEFAULT_FILTERS`, builder page.tsx:250-269). */
const PAGE_DEFAULTS: SearchFiltersValue = {
  ...FILTERS,
  colorMode: "or",
  colorlessFilter: false,
  landFilter: false,
  cmcMode: "range",
};

/** Where the panel keeps saved presets; players' existing presets live under this key. */
const PRESETS_KEY = "magicaibuilder:filter-presets";

/**
 * Mounts the panel under a parent that keeps the filters in state, as the builder page does, and
 * records every value the panel reports.
 */
function renderPanel(initial: SearchFiltersValue = PAGE_DEFAULTS) {
  const reported: SearchFiltersValue[] = [];
  function Parent() {
    const [filters, setFilters] = useState(initial);
    return (
      <SearchFilters
        filters={filters}
        onChange={(next) => {
          reported.push(next);
          setFilters(next);
        }}
      />
    );
  }
  const view = renderWithIntl(<Parent />);
  return {
    ...view,
    user: userEvent.setup(),
    /** The last filters the panel reported. */
    last: (): SearchFiltersValue | undefined => reported.at(-1),
  };
}

const button = (name: string) => screen.getByRole("button", { name });

/** Whether a `<label>` element names the field, as the Type and Role words do. */
const hasVisibleLabel = (field: HTMLElement): boolean =>
  (field instanceof HTMLInputElement || field instanceof HTMLSelectElement) &&
  field.labels !== null &&
  field.labels.length > 0;

/** The CMC mode tab; the colour "Exact" match also exists, and only it carries a title. */
const cmcMode = (name: string) =>
  screen.getByRole("button", { name, description: "" });

beforeEach(() => {
  localStorage.clear();
});

describe("SearchFilters", () => {
  it("labels USD-only price bounds explicitly", () => {
    renderWithIntl(<SearchFilters filters={FILTERS} onChange={vi.fn()} />);
    expect(screen.getByText("Price (USD)")).toBeDefined();
  });

  it("writes the price label, currency included, in the player's language", () => {
    renderWithIntl(<SearchFilters filters={FILTERS} onChange={vi.fn()} />, {
      locale: "fr",
    });
    expect(screen.getByText("Prix (USD)")).toBeDefined();
  });

  it("shows the price label as the catalog words it, currency included, so a translator can reword it", () => {
    const en = testMessages("en");
    const search = en.search;
    if (typeof search !== "object" || typeof search.filters !== "object") {
      throw new TypeError("the en search catalog has no filters block");
    }
    const messages = {
      ...en,
      search: {
        ...search,
        filters: { ...search.filters, priceUsd: "Price, in dollars" },
      },
    };
    renderWithIntl(<SearchFilters filters={FILTERS} onChange={vi.fn()} />, {
      messages,
    });

    expect(screen.getByText("Price, in dollars")).toBeDefined();
    expect(screen.queryByText(/\(USD\)/)).toBeNull();
  });

  it("offers Collection only to every player as a toggle button that reports its state", () => {
    const onChange = vi.fn();
    const off = renderWithIntl(
      <SearchFilters filters={FILTERS} onChange={onChange} />
    );

    const toggle = screen.getByRole("button", { name: "Only cards I own" });
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(toggle);
    expect(onChange).toHaveBeenCalledWith({ ...FILTERS, collectionOnly: true });

    off.unmount();
    renderWithIntl(
      <SearchFilters
        filters={{ ...FILTERS, collectionOnly: true }}
        onChange={onChange}
      />
    );
    expect(
      screen
        .getByRole("button", { name: "Only cards I own" })
        .getAttribute("aria-pressed")
    ).toBe("true");
  });

  it("turns Collection only off again and reports nothing else", async () => {
    const panel = renderPanel({ ...PAGE_DEFAULTS, collectionOnly: true });

    await panel.user.click(button("Only cards I own"));

    expect(panel.last()).toEqual({ ...PAGE_DEFAULTS, collectionOnly: false });
    expect(button("Only cards I own").getAttribute("aria-pressed")).toBe(
      "false"
    );
  });
});

describe("SearchFilters: colours", () => {
  it("names the five colour buttons, Colorless and Land by the word alone, in that order, and describes the last two by their Scryfall syntax", () => {
    renderPanel();

    const names = [
      "White",
      "Blue",
      "Black",
      "Red",
      "Green",
      "Colorless",
      "Land",
    ];
    expect(screen.getAllByRole("button").slice(0, names.length)).toEqual(
      names.map((name) => button(name))
    );
    expect(button("Colorless")).toHaveAccessibleDescription(
      "Colorless (c:c) — artifacts, Eldrazi, etc."
    );
    expect(button("Land")).toHaveAccessibleDescription("Lands (t:land)");
  });

  it("announces each colour, Colorless and Land as a toggle button whose pressed state flips on each click", async () => {
    const panel = renderPanel();
    const toggles = [
      "White",
      "Blue",
      "Black",
      "Red",
      "Green",
      "Colorless",
      "Land",
    ];

    for (const name of toggles) {
      expect(button(name).getAttribute("aria-pressed")).toBe("false");
    }

    await panel.user.click(button("White"));
    await panel.user.click(button("Land"));
    expect(button("White").getAttribute("aria-pressed")).toBe("true");
    expect(button("Land").getAttribute("aria-pressed")).toBe("true");
    expect(button("Blue").getAttribute("aria-pressed")).toBe("false");

    await panel.user.click(button("Colorless"));
    expect(button("Colorless").getAttribute("aria-pressed")).toBe("true");
    // Colorless clears the picked colours, so White reads as off again.
    expect(button("White").getAttribute("aria-pressed")).toBe("false");

    await panel.user.click(button("Land"));
    expect(button("Land").getAttribute("aria-pressed")).toBe("false");
  });

  it("adds colours in the order they are clicked and removes one on a second click", async () => {
    const panel = renderPanel();

    await panel.user.click(button("Green"));
    await panel.user.click(button("White"));
    expect(panel.last()?.colors).toEqual(["G", "W"]);

    await panel.user.click(button("Green"));
    expect(panel.last()?.colors).toEqual(["W"]);
  });

  it("clears the picked colours when Colorless is turned on, and keeps them cleared when it is turned off", async () => {
    const panel = renderPanel();
    await panel.user.click(button("Red"));
    await panel.user.click(button("Blue"));

    await panel.user.click(button("Colorless"));
    expect(panel.last()).toMatchObject({ colors: [], colorlessFilter: true });

    await panel.user.click(button("Colorless"));
    expect(panel.last()).toMatchObject({ colors: [], colorlessFilter: false });
  });

  it("turns Colorless off when a colour is picked", async () => {
    const panel = renderPanel();
    await panel.user.click(button("Colorless"));

    await panel.user.click(button("Black"));

    expect(panel.last()).toMatchObject({
      colors: ["B"],
      colorlessFilter: false,
    });
  });

  it("toggles Land on and off without touching the colours", async () => {
    const panel = renderPanel();
    await panel.user.click(button("Green"));

    await panel.user.click(button("Land"));
    expect(panel.last()).toMatchObject({ colors: ["G"], landFilter: true });

    await panel.user.click(button("Land"));
    expect(panel.last()).toMatchObject({ colors: ["G"], landFilter: false });
  });

  it("offers Any, All and Exact matching only once two colours are picked, each described by its Scryfall operator", async () => {
    const panel = renderPanel();
    await panel.user.click(button("White"));
    expect(screen.queryByText("Match:")).toBeNull();

    await panel.user.click(button("Blue"));

    expect(screen.getByText("Match:")).toBeDefined();
    expect(
      screen.getByRole("button", {
        name: "Any",
        description:
          "Cards that include at least one of the selected colors (id<=…)",
      })
    ).toBeDefined();
    expect(
      screen.getByRole("button", {
        name: "All",
        description: "Cards that include ALL selected colors (c>=…)",
      })
    ).toBeDefined();
    await panel.user.click(
      screen.getByRole("button", {
        name: "Exact",
        description: "Cards that are exactly these colors, no more (c=…)",
      })
    );
    expect(panel.last()).toMatchObject({
      colors: ["W", "U"],
      colorMode: "exact",
    });
  });

  it("currently keeps the chosen match after the selection drops to one colour, while the match buttons are hidden (pinned)", async () => {
    const panel = renderPanel();
    await panel.user.click(button("White"));
    await panel.user.click(button("Blue"));
    await panel.user.click(
      screen.getByRole("button", { name: "All", description: /c>=/ })
    );

    await panel.user.click(button("Blue"));

    expect(screen.queryByText("Match:")).toBeNull();
    expect(panel.last()).toMatchObject({ colors: ["W"], colorMode: "and" });
  });
});

describe("SearchFilters: mana value", () => {
  it("starts in Range mode with a Min and a Max field, each capped at 20", () => {
    renderPanel();

    for (const placeholder of ["Min", "Max"]) {
      const field = screen.getByPlaceholderText(placeholder);
      expect(field.getAttribute("type")).toBe("number");
      expect(field.getAttribute("min")).toBe("0");
      expect(field.getAttribute("max")).toBe("20");
    }
  });

  it.each([
    ["Exact", "e.g. 3", "cmcExact"],
    ["Min", "≥", "cmcMin"],
    ["Max", "≤", "cmcMax"],
  ] as const)(
    "%s mode shows one field, placeholder %s, which sets %s",
    async (mode, placeholder, field) => {
      const panel = renderPanel();

      await panel.user.click(cmcMode(mode));
      expect(
        screen.queryByPlaceholderText(mode === "Min" ? "Max" : "Min")
      ).toBeNull();
      await panel.user.type(screen.getByPlaceholderText(placeholder), "3");

      expect(panel.last()).toMatchObject({
        cmcMode: mode.toLowerCase(),
        [field]: 3,
      });
    }
  );

  it("clears every mana value bound when the mode changes", async () => {
    const panel = renderPanel();
    await panel.user.type(screen.getByPlaceholderText("Min"), "2");
    await panel.user.type(screen.getByPlaceholderText("Max"), "5");

    await panel.user.click(cmcMode("Exact"));

    expect(panel.last()).toMatchObject({
      cmcMode: "exact",
      cmcMin: null,
      cmcMax: null,
      cmcExact: null,
    });
    expect(screen.getByPlaceholderText("e.g. 3")).toHaveProperty("value", "");
  });

  it("reports an emptied field as no bound", async () => {
    const panel = renderPanel();
    await panel.user.type(screen.getByPlaceholderText("Min"), "4");

    await panel.user.clear(screen.getByPlaceholderText("Min"));

    expect(panel.last()?.cmcMin).toBeNull();
  });

  it("currently accepts a minimum above the maximum without a warning (pinned)", async () => {
    const panel = renderPanel();

    await panel.user.type(screen.getByPlaceholderText("Min"), "5");
    await panel.user.type(screen.getByPlaceholderText("Max"), "2");

    expect(panel.last()).toMatchObject({ cmcMin: 5, cmcMax: 2 });
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

describe("SearchFilters: price, type, keyword and role", () => {
  it("reports price bounds in US dollars, decimals included", async () => {
    const panel = renderPanel();

    await panel.user.type(screen.getByPlaceholderText("Min $"), "0.5");
    await panel.user.type(screen.getByPlaceholderText("Max $"), "10");

    expect(panel.last()).toMatchObject({ priceMin: 0.5, priceMax: 10 });
  });

  it("reports the subtype and keyword as typed, spaces included", async () => {
    const panel = renderPanel();

    await panel.user.type(
      screen.getByPlaceholderText("e.g. Elf, Dragon"),
      " Elf "
    );
    await panel.user.type(
      screen.getByPlaceholderText("e.g. Flying, Trample"),
      "first strike"
    );

    expect(panel.last()).toMatchObject({
      subtype: " Elf ",
      keyword: "first strike",
    });
  });

  it("lists seven roles and reports the chosen one, or none", async () => {
    const panel = renderPanel();
    const role = screen.getByRole("combobox");

    expect(
      within(role)
        .getAllByRole("option")
        .map((option) => option.textContent)
    ).toEqual([
      "None",
      "Removal",
      "Counterspell",
      "Board Wipe",
      "Tutor",
      "Draw",
      "Ramp",
    ]);

    await panel.user.selectOptions(role, "Board Wipe");
    expect(panel.last()?.interactionType).toBe("wipe");

    await panel.user.selectOptions(role, "None");
    expect(panel.last()?.interactionType).toBeNull();
  });

  it("names every field a screen reader can land on: number, text, list and slider, creature bounds and presets included", () => {
    localStorage.setItem(
      PRESETS_KEY,
      JSON.stringify([{ name: "Izzet", filters: PAGE_DEFAULTS }])
    );
    renderPanel({ ...PAGE_DEFAULTS, types: ["Creature"] });

    const fields = [
      ...screen.getAllByRole("spinbutton"),
      ...screen.getAllByRole("textbox"),
      ...screen.getAllByRole("combobox"),
      ...screen.queryAllByRole("slider"),
    ];
    // 2 mana value + 2 price + 4 power/toughness, subtype + keyword + preset name, Role + presets.
    expect(fields).toHaveLength(13);
    // Listed by placeholder so a failure says which field lost its name.
    const unnamed = fields.filter(
      (field) => !field.getAttribute("aria-label") && !hasVisibleLabel(field)
    );
    expect(unnamed.map((field) => field.getAttribute("placeholder"))).toEqual(
      []
    );
    for (const field of fields) {
      expect(field).not.toHaveAccessibleName("");
    }
  });

  it("names the Type and Role fields by their visible labels and the abbreviated ones by their full words", () => {
    renderPanel({ ...PAGE_DEFAULTS, types: ["Creature"] });

    expect(screen.getByRole("textbox", { name: "Type" })).toHaveAttribute(
      "placeholder",
      "e.g. Elf, Dragon"
    );
    expect(
      screen.getByRole("textbox", { name: "Keyword ability" })
    ).toHaveAttribute("placeholder", "e.g. Flying, Trample");
    expect(screen.getByRole("combobox", { name: "Role" })).toBeDefined();
    for (const name of [
      "Minimum mana value",
      "Maximum mana value",
      "Minimum price in US dollars",
      "Maximum price in US dollars",
      "Minimum power",
      "Maximum power",
      "Minimum toughness",
      "Maximum toughness",
    ]) {
      expect(screen.getByRole("spinbutton", { name })).toBeDefined();
    }
  });
});

describe("SearchFilters: power and toughness", () => {
  it("shows power and toughness bounds only while the filters hold the Creature type", async () => {
    const panel = renderPanel({ ...PAGE_DEFAULTS, types: ["Creature"] });

    expect(screen.getByText("Pow")).toBeDefined();
    expect(screen.getByText("Tou")).toBeDefined();
    // After the two mana value and the two price fields, in reading order.
    const bounds = screen.getAllByRole("spinbutton").slice(4);
    expect(bounds).toHaveLength(4);
    for (const [index, value] of ["3", "5", "1", "4"].entries()) {
      await panel.user.type(bounds[index], value);
    }
    expect(panel.last()).toMatchObject({
      powerMin: 3,
      powerMax: 5,
      toughnessMin: 1,
      toughnessMax: 4,
    });
  });

  it("currently offers no control that adds a card type, so power and toughness never show from the page's defaults (pinned)", () => {
    renderPanel();

    expect(screen.queryByText("Pow")).toBeNull();
    expect(screen.queryByText("Tou")).toBeNull();
    expect(screen.queryByRole("checkbox")).toBeNull();
    expect(screen.queryByText(/creature/i)).toBeNull();
  });
});

describe("SearchFilters: presets", () => {
  it("saves a named preset on Save or Enter only once the name holds more than spaces", async () => {
    const panel = renderPanel();
    const name = screen.getByPlaceholderText("Preset name…");
    expect(button("Save")).toHaveProperty("disabled", true);

    await panel.user.type(name, "   ");
    expect(button("Save")).toHaveProperty("disabled", true);
    await panel.user.type(name, "{Enter}");
    expect(localStorage.getItem(PRESETS_KEY)).toBeNull();

    await panel.user.click(button("Green"));
    await panel.user.clear(name);
    await panel.user.type(name, " Ramp {Enter}");

    expect(name).toHaveProperty("value", "");
    expect(JSON.parse(localStorage.getItem(PRESETS_KEY) ?? "null")).toEqual([
      {
        name: "Ramp",
        filters: { ...PAGE_DEFAULTS, colors: ["G"], colorlessFilter: false },
      },
    ]);
  });

  it("loads a saved preset, Collection only included, and puts the list back on its prompt", async () => {
    const saved = {
      ...PAGE_DEFAULTS,
      colors: ["U", "R"],
      collectionOnly: true,
    };
    localStorage.setItem(
      PRESETS_KEY,
      JSON.stringify([{ name: "Izzet", filters: saved }])
    );
    const panel = renderPanel();
    const presets = screen.getByDisplayValue("Load a preset…");

    expect(
      within(presets)
        .getAllByRole("option")
        .map((o) => o.textContent)
    ).toEqual(["Load a preset…", "Izzet"]);
    await panel.user.selectOptions(presets, "Izzet");

    expect(panel.last()).toEqual(saved);
    expect(screen.getByDisplayValue("Load a preset…")).toBe(presets);
    expect(button("Only cards I own").getAttribute("aria-pressed")).toBe(
      "true"
    );
  });

  it("replaces a preset saved again under the same name and moves it to the end of the list", async () => {
    localStorage.setItem(
      PRESETS_KEY,
      JSON.stringify([
        {
          name: "Wipes",
          filters: { ...PAGE_DEFAULTS, interactionType: "wipe" },
        },
        { name: "Ramp", filters: PAGE_DEFAULTS },
      ])
    );
    const panel = renderPanel();

    await panel.user.click(button("White"));
    await panel.user.type(screen.getByPlaceholderText("Preset name…"), "Wipes");
    await panel.user.click(button("Save"));

    const stored: unknown = JSON.parse(
      localStorage.getItem(PRESETS_KEY) ?? "null"
    );
    expect(stored).toEqual([
      { name: "Ramp", filters: PAGE_DEFAULTS },
      {
        name: "Wipes",
        filters: { ...PAGE_DEFAULTS, colors: ["W"], colorlessFilter: false },
      },
    ]);
  });

  it("shows no preset list while nothing is saved, and when the stored value is not JSON", () => {
    const empty = renderPanel();
    expect(screen.queryByDisplayValue("Load a preset…")).toBeNull();
    empty.unmount();

    localStorage.setItem(PRESETS_KEY, "{not json");
    renderPanel();
    expect(screen.queryByDisplayValue("Load a preset…")).toBeNull();
  });
});
