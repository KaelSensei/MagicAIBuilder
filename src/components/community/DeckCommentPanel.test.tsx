/**
 * The comment panel of a public deck against MSW-served comment routes: what a
 * reader and a signed-in player see, which writes the panel sends, and how it
 * shows a stream it could not read. Every request the routes receive is
 * recorded, so a test asserts what was sent without spying on `fetch`.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { delay, http, HttpResponse } from "msw";
import type { DeckCommentThread } from "@/lib/community/comments";
import { COMMUNITY_READ_TIMEOUT_MS } from "@/lib/community/community-client";
import { setupMsw } from "@/test/msw";
import { renderWithProviders } from "@/test/render";

vi.mock(
  import("@/i18n/navigation"),
  () => import("@/test/i18n-navigation-stub")
);

import { DeckCommentPanel } from "./DeckCommentPanel";

const COMMENTS_ROUTE = "/api/community/decks/:deckId/comments";
const COMMENT_ROUTE = "/api/community/decks/:deckId/comments/:commentId";

function thread(overrides: Partial<DeckCommentThread> = {}): DeckCommentThread {
  return {
    id: "c1",
    deckId: "deck-1",
    parentId: null,
    body: "Why no Cyclonic Rift?",
    createdAt: "2026-08-18T10:00:00.000Z",
    updatedAt: "2026-08-18T10:00:00.000Z",
    author: { name: "Ana", username: "ana", image: null },
    isDeckOwner: false,
    isAuthor: false,
    replies: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// The comment routes, as MSW serves them
// ---------------------------------------------------------------------------

/** One request as a comment route received it. */
interface SentRequest {
  readonly method: string;
  readonly path: string;
  /** The parsed JSON body, or null when the request carried none. */
  readonly body: unknown;
}

const server = setupMsw();
let sent: SentRequest[] = [];

async function record(request: Request): Promise<void> {
  const text = await request.clone().text();
  sent.push({
    method: request.method,
    path: new URL(request.url).pathname,
    body: text === "" ? null : JSON.parse(text),
  });
}

/** The writes the routes received, in order. */
function sentWrites(): readonly SentRequest[] {
  return sent.filter((request) => request.method !== "GET");
}

/** The routes serving `threads` as the stream of every deck, and accepting every write. */
function serveStream(threads: readonly DeckCommentThread[]) {
  server.use(
    http.get(COMMENTS_ROUTE, async ({ request }) => {
      await record(request);
      return HttpResponse.json({ comments: threads, count: threads.length });
    }),
    http.post(COMMENTS_ROUTE, async ({ request }) => {
      await record(request);
      return HttpResponse.json({}, { status: 201 });
    }),
    http.delete(COMMENT_ROUTE, async ({ request }) => {
      await record(request);
      return HttpResponse.json({ deleted: true });
    })
  );
}

beforeEach(() => {
  sent = [];
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function renderPanel(
  props: { readonly isOwner?: boolean; readonly isSignedIn?: boolean } = {}
) {
  return renderWithProviders(
    <DeckCommentPanel
      deckId="deck-1"
      isOwner={props.isOwner ?? false}
      isSignedIn={props.isSignedIn ?? false}
    />
  );
}

describe("DeckCommentPanel", () => {
  it("renders the stream with count, author and body", async () => {
    serveStream([thread()]);
    renderPanel();

    expect(await screen.findByText("Why no Cyclonic Rift?")).toBeTruthy();
    expect(screen.getByText("1 comment")).toBeTruthy();
    expect(screen.getByText("Ana")).toBeTruthy();
  });

  it("badges the deck author's comments", async () => {
    serveStream([thread({ isDeckOwner: true })]);
    renderPanel();

    expect(await screen.findByText("Deck author")).toBeTruthy();
  });

  it("nests replies under their parent", async () => {
    serveStream([
      thread({
        replies: [
          thread({
            id: "c2",
            parentId: "c1",
            body: "Budget cut.",
            isDeckOwner: true,
          }),
        ],
      }),
    ]);
    renderPanel();

    expect(await screen.findByText("Budget cut.")).toBeTruthy();
  });

  it("asks anonymous viewers to sign in instead of showing the form", async () => {
    serveStream([]);
    renderPanel();

    expect(await screen.findByText(/sign in to join/i)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /post/i })).toBeNull();
  });

  it("posts a comment and reloads the stream", async () => {
    serveStream([]);
    renderPanel({ isSignedIn: true });

    const textarea = await screen.findByPlaceholderText(/ask a question/i);
    fireEvent.change(textarea, { target: { value: "Nice curve!" } });
    fireEvent.click(screen.getByRole("button", { name: /post/i }));

    await waitFor(() =>
      expect(sentWrites()).toEqual([
        {
          method: "POST",
          path: "/api/community/decks/deck-1/comments",
          body: { body: "Nice curve!" },
        },
      ])
    );
  });

  it("offers edit and delete only on the viewer's own comments", async () => {
    serveStream([
      thread({ isAuthor: true }),
      thread({ id: "c2", body: "Not mine." }),
    ]);
    renderPanel({ isSignedIn: true });

    await screen.findByText("Not mine.");
    expect(screen.getAllByRole("button", { name: /edit/i })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: /delete/i })).toHaveLength(1);
  });

  it("lets the deck owner delete anyone's comment", async () => {
    serveStream([thread()]);
    renderPanel({ isOwner: true, isSignedIn: true });

    await screen.findByText("Why no Cyclonic Rift?");
    expect(screen.getAllByRole("button", { name: /delete/i })).toHaveLength(1);
    expect(screen.queryByRole("button", { name: /edit/i })).toBeNull();
  });

  it("sends a reply with the parent id", async () => {
    serveStream([thread()]);
    renderPanel({ isSignedIn: true });

    fireEvent.click(await screen.findByRole("button", { name: /reply/i }));
    const forms = screen.getAllByPlaceholderText(/ask a question/i);
    fireEvent.change(forms[forms.length - 1], { target: { value: "Budget." } });
    const replySubmits = screen.getAllByRole("button", { name: /reply/i });
    fireEvent.click(replySubmits[replySubmits.length - 1]);

    await waitFor(() =>
      expect(sentWrites()).toEqual([
        {
          method: "POST",
          path: "/api/community/decks/deck-1/comments",
          body: { body: "Budget.", parentId: "c1" },
        },
      ])
    );
  });

  it("keeps the newer deck's comments when an older request resolves last", async () => {
    let releaseOlder: () => void = () => undefined;
    const olderReleased = new Promise<void>((resolve) => {
      releaseOlder = resolve;
    });
    server.use(
      http.get(COMMENTS_ROUTE, async ({ params }) => {
        if (params.deckId === "deck-older") {
          await olderReleased;
          return HttpResponse.json({
            comments: [thread({ id: "old", body: "Stale deck comment." })],
            count: 1,
          });
        }
        return HttpResponse.json({
          comments: [thread({ id: "new", body: "Newer deck comment." })],
          count: 1,
        });
      })
    );

    const { rerender } = renderWithProviders(
      <DeckCommentPanel
        deckId="deck-older"
        isOwner={false}
        isSignedIn={false}
      />
    );
    rerender(
      <DeckCommentPanel
        deckId="deck-newer"
        isOwner={false}
        isSignedIn={false}
      />
    );

    expect(await screen.findByText("Newer deck comment.")).toBeInTheDocument();

    // The older answer has had every chance to land before the checks below.
    await act(async () => {
      releaseOlder();
      await delay(50);
    });

    expect(screen.getByText("Newer deck comment.")).toBeInTheDocument();
    expect(screen.queryByText("Stale deck comment.")).not.toBeInTheDocument();
  });

  it("flips the top-level order with the sort toggle", async () => {
    // The API serves newest first; the toggle only reverses the top level.
    serveStream([
      thread({ id: "new", body: "Newest comment." }),
      thread({
        id: "old",
        body: "Oldest comment.",
        createdAt: "2026-08-17T10:00:00.000Z",
      }),
    ]);
    renderPanel();

    await screen.findByText("Newest comment.");
    const bodies = () =>
      screen.getAllByText(/comment\./i).map((el) => el.textContent);
    expect(bodies()).toEqual(["Newest comment.", "Oldest comment."]);

    fireEvent.click(screen.getByRole("button", { name: /newest first/i }));

    expect(bodies()).toEqual(["Oldest comment.", "Newest comment."]);
    expect(screen.getByRole("button", { name: /oldest first/i })).toBeTruthy();
  });

  it("deletes after confirmation", async () => {
    serveStream([thread({ isAuthor: true })]);
    vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));
    renderPanel({ isSignedIn: true });

    fireEvent.click(await screen.findByRole("button", { name: /delete/i }));

    await waitFor(() =>
      expect(sentWrites()).toEqual([
        {
          method: "DELETE",
          path: "/api/community/decks/deck-1/comments/c1",
          body: null,
        },
      ])
    );
  });

  /**
   * Every part of the body is gated on `data`, so a swallowed read left the
   * panel showing its header alone — identical to a deck nobody had commented
   * on, with no way to retry.
   */
  describe("when the stream cannot be read", () => {
    /**
     * Replaces the client's read timeout with a signal the route fires once
     * the request has arrived, then never answers: the test neither waits
     * 15 seconds nor races a short timer. `vi.restoreAllMocks` undoes it.
     */
    it("stops waiting for a stalled request and offers a retry", async () => {
      const readTimeout = new AbortController();
      const timeout = vi
        .spyOn(AbortSignal, "timeout")
        .mockReturnValue(readTimeout.signal);
      server.use(
        http.get(COMMENTS_ROUTE, async () => {
          readTimeout.abort(
            new DOMException(
              "The operation was aborted due to timeout",
              "TimeoutError"
            )
          );
          await delay("infinite");
        })
      );

      renderPanel();

      expect(
        await screen.findByText(/comments could not be loaded/i)
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /try again/i })
      ).toBeInTheDocument();
      expect(timeout).toHaveBeenCalledWith(COMMUNITY_READ_TIMEOUT_MS);
    });

    it("says so instead of looking like an empty stream, when the API errors", async () => {
      server.use(
        http.get(COMMENTS_ROUTE, () => HttpResponse.json({}, { status: 500 }))
      );
      renderPanel();

      expect(
        await screen.findByText(/comments could not be loaded/i)
      ).toBeInTheDocument();
      expect(screen.queryByText(/no comments yet/i)).not.toBeInTheDocument();
    });

    it("says so when the request throws outright", async () => {
      server.use(http.get(COMMENTS_ROUTE, () => HttpResponse.error()));
      renderPanel();

      expect(
        await screen.findByText(/comments could not be loaded/i)
      ).toBeInTheDocument();
    });

    it("offers a retry that recovers the stream", async () => {
      server.use(
        http.get(COMMENTS_ROUTE, () => HttpResponse.json({}, { status: 500 }), {
          once: true,
        }),
        http.get(COMMENTS_ROUTE, () =>
          HttpResponse.json({ comments: [thread()], count: 1 })
        )
      );

      renderPanel();
      await screen.findByText(/comments could not be loaded/i);

      fireEvent.click(screen.getByRole("button", { name: /try again/i }));

      expect(
        await screen.findByText("Why no Cyclonic Rift?")
      ).toBeInTheDocument();
      expect(
        screen.queryByText(/comments could not be loaded/i)
      ).not.toBeInTheDocument();
    });
  });
});
