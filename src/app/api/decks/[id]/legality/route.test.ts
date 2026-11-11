import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockDeckFindUnique, mockUserFindUnique } = vi.hoisted(() => ({
  mockDeckFindUnique: vi.fn(),
  mockUserFindUnique: vi.fn(),
}));

vi.mock(import("@/lib/db/prisma"), async (importOriginal) => {
  const { stubPrisma } = await import("@/test/prisma-stub");
  return stubPrisma(await importOriginal(), {
    deck: { findUnique: mockDeckFindUnique },
    user: { findUnique: mockUserFindUnique },
  });
});

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));
vi.mock(import("@/lib/auth/config"), () => ({ auth: mockAuth }));

const { mockGetCardCollection } = vi.hoisted(() => ({
  mockGetCardCollection: vi.fn(),
}));
vi.mock(import("@/lib/scryfall/client"), () => ({
  getCardCollection: mockGetCardCollection,
}));

import { GET } from "./route";

const OWNER = "user-1";
const SOL_RING = "11111111-1111-4111-8111-111111111111";
const MANA_CRYPT = "22222222-2222-4222-8222-222222222222";

interface StoredRow {
  readonly scryfallId: string;
  readonly name: string;
  readonly quantity: number;
  readonly zone: string;
  readonly isBanned: boolean;
}

function signedInAs(userId: string): void {
  mockAuth.mockResolvedValue({
    user: { id: userId, name: "Player", email: "p@test.com" },
  });
  mockUserFindUnique.mockResolvedValue({
    id: userId,
    name: "Player",
    email: "p@test.com",
    image: null,
  });
}

/** The ownership check reads `userId`; the legality read asks for the format and the cards. */
function storedDeck(format: string, cards: readonly StoredRow[]): void {
  mockDeckFindUnique.mockImplementation(
    ({ select }: { select: Record<string, unknown> }) =>
      Promise.resolve(
        select.format === true
          ? { format, cards }
          : { id: "deck-1", userId: OWNER }
      )
  );
}

function scryfallReturns(
  cards: readonly { id: string; name: string; commander: string }[]
): void {
  mockGetCardCollection.mockResolvedValue({
    object: "list",
    not_found: [],
    data: cards.map(({ id, name, commander }) => ({
      id,
      name,
      cmc: 0,
      type_line: "Artifact",
      color_identity: [],
      legalities: { commander },
    })),
  });
}

function getLegality(): Promise<Response> {
  return GET(new Request("http://localhost:3000/api/decks/deck-1/legality"), {
    params: Promise.resolve({ id: "deck-1" }),
  });
}

describe("GET /api/decks/[id]/legality", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    signedInAs(OWNER);
  });

  it("reports a banned card as illegal even though the browser saved it as legal", async () => {
    storedDeck("commander", [
      {
        scryfallId: SOL_RING,
        name: "Sol Ring",
        quantity: 1,
        zone: "main",
        isBanned: false,
      },
      {
        scryfallId: MANA_CRYPT,
        name: "Mana Crypt",
        quantity: 1,
        zone: "main",
        isBanned: false,
      },
    ]);
    scryfallReturns([
      { id: SOL_RING, name: "Sol Ring", commander: "legal" },
      { id: MANA_CRYPT, name: "Mana Crypt", commander: "banned" },
    ]);

    const response = await getLegality();
    const verdict: unknown = await response.json();

    expect(response.status).toBe(200);
    expect(verdict).toMatchObject({
      kind: "checked",
      format: "commander",
      legal: false,
      violations: [{ name: "Mana Crypt", reason: "banned" }],
      source: { provider: "scryfall", legalityKey: "commander" },
    });
    expect(mockGetCardCollection).toHaveBeenCalledWith([
      { id: SOL_RING },
      { id: MANA_CRYPT },
    ]);
  });

  it("answers an unsupported-format verdict for a format it does not know, without Commander rules", async () => {
    storedDeck("duel", [
      {
        scryfallId: SOL_RING,
        name: "Sol Ring",
        quantity: 1,
        zone: "main",
        isBanned: false,
      },
    ]);

    const response = await getLegality();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      kind: "unsupported_format",
      format: "duel",
    });
    expect(mockGetCardCollection).not.toHaveBeenCalled();
  });

  it("answers 502 rather than a verdict when Scryfall cannot be reached", async () => {
    storedDeck("commander", [
      {
        scryfallId: SOL_RING,
        name: "Sol Ring",
        quantity: 1,
        zone: "main",
        isBanned: false,
      },
    ]);
    mockGetCardCollection.mockRejectedValue(
      new Error("Scryfall API error 503: unavailable")
    );

    const response = await getLegality();

    expect(response.status).toBe(502);
  });

  it("refuses a deck the caller does not own", async () => {
    signedInAs("someone-else");
    storedDeck("commander", []);

    const response = await getLegality();

    expect(response.status).toBe(403);
    expect(mockGetCardCollection).not.toHaveBeenCalled();
  });
});
