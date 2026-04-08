import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockUserFindUnique, mockUserUpdate } = vi.hoisted(() => ({
  mockUserFindUnique: vi.fn(),
  mockUserUpdate: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: {
      findUnique: mockUserFindUnique,
      update: mockUserUpdate,
    },
  },
}));

const { mockAuth } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
}));

vi.mock("@/lib/auth/config", () => ({
  auth: mockAuth,
}));

import { DELETE, GET, POST } from "./route";

function authed() {
  mockAuth.mockResolvedValueOnce({
    user: { id: "user-1", name: "Kael", email: "kael@test.com" },
  });
}

function mockResolvedSessionUser() {
  mockUserFindUnique.mockResolvedValueOnce({
    id: "user-1",
    name: "Kael",
    email: "kael@test.com",
    image: null,
  });
}

function unauthed() {
  mockAuth.mockResolvedValueOnce(null);
}

describe("GET /api/user/onboarding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the current onboarding status", async () => {
    authed();
    mockResolvedSessionUser();
    mockUserFindUnique.mockResolvedValueOnce({ onboardingDone: true });

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ onboardingDone: true });
  });

  it("returns 401 when not authenticated", async () => {
    unauthed();

    const response = await GET();

    expect(response.status).toBe(401);
    expect(mockUserFindUnique).not.toHaveBeenCalled();
  });
});

describe("POST /api/user/onboarding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("marks onboarding as done", async () => {
    authed();
    mockResolvedSessionUser();
    mockUserUpdate.mockResolvedValueOnce({ onboardingDone: true });

    const response = await POST();

    expect(response.status).toBe(200);
    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { onboardingDone: true },
    });
  });
});

describe("DELETE /api/user/onboarding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("resets onboarding", async () => {
    authed();
    mockResolvedSessionUser();
    mockUserUpdate.mockResolvedValueOnce({ onboardingDone: false });

    const response = await DELETE();

    expect(response.status).toBe(200);
    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { onboardingDone: false },
    });
  });
});
