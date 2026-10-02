import { afterEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithIntl } from "@/test/render-with-intl";
import { PrintingDeckUsage } from "./PrintingDeckUsage";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, onClick, className }: {
    href: string;
    children: string;
    onClick?: () => void;
    className?: string;
  }) => <a href={href} onClick={onClick} className={className}>{children}</a>,
}));

afterEach(() => vi.unstubAllGlobals());

describe("PrintingDeckUsage", () => {
  it("loads exact-printing usage on demand and links to the player's decks", async () => {
    const fetchUsage = vi.fn().mockResolvedValue(new Response(JSON.stringify({ usages: [
      { deckId: "deck-a", deckName: "Artifacts", quantity: 1, zone: "main" },
      { deckId: "deck-b", deckName: "Spells", quantity: 2, zone: "sideboard" },
    ] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchUsage);
    const user = userEvent.setup();

    renderWithIntl(<PrintingDeckUsage scryfallId="printing-a" cardName="Sol Ring" />);
    expect(fetchUsage).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Decks using Sol Ring" }));

    expect(await screen.findByRole("link", { name: /Artifacts/ })).toHaveAttribute("href", "/builder/deck-a");
    expect(screen.getByRole("link", { name: /Spells/ })).toHaveAttribute("href", "/builder/deck-b");
    expect(screen.getByText("Sideboard · 2 copies")).toBeInTheDocument();
    expect(fetchUsage).toHaveBeenCalledWith("/api/collection/usage?scryfallId=printing-a", expect.objectContaining({ signal: expect.any(AbortSignal) }));
  });

  it("shows an empty state when no deck uses the printing", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ usages: [] }), { status: 200 })));
    const user = userEvent.setup();

    renderWithIntl(<PrintingDeckUsage scryfallId="printing-a" cardName="Sol Ring" />);
    await user.click(screen.getByRole("button", { name: "Decks using Sol Ring" }));
    expect(await screen.findByText("No deck uses this printing yet.")).toBeInTheDocument();
  });
});
