import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAIDeckBuild } from "./useAIDeckBuild";

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
});
