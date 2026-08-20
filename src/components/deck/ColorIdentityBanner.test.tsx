import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { ColorIdentityBanner } from "./ColorIdentityBanner";
import enBuilder from "@/messages/en/builder.json";

function renderWithIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={{ builder: enBuilder }}>
      {ui}
    </NextIntlClientProvider>
  );
}

describe("ColorIdentityBanner", () => {
  it("renders one mana symbol per identity color", () => {
    renderWithIntl(
      <ColorIdentityBanner
        name="Tatyova"
        colorIdentity={["G", "U"]}
        onRemove={vi.fn()}
        label="CMD"
      />
    );

    expect(screen.getByRole("img", { name: "Green mana symbol" })).toBeDefined();
    expect(screen.getByRole("img", { name: "Blue mana symbol" })).toBeDefined();
  });

  it("falls back to a colorless identity banner", () => {
    renderWithIntl(
      <ColorIdentityBanner
        name="Kozilek"
        colorIdentity={[]}
        onRemove={vi.fn()}
      />
    );

    expect(screen.getByRole("img", { name: "Colorless mana symbol" })).toBeDefined();
  });

  it("calls onRemove when the banner close button is clicked", () => {
    const onRemove = vi.fn();
    renderWithIntl(
      <ColorIdentityBanner
        name="Atraxa"
        colorIdentity={["W", "U", "B", "G"]}
        onRemove={onRemove}
        label="CMD"
      />
    );

    fireEvent.click(screen.getByTitle("Remove Atraxa"));
    expect(onRemove).toHaveBeenCalledOnce();
  });

  /**
   * `getDisplayColorIdentity` normalises before rendering, and none of that was
   * covered — the identity arrives from deck data and from imports, so it is
   * not guaranteed to be clean uppercase symbols.
   */
  describe("normalising the identity", () => {
    it("accepts lowercase symbols, which imports can produce", () => {
      renderWithIntl(
        <ColorIdentityBanner name="Tatyova" colorIdentity={["g", "u"]} onRemove={vi.fn()} />
      );

      expect(screen.getByRole("img", { name: "Green mana symbol" })).toBeDefined();
      expect(screen.getByRole("img", { name: "Blue mana symbol" })).toBeDefined();
    });

    it("draws one pip per colour when the identity repeats one", () => {
      renderWithIntl(
        <ColorIdentityBanner name="Krenko" colorIdentity={["R", "R", "r"]} onRemove={vi.fn()} />
      );

      expect(screen.getAllByRole("img", { name: "Red mana symbol" })).toHaveLength(1);
    });

    it("ignores symbols that are not mana colours instead of rendering a broken pip", () => {
      renderWithIntl(
        <ColorIdentityBanner name="Odd" colorIdentity={["G", "X", "5", ""]} onRemove={vi.fn()} />
      );

      expect(screen.getByRole("img", { name: "Green mana symbol" })).toBeDefined();
      expect(screen.getAllByRole("img")).toHaveLength(1);
    });

    it("falls back to colourless when every symbol is unusable", () => {
      renderWithIntl(
        <ColorIdentityBanner name="Odd" colorIdentity={["X", "?"]} onRemove={vi.fn()} />
      );

      expect(screen.getByRole("img", { name: "Colorless mana symbol" })).toBeDefined();
    });

    it("keeps the identity's own order rather than sorting it", () => {
      renderWithIntl(
        <ColorIdentityBanner name="Atraxa" colorIdentity={["G", "W", "U"]} onRemove={vi.fn()} />
      );

      const names = screen.getAllByRole("img").map((img) => img.getAttribute("alt"));
      expect(names).toEqual([
        "Green mana symbol",
        "White mana symbol",
        "Blue mana symbol",
      ]);
    });
  });

  it("renders without a label when none is given", () => {
    renderWithIntl(
      <ColorIdentityBanner name="Kozilek" colorIdentity={["C"]} onRemove={vi.fn()} />
    );

    expect(screen.getByTitle("Remove Kozilek")).toBeDefined();
  });
});
