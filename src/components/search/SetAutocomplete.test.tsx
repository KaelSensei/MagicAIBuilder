import { afterEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { screen } from "@testing-library/react";
import { renderWithIntl } from "@/test/render-with-intl";
import { SetAutocomplete } from "./SetAutocomplete";

/** More sets than the 12-row list shows, so the "type to search" hint appears. */
const SETS = Array.from({ length: 13 }, (_, index) => ({
  code: `s${index}`,
  name: `Set ${index}`,
  set_type: "expansion",
  released_at: "2026-01-01",
  card_count: 100,
}));

afterEach(() => {
  vi.restoreAllMocks();
});

// WCAG 2.2 SC 1.3.1 and 4.1.2: a placeholder is not a label, so the set
// search box of the builder's By Set mode carries its own name.
describe("SetAutocomplete field name", () => {
  it("names the set search box for a screen reader", () => {
    renderWithIntl(
      <SetAutocomplete value="" onChange={vi.fn()} onClear={vi.fn()} />
    );

    expect(
      screen.getByRole("textbox", { name: "Search sets" })
    ).toHaveAttribute("placeholder", "Search set (e.g. dsk, mh3…)");
  });

  it("names the set search box in French", () => {
    renderWithIntl(
      <SetAutocomplete value="" onChange={vi.fn()} onClear={vi.fn()} />,
      { locale: "fr" }
    );

    expect(
      screen.getByRole("textbox", { name: "Rechercher une édition" })
    ).toBeInTheDocument();
  });
});

describe("SetAutocomplete in French", () => {
  it("counts the available sets before the reader types", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ data: SETS }), { status: 200 })
    );
    renderWithIntl(
      <SetAutocomplete value="" onChange={vi.fn()} onClear={vi.fn()} />,
      { locale: "fr" }
    );

    await user.click(screen.getByRole("textbox"));

    expect(
      await screen.findByText("13 éditions disponibles — tapez pour rechercher")
    ).toBeInTheDocument();
  });
});
