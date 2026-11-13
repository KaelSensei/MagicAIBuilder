import { afterEach, describe, expect, it, vi } from "vitest";
import { act, waitFor } from "@testing-library/react";
import { http, HttpResponse, type HttpResponseResolver } from "msw";

import { setupMsw } from "@/test/msw";
import { renderHookWithProviders } from "@/test/render";
import { playtestHistoryKey } from "./usePlaytestHistory";
import {
  useRecordPlaytestSession,
  type PlaytestRunDraft,
} from "./useRecordPlaytestSession";

const SESSIONS_ROUTE = "/api/decks/:deckId/playtest-sessions";

/** The body of the last request the handler received, as the route would parse it. */
let lastBody: unknown = null;

/** A handler that keeps the request body before answering with `reply`. */
function recordThen(reply: () => Response): HttpResponseResolver {
  return async ({ request }) => {
    lastBody = await request.json();
    return reply();
  };
}

const storedReply = (): Response =>
  HttpResponse.json({ sessions: [], summary: { total: 0 } }, { status: 201 });

const server = setupMsw(http.post(SESSIONS_ROUTE, recordThen(storedReply)));

/** A run with every optional field left as the form leaves it when untouched. */
const A_RUN: PlaytestRunDraft = {
  result: "win",
  turns: 9,
  mulliganCount: 2,
  cardsSeen: 14,
  additionalCardsSeen: 1,
  difficulty: "",
  notes: "",
  proposedChange: "",
};

function renderRecorder(deckId = "deck-1") {
  const onRecorded = vi.fn();
  const rendered = renderHookWithProviders(() =>
    useRecordPlaytestSession(deckId, onRecorded)
  );
  // A cached history, so the test can see whether recording a run stales it.
  rendered.queryClient.setQueryData(playtestHistoryKey(deckId), {
    sessions: [],
    summary: { total: 0 },
  });
  return { ...rendered, onRecorded };
}

afterEach(() => {
  lastBody = null;
});

describe("useRecordPlaytestSession", () => {
  it("stores the run, stales the deck's cached history and then reports it recorded", async () => {
    const { result, queryClient, onRecorded } = renderRecorder();

    act(() => result.current.record(A_RUN));

    await waitFor(() => expect(onRecorded).toHaveBeenCalledTimes(1));
    expect(lastBody).toEqual({
      result: "win",
      turns: 9,
      mulliganCount: 2,
      cardsSeen: 14,
      additionalCardsSeen: 1,
    });
    expect(
      queryClient.getQueryState(playtestHistoryKey("deck-1"))?.isInvalidated
    ).toBe(true);
    expect(result.current.failed).toBe(false);
    expect(result.current.pendingResult).toBeNull();
  });

  it("sends the chosen difficulty and the trimmed notes, never an empty field", async () => {
    const { result, onRecorded } = renderRecorder();

    act(() =>
      result.current.record({
        ...A_RUN,
        result: "loss",
        difficulty: "cedh",
        notes: "  Missed blue mana.  ",
        proposedChange: "   ",
      })
    );

    await waitFor(() => expect(onRecorded).toHaveBeenCalledTimes(1));
    expect(lastBody).toEqual({
      result: "loss",
      turns: 9,
      mulliganCount: 2,
      cardsSeen: 14,
      additionalCardsSeen: 1,
      difficulty: "cedh",
      notes: "Missed blue mana.",
    });
  });

  it("names the result being stored while the request is in flight", async () => {
    let release: () => void = () => undefined;
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    server.use(
      http.post(SESSIONS_ROUTE, async () => {
        await held;
        return storedReply();
      })
    );
    const { result, onRecorded } = renderRecorder();

    act(() => result.current.record({ ...A_RUN, result: "draw" }));

    await waitFor(() => expect(result.current.pendingResult).toBe("draw"));
    release();
    await waitFor(() => expect(onRecorded).toHaveBeenCalledTimes(1));
    expect(result.current.pendingResult).toBeNull();
  });

  it("exposes a refused request as a failure and keeps the history and the modal as they were", async () => {
    server.use(
      http.post(SESSIONS_ROUTE, () =>
        HttpResponse.json({ error: "Deck not found" }, { status: 404 })
      )
    );
    const { result, queryClient, onRecorded } = renderRecorder();

    act(() => result.current.record(A_RUN));

    await waitFor(() => expect(result.current.failed).toBe(true));
    expect(onRecorded).not.toHaveBeenCalled();
    expect(
      queryClient.getQueryState(playtestHistoryKey("deck-1"))?.isInvalidated
    ).toBe(false);
    expect(result.current.pendingResult).toBeNull();
  });

  it("exposes a network error as a failure instead of throwing", async () => {
    server.use(http.post(SESSIONS_ROUTE, () => HttpResponse.error()));
    const { result, onRecorded } = renderRecorder();

    act(() => result.current.record(A_RUN));

    await waitFor(() => expect(result.current.failed).toBe(true));
    expect(onRecorded).not.toHaveBeenCalled();
  });

  it("clears the failure when the player tries again", async () => {
    server.use(
      http.post(SESSIONS_ROUTE, () => HttpResponse.error(), { once: true })
    );
    const { result, onRecorded } = renderRecorder();

    act(() => result.current.record(A_RUN));
    await waitFor(() => expect(result.current.failed).toBe(true));

    act(() => result.current.record(A_RUN));

    await waitFor(() => expect(onRecorded).toHaveBeenCalledTimes(1));
    expect(result.current.failed).toBe(false);
  });
});
