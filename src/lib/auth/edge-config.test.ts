import { describe, it, expect, vi, beforeEach } from "vitest";

// Set env vars before import
vi.stubEnv("GOOGLE_CLIENT_ID", "test-google-id");
vi.stubEnv("GOOGLE_CLIENT_SECRET", "test-google-secret");

import { edgeAuthConfig } from "./edge-config";

describe("edgeAuthConfig", () => {
  it("has JWT session strategy", () => {
    expect(edgeAuthConfig.session).toEqual({ strategy: "jwt" });
  });

  it("has correct sign-in pages", () => {
    expect(edgeAuthConfig.pages?.signIn).toBe("/auth/signin");
    expect(edgeAuthConfig.pages?.error).toBe("/auth/signin");
  });

  it("has Google provider configured", () => {
    expect(edgeAuthConfig.providers).toHaveLength(1);
  });
});

describe("edgeAuthConfig.callbacks.jwt", () => {
  const jwtCallback = edgeAuthConfig.callbacks.jwt;

  it("sets token.id when user is provided", async () => {
    const token = { sub: "abc" };
    const user = { id: "user-123", email: "test@test.com" };
    const result = await jwtCallback({ token, user } as Parameters<typeof jwtCallback>[0]);
    expect(result.id).toBe("user-123");
  });

  it("returns token unchanged when user is undefined", async () => {
    const token = { sub: "abc", id: "existing-id" };
    const result = await jwtCallback({ token, user: undefined } as unknown as Parameters<typeof jwtCallback>[0]);
    expect(result.id).toBe("existing-id");
  });
});

describe("edgeAuthConfig.callbacks.session", () => {
  const sessionCallback = edgeAuthConfig.callbacks.session;

  it("sets session.user.id from token.id", async () => {
    const session = { user: { id: "", name: "Test", email: "test@test.com" }, expires: "" };
    const token = { id: "user-123", sub: "abc" };
    const result = await sessionCallback({ session, token } as Parameters<typeof sessionCallback>[0]);
    expect(result.user.id).toBe("user-123");
  });

  it("does not set session.user.id when token has no id", async () => {
    const session = { user: { id: "", name: "Test", email: "test@test.com" }, expires: "" };
    const token = { sub: "abc" };
    const result = await sessionCallback({ session, token } as Parameters<typeof sessionCallback>[0]);
    expect(result.user.id).toBe("");
  });
});

describe("edgeAuthConfig.callbacks.authorized", () => {
  const authorizedCallback = edgeAuthConfig.callbacks.authorized;

  function makeArgs(pathname: string, isLoggedIn: boolean) {
    return {
      auth: isLoggedIn ? { user: { id: "user-1" } } : null,
      request: { nextUrl: new URL(`http://localhost:3000${pathname}`) },
    } as Parameters<typeof authorizedCallback>[0];
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows /auth/signin for unauthenticated users", () => {
    expect(authorizedCallback(makeArgs("/auth/signin", false))).toBe(true);
  });

  it("allows /auth/signup for unauthenticated users", () => {
    expect(authorizedCallback(makeArgs("/auth/signup", false))).toBe(true);
  });

  it("allows /api/auth paths", () => {
    expect(authorizedCallback(makeArgs("/api/auth/callback/google", false))).toBe(true);
  });

  it("allows /api/health", () => {
    expect(authorizedCallback(makeArgs("/api/health", false))).toBe(true);
  });

  it("allows /api/share paths", () => {
    expect(authorizedCallback(makeArgs("/api/share/abc123", false))).toBe(true);
  });

  it("allows /share paths", () => {
    expect(authorizedCallback(makeArgs("/share/abc123", false))).toBe(true);
  });

  it("allows /_next static assets", () => {
    expect(authorizedCallback(makeArgs("/_next/static/chunk.js", false))).toBe(true);
  });

  it("allows /favicon paths", () => {
    expect(authorizedCallback(makeArgs("/favicon.ico", false))).toBe(true);
  });

  it("allows files with extensions (static assets)", () => {
    expect(authorizedCallback(makeArgs("/logo.png", false))).toBe(true);
  });

  it("returns 401 Response for unauthenticated API requests", () => {
    const result = authorizedCallback(makeArgs("/api/decks", false));
    expect(result).toBeInstanceOf(Response);
  });

  it("returns false for unauthenticated page requests (triggers redirect)", () => {
    expect(authorizedCallback(makeArgs("/builder/deck-1", false))).toBe(false);
  });

  it("allows authenticated users on protected pages", () => {
    expect(authorizedCallback(makeArgs("/builder/deck-1", true))).toBe(true);
  });

  it("allows authenticated users on protected API routes", () => {
    expect(authorizedCallback(makeArgs("/api/decks", true))).toBe(true);
  });
});
