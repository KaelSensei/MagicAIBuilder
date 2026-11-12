import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAISuggestions } from "./useAISuggestions";
import type { Deck } from "@/lib/deck/types";
import type { DeckStats, BracketScore } from "@/lib/deck/analysis-types";
import { aDeckCard } from "@/test/builders/card";
import { aDeck } from "@/test/builders/deck";

function makeDeck(): Deck {
  return aDeck({
    name: "Test",
    commander: aDeckCard({
      id: "c1",
      name: "Atraxa",
      colorIdentity: ["W", "U", "B", "G"],
    }),
    targetBracket: 2,
  });
}

function makeStats(): DeckStats {
  return {
    total: 0,
    creatures: 0,
    lands: 0,
    ramp: 0,
    draw: 0,
    removal: 0,
    boardWipes: 0,
    avgCmc: 0,
    gameChangersCount: 0,
    gameChangersList: [],
    themes: [],
  } as unknown as DeckStats;
}

function makeBracketScore(): BracketScore {
  return {
    overall: 2,
    dimensions: { ramp: 0, draw: 0, removal: 0, winSpeed: 0, avgCmc: 0 },
    gameChangers: 0,
    twoCardInfiniteCombos: 0,
    warnings: [],
  };
}

describe("useAISuggestions", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("starts with null result and not loading", () => {
    const { result } = renderHook(() => useAISuggestions());
    expect(result.current.result).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("exposes analyze and invalidateCache functions", () => {
    const { result } = renderHook(() => useAISuggestions());
    expect(typeof result.current.analyze).toBe("function");
    expect(typeof result.current.invalidateCache).toBe("function");
  });

  it("sets loading state while analyzing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(() => new Promise(() => {}))
    );

    const { result } = renderHook(() => useAISuggestions());
    const deck = makeDeck();
    const stats = makeStats();

    act(() => {
      void result.current.analyze(deck, stats, null);
    });

    expect(result.current.isLoading).toBe(true);
    vi.unstubAllGlobals();
  });

  it("sets error when fetch fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      })
    );

    const { result } = renderHook(() => useAISuggestions());
    const deck = makeDeck();
    const stats = makeStats();

    await act(async () => {
      await result.current.analyze(deck, stats, null);
    });

    expect(result.current.error).toContain("500");
    expect(result.current.isLoading).toBe(false);
    expect(result.current.denial).toBeNull();
    vi.unstubAllGlobals();
  });

  it("exposes why the server refused the analysis when AI is paused for the month", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json(
          {
            error: "AI is paused until the monthly budget resets",
            code: "ai_spend_ceiling_reached",
            resetsAt: "2026-12-01T00:00:00.000Z",
          },
          { status: 503 }
        )
      )
    );

    const { result } = renderHook(() => useAISuggestions());
    await act(async () => {
      await result.current.analyze(makeDeck(), makeStats(), null);
    });

    expect(result.current.denial).toEqual({
      code: "ai_spend_ceiling_reached",
      resetsAt: new Date("2026-12-01T00:00:00.000Z"),
    });
    expect(result.current.result).toBeNull();
    expect(result.current.isLoading).toBe(false);
    vi.unstubAllGlobals();
  });

  it("identifies the owned deck when requesting AI suggestions", async () => {
    const encoder = new TextEncoder();
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('{"type":"done"}\n'));
        controller.close();
      },
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, body }));

    const { result } = renderHook(() => useAISuggestions());
    await act(async () => {
      await result.current.analyze(makeDeck(), makeStats(), null);
    });

    const request = vi.mocked(global.fetch).mock.calls[0]?.[1];
    expect(JSON.parse(String(request?.body))).toMatchObject({ deckId: "deck-1" });
    vi.unstubAllGlobals();
  });

  it("includes the player's deck brief in the suggestion request", async () => {
    const encoder = new TextEncoder();
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('{"type":"done"}\n'));
        controller.close();
      },
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, body }));

    const { result } = renderHook(() => useAISuggestions());
    await act(async () => {
      await result.current.analyze(makeDeck(), makeStats(), null, {
        brief: {
          theme: "Artifacts",
          playPattern: "Incremental value",
          dislikes: "Extra turns",
        },
      });
    });

    const request = vi.mocked(global.fetch).mock.calls[0]?.[1];
    expect(JSON.parse(String(request?.body))).toMatchObject({
      brief: {
        theme: "Artifacts",
        playPattern: "Incremental value",
        dislikes: "Extra turns",
      },
    });
    vi.unstubAllGlobals();
  });

  it("invalidateCache allows re-fetching same hash", async () => {
    const makeStream = (lines: string[]) => {
      const encoder = new TextEncoder();
      return new ReadableStream({
        start(controller) {
          for (const line of lines) {
            controller.enqueue(encoder.encode(line + "\n"));
          }
          controller.close();
        },
      });
    };

    const doneEvent = JSON.stringify({ type: "done" });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        body: makeStream([doneEvent]),
      })
    );

    const { result } = renderHook(() => useAISuggestions());
    const deck = makeDeck();
    const stats = makeStats();
    const bracket = makeBracketScore();

    await act(async () => {
      await result.current.analyze(deck, stats, bracket);
    });

    // invalidate and call again — should fetch again
    act(() => { result.current.invalidateCache(); });

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      body: makeStream([doneEvent]),
    } as never);

    await act(async () => {
      await result.current.analyze(deck, stats, bracket);
    });

    expect(vi.mocked(global.fetch)).toHaveBeenCalledTimes(2);
    vi.unstubAllGlobals();
  });
});
