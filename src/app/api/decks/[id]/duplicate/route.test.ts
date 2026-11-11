// @vitest-environment node
/**
 * Characterization suite for `POST /api/decks/[id]/duplicate`: the owner's
 * "Duplicate" action, which writes a private copy of one of their decks. It
 * had no test (audit "server" §1.2 and §6 item 4); this pins which columns the
 * copy carries and which it leaves behind, today.
 *
 * Today the copy keeps the deck's format, brackets, budget and command zone,
 * and every card with its printing and zone. It drops the description, the
 * tags and each card's notes; B2-59 (owner decision OD-08) makes it keep them.
 *
 * The real `requireDeckOwner` runs against two boundary fakes: the Auth.js
 * session (`auth()` from `lib/auth/config`) and the Prisma client, whose
 * `deck.create` call is recorded.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fake = vi.hoisted(() => ({
  auth: vi.fn(),
  user: { findUnique: vi.fn() },
  deck: { findUnique: vi.fn(), create: vi.fn() },
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
  };
  return {
    prisma: new Proxy(prisma, {
      get: (_client, property) =>
        typeof property === "string" ? models[property] : undefined,
    }),
  };
});

import { POST } from "./route";

const OWNER_ID = "owner-1";
const STRANGER_ID = "stranger-1";
const DECK_ID = "deck-1";

/** One stored card, with a value in every column, notes included. */
const SOL_RING = {
  id: "card-1",
  deckId: DECK_ID,
  scryfallId: "scryfall-sol-ring",
  name: "Sol Ring",
  manaCost: "{1}",
  cmc: 1,
  typeLine: "Artifact",
  oracleText: "{T}: Add {C}{C}.",
  power: null,
  toughness: null,
  colorIdentity: [],
  isGameChanger: true,
  isBanned: false,
  price: 1.5,
  imageUri: "https://cards.scryfall.io/normal/sol-ring.webp",
  artCropUri: "https://cards.scryfall.io/art_crop/sol-ring.webp",
  category: "ramp",
  quantity: 1,
  isCommander: false,
  isPartner: false,
  notes: "Turn-one play",
  zone: "main",
};

/** The stored deck, with a value in every column a copy could carry. */
const ORIGINAL = {
  id: DECK_ID,
  name: "Atraxa Superfriends",
  description: "Proliferate planeswalkers.",
  tags: ["superfriends", "proliferate"],
  format: "commander",
  targetBracket: 4,
  budget: 250,
  commanderId: "card-atraxa",
  commanderName: "Atraxa, Praetors' Voice",
  partnerId: null,
  companionId: "card-companion",
  pairingType: "none",
  manualBracket: 3,
  shareToken: "share-token-1",
  shareEnabled: true,
  isPublic: true,
  seekingFeedback: true,
  feedbackQuestion: "Too many walkers?",
  isAIGenerated: true,
  forkedFromDeckId: "deck-0",
  forkedFromDeckName: "Original Atraxa",
  forkedFromUserName: "someone",
  userId: OWNER_ID,
  folderId: "folder-1",
  idempotencyKey: "key-1",
  createdAt: new Date("2026-08-01T10:00:00.000Z"),
  updatedAt: new Date("2026-08-20T10:00:00.000Z"),
  cards: [SOL_RING],
};

/** @returns the `data` the route passed to `deck.create` */
function createdData(): Record<string, unknown> {
  const [call] = fake.deck.create.mock.calls;
  const [args] = call ?? [];
  return args?.data ?? {};
}

/** @returns the first card row the route asked `deck.create` to write */
function createdCard(): Record<string, unknown> {
  const cards = createdData().cards;
  const rows =
    typeof cards === "object" && cards !== null && "create" in cards
      ? cards.create
      : [];
  return Array.isArray(rows) ? rows[0] : {};
}

/** Signs this account in, as the session cookie and the user row agree. */
function signInAs(userId: string): void {
  fake.auth.mockResolvedValue({ user: { id: userId }, expires: "2099-01-01" });
  fake.user.findUnique.mockResolvedValue({ id: userId });
}

/** @returns the route's answer to a duplicate request for `deckId` */
function duplicate(deckId = DECK_ID): Promise<Response> {
  return POST(
    new Request(`http://localhost/api/decks/${deckId}/duplicate`, {
      method: "POST",
    }),
    { params: Promise.resolve({ id: deckId }) }
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("PLAYWRIGHT_TEST", "0");
  signInAs(OWNER_ID);
  fake.deck.findUnique.mockResolvedValue(ORIGINAL);
  fake.deck.create.mockImplementation(async ({ data }) => ({
    ...data,
    id: "deck-copy",
    cards: [],
  }));
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("POST /api/decks/[id]/duplicate", () => {
  it("answers 201 with the copy the database wrote", async () => {
    const response = await duplicate();
    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({
      id: "deck-copy",
      name: "Atraxa Superfriends (Copy)",
    });
  });

  it("writes the copy for the caller, with exactly these deck columns", async () => {
    await duplicate();

    expect(fake.deck.create).toHaveBeenCalledWith({
      data: expect.any(Object),
      include: { cards: true },
    });
    const { cards: _cards, ...columns } = createdData();
    expect(columns).toEqual({
      name: "Atraxa Superfriends (Copy)",
      format: "commander",
      targetBracket: 4,
      manualBracket: 3,
      budget: 250,
      commanderId: "card-atraxa",
      commanderName: "Atraxa, Praetors' Voice",
      partnerId: null,
      companionId: "card-companion",
      pairingType: "none",
      userId: OWNER_ID,
    });
  });

  it("copies every card with exactly these columns, printing and zone included", async () => {
    await duplicate();

    expect(createdCard()).toEqual({
      scryfallId: "scryfall-sol-ring",
      name: "Sol Ring",
      manaCost: "{1}",
      cmc: 1,
      typeLine: "Artifact",
      oracleText: "{T}: Add {C}{C}.",
      power: null,
      toughness: null,
      colorIdentity: [],
      isGameChanger: true,
      isBanned: false,
      price: 1.5,
      imageUri: "https://cards.scryfall.io/normal/sol-ring.webp",
      artCropUri: "https://cards.scryfall.io/art_crop/sol-ring.webp",
      category: "ramp",
      quantity: 1,
      isCommander: false,
      isPartner: false,
      zone: "main",
    });
  });

  it("currently drops the description, the tags and each card's notes (pinned; B2-59 keeps them)", async () => {
    await duplicate();

    expect(createdData()).not.toHaveProperty("description");
    expect(createdData()).not.toHaveProperty("tags");
    expect(createdCard()).not.toHaveProperty("notes");
  });

  it("starts the copy private, unshared, unfiled and not seeking feedback", async () => {
    await duplicate();

    for (const column of [
      "isPublic",
      "shareToken",
      "shareEnabled",
      "folderId",
      "seekingFeedback",
      "feedbackQuestion",
    ]) {
      expect(createdData()).not.toHaveProperty(column);
    }
  });

  it("does not carry the AI flag, the fork origin or the creation key", async () => {
    await duplicate();

    for (const column of [
      "isAIGenerated",
      "forkedFromDeckId",
      "forkedFromDeckName",
      "forkedFromUserName",
      "idempotencyKey",
    ]) {
      expect(createdData()).not.toHaveProperty(column);
    }
  });

  it("refuses a caller with no session with 401", async () => {
    fake.auth.mockResolvedValue(null);
    const response = await duplicate();
    expect(response.status).toBe(401);
    expect(fake.deck.create).not.toHaveBeenCalled();
  });

  it("currently refuses someone else's deck with 403 (pinned; B2-57 answers 404)", async () => {
    signInAs(STRANGER_ID);
    const response = await duplicate();
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "Forbidden" });
    expect(fake.deck.create).not.toHaveBeenCalled();
  });

  it("answers 404 for a deck that does not exist", async () => {
    fake.deck.findUnique.mockResolvedValue(null);
    const response = await duplicate("missing-deck");
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Deck not found" });
  });

  it("answers 404 when the deck is deleted between the ownership check and the read", async () => {
    fake.deck.findUnique
      .mockResolvedValueOnce(ORIGINAL)
      .mockResolvedValueOnce(null);
    const response = await duplicate();
    expect(response.status).toBe(404);
    expect(fake.deck.create).not.toHaveBeenCalled();
  });

  it("answers 500 with a message when the copy cannot be written", async () => {
    fake.deck.create.mockRejectedValue(new Error("connection lost"));
    const response = await duplicate();
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "Failed to duplicate deck",
    });
  });
});
