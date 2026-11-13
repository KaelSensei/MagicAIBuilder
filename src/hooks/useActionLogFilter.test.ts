import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { PlaytestActionLogEntry } from "@/lib/playtest/engine";
import { useActionLogFilter } from "./useActionLogFilter";

const ENTRIES: readonly PlaytestActionLogEntry[] = [
  {
    id: 1,
    turn: 2,
    phase: "Main1",
    description: "Second spell",
    kind: "mana",
    amount: 2,
  },
  { id: 2, turn: 1, phase: "Draw", description: "First draw", kind: "draw" },
  { id: 3, turn: 1, phase: "Main1", description: "First spell" },
  { id: 4, turn: 2, phase: "Draw", description: "Second draw" },
];

describe("useActionLogFilter", () => {
  it("starts on the whole log, with the turns sorted and the phases in log order", () => {
    const { result } = renderHook(() => useActionLogFilter(ENTRIES));

    expect(result.current.activeTurn).toBeNull();
    expect(result.current.activePhase).toBeNull();
    expect(result.current.turns).toEqual([1, 2]);
    expect(result.current.phases).toEqual(["Main1", "Draw"]);
    expect(result.current.visibleEntries).toBe(ENTRIES);
  });

  it("narrows the entries, the phases and the evidence to the selected turn", () => {
    const { result } = renderHook(() => useActionLogFilter(ENTRIES));

    act(() => result.current.selectTurn(1));

    expect(result.current.activeTurn).toBe(1);
    expect(result.current.visibleEntries.map((entry) => entry.id)).toEqual([
      2, 3,
    ]);
    expect(result.current.phases).toEqual(["Draw", "Main1"]);
    expect(
      result.current.visibleSummaries.map((summary) => summary.turn)
    ).toEqual([1]);
  });

  it("narrows the entries to the selected phase of the selected turn", () => {
    const { result } = renderHook(() => useActionLogFilter(ENTRIES));

    act(() => result.current.selectTurn(2));
    act(() => result.current.selectPhase("Draw"));

    expect(result.current.activePhase).toBe("Draw");
    expect(result.current.visibleEntries.map((entry) => entry.id)).toEqual([4]);
  });

  it("forgets the phase when another turn is selected", () => {
    const { result } = renderHook(() => useActionLogFilter(ENTRIES));

    act(() => result.current.selectTurn(1));
    act(() => result.current.selectPhase("Draw"));
    act(() => result.current.selectTurn(2));

    expect(result.current.activePhase).toBeNull();
    expect(result.current.visibleEntries.map((entry) => entry.id)).toEqual([
      1, 4,
    ]);
  });

  it("shows the whole log again when the turn is cleared", () => {
    const { result } = renderHook(() => useActionLogFilter(ENTRIES));

    act(() => result.current.selectTurn(1));
    act(() => result.current.selectTurn(null));

    expect(result.current.activeTurn).toBeNull();
    expect(result.current.visibleEntries).toHaveLength(4);
  });

  it("keeps only the turns with structured evidence in the summaries", () => {
    const { result } = renderHook(() => useActionLogFilter(ENTRIES));

    expect(
      result.current.visibleSummaries.map((summary) => summary.turn)
    ).toEqual([1, 2]);

    const { result: notesOnly } = renderHook(() =>
      useActionLogFilter([
        { id: 9, turn: 3, phase: "End", description: "A note" },
      ])
    );
    expect(notesOnly.current.visibleSummaries).toEqual([]);
  });

  it("drops a selection the log no longer contains without losing the one it does", () => {
    const { result, rerender } = renderHook(
      ({ entries }: { readonly entries: readonly PlaytestActionLogEntry[] }) =>
        useActionLogFilter(entries),
      { initialProps: { entries: ENTRIES } }
    );

    act(() => result.current.selectTurn(2));
    act(() => result.current.selectPhase("Main1"));
    rerender({ entries: ENTRIES.filter((entry) => entry.id !== 1) });

    expect(result.current.activeTurn).toBe(2);
    expect(result.current.activePhase).toBeNull();
    expect(result.current.visibleEntries.map((entry) => entry.id)).toEqual([4]);
  });
});
