// @vitest-environment node
/**
 * Characterization suite: the exact JSON body of the API's 400, 403 and 404
 * answers, one route per family, as they are today.
 *
 * The app routes answer a bad request in five shapes (audit "server" §1.3,
 * M4): `{ error }`, `{ error, details: string[] }`,
 * `{ error, details: flattenError }`, `{ error: fieldErrors }` and
 * `{ error: string[] }`; `/api/v1` has its own `{ error: { code, message } }`.
 * "Not yours" is 403 on some routes and 404 on others (M5). Clients parse
 * these bodies, so the route kit (P1-39) must not unify them by accident.
 * B2-56 moves every family to one envelope and B2-57 answers 404 for "not
 * yours" (owner decision OD-08); each flips the tests named after it here.
 *
 * The routes run with the real guards against two boundary fakes: the
 * Auth.js session (`auth()` from `lib/auth/config`) and an in-memory database
 * behind `lib/db/prisma`.
 */
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { mintApiKey } from "@/lib/api/keys";
import { POST as signUp } from "./auth/signup/route";
import { POST as addToCollection } from "./collection/route";
import { DELETE as removeFromCollection } from "./collection/[id]/route";
import { POST as findCombos } from "./combos/route";
import { PATCH as renameCommunityFolder } from "./community/deck-folders/[folderId]/route";
import { POST as postComment } from "./community/decks/[id]/comments/route";
import { PATCH as editComment } from "./community/decks/[id]/comments/[commentId]/route";
import { POST as rateDeck } from "./community/decks/[id]/ratings/route";
import { POST as createFolder } from "./deck-folders/route";
import { PATCH as renameFolder } from "./deck-folders/[folderId]/route";
import { POST as createDeck } from "./decks/route";
import { DELETE as deleteDeck, PATCH as editDeck } from "./decks/[id]/route";
import { POST as addDeckCard } from "./decks/[id]/cards/route";
import {
  GET as listPlaytests,
  POST as recordPlaytest,
} from "./decks/[id]/playtest-sessions/route";
import {
  GET as listSnapshots,
  POST as saveSnapshot,
} from "./decks/[id]/snapshots/route";
import { POST as addFavorite } from "./favorites/route";
import { POST as importFromUrl } from "./import/url/route";
import { GET as readMeta } from "./meta/[commanderSlug]/route";
import { GET as listReports } from "./moderation/deck-reports/route";
import { GET as openShare } from "./share/[token]/route";
import { POST as createTemplate } from "./templates/route";
import { DELETE as revokeApiKey } from "./user/api-keys/[id]/route";
import { PATCH as editProfile } from "./user/profile/route";
import { GET as readV1Collection } from "./v1/collection/route";
import { GET as listV1Decks } from "./v1/decks/route";
import { GET as readV1Deck } from "./v1/decks/[id]/route";

type Row = Readonly<Record<string, unknown>>;

const fake = vi.hoisted(() => ({
  /** Stands in for Auth.js `auth()`: resolves to the session cookie's content. */
  auth: vi.fn(),
  /** In-memory tables, by Prisma model name. */
  tables: new Map<string, readonly Row[]>(),
}));

vi.mock(import("@/lib/auth/config"), () => ({ auth: fake.auth }));

// The typed factory must return a `PrismaClient`, so the real (never
// connected) client is wrapped: every model call goes to `fake.tables`, and
// no query can reach a database.
vi.mock(import("@/lib/db/prisma"), async (importOriginal) => {
  const { prisma } = await importOriginal();
  return {
    prisma: new Proxy(prisma, {
      get: (_client, property) => fakeClientMember(property),
    }),
  };
});

/** @returns whether `value` is a plain object whose columns can be read */
function isRow(value: unknown): value is Row {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** @returns the rows whose columns equal every value in the `where` */
function rowsWhere(rows: readonly Row[], args: unknown): readonly Row[] {
  const where = isRow(args) && isRow(args.where) ? args.where : {};
  return rows.filter((row) =>
    Object.entries(where).every(
      ([column, value]) => value === undefined || row[column] === value
    )
  );
}

/**
 * A model delegate over one table. `select` and `include` are ignored, and
 * writes change nothing: the routes under test answer before they write, or
 * write only a timestamp (`lastUsedAt` of an API key).
 */
function modelDelegate(rows: readonly Row[]) {
  const first = async (args: unknown) => rowsWhere(rows, args)[0] ?? null;
  return {
    findUnique: first,
    findFirst: first,
    update: first,
    findMany: async (args: unknown) => rowsWhere(rows, args),
    updateMany: async (args: unknown) => ({
      count: rowsWhere(rows, args).length,
    }),
  };
}

/** @returns what the fake client answers for `prisma[property]` */
function fakeClientMember(property: string | symbol): unknown {
  if (typeof property !== "string" || property.startsWith("$"))
    return undefined;
  return modelDelegate(fake.tables.get(property) ?? []);
}

const OWNER_ID = "owner-1";
const STRANGER_ID = "stranger-1";
const PRIVATE_DECK_ID = "private-deck-1";
const PUBLIC_DECK_ID = "public-deck-1";
/** A well-formed API key; the seeded row gives it only `decks:read`. */
const DECKS_ONLY_KEY = mintApiKey();

/** An owner, a stranger, the owner's private and public decks, and their rows. */
function seedTables(): void {
  fake.tables.clear();
  fake.tables.set("user", [
    { id: OWNER_ID, isModerator: false },
    { id: STRANGER_ID, isModerator: false },
  ]);
  fake.tables.set("deck", [
    { id: PRIVATE_DECK_ID, userId: OWNER_ID, isPublic: false, cards: [] },
    { id: PUBLIC_DECK_ID, userId: OWNER_ID, isPublic: true, cards: [] },
  ]);
  fake.tables.set("collectionCard", [
    { id: "collection-card-1", userId: OWNER_ID },
  ]);
  fake.tables.set("apiKey", [
    {
      id: "api-key-1",
      userId: OWNER_ID,
      tokenHash: DECKS_ONLY_KEY.tokenHash,
      scopes: ["decks:read"],
      revokedAt: null,
      expiresAt: null,
      lastUsedAt: null,
    },
  ]);
}

/** Makes `auth()` answer with a session cookie for this account. */
function signInAs(userId: string): void {
  fake.auth.mockResolvedValue({ user: { id: userId }, expires: "2099-01-01" });
}

/**
 * @param body - a value sent as JSON, or a string sent as it is
 * @returns a request to `path`, as a client sends it
 */
function request(
  method: string,
  path: string,
  body?: unknown,
  headers: Record<string, string> = {}
): NextRequest {
  return new NextRequest(`http://localhost${path}`, {
    method,
    headers:
      body === undefined
        ? headers
        : { "content-type": "application/json", ...headers },
    body:
      body === undefined || typeof body === "string"
        ? body
        : JSON.stringify(body),
  });
}

/** @returns the `params` Next passes a dynamic route */
function params<T extends Record<string, string>>(values: T) {
  return { params: Promise.resolve(values) };
}

/** @returns the response's status and parsed JSON body, for one assertion */
async function answer(response: Response) {
  return { status: response.status, body: await response.json() };
}

/** The bearer header of the seeded key, which holds only `decks:read`. */
const DECKS_ONLY = { authorization: `Bearer ${DECKS_ONLY_KEY.token}` };

/** Zod 4's text for a string under its minimum length of `minimum`. */
const tooShort = (minimum: number) =>
  `Too small: expected string to have >=${minimum} characters`;

beforeEach(() => {
  fake.auth.mockReset();
  fake.auth.mockResolvedValue(null);
  seedTables();
  // `requireAuth` signs in a Playwright user when this flag is "1" outside
  // production; pin it off so each test controls the session.
  vi.stubEnv("PLAYWRIGHT_TEST", "0");
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      throw new Error("network is disabled in this suite");
    })
  );
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("400 from the shared JSON reader (readJsonBody, 33 routes)", () => {
  it("currently answers { error } for a body that is not JSON (pinned; B2-56)", async () => {
    signInAs(OWNER_ID);
    const response = await createFolder(
      request("POST", "/api/deck-folders", "{")
    );
    expect(await answer(response)).toEqual({
      status: 400,
      body: { error: "Malformed request body" },
    });
  });
});

describe("400 shape 1: { error: message }", () => {
  it("deck folders: currently answer { error } for an empty name (pinned; B2-56)", async () => {
    signInAs(OWNER_ID);
    const response = await createFolder(
      request("POST", "/api/deck-folders", { name: "   " })
    );
    expect(await answer(response)).toEqual({
      status: 400,
      body: { error: "Invalid folder name" },
    });
  });

  it("deck snapshots: currently answer { error } for a missing name (pinned; B2-56)", async () => {
    signInAs(OWNER_ID);
    const response = await saveSnapshot(
      request("POST", `/api/decks/${PRIVATE_DECK_ID}/snapshots`, {}),
      params({ id: PRIVATE_DECK_ID })
    );
    expect(await answer(response)).toEqual({
      status: 400,
      body: { error: "name is required" },
    });
  });

  it("playtest sessions: currently answer { error } with the parser's message (pinned; B2-56)", async () => {
    signInAs(OWNER_ID);
    const response = await recordPlaytest(
      request("POST", `/api/decks/${PRIVATE_DECK_ID}/playtest-sessions`, {
        result: "tie",
        turns: 1,
      }),
      params({ id: PRIVATE_DECK_ID })
    );
    expect(await answer(response)).toEqual({
      status: 400,
      body: { error: "result must be one of win, loss, draw" },
    });
  });

  it("share links: currently answer { error } for a malformed token (pinned; B2-56)", async () => {
    const response = await openShare(
      request("GET", "/api/share/bad-token!"),
      params({ token: "bad-token!" })
    );
    expect(await answer(response)).toEqual({
      status: 400,
      body: { error: "Invalid token" },
    });
  });

  it("commander meta: currently answers { error } for a malformed slug (pinned; B2-56)", async () => {
    const response = await readMeta(
      request("GET", "/api/meta/Not_A_Slug"),
      params({ commanderSlug: "Not_A_Slug" })
    );
    expect(await answer(response)).toEqual({
      status: 400,
      body: { error: "Invalid commander slug" },
    });
  });
});

describe("400 shape 2: { error, details: string[] } (Zod issue messages)", () => {
  it("decks: deck creation currently answers { error, details } (pinned; B2-56)", async () => {
    signInAs(OWNER_ID);
    const response = await createDeck(
      request("POST", "/api/decks", { name: "" })
    );
    expect(await answer(response)).toEqual({
      status: 400,
      body: { error: "Invalid input", details: [tooShort(1)] },
    });
  });

  it("collection: adding a card currently answers { error, details } (pinned; B2-56)", async () => {
    signInAs(OWNER_ID);
    const response = await addToCollection(
      request("POST", "/api/collection", { scryfallId: "scryfall-1", name: "" })
    );
    expect(await answer(response)).toEqual({
      status: 400,
      body: { error: "Invalid input", details: [tooShort(1)] },
    });
  });

  it("account: the profile edit currently answers { error, details } (pinned; B2-56)", async () => {
    signInAs(OWNER_ID);
    const response = await editProfile(
      request("PATCH", "/api/user/profile", {
        image: "ftp://example.test/a.png",
      })
    );
    expect(await answer(response)).toEqual({
      status: 400,
      body: { error: "Invalid input", details: ["Invalid image URL"] },
    });
  });

  it("sign-up: currently answers { error, details } (pinned; B2-56)", async () => {
    const response = await signUp(
      request("POST", "/api/auth/signup", {
        name: "Ana",
        email: "ana@example.test",
        password: "short",
      })
    );
    expect(await answer(response)).toEqual({
      status: 400,
      body: { error: "Invalid input", details: [tooShort(8)] },
    });
  });

  it("import: the URL import currently answers { error, details } (pinned; B2-56)", async () => {
    const response = await importFromUrl(
      request("POST", "/api/import/url", { url: "" })
    );
    expect(await answer(response)).toEqual({
      status: 400,
      body: { error: "Invalid request", details: [tooShort(1)] },
    });
  });

  it("combos: currently answer { error, details } (pinned; B2-56)", async () => {
    const response = await findCombos(
      request("POST", "/api/combos", { commanders: [], main: "Sol Ring" })
    );
    expect(await answer(response)).toEqual({
      status: 400,
      body: {
        error: "Invalid card list",
        details: ["Invalid input: expected array, received string"],
      },
    });
  });
});

describe("400 shape 3: { error, details: flattenError }", () => {
  it("deck: the deck edit currently answers { error, details: { formErrors, fieldErrors } } (pinned; B2-56)", async () => {
    signInAs(OWNER_ID);
    const response = await editDeck(
      request("PATCH", `/api/decks/${PRIVATE_DECK_ID}`, { name: "" }),
      params({ id: PRIVATE_DECK_ID })
    );
    expect(await answer(response)).toEqual({
      status: 400,
      body: {
        error: "Invalid request body",
        details: { formErrors: [], fieldErrors: { name: [tooShort(1)] } },
      },
    });
  });

  it("deck cards: adding a card currently answers { error, details: { formErrors, fieldErrors } } (pinned; B2-56)", async () => {
    signInAs(OWNER_ID);
    const response = await addDeckCard(
      request("POST", `/api/decks/${PRIVATE_DECK_ID}/cards`, {
        scryfallId: "not-a-uuid",
        name: "Sol Ring",
      }),
      params({ id: PRIVATE_DECK_ID })
    );
    expect(await answer(response)).toEqual({
      status: 400,
      body: {
        error: "Invalid request body",
        details: {
          formErrors: [],
          fieldErrors: { scryfallId: ["Invalid Scryfall ID"] },
        },
      },
    });
  });
});

describe("400 shape 4: { error: fieldErrors }", () => {
  it("community: a rating currently answers { error: { field: messages } } (pinned; B2-56)", async () => {
    signInAs(STRANGER_ID);
    const response = await rateDeck(
      request("POST", `/api/community/decks/${PUBLIC_DECK_ID}/ratings`, {
        rating: 0,
      }),
      params({ id: PUBLIC_DECK_ID })
    );
    expect(await answer(response)).toEqual({
      status: 400,
      body: { error: { rating: ["Too small: expected number to be >=1"] } },
    });
  });

  it("favorites: currently answer { error: { field: messages } } (pinned; B2-56)", async () => {
    const response = await addFavorite(
      request("POST", "/api/favorites", {
        scryfallId: "scryfall-1",
        name: "Sol Ring",
      })
    );
    expect(await answer(response)).toEqual({
      status: 400,
      body: {
        error: {
          typeLine: ["Invalid input: expected string, received undefined"],
        },
      },
    });
  });

  it("templates: currently answer { error: { field: messages } } (pinned; B2-56)", async () => {
    signInAs(OWNER_ID);
    const response = await createTemplate(
      request("POST", "/api/templates", {
        deckId: "not-a-uuid",
        templateName: "Turbo",
        archetype: "Combo",
      })
    );
    expect(await answer(response)).toEqual({
      status: 400,
      body: { error: { deckId: ["Invalid deck ID"] } },
    });
  });
});

describe("400 shape 5: { error: string[] }", () => {
  it("community: a blank comment currently answers { error: [messages] } (pinned; B2-56)", async () => {
    signInAs(STRANGER_ID);
    const response = await postComment(
      request("POST", `/api/community/decks/${PUBLIC_DECK_ID}/comments`, {
        body: "   ",
      }),
      params({ id: PUBLIC_DECK_ID })
    );
    expect(await answer(response)).toEqual({
      status: 400,
      body: { error: ["Comment cannot be empty"] },
    });
  });
});

describe("400 in /api/v1: { error: { code, message } }", () => {
  it("rejects an out-of-range page size in the v1 envelope", async () => {
    const response = await listV1Decks(
      request("GET", "/api/v1/decks?limit=500", undefined, DECKS_ONLY)
    );
    expect(await answer(response)).toEqual({
      status: 400,
      body: {
        error: {
          code: "invalid_request",
          message: "page must be >= 0 and limit between 1 and 100",
        },
      },
    });
  });
});

describe("403: signed in, but refused", () => {
  it("decks: requireDeckOwner currently answers 403 { error } for someone else's deck (pinned; B2-57 answers 404)", async () => {
    signInAs(STRANGER_ID);
    const response = await listSnapshots(
      request("GET", `/api/decks/${PRIVATE_DECK_ID}/snapshots`),
      params({ id: PRIVATE_DECK_ID })
    );
    expect(await answer(response)).toEqual({
      status: 403,
      body: { error: "Forbidden" },
    });
  });

  it("decks: the inline owner check currently answers 403 { error } for someone else's deck (pinned; B2-57 answers 404)", async () => {
    signInAs(STRANGER_ID);
    const response = await deleteDeck(
      request("DELETE", `/api/decks/${PRIVATE_DECK_ID}`),
      params({ id: PRIVATE_DECK_ID })
    );
    expect(await answer(response)).toEqual({
      status: 403,
      body: { error: "Forbidden" },
    });
  });

  it("collection: currently answers 403 { error } for someone else's card (pinned; B2-57 answers 404)", async () => {
    signInAs(STRANGER_ID);
    const response = await removeFromCollection(
      request("DELETE", "/api/collection/collection-card-1"),
      params({ id: "collection-card-1" })
    );
    expect(await answer(response)).toEqual({
      status: 403,
      body: { error: "Forbidden" },
    });
  });

  it("moderation: answers 403 { error } to an account that is not a moderator (pinned; B2-56)", async () => {
    signInAs(STRANGER_ID);
    const response = await listReports(
      request("GET", "/api/moderation/deck-reports")
    );
    expect(await answer(response)).toEqual({
      status: 403,
      body: { error: "Forbidden" },
    });
  });

  it("community: answers 403 { error } to an owner rating their own deck (pinned; B2-56)", async () => {
    signInAs(OWNER_ID);
    const response = await rateDeck(
      request("POST", `/api/community/decks/${PUBLIC_DECK_ID}/ratings`, {
        rating: 5,
      }),
      params({ id: PUBLIC_DECK_ID })
    );
    expect(await answer(response)).toEqual({
      status: 403,
      body: { error: "You cannot rate your own deck" },
    });
  });

  it("v1: answers 403 in the v1 envelope to a key without the scope", async () => {
    const response = await readV1Collection(
      request("GET", "/api/v1/collection", undefined, DECKS_ONLY)
    );
    expect(await answer(response)).toEqual({
      status: 403,
      body: {
        error: {
          code: "forbidden",
          message: 'This key is missing the "collection:read" scope',
        },
      },
    });
  });
});

describe("404: not found, or not yours", () => {
  it("decks: requireDeckOwner answers 404 { error } for a deck that does not exist (pinned; B2-56)", async () => {
    signInAs(OWNER_ID);
    const response = await listSnapshots(
      request("GET", "/api/decks/missing-deck/snapshots"),
      params({ id: "missing-deck" })
    );
    expect(await answer(response)).toEqual({
      status: 404,
      body: { error: "Deck not found" },
    });
  });

  it("playtest sessions: currently answer 404 { error } for someone else's deck, unlike the other deck routes (pinned; B2-57)", async () => {
    signInAs(STRANGER_ID);
    const response = await listPlaytests(
      request("GET", `/api/decks/${PRIVATE_DECK_ID}/playtest-sessions`),
      params({ id: PRIVATE_DECK_ID })
    );
    expect(await answer(response)).toEqual({
      status: 404,
      body: { error: "Deck not found" },
    });
  });

  it("deck folders: answer 404 { error } for someone else's folder (ownership in the query; pinned; B2-56)", async () => {
    signInAs(STRANGER_ID);
    const response = await renameFolder(
      request("PATCH", "/api/deck-folders/folder-1", { name: "Mine now" }),
      params({ folderId: "folder-1" })
    );
    expect(await answer(response)).toEqual({
      status: 404,
      body: { error: "Folder not found" },
    });
  });

  it("community folders: answer 404 { error } for someone else's folder (ownership in the query; pinned; B2-56)", async () => {
    signInAs(STRANGER_ID);
    const response = await renameCommunityFolder(
      request("PATCH", "/api/community/deck-folders/folder-1", {
        name: "Mine now",
      }),
      params({ folderId: "folder-1" })
    );
    expect(await answer(response)).toEqual({
      status: 404,
      body: { error: "Folder not found" },
    });
  });

  it("community: answers 404 { error } for someone else's private deck, as if it did not exist (pinned; B2-56)", async () => {
    signInAs(STRANGER_ID);
    const response = await postComment(
      request("POST", `/api/community/decks/${PRIVATE_DECK_ID}/comments`, {
        body: "Nice list",
      }),
      params({ id: PRIVATE_DECK_ID })
    );
    expect(await answer(response)).toEqual({
      status: 404,
      body: { error: "Deck not found" },
    });
  });

  it("community: answers 404 { error } when editing someone else's comment (pinned; B2-56)", async () => {
    signInAs(STRANGER_ID);
    const response = await editComment(
      request(
        "PATCH",
        `/api/community/decks/${PUBLIC_DECK_ID}/comments/comment-1`,
        { body: "Edited" }
      ),
      params({ id: PUBLIC_DECK_ID, commentId: "comment-1" })
    );
    expect(await answer(response)).toEqual({
      status: 404,
      body: { error: "Comment not found" },
    });
  });

  it("API keys: answer 404 { error } when revoking someone else's key (pinned; B2-56)", async () => {
    signInAs(STRANGER_ID);
    const response = await revokeApiKey(
      request("DELETE", "/api/user/api-keys/api-key-1"),
      params({ id: "api-key-1" })
    );
    expect(await answer(response)).toEqual({
      status: 404,
      body: { error: "API key not found" },
    });
  });

  it("share links: answer 404 { error } for a token no deck shares (pinned; B2-56)", async () => {
    const response = await openShare(
      request("GET", "/api/share/unknown-token"),
      params({ token: "unknown-token" })
    );
    expect(await answer(response)).toEqual({
      status: 404,
      body: { error: "Deck not found" },
    });
  });

  it("v1: answers 404 in the v1 envelope for a deck the key's owner does not own", async () => {
    fake.tables.set("deck", [
      { id: "stranger-deck", userId: STRANGER_ID, isPublic: true, cards: [] },
    ]);
    const response = await readV1Deck(
      request("GET", "/api/v1/decks/stranger-deck", undefined, DECKS_ONLY),
      params({ id: "stranger-deck" })
    );
    expect(await answer(response)).toEqual({
      status: 404,
      body: { error: { code: "not_found", message: "Deck not found" } },
    });
  });
});
