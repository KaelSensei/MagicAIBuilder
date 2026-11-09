import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithIntl } from "@/test/render-with-intl";
import { BuilderMobileTabBar } from "./BuilderMobileTabBar";

describe("BuilderMobileTabBar", () => {
  it("names its tabs in the reader's locale", () => {
    renderWithIntl(
      <BuilderMobileTabBar activePanel="deck" onSelect={vi.fn()} />,
      { locale: "fr" }
    );

    const names = screen.getAllByRole("button").map((tab) => tab.textContent);
    expect(names).toEqual(["Recherche", "Deck", "Stats"]);
    expect(screen.queryByRole("button", { name: "Search" })).toBeNull();
  });

  it("selects the panel of the pressed tab", () => {
    const onSelect = vi.fn();
    renderWithIntl(
      <BuilderMobileTabBar activePanel="deck" onSelect={onSelect} />,
      { locale: "fr" }
    );

    fireEvent.click(screen.getByRole("button", { name: "Recherche" }));

    expect(onSelect).toHaveBeenCalledWith("search");
  });
});
