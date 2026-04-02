import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { BanlistAlert } from "./BanlistAlert";

describe("BanlistAlert", () => {
  it("renders collapsed by default and expands on click", () => {
    render(
      <BanlistAlert
        bannedCards={["Black Lotus"]}
        colorViolations={["Lightning Bolt"]}
      />
    );

    // collapsed: details not shown
    expect(screen.queryByText(/banned in commander/i)).toBeNull();
    expect(screen.queryByText(/color identity violations/i)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /toggle deck warnings/i }));
    expect(screen.getByText(/banned in commander/i)).toBeDefined();
    expect(screen.getByText(/color identity violations/i)).toBeDefined();
  });

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
