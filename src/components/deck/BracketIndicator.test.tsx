import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import enDeck from "@/messages/en/deck.json";
import type { BracketScore } from "@/lib/deck/types";
import { BracketIndicator } from "./BracketIndicator";

const score: BracketScore = {
  overall: 2,
  dimensions: { ramp: 2, draw: 3, removal: 1, tutors: 2, winSpeed: 1, avgCmc: 2 },
  gameChangers: 0,
  twoCardInfiniteCombos: 0,
  warnings: ["Color identity violations: Lightning Bolt"],
};

function renderWithIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={{ deck: enDeck }}>
      {ui}
    </NextIntlClientProvider>
  );
}

describe("BracketIndicator warnings", () => {
  it("dismisses the warning list and restores it on request", () => {
    renderWithIntl(<BracketIndicator score={score} />);

    expect(screen.getByText(/color identity violations/i)).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: /dismiss deck warnings/i }));
    expect(screen.queryByText(/color identity violations/i)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /toggle deck warnings/i }));
    expect(screen.getByText(/color identity violations/i)).toBeDefined();
  });

  it("shows changed warnings after the current list was dismissed", () => {
    const { rerender } = renderWithIntl(<BracketIndicator score={score} />);
    fireEvent.click(screen.getByRole("button", { name: /dismiss deck warnings/i }));

    rerender(
      <NextIntlClientProvider locale="en" messages={{ deck: enDeck }}>
        <BracketIndicator
          score={{ ...score, warnings: ["Deck has only 90/100 cards"] }}
        />
      </NextIntlClientProvider>
    );

    expect(screen.getByText(/deck has only 90\/100 cards/i)).toBeDefined();
  });
});
