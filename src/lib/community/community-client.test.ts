/**
 * The community client against MSW-served community routes: for every
 * function, the request it sends (method, path, content type, body), the data
 * it answers on 2xx, the typed refusal it throws for each status the route
 * answers, and the refusal of a 2xx body the contract's guard does not accept.
 *
 * No route answers 409 or 429 today (`src/app/api/community/**`), so neither
 * status appears below; the client would carry them like any other refusal.
 */
import { describe, expect, it } from "vitest";
import { http, HttpResponse, type JsonBodyType } from "msw";
import {
  castVote,
  clearVote,
  CommunityApiError,
  createSavedDeckFolder,
  deleteComment,
  deleteSavedDeckFolder,
  editComment,
  fetchDeckComments,
  fetchDeckRatings,
  fetchSavedDeckLibrary,
  followUser,
  MalformedCommunityAnswerError,
  postComment,
  rateDeck,
  removeRating,
  renameSavedDeckFolder,
  reportDeck,
  savePublicDeck,
  unfollowUser,
} from "@/lib/community/community-client";
import { setupMsw } from "@/test/msw";

const server = setupMsw();

const DECK_ID = "deck-1";
const COMMENT_ID = "comment-1";
const FOLDER_ID = "folder-1";
const USERNAME = "Ana_Builder";
const DECK = `/api/community/decks/${DECK_ID}`;

// ---------------------------------------------------------------------------
// Recording what the client sends
// ---------------------------------------------------------------------------

type Method = "GET" | "POST" | "PATCH" | "DELETE";

/** One request as the route received it. */
interface SentRequest {
  readonly method: string;
  readonly path: string;
  readonly contentType: string | null;
  /** The parsed JSON body, or null when the request carried none. */
  readonly body: unknown;
}

async function readSent(request: Request): Promise<SentRequest> {
  const text = await request.text();
  const body: unknown = text === "" ? null : JSON.parse(text);
  return {
    method: request.method,
    path: new URL(request.url).pathname,
    contentType: request.headers.get("content-type"),
    body,
  };
}

const HANDLERS: Record<Method, typeof http.get> = {
  GET: http.get,
  POST: http.post,
  PATCH: http.patch,
  DELETE: http.delete,
};

/** Serves `path` once with `answer`, and records the request it received. */
function serve(
  method: Method,
  path: string,
  answer: () => Response
): { sent: SentRequest[] } {
  const sent: SentRequest[] = [];
  server.use(
    HANDLERS[method](path, async ({ request }) => {
      sent.push(await readSent(request));
      return answer();
    })
  );
  return { sent };
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const AUTHOR = { name: "Ana", username: "ana", image: null };

function comment(overrides: Record<string, unknown> = {}) {
  return {
    id: COMMENT_ID,
    deckId: DECK_ID,
    parentId: null,
    body: "Why no Cyclonic Rift?",
    createdAt: "2026-08-18T10:00:00.000Z",
    updatedAt: "2026-08-18T10:00:00.000Z",
    author: AUTHOR,
    isDeckOwner: false,
    isAuthor: true,
    ...overrides,
  };
}

const REPLY = {
  ...comment({ id: "comment-2", parentId: COMMENT_ID, body: "Budget." }),
  replies: [],
};
const THREAD = { ...comment(), replies: [REPLY] };

const RATINGS = {
  average: 4.5,
  count: 2,
  histogram: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 1 },
  badge: null,
  reviews: [
    {
      id: "rating-1",
      rating: 5,
      title: "Tight list",
      body: "Plays fast.",
      author: AUTHOR,
    },
  ],
  viewerRating: 4,
};

const SAVED_DECK = {
  createdAt: "2026-09-24T10:00:00.000Z",
  deck: {
    id: "deck-9",
    name: "Goblins",
    commanderName: "Krenko",
    user: { username: "ana", name: "Ana" },
  },
};
const LIBRARY = {
  folders: [{ id: FOLDER_ID, name: "Ideas", savedDecks: [SAVED_DECK] }],
  unfiled: [SAVED_DECK],
};

// ---------------------------------------------------------------------------
// The table: one row per client function
// ---------------------------------------------------------------------------

/** A refusal the route answers: its status, its `error` field and the detail the client keeps. */
interface Refusal {
  readonly status: number;
  readonly error: unknown;
  readonly detail: string;
}

interface Endpoint {
  readonly name: string;
  readonly call: () => Promise<unknown>;
  readonly method: Method;
  readonly path: string;
  /** The JSON body the client must send, or null for none. */
  readonly body: unknown;
  readonly okStatus: number;
  /** What the route answers on success. */
  readonly answer: JsonBodyType;
  /** What the call resolves with; `undefined` for a function that reads only the status. */
  readonly expected: unknown;
  readonly refusals: readonly Refusal[];
  /** 2xx bodies the contract's guard must refuse; empty when the function reads only the status. */
  readonly malformed: readonly JsonBodyType[];
}

const UNAUTHORIZED: Refusal = {
  status: 401,
  error: "Unauthorized",
  detail: "Unauthorized",
};
const DECK_NOT_FOUND: Refusal = {
  status: 404,
  error: "Deck not found",
  detail: "Deck not found",
};
const FOLDER_NOT_FOUND: Refusal = {
  status: 404,
  error: "Folder not found",
  detail: "Folder not found",
};
const COMMENT_NOT_FOUND: Refusal = {
  status: 404,
  error: "Comment not found",
  detail: "Comment not found",
};
const USER_NOT_FOUND: Refusal = {
  status: 404,
  error: "User not found",
  detail: "User not found",
};
const MALFORMED_BODY: Refusal = {
  status: 400,
  error: "Malformed request body",
  detail: "Malformed request body",
};

const ENDPOINTS: readonly Endpoint[] = [
  {
    name: "castVote",
    call: () => castVote(DECK_ID, 1),
    method: "POST",
    path: `${DECK}/vote`,
    body: { value: 1 },
    okStatus: 201,
    answer: { score: 4, upvotes: 5, downvotes: 1, viewerVote: 1 },
    expected: { score: 4, upvotes: 5, downvotes: 1, viewerVote: 1 },
    refusals: [
      // Zod field errors: a record of lists, flattened to its strings.
      {
        status: 400,
        error: { value: ["Vote must be 1 or -1"] },
        detail: "Vote must be 1 or -1",
      },
      MALFORMED_BODY,
      UNAUTHORIZED,
      {
        status: 403,
        error: "You cannot vote on your own deck",
        detail: "You cannot vote on your own deck",
      },
      DECK_NOT_FOUND,
    ],
    malformed: [{}, { score: "4", viewerVote: 1 }, { score: 4, viewerVote: 0 }],
  },
  {
    name: "clearVote",
    call: () => clearVote(DECK_ID),
    method: "DELETE",
    path: `${DECK}/vote`,
    body: null,
    okStatus: 200,
    answer: { score: 3, upvotes: 4, downvotes: 1, viewerVote: null },
    expected: { score: 3, upvotes: 4, downvotes: 1, viewerVote: null },
    refusals: [UNAUTHORIZED, DECK_NOT_FOUND],
    malformed: [{ score: 3 }, { score: 3, viewerVote: "none" }],
  },
  {
    name: "followUser",
    call: () => followUser(USERNAME),
    method: "POST",
    path: `/api/community/users/${USERNAME}/follow`,
    body: null,
    okStatus: 201,
    answer: { following: true, followerCount: 5 },
    expected: { following: true, followerCount: 5 },
    refusals: [
      {
        status: 400,
        error: "You cannot follow yourself",
        detail: "You cannot follow yourself",
      },
      UNAUTHORIZED,
      USER_NOT_FOUND,
    ],
    malformed: [{ following: true }, { following: "yes", followerCount: 5 }],
  },
  {
    name: "unfollowUser",
    call: () => unfollowUser(USERNAME),
    method: "DELETE",
    path: `/api/community/users/${USERNAME}/follow`,
    body: null,
    okStatus: 200,
    answer: { following: false, followerCount: 4 },
    expected: { following: false, followerCount: 4 },
    refusals: [
      { status: 400, error: "Invalid username", detail: "Invalid username" },
      UNAUTHORIZED,
      USER_NOT_FOUND,
    ],
    malformed: [{}, { following: false, followerCount: "4" }],
  },
  {
    name: "fetchDeckRatings",
    call: () => fetchDeckRatings(DECK_ID),
    method: "GET",
    path: `${DECK}/ratings`,
    body: null,
    okStatus: 200,
    answer: RATINGS,
    expected: RATINGS,
    refusals: [DECK_NOT_FOUND],
    malformed: [
      {},
      { ...RATINGS, histogram: { 1: 0, 2: 0, 3: 0, 4: 1 } },
      { ...RATINGS, badge: "gold" },
      { ...RATINGS, reviews: [{ id: "rating-1", rating: 5 }] },
    ],
  },
  {
    name: "rateDeck",
    call: () =>
      rateDeck(DECK_ID, {
        rating: 5,
        title: "Tight list",
        body: "Plays fast.",
      }),
    method: "POST",
    path: `${DECK}/ratings`,
    body: { rating: 5, title: "Tight list", body: "Plays fast." },
    okStatus: 201,
    answer: {
      id: "rating-1",
      userId: "user-1",
      deckId: DECK_ID,
      rating: 5,
      title: "Tight list",
      body: "Plays fast.",
      helpfulCount: 0,
      createdAt: "2026-08-18T10:00:00.000Z",
      user: AUTHOR,
    },
    expected: expect.objectContaining({
      id: "rating-1",
      rating: 5,
      title: "Tight list",
      body: "Plays fast.",
    }),
    refusals: [
      // The review rules answer a list of violations.
      {
        status: 400,
        error: ["Title is required", "Body is too short"],
        detail: "Title is required; Body is too short",
      },
      UNAUTHORIZED,
      {
        status: 403,
        error: "You cannot rate your own deck",
        detail: "You cannot rate your own deck",
      },
      DECK_NOT_FOUND,
    ],
    malformed: [{}, { id: "rating-1", rating: "5", title: null, body: null }],
  },
  {
    name: "removeRating",
    call: () => removeRating(DECK_ID),
    method: "DELETE",
    path: `${DECK}/ratings`,
    body: null,
    okStatus: 200,
    answer: { deleted: 1 },
    expected: undefined,
    refusals: [UNAUTHORIZED],
    malformed: [],
  },
  {
    name: "fetchDeckComments",
    call: () => fetchDeckComments(DECK_ID),
    method: "GET",
    path: `${DECK}/comments`,
    body: null,
    okStatus: 200,
    answer: { comments: [THREAD], count: 2 },
    expected: { comments: [THREAD], count: 2 },
    refusals: [DECK_NOT_FOUND],
    malformed: [
      {},
      { comments: [THREAD] },
      { comments: [{ ...THREAD, author: null }], count: 2 },
      // A reply two levels down missing its own replies list.
      {
        comments: [{ ...THREAD, replies: [comment({ id: "comment-2" })] }],
        count: 2,
      },
    ],
  },
  {
    name: "postComment",
    call: () => postComment(DECK_ID, "Budget.", COMMENT_ID),
    method: "POST",
    path: `${DECK}/comments`,
    body: { body: "Budget.", parentId: COMMENT_ID },
    okStatus: 201,
    answer: comment({ id: "comment-2", parentId: COMMENT_ID, body: "Budget." }),
    expected: comment({
      id: "comment-2",
      parentId: COMMENT_ID,
      body: "Budget.",
    }),
    refusals: [
      {
        status: 400,
        error: ["Comment cannot be empty"],
        detail: "Comment cannot be empty",
      },
      {
        status: 400,
        error: "Parent comment not found",
        detail: "Parent comment not found",
      },
      UNAUTHORIZED,
      DECK_NOT_FOUND,
    ],
    malformed: [{}, comment({ isAuthor: "me" })],
  },
  {
    name: "editComment",
    call: () => editComment(DECK_ID, COMMENT_ID, "Why no Rift?"),
    method: "PATCH",
    path: `${DECK}/comments/${COMMENT_ID}`,
    body: { body: "Why no Rift?" },
    okStatus: 200,
    answer: comment({
      body: "Why no Rift?",
      updatedAt: "2026-08-18T11:00:00.000Z",
    }),
    expected: comment({
      body: "Why no Rift?",
      updatedAt: "2026-08-18T11:00:00.000Z",
    }),
    refusals: [
      {
        status: 400,
        error: ["Comment cannot exceed 2000 characters"],
        detail: "Comment cannot exceed 2000 characters",
      },
      UNAUTHORIZED,
      COMMENT_NOT_FOUND,
      DECK_NOT_FOUND,
    ],
    malformed: [{}, comment({ createdAt: 1_755_511_200_000 })],
  },
  {
    name: "deleteComment",
    call: () => deleteComment(DECK_ID, COMMENT_ID),
    method: "DELETE",
    path: `${DECK}/comments/${COMMENT_ID}`,
    body: null,
    okStatus: 200,
    answer: { deleted: true },
    expected: undefined,
    refusals: [
      UNAUTHORIZED,
      {
        status: 403,
        error: "You cannot delete this comment",
        detail: "You cannot delete this comment",
      },
      COMMENT_NOT_FOUND,
      DECK_NOT_FOUND,
    ],
    malformed: [],
  },
  {
    name: "savePublicDeck",
    call: () => savePublicDeck(DECK_ID, FOLDER_ID),
    method: "POST",
    path: `${DECK}/save`,
    body: { folderId: FOLDER_ID },
    okStatus: 201,
    answer: { saved: true, folderId: FOLDER_ID },
    expected: { saved: true, folderId: FOLDER_ID },
    refusals: [
      { status: 400, error: "Invalid folder", detail: "Invalid folder" },
      UNAUTHORIZED,
      DECK_NOT_FOUND,
      FOLDER_NOT_FOUND,
    ],
    malformed: [{}, { saved: true }, { saved: false, folderId: null }],
  },
  {
    name: "fetchSavedDeckLibrary",
    call: () => fetchSavedDeckLibrary(),
    method: "GET",
    path: "/api/community/deck-folders",
    body: null,
    okStatus: 200,
    answer: LIBRARY,
    expected: LIBRARY,
    refusals: [UNAUTHORIZED],
    malformed: [{}, { folders: [] }, { folders: {}, unfiled: [] }, []],
  },
  {
    name: "createSavedDeckFolder",
    call: () => createSavedDeckFolder("Ideas"),
    method: "POST",
    path: "/api/community/deck-folders",
    body: { name: "Ideas" },
    okStatus: 201,
    answer: {
      id: FOLDER_ID,
      name: "Ideas",
      createdAt: "2026-09-24T10:00:00.000Z",
    },
    expected: expect.objectContaining({ id: FOLDER_ID, name: "Ideas" }),
    refusals: [
      {
        status: 400,
        error: "Invalid folder name",
        detail: "Invalid folder name",
      },
      UNAUTHORIZED,
    ],
    malformed: [{}, { id: FOLDER_ID }, { id: 1, name: "Ideas" }],
  },
  {
    name: "renameSavedDeckFolder",
    call: () => renameSavedDeckFolder(FOLDER_ID, "Brews"),
    method: "PATCH",
    path: `/api/community/deck-folders/${FOLDER_ID}`,
    body: { name: "Brews" },
    okStatus: 200,
    answer: { id: FOLDER_ID, name: "Brews" },
    expected: { id: FOLDER_ID, name: "Brews" },
    refusals: [
      { status: 400, error: "Invalid folder id", detail: "Invalid folder id" },
      {
        status: 400,
        error: "Invalid folder name",
        detail: "Invalid folder name",
      },
      UNAUTHORIZED,
      FOLDER_NOT_FOUND,
    ],
    malformed: [{}, { name: "Brews" }],
  },
  {
    name: "deleteSavedDeckFolder",
    call: () => deleteSavedDeckFolder(FOLDER_ID),
    method: "DELETE",
    path: `/api/community/deck-folders/${FOLDER_ID}`,
    body: null,
    okStatus: 200,
    answer: { deleted: true },
    expected: undefined,
    refusals: [
      { status: 400, error: "Invalid folder id", detail: "Invalid folder id" },
      UNAUTHORIZED,
      FOLDER_NOT_FOUND,
    ],
    malformed: [],
  },
  {
    name: "reportDeck",
    call: () => reportDeck(DECK_ID, "spam"),
    method: "POST",
    path: `${DECK}/reports`,
    body: { reason: "spam" },
    okStatus: 201,
    answer: { status: "pending" },
    expected: { status: "pending" },
    refusals: [
      {
        status: 400,
        error: "Invalid report reason",
        detail: "Invalid report reason",
      },
      UNAUTHORIZED,
      {
        status: 403,
        error: "You cannot report your own deck",
        detail: "You cannot report your own deck",
      },
      DECK_NOT_FOUND,
    ],
    malformed: [{}, { status: "reviewed" }],
  },
];

// ---------------------------------------------------------------------------
// The suite
// ---------------------------------------------------------------------------

describe.each(ENDPOINTS)("$name", (endpoint) => {
  const { method, path, body, okStatus, answer } = endpoint;
  const ok = () => HttpResponse.json(answer, { status: okStatus });

  it(`sends ${method} ${path}${body === null ? " without a body" : " as JSON"}`, async () => {
    const { sent } = serve(method, path, ok);

    await endpoint.call();

    expect(sent).toEqual([
      {
        method,
        path,
        contentType: body === null ? null : "application/json",
        body,
      },
    ]);
  });

  it(`answers ${endpoint.expected === undefined ? "nothing" : "the route's data"} on ${okStatus}`, async () => {
    serve(method, path, ok);

    await expect(endpoint.call()).resolves.toEqual(endpoint.expected);
  });

  it.each(endpoint.refusals)(
    "throws CommunityApiError $status carrying the route's message",
    async ({ status, error, detail }) => {
      serve(method, path, () => HttpResponse.json({ error }, { status }));

      const failure = await endpoint.call().then(
        () => undefined,
        (thrown: unknown) => thrown
      );

      expect(failure).toBeInstanceOf(CommunityApiError);
      if (!(failure instanceof CommunityApiError)) return;
      expect(failure.status).toBe(status);
      expect(failure.detail).toBe(detail);
      expect(failure.message).toBe(
        `[${endpoint.name}] HTTP ${status}: ${detail}`
      );
    }
  );

  if (endpoint.malformed.length > 0) {
    it.each(
      endpoint.malformed.map((malformed) => [
        JSON.stringify(malformed),
        malformed,
      ])
    )("refuses the 2xx body %s", async (_label, malformed) => {
      serve(method, path, () =>
        HttpResponse.json(malformed, { status: okStatus })
      );

      const failure = await endpoint.call().then(
        () => undefined,
        (thrown: unknown) => thrown
      );

      expect(failure).toBeInstanceOf(MalformedCommunityAnswerError);
      if (!(failure instanceof MalformedCommunityAnswerError)) return;
      expect(failure.status).toBe(okStatus);
      expect(failure.operation).toBe(endpoint.name);
    });

    it("refuses a 2xx body that is not JSON", async () => {
      serve(method, path, () =>
        HttpResponse.text("<!doctype html>", { status: okStatus })
      );

      const failure = await endpoint.call().then(
        () => undefined,
        (thrown: unknown) => thrown
      );

      expect(failure).toBeInstanceOf(MalformedCommunityAnswerError);
      if (!(failure instanceof MalformedCommunityAnswerError)) return;
      expect(failure.cause).toBeInstanceOf(SyntaxError);
    });
  } else {
    it("reads only the status: a 2xx with any body, or none, is a done write", async () => {
      serve(method, path, () =>
        HttpResponse.text("<!doctype html>", { status: okStatus })
      );

      await expect(endpoint.call()).resolves.toBeUndefined();
    });
  }
});

describe("a refusal's detail", () => {
  const path = `${DECK}/vote`;

  it("is the status alone when the body carries no error field", async () => {
    serve("POST", path, () =>
      HttpResponse.json({ somethingElse: true }, { status: 500 })
    );

    await expect(castVote(DECK_ID, 1)).rejects.toThrow("[castVote] HTTP 500");
    await expect(castVote(DECK_ID, 1)).rejects.not.toThrow(":");
  });

  it("is the status alone when the body is not JSON, as a proxy's error page is", async () => {
    serve("POST", path, () =>
      HttpResponse.text("<!doctype html>", { status: 502 })
    );

    const failure = await castVote(DECK_ID, 1).then(
      () => undefined,
      (thrown: unknown) => thrown
    );

    expect(failure).toBeInstanceOf(CommunityApiError);
    if (!(failure instanceof CommunityApiError)) return;
    expect(failure.status).toBe(502);
    expect(failure.detail).toBe("");
  });

  it("keeps only the strings of an error field, never its other values", async () => {
    serve("POST", path, () =>
      HttpResponse.json(
        { error: { value: ["Vote must be 1 or -1", 42], extra: null } },
        { status: 400 }
      )
    );

    await expect(castVote(DECK_ID, 1)).rejects.toThrow(
      "[castVote] HTTP 400: Vote must be 1 or -1"
    );
  });

  it("is cut at 200 characters", async () => {
    serve("POST", path, () =>
      HttpResponse.json({ error: "x".repeat(400) }, { status: 500 })
    );

    const failure = await castVote(DECK_ID, 1).then(
      () => undefined,
      (thrown: unknown) => thrown
    );

    expect(failure).toBeInstanceOf(CommunityApiError);
    if (!(failure instanceof CommunityApiError)) return;
    expect(failure.detail).toHaveLength(200);
  });
});

describe("a network failure", () => {
  it("rejects with the browser's own error, not a CommunityApiError", async () => {
    serve("POST", `${DECK}/vote`, () => HttpResponse.error());

    const failure = await castVote(DECK_ID, 1).then(
      () => undefined,
      (thrown: unknown) => thrown
    );

    expect(failure).toBeInstanceOf(Error);
    expect(failure).not.toBeInstanceOf(CommunityApiError);
    expect(failure).not.toBeInstanceOf(MalformedCommunityAnswerError);
  });
});

describe("path encoding", () => {
  it("escapes an id or a slug that is not a plain token", async () => {
    const { sent } = serve(
      "POST",
      "/api/community/users/ana%2Fbuilder/follow",
      () =>
        HttpResponse.json(
          { following: true, followerCount: 1 },
          { status: 201 }
        )
    );

    await followUser("ana/builder");

    expect(sent[0]?.path).toBe("/api/community/users/ana%2Fbuilder/follow");
  });
});
