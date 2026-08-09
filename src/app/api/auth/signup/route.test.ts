import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock Prisma ──────────────────────────────────────────────────────────────

const { mockUserFindUnique, mockUserCreate } = vi.hoisted(() => ({
  mockUserFindUnique: vi.fn(),
  mockUserCreate: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: {
      findUnique: mockUserFindUnique,
      create: mockUserCreate,
    },
  },
}));

// ─── Mock bcryptjs ────────────────────────────────────────────────────────────

const { mockHash } = vi.hoisted(() => ({
  mockHash: vi.fn(),
}));

vi.mock("bcryptjs", () => ({
  hash: mockHash,
}));

// ─── Import after mocks ──────────────────────────────────────────────────────

import { POST } from "./route";

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Each request gets a unique IP so the shared in-memory rate limiter
// never trips across unrelated tests.
let ipCounter = 0;
function makeRequest(body: Record<string, unknown>, ip?: string): Request {
  ipCounter += 1;
  return new Request("http://localhost:3000/api/auth/signup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-real-ip": ip ?? `10.0.0.${ipCounter}`,
    },
    body: JSON.stringify(body),
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/auth/signup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHash.mockResolvedValue("hashed-password-123");
  });

  it("creates a new user and returns 201", async () => {
    mockUserFindUnique.mockResolvedValueOnce(null);
    mockUserCreate.mockResolvedValueOnce({
      id: "user-new",
      name: "Test User",
      email: "test@example.com",
    });

    const res = await POST(
      makeRequest({ name: "Test User", email: "test@example.com", password: "securepass" })
    );

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBe("user-new");
    expect(body.name).toBe("Test User");
    expect(body.email).toBe("test@example.com");
    // Should NOT return password
    expect(body).not.toHaveProperty("password");
  });

  it("lowercases the email before saving", async () => {
    mockUserFindUnique.mockResolvedValueOnce(null);
    mockUserCreate.mockResolvedValueOnce({
      id: "user-new",
      name: "Test",
      email: "test@example.com",
    });

    await POST(
      makeRequest({ name: "Test", email: "Test@Example.COM", password: "securepass" })
    );

    expect(mockUserFindUnique).toHaveBeenCalledWith({
      where: { email: "test@example.com" },
    });
    expect(mockUserCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ email: "test@example.com" }),
    });
  });

  it("hashes the password with bcrypt cost 12", async () => {
    mockUserFindUnique.mockResolvedValueOnce(null);
    mockUserCreate.mockResolvedValueOnce({
      id: "u1",
      name: "T",
      email: "t@t.com",
    });

    await POST(makeRequest({ name: "T", email: "t@t.com", password: "mypassword" }));

    expect(mockHash).toHaveBeenCalledWith("mypassword", 12);
  });

  it("returns 409 when email already exists", async () => {
    mockUserFindUnique.mockResolvedValueOnce({
      id: "existing-user",
      email: "taken@example.com",
    });

    const res = await POST(
      makeRequest({ name: "New", email: "taken@example.com", password: "securepass" })
    );

    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toContain("already exists");
    expect(mockUserCreate).not.toHaveBeenCalled();
  });

  it("returns 400 for missing name", async () => {
    const res = await POST(
      makeRequest({ email: "test@example.com", password: "securepass" })
    );

    expect(res.status).toBe(400);
    expect(mockUserFindUnique).not.toHaveBeenCalled();
  });

  it("returns 400 for missing email", async () => {
    const res = await POST(
      makeRequest({ name: "Test", password: "securepass" })
    );

    expect(res.status).toBe(400);
  });

  it("returns 400 for missing password", async () => {
    const res = await POST(
      makeRequest({ name: "Test", email: "test@example.com" })
    );

    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid email format", async () => {
    const res = await POST(
      makeRequest({ name: "Test", email: "not-an-email", password: "securepass" })
    );

    expect(res.status).toBe(400);
  });

  it("returns 400 for password shorter than 8 characters", async () => {
    const res = await POST(
      makeRequest({ name: "Test", email: "test@example.com", password: "short" })
    );

    expect(res.status).toBe(400);
  });

  it("returns 400 for name exceeding 100 characters", async () => {
    const res = await POST(
      makeRequest({
        name: "a".repeat(101),
        email: "test@example.com",
        password: "securepass",
      })
    );

    expect(res.status).toBe(400);
  });

  it("returns 500 when Prisma throws an unexpected error", async () => {
    mockUserFindUnique.mockRejectedValueOnce(new Error("DB connection lost"));

    const res = await POST(
      makeRequest({ name: "Test", email: "test@example.com", password: "securepass" })
    );

    expect(res.status).toBe(500);
  });

  it("returns 429 after too many attempts from the same IP", async () => {
    mockUserFindUnique.mockResolvedValue(null);
    mockUserCreate.mockResolvedValue({
      id: "user-rl",
      name: "Test",
      email: "rl@example.com",
    });

    const body = { name: "Test", email: "rl@example.com", password: "securepass" };
    let last: Response = new Response(null);
    for (let i = 0; i < 6; i += 1) {
      last = await POST(makeRequest(body, "10.99.99.99"));
    }

    expect(last.status).toBe(429);
    expect(last.headers.get("Retry-After")).not.toBeNull();
  });
});
