import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRequireModerator, mockReportUpdateMany } = vi.hoisted(() => ({
  mockRequireModerator: vi.fn(),
  mockReportUpdateMany: vi.fn(),
}));

vi.mock("@/lib/auth/require-moderator", () => ({ requireModerator: mockRequireModerator }));
vi.mock("@/lib/db/prisma", () => ({
  prisma: { deckReport: { updateMany: mockReportUpdateMany } },
}));

import { PATCH } from "./route";

const params = { params: Promise.resolve({ reportId: "report-1" }) };
const request = (status: string) =>
  new Request("http://localhost/api/moderation/deck-reports/report-1", {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

describe("PATCH /api/moderation/deck-reports/[reportId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireModerator.mockResolvedValue({ moderatorId: "moderator-1" });
    mockReportUpdateMany.mockResolvedValue({ count: 1 });
  });

  it("requires moderation access", async () => {
    mockRequireModerator.mockResolvedValue({ error: new Response(null, { status: 403 }) });

    expect((await PATCH(request("reviewed"), params)).status).toBe(403);
    expect(mockReportUpdateMany).not.toHaveBeenCalled();
  });

  it("moves a pending report to a reviewed state", async () => {
    const response = await PATCH(request("reviewed"), params);

    expect(response.status).toBe(200);
    expect(mockReportUpdateMany).toHaveBeenCalledWith({
      where: { id: "report-1", status: "pending" },
      data: {
        status: "reviewed",
        reviewedById: "moderator-1",
        reviewedAt: expect.any(Date),
      },
    });
  });

  it("rejects unsupported moderation states", async () => {
    const response = await PATCH(request("deleted"), params);

    expect(response.status).toBe(400);
    expect(mockReportUpdateMany).not.toHaveBeenCalled();
  });

  it("does not reveal missing or already handled reports", async () => {
    mockReportUpdateMany.mockResolvedValue({ count: 0 });

    expect((await PATCH(request("dismissed"), params)).status).toBe(404);
  });
});
