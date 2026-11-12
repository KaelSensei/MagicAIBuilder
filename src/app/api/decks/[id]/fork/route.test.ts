import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockAuth, mockUserFindUnique, mockDeckFindUnique, mockDeckCreate } =
  vi.hoisted(() => ({
    mockAuth: vi.fn(),
    mockUserFindUnique: vi.fn(),
    mockDeckFindUnique: vi.fn(),
    mockDeckCreate: vi.fn(),
  }));

vi.mock(import("@/lib/auth/config"), () => ({ auth: mockAuth }));
vi.mock(import("@/lib/db/prisma"), async (importOriginal) => {
  const { stubPrisma } = await import("@/test/prisma-stub");
  return stubPrisma(await importOriginal(), {
    user: { findUnique: mockUserFindUnique },
    deck: { findUnique: mockDeckFindUnique, create: mockDeckCreate },
  });
});
vi.mock(import("@/lib/logger"), () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { POST } from "./route";

/**
 * POST /api/decks/[id]/fork copies a public deck into the caller's account.
 *
 * The database is replaced by an in-memory one that honours the parts of a
 * Prisma query the route can use — `where` equality, `select`, `include` and a
 * nested card `create` with the schema's column defaults — so these tests pin
 * what the forked deck holds, not which query the route builds.
 */

const OWNER = "owner-1";
const FORKER = "forker-1";
const SOURCE_ID = "deck-source";

type Row = Readonly<Record<string, unknown>>;

function isRecord(value: unknown): value is Row {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function records(value: unknown): readonly Row[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

/** `DeckCard` column defaults from `prisma/schema.prisma`. */
const CARD_DEFAULTS: Row = {
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
  imageUri: "",
  artCropUri: "",
  category: "other",
  quantity: 1,
  isCommander: false,
  isPartner: false,
  notes: null,
  zone: "main",
};

/** `Deck` column defaults from `prisma/schema.prisma`. */
const DECK_DEFAULTS: Row = {
  description: "",
  tags: [],
  format: "commander",
  targetBracket: 3,
  budget: null,
  commanderId: null,
  commanderName: null,
  partnerId: null,
  companionId: null,
  pairingType: "none",
  manualBracket: null,
  shareToken: null,
  shareEnabled: false,
  isPublic: false,
  seekingFeedback: false,
  feedbackQuestion: null,
  isAIGenerated: false,
  forkedFromDeckId: null,
  forkedFromDeckName: null,
  forkedFromUserName: null,
  userId: null,
  folderId: null,
};

const SOURCE_CARDS: readonly Row[] = [
  {
    ...CARD_DEFAULTS,
    id: "card-atraxa",
    deckId: SOURCE_ID,
    scryfallId: "scry-atraxa",
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
  },
  {
    ...CARD_DEFAULTS,
    id: "card-sol-ring",
    deckId: SOURCE_ID,
    scryfallId: "scry-sol-ring",
    name: "Sol Ring",
    manaCost: "{1}",
    cmc: 1,
    typeLine: "Artifact",
    price: 1.25,
    category: "ramp",
    quantity: 1,
    isGameChanger: true,
    notes: "borrowed from Alex — give back",
  },
  {
    ...CARD_DEFAULTS,
    id: "card-doubling-season",
    deckId: SOURCE_ID,
    scryfallId: "scry-doubling-season",
    name: "Doubling Season",
    cmc: 5,
    colorIdentity: ["G"],
    price: 45,
    category: "winCondition",
    zone: "maybeboard",
  },
];

/** Every column of the source deck, including the ones only its owner should see. */
const SOURCE_DECK: Row = {
  ...DECK_DEFAULTS,
  id: SOURCE_ID,
  name: "Atraxa Superfriends",
  description: "Proliferate everything.",
  tags: ["proxy-test", "for-friday"],
  targetBracket: 3,
  budget: 250,
  commanderId: "scry-atraxa",
  commanderName: "Atraxa, Praetors' Voice",
  manualBracket: 4,
  shareToken: "secret-share-token",
  shareEnabled: true,
  isPublic: true,
  seekingFeedback: true,
  feedbackQuestion: "Too few board wipes?",
  userId: OWNER,
  folderId: "folder-private",
};

const OWNER_ROW: Row = {
  id: OWNER,
  name: "Deck Owner",
  username: "owner",
  image: null,
  email: "owner@test.com",
};

interface StoredDeck {
  readonly row: Row;
  readonly cards: readonly Row[];
  readonly user: Row | null;
}

const database = new Map<string, StoredDeck>();

/** Narrows a stored row, or every row of a list, to a nested `{ select }`. */
function project(value: unknown, spec: unknown): unknown {
  if (!isRecord(spec) || !isRecord(spec.select)) return value;
  const select = spec.select;
  return Array.isArray(value)
    ? records(value).map((item) => pick(item, select))
    : isRecord(value)
      ? pick(value, select)
      : value;
}

function pick(row: Row, select: Row): Row {
  const result: Record<string, unknown> = {};
  for (const [key, spec] of Object.entries(select)) {
    if (spec) result[key] = project(row[key], spec);
  }
  return result;
}

function withRelations(stored: StoredDeck): Row {
  return { ...stored.row, cards: stored.cards, user: stored.user };
}

/** Stands in for `prisma.deck.findUnique` over the in-memory decks. */
async function findDeck(args: unknown): Promise<Row | null> {
  if (!isRecord(args) || !isRecord(args.where)) {
    throw new Error("findUnique needs a where");
  }
  const where = args.where;
  const stored = [...database.values()].find(({ row }) =>
    Object.entries(where).every(([key, value]) => row[key] === value)
  );
  if (!stored) return null;
  const full = withRelations(stored);
  if (isRecord(args.select)) return pick(full, args.select);
  const include = isRecord(args.include) ? args.include : {};
  const result: Record<string, unknown> = { ...stored.row };
  for (const [key, spec] of Object.entries(include)) {
    if (spec) result[key] = project(full[key], spec);
  }
  return result;
}

/** Stands in for `prisma.deck.create` with a nested `cards: { create }`. */
async function createDeck(args: unknown): Promise<Row> {
  if (!isRecord(args) || !isRecord(args.data)) {
    throw new Error("create needs data");
  }
  const { cards, ...columns } = args.data;
  const id = "deck-fork";
  const row: Row = { ...DECK_DEFAULTS, ...columns, id };
  const cardRows = records(isRecord(cards) ? cards.create : []).map(
    (card, index): Row => ({
      ...CARD_DEFAULTS,
      ...card,
      id: `fork-card-${index}`,
      deckId: id,
    })
  );
  database.set(id, { row, cards: cardRows, user: null });
  return isRecord(args.include) && args.include.cards
    ? { ...row, cards: cardRows }
    : row;
}

function storeSource(overrides: Row = {}): void {
  database.set(SOURCE_ID, {
    row: { ...SOURCE_DECK, ...overrides },
    cards: SOURCE_CARDS,
    user: OWNER_ROW,
  });
}

function signedInAs(id: string): void {
  mockAuth.mockResolvedValue({ user: { id, email: `${id}@test.com` } });
}

async function fork(id = SOURCE_ID): Promise<Response> {
  return POST(
    new Request(`http://localhost/api/decks/${id}/fork`, { method: "POST" }),
    { params: Promise.resolve({ id }) }
  );
}

function storedFork(): StoredDeck {
  const stored = database.get("deck-fork");
  if (!stored) throw new Error("the fork was not created");
  return stored;
}

beforeEach(() => {
  vi.clearAllMocks();
  database.clear();
  mockUserFindUnique.mockImplementation(async (args: unknown) =>
    isRecord(args) && isRecord(args.where) ? { id: args.where.id } : null
  );
  mockDeckFindUnique.mockImplementation(findDeck);
  mockDeckCreate.mockImplementation(createDeck);
  storeSource();
  signedInAs(FORKER);
});

describe("POST /api/decks/[id]/fork — who may fork", () => {
  it("requires a signed-in user", async () => {
    mockAuth.mockResolvedValue(null);

    expect((await fork()).status).toBe(401);
    expect(database.has("deck-fork")).toBe(false);
  });

  it("404s a private deck without copying it", async () => {
    storeSource({ isPublic: false });

    expect((await fork()).status).toBe(404);
    expect(database.has("deck-fork")).toBe(false);
  });
});

describe("POST /api/decks/[id]/fork — what the fork holds", () => {
  it("gives the forker a private, attributed copy of the deck list and its commander", async () => {
    const res = await fork();

    expect(res.status).toBe(201);
    const { row, cards } = storedFork();
    expect(row).toMatchObject({
      name: "Atraxa Superfriends (Fork)",
      description: "Proliferate everything.",
      format: "commander",
      targetBracket: 3,
      commanderId: "scry-atraxa",
      commanderName: "Atraxa, Praetors' Voice",
      pairingType: "none",
      userId: FORKER,
      isPublic: false,
      shareEnabled: false,
      shareToken: null,
      forkedFromDeckId: SOURCE_ID,
      forkedFromDeckName: "Atraxa Superfriends",
      forkedFromUserName: "Deck Owner",
    });
    expect(
      cards.map(({ name, quantity, category, zone, isCommander }) => ({
        name,
        quantity,
        category,
        zone,
        isCommander,
      }))
    ).toEqual([
      {
        name: "Atraxa, Praetors' Voice",
        quantity: 1,
        category: "commander",
        zone: "main",
        isCommander: true,
      },
      {
        name: "Sol Ring",
        quantity: 1,
        category: "ramp",
        zone: "main",
        isCommander: false,
      },
      {
        name: "Doubling Season",
        quantity: 1,
        category: "winCondition",
        zone: "maybeboard",
        isCommander: false,
      },
    ]);
    expect(cards[0]).toMatchObject({
      manaCost: "{G}{W}{U}{B}",
      typeLine: "Legendary Creature — Phyrexian Angel Horror",
      oracleText: "Flying, vigilance, deathtouch, lifelink",
      power: "4",
      toughness: "4",
    });
  });

  it("leaves the source owner's budget, bracket override and card notes behind", async () => {
    const res = await fork();

    expect(res.status).toBe(201);
    const body: unknown = await res.json();
    expect(body).toMatchObject({ budget: null, manualBracket: null });
    const returnedCards = isRecord(body) ? records(body.cards) : [];
    expect(returnedCards).toHaveLength(3);
    expect(returnedCards.map((card) => card.notes)).toEqual([null, null, null]);

    const { row, cards } = storedFork();
    expect(row).toMatchObject({
      budget: null,
      manualBracket: null,
      tags: [],
      folderId: null,
      seekingFeedback: false,
      feedbackQuestion: null,
    });
    expect(cards.map((card) => card.notes)).toEqual([null, null, null]);
  });
});
