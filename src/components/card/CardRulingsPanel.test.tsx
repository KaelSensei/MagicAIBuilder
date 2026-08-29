import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl as render } from "@/test/render-with-intl";
import { getCardRulings } from "@/lib/scryfall/rulings";
import { CardRulingsPanel } from "./CardRulingsPanel";

vi.mock("@/lib/scryfall/rulings", () => ({ getCardRulings: vi.fn() }));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("CardRulingsPanel", () => {
  it("loads rulings on demand and identifies an offline cached result", async () => {
    vi.mocked(getCardRulings).mockResolvedValue({
      source: "cache",
      rulings: [
        {
          source: "wotc",
          publishedAt: "2024-01-12",
          comment: "This is the current ruling.",
        },
      ],
    });
    const user = userEvent.setup();

    render(<CardRulingsPanel cardId="card-1" />);
    await user.click(screen.getByRole("button", { name: "Show rulings" }));

    expect(getCardRulings).toHaveBeenCalledWith("card-1");
    expect(screen.getByText("This is the current ruling.")).toBeInTheDocument();
    expect(screen.getByText("Saved offline")).toBeInTheDocument();
  });
});
