import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithIntl } from "@/test/render-with-intl";
import { DeckZoneTab } from "./DeckZoneTab";

const droppableState = vi.hoisted(() => ({ isOver: false }));

vi.mock("@dnd-kit/core", () => ({
  useDroppable: () => ({ setNodeRef: vi.fn(), isOver: droppableState.isOver }),
}));

describe("DeckZoneTab", () => {
  it("keeps its dimensions stable while highlighting a cross-zone drop", () => {
    droppableState.isOver = true;

    renderWithIntl(
      <DeckZoneTab
        zone="sideboard"
        label="Sideboard"
        count={2}
        isActive={false}
        onSelect={vi.fn()}
      />
    );

    const tab = screen.getByRole("button", { name: "Sideboard (2)" });
    expect(tab).toHaveClass("after:outline-[var(--accent)]");
    expect(tab).toHaveClass("after:outline-offset-[-2px]");
    expect(tab).not.toHaveClass("ring-2", "border-[var(--accent)]");
  });
});
