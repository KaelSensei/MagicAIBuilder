// @vitest-environment node
/**
 * Characterization suite for `GET` and `POST /api/decks/[id]/snapshots`: the
 * owner's saved versions of a deck, listed and created. The route was tested
 * only through the playtest version test (audit "server" §1.2 and §6 item 4);
 * this pins what it does today, its hand-parsed body included, before it moves
 * behind a use case.
 *
 * The real `requireDeckOwner` runs against two boundary fakes: the Auth.js
 * session (`auth()` from `lib/auth/config`) and the Prisma client, whose
 * `deck` and `deckSnapshot` calls are recorded.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fake = vi.hoisted(() => ({
  auth: vi.fn(),
  user: { findUnique: vi.fn() },
  deck: { findUnique: vi.fn() },
  deckSnapshot: { findMany: vi.fn(), create: vi.fn() },
}));

vi.mock(import("@/lib/auth/config"), () => ({ auth: fake.auth }));

// The typed factory must return a `PrismaClient`, so the real (never
// connected) client is wrapped and each model this route reads is answered by
// a recorded stub. Any other model is undefined, so a stray query fails.
vi.mock(import("@/lib/db/prisma"), async (importOriginal) => {
  const { prisma } = await importOriginal();
  const models: Readonly<Record<string, unknown>> = {
    user: fake.user,
    deck: fake.deck,
    deckSnapshot: fake.deckSnapshot,
  };
  return {
    prisma: new Proxy(prisma, {
      get: (_client, property) =>
        typeof property === "string" ? models[property] : undefined,
    }),
  };
});

import { GET, POST } from "./route";

const OWNER_ID = "owner-1";
const STRANGER_ID = "stranger-1";
const DECK_ID = "deck-1";

/** @returns a stored card row of the deck, one copy in the main deck */
function cardRow(name: string, overrides: Record<string, unknown> = {}) {
  return {
    id: `card-${name}`,
    deckId: DECK_ID,
    name,
    quantity: 1,
    isCommander: false,
    isPartner: false,
    zone: "main",
    notes: null,
    ...overrides,
  };
}

const ATRAXA = cardRow("Atraxa, Praetors' Voice", { isCommander: true });
const FORESTS = cardRow("Forest", { quantity: 10 });
const SOL_RING = cardRow("Sol Ring", { notes: "Turn-one play" });

/** The owner's deck, with its card rows as `include: { cards: true }` reads them. */
const DECK = {
  id: DECK_ID,
  userId: OWNER_ID,
  commanderId: ATRAXA.id,
  cards: [ATRAXA, FORESTS, SOL_RING],
};

/** Signs this account in, as the session cookie and the user row agree. */
function signInAs(userId: string): void {
  fake.auth.mockResolvedValue({ user: { id: userId }, expires: "2099-01-01" });
  fake.user.findUnique.mockResolvedValue({ id: userId });
}

const context = (deckId = DECK_ID) => ({
  params: Promise.resolve({ id: deckId }),
});

/** @returns the route's answer to a snapshot list request */
function listSnapshots(deckId = DECK_ID): Promise<Response> {
  return GET(
    new Request(`http://localhost/api/decks/${deckId}/snapshots`),
    context(deckId)
  );
}

/** @returns the route's answer to a save; a string body is sent as it is */
function saveSnapshot(body: unknown, deckId = DECK_ID): Promise<Response> {
  return POST(
    new Request(`http://localhost/api/decks/${deckId}/snapshots`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
    context(deckId)
  );
}

/** @returns the `data` the route passed to `deckSnapshot.create` */
function createdSnapshot(): Record<string, unknown> {
  const [call] = fake.deckSnapshot.create.mock.calls;
  const [args] = call ?? [];
  return args?.data ?? {};
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("PLAYWRIGHT_TEST", "0");
  signInAs(OWNER_ID);
  fake.deck.findUnique.mockResolvedValue(DECK);
  fake.deckSnapshot.create.mockImplementation(async ({ data }) => ({
    id: "snapshot-1",
    createdAt: new Date("2026-11-10T12:00:00.000Z"),
    ...data,
  }));
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("GET /api/decks/[id]/snapshots", () => {
  it("lists the deck's snapshots, newest first, without their card lists", async () => {
    const rows = [
      {
        id: "snapshot-2",
        name: "After the cuts",
        commander: "Atraxa, Praetors' Voice",
        cardCount: 3,
        createdAt: new Date("2026-11-10T12:00:00.000Z"),
      },
    ];
    fake.deckSnapshot.findMany.mockResolvedValue(rows);

    const response = await listSnapshots();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      { ...rows[0], createdAt: "2026-11-10T12:00:00.000Z" },
    ]);
    expect(fake.deckSnapshot.findMany).toHaveBeenCalledWith({
      where: { deckId: DECK_ID },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        commander: true,
        cardCount: true,
        createdAt: true,
      },
    });
  });

  it("refuses a caller with no session with 401", async () => {
    fake.auth.mockResolvedValue(null);
    expect((await listSnapshots()).status).toBe(401);
    expect(fake.deckSnapshot.findMany).not.toHaveBeenCalled();
  });

  it("currently refuses someone else's deck with 403 (pinned; B2-57 answers 404)", async () => {
    signInAs(STRANGER_ID);
    const response = await listSnapshots();
    expect(response.status).toBe(403);
    expect(fake.deckSnapshot.findMany).not.toHaveBeenCalled();
  });

  it("answers 404 for a deck that does not exist", async () => {
    fake.deck.findUnique.mockResolvedValue(null);
    const response = await listSnapshots("missing-deck");
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Deck not found" });
  });

  it("answers 500 with a message when the snapshots cannot be read", async () => {
    fake.deckSnapshot.findMany.mockRejectedValue(new Error("connection lost"));
    const response = await listSnapshots();
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Failed to fetch snapshots",
    });
  });
});

describe("POST /api/decks/[id]/snapshots", () => {
  it("saves the deck's current card rows under the name and answers 201 with the snapshot", async () => {
    const response = await saveSnapshot({ name: "Before the cuts" });

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({
      id: "snapshot-1",
      deckId: DECK_ID,
      name: "Before the cuts",
    });
    expect(fake.deck.findUnique).toHaveBeenLastCalledWith({
      where: { id: DECK_ID },
      include: { cards: true },
    });
    expect(createdSnapshot()).toEqual({
      deckId: DECK_ID,
      name: "Before the cuts",
      cardList: [ATRAXA, FORESTS, SOL_RING],
      commander: "Atraxa, Praetors' Voice",
      cardCount: 3,
    });
  });

  it("keeps each card's notes and zone in the stored card list", async () => {
    await saveSnapshot({ name: "Before the cuts" });
    expect(createdSnapshot().cardList).toContainEqual(
      expect.objectContaining({
        name: "Sol Ring",
        notes: "Turn-one play",
        zone: "main",
      })
    );
  });

  it("counts card rows, not copies: ten Forests in one row count once", async () => {
    await saveSnapshot({ name: "Before the cuts" });
    expect(createdSnapshot().cardCount).toBe(3);
  });

  it("strips HTML tags from the name and trims it", async () => {
    await saveSnapshot({ name: "  <b>Before</b> the <i>cuts</i>  " });
    expect(createdSnapshot().name).toBe("Before the cuts");
  });

  it("cuts the name to 100 characters", async () => {
    await saveSnapshot({ name: "x".repeat(150) });
    expect(createdSnapshot().name).toBe("x".repeat(100));
  });

  it("ignores body fields other than the name", async () => {
    await saveSnapshot({
      name: "Before the cuts",
      cardCount: 99,
      deckId: "deck-9",
    });
    expect(createdSnapshot()).toMatchObject({ deckId: DECK_ID, cardCount: 3 });
  });

  it.each([
    ["no name", {}],
    ["an empty name", { name: "" }],
    ["a name that is not text", { name: 42 }],
    ["a body that is not an object", ["Before the cuts"]],
  ])(
    "refuses %s with 400 { error: 'name is required' }",
    async (_case, body) => {
      const response = await saveSnapshot(body);
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: "name is required" });
      expect(fake.deckSnapshot.create).not.toHaveBeenCalled();
    }
  );

  it("refuses a name that is blank once its tags are stripped with 400", async () => {
    const response = await saveSnapshot({ name: "  <b></b>  " });
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "name must be a non-empty string",
    });
    expect(fake.deckSnapshot.create).not.toHaveBeenCalled();
  });

  it("refuses a body that is not JSON with 400", async () => {
    const response = await saveSnapshot("{");
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Malformed request body" });
  });

  it("refuses a caller with no session with 401", async () => {
    fake.auth.mockResolvedValue(null);
    expect((await saveSnapshot({ name: "Before the cuts" })).status).toBe(401);
    expect(fake.deckSnapshot.create).not.toHaveBeenCalled();
  });

  it("currently refuses someone else's deck with 403 (pinned; B2-57 answers 404)", async () => {
    signInAs(STRANGER_ID);
    const response = await saveSnapshot({ name: "Before the cuts" });
    expect(response.status).toBe(403);
    expect(fake.deckSnapshot.create).not.toHaveBeenCalled();
  });

  it("answers 404 when the deck is deleted between the ownership check and the read", async () => {
    fake.deck.findUnique
      .mockResolvedValueOnce(DECK)
      .mockResolvedValueOnce(null);
    const response = await saveSnapshot({ name: "Before the cuts" });
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Deck not found" });
  });

  it("answers 500 with a message when the snapshot cannot be written", async () => {
    fake.deckSnapshot.create.mockRejectedValue(new Error("connection lost"));
    const response = await saveSnapshot({ name: "Before the cuts" });
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Failed to create snapshot",
    });
  });
});
