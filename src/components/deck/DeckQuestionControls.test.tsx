import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";
import { DeckQuestionControls } from "./DeckQuestionControls";

describe("DeckQuestionControls", () => {
  it("asks why the selected card belongs in the deck", () => {
    const onAsk = vi.fn();
    renderWithIntl(
      <DeckQuestionControls
        cardNames={["Arcane Signet", "Sol Ring"]}
        onAsk={onAsk}
      />
    );

    fireEvent.change(screen.getByLabelText(/card to explain/i), {
      target: { value: "Sol Ring" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /why is this card here/i })
    );

    expect(onAsk).toHaveBeenCalledWith({
      type: "why-card",
      cardName: "Sol Ring",
    });
  });

  it("asks for the weakest card without requiring a selection", () => {
    const onAsk = vi.fn();
    renderWithIntl(
      <DeckQuestionControls cardNames={["Sol Ring"]} onAsk={onAsk} />
    );

    fireEvent.click(screen.getByRole("button", { name: /find weakest card/i }));

    expect(onAsk).toHaveBeenCalledWith({ type: "weakest-card" });
  });
});
