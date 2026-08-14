import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock Prisma ──────────────────────────────────────────────────────────────

const { mockUserFindFirst, mockFollowUpsert, mockFollowDeleteMany, mockFollowCount } =
  vi.hoisted(() => ({
    mockUserFindFirst: vi.fn(),
    mockFollowUpsert: vi.fn(),
    mockFollowDeleteMany: vi.fn(),
    mockFollowCount: vi.fn(),
  }));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: { findFirst: mockUserFindFirst },
    userFollow: {
      upsert: mockFollowUpsert,
      deleteMany: mockFollowDeleteMany,
      count: mockFollowCount,
    },
  },
}));

// ─── Mock NextAuth auth() ─────────────────────────────────────────────────────

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));

vi.mock("@/lib/auth/config", () => ({ auth: mockAuth }));

// ─── Import after mocks ──────────────────────────────────────────────────────

import { POST, DELETE } from "./route";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function params(username = "kael") {
  return { params: Promise.resolve({ username }) };
}

function request() {
  return new Request("http://localhost/api/community/users/kael/follow", {
    method: "POST",
  });
}

function authedAs(userId: string) {
  mockAuth.mockResolvedValue({ user: { id: userId, email: `${userId}@test.com` } });
}

function unauthed() {
  mockAuth.mockResolvedValue(null);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockFollowCount.mockResolvedValue(1);
});

// ─── POST ─────────────────────────────────────────────────────────────────────

describe("POST /api/community/users/[username]/follow", () => {
  it("401s without a session", async () => {
    unauthed();

    expect((await POST(request(), params())).status).toBe(401);
    expect(mockFollowUpsert).not.toHaveBeenCalled();
  });

  it("creates a follow edge and returns the new follower count", async () => {
    authedAs("follower-1");
    mockUserFindFirst.mockResolvedValueOnce({ id: "target-1" });
    mockFollowUpsert.mockResolvedValueOnce({ id: "f-1" });
    mockFollowCount.mockResolvedValueOnce(7);

    const res = await POST(request(), params());
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json).toMatchObject({ following: true, followerCount: 7 });
    expect(mockFollowUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          followerId_followingId: { followerId: "follower-1", followingId: "target-1" },
        },
      })
    );
  });

  it("is idempotent when already following", async () => {
    authedAs("follower-1");
    mockUserFindFirst.mockResolvedValueOnce({ id: "target-1" });
    mockFollowUpsert.mockResolvedValueOnce({ id: "f-1" });

    expect((await POST(request(), params())).status).toBe(201);
  });

  it("resolves the target username case-insensitively", async () => {
    authedAs("follower-1");
    mockUserFindFirst.mockResolvedValueOnce({ id: "target-1" });
    mockFollowUpsert.mockResolvedValueOnce({ id: "f-1" });

    await POST(request(), params("Kael"));

    expect(mockUserFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { username: { equals: "Kael", mode: "insensitive" } },
      })
    );
  });

  it("400s on a self-follow", async () => {
    authedAs("target-1");
    mockUserFindFirst.mockResolvedValueOnce({ id: "target-1" });

    const res = await POST(request(), params());

    expect(res.status).toBe(400);
    expect(mockFollowUpsert).not.toHaveBeenCalled();
  });

  it("404s for an unknown username", async () => {
    authedAs("follower-1");
    mockUserFindFirst.mockResolvedValueOnce(null);

    expect((await POST(request(), params())).status).toBe(404);
  });

  it("400s on a malformed username", async () => {
    authedAs("follower-1");

    const res = await POST(request(), params("bad name!"));

    expect(res.status).toBe(400);
    expect(mockUserFindFirst).not.toHaveBeenCalled();
  });
});

// ─── DELETE ───────────────────────────────────────────────────────────────────

describe("DELETE /api/community/users/[username]/follow", () => {
  it("401s without a session", async () => {
    unauthed();

    expect((await DELETE(request(), params())).status).toBe(401);
    expect(mockFollowDeleteMany).not.toHaveBeenCalled();
  });

  it("removes the follow edge and returns the new count", async () => {
    authedAs("follower-1");
    mockUserFindFirst.mockResolvedValueOnce({ id: "target-1" });
    mockFollowDeleteMany.mockResolvedValueOnce({ count: 1 });
    mockFollowCount.mockResolvedValueOnce(3);

    const res = await DELETE(request(), params());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toMatchObject({ following: false, followerCount: 3 });
    expect(mockFollowDeleteMany).toHaveBeenCalledWith({
      where: { followerId: "follower-1", followingId: "target-1" },
    });
  });

  it("is idempotent when not currently following", async () => {
    authedAs("follower-1");
    mockUserFindFirst.mockResolvedValueOnce({ id: "target-1" });
    mockFollowDeleteMany.mockResolvedValueOnce({ count: 0 });

    expect((await DELETE(request(), params())).status).toBe(200);
  });

  it("404s for an unknown username", async () => {
    authedAs("follower-1");
    mockUserFindFirst.mockResolvedValueOnce(null);

    expect((await DELETE(request(), params())).status).toBe(404);
  });
});
