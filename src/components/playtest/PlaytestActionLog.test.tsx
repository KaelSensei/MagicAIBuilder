import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render-with-intl";
import { PlaytestActionLog } from "./PlaytestActionLog";

describe("PlaytestActionLog", () => {
  it("shows localized turn and phase names in French", () => {
    renderWithIntl(
      <PlaytestActionLog deckName="Test" entries={[{ id: 1, turn: 2, phase: "Main1", description: "Made mana" }]} onAdd={vi.fn()} onEdit={vi.fn()} onRemove={vi.fn()} />,
      { locale: "fr" }
    );

    expect(screen.getByText("Tour 2 · Principale 1")).toBeInTheDocument();
  });

  it("copies a French-labeled text log without rewriting the action description", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    renderWithIntl(
      <PlaytestActionLog deckName="Test" entries={[{ id: 1, turn: 2, phase: "Main1", description: "Made mana" }]} onAdd={vi.fn()} onEdit={vi.fn()} onRemove={vi.fn()} />,
      { locale: "fr" }
    );

    fireEvent.click(screen.getByRole("button", { name: "Copier le journal" }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith("Test — Journal des actions\n\nTour 2\n- Principale 1: Made mana");
    });
  });


  it("copies the exported playtest log", async () => {
    const entries = [{ id: 1, turn: 2, phase: "Main1", description: "Made mana" }] as const;
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    renderWithIntl(<PlaytestActionLog deckName="Test" entries={entries} onAdd={vi.fn()} onEdit={vi.fn()} onRemove={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Copy log" }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith("Test — Action log\n\nTurn 2\n- Main 1: Made mana");
    });
  });

  it("explains when the browser blocks clipboard access", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error("blocked")) },
    });
    renderWithIntl(<PlaytestActionLog deckName="Test" entries={[{ id: 1, turn: 1, phase: "Draw", description: "Drew a card" }]} onAdd={vi.fn()} onEdit={vi.fn()} onRemove={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Copy log" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Could not copy the log. Download the text file instead.");
  });

  it("focuses an explicitly edited action without scrolling the viewport", () => {
    renderWithIntl(<PlaytestActionLog deckName="Test" entries={[{ id: 1, turn: 2, phase: "Main1", description: "Made mana" }]} onAdd={vi.fn()} onEdit={vi.fn()} onRemove={vi.fn()} />);
    const focus = vi.spyOn(HTMLElement.prototype, "focus");
    try {
      fireEvent.click(screen.getByRole("button", { name: /^edit$/i }));
      expect(screen.getByLabelText(/edit action/i)).toHaveFocus();
      expect(focus).toHaveBeenCalledWith({ preventScroll: true });
    } finally {
      focus.mockRestore();
    }
  });
  it("cancels an edited action with Escape without saving it", () => {
    const onEdit = vi.fn();
    renderWithIntl(<PlaytestActionLog deckName="Test" entries={[{ id: 1, turn: 2, phase: "Main1", description: "Made mana" }]} onAdd={vi.fn()} onEdit={onEdit} onRemove={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /^edit$/i }));
    const input = screen.getByLabelText(/edit action/i);
    fireEvent.change(input, { target: { value: "Changed mana" } });
    fireEvent.keyDown(input, { key: "Escape" });

    expect(screen.queryByLabelText(/edit action/i)).not.toBeInTheDocument();
    expect(screen.getByText("Made mana")).toBeInTheDocument();
    expect(onEdit).not.toHaveBeenCalled();
  });
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
