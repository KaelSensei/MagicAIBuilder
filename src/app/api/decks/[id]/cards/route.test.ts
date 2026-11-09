import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockDeckFindUnique, mockDeckUpdate, mockCardCreate, mockUserFindUnique } = vi.hoisted(
  () => ({
    mockDeckFindUnique: vi.fn(),
    mockDeckUpdate: vi.fn(),
    mockCardCreate: vi.fn(),
    mockUserFindUnique: vi.fn(),
  })
);

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    deck: { findUnique: mockDeckFindUnique, update: mockDeckUpdate },
    deckCard: { create: mockCardCreate },
    user: { findUnique: mockUserFindUnique },
  },
}));

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));
vi.mock("@/lib/auth/config", () => ({ auth: mockAuth }));

const { mockGetCardCollection } = vi.hoisted(() => ({ mockGetCardCollection: vi.fn() }));
vi.mock("@/lib/scryfall/client", () => ({ getCardCollection: mockGetCardCollection }));

import { POST } from "./route";

const OWNER = "user-1";
const COMMANDER_PRINTING = "11111111-1111-4111-8111-111111111111";
const REPRINT_PRINTING = "22222222-2222-4222-8222-222222222222";
const OTHER_PRINTING = "33333333-3333-4333-8333-333333333333";

function signedInAsOwner(): void {
  mockAuth.mockResolvedValue({ user: { id: OWNER, name: "Owner", email: "o@test.com" } });
  mockUserFindUnique.mockResolvedValue({ id: OWNER, name: "Owner", email: "o@test.com", image: null });
}

/** The ownership lookup runs first; the command-slot lookup follows it. */
function deckWithSlots(slots: { commanderId: string | null; partnerId: string | null }): void {
  mockDeckFindUnique.mockImplementation(({ select }: { select: Record<string, boolean> }) =>
    Promise.resolve(
      select.commanderId === true
        ? slots
        : { id: "deck-1", userId: OWNER }
    )
  );
}

function oracleIdentities(entries: readonly (readonly [string, string])[]): void {
  mockGetCardCollection.mockResolvedValue({
    data: entries.map(([id, oracleId]) => ({ id, oracle_id: oracleId })),
    not_found: [],
  });
}

function addCard(body: Record<string, unknown>): Promise<Response> {
  return POST(
    new Request("http://localhost:3000/api/decks/deck-1/cards", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Some Card", ...body }),
    }),
    { params: Promise.resolve({ id: "deck-1" }) }
  );
}

describe("POST /api/decks/[id]/cards — command-zone pairing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    signedInAsOwner();
    mockCardCreate.mockResolvedValue({ id: "row-1" });
    mockDeckUpdate.mockResolvedValue({ id: "deck-1" });
  });

  it("rejects a partner card that reprints the commander's Oracle card", async () => {
    deckWithSlots({ commanderId: COMMANDER_PRINTING, partnerId: REPRINT_PRINTING });
    oracleIdentities([
      [COMMANDER_PRINTING, "oracle-1"],
      [REPRINT_PRINTING, "oracle-1"],
    ]);

    const response = await addCard({
      scryfallId: REPRINT_PRINTING,
      category: "commander",
      isCommander: true,
      isPartner: true,
    });

    expect(response.status).toBe(400);
    expect(mockCardCreate).not.toHaveBeenCalled();
  });

  it("rejects a commander card that reprints the saved partner's Oracle card", async () => {
    deckWithSlots({ commanderId: REPRINT_PRINTING, partnerId: COMMANDER_PRINTING });
    oracleIdentities([
      [REPRINT_PRINTING, "oracle-1"],
      [COMMANDER_PRINTING, "oracle-1"],
    ]);

    const response = await addCard({
      scryfallId: REPRINT_PRINTING,
      category: "commander",
      isCommander: true,
      isPartner: false,
    });

    expect(response.status).toBe(400);
    expect(mockCardCreate).not.toHaveBeenCalled();
  });

  it("rejects a partner card with the exact commander printing without asking Scryfall", async () => {
    deckWithSlots({ commanderId: COMMANDER_PRINTING, partnerId: COMMANDER_PRINTING });

    const response = await addCard({
      scryfallId: COMMANDER_PRINTING,
      category: "commander",
      isCommander: true,
      isPartner: true,
    });

    expect(response.status).toBe(400);
    expect(mockGetCardCollection).not.toHaveBeenCalled();
    expect(mockCardCreate).not.toHaveBeenCalled();
  });

  it("adds a partner card with a different Oracle identity", async () => {
    deckWithSlots({ commanderId: COMMANDER_PRINTING, partnerId: OTHER_PRINTING });
    oracleIdentities([
      [COMMANDER_PRINTING, "oracle-1"],
      [OTHER_PRINTING, "oracle-2"],
    ]);

    const response = await addCard({
      scryfallId: OTHER_PRINTING,
      category: "commander",
      isCommander: true,
      isPartner: true,
    });

    expect(response.status).toBe(201);
    expect(mockCardCreate).toHaveBeenCalledTimes(1);
  });

  it("adds main-deck cards without a command-slot or Scryfall lookup", async () => {
    deckWithSlots({ commanderId: COMMANDER_PRINTING, partnerId: null });

    const response = await addCard({ scryfallId: OTHER_PRINTING });

    expect(response.status).toBe(201);
    expect(mockDeckFindUnique).toHaveBeenCalledTimes(1);
    expect(mockGetCardCollection).not.toHaveBeenCalled();
  });
});
