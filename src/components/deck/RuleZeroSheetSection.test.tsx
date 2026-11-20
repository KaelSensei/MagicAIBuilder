/**
 * I-15 slice 1: opening the sheet loads it, and a signed-out player is told
 * to sign in instead of being shown a form.
 */
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RuleZeroSheetSection } from "@/components/deck/RuleZeroSheetSection";
import { renderWithIntl } from "@/test/render-with-intl";

const SHEET = {
  id: "sheet-1",
  deckId: "deck-1",
  speed: "core",
  winConditions: ["Combat damage"],
  combos: { present: false, note: "" },
  extraTurns: { present: false, note: "" },
  resourceDenial: { present: false, note: "" },
  proxyCount: 0,
  houseRules: "No mass land denial.",
  createdAt: "2026-11-20T12:00:00.000Z",
  updatedAt: "2026-11-20T12:00:00.000Z",
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("RuleZeroSheetSection", () => {
  it("does not fetch until the player opens the sheet, then shows the declared house rules", async () => {
    const fetchMock = vi.fn(async () => Response.json({ sheet: SHEET }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderWithIntl(<RuleZeroSheetSection deckId="deck-1" />);

    expect(fetchMock).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Rule 0 sheet" }));

    expect(
      await screen.findByRole("textbox", { name: "House rules" })
    ).toHaveValue("No mass land denial.");
    expect(fetchMock).toHaveBeenCalledWith("/api/decks/deck-1/rule-zero");
    expect(
      screen.queryByRole("button", { name: /share/i })
    ).not.toBeInTheDocument();
  });

  it("asks a signed-out player to sign in and does not show the form", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({ error: "Unauthorized" }, { status: 401 })
      )
    );
    const user = userEvent.setup();
    renderWithIntl(<RuleZeroSheetSection deckId="deck-1" />);

    await user.click(screen.getByRole("button", { name: "Rule 0 sheet" }));

    expect(
      await screen.findByText("Sign in to record a rule 0 sheet.")
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Save sheet" })
    ).not.toBeInTheDocument();
  });

  it("shows the empty state when the owner has no sheet", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ sheet: null }))
    );
    const user = userEvent.setup();
    renderWithIntl(<RuleZeroSheetSection deckId="deck-1" />);

    await user.click(screen.getByRole("button", { name: "Rule 0 sheet" }));

    expect(
      await screen.findByText(
        "No sheet yet. Record what you want the table to know."
      )
    ).toBeInTheDocument();
  });
});
