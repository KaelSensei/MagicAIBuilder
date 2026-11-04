import { screen } from "@testing-library/react";
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
});
