import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";
import { PlaytestActionLog } from "./PlaytestActionLog";

describe("PlaytestActionLog", () => {
  it("adds a manual entry", () => {
    const onAdd = vi.fn();
    renderWithIntl(<PlaytestActionLog deckName="Test" entries={[]} onAdd={onAdd} onEdit={vi.fn()} onRemove={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/record a manual action/i), { target: { value: "Made mana" } });
    fireEvent.click(screen.getByRole("button", { name: /add action/i }));
    expect(onAdd).toHaveBeenCalledWith("Made mana");
  });

  it("edits and removes an existing entry", () => {
    const onEdit = vi.fn();
    const onRemove = vi.fn();
    renderWithIntl(
      <PlaytestActionLog
        deckName="Test"
        entries={[{ id: 1, turn: 2, phase: "Main1", description: "Made mana" }]}
        onAdd={vi.fn()}
        onEdit={onEdit}
        onRemove={onRemove}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /^edit$/i }));
    const input = screen.getByLabelText(/edit action/i);
    fireEvent.change(input, { target: { value: "Made three mana" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onEdit).toHaveBeenCalledWith(1, "Made three mana");
    fireEvent.click(screen.getByRole("button", { name: /remove action/i }));
    expect(onRemove).toHaveBeenCalledWith(1);
  });

  it("records mana with a number instead of inferring it from free text", () => {
    const onRecordMana = vi.fn();
    renderWithIntl(<PlaytestActionLog deckName="Test" entries={[]} onAdd={vi.fn()} onEdit={vi.fn()} onRemove={vi.fn()} onRecordMana={onRecordMana} />);
    fireEvent.change(screen.getByLabelText("Mana amount"), { target: { value: "3" } });
    fireEvent.click(screen.getByRole("button", { name: "Record mana" }));
    expect(onRecordMana).toHaveBeenCalledWith(3);
  });

  it("shows turn evidence without counting unstructured notes", () => {
    renderWithIntl(<PlaytestActionLog deckName="Test" entries={[
      { id: 1, turn: 1, phase: "Draw", description: "Drew a card", kind: "draw" },
      { id: 2, turn: 1, phase: "Main1", description: "Produced mana", kind: "mana", amount: 2 },
    ]} onAdd={vi.fn()} onEdit={vi.fn()} onRemove={vi.fn()} />);
    expect(screen.getByText((_, element) => element?.tagName === "P" && element.textContent?.includes("Turn 1 · 1 draw · 2 mana · 1 card seen") === true)).toBeDefined();
  });
});
