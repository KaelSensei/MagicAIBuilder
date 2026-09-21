import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockAuth, mockDeckFindUnique, mockReportUpsert, mockUserFindUnique } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockDeckFindUnique: vi.fn(),
  mockReportUpsert: vi.fn(),
  mockUserFindUnique: vi.fn(async ({ where }: { where: { id?: string } }) => ({ id: where.id })),
}));

vi.mock("@/lib/auth/config", () => ({ auth: mockAuth }));
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: { findUnique: mockUserFindUnique },
    deck: { findUnique: mockDeckFindUnique },
    deckReport: { upsert: mockReportUpsert },
  },
}));

import { POST } from "./route";

const params = { params: Promise.resolve({ id: "deck-1" }) };
const request = (reason: string) =>
  new Request("http://localhost/api/community/decks/deck-1/reports", {
    method: "POST",
    body: JSON.stringify({ reason }),
  });

describe("POST /api/community/decks/[id]/reports", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "reporter-1" } });
    mockDeckFindUnique.mockResolvedValue({ id: "deck-1", userId: "owner-1", isPublic: true });
    mockReportUpsert.mockResolvedValue({ id: "report-1" });
  });

  it("creates one pending report per user and deck", async () => {
    const response = await POST(request("spam"), params);
    expect(response.status).toBe(201);
    expect(mockReportUpsert).toHaveBeenCalledWith({
      where: { userId_deckId: { userId: "reporter-1", deckId: "deck-1" } },
      update: { reason: "spam", status: "pending" },
      create: { userId: "reporter-1", deckId: "deck-1", reason: "spam" },
    });
  });

  it("rejects unknown reasons", async () => {
    const response = await POST(request("I dislike it"), params);
    expect(response.status).toBe(400);
    expect(mockReportUpsert).not.toHaveBeenCalled();
  });

  it("requires authentication", async () => {
    mockAuth.mockResolvedValue(null);
    expect((await POST(request("spam"), params)).status).toBe(401);
  });

  it("does not reveal private decks", async () => {
    mockDeckFindUnique.mockResolvedValue({ id: "deck-1", userId: "owner-1", isPublic: false });
    expect((await POST(request("spam"), params)).status).toBe(404);
  });

  it("forbids reporting your own deck", async () => {
    mockAuth.mockResolvedValue({ user: { id: "owner-1" } });
    expect((await POST(request("spam"), params)).status).toBe(403);
  });
});
