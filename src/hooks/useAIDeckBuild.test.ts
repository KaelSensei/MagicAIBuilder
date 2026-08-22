import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAIDeckBuild, countCopies } from "./useAIDeckBuild";
import type { BuildResult } from "./useAIDeckBuild";

function makeStream(lines: string[]) {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const line of lines) {
        controller.enqueue(encoder.encode(line + "\n"));
      }
      controller.close();
    },
  });
}

describe("useAIDeckBuild", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("starts with empty state", () => {
    const { result } = renderHook(() => useAIDeckBuild());
    expect(result.current.state.isLoading).toBe(false);
    expect(result.current.state.error).toBeNull();
    expect(result.current.state.cards).toHaveLength(0);
    expect(result.current.state.commander).toBeNull();
  });

  it("exposes build and reset functions", () => {
    const { result } = renderHook(() => useAIDeckBuild());
    expect(typeof result.current.build).toBe("function");
    expect(typeof result.current.reset).toBe("function");
  });

  it("reset clears state", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(() => new Promise(() => {}))
    );

    const { result } = renderHook(() => useAIDeckBuild());

    act(() => {
      void result.current.build({
        colors: ["W", "U"],
        strategy: "control",
        bracket: 2,
        commanderName: null,
        budget: null,
      });
    });

    expect(result.current.state.isLoading).toBe(true);

    act(() => { result.current.reset(); });
    expect(result.current.state.isLoading).toBe(false);
    expect(result.current.state.cards).toHaveLength(0);
    vi.unstubAllGlobals();
  });

  it("sets error when fetch fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500 })
    );

    const { result } = renderHook(() => useAIDeckBuild());

    await act(async () => {
      await result.current.build({
        colors: ["G"],
        strategy: "ramp",
        bracket: 1,
        commanderName: null,
        budget: null,
      });
    });

    expect(result.current.state.error).toContain("500");
    expect(result.current.state.isLoading).toBe(false);
    vi.unstubAllGlobals();
  });

  it("processes status events from stream", async () => {
    const events = [
      JSON.stringify({ type: "status", message: "Analyzing colors..." }),
      JSON.stringify({ type: "commander", name: "Atraxa" }),
      JSON.stringify({ type: "done" }),
    ];

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        body: makeStream(events),
      })
    );

    const { result } = renderHook(() => useAIDeckBuild());

    await act(async () => {
      await result.current.build({
        colors: ["W", "U", "B", "G"],
        strategy: "proliferate",
        bracket: 2,
        commanderName: "Atraxa",
        budget: null,
      });
    });

    expect(result.current.state.commander).toBe("Atraxa");
    expect(result.current.state.statusMessages).toContain("Analyzing colors...");
    expect(result.current.state.isLoading).toBe(false);
    vi.unstubAllGlobals();
  });

  it("processes card events from stream", async () => {
    const events = [
      JSON.stringify({ type: "card", name: "Sol Ring", category: "ramp" }),
      JSON.stringify({ type: "card", name: "Counterspell", category: "removal" }),
      JSON.stringify({ type: "card", name: "Lightning Bolt", category: "removal" }),
      JSON.stringify({ type: "card", name: "Island", category: "land" }),
      JSON.stringify({ type: "card", name: "Forest", category: "land" }),
      JSON.stringify({ type: "done" }),
    ];

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        body: makeStream(events),
      })
    );

    const { result } = renderHook(() => useAIDeckBuild());

    await act(async () => {
      await result.current.build({
        colors: ["U", "G"],
        strategy: "simic",
        bracket: 2,
        commanderName: null,
        budget: null,
      });
    });

    expect(result.current.state.cards.length).toBeGreaterThan(0);
    vi.unstubAllGlobals();
  });

  it("returns the commander with the result instead of only the card list", async () => {
    const events = [
      JSON.stringify({ type: "commander", name: "Muldrotha, the Gravetide" }),
      JSON.stringify({ type: "card", name: "Sol Ring", category: "ramp", quantity: 1 }),
      JSON.stringify({ type: "done", totalCards: 1, source: "ai" }),
    ];
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, body: makeStream(events) }));

    const { result } = renderHook(() => useAIDeckBuild());
    let built: BuildResult | null = null;
    await act(async () => {
      built = await result.current.build({
        colors: ["U", "B", "G"],
        strategy: "graveyard",
        bracket: 3,
        commanderName: null,
        budget: null,
      });
    });

    expect(built).not.toBeNull();
    expect(built!.commander).toBe("Muldrotha, the Gravetide");
    expect(built!.source).toBe("ai");
    vi.unstubAllGlobals();
  });

  it("keeps card quantities so basics are not collapsed to singletons", async () => {
    const events = [
      JSON.stringify({ type: "card", name: "Island", category: "land", quantity: 12 }),
      JSON.stringify({ type: "card", name: "Sol Ring", category: "ramp", quantity: 1 }),
      JSON.stringify({ type: "done", totalCards: 13, source: "ai" }),
    ];
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, body: makeStream(events) }));

    const { result } = renderHook(() => useAIDeckBuild());
    await act(async () => {
      await result.current.build({
        colors: ["U"],
        strategy: "control",
        bracket: 2,
        commanderName: null,
        budget: null,
      });
    });

    expect(countCopies(result.current.state.cards)).toBe(13);
    expect(result.current.state.totalCards).toBe(13);
    vi.unstubAllGlobals();
  });

  it("defaults a missing quantity to one copy", async () => {
    const events = [
      JSON.stringify({ type: "card", name: "Sol Ring", category: "ramp" }),
      JSON.stringify({ type: "done", totalCards: 1, source: "ai" }),
    ];
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, body: makeStream(events) }));

    const { result } = renderHook(() => useAIDeckBuild());
    await act(async () => {
      await result.current.build({
        colors: ["W"],
        strategy: "aggro",
        bracket: 2,
        commanderName: null,
        budget: null,
      });
    });

    expect(result.current.state.cards[0]?.quantity).toBe(1);
    vi.unstubAllGlobals();
  });

  it("reports demo mode so the UI can warn the user", async () => {
    const events = [
      JSON.stringify({ type: "card", name: "Sol Ring", category: "ramp", quantity: 1 }),
      JSON.stringify({ type: "done", totalCards: 1, source: "demo" }),
    ];
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, body: makeStream(events) }));

    const { result } = renderHook(() => useAIDeckBuild());
    let built: BuildResult | null = null;
    await act(async () => {
      built = await result.current.build({
        colors: ["R"],
        strategy: "aggro",
        bracket: 2,
        commanderName: null,
        budget: null,
      });
    });

    expect(built!.source).toBe("demo");
    expect(result.current.state.source).toBe("demo");
    vi.unstubAllGlobals();
  });

  it("errors when the stream is cut short instead of importing a partial deck", async () => {
    const events = [
      JSON.stringify({ type: "commander", name: "Atraxa, Praetors' Voice" }),
      JSON.stringify({ type: "card", name: "Sol Ring", category: "ramp", quantity: 1 }),
      // no "done" event — the platform killed the function mid-stream
    ];
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, body: makeStream(events) }));

    const { result } = renderHook(() => useAIDeckBuild());
    let built: BuildResult | null = null;
    await act(async () => {
      built = await result.current.build({
        colors: ["W", "U", "B", "G"],
        strategy: "midrange",
        bracket: 2,
        commanderName: null,
        budget: null,
      });
    });

    expect(built).toBeNull();
    expect(result.current.state.error).toBe("The AI build ended early");
    expect(result.current.state.isLoading).toBe(false);
    vi.unstubAllGlobals();
  });
});
