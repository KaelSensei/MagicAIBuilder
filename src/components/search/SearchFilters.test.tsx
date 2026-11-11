import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SearchFilters } from "./SearchFilters";
import { renderWithIntl } from "@/test/render-with-intl";
import type { SearchFilters as SearchFiltersValue } from "@/lib/deck/types";

const FILTERS: SearchFiltersValue = {
  colors: [], types: [], cmcMin: null, cmcMax: null, cmcExact: null,
  priceMin: null, priceMax: null, powerMin: null, powerMax: null,
  toughnessMin: null, toughnessMax: null, subtype: "", keyword: "", interactionType: null,
};

describe("SearchFilters", () => {
  it("labels USD-only price bounds explicitly", () => {
    renderWithIntl(<SearchFilters filters={FILTERS} onChange={vi.fn()} />);
    expect(screen.getByText("Price (USD)")).toBeDefined();
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
});
