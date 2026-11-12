// @vitest-environment node
/**
 * Characterization suite for `GET` and `POST /api/deck-folders`: the private
 * folders a player files their own decks into. It had no test (audit
 * "server" §6 item 4); this pins what the route does today, before the deck
 * folders move behind a repository.
 *
 * The real `requireAuth` runs against two boundary fakes: the Auth.js session
 * (`auth()` from `lib/auth/config`) and the Prisma client, whose `deckFolder`
 * calls are recorded so the ownership filter in the query is pinned too.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fake = vi.hoisted(() => ({
  auth: vi.fn(),
  user: { findUnique: vi.fn() },
  deckFolder: { findMany: vi.fn(), create: vi.fn() },
}));

vi.mock(import("@/lib/auth/config"), () => ({ auth: fake.auth }));

// The typed factory must return a `PrismaClient`, so the real (never
// connected) client is wrapped and each model this route reads is answered by
// a recorded stub. Any other model is undefined, so a stray query fails.
vi.mock(import("@/lib/db/prisma"), async (importOriginal) => {
  const { prisma } = await importOriginal();
  const models: Readonly<Record<string, unknown>> = {
    user: fake.user,
    deckFolder: fake.deckFolder,
  };
  return {
    prisma: new Proxy(prisma, {
      get: (_client, property) =>
        typeof property === "string" ? models[property] : undefined,
    }),
  };
});

import { GET, POST } from "./route";

const PLAYER_ID = "player-1";

/** @returns a create request; a string body is sent as it is */
function createRequest(body: unknown): Request {
  return new Request("http://localhost/api/deck-folders", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

/** Prisma's unique-constraint error, as `@@unique([userId, name])` raises it. */
function uniqueViolation(): Error {
  return Object.assign(
    new Error("Unique constraint failed on the fields: (`userId`,`name`)"),
    {
      code: "P2002",
    }
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("PLAYWRIGHT_TEST", "0");
  fake.auth.mockResolvedValue({
    user: { id: PLAYER_ID },
    expires: "2099-01-01",
  });
  fake.user.findUnique.mockResolvedValue({ id: PLAYER_ID });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("GET /api/deck-folders", () => {
  it("refuses a caller with no session", async () => {
    fake.auth.mockResolvedValue(null);
    const response = await GET();
    expect(response.status).toBe(401);
    expect(fake.deckFolder.findMany).not.toHaveBeenCalled();
  });

  it("lists only the caller's folders, by name, each with its deck count", async () => {
    const folders = [
      { id: "folder-a", name: "Casual", _count: { decks: 2 } },
      { id: "folder-b", name: "Competitive", _count: { decks: 0 } },
    ];
    fake.deckFolder.findMany.mockResolvedValue(folders);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ folders });
    expect(fake.deckFolder.findMany).toHaveBeenCalledWith({
      where: { userId: PLAYER_ID },
      orderBy: { name: "asc" },
      select: { id: true, name: true, _count: { select: { decks: true } } },
    });
  });

  it("answers 500 with a message when the folders cannot be read", async () => {
    fake.deckFolder.findMany.mockRejectedValue(new Error("connection lost"));
    const response = await GET();
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Failed to load deck folders",
    });
  });
});

describe("POST /api/deck-folders", () => {
  it("refuses a caller with no session", async () => {
    fake.auth.mockResolvedValue(null);
    const response = await POST(createRequest({ name: "Casual" }));
    expect(response.status).toBe(401);
    expect(fake.deckFolder.create).not.toHaveBeenCalled();
  });

  it("creates the folder for the caller, with the name trimmed, and answers 201", async () => {
    fake.deckFolder.create.mockResolvedValue({
      id: "folder-a",
      name: "Casual",
    });

    const response = await POST(createRequest({ name: "  Casual  " }));

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ id: "folder-a", name: "Casual" });
    expect(fake.deckFolder.create).toHaveBeenCalledWith({
      data: { userId: PLAYER_ID, name: "Casual" },
      select: { id: true, name: true },
    });
  });

  it("accepts a name of 80 characters, the longest allowed", async () => {
    const name = "x".repeat(80);
    fake.deckFolder.create.mockResolvedValue({ id: "folder-a", name });
    const response = await POST(createRequest({ name }));
    expect(response.status).toBe(201);
  });

  it.each([
    ["a blank name", { name: "   " }],
    ["a name of 81 characters", { name: "x".repeat(81) }],
    ["no name", {}],
    ["a name that is not text", { name: 42 }],
  ])("refuses %s with 400 and creates nothing", async (_case, body) => {
    const response = await POST(createRequest(body));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid folder name" });
    expect(fake.deckFolder.create).not.toHaveBeenCalled();
  });

  it("refuses a body that is not JSON with 400", async () => {
    const response = await POST(createRequest("{"));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Malformed request body" });
  });

  it("currently answers 500 when the caller already has a folder of that name (pinned; B2-10 answers 409)", async () => {
    fake.deckFolder.create.mockRejectedValue(uniqueViolation());
    const response = await POST(createRequest({ name: "Casual" }));
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Failed to create deck folder",
    });
  });
});
