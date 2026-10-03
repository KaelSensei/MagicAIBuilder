import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRequireModerator, mockReportFindMany } = vi.hoisted(() => ({
  mockRequireModerator: vi.fn(),
  mockReportFindMany: vi.fn(),
}));

vi.mock("@/lib/auth/require-moderator", () => ({ requireModerator: mockRequireModerator }));
vi.mock("@/lib/db/prisma", () => ({
  prisma: { deckReport: { findMany: mockReportFindMany } },
}));

import { GET } from "./route";

describe("GET /api/moderation/deck-reports", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireModerator.mockResolvedValue({ moderatorId: "moderator-1" });
    mockReportFindMany.mockResolvedValue([]);
  });

  it("requires moderation access", async () => {
    mockRequireModerator.mockResolvedValue({ error: new Response(null, { status: 403 }) });

    const response = await GET(new Request("http://localhost/api/moderation/deck-reports"));

    expect(response.status).toBe(403);
    expect(mockReportFindMany).not.toHaveBeenCalled();
  });

  it("returns the oldest pending reports first with bounded evidence", async () => {
    mockReportFindMany.mockResolvedValue([
      {
        id: "report-1",
        reason: "spam",
        status: "pending",
        createdAt: new Date("2026-09-20T10:00:00Z"),
        deck: { id: "deck-1", name: "Public deck", user: { username: "owner" } },
        user: { username: "reporter" },
      },
    ]);

    const response = await GET(new Request("http://localhost/api/moderation/deck-reports"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.reports).toHaveLength(1);
    expect(mockReportFindMany).toHaveBeenCalledWith({
      where: { status: "pending" },
      orderBy: { createdAt: "asc" },
      take: 50,
      select: {
        id: true,
        reason: true,
        status: true,
        createdAt: true,
        deck: { select: { id: true, name: true, user: { select: { username: true } } } },
        user: { select: { username: true } },
      },
    });
  });
});
