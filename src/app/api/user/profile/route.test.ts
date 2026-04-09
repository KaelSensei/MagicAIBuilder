import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock Prisma ──────────────────────────────────────────────────────────────

const { mockUserFindUnique, mockUserUpsert, mockUserUpdate, mockUserDelete } = vi.hoisted(() => ({
  mockUserFindUnique: vi.fn(),
  mockUserUpsert: vi.fn(),
  mockUserUpdate: vi.fn(),
  mockUserDelete: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: {
      findUnique: mockUserFindUnique,
      upsert: mockUserUpsert,
      update: mockUserUpdate,
      delete: mockUserDelete,
    },
  },
}));

// ─── Mock NextAuth auth() ─────────────────────────────────────────────────────

const { mockAuth } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
}));

vi.mock("@/lib/auth/config", () => ({
  auth: mockAuth,
}));

// ─── Import after mocks ──────────────────────────────────────────────────────

import { GET, PATCH, DELETE } from "./route";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const USER_FIXTURE = {
  id: "user-1",
  name: "Kael",
  email: "kael@test.com",
  image: null,
  createdAt: new Date("2026-01-01"),
};

function authed() {
  mockAuth.mockResolvedValueOnce({
    user: { id: "user-1", name: "Kael", email: "kael@test.com" },
  });
}

function unauthed() {
  mockAuth.mockResolvedValueOnce(null);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("GET /api/user/profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the current user's profile", async () => {
    authed();
    mockUserFindUnique.mockResolvedValueOnce(USER_FIXTURE);

    const res = await GET();

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe("user-1");
    expect(body.name).toBe("Kael");
    expect(body.email).toBe("kael@test.com");
  });

  it("returns 401 when not authenticated", async () => {
    unauthed();

    const res = await GET();

    expect(res.status).toBe(401);
    expect(mockUserFindUnique).not.toHaveBeenCalled();
  });

  it("returns 404 when user not found in DB", async () => {
    authed();
    mockUserFindUnique.mockResolvedValueOnce(null);

    const res = await GET();

    expect(res.status).toBe(404);
  });
});

describe("PATCH /api/user/profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates user name", async () => {
    authed();

    mockUserUpdate.mockResolvedValueOnce({ ...USER_FIXTURE, name: "New Name" });

    const res = await PATCH(
      new Request("http://localhost:3000/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "New Name" }),
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe("New Name");
  });

  it("updates user image to a URL", async () => {
    authed();

    mockUserUpdate.mockResolvedValueOnce({
      ...USER_FIXTURE,
      image: "https://example.com/avatar.jpg",
    });

    const res = await PATCH(
      new Request("http://localhost:3000/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: "https://example.com/avatar.jpg" }),
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.image).toBe("https://example.com/avatar.jpg");
  });

  it("clears user image with null", async () => {
    authed();

    mockUserUpdate.mockResolvedValueOnce({ ...USER_FIXTURE, image: null });

    const res = await PATCH(
      new Request("http://localhost:3000/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: null }),
      })
    );

    expect(res.status).toBe(200);
  });

  it("returns 400 for empty name", async () => {
    authed();


    const res = await PATCH(
      new Request("http://localhost:3000/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "" }),
      })
    );

    expect(res.status).toBe(400);
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });

  it("returns 400 for image that is not a valid URL", async () => {
    authed();


    const res = await PATCH(
      new Request("http://localhost:3000/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: "not-a-url" }),
      })
    );

    expect(res.status).toBe(400);
  });

  it("returns 401 when not authenticated", async () => {
    unauthed();

    const res = await PATCH(
      new Request("http://localhost:3000/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "New" }),
      })
    );

    expect(res.status).toBe(401);
  });
});

describe("DELETE /api/user/profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes the current user's account", async () => {
    authed();

    mockUserDelete.mockResolvedValueOnce({ id: "user-1" });

    const res = await DELETE();

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(mockUserDelete).toHaveBeenCalledWith({
      where: { id: "user-1" },
    });
  });

  it("returns 401 when not authenticated", async () => {
    unauthed();

    const res = await DELETE();

    expect(res.status).toBe(401);
    expect(mockUserDelete).not.toHaveBeenCalled();
  });

  it("returns 500 when Prisma throws", async () => {
    authed();

    mockUserDelete.mockRejectedValueOnce(new Error("DB error"));

    const res = await DELETE();

    expect(res.status).toBe(500);
  });
});
