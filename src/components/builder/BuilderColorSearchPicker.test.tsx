import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithIntl } from "@/test/render-with-intl";
import { BuilderColorSearchPicker } from "./BuilderColorSearchPicker";

const HINT_FR = "Sélectionnez des couleurs pour parcourir les cartes";

describe("BuilderColorSearchPicker", () => {
  it("names each colour toggle in the reader's locale", () => {
    renderWithIntl(
      <BuilderColorSearchPicker
        selected={[]}
        hasNameFilter={false}
        onToggle={vi.fn()}
      />,
      { locale: "fr" }
    );

    const toggles = screen.getAllByRole("button");
    expect(toggles.map((toggle) => toggle.getAttribute("title"))).toEqual([
      "Blanc",
      "Bleu",
      "Noir",
      "Rouge",
      "Vert",
      "Incolore",
    ]);
    expect(screen.getByRole("button", { name: "Incolore" })).toBeDefined();
    expect(screen.queryByRole("button", { name: "Colorless" })).toBeNull();
  });

  it("toggles the colour of the pressed button", () => {
    const onToggle = vi.fn();
    renderWithIntl(
      <BuilderColorSearchPicker
        selected={[]}
        hasNameFilter={false}
        onToggle={onToggle}
      />,
      { locale: "fr" }
    );

    fireEvent.click(screen.getByRole("button", { name: "Rouge" }));

    expect(onToggle).toHaveBeenCalledWith("R");
  });

  it("hints at picking a colour while nothing narrows the search", () => {
    renderWithIntl(
      <BuilderColorSearchPicker
        selected={[]}
        hasNameFilter={false}
        onToggle={vi.fn()}
      />,
      { locale: "fr" }
    );

    expect(screen.getByText(HINT_FR)).toBeDefined();
  });

  it.each([
    { narrowedBy: "a colour", selected: ["G"], hasNameFilter: false },
    { narrowedBy: "a name", selected: [], hasNameFilter: true },
  ])(
    "drops the hint once $narrowedBy narrows the search",
    ({ selected, hasNameFilter }) => {
      renderWithIntl(
        <BuilderColorSearchPicker
          selected={selected}
          hasNameFilter={hasNameFilter}
          onToggle={vi.fn()}
        />,
        { locale: "fr" }
      );

      expect(screen.queryByText(HINT_FR)).toBeNull();
    }
  );
});
