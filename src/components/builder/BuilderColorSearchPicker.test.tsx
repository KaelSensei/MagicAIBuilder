import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithIntl } from "@/test/render-with-intl";
import { BuilderColorSearchPicker } from "./BuilderColorSearchPicker";

describe("BuilderColorSearchPicker", () => {
  it("names each colour toggle in the reader's locale", () => {
    renderWithIntl(
      <BuilderColorSearchPicker selected={[]} onToggle={vi.fn()} />,
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
      <BuilderColorSearchPicker selected={[]} onToggle={onToggle} />,
      { locale: "fr" }
    );

    fireEvent.click(screen.getByRole("button", { name: "Rouge" }));

    expect(onToggle).toHaveBeenCalledWith("R");
  });
});
