import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockRequireAuth, mockUpdateMany, mockLogError } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockUpdateMany: vi.fn(),
  mockLogError: vi.fn(),
}));

vi.mock("@/lib/auth/helpers", () => ({ requireAuth: mockRequireAuth }));
vi.mock("@/lib/db/prisma", () => ({ prisma: { apiKey: { updateMany: mockUpdateMany } } }));
vi.mock("@/lib/logger", () => ({ logger: { error: mockLogError } }));

import { DELETE } from "./route";

function params(id = "key-1") {
  return { params: Promise.resolve({ id }) };
}

const request = new Request("http://localhost/api/user/api-keys/key-1", {
  method: "DELETE",
});

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAuth.mockResolvedValue({ session: { user: { id: "user-1" } } });
  mockUpdateMany.mockResolvedValue({ count: 1 });
});

describe("DELETE /api/user/api-keys/:id", () => {
  it("stamps revokedAt instead of deleting the row", async () => {
    const res = await DELETE(request, params());
    expect(res.status).toBe(200);
    expect(mockUpdateMany.mock.calls[0][0].data.revokedAt).toBeInstanceOf(Date);
  });

  it("scopes the write to the owner in the same statement as the id", async () => {
    await DELETE(request, params());
    // Ownership checked in the WHERE, not fetched and compared: a read-then-write
    // leaves a window, and matching on the id alone would let anyone revoke
    // anyone's key.
    expect(mockUpdateMany.mock.calls[0][0].where).toEqual({
      id: "key-1",
      userId: "user-1",
      revokedAt: null,
    });
  });

  it("answers 404 when nothing matched, whatever the reason", async () => {
    mockUpdateMany.mockResolvedValue({ count: 0 });
    const res = await DELETE(request, params("someone-elses-key"));
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: "API key not found" });
  });

  it("requires a session", async () => {
    const forbidden = new Response(null, { status: 401 });
    mockRequireAuth.mockResolvedValue({ error: forbidden });
    await DELETE(request, params());
    expect(mockUpdateMany).not.toHaveBeenCalled();
  });

  it("returns 500 without leaking the database error", async () => {
    mockUpdateMany.mockRejectedValue(new Error("deadlock detected"));
    const res = await DELETE(request, params());
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "Could not revoke the API key" });
    expect(mockLogError).toHaveBeenCalled();
  });
});
