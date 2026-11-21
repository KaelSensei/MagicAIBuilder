import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { aDeckCard } from "@/test/builders/card";
import { renderWithProviders } from "@/test/render";
import { GroupPriceSubtotal } from "./GroupPriceSubtotal";

function renderInButton(cards: Parameters<typeof GroupPriceSubtotal>[0]["cards"], locale: "en" | "fr" = "en") {
  return renderWithProviders(
    <button type="button">
      <GroupPriceSubtotal cards={cards} />
    </button>,
    { locale }
  );
}

describe("GroupPriceSubtotal", () => {
  it("hides the terse figure from screen readers and speaks a sentence instead", () => {
    renderInButton([aDeckCard({ price: 4.5, quantity: 2 })]);

    expect(screen.getByRole("button")).toHaveAccessibleName(/^Subtotal USD\s9\.00$/);
    expect(screen.getByText(/· USD\s9\.00/)).toHaveAttribute("aria-hidden", "true");
  });

  it("counts one unpriced copy in the singular", () => {
    renderInButton([
      aDeckCard({ id: "a", price: 3 }),
      aDeckCard({ id: "b", price: null }),
    ]);

    expect(screen.getByRole("button")).toHaveAccessibleName(
      /^Known subtotal USD\s3\.00, 1 card without price$/
    );
  });

  it("says in words that a group without any price has no subtotal", () => {
    renderInButton([aDeckCard({ price: null })]);

    expect(screen.getByRole("button")).toHaveAccessibleName(
      "Subtotal unknown: no card in this group has a price"
    );
  });

  it("writes the subtotal in French", () => {
    renderInButton(
      [aDeckCard({ id: "a", price: 12.4 }), aDeckCard({ id: "b", price: null, quantity: 2 })],
      "fr"
    );

    expect(screen.getByText(/12,40\s*USD · 2 sans prix/)).toBeInTheDocument();
    expect(screen.getByRole("button")).toHaveAccessibleName(/^Sous-total connu .*2 cartes sans prix$/);
  });
});
