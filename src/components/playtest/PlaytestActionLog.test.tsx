import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";
import { PlaytestActionLog } from "./PlaytestActionLog";

describe("PlaytestActionLog", () => {
  it("adds a manual entry", () => {
    const onAdd = vi.fn();
    renderWithIntl(<PlaytestActionLog entries={[]} onAdd={onAdd} onEdit={vi.fn()} onRemove={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/record a manual action/i), { target: { value: "Made mana" } });
    fireEvent.click(screen.getByRole("button", { name: /add action/i }));
    expect(onAdd).toHaveBeenCalledWith("Made mana");
  });

  it("edits and removes an existing entry", () => {
    const onEdit = vi.fn();
    const onRemove = vi.fn();
    renderWithIntl(
      <PlaytestActionLog
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
});
