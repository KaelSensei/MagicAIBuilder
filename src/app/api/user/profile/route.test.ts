import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ─── Mock Prisma ──────────────────────────────────────────────────────────────

const { mockUserFindUnique, mockUserUpsert, mockUserUpdate, mockUserDelete } = vi.hoisted(() => ({
  mockUserFindUnique: vi.fn(),
  mockUserUpsert: vi.fn(),
  mockUserUpdate: vi.fn(),
  mockUserDelete: vi.fn(),
}));

vi.mock(import("@/lib/db/prisma"), async (importOriginal) => {
  const { stubPrisma } = await import("@/test/prisma-stub");
  return stubPrisma(await importOriginal(), {
    user: {
      findUnique: mockUserFindUnique,
      upsert: mockUserUpsert,
      update: mockUserUpdate,
      delete: mockUserDelete,
    },
  });
});

// ─── Mock NextAuth auth() ─────────────────────────────────────────────────────

const { mockAuth } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
}));

vi.mock(import("@/lib/auth/config"), () => ({
  auth: mockAuth,
}));

// ─── Import after mocks ──────────────────────────────────────────────────────

import { GET, PATCH, DELETE } from "./route";
import { logger } from "@/lib/logger";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const USER_FIXTURE = {
  id: "user-1",
  name: "Kael",
  email: "kael@test.com",
  image: null,
  createdAt: new Date("2026-01-01"),
  onboardingDone: true,
};

function authed() {
  mockAuth.mockResolvedValueOnce({
    user: { id: "user-1", name: "Kael", email: "kael@test.com" },
  });
  mockUserFindUnique.mockResolvedValueOnce(USER_FIXTURE);
}

function unauthed() {
  mockAuth.mockResolvedValueOnce(null);
}

/** A DELETE from a browser holding these cookies (`name=value; …`). */
function deleteRequest(cookie?: string): NextRequest {
  return new NextRequest("http://localhost:3000/api/user/profile", {
    method: "DELETE",
    headers: cookie ? { cookie } : {},
  });
}

interface SetCookie {
  readonly value: string;
  /** Lower-cased attributes, such as `max-age=0`, `path=/` or `secure`. */
  readonly attributes: readonly string[];
}

/** What each `Set-Cookie` line of a response tells the browser, by cookie name. */
function setCookies(response: Response): ReadonlyMap<string, SetCookie> {
  const cookies = new Map<string, SetCookie>();
  for (const line of response.headers.getSetCookie()) {
    const [pair = "", ...attributes] = line.split(";").map((part) => part.trim());
    const separator = pair.indexOf("=");
    cookies.set(pair.slice(0, separator), {
      value: pair.slice(separator + 1),
      attributes: attributes.map((attribute) => attribute.toLowerCase()),
    });
  }
  return cookies;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("GET /api/user/profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the current user's profile", async () => {
    authed();

    const res = await GET();

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe("user-1");
    expect(body.name).toBe("Kael");
    expect(body.email).toBe("kael@test.com");
    expect(body.createdAt).toBe("2026-01-01T00:00:00.000Z");
    expect(body.onboardingDone).toBe(true);
    expect(mockUserFindUnique).toHaveBeenCalledTimes(1);
  });

  it("records profile response latency without user details", async () => {
    const info = vi.spyOn(logger, "info").mockImplementation(() => undefined);
    try {
      authed();
      expect((await GET()).status).toBe(200);
      expect(info).toHaveBeenCalledWith(
        "Profile request completed",
        "GET /api/user/profile",
        expect.objectContaining({ status: 200, durationMs: expect.any(Number) })
      );
      expect(JSON.stringify(info.mock.calls)).not.toContain(USER_FIXTURE.email);
    } finally {
      info.mockRestore();
    }
  });

  it("records rejected profile requests without user details", async () => {
    const info = vi.spyOn(logger, "info").mockImplementation(() => undefined);
    try {
      unauthed();
      expect((await GET()).status).toBe(401);
      expect(info).toHaveBeenCalledWith(
        "Profile request completed",
        "GET /api/user/profile",
        expect.objectContaining({ status: 401, durationMs: expect.any(Number) })
      );
    } finally {
      info.mockRestore();
    }
  });

  it("records a failed profile request with its response status", async () => {
    const info = vi.spyOn(logger, "info").mockImplementation(() => undefined);
    const error = vi.spyOn(logger, "error").mockImplementation(() => undefined);
    try {
      mockAuth.mockRejectedValueOnce(new Error("auth unavailable"));
      const response = await GET();
      expect(response.status).toBe(500);
      expect(info).toHaveBeenCalledWith(
        "Profile request completed",
        "GET /api/user/profile",
        expect.objectContaining({ status: 500, durationMs: expect.any(Number) })
      );
    } finally {
      info.mockRestore();
      error.mockRestore();
    }
  });

  it("returns 401 when not authenticated", async () => {
    unauthed();

    const res = await GET();

    expect(res.status).toBe(401);
    expect(mockUserFindUnique).not.toHaveBeenCalled();
  });

  it("returns 401 when the session user no longer exists", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "deleted-user", email: "kael@test.com" },
    });
    mockUserFindUnique.mockResolvedValueOnce(null);

    const res = await GET();

    expect(res.status).toBe(401);
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

  it("records profile update latency without profile details", async () => {
    const info = vi.spyOn(logger, "info").mockImplementation(() => undefined);
    try {
      authed();
      mockUserUpdate.mockResolvedValueOnce({ ...USER_FIXTURE, name: "New Name" });

      const response = await PATCH(
        new Request("http://localhost:3000/api/user/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "New Name" }),
        })
      );

      expect(response.status).toBe(200);
      expect(info).toHaveBeenCalledWith(
        "Profile request completed",
        "PATCH /api/user/profile",
        expect.objectContaining({ status: 200, durationMs: expect.any(Number) })
      );
      expect(JSON.stringify(info.mock.calls)).not.toContain(USER_FIXTURE.email);
    } finally {
      info.mockRestore();
    }
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

    const res = await DELETE(deleteRequest());

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(mockUserDelete).toHaveBeenCalledWith({
      where: { id: "user-1" },
    });
  });

  it("signs the browser out over HTTPS by expiring its secure session cookie", async () => {
    authed();
    mockUserDelete.mockResolvedValueOnce({ id: "user-1" });

    const res = await DELETE(deleteRequest("__Secure-authjs.session-token=jwt"));

    expect(res.status).toBe(200);
    expect(setCookies(res).get("__Secure-authjs.session-token")).toEqual({
      value: "",
      attributes: expect.arrayContaining(["max-age=0", "path=/", "secure"]),
    });
  });

  it("signs the browser out over plain HTTP by expiring its session cookie without Secure", async () => {
    authed();
    mockUserDelete.mockResolvedValueOnce({ id: "user-1" });

    const res = await DELETE(deleteRequest("authjs.session-token=jwt"));

    const expiry = setCookies(res).get("authjs.session-token");
    expect(expiry).toEqual({
      value: "",
      attributes: expect.arrayContaining(["max-age=0", "path=/"]),
    });
    // A browser on plain HTTP ignores a Set-Cookie marked Secure.
    expect(expiry?.attributes).not.toContain("secure");
  });

  it("expires every chunk of a session cookie Auth.js had to split", async () => {
    authed();
    mockUserDelete.mockResolvedValueOnce({ id: "user-1" });

    const res = await DELETE(
      deleteRequest("__Secure-authjs.session-token.0=jwt-a; __Secure-authjs.session-token.1=jwt-b")
    );

    const cookies = setCookies(res);
    for (const chunk of ["__Secure-authjs.session-token.0", "__Secure-authjs.session-token.1"]) {
      expect(cookies.get(chunk)).toEqual({
        value: "",
        attributes: expect.arrayContaining(["max-age=0", "path=/", "secure"]),
      });
    }
  });

  it("records profile deletion latency without account details", async () => {
    const info = vi.spyOn(logger, "info").mockImplementation(() => undefined);
    try {
      authed();
      mockUserDelete.mockResolvedValueOnce({ id: "user-1" });

      const response = await DELETE(deleteRequest());

      expect(response.status).toBe(200);
      expect(info).toHaveBeenCalledWith(
        "Profile request completed",
        "DELETE /api/user/profile",
        expect.objectContaining({ status: 200, durationMs: expect.any(Number) })
      );
      expect(JSON.stringify(info.mock.calls)).not.toContain(USER_FIXTURE.email);
    } finally {
      info.mockRestore();
    }
  });

  it("returns 401 when not authenticated", async () => {
    unauthed();

    const res = await DELETE(deleteRequest());

    expect(res.status).toBe(401);
    expect(mockUserDelete).not.toHaveBeenCalled();
  });

  it("returns 500 when Prisma throws", async () => {
    authed();

    mockUserDelete.mockRejectedValueOnce(new Error("DB error"));

    const res = await DELETE(deleteRequest());

    expect(res.status).toBe(500);
  });

  it("keeps the session when the deletion fails, because the account still exists", async () => {
    authed();
    mockUserDelete.mockRejectedValueOnce(new Error("DB error"));

    const res = await DELETE(deleteRequest("__Secure-authjs.session-token=jwt"));

    expect(res.status).toBe(500);
    expect(res.headers.getSetCookie()).toEqual([]);
  });

  it("leaves the browser's other cookies alone when it signs it out", async () => {
    authed();
    mockUserDelete.mockResolvedValueOnce({ id: "user-1" });

    const res = await DELETE(
      deleteRequest(
        "NEXT_LOCALE=fr; authjs.csrf-token=csrf; authjs.callback-url=%2F; authjs.session-token=jwt"
      )
    );

    expect([...setCookies(res).keys()].sort()).toEqual([
      "__Secure-authjs.session-token",
      "authjs.session-token",
    ]);
  });
});
