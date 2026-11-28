import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { focusTabStopAfter } from "./zone-menu-focus";

describe("focusTabStopAfter", () => {
  it("moves focus to the first tab stop after the anchor", () => {
    render(
      <>
        <button type="button">More zones</button>
        <span>Sol Ring</span>
        <button type="button">Next result</button>
      </>
    );

    const moved = focusTabStopAfter(
      screen.getByRole("button", { name: "More zones" })
    );

    expect(moved).toBe(true);
    expect(screen.getByRole("button", { name: "Next result" })).toHaveFocus();
  });

  it("moves nothing when the anchor is not a tab stop itself", () => {
    render(
      <>
        <span>Sol Ring</span>
        <button type="button">Next result</button>
      </>
    );

    const moved = focusTabStopAfter(screen.getByText("Sol Ring"));

    expect(moved).toBe(false);
    expect(document.body).toHaveFocus();
  });
});
