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

  // WCAG 2.2 SC 4.1.2: the panel on screen was shown by its fill colour alone.
  it("presses the tab of the panel on screen, and only that one", () => {
    renderWithIntl(
      <BuilderMobileTabBar activePanel="deck" onSelect={vi.fn()} />
    );

    expect(screen.getAllByRole("button", { pressed: true })).toEqual([
      screen.getByRole("button", { name: "Deck" }),
    ]);
  });

  // Design audit S3: a 2 px bar on top of the active tab marks it without
  // colour alone, every tab is a 48 px target, and the bar pads itself by the
  // iOS home indicator's inset.
  it("marks the active tab with a top bar and clears the home indicator", () => {
    renderWithIntl(
      <BuilderMobileTabBar activePanel="deck" onSelect={vi.fn()} />
    );

    const deck = screen.getByRole("button", { name: "Deck" });
    expect(deck).toHaveClass(
      "min-h-12",
      "before:absolute",
      "before:inset-x-3",
      "before:top-0",
      "before:h-0.5",
      "before:bg-[var(--accent-text)]"
    );
    const search = screen.getByRole("button", { name: "Search" });
    expect(search).toHaveClass("min-h-12");
    expect(search).not.toHaveClass("before:h-0.5");
    expect(deck.parentElement).toHaveClass("pb-[env(safe-area-inset-bottom)]");
  });
});
