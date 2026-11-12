import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockAuth,
  mockDeckFindUnique,
  mockReportCreateMany,
  mockReportUpdateMany,
  mockUserFindUnique,
} = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockDeckFindUnique: vi.fn(),
  mockReportCreateMany: vi.fn(),
  mockReportUpdateMany: vi.fn(),
  mockUserFindUnique: vi.fn(async ({ where }: { where: { id?: string } }) => ({
    id: where.id,
  })),
}));

vi.mock(import("@/lib/auth/config"), () => ({ auth: mockAuth }));
vi.mock(import("@/lib/db/prisma"), async (importOriginal) => {
  const { stubPrisma } = await import("@/test/prisma-stub");
  return stubPrisma(await importOriginal(), {
    user: { findUnique: mockUserFindUnique },
    deck: { findUnique: mockDeckFindUnique },
    deckReport: {
      createMany: mockReportCreateMany,
      updateMany: mockReportUpdateMany,
    },
  });
});

import { POST } from "./route";

/**
 * The `DeckReport` table is replaced by an in-memory one that keeps its
 * `@@unique([userId, deckId])` rule and answers the writes the route can use,
 * so these tests pin the stored report, not the query that wrote it.
 */

interface ReportKey {
  readonly userId: string;
  readonly deckId: string;
}

interface ReportRow extends ReportKey {
  readonly reason: string;
  readonly status: string;
  readonly reviewedById: string | null;
}

interface ReportWhere {
  readonly userId?: string;
  readonly deckId?: string;
  readonly status?: string;
}

interface ReportData {
  readonly reason?: string;
  readonly status?: string;
}

type ReportCreate = ReportKey & { readonly reason: string };

const reports = new Map<string, ReportRow>();

const keyOf = ({ userId, deckId }: ReportKey) => `${userId}:${deckId}`;

/** Inserts a row unless its reporter already reported this deck. */
function insert(row: ReportCreate): boolean {
  if (reports.has(keyOf(row))) return false;
  reports.set(keyOf(row), { ...row, status: "pending", reviewedById: null });
  return true;
}

function matches(row: ReportRow, where: ReportWhere): boolean {
  return (
    (where.userId === undefined || row.userId === where.userId) &&
    (where.deckId === undefined || row.deckId === where.deckId) &&
    (where.status === undefined || row.status === where.status)
  );
}

function storeReport(row: ReportKey & Partial<ReportRow>): void {
  reports.set(keyOf(row), {
    reason: "spam",
    status: "pending",
    reviewedById: null,
    ...row,
  });
}

function storedReport(): ReportRow | undefined {
  return reports.get(keyOf({ userId: "reporter-1", deckId: "deck-1" }));
}

const params = { params: Promise.resolve({ id: "deck-1" }) };
const request = (reason: string) =>
  new Request("http://localhost/api/community/decks/deck-1/reports", {
    method: "POST",
    body: JSON.stringify({ reason }),
  });

describe("POST /api/community/decks/[id]/reports", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reports.clear();
    mockAuth.mockResolvedValue({ user: { id: "reporter-1" } });
    mockDeckFindUnique.mockResolvedValue({
      id: "deck-1",
      userId: "owner-1",
      isPublic: true,
    });
    mockReportCreateMany.mockImplementation(
      async (args: {
        data: ReportCreate | readonly ReportCreate[];
        skipDuplicates?: boolean;
      }) => {
        const rows = Array.isArray(args.data) ? args.data : [args.data];
        let count = 0;
        for (const row of rows) {
          if (insert(row)) count += 1;
          else if (!args.skipDuplicates)
            throw new Error("Unique constraint failed");
        }
        return { count };
      }
    );
    mockReportUpdateMany.mockImplementation(
      async (args: { where: ReportWhere; data: ReportData }) => {
        let count = 0;
        for (const row of [...reports.values()]) {
          if (!matches(row, args.where)) continue;
          reports.set(keyOf(row), { ...row, ...args.data });
          count += 1;
        }
        return { count };
      }
    );
  });

  it("files a pending report", async () => {
    const response = await POST(request("spam"), params);

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ status: "pending" });
    expect(storedReport()).toMatchObject({ reason: "spam", status: "pending" });
  });

  it("replaces the reason of a report that is still pending", async () => {
    storeReport({ userId: "reporter-1", deckId: "deck-1", reason: "spam" });

    const response = await POST(request("harassment"), params);

    expect(response.status).toBe(201);
    expect(reports.size).toBe(1);
    expect(storedReport()).toMatchObject({
      reason: "harassment",
      status: "pending",
    });
  });

  it.each(["dismissed", "reviewed"])(
    "keeps a %s report closed when its reporter reports the deck again",
    async (status) => {
      storeReport({
        userId: "reporter-1",
        deckId: "deck-1",
        reason: "spam",
        status,
        reviewedById: "moderator-1",
      });

      const response = await POST(request("harassment"), params);

      expect(storedReport()).toEqual({
        userId: "reporter-1",
        deckId: "deck-1",
        reason: "spam",
        status,
        reviewedById: "moderator-1",
      });
      expect(reports.size).toBe(1);
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({ status: "closed" });
    }
  );

  it("files another reporter's report on a deck whose earlier report was closed", async () => {
    storeReport({
      userId: "reporter-2",
      deckId: "deck-1",
      status: "dismissed",
    });

    const response = await POST(request("spam"), params);

    expect(response.status).toBe(201);
    expect(storedReport()).toMatchObject({ reason: "spam", status: "pending" });
  });

  it("rejects unknown reasons", async () => {
    const response = await POST(request("I dislike it"), params);
    expect(response.status).toBe(400);
    expect(reports.size).toBe(0);
  });

  it("requires authentication", async () => {
    mockAuth.mockResolvedValue(null);
    expect((await POST(request("spam"), params)).status).toBe(401);
  });

  it("does not reveal private decks", async () => {
    mockDeckFindUnique.mockResolvedValue({
      id: "deck-1",
      userId: "owner-1",
      isPublic: false,
    });
    expect((await POST(request("spam"), params)).status).toBe(404);
  });

  it("forbids reporting your own deck", async () => {
    mockAuth.mockResolvedValue({ user: { id: "owner-1" } });
    expect((await POST(request("spam"), params)).status).toBe(403);
  });
});
