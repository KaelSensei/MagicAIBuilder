import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { renderWithProviders } from "@/test/render";
import { setupMsw } from "@/test/msw";
import { QuickAddPaletteHost } from "./QuickAddPaletteHost";
import type { ScryfallCard } from "@/lib/scryfall/types";

const SIMIC = { legality: "commander", identityClause: "id<=UG" };
const searched: string[] = [];

const SOL_RING: ScryfallCard = {
  id: "sol",
  name: "Sol Ring",
  mana_cost: "{1}",
  cmc: 1,
  type_line: "Artifact",
  color_identity: [],
  prices: { usd: "1.50", usd_foil: null, eur: null },
};

function searchPage(cards: readonly ScryfallCard[]) {
  return {
    object: "list" as const,
    total_cards: cards.length,
    has_more: false,
    data: cards,
  };
}

const server = setupMsw(
  http.get("/api/cache/search", ({ request }) => {
    searched.push(new URL(request.url).searchParams.get("query") ?? "");
    const query = new URL(request.url).searchParams.get("query") ?? "";
    const cards = query.includes("name:/Sol/") ? [SOL_RING] : [];
    return HttpResponse.json({ hit: true, data: searchPage(cards) });
  })
);

describe("QuickAddPaletteHost", () => {
  beforeEach(() => {
    searched.length = 0;
  });

  it("opens with Ctrl+K and does not search a one-letter line", async () => {
    const user = userEvent.setup();
    renderWithProviders(<QuickAddPaletteHost scope={SIMIC} onAdd={vi.fn()} />);

    await user.keyboard("{Control>}k{/Control}");
    expect(screen.getByRole("dialog", { name: "Quick add" })).toBeTruthy();

    await user.type(screen.getByRole("combobox", { name: "Quick add" }), "s");
    expect(searched).toEqual([]);
    expect(screen.getByText("Type at least two letters.")).toBeTruthy();
  });

  it("runs the name query inside the commander's colours and adds on Enter", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    renderWithProviders(<QuickAddPaletteHost scope={SIMIC} onAdd={onAdd} />);

    await user.click(screen.getByRole("button", { name: "Quick add" }));
    await user.type(screen.getByRole("combobox", { name: "Quick add" }), "Sol");

    expect(await screen.findByRole("button", { name: /Sol Ring/ })).toBeTruthy();
    expect(searched.at(-1)).toBe("name:/Sol/ legal:commander id<=UG");

    await user.keyboard("{Enter}");
    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ name: "Sol Ring" }), "main");
    expect(screen.getByRole("dialog", { name: "Quick add" })).toBeTruthy();
  });

  it("says when the search fails and does not add a card", async () => {
    server.use(
      http.get("/api/cache/search", () => new HttpResponse(null, { status: 500 })),
      http.get("https://api.scryfall.com/cards/search", () => new HttpResponse(null, { status: 500 }))
    );
    const user = userEvent.setup();
    const onAdd = vi.fn();
    renderWithProviders(
      <QuickAddPaletteHost scope={{ legality: "commander", identityClause: "" }} onAdd={onAdd} />
    );

    await user.click(screen.getByRole("button", { name: "Quick add" }));
    await user.type(screen.getByRole("combobox", { name: "Quick add" }), "zz");

    expect(await screen.findByRole("alert", {}, { timeout: 8000 })).toHaveTextContent(
      "The search could not be completed."
    );
    await user.keyboard("{Enter}");
    expect(onAdd).not.toHaveBeenCalled();
  });
});
