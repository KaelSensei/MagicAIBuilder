import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { logger } from "@/lib/logger";
import { useAIDeckBuild, countCopies } from "./useAIDeckBuild";
import type { AIDeckBuildParams, BuildResult } from "./useAIDeckBuild";

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
    // A failed build logs its raw error; these tests read the state.
    vi.spyOn(logger, "error").mockImplementation(() => undefined);
  });

  it("starts with empty state", () => {
    const { result } = renderHook(() => useAIDeckBuild());
    expect(result.current.state.isLoading).toBe(false);
    expect(result.current.state.failure).toBeNull();
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

  it("keeps a build the server answered with 500 as failed", async () => {
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

    expect(result.current.state.failure).toBe("failed");
    expect(result.current.state.isLoading).toBe(false);
    expect(result.current.state.denial).toBeNull();
    vi.unstubAllGlobals();
  });

  it("exposes why the server refused the build when the month's allowance is used up", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json(
          {
            error: "Monthly AI allowance used up",
            code: "allowance_exhausted",
            route: "build",
            limit: 10,
            resetsAt: "2026-12-01T00:00:00.000Z",
          },
          { status: 429 }
        )
      )
    );

    const { result } = renderHook(() => useAIDeckBuild());
    let built: BuildResult | null = null;
    await act(async () => {
      built = await result.current.build({
        colors: ["G"],
        strategy: "ramp",
        bracket: 1,
        commanderName: null,
        budget: null,
      });
    });

    expect(built).toBeNull();
    expect(result.current.state.isLoading).toBe(false);
    expect(result.current.state.denial).toEqual({
      code: "allowance_exhausted",
      route: "build",
      limit: 10,
      resetsAt: new Date("2026-12-01T00:00:00.000Z"),
    });

    act(() => {
      result.current.reset();
    });
    expect(result.current.state.denial).toBeNull();
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

  it("returns the card-data corrections carried by the done event", async () => {
    const corrections = [
      {
        action: "removed",
        name: "Lightning Bolt",
        quantity: 1,
        reason: "outside_color_identity",
      },
      { action: "added", name: "Island", quantity: 1, reason: "fill_to_size" },
    ];
    const events = [
      JSON.stringify({
        type: "card",
        name: "Island",
        category: "land",
        quantity: 99,
      }),
      JSON.stringify({
        type: "done",
        totalCards: 99,
        source: "ai",
        corrections,
      }),
    ];
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, body: makeStream(events) })
    );

    const { result } = renderHook(() => useAIDeckBuild());
    let built: BuildResult | null = null;
    await act(async () => {
      built = await result.current.build({
        colors: ["U"],
        strategy: "control",
        bracket: 2,
        commanderName: null,
        budget: null,
      });
    });

    expect(built).toEqual(expect.objectContaining({ corrections }));
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
    expect(result.current.state.failure).toBe("failed");
    expect(result.current.state.isLoading).toBe(false);
    vi.unstubAllGlobals();
  });

  it("completes the build when the done event has no line break after it", async () => {
    const encoder = new TextEncoder();
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              type: "card",
              name: "Sol Ring",
              category: "ramp",
              quantity: 1,
            }) + "\n"
          )
        );
        // A relay that trims the body can drop the final line break.
        controller.enqueue(
          encoder.encode(JSON.stringify({ type: "done", totalCards: 1 }))
        );
        controller.close();
      },
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, body }));

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

    expect(result.current.state.failure).toBeNull();
    expect(built).toEqual(
      expect.objectContaining({
        source: "ai",
        cards: [{ name: "Sol Ring", category: "ramp", quantity: 1 }],
      })
    );
    vi.unstubAllGlobals();
  });
});

describe("useAIDeckBuild with lines outside the build event contract", () => {
  const SOL_RING = {
    type: "card",
    name: "Sol Ring",
    category: "ramp",
    quantity: 1,
  };
  const DONE = { type: "done", totalCards: 1, source: "ai" };

  beforeEach(() => {
    vi.spyOn(logger, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /** Streams `lines` as the build response body and runs one build. */
  async function buildFrom(lines: readonly string[]) {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, body: makeStream([...lines]) })
    );
    const { result } = renderHook(() => useAIDeckBuild());
    let built: BuildResult | null = null;
    await act(async () => {
      built = await result.current.build({
        colors: ["U"],
        strategy: "control",
        bracket: 2,
        commanderName: null,
        budget: null,
      });
    });
    vi.unstubAllGlobals();
    return { state: result.current.state, built };
  }

  it("ignores blank lines, lines that are not JSON and events of an unknown type", async () => {
    const { state, built } = await buildFrom([
      "",
      "   ",
      "not json",
      JSON.stringify({ type: "progress", percent: 50 }),
      JSON.stringify(SOL_RING),
      JSON.stringify(DONE),
    ]);

    expect(state.failure).toBeNull();
    expect(built).toEqual(
      expect.objectContaining({
        cards: [{ name: "Sol Ring", category: "ramp", quantity: 1 }],
      })
    );
  });

  it("skips a card event whose name is not text instead of adding it to the deck", async () => {
    const { built } = await buildFrom([
      JSON.stringify({ type: "card", name: 42, category: "ramp", quantity: 1 }),
      JSON.stringify(SOL_RING),
      JSON.stringify(DONE),
    ]);

    expect(built).toEqual(
      expect.objectContaining({
        cards: [{ name: "Sol Ring", category: "ramp", quantity: 1 }],
      })
    );
  });

  it("skips a status event that carries no message", async () => {
    const { state } = await buildFrom([
      JSON.stringify({ type: "status" }),
      JSON.stringify({ type: "status", message: "Choosing the lands..." }),
      JSON.stringify(SOL_RING),
      JSON.stringify(DONE),
    ]);

    expect(state.statusMessages).toEqual(["Choosing the lands..."]);
  });

  it("reports a stream whose only error event has no message as ended early", async () => {
    const { state, built } = await buildFrom([
      JSON.stringify(SOL_RING),
      JSON.stringify({ type: "error" }),
    ]);

    expect(built).toBeNull();
    expect(state.failure).toBe("failed");
  });

  it("keeps only the corrections that name a card, a count and a reason it can show", async () => {
    const preview = {
      action: "removed",
      name: "Unreleased Dragon",
      quantity: 1,
      reason: "preview",
      releasesOn: "2026-12-04",
    };
    const fill = {
      action: "added",
      name: "Island",
      quantity: 2,
      reason: "fill_to_size",
    };
    const { built } = await buildFrom([
      JSON.stringify(SOL_RING),
      JSON.stringify({
        ...DONE,
        corrections: [
          preview,
          { action: "removed", name: "Opt", quantity: 1, reason: "too_spicy" },
          { action: "removed", name: "Opt", quantity: "1", reason: "banned" },
          { action: "removed", name: "Opt", quantity: 1, reason: "preview" },
          { action: "swapped", name: "Opt", quantity: 1, reason: "banned" },
          { action: "added", name: "Island", quantity: 1, reason: "banned" },
          "Opt",
          fill,
        ],
      }),
    ]);

    expect(built).toEqual(
      expect.objectContaining({ corrections: [preview, fill] })
    );
  });

  it("keeps a Game Changer removal that names its bracket and the bracket's limit", async () => {
    const overLimit = {
      action: "removed",
      name: "Rhystic Study",
      quantity: 1,
      reason: "game_changer",
      bracket: 2,
      limit: 0,
    };
    const { built } = await buildFrom([
      JSON.stringify(SOL_RING),
      JSON.stringify({
        ...DONE,
        corrections: [
          overLimit,
          { ...overLimit, name: "Cyclonic Rift", bracket: 6 },
          { ...overLimit, name: "Force of Will", limit: "0" },
          { ...overLimit, name: "Mana Drain", bracket: undefined },
        ],
      }),
    ]);

    expect(built).toEqual(
      expect.objectContaining({ corrections: [overLimit] })
    );
  });

  it("completes the build with fallbacks when the done event's fields cannot be read", async () => {
    const { state, built } = await buildFrom([
      JSON.stringify({ ...SOL_RING, quantity: 3 }),
      JSON.stringify({
        type: "done",
        totalCards: "3",
        source: "beta",
        corrections: "none",
      }),
    ]);

    expect(state.failure).toBeNull();
    expect(state.totalCards).toBe(3);
    expect(built).toEqual(
      expect.objectContaining({ source: "ai", corrections: [] })
    );
  });
});

/**
 * A failed build is kept as its kind (`lib/ai/build-failure.ts`) and the raw
 * error goes to the log; a cancelled one leaves neither (I-02).
 */
describe("useAIDeckBuild when the build does not finish", () => {
  const REQUEST: AIDeckBuildParams = {
    colors: ["U"],
    strategy: "control",
    bracket: 2,
    commanderName: null,
    budget: null,
  };

  beforeEach(() => {
    vi.spyOn(logger, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  /** Runs one build against `fetch` and returns what it resolved to and the state after it. */
  async function buildWith(fetch: typeof globalThis.fetch) {
    vi.stubGlobal("fetch", fetch);
    const { result } = renderHook(() => useAIDeckBuild());
    let built: BuildResult | null = null;
    await act(async () => {
      built = await result.current.build(REQUEST);
    });
    return { state: result.current.state, built };
  }

  it("keeps a request the network lost as unreachable, and logs the browser's error", async () => {
    const lost = new TypeError("Failed to fetch");

    const { state, built } = await buildWith(vi.fn().mockRejectedValue(lost));

    expect(built).toBeNull();
    expect(state.failure).toBe("unreachable");
    expect(state.isLoading).toBe(false);
    expect(logger.error).toHaveBeenCalledWith(
      "AI deck build failed",
      "useAIDeckBuild",
      lost
    );
  });

  it.each([
    [401, "signed-out"],
    [429, "rate-limited"],
  ])("keeps a %i refusal without a denial as %s", async (status, failure) => {
    const refusal = Response.json({ error: "Refused" }, { status });

    const { state, built } = await buildWith(
      vi.fn().mockResolvedValue(refusal)
    );

    expect(built).toBeNull();
    expect(state.failure).toBe(failure);
    expect(state.denial).toBeNull();
  });

  it("keeps the stream's error event as a failed build, whatever its text", async () => {
    const body = makeStream([
      JSON.stringify({ type: "status", message: "Thinking…" }),
      JSON.stringify({ type: "error", message: "Failed to fetch" }),
    ]);

    const { state, built } = await buildWith(
      vi.fn().mockResolvedValue({ ok: true, body })
    );

    expect(built).toBeNull();
    expect(state.failure).toBe("failed");
  });

  it("resolves a cancelled build to null without a failure or a log line", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_url: string, init: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            init.signal?.addEventListener("abort", () =>
              reject(new DOMException("The build was cancelled", "AbortError"))
            );
          })
      )
    );
    const { result } = renderHook(() => useAIDeckBuild());

    let pending: Promise<BuildResult | null> = Promise.resolve(null);
    act(() => {
      pending = result.current.build(REQUEST);
    });
    act(() => {
      result.current.reset();
    });

    expect(await pending).toBeNull();
    expect(result.current.state.failure).toBeNull();
    expect(logger.error).not.toHaveBeenCalled();
  });
});
