import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DeckSaveIndicator } from "./DeckSaveIndicator";

describe("DeckSaveIndicator", () => {
  it("announces an active save without blocking the editor", () => {
    render(<DeckSaveIndicator saving label="Saving…" />);

    expect(screen.getByRole("status", { name: "Saving…" })).toHaveClass("opacity-100");
  });

  it("keeps its layout slot while idle without announcing a save", () => {
    render(<DeckSaveIndicator saving={false} label="Saving…" />);

    expect(screen.getByRole("status")).toHaveClass("opacity-0");
    expect(screen.getByRole("status")).not.toHaveAttribute("aria-label");
  });
});
