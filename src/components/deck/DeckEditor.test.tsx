import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ColorIdentityBanner } from "./DeckEditor";

describe("ColorIdentityBanner", () => {
  it("renders one mana symbol per identity color", () => {
    render(
      <ColorIdentityBanner
        name="Tatyova"
        colorIdentity={["G", "U"]}
        onRemove={vi.fn()}
        label="CMD"
      />
    );

    expect(screen.getByLabelText("{G}")).toBeDefined();
    expect(screen.getByLabelText("{U}")).toBeDefined();
  });

  it("falls back to a colorless identity banner", () => {
    render(
      <ColorIdentityBanner
        name="Kozilek"
        colorIdentity={[]}
        onRemove={vi.fn()}
      />
    );

    expect(screen.getByLabelText("{C}")).toBeDefined();
  });

  it("calls onRemove when the banner close button is clicked", () => {
    const onRemove = vi.fn();
    render(
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
