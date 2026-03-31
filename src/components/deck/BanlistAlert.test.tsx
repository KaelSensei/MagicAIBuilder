import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { BanlistAlert } from "./BanlistAlert";

describe("BanlistAlert", () => {
  it("renders the dismiss button when onDismiss is provided", () => {
    render(
      <BanlistAlert
        bannedCards={[]}
        colorViolations={["Lightning Bolt"]}
        onDismiss={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: /dismiss deck warnings/i })).toBeDefined();
  });

  it("calls onDismiss when the dismiss button is clicked", () => {
    const onDismiss = vi.fn();
    render(
      <BanlistAlert
        bannedCards={["Sol Ring"]}
        colorViolations={[]}
        onDismiss={onDismiss}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /dismiss deck warnings/i }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
