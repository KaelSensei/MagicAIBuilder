import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockDeckFindUnique, mockAuth } = vi.hoisted(() => ({
  mockDeckFindUnique: vi.fn(),
  mockAuth: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: { deck: { findUnique: mockDeckFindUnique } },
}));
vi.mock("@/lib/auth/config", () => ({ auth: mockAuth }));

import { GET } from "./route";
import { PUBLIC_DECK_READS_PER_CLIENT } from "@/lib/deck/public-read-policy";

/**
 * GET /api/deck/[id] is unauthenticated: it serves any public deck to anyone,
 * and the public deck page and the community comparison read it.
 *
 * The database is replaced by an in-memory deck that honours the parts of a
 * Prisma query the route can use — `where` equality, `select`, `include` and
 * `omit` — so these tests assert what a caller receives, not which query the
 * route happens to build.
 */

const OWNER = "owner-1";
const STRANGER = "stranger-1";

type Row = Readonly<Record<string, unknown>>;

interface CardRow {
  readonly id: string;
  readonly deckId: string;
  readonly scryfallId: string;
  readonly name: string;
  readonly manaCost: string;
  readonly cmc: number;
  readonly typeLine: string;
  readonly oracleText: string;
  readonly power: string | null;
  readonly toughness: string | null;
  readonly colorIdentity: readonly string[];
  readonly isGameChanger: boolean;
  readonly isBanned: boolean;
  readonly price: number | null;
  readonly imageUri: string;
  readonly artCropUri: string;
  readonly category: string;
  readonly quantity: number;
  readonly isCommander: boolean;
  readonly isPartner: boolean;
  readonly notes: string | null;
  readonly zone: string;
}

function cardRow(
  overrides: Partial<CardRow> & Pick<CardRow, "id" | "name">
): CardRow {
  return {
    deckId: "deck-1",
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
  price: 12.5,
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
  colorIdentity: [],
  price: 1.25,
  category: "ramp",
  isGameChanger: true,
  notes: "borrowed from Alex — give back",
});

const CONSIDERING = cardRow({
  id: "card-doubling-season",
  name: "Doubling Season",
  cmc: 5,
  colorIdentity: ["G"],
  price: 45,
  category: "winCondition",
  zone: "maybeboard",
});

const CARD_ROWS: readonly CardRow[] = [COMMANDER, SOL_RING, CONSIDERING];

const AUTHOR_ROW = {
  id: OWNER,
  name: "Deck Owner",
  username: "owner",
  image: null,
  email: "owner@test.com",
};

const CREATED_AT = new Date("2026-10-01T10:00:00.000Z");
const UPDATED_AT = new Date("2026-11-02T18:30:00.000Z");

/** Every column of a `Deck` row, including the ones only its owner should see. */
const PUBLIC_DECK_ROW = {
  id: "deck-1",
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
  shareToken: "secret-share-token",
  shareEnabled: true,
  isPublic: true,
  seekingFeedback: true,
  feedbackQuestion: "Too few board wipes?",
  isAIGenerated: false,
  forkedFromDeckId: "deck-0",
  forkedFromDeckName: "Original Atraxa",
  forkedFromUserName: "mentor",
  userId: OWNER,
  folderId: "folder-private",
  createdAt: CREATED_AT,
  updatedAt: UPDATED_AT,
} as const;

const PRIVATE_DECK_ROW = { ...PUBLIC_DECK_ROW, isPublic: false } as const;

function isRecord(value: unknown): value is Row {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function matchesWhere(row: Row, where: Row): boolean {
  return Object.entries(where).every(([key, value]) => row[key] === value);
}

/** Resolves a relation for `include: { rel: true }` or `{ rel: { select } }`. */
function resolveRelation(value: unknown, spec: unknown): unknown {
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
      key in relations ? resolveRelation(relations[key], spec) : row[key];
  }
  return result;
}

function includeRelations(
  row: Row,
  relations: Row,
  include: Row,
  omit: Row
): Row {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (!omit[key]) result[key] = value;
  }
  for (const [key, spec] of Object.entries(include)) {
    if (spec) result[key] = resolveRelation(relations[key], spec);
  }
  return result;
}

/** Stands in for `prisma.deck.findUnique` over a single stored deck. */
function storeDeck(row: Row): void {
  const relations: Row = { cards: CARD_ROWS, user: AUTHOR_ROW };
  mockDeckFindUnique.mockImplementation(async (args: unknown) => {
    if (!isRecord(args) || !isRecord(args.where))
      throw new Error("findUnique needs a where");
    if (!matchesWhere(row, args.where)) return null;
    if (isRecord(args.select))
      return selectColumns(row, relations, args.select);
    return includeRelations(
      row,
      relations,
      isRecord(args.include) ? args.include : {},
      isRecord(args.omit) ? args.omit : {}
    );
  });
}

function signedOut(): void {
  mockAuth.mockResolvedValue(null);
}

function signedInAs(id: string): void {
  mockAuth.mockResolvedValue({
    user: { id, name: "Someone", email: "s@test.com" },
  });
}

async function getDeck(id = "deck-1"): Promise<Response> {
  return GET(new Request(`http://localhost:3000/api/deck/${id}`), {
    params: Promise.resolve({ id }),
  });
}

/** A read from one client address, as the trusted proxy reports it. */
async function getDeckFrom(clientIp: string, id = "deck-1"): Promise<Response> {
  return GET(
    new Request(`http://localhost:3000/api/deck/${id}`, {
      headers: { "x-real-ip": clientIp },
    }),
    { params: Promise.resolve({ id }) }
  );
}

/** Spends a client's whole read budget, checking each read succeeds. */
async function exhaustReadBudget(clientIp: string): Promise<void> {
  for (let read = 0; read < PUBLIC_DECK_READS_PER_CLIENT; read++) {
    expect((await getDeckFrom(clientIp)).status).toBe(200);
  }
}

/** What the owner received before the public allowlist existed. */
function ownerView(row: typeof PUBLIC_DECK_ROW | typeof PRIVATE_DECK_ROW) {
  const { shareToken: _shareToken, createdAt, updatedAt, ...columns } = row;
  return {
    ...columns,
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
    cards: CARD_ROWS,
    user: { id: OWNER, name: "Deck Owner", username: "owner", image: null },
    isOwner: true,
  };
}

beforeEach(() => {
  mockDeckFindUnique.mockReset();
  mockAuth.mockReset();
  storeDeck(PUBLIC_DECK_ROW);
});

describe("GET /api/deck/[id] — who may see a deck", () => {
  it("404s an unknown deck", async () => {
    signedOut();

    const res = await getDeck("missing");

    expect(res.status).toBe(404);
  });

  it("hides a private deck from an anonymous viewer", async () => {
    storeDeck(PRIVATE_DECK_ROW);
    signedOut();

    expect((await getDeck()).status).toBe(404);
  });

  it("hides a private deck from a signed-in stranger", async () => {
    storeDeck(PRIVATE_DECK_ROW);
    signedInAs(STRANGER);

    expect((await getDeck()).status).toBe(404);
  });

  it("hides an ownerless private deck from an anonymous viewer", async () => {
    storeDeck({ ...PRIVATE_DECK_ROW, userId: null });
    signedOut();

    expect((await getDeck()).status).toBe(404);
  });
});

describe("GET /api/deck/[id] — the owner's view", () => {
  it("gives the owner their whole public deck except its share token", async () => {
    signedInAs(OWNER);

    const res = await getDeck();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(ownerView(PUBLIC_DECK_ROW));
  });

  it("lets the owner open their private deck", async () => {
    storeDeck(PRIVATE_DECK_ROW);
    signedInAs(OWNER);

    const res = await getDeck();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(ownerView(PRIVATE_DECK_ROW));
  });
});

/** The card fields the public deck page and the deck comparison read. */
function publicCard(card: CardRow) {
  return {
    id: card.id,
    scryfallId: card.scryfallId,
    name: card.name,
    cmc: card.cmc,
    colorIdentity: card.colorIdentity,
    price: card.price,
    imageUri: card.imageUri,
    artCropUri: card.artCropUri,
    category: card.category,
    quantity: card.quantity,
    isCommander: card.isCommander,
    isPartner: card.isPartner,
    isGameChanger: card.isGameChanger,
  };
}

const PUBLIC_VIEW = {
  id: "deck-1",
  name: "Atraxa Superfriends",
  description: "Proliferate everything.",
  format: "commander",
  targetBracket: 3,
  isAIGenerated: false,
  seekingFeedback: true,
  feedbackQuestion: "Too few board wipes?",
  forkedFromDeckId: "deck-0",
  forkedFromDeckName: "Original Atraxa",
  forkedFromUserName: "mentor",
  user: { id: OWNER, name: "Deck Owner", username: "owner", image: null },
  cards: CARD_ROWS.map(publicCard),
  isOwner: false,
};

describe("GET /api/deck/[id] — the public view", () => {
  it("serves an anonymous viewer only the fields the public deck page renders", async () => {
    signedOut();

    const res = await getDeck();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(PUBLIC_VIEW);
  });

  it("serves a signed-in stranger the same public fields", async () => {
    signedInAs(STRANGER);

    const res = await getDeck();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(PUBLIC_VIEW);
  });
});

describe("GET /api/deck/[id] — reads per client", () => {
  it("refuses a client past its per-minute budget, with Retry-After, without reading the deck", async () => {
    signedOut();
    await exhaustReadBudget("203.0.113.10");
    mockDeckFindUnique.mockClear();

    const refused = await getDeckFrom("203.0.113.10");

    expect(refused.status).toBe(429);
    const retryAfterSeconds = Number(refused.headers.get("Retry-After"));
    expect(retryAfterSeconds).toBeGreaterThan(0);
    expect(retryAfterSeconds).toBeLessThanOrEqual(60);
    expect(mockDeckFindUnique).not.toHaveBeenCalled();
  });

  it("keeps serving another client while one is refused", async () => {
    signedOut();
    await exhaustReadBudget("203.0.113.20");
    expect((await getDeckFrom("203.0.113.20")).status).toBe(429);

    const other = await getDeckFrom("198.51.100.20");

    expect(other.status).toBe(200);
    expect(await other.json()).toEqual(PUBLIC_VIEW);
  });
});
