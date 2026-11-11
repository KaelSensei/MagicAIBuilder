import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Deck, DeckCard } from "@prisma/client";

// ─── Mock Prisma ──────────────────────────────────────────────────────────────
// vi.mock() is hoisted to the top of the file by Vitest, so factory variables
// must be created with vi.hoisted() to ensure they're initialized in time.

const { mockDeckFindUnique, mockLoggerError } = vi.hoisted(() => ({
  mockDeckFindUnique: vi.fn(),
  mockLoggerError: vi.fn(),
}));

vi.mock(import("@/lib/db/prisma"), async (importOriginal) => {
  const { stubPrisma } = await import("@/test/prisma-stub");
  return stubPrisma(await importOriginal(), {
    deck: {
      findUnique: mockDeckFindUnique,
    },
  });
});

vi.mock(import("@/lib/logger"), () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: mockLoggerError },
}));

// ─── Import route handler after mocks are in place ───────────────────────────

import { GET } from "@/app/api/share/[token]/route";

/**
 * GET /api/share/[token] needs no session. A share token is a capability: it
 * opens the deck behind it, public or private, while sharing stays enabled.
 * What the link holder receives must still stop at what the share page
 * renders — never the token, the owner, or the owner's private columns.
 *
 * The database is replaced by in-memory decks that honour the parts of a
 * Prisma query the route can use — `where` equality, `select` (with a nested
 * relation `select`), `include` and `omit` — so these tests assert what a
 * caller receives, not which query the route happens to build.
 */

// ─── In-memory decks ──────────────────────────────────────────────────────────

const TOKEN = "abc123XYZABC";
const OWNER_ID = "owner-1";

type Row = Readonly<Record<string, unknown>>;

interface StoredDeck {
  readonly columns: Deck;
  readonly cards: readonly DeckCard[];
  readonly user: Row | null;
}

/** Every `DeckCard` column; typed as the Prisma model so a new column must be filled in here. */
function cardRow(
  overrides: Partial<DeckCard> & Pick<DeckCard, "id" | "name">
): DeckCard {
  return {
    deckId: "cltest123",
    scryfallId: `scry-${overrides.id}`,
    manaCost: "",
    cmc: 0,
    typeLine: "",
    oracleText: "",
    power: null,
    toughness: null,
    colorIdentity: [],
    isGameChanger: false,
    isBanned: false,
    price: null,
    imageUri: `https://img.test/${overrides.id}.jpg`,
    artCropUri: `https://img.test/${overrides.id}-art.jpg`,
    category: "other",
    quantity: 1,
    isCommander: false,
    isPartner: false,
    notes: null,
    zone: "main",
    ...overrides,
  };
}

const COMMANDER = cardRow({
  id: "card-atraxa",
  name: "Atraxa, Praetors' Voice",
  manaCost: "{G}{W}{U}{B}",
  cmc: 4,
  typeLine: "Legendary Creature — Phyrexian Angel Horror",
  oracleText: "Flying, vigilance, deathtouch, lifelink",
  power: "4",
  toughness: "4",
  colorIdentity: ["W", "U", "B", "G"],
  isGameChanger: true,
  price: 8.5,
  category: "commander",
  isCommander: true,
  notes: "Owner's private plan: swap for Tymna after the tournament",
});

const SOL_RING = cardRow({
  id: "card-sol-ring",
  name: "Sol Ring",
  manaCost: "{1}",
  cmc: 1,
  typeLine: "Artifact",
  price: 1.25,
  category: "ramp",
  quantity: 1,
  isGameChanger: true,
  notes: "borrowed from Alex — give back",
});

const CONSIDERING = cardRow({
  id: "card-doubling-season",
  name: "Doubling Season",
  manaCost: "{4}{G}",
  cmc: 5,
  colorIdentity: ["G"],
  price: 45,
  category: "winCondition",
  zone: "maybeboard",
});

/**
 * Every `Deck` column of a private deck shared by link, including the ones
 * only its owner should see. Typed as the Prisma model, so adding a column to
 * `Deck` fails `tsc` here until the column is given a value — and then the
 * key test below fails if the route starts sending it.
 */
const SHARED_PRIVATE_DECK: Deck = {
  id: "cltest123",
  name: "Atraxa Superfriends",
  description: "Proliferate everything.",
  tags: ["proxy-test", "for-friday"],
  format: "commander",
  targetBracket: 3,
  budget: 250,
  commanderId: "scry-card-atraxa",
  commanderName: "Atraxa, Praetors' Voice",
  partnerId: null,
  companionId: null,
  pairingType: "none",
  manualBracket: 4,
  shareToken: TOKEN,
  shareEnabled: true,
  isPublic: false,
  seekingFeedback: true,
  feedbackQuestion: "Too few board wipes?",
  isAIGenerated: false,
  forkedFromDeckId: "deck-0",
  forkedFromDeckName: "Original Atraxa",
  forkedFromUserName: "mentor",
  userId: OWNER_ID,
  folderId: "folder-private",
  // Set, so the allowlist tests also prove the guest import key stays private.
  idempotencyKey: "guest-import-key",
  createdAt: new Date("2026-03-21T00:00:00Z"),
  updatedAt: new Date("2026-03-21T12:00:00Z"),
};

const OWNER_ROW: Row = {
  id: OWNER_ID,
  name: "Deck Owner",
  username: "owner",
  image: null,
  email: "owner@test.com",
};

function storedDeck(overrides: Partial<Deck> = {}): StoredDeck {
  return {
    columns: { ...SHARED_PRIVATE_DECK, ...overrides },
    cards: [COMMANDER, SOL_RING, CONSIDERING],
    user: OWNER_ROW,
  };
}

function isRecord(value: unknown): value is Row {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function matchesWhere(row: Row, where: Row): boolean {
  return Object.entries(where).every(([key, value]) => row[key] === value);
}

/** Applies `true` or `{ select }` to a relation value (one row or a list). */
function readRelation(value: unknown, spec: unknown): unknown {
  const select = isRecord(spec) && isRecord(spec.select) ? spec.select : null;
  const narrow = (item: unknown): unknown =>
    select !== null && isRecord(item) ? selectColumns(item, {}, select) : item;
  return Array.isArray(value) ? value.map(narrow) : narrow(value);
}

function selectColumns(row: Row, relations: Row, select: Row): Row {
  const result: Record<string, unknown> = {};
  for (const [key, spec] of Object.entries(select)) {
    if (!spec) continue;
    result[key] =
      key in relations ? readRelation(relations[key], spec) : row[key];
  }
  return result;
}

function readDeck(stored: StoredDeck, args: Row): Row {
  const relations: Row = { cards: stored.cards, user: stored.user };
  if (isRecord(args.select)) {
    return selectColumns(stored.columns, relations, args.select);
  }
  const include = isRecord(args.include) ? args.include : {};
  const omit = isRecord(args.omit) ? args.omit : {};
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(stored.columns)) {
    if (!omit[key]) result[key] = value;
  }
  for (const [key, spec] of Object.entries(include)) {
    if (spec) result[key] = readRelation(relations[key], spec);
  }
  return result;
}

/** Stands in for `prisma.deck.findUnique` over the given decks. */
function storeDecks(...decks: readonly StoredDeck[]): void {
  mockDeckFindUnique.mockImplementation(async (args: unknown) => {
    if (!isRecord(args) || !isRecord(args.where)) {
      throw new Error("findUnique needs a where");
    }
    const where = args.where;
    const match = decks.find((deck) => matchesWhere(deck.columns, where));
    return match ? readDeck(match, args) : null;
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(token: string): Request {
  return new Request(`http://localhost:3000/api/share/${token}`);
}

function makeParams(token: string): { params: Promise<{ token: string }> } {
  return { params: Promise.resolve({ token }) };
}

async function getShared(token: string): Promise<Response> {
  return GET(makeRequest(token), makeParams(token));
}

function sortedKeys(value: unknown): readonly string[] {
  return isRecord(value) ? Object.keys(value).sort() : [];
}

function cardsOf(value: unknown): readonly unknown[] {
  return isRecord(value) && Array.isArray(value.cards) ? value.cards : [];
}

// ─── What a link holder receives ──────────────────────────────────────────────

/** The deck fields `/share/[token]` reads (page metadata and `ShareDeckView`). */
const SHARED_DECK_KEYS = [
  "budget",
  "cards",
  "format",
  "id",
  "name",
  "targetBracket",
];

/** The card fields `ShareDeckView` reads. */
const SHARED_CARD_KEYS = [
  "artCropUri",
  "category",
  "cmc",
  "colorIdentity",
  "id",
  "imageUri",
  "isCommander",
  "isGameChanger",
  "isPartner",
  "manaCost",
  "name",
  "quantity",
];

function sharedCard(card: DeckCard) {
  return {
    id: card.id,
    name: card.name,
    manaCost: card.manaCost,
    cmc: card.cmc,
    colorIdentity: card.colorIdentity,
    imageUri: card.imageUri,
    artCropUri: card.artCropUri,
    category: card.category,
    quantity: card.quantity,
    isCommander: card.isCommander,
    isPartner: card.isPartner,
    isGameChanger: card.isGameChanger,
  };
}

const SHARED_VIEW = {
  id: "cltest123",
  name: "Atraxa Superfriends",
  format: "commander",
  targetBracket: 3,
  budget: 250,
  cards: [COMMANDER, SOL_RING, CONSIDERING].map(sharedCard),
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("GET /api/share/[token]", () => {
  beforeEach(() => {
    mockDeckFindUnique.mockReset();
    mockLoggerError.mockReset();
    storeDecks(storedDeck());
  });

  // ── What the link holder receives ──────────────────────────────────────────

  describe("the shared view", () => {
    it("serves a private deck to the holder of an enabled link", async () => {
      const res = await getShared(TOKEN);

      expect(res.status).toBe(200);
    });

    it("returns exactly the deck and card keys the share page reads", async () => {
      const body: unknown = await (await getShared(TOKEN)).json();

      expect(sortedKeys(body)).toEqual(SHARED_DECK_KEYS);
      const cards = cardsOf(body);
      expect(cards).toHaveLength(3);
      for (const card of cards) {
        expect(sortedKeys(card)).toEqual(SHARED_CARD_KEYS);
      }
    });

    it("returns the rendered values, maybeboard row included", async () => {
      const res = await getShared(TOKEN);

      expect(await res.json()).toEqual(SHARED_VIEW);
    });

    it("never returns the token, the owner or owner-only columns", async () => {
      const raw = await (await getShared(TOKEN)).text();

      for (const secret of [
        TOKEN,
        OWNER_ID,
        "owner@test.com",
        "folder-private",
        "for-friday",
        "borrowed from Alex",
        "swap for Tymna",
      ]) {
        expect(raw).not.toContain(secret);
      }
    });
  });

  // ── Not found / revoked ─────────────────────────────────────────────────────

  describe("links that no longer open a deck", () => {
    it("404s an unknown token", async () => {
      const res = await getShared("unknowntoken1");

      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ error: "Deck not found" });
    });

    it("404s a revoked link (sharing disabled, token cleared)", async () => {
      storeDecks(storedDeck({ shareToken: null, shareEnabled: false }));

      const res = await getShared(TOKEN);

      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ error: "Deck not found" });
    });

    it("404s a token whose deck has sharing disabled", async () => {
      storeDecks(storedDeck({ shareEnabled: false }));

      const res = await getShared(TOKEN);

      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ error: "Deck not found" });
    });
  });

  // ── Validation ──────────────────────────────────────────────────────────────

  it("returns 400 for an empty token", async () => {
    const res = await getShared("");

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeTruthy();
    expect(mockDeckFindUnique).not.toHaveBeenCalled();
  });

  it("returns 400 for a token exceeding 64 characters", async () => {
    const res = await getShared("a".repeat(65));

    expect(res.status).toBe(400);
    expect(mockDeckFindUnique).not.toHaveBeenCalled();
  });

  it("returns 400 for a token with invalid characters (spaces, <, >, etc.)", async () => {
    const res = await getShared("bad token!<>");

    expect(res.status).toBe(400);
    expect(mockDeckFindUnique).not.toHaveBeenCalled();
  });

  it("accepts tokens with base64url special chars (- and _)", async () => {
    const token = "aB3-xY_z1qAB";
    storeDecks(storedDeck({ shareToken: token }));

    const res = await getShared(token);

    expect(res.status).toBe(200);
  });

  // ── Error handling ──────────────────────────────────────────────────────────

  it("returns 500 when Prisma throws an unexpected error", async () => {
    mockDeckFindUnique.mockRejectedValueOnce(new Error("DB connection lost"));

    const res = await getShared(TOKEN);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  it("does not log a bearer share token when the database lookup fails", async () => {
    mockDeckFindUnique.mockRejectedValueOnce(new Error("DB connection lost"));

    await getShared(TOKEN);

    expect(mockLoggerError).toHaveBeenCalledWith(
      "DB connection lost",
      "GET /api/share/:token"
    );
  });
});
