import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { ColorIdentityBanner } from "./DeckEditor";
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
});
