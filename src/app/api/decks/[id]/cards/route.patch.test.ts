/**
 * PATCH /api/decks/[id]/cards applies a bulk edit as one transaction.
 *
 * Prisma is replaced by an in-memory database whose `$transaction` works on a
 * draft copy and commits it only when the callback resolves, as a real
 * interactive transaction does. Anything written outside the transaction would
 * land in the committed rows directly and show up in these assertions.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

interface Row {
  readonly id: string;
  readonly deckId: string;
  readonly name: string;
  readonly scryfallId: string;
  readonly quantity: number;
  readonly notes: string | null;
  readonly category: string;
  readonly isCommander: boolean;
  readonly isPartner: boolean;
}

/** The `where` shapes the route passes to `deckCard.deleteMany`. */
interface RowFilter {
  readonly deckId: string;
  readonly id?: { readonly in: readonly string[] };
  readonly category?: string;
  readonly isCommander?: boolean;
  readonly isPartner?: boolean;
}

/** Whether a row matches a Prisma-style equality filter. */
function matches(row: Row, where: RowFilter): boolean {
  return (
    row.deckId === where.deckId &&
    (where.id === undefined || where.id.in.includes(row.id)) &&
    (where.category === undefined || where.category === row.category) &&
    (where.isCommander === undefined ||
      where.isCommander === row.isCommander) &&
    (where.isPartner === undefined || where.isPartner === row.isPartner)
  );
}

/** The deck fields that record its command zone. */
interface CommandZone {
  readonly commanderId: string | null;
  readonly commanderName: string | null;
  readonly partnerId: string | null;
  readonly companionId: string | null;
  readonly pairingType: string;
}

interface Tables {
  rows: Row[];
  deck: CommandZone;
}

interface FakeDatabase {
  committed: Tables;
  failNextInsert: boolean;
  nextId: number;
}

const EMPTY_COMMAND_ZONE: CommandZone = {
  commanderId: null,
  commanderName: null,
  partnerId: null,
  companionId: null,
  pairingType: "none",
};

const db = vi.hoisted((): FakeDatabase => ({
  committed: {
    rows: [],
    deck: {
      commanderId: null,
      commanderName: null,
      partnerId: null,
      companionId: null,
      pairingType: "none",
    },
  },
  failNextInsert: false,
  nextId: 1,
}));

const getCardCollection = vi.hoisted(() => vi.fn());
vi.mock(import("@/lib/scryfall/client"), () => ({ getCardCollection }));

const requireDeckOwner = vi.hoisted(() => vi.fn());
vi.mock(import("@/lib/auth/helpers"), () => ({ requireDeckOwner }));

/** Prisma-shaped delegates that read and write one set of tables. */
function clientOver(tables: Tables) {
  return {
    deckCard: {
      deleteMany: vi.fn(async ({ where }: { where: RowFilter }) => {
        const before = tables.rows.length;
        tables.rows = tables.rows.filter((row) => !matches(row, where));
        return { count: before - tables.rows.length };
      }),
      updateMany: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { id: string; deckId: string };
          data: { quantity: number };
        }) => {
          let count = 0;
          tables.rows = tables.rows.map((row) => {
            if (row.id !== where.id || row.deckId !== where.deckId) return row;
            count += 1;
            return { ...row, quantity: data.quantity };
          });
          return { count };
        }
      ),
      createMany: vi.fn(
        async ({ data }: { data: Omit<Row, "id" | "notes">[] }) => {
          if (db.failNextInsert) throw new Error("insert failed");
          tables.rows = [
            ...tables.rows,
            ...data.map((row) => ({
              ...row,
              id: `created-${db.nextId++}`,
              notes: null,
            })),
          ];
          return { count: data.length };
        }
      ),
    },
    deck: {
      update: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { id: string };
          data: Partial<CommandZone> & { updatedAt: Date };
        }) => {
          const { updatedAt: _updatedAt, ...fields } = data;
          tables.deck = { ...tables.deck, ...fields };
          return {
            id: where.id,
            ...tables.deck,
            cards: tables.rows.filter((row) => row.deckId === where.id),
          };
        }
      ),
    },
  };
}

vi.mock(import("@/lib/db/prisma"), async (importOriginal) => {
  const { stubPrisma } = await import("@/test/prisma-stub");
  return stubPrisma(await importOriginal(), {
    get deckCard() {
      return clientOver(db.committed).deckCard;
    },
    get deck() {
      return clientOver(db.committed).deck;
    },
    $transaction: vi.fn(
      async (run: (tx: ReturnType<typeof clientOver>) => Promise<unknown>) => {
        const draft: Tables = structuredClone(db.committed);
        const result = await run(clientOver(draft));
        db.committed = draft;
        return result;
      }
    ),
  });
});

import { PATCH } from "./route";

/** A stored row: one main-deck copy unless stated otherwise. */
function row(
  fields: Pick<Row, "id" | "name" | "scryfallId"> & Partial<Row>
): Row {
  return {
    deckId: "deck-1",
    quantity: 1,
    notes: null,
    category: "other",
    isCommander: false,
    isPartner: false,
    ...fields,
  };
}

const SOL_RING = "11111111-1111-4111-8111-111111111111";
const BREYA = "22222222-2222-4222-8222-222222222222";
const BREYA_REPRINT = "33333333-3333-4333-8333-333333333333";

function patch(body: unknown): Promise<Response> {
  return PATCH(
    new Request("http://localhost/api/decks/deck-1/cards", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id: "deck-1" }) }
  );
}

describe("PATCH /api/decks/[id]/cards — bulk change set", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.failNextInsert = false;
    db.nextId = 1;
    db.committed = {
      deck: EMPTY_COMMAND_ZONE,
      rows: [
        row({
          id: "forest-row",
          name: "Forest",
          scryfallId: "forest",
          quantity: 10,
        }),
        row({
          id: "signet-row",
          name: "Arcane Signet",
          scryfallId: "signet",
          notes: "fixes",
        }),
      ],
    };
    requireDeckOwner.mockResolvedValue({
      userId: "user-1",
      deck: { id: "deck-1", userId: "user-1" },
    });
    // Scryfall knows no shared Oracle identity unless a test says so.
    getCardCollection.mockResolvedValue({ data: [], not_found: [] });
  });

  it("leaves the deck exactly as it was when a write fails halfway", async () => {
    const before = structuredClone(db.committed.rows);
    db.failNextInsert = true;

    const response = await patch({
      removeCardIds: ["signet-row"],
      quantityChanges: [{ cardId: "forest-row", quantity: 9 }],
      addCards: [{ scryfallId: SOL_RING, name: "Sol Ring", category: "ramp" }],
    });

    expect(response.status).toBe(500);
    expect(db.committed.rows).toEqual(before);
  });

  it.each([
    [
      "removes",
      {
        removeCardIds: ["other-deck-row"],
        quantityChanges: [{ cardId: "forest-row", quantity: 9 }],
      },
    ],
    [
      "resizes",
      {
        removeCardIds: ["signet-row"],
        quantityChanges: [{ cardId: "other-deck-row", quantity: 2 }],
      },
    ],
  ])(
    "rejects a change set that %s a row this deck no longer holds",
    async (_verb, changes) => {
      db.committed.rows.push(
        row({
          id: "other-deck-row",
          deckId: "deck-2",
          name: "Sol Ring",
          scryfallId: "sol",
        })
      );
      const before = structuredClone(db.committed.rows);

      const response = await patch({ addCards: [], ...changes });

      expect(response.status).toBe(409);
      expect(db.committed.rows).toEqual(before);
    }
  );

  it("records the new command zone with the rows it adds", async () => {
    const response = await patch({
      removeCardIds: [],
      quantityChanges: [],
      addCards: [
        {
          scryfallId: BREYA,
          name: "Breya, Etherium Shaper",
          category: "commander",
          isCommander: true,
        },
      ],
      commandZone: {
        ...EMPTY_COMMAND_ZONE,
        commanderId: BREYA,
        commanderName: "Breya, Etherium Shaper",
      },
    });

    expect(response.status).toBe(200);
    expect(db.committed.deck).toMatchObject({
      commanderId: BREYA,
      commanderName: "Breya, Etherium Shaper",
    });
    expect(db.committed.rows).toContainEqual(
      expect.objectContaining({
        scryfallId: BREYA,
        isCommander: true,
        category: "commander",
      })
    );
  });

  it("clears a replaced command-zone slot by its rows' role, not by ids the client holds", async () => {
    // A commander picked by hand earlier is known to the editor by its printing
    // id; the database row has its own id. Two stale commander rows are left
    // over from earlier picks.
    db.committed.rows.push(
      row({
        id: "atraxa-row",
        name: "Atraxa, Praetors' Voice",
        scryfallId: "atraxa",
        category: "commander",
        isCommander: true,
      }),
      row({
        id: "old-row",
        name: "Breya, Etherium Shaper",
        scryfallId: "breya-old",
        category: "commander",
        isCommander: true,
      }),
      row({
        id: "tymna-row",
        name: "Tymna the Weaver",
        scryfallId: "tymna",
        category: "commander",
        isCommander: true,
        isPartner: true,
      })
    );

    const response = await patch({
      removeCardIds: [],
      quantityChanges: [],
      addCards: [
        {
          scryfallId: BREYA,
          name: "Breya, Etherium Shaper",
          category: "commander",
          isCommander: true,
        },
      ],
      clearCommandSlots: ["commander"],
      commandZone: {
        ...EMPTY_COMMAND_ZONE,
        commanderId: BREYA,
        commanderName: "Breya, Etherium Shaper",
        partnerId: "tymna",
      },
    });

    expect(response.status).toBe(200);
    expect(
      db.committed.rows.filter((r) => r.isCommander).map((r) => r.scryfallId)
    ).toEqual(["tymna", BREYA]);
    expect(db.committed.rows.map((r) => r.id)).toEqual(
      expect.arrayContaining(["forest-row", "signet-row", "tymna-row"])
    );
  });

  it("refuses a partner that reprints the commander's Oracle card", async () => {
    getCardCollection.mockResolvedValue({
      data: [
        { id: BREYA, oracle_id: "oracle-breya" },
        { id: BREYA_REPRINT, oracle_id: "oracle-breya" },
      ],
      not_found: [],
    });
    const before = structuredClone(db.committed);

    const response = await patch({
      removeCardIds: [],
      quantityChanges: [],
      addCards: [],
      commandZone: {
        ...EMPTY_COMMAND_ZONE,
        commanderId: BREYA,
        commanderName: "Breya, Etherium Shaper",
        partnerId: BREYA_REPRINT,
      },
    });

    expect(response.status).toBe(400);
    expect(db.committed).toEqual(before);
  });
});
