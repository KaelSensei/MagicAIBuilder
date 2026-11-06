import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";
import { CombosPanel } from "./CombosPanel";

describe("CombosPanel", () => {
  it("discloses Commander Spellbook and when its results were observed", () => {
    renderWithIntl(
      <CombosPanel
        combos={[]}
        observedAt={new Date("2026-11-03T12:00:00.000Z")}
      />
    );

    expect(screen.getByText("Commander Spellbook")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Commander Spellbook results observed Nov 3, 2026")
    ).toBeInTheDocument();
  });
});
