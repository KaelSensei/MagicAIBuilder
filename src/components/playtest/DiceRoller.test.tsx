import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";
import { DiceRoller } from "./DiceRoller";

describe("DiceRoller", () => {
  it("offers d6 and d20 rolls", () => {
    const onRoll = vi.fn();
    renderWithIntl(<DiceRoller rolls={[]} onRoll={onRoll} />);

    fireEvent.click(screen.getByRole("button", { name: /d6/i }));
    fireEvent.click(screen.getByRole("button", { name: /d20/i }));

    expect(onRoll).toHaveBeenNthCalledWith(1, 6);
    expect(onRoll).toHaveBeenNthCalledWith(2, 20);
  });

  it("shows the latest result", () => {
    renderWithIntl(
      <DiceRoller rolls={[{ sides: 6, result: 2 }, { sides: 20, result: 17 }]} onRoll={vi.fn()} />
    );
    expect(screen.getByLabelText(/latest die result/i)).toHaveTextContent("d2017");
  });
});
