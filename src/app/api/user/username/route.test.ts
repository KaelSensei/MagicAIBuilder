import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

const { mockFindFirst, mockUpdate, mockRequireAuth } = vi.hoisted(() => ({
  mockFindFirst: vi.fn(),
  mockUpdate: vi.fn(),
  mockRequireAuth: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: { user: { findFirst: mockFindFirst, update: mockUpdate } },
}));
vi.mock("@/lib/auth/helpers", () => ({ requireAuth: mockRequireAuth }));

import { PATCH } from "./route";
import { logger } from "@/lib/logger";

function authed() {
  mockRequireAuth.mockResolvedValueOnce({ session: { user: { id: "user-1" } } });
}

function patch(body: string): Request {
  return new Request("http://localhost/api/user/username", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body,
  });
}

describe("PATCH /api/user/username", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("stores the username in lowercase", async () => {
    authed();
    mockFindFirst.mockResolvedValueOnce(null);
    mockUpdate.mockResolvedValueOnce({ id: "user-1", username: "kael" });

    const response = await PATCH(patch(JSON.stringify({ username: "Kael" })));

    expect(response.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ data: { username: "kael" } }));
  });

  it.each([
    ["a claimed username", () => { authed(); mockFindFirst.mockResolvedValueOnce(null); mockUpdate.mockResolvedValueOnce({ id: "user-1", username: "kael" }); }, JSON.stringify({ username: "kael" }), 200],
    ["an invalid username", () => { authed(); }, JSON.stringify({ username: "a!" }), 400],
    ["a taken username", () => { authed(); mockFindFirst.mockResolvedValueOnce({ id: "user-2" }); }, JSON.stringify({ username: "taken" }), 409],
    ["a signed-out visitor", () => { mockRequireAuth.mockResolvedValueOnce({ error: new Response(null, { status: 401 }) }); }, JSON.stringify({ username: "kael" }), 401],
    ["a database failure", () => { authed(); mockFindFirst.mockRejectedValueOnce(new Error("db down")); }, JSON.stringify({ username: "kael" }), 500],
  ])("logs status and duration once for %s", async (_label, arrange, body, expected) => {
    const info = vi.spyOn(logger, "info").mockImplementation(() => undefined);
    vi.spyOn(logger, "error").mockImplementation(() => undefined);
    arrange();

    const response = await PATCH(patch(body));

    expect(response.status).toBe(expected);
    const calls = info.mock.calls.filter(([message]) => message === "Username update completed");
    expect(calls).toEqual([
      ["Username update completed", "PATCH /api/user/username", { status: expected, durationMs: expect.any(Number) }],
    ]);
  });
});
